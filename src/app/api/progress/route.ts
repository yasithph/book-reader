import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";

// GET reading progress for a book
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");

  if (!bookId) {
    return NextResponse.json(
      { error: "Book ID is required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("reading_progress")
    .select("*")
    .eq("user_id", session.userId)
    .eq("book_id", bookId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }

  return NextResponse.json({ progress: data || null });
}

// POST/update reading progress
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    bookId,
    chapterId,
    scrollPosition,
    isChapterComplete,
    completedChapters,
  } = body;

  if (!bookId || !chapterId) {
    return NextResponse.json(
      { error: "Book ID and Chapter ID are required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Check if progress exists
  const { data: existing } = await supabase
    .from("reading_progress")
    .select("id, completed_chapters")
    .eq("user_id", session.userId)
    .eq("book_id", bookId)
    .single();

  // Merge completed chapters
  const existingCompleted = existing?.completed_chapters || [];
  const newCompleted = completedChapters || [];
  const mergedCompleted = [...new Set([...existingCompleted, ...newCompleted])].sort(
    (a, b) => a - b
  );

  if (existing) {
    // Update existing progress
    const { data, error } = await supabase
      .from("reading_progress")
      .update({
        chapter_id: chapterId,
        scroll_position: scrollPosition || 0,
        is_chapter_complete: isChapterComplete || false,
        completed_chapters: mergedCompleted,
        last_read_at: now,
        client_updated_at: now,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating progress:", error);
      return NextResponse.json(
        { error: "Failed to update progress" },
        { status: 500 }
      );
    }

    return NextResponse.json({ progress: data });
  } else {
    // Create new progress
    const { data, error } = await supabase
      .from("reading_progress")
      .insert({
        user_id: session.userId,
        book_id: bookId,
        chapter_id: chapterId,
        scroll_position: scrollPosition || 0,
        is_chapter_complete: isChapterComplete || false,
        completed_chapters: mergedCompleted,
        last_read_at: now,
        client_updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating progress:", error);
      return NextResponse.json(
        { error: "Failed to create progress" },
        { status: 500 }
      );
    }

    return NextResponse.json({ progress: data });
  }
}
