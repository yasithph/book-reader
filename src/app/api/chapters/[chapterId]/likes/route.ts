import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";

// GET like count + whether current user has liked
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  const { chapterId } = await params;
  const session = await getSession();
  const supabase = createAdminClient();

  const { count } = await supabase
    .from("chapter_likes")
    .select("*", { count: "exact", head: true })
    .eq("chapter_id", chapterId);

  let userHasLiked = false;
  if (session) {
    const { data } = await supabase
      .from("chapter_likes")
      .select("id")
      .eq("chapter_id", chapterId)
      .eq("user_id", session.userId)
      .maybeSingle();
    userHasLiked = !!data;
  }

  return NextResponse.json({
    likes_count: count ?? 0,
    user_has_liked: userHasLiked,
  });
}

// POST toggle like
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  const { chapterId } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Check if already liked
  const { data: existing } = await supabase
    .from("chapter_likes")
    .select("id")
    .eq("chapter_id", chapterId)
    .eq("user_id", session.userId)
    .maybeSingle();

  let liked: boolean;

  if (existing) {
    // Unlike
    const { error } = await supabase.from("chapter_likes").delete().eq("id", existing.id);
    if (error) {
      console.error("Error removing like:", error);
      return NextResponse.json({ error: "Failed to unlike" }, { status: 500 });
    }
    liked = false;
  } else {
    // Like — use upsert to handle race condition (concurrent double-tap)
    const { error } = await supabase.from("chapter_likes").upsert(
      { chapter_id: chapterId, user_id: session.userId },
      { onConflict: "user_id,chapter_id" }
    );
    if (error) {
      console.error("Error adding like:", error);
      return NextResponse.json({ error: "Failed to like" }, { status: 500 });
    }
    liked = true;
  }

  // Return updated count
  const { count } = await supabase
    .from("chapter_likes")
    .select("*", { count: "exact", head: true })
    .eq("chapter_id", chapterId);

  return NextResponse.json({
    likes_count: count ?? 0,
    user_has_liked: liked,
  });
}
