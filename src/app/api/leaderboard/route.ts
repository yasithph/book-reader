import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET - Public leaderboard (no auth required)
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: topReaders, error } = await supabase
      .from("top_readers")
      .select("user_id, engagement_score, rank, refreshed_at, users!top_readers_user_id_fkey(display_name, avatar_url)")
      .order("rank", { ascending: true });

    if (error) {
      console.error("Error fetching leaderboard:", error);
      return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
    }

    const formatted = (topReaders || []).map((tr: any) => ({
      user_id: tr.user_id,
      engagement_score: tr.engagement_score,
      rank: tr.rank,
      refreshed_at: tr.refreshed_at,
      display_name: tr.users?.display_name,
      avatar_url: tr.users?.avatar_url,
    }));

    return NextResponse.json({ leaderboard: formatted });
  } catch (error) {
    console.error("Error in leaderboard GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
