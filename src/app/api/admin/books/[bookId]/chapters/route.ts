import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, getCurrentUser } from "@/lib/auth";

// Maximum content size (1MB)
const MAX_CONTENT_SIZE = 1024 * 1024;
const MAX_URL_LENGTH = 2048;

// Validate chapter image URL is from our Supabase storage bucket
function isValidChapterImageUrl(url: string): boolean {
  if (url.length > MAX_URL_LENGTH) return false;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return false;
  return url.startsWith(`${supabaseUrl}/storage/v1/object/public/chapter-images/`);
}

// Helper to check admin using session-based auth
async function checkAdmin() {
  const session = await getSession();
  if (!session) return { error: "Unauthorized", status: 401 };

  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { error: "Forbidden", status: 403 };

  return { user };
}

// Count words in text (strips HTML tags first)
function countWords(text: string): number {
  if (!text) return 0;

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
  params: Promise<{ bookId: string }>;
}

// GET - Fetch chapters for a book
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await checkAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { bookId } = await params;
    const supabase = createAdminClient();

    const { data: chapters, error } = await supabase
      .from("chapters")
      .select("id, chapter_number, title_en, title_si, word_count, estimated_reading_time, draft_content, is_published, chapter_image_url")
      .eq("book_id", bookId)
      .order("chapter_number", { ascending: true });

    if (error) {
      console.error("Error fetching chapters:", error);
      return NextResponse.json({ error: "Failed to fetch chapters" }, { status: 500 });
    }

    // Add computed has_draft field
    const chaptersWithDraftStatus = (chapters || []).map(chapter => ({
      ...chapter,
      has_draft: chapter.draft_content !== null && chapter.draft_content !== "",
    }));

    return NextResponse.json({ chapters: chaptersWithDraftStatus });
  } catch (error) {
    console.error("Error in admin chapters GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new chapter for a book
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await checkAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { bookId } = await params;
    const body = await request.json();
    const {
      chapter_number,
      title_en,
      title_si,
      content_html,
      chapter_image_url,
    } = body;

    // Validate required fields
    if (chapter_number === undefined || chapter_number === null || !content_html) {
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
    if (content_html.length > MAX_CONTENT_SIZE) {
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

    // Validate chapter image URL
    if (chapter_image_url && !isValidChapterImageUrl(chapter_image_url)) {
      return NextResponse.json(
        { error: "Invalid chapter image URL" },
        { status: 400 }
      );
    }

    const wordCount = countWords(content_html);
    const readingTime = estimateReadingTime(wordCount);

    const supabase = createAdminClient();

    // Verify the book exists
    const { data: book } = await supabase
      .from("books")
      .select("id")
      .eq("id", bookId)
      .single();

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const { data: chapter, error } = await supabase
      .from("chapters")
      .insert({
        book_id: bookId,
        chapter_number: chapterNum,
        title_en: title_en?.trim() || null,
        title_si: title_si?.trim() || null,
        content: "",  // Empty until published
        draft_content: content_html,  // Store in draft
        chapter_image_url: chapter_image_url || null,
        is_published: false,
        word_count: wordCount,
        estimated_reading_time: readingTime,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating chapter:", error);
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Chapter number already exists for this book" },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "Failed to create chapter" }, { status: 500 });
    }

    return NextResponse.json({ chapter });
  } catch (error) {
    console.error("Error in admin chapters POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
