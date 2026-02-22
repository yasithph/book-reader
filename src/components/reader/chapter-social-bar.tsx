"use client";

import * as React from "react";
import type { ReaderTheme } from "@/types";
import { useChapterSocial } from "@/hooks";
import { LikeButton } from "./like-button";
import { CommentsSection } from "./comments-section";

interface ChapterSocialBarProps {
  chapterId: string;
  isLoggedIn: boolean;
  currentUserId?: string;
  theme: ReaderTheme;
}

const themeStyles = {
  light: { bg: "#FFFEF9", text: "#2C1810", secondary: "#666666", accent: "#722F37" },
  dark: { bg: "#000000", text: "#E8E8E8", secondary: "#888888", accent: "#C9A227" },
  sepia: { bg: "#f4ecd8", text: "#5c4b37", secondary: "#8b7355", accent: "#8b7355" },
};

export function ChapterSocialBar({ chapterId, isLoggedIn, currentUserId, theme }: ChapterSocialBarProps) {
  const colors = themeStyles[theme];

  const {
    likesCount,
    userHasLiked,
    toggleLike,
    comments,
    commentsCount,
    addComment,
    deleteComment,
    toggleCommentHeart,
    isCommentsOpen,
    setIsCommentsOpen,
    isLoadingComments,
  } = useChapterSocial({ chapterId, isLoggedIn });

  return (
    <div className="mt-8" onClick={(e) => e.stopPropagation()}>
      {/* Compact bar */}
      <div
        className="flex items-center justify-between py-3 px-1"
        style={{ borderTop: `1px solid ${colors.text}10`, borderBottom: `1px solid ${colors.text}10` }}
      >
        {/* Like button */}
        <LikeButton
          liked={userHasLiked}
          count={likesCount}
          onToggle={toggleLike}
          disabled={!isLoggedIn}
          themeColors={colors}
        />

        {/* Comments toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); setIsCommentsOpen((v) => !v); }}
          className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
          style={{ color: colors.secondary }}
        >
          <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
          </svg>
          <span>
            {commentsCount > 0 ? (
              <>
                {commentsCount} comment{commentsCount !== 1 ? "s" : ""}
              </>
            ) : (
              "Comments"
            )}
          </span>
          <svg
            className="w-3 h-3 transition-transform"
            style={{ transform: isCommentsOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Expandable comments section */}
      {isCommentsOpen && (
        <div className="pt-4 pb-2">
          <CommentsSection
            comments={comments}
            isLoggedIn={isLoggedIn}
            currentUserId={currentUserId}
            isLoading={isLoadingComments}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
            onHeartComment={toggleCommentHeart}
            themeColors={colors}
          />
        </div>
      )}
    </div>
  );
}
