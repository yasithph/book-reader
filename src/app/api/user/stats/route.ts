import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Get reading progress with book total_chapters
    const { data: progress, error } = await supabase
      .from("reading_progress")
      .select("completed_chapters, books!inner(total_chapters)")
      .eq("user_id", session.userId);

    if (error) {
      console.error("Failed to fetch reading stats:", error);
      return NextResponse.json(
        { error: "Failed to fetch stats" },
        { status: 500 }
      );
    }

    let totalCompletedChapters = 0;
    let totalCompletedBooks = 0;

    for (const row of progress || []) {
      const completed = (row.completed_chapters as number[]) || [];
      const totalChapters = (row.books as any)?.total_chapters as number;

      totalCompletedChapters += completed.length;

      if (totalChapters > 0 && completed.length >= totalChapters) {
        totalCompletedBooks++;
      }
    }

    return NextResponse.json({
      stats: {
        totalCompletedChapters,
        totalCompletedBooks,
      },
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
