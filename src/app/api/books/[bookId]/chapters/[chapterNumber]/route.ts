import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ bookId: string; chapterNumber: string }>;
}

// GET - Fetch a single chapter for offline download
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookId, chapterNumber } = await params;
    const chapterNum = parseInt(chapterNumber, 10);

    if (isNaN(chapterNum) || chapterNum < 1) {
      return NextResponse.json({ error: "Invalid chapter number" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch book to check access
    const { data: book } = await supabase
      .from("books")
      .select("id, free_preview_chapters, is_free")
      .eq("id", bookId)
      .eq("is_published", true)
      .single();

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Check if user has access to this chapter
    const isPreviewChapter = chapterNum <= book.free_preview_chapters;

    if (!book.is_free && !isPreviewChapter) {
      // Check purchase status
      const { data: purchase } = await supabase
        .from("purchases")
        .select("status")
        .eq("user_id", session.userId)
        .eq("book_id", bookId)
        .single();

      if (!purchase || purchase.status !== "approved") {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Fetch chapter
    const { data: chapter, error } = await supabase
      .from("chapters")
      .select("id, book_id, chapter_number, title_en, title_si, content, word_count, estimated_reading_time")
      .eq("book_id", bookId)
      .eq("chapter_number", chapterNum)
      .eq("is_published", true)
      .single();

    if (error || !chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // Rename to match offline schema expected by download manager
    const { estimated_reading_time, ...rest } = chapter;
    return NextResponse.json({ ...rest, reading_time_minutes: estimated_reading_time });
  } catch (error) {
    console.error("Error fetching chapter:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
