import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";

// POST toggle heart on a comment
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Check if already hearted
  const { data: existing } = await supabase
    .from("comment_likes")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", session.userId)
    .maybeSingle();

  let hearted: boolean;

  if (existing) {
    const { error } = await supabase.from("comment_likes").delete().eq("id", existing.id);
    if (error) {
      console.error("Error removing heart:", error);
      return NextResponse.json({ error: "Failed to unheart" }, { status: 500 });
    }
    hearted = false;
  } else {
    // Use upsert to handle race condition (concurrent double-tap)
    const { error } = await supabase.from("comment_likes").upsert(
      { comment_id: commentId, user_id: session.userId },
      { onConflict: "comment_id,user_id" }
    );
    if (error) {
      console.error("Error adding heart:", error);
      return NextResponse.json({ error: "Failed to heart" }, { status: 500 });
    }
    hearted = true;
  }

  // Return updated count
  const { count } = await supabase
    .from("comment_likes")
    .select("*", { count: "exact", head: true })
    .eq("comment_id", commentId);

  return NextResponse.json({
    hearts_count: count ?? 0,
    user_has_hearted: hearted,
  });
}
