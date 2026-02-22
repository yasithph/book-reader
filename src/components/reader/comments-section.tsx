"use client";

import * as React from "react";
import type { CommentWithAuthor } from "@/types";
import { CommentCard } from "./comment-card";
import { CommentInput } from "./comment-input";

interface CommentsSectionProps {
  comments: CommentWithAuthor[];
  isLoggedIn: boolean;
  currentUserId?: string;
  isLoading: boolean;
  onAddComment: (content: string, parentId?: string) => Promise<CommentWithAuthor | undefined>;
  onDeleteComment: (commentId: string) => void;
  onHeartComment: (commentId: string) => void;
  themeColors: { text: string; secondary: string; bg: string };
}

export function CommentsSection({
  comments,
  isLoggedIn,
  currentUserId,
  isLoading,
  onAddComment,
  onDeleteComment,
  onHeartComment,
  themeColors,
}: CommentsSectionProps) {
  const handleAddComment = async (content: string) => {
    await onAddComment(content);
  };

  const handleReply = async (content: string, parentId: string) => {
    await onAddComment(content, parentId);
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      {/* Comment input (logged-in users only) */}
      {isLoggedIn && (
        <div className="mb-4">
          <CommentInput
            onSubmit={handleAddComment}
            themeColors={themeColors}
          />
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="py-6 text-center">
          <svg
            className="w-5 h-5 mx-auto animate-spin"
            style={{ color: themeColors.secondary }}
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {/* Comments list */}
      {!isLoading && comments.length === 0 && (
        <p className="text-xs text-center py-4" style={{ color: themeColors.secondary }}>
          No comments yet. Be the first to share your thoughts!
        </p>
      )}

      {!isLoading && comments.length > 0 && (
        <div className="space-y-1">
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              isLoggedIn={isLoggedIn}
              onHeart={onHeartComment}
              onReply={handleReply}
              onDelete={onDeleteComment}
              themeColors={themeColors}
            />
          ))}
        </div>
      )}

      {/* Login prompt for guests */}
      {!isLoggedIn && !isLoading && (
        <p className="text-xs text-center mt-3 py-2" style={{ color: themeColors.secondary }}>
          <a href="/auth" className="underline">Sign in</a> to join the conversation
        </p>
      )}
    </div>
  );
}
