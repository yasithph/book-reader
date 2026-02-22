"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { CommentWithAuthor } from "@/types";

interface UseChapterSocialOptions {
  chapterId: string;
  isLoggedIn: boolean;
}

export function useChapterSocial({ chapterId, isLoggedIn }: UseChapterSocialOptions) {
  const [likesCount, setLikesCount] = useState(0);
  const [userHasLiked, setUserHasLiked] = useState(false);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const hasFetchedComments = useRef(false);

  // Fetch like status on mount
  useEffect(() => {
    fetch(`/api/chapters/${chapterId}/likes`)
      .then((res) => res.json())
      .then((data) => {
        setLikesCount(data.likes_count);
        setUserHasLiked(data.user_has_liked);
      })
      .catch(() => {});
  }, [chapterId]);

  // Fetch comment count on mount (lightweight — only need count)
  useEffect(() => {
    fetch(`/api/chapters/${chapterId}/comments`)
      .then((res) => res.json())
      .then((data) => {
        setCommentsCount(data.comments_count);
        // If comments section is already open, also store the comments
        if (isCommentsOpen) {
          setComments(data.comments);
          hasFetchedComments.current = true;
        }
      })
      .catch(() => {});
  }, [chapterId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch full comments lazily when section opens
  const fetchComments = useCallback(async () => {
    setIsLoadingComments(true);
    try {
      const res = await fetch(`/api/chapters/${chapterId}/comments`);
      const data = await res.json();
      setComments(data.comments);
      setCommentsCount(data.comments_count);
      hasFetchedComments.current = true;
    } catch {
      // silent
    } finally {
      setIsLoadingComments(false);
    }
  }, [chapterId]);

  // Load comments when section is first opened
  useEffect(() => {
    if (isCommentsOpen && !hasFetchedComments.current) {
      fetchComments();
    }
  }, [isCommentsOpen, fetchComments]);

  const toggleLike = useCallback(async () => {
    if (!isLoggedIn) return;

    // Capture pre-toggle state for safe revert
    const wasLiked = userHasLiked;

    // Optimistic update
    setUserHasLiked(!wasLiked);
    setLikesCount((prev) => prev + (wasLiked ? -1 : 1));

    try {
      const res = await fetch(`/api/chapters/${chapterId}/likes`, { method: "POST" });
      const data = await res.json();
      setLikesCount(data.likes_count);
      setUserHasLiked(data.user_has_liked);
    } catch {
      // Revert to pre-toggle state
      setUserHasLiked(wasLiked);
      setLikesCount((prev) => prev + (wasLiked ? 1 : -1));
    }
  }, [chapterId, isLoggedIn, userHasLiked]);

  const addComment = useCallback(
    async (content: string, parentId?: string) => {
      if (!isLoggedIn) return;

      const res = await fetch(`/api/chapters/${chapterId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parent_id: parentId }),
      });

      if (!res.ok) throw new Error("Failed to post comment");

      const { comment } = await res.json();

      if (parentId) {
        // Add reply to parent
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId ? { ...c, replies: [...c.replies, comment] } : c
          )
        );
      } else {
        setComments((prev) => [...prev, comment]);
      }
      setCommentsCount((prev) => prev + 1);

      return comment;
    },
    [chapterId, isLoggedIn]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      if (!isLoggedIn) return;

      const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete comment");

      // Update local state — mark as deleted
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            return { ...c, is_deleted: true, content: "" };
          }
          return {
            ...c,
            replies: c.replies.map((r) =>
              r.id === commentId ? { ...r, is_deleted: true, content: "" } : r
            ),
          };
        })
      );
      setCommentsCount((prev) => Math.max(0, prev - 1));
    },
    [isLoggedIn]
  );

  const toggleCommentHeart = useCallback(
    async (commentId: string) => {
      if (!isLoggedIn) return;

      // Helper to toggle heart on a comment
      const toggle = (c: CommentWithAuthor): CommentWithAuthor =>
        c.id === commentId
          ? {
              ...c,
              user_has_hearted: !c.user_has_hearted,
              hearts_count: c.hearts_count + (c.user_has_hearted ? -1 : 1),
            }
          : c;

      // Optimistic update
      setComments((prev) =>
        prev.map((c) => ({
          ...toggle(c),
          replies: c.replies.map(toggle),
        }))
      );

      try {
        const res = await fetch(`/api/comments/${commentId}/likes`, { method: "POST" });
        const data = await res.json();

        // Reconcile with server
        const reconcile = (c: CommentWithAuthor): CommentWithAuthor =>
          c.id === commentId
            ? { ...c, hearts_count: data.hearts_count, user_has_hearted: data.user_has_hearted }
            : c;

        setComments((prev) =>
          prev.map((c) => ({
            ...reconcile(c),
            replies: c.replies.map(reconcile),
          }))
        );
      } catch {
        // Revert on error
        const revert = (c: CommentWithAuthor): CommentWithAuthor =>
          c.id === commentId
            ? {
                ...c,
                user_has_hearted: !c.user_has_hearted,
                hearts_count: c.hearts_count + (c.user_has_hearted ? 1 : -1),
              }
            : c;

        setComments((prev) =>
          prev.map((c) => ({
            ...revert(c),
            replies: c.replies.map(revert),
          }))
        );
      }
    },
    [isLoggedIn]
  );

  return {
    likesCount,
    userHasLiked,
    toggleLike,
    comments,
    commentsCount,
    addComment,
    deleteComment,
    toggleCommentHeart,
    refreshComments: fetchComments,
    isCommentsOpen,
    setIsCommentsOpen,
    isLoadingComments,
  };
}
