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

    // Check if user is a top reader
    const { data: topReaderData } = await supabase
      .from("top_readers")
      .select("rank, engagement_score, badge_notified")
      .eq("user_id", session.userId)
      .maybeSingle();

    // Compute engagement score for all users (lightweight per-user queries)
    let engagementScore = topReaderData?.engagement_score;
    if (engagementScore == null) {
      const [comments, commentLikesGiven, chapterLikes, commentLikesReceived] = await Promise.all([
        supabase.from("chapter_comments").select("id", { count: "exact", head: true }).eq("user_id", session.userId).eq("is_deleted", false),
        supabase.from("comment_likes").select("id", { count: "exact", head: true }).eq("user_id", session.userId),
        supabase.from("chapter_likes").select("id", { count: "exact", head: true }).eq("user_id", session.userId),
        supabase.from("comment_likes").select("comment_id, chapter_comments!inner(user_id)", { count: "exact", head: true }).eq("chapter_comments.user_id", session.userId),
      ]);
      engagementScore =
        totalCompletedChapters * 10
        + (comments.count ?? 0) * 20
        + (commentLikesGiven.count ?? 0) * 3
        + (chapterLikes.count ?? 0) * 1
        + (commentLikesReceived.count ?? 0) * 5;
    }

    return NextResponse.json({
      stats: {
        totalCompletedChapters,
        totalCompletedBooks,
        isTopReader: !!topReaderData,
        topReaderRank: topReaderData?.rank ?? undefined,
        engagementScore,
        badgeNotified: topReaderData?.badge_notified ?? undefined,
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
