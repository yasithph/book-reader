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

export async function POST(request: NextRequest) {
  try {
    const auth = await checkAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const {
      book_id,
      chapter_number,
      title_en,
      title_si,
      content,
      chapter_image_url,
    } = body;

    // Validate required fields
    if (!book_id || chapter_number === undefined || chapter_number === null || !content) {
      return NextResponse.json(
        { error: "Book ID, chapter number, and content are required" },
        { status: 400 }
      );
    }

    // Validate book_id format
    if (!isValidUUID(book_id)) {
      return NextResponse.json({ error: "Invalid book ID" }, { status: 400 });
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

    // Validate chapter image URL
    if (chapter_image_url && !isValidChapterImageUrl(chapter_image_url)) {
      return NextResponse.json(
        { error: "Invalid chapter image URL" },
        { status: 400 }
      );
    }

    const wordCount = countWords(content);
    const readingTime = estimateReadingTime(wordCount);

    const supabase = createAdminClient();

    // Verify the book exists
    const { data: book } = await supabase
      .from("books")
      .select("id")
      .eq("id", book_id)
      .single();

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const { data: chapter, error } = await supabase
      .from("chapters")
      .insert({
        book_id,
        chapter_number: chapterNum,
        title_en: title_en?.trim() || null,
        title_si: title_si?.trim() || null,
        content,
        chapter_image_url: chapter_image_url || null,
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

    // Send push notifications to all users who purchased this book
    // Run in background to not delay the API response
    const { data: bookData } = await supabase
      .from("books")
      .select("title_en, title_si")
      .eq("id", book_id)
      .single();

    if (bookData) {
      sendChapterNotificationToBookPurchasers(book_id, {
        bookId: book_id,
        bookTitleEn: bookData.title_en,
        bookTitleSi: bookData.title_si,
        chapterNumber: chapterNum,
        chapterTitleEn: title_en?.trim() || undefined,
        chapterTitleSi: title_si?.trim() || undefined,
      }).catch((err) => {
        console.error("Failed to send push notifications:", err);
        // Don't fail the API call if notifications fail
      });
    }

    return NextResponse.json({ chapter });
  } catch (error) {
    console.error("Error in admin chapters POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
