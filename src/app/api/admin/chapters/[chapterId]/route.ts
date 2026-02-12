import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { sendChapterNotificationToBookPurchasers } from "@/lib/push-notifications";

// Maximum content size (1MB)
const MAX_CONTENT_SIZE = 1024 * 1024;
const MAX_URL_LENGTH = 2048;

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Validate chapter image URL is from our Supabase storage bucket
function isValidChapterImageUrl(url: string): boolean {
  if (url.length > MAX_URL_LENGTH) return false;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return false;
  return url.startsWith(`${supabaseUrl}/storage/v1/object/public/chapter-images/`);
}

// Helper to check admin (optimized - single DB call)
async function checkAdmin() {
  const session = await getSession();
  if (!session) return { error: "Unauthorized", status: 401 };

  const supabase = createAdminClient();
  const { data: user } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", session.userId)
    .single();

  if (!user) return { error: "Unauthorized", status: 401 };
  if (user.role !== "admin") return { error: "Forbidden", status: 403 };

  return { session, user };
}

// Validate UUID format
function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

// Count words in text (strips HTML tags first)
function countWords(text: string): number {
  if (!text) return 0;

  // Remove HTML tags and decode common entities
  const plainText = text
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!plainText) return 0;

  return plainText
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

// Estimate reading time (avg 200 words per minute for Sinhala)
function estimateReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200));
}

