import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";

// GET comments for a chapter (with authors, hearts, and replies)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  const { chapterId } = await params;
  const session = await getSession();
  const supabase = createAdminClient();

  // Fetch all comments for this chapter (top-level + replies)
  const { data: allComments, error } = await supabase
    .from("chapter_comments")
    .select("*, users!chapter_comments_user_id_fkey(display_name, avatar_url)")
    .eq("chapter_id", chapterId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }

  // Fetch all heart counts for these comments
  const commentIds = (allComments || []).map((c) => c.id);
  let heartCounts: Record<string, number> = {};
  let userHearts: Set<string> = new Set();

  if (commentIds.length > 0) {
    // Get heart counts per comment
    const { data: hearts } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .in("comment_id", commentIds);

    if (hearts) {
      for (const h of hearts) {
        heartCounts[h.comment_id] = (heartCounts[h.comment_id] || 0) + 1;
      }
    }

    // Get which comments the current user has hearted
    if (session) {
      const { data: userHeartData } = await supabase
        .from("comment_likes")
        .select("comment_id")
        .in("comment_id", commentIds)
        .eq("user_id", session.userId);

      if (userHeartData) {
        userHearts = new Set(userHeartData.map((h) => h.comment_id));
      }
    }
  }

  // Build comment tree: top-level comments with nested replies
  const commentMap = new Map<string, typeof allComments>();
  const topLevel: typeof allComments = [];

  for (const comment of allComments || []) {
    const formatted = {
      ...comment,
      author: comment.users || { display_name: null, avatar_url: null },
      hearts_count: heartCounts[comment.id] || 0,
      user_has_hearted: userHearts.has(comment.id),
      replies: [] as typeof allComments,
    };
    // Remove the raw join field
    delete (formatted as Record<string, unknown>).users;

    if (!comment.parent_id) {
      topLevel.push(formatted);
      commentMap.set(comment.id, formatted);
    } else {
      const parent = commentMap.get(comment.parent_id);
      if (parent) {
        (parent as unknown as { replies: unknown[] }).replies.push(formatted);
      }
    }
  }

  // Count only non-deleted comments
  const commentsCount = (allComments || []).filter((c) => !c.is_deleted).length;

  return NextResponse.json({
    comments: topLevel,
    comments_count: commentsCount,
  });
}

// POST create a comment or reply
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  const { chapterId } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { content, parent_id } = body;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  if (content.length > 2000) {
    return NextResponse.json({ error: "Content too long (max 2000 chars)" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // If replying, validate parent exists and is not itself a reply
  if (parent_id) {
    const { data: parent } = await supabase
      .from("chapter_comments")
      .select("id, parent_id, is_deleted")
      .eq("id", parent_id)
      .single();

    if (!parent) {
      return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
    }

    if (parent.is_deleted) {
      return NextResponse.json({ error: "Cannot reply to a deleted comment" }, { status: 400 });
    }

    if (parent.parent_id) {
      return NextResponse.json({ error: "Cannot reply to a reply" }, { status: 400 });
    }
  }

  const { data: comment, error } = await supabase
    .from("chapter_comments")
    .insert({
      chapter_id: chapterId,
      user_id: session.userId,
      parent_id: parent_id || null,
      content: content.trim(),
    })
    .select("*, users!chapter_comments_user_id_fkey(display_name, avatar_url)")
    .single();

  if (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }

  const formatted = {
    ...comment,
    author: comment.users || { display_name: null, avatar_url: null },
    hearts_count: 0,
    user_has_hearted: false,
    replies: [],
  };
  delete (formatted as Record<string, unknown>).users;

  return NextResponse.json({ comment: formatted }, { status: 201 });
}
