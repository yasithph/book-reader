"use client";

import * as React from "react";
import type { CommentWithAuthor } from "@/types";
import { timeAgo } from "@/lib/utils/time-ago";
import { getAvatarUrl } from "@/lib/avatar";
import { LikeButton } from "./like-button";
import { CommentInput } from "./comment-input";

interface CommentCardProps {
  comment: CommentWithAuthor;
  currentUserId?: string;
  isLoggedIn: boolean;
  isReply?: boolean;
  onHeart: (commentId: string) => void;
  onReply: (content: string, parentId: string) => Promise<void>;
  onDelete: (commentId: string) => void;
  themeColors: { text: string; secondary: string; bg: string };
}

export function CommentCard({
  comment,
  currentUserId,
  isLoggedIn,
  isReply,
  onHeart,
  onReply,
  onDelete,
  themeColors,
}: CommentCardProps) {
  const [showReplyInput, setShowReplyInput] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const isOwner = currentUserId === comment.user_id;
  const avatarSrc = getAvatarUrl(comment.author.avatar_url, comment.user_id);

  const handleReply = async (content: string) => {
    await onReply(content, comment.id);
    setShowReplyInput(false);
  };

  if (comment.is_deleted) {
    const hasReplies = comment.replies?.length > 0;
    // No replies → hide completely. With replies → show tombstone for context.
    if (!hasReplies) return null;
    return (
      <div
        className={`${isReply ? "ml-10" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs italic py-2" style={{ color: themeColors.secondary }}>
          This comment has been removed
        </p>
        {comment.replies.map((reply) => (
          <CommentCard
            key={reply.id}
            comment={reply}
            currentUserId={currentUserId}
            isLoggedIn={isLoggedIn}
            isReply
            onHeart={onHeart}
            onReply={onReply}
            onDelete={onDelete}
            themeColors={themeColors}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`${isReply ? "ml-10" : ""}`} onClick={(e) => e.stopPropagation()}>
      <div className="flex gap-2.5 py-2.5">
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full shrink-0 overflow-hidden"
          style={{ backgroundColor: `${themeColors.text}12` }}
        >
          <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name + time */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: themeColors.text }}>
              {comment.author.display_name || "Reader"}
            </span>
            <span className="text-xs" style={{ color: themeColors.secondary }}>
              {timeAgo(comment.created_at)}
            </span>
          </div>

          {/* Comment text */}
          <p className="text-sm mt-0.5 whitespace-pre-wrap break-words" style={{ color: themeColors.text }}>
            {comment.content}
          </p>

          {/* Actions row */}
          <div className="flex items-center gap-3 mt-1.5">
            <LikeButton
              liked={comment.user_has_hearted}
              count={comment.hearts_count}
              onToggle={() => onHeart(comment.id)}
              disabled={!isLoggedIn}
              size="sm"
              themeColors={themeColors}
            />

            {/* Reply button (only on top-level comments) */}
            {!isReply && isLoggedIn && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowReplyInput((v) => !v); }}
                className="text-xs transition-opacity hover:opacity-70"
                style={{ color: themeColors.secondary }}
              >
                Reply
              </button>
            )}

            {/* Delete button */}
            {isOwner && (
              showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(comment.id); setShowDeleteConfirm(false); }}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                    className="text-xs"
                    style={{ color: themeColors.secondary }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                  className="text-xs transition-opacity hover:opacity-70"
                  style={{ color: themeColors.secondary }}
                >
                  Delete
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Reply input */}
      {showReplyInput && (
        <div className="ml-10 mt-1 mb-2">
          <CommentInput
            onSubmit={handleReply}
            placeholder="Write a reply..."
            themeColors={themeColors}
            autoFocus
            onCancel={() => setShowReplyInput(false)}
          />
        </div>
      )}

      {/* Replies */}
      {comment.replies?.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              isLoggedIn={isLoggedIn}
              isReply
              onHeart={onHeart}
              onReply={onReply}
              onDelete={onDelete}
              themeColors={themeColors}
            />
          ))}
        </div>
      )}
    </div>
  );
}
