"use client";

import * as React from "react";

interface LikeButtonProps {
  liked: boolean;
  count: number;
  onToggle: () => void;
  disabled?: boolean;
  size?: "sm" | "md";
  themeColors: { text: string; secondary: string };
}

export function LikeButton({ liked, count, onToggle, disabled, size = "md", themeColors }: LikeButtonProps) {
  const [animating, setAnimating] = React.useState(false);
  const heartColor = liked ? "#e74c3c" : themeColors.secondary;
  const isSmall = size === "sm";

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setAnimating(true);
    onToggle();
    setTimeout(() => setAnimating(false), 300);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className="flex items-center gap-1 transition-opacity disabled:opacity-40"
      style={{ color: heartColor }}
      aria-label={liked ? "Unlike" : "Like"}
    >
      <svg
        className={isSmall ? "w-3.5 h-3.5" : "w-5 h-5"}
        viewBox="0 0 24 24"
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        style={{
          transition: "transform 0.3s ease",
          transform: animating ? "scale(1.25)" : "scale(1)",
        }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
      {count > 0 && (
        <span
          className={`tabular-nums ${isSmall ? "text-xs" : "text-sm"}`}
          style={{ color: liked ? "#e74c3c" : themeColors.secondary }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
