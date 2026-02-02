"use client";

import * as React from "react";
import Link from "next/link";

interface ChapterInfo {
  chapter_number: number;
  title_en: string | null;
  title_si: string | null;
}

interface ChaptersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  bookTitle: string;
  chapters: ChapterInfo[];
  currentChapter: number;
  freePreviewChapters: number;
  hasFullAccess: boolean;
  theme: "light" | "dark" | "sepia";
}

export function ChaptersSheet({
  isOpen,
  onClose,
  bookId,
  bookTitle,
  chapters,
  currentChapter,
  freePreviewChapters,
  hasFullAccess,
  theme,
}: ChaptersSheetProps) {
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState(0);
  const startYRef = React.useRef(0);
  const currentChapterRef = React.useRef<HTMLAnchorElement>(null);

  // Theme colors
  const themeStyles = {
    light: {
      bg: "#FFFEF9",
      text: "#2C1810",
      secondary: "#666666",
      border: "#e5e5e5",
      hover: "#f5f5f5",
      accent: "#722F37",
    },
    dark: {
      bg: "#000000",
      text: "#E8E8E8",
      secondary: "#888888",
      border: "#222222",
      hover: "#111111",
      accent: "#C9A227",
    },
    sepia: {
      bg: "#f4ecd8",
      text: "#5c4b37",
      secondary: "#8b7355",
      border: "#d4c4a8",
      hover: "#e8dcc4",
      accent: "#8b7355",
    },
  };

  const colors = themeStyles[theme];

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle drag start
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    startYRef.current = clientY;
  };

  // Handle drag move
  const handleDragMove = React.useCallback(
    (e: TouchEvent | MouseEvent) => {
      if (!isDragging) return;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const delta = clientY - startYRef.current;
      if (delta > 0) {
        setDragOffset(delta);
      }
    },
    [isDragging]
  );

  // Handle drag end
  const handleDragEnd = React.useCallback(() => {
    if (dragOffset > 100) {
      onClose();
    }
    setIsDragging(false);
    setDragOffset(0);
  }, [dragOffset, onClose]);

  // Set up drag listeners
  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener("touchmove", handleDragMove, { passive: true });
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("touchend", handleDragEnd);
      window.addEventListener("mouseup", handleDragEnd);

      return () => {
        window.removeEventListener("touchmove", handleDragMove);
        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("touchend", handleDragEnd);
        window.removeEventListener("mouseup", handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Lock body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Scroll to current chapter after a brief delay
      setTimeout(() => {
        currentChapterRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isChapterAccessible = (chapterNum: number) => {
    return hasFullAccess || chapterNum <= freePreviewChapters;
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={handleBackdropClick}
    >
      <div
        ref={sheetRef}
        className="w-full max-w-lg rounded-t-2xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: colors.bg,
          maxHeight: "70vh",
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? "none" : "transform 0.3s ease-out",
        }}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleDragStart}
          onMouseDown={handleDragStart}
        >
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: `${colors.text}30` }}
          />
        </div>

        {/* Header */}
        <header className="px-5 pb-3 border-b" style={{ borderColor: colors.border }}>
          <h2 className="text-lg font-serif font-medium" style={{ color: colors.text }}>
            Chapters
          </h2>
          <p className="text-xs mt-0.5 sinhala" style={{ color: colors.secondary }}>
            {bookTitle}
          </p>
        </header>

        {/* Chapter list */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(70vh - 100px)" }}>
          <nav className="py-2">
            {/* Intro pages section */}
            <div className="mb-2">
              <Link
                href={`/read/${bookId}/intro/disclaimer`}
                onClick={onClose}
                className="flex items-center gap-3 px-5 py-3 transition-colors"
              >
                <span
                  className="w-7 h-7 flex items-center justify-center rounded-full text-sm flex-shrink-0"
                  style={{
                    backgroundColor: `${colors.text}08`,
                  }}
                >
                  ⚠️
                </span>
                <span className="flex-1 text-sm" style={{ color: colors.secondary }}>
                  Disclaimer
                </span>
              </Link>
              <Link
                href={`/read/${bookId}/intro/copyright`}
                onClick={onClose}
                className="flex items-center gap-3 px-5 py-3 transition-colors"
              >
                <span
                  className="w-7 h-7 flex items-center justify-center rounded-full text-sm flex-shrink-0"
                  style={{
                    backgroundColor: `${colors.text}08`,
                  }}
                >
                  ©
                </span>
                <span className="flex-1 text-sm" style={{ color: colors.secondary }}>
                  Copyright
                </span>
              </Link>
              <Link
                href={`/read/${bookId}/intro/contents`}
                onClick={onClose}
                className="flex items-center gap-3 px-5 py-3 transition-colors"
              >
                <span
                  className="w-7 h-7 flex items-center justify-center rounded-full text-sm flex-shrink-0"
                  style={{
                    backgroundColor: `${colors.text}08`,
                  }}
                >
                  📑
                </span>
                <span className="flex-1 text-sm" style={{ color: colors.secondary }}>
                  Table of Contents
                </span>
              </Link>
            </div>

            {/* Divider */}
            <div
              className="mx-5 my-2 h-px"
              style={{ backgroundColor: colors.border }}
            />

            {/* Chapters */}
            {chapters.map((chapter) => {
              const isAccessible = isChapterAccessible(chapter.chapter_number);
              const isCurrent = chapter.chapter_number === currentChapter;
              const title = chapter.title_si || chapter.title_en || `Chapter ${chapter.chapter_number}`;

              if (!isAccessible) {
                return (
                  <div
                    key={chapter.chapter_number}
                    className="flex items-center gap-3 px-5 py-3.5"
                    style={{ opacity: 0.45 }}
                  >
                    {/* Chapter number */}
                    <span
                      className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium flex-shrink-0"
                      style={{
                        backgroundColor: `${colors.text}08`,
                        color: colors.secondary,
                      }}
                    >
                      {chapter.chapter_number}
                    </span>
                    {/* Title */}
                    <span className="flex-1 sinhala text-sm" style={{ color: colors.text }}>
                      {title}
                    </span>
                    {/* Lock icon */}
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: colors.secondary }}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                );
              }

              return (
                <Link
                  key={chapter.chapter_number}
                  href={`/read/${bookId}/${chapter.chapter_number}`}
                  ref={isCurrent ? currentChapterRef : undefined}
                  onClick={onClose}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors"
                  style={{
                    backgroundColor: isCurrent ? `${colors.text}08` : "transparent",
                  }}
                >
                  {/* Chapter number */}
                  <span
                    className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium flex-shrink-0"
                    style={{
                      backgroundColor: `${colors.text}10`,
                      color: colors.secondary,
                    }}
                  >
                    {chapter.chapter_number}
                  </span>
                  {/* Title */}
                  <span
                    className="flex-1 sinhala text-sm"
                    style={{
                      color: colors.text,
                      fontWeight: isCurrent ? 500 : 400,
                    }}
                  >
                    {title}
                  </span>
                  {/* Current indicator - subtle checkmark */}
                  {isCurrent && (
                    <svg
                      className="w-5 h-5 flex-shrink-0"
                      style={{ color: colors.text }}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
