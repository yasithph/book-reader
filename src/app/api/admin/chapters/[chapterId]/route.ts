import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";

// Maximum content size (1MB)
const MAX_CONTENT_SIZE = 1024 * 1024;

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

    return NextResponse.json({ chapter });
  } catch (error) {
    console.error("Error in admin chapters GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    const wordCount = countWords(content);
    const readingTime = estimateReadingTime(wordCount);

    const supabase = createAdminClient();
    const { data: chapter, error } = await supabase
      .from("chapters")
      .update({
        chapter_number: chapterNum,
        title_en: title_en?.trim() || null,
        title_si: title_si?.trim() || null,
        content,
        word_count: wordCount,
        estimated_reading_time: readingTime,
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