interface RouteParams {
  params: Promise<{ chapterId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await checkAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { chapterId } = await params;

    // Validate chapterId format
    if (!isValidUUID(chapterId)) {
      return NextResponse.json({ error: "Invalid chapter ID" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: chapter, error } = await supabase
      .from("chapters")
      .select("*")
      .eq("id", chapterId)
      .single();

    if (error || !chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // For editing: use draft_content if it exists, otherwise use published content
    const editableContent = chapter.draft_content || chapter.content;

    return NextResponse.json({
      chapter: {
        ...chapter,
        // Provide the editable content for the editor
        editable_content: editableContent,
        has_draft: chapter.draft_content !== null && chapter.draft_content !== "",
      }
    });
  } catch (error) {
    console.error("Error in admin chapters GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Save draft (auto-save, does not publish)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await checkAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { chapterId } = await params;

    // Validate chapterId format
    if (!isValidUUID(chapterId)) {
      return NextResponse.json({ error: "Invalid chapter ID" }, { status: 400 });
    }

    const body = await request.json();
    const {
      chapter_number,
      title_en,
      title_si,
      content,
      chapter_image_url,
    } = body;

    // Validate required fields
    if (chapter_number === undefined || chapter_number === null || !content) {
      return NextResponse.json(
        { error: "Chapter number and content are required" },
        { status: 400 }
      );
    }

    // Validate chapter_number is a positive integer
    const chapterNum = parseInt(chapter_number, 10);
    if (isNaN(chapterNum) || chapterNum < 1 || chapterNum > 9999) {
      return NextResponse.json(
        { error: "Chapter number must be a positive integer between 1 and 9999" },
        { status: 400 }
      );
    }

    // Validate content size
    if (content.length > MAX_CONTENT_SIZE) {
      return NextResponse.json(
        { error: "Content exceeds maximum size of 1MB" },
        { status: 400 }
      );
    }

    // Validate title lengths
    if (title_en && title_en.length > 500) {
      return NextResponse.json(
        { error: "English title exceeds maximum length of 500 characters" },
        { status: 400 }
      );
    }
    if (title_si && title_si.length > 500) {
      return NextResponse.json(
        { error: "Sinhala title exceeds maximum length of 500 characters" },
        { status: 400 }
      );
    }

    // Validate chapter image URL if provided
    if (chapter_image_url !== undefined && chapter_image_url !== null && chapter_image_url !== "") {
      if (!isValidChapterImageUrl(chapter_image_url)) {
        return NextResponse.json(
          { error: "Invalid chapter image URL" },
          { status: 400 }
        );
      }
    }

    const wordCount = countWords(content);
    const readingTime = estimateReadingTime(wordCount);

    const supabase = createAdminClient();

    // Resolve chapter_image_url: undefined = don't update, null/"" = clear, string = set
    const imageUrlUpdate: Record<string, string | null> = {};
    if (chapter_image_url !== undefined) {
      imageUrlUpdate.chapter_image_url = (typeof chapter_image_url === "string" && chapter_image_url.trim() !== "") ? chapter_image_url : null;
    }

    // Save to draft_content, not content (content stays as published version)
    // NOTE: word_count and estimated_reading_time are NOT updated here
    // because those should reflect the published content, not draft
    const { data: chapter, error } = await supabase
      .from("chapters")
      .update({
        chapter_number: chapterNum,
        title_en: title_en?.trim() || null,
        title_si: title_si?.trim() || null,
        draft_content: content,
        // Don't update word_count/reading_time - they should reflect published content
        ...imageUrlUpdate,
      })
      .eq("id", chapterId)
      .select()
      .single();

    if (error) {
      console.error("Error updating chapter:", error);
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Chapter number already exists for this book" },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "Failed to update chapter" }, { status: 500 });
    }

    return NextResponse.json({ chapter });
  } catch (error) {
    console.error("Error in admin chapters PUT:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Publish chapter (copy draft to content, make visible to readers)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await checkAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { chapterId } = await params;

    // Validate chapterId format
    if (!isValidUUID(chapterId)) {
      return NextResponse.json({ error: "Invalid chapter ID" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // First get the current chapter to access draft_content and current state
    const { data: currentChapter, error: fetchError } = await supabase
      .from("chapters")
      .select("draft_content, content, is_published, title_en, title_si, book_id, chapter_number")
      .eq("id", chapterId)
      .single();

    if (fetchError || !currentChapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // If no draft and already published, nothing to do - return success
    const hasDraft = currentChapter.draft_content &&
                     currentChapter.draft_content.trim() !== "" &&
                     currentChapter.draft_content !== "<p></p>";

    if (!hasDraft && currentChapter.is_published) {
      // Already published with no pending changes
      return NextResponse.json({
        chapter: currentChapter,
        message: "Chapter is already published with no pending changes"
      });
    }

    // Get content to publish: use draft if exists, otherwise use existing content
    const contentToPublish = hasDraft ? currentChapter.draft_content : currentChapter.content;

    if (!contentToPublish || contentToPublish.trim() === "" || contentToPublish === "<p></p>") {
      return NextResponse.json(
        { error: "Cannot publish empty chapter. Write some content first." },
        { status: 400 }
      );
    }

    const wordCount = countWords(contentToPublish);
    const readingTime = estimateReadingTime(wordCount);

    // Publish: copy draft_content to content, clear draft, set published
    const { data: chapter, error } = await supabase
      .from("chapters")
      .update({
        content: contentToPublish,
        draft_content: null,  // Clear draft after publishing
        is_published: true,
        word_count: wordCount,
        estimated_reading_time: readingTime,
      })
      .eq("id", chapterId)
      .select()
      .single();

    if (error) {
      console.error("Error publishing chapter:", error);
      return NextResponse.json({ error: "Failed to publish chapter" }, { status: 500 });
    }

    // Send push notifications if this is a newly published chapter (not previously published)
    // Or if there were significant changes (draft content exists)
    const shouldNotify = !currentChapter.is_published || hasDraft;

    if (shouldNotify) {
      // Get book details for notification
      const { data: bookData } = await supabase
        .from("books")
        .select("title_en, title_si")
        .eq("id", currentChapter.book_id)
        .single();

      if (bookData) {
        // Send notifications in background
        sendChapterNotificationToBookPurchasers(currentChapter.book_id, {
          bookId: currentChapter.book_id,
          bookTitleEn: bookData.title_en,
          bookTitleSi: bookData.title_si,
          chapterNumber: currentChapter.chapter_number,
          chapterTitleEn: currentChapter.title_en || undefined,
          chapterTitleSi: currentChapter.title_si || undefined,
          isUpdate: currentChapter.is_published,
        }).catch((err) => {
          console.error("Failed to send push notifications:", err);
          // Don't fail the API call if notifications fail
        });
      }
    }

    return NextResponse.json({ chapter, message: "Chapter published successfully" });
  } catch (error) {
    console.error("Error in admin chapters POST (publish):", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await checkAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { chapterId } = await params;

    // Validate chapterId format
    if (!isValidUUID(chapterId)) {
      return NextResponse.json({ error: "Invalid chapter ID" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("chapters")
      .delete()
      .eq("id", chapterId);

    if (error) {
      console.error("Error deleting chapter:", error);
      return NextResponse.json({ error: "Failed to delete chapter" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in admin chapters DELETE:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
