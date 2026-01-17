"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DOMPurify from "dompurify";
import type { Book, Chapter, ReaderTheme } from "@/types";
import { SettingsSheet, ChaptersSheet } from "@/components/reader";
import { useReadingProgress, useReaderSettings } from "@/hooks";

interface ChapterInfo {
  chapter_number: number;
  title_en: string | null;
  title_si: string | null;
}

interface ReaderViewProps {
  book: Book;
  chapter: Chapter;
  chapterNumber: number;
  totalChapters: number;
  allChapters: ChapterInfo[];
  hasPreviousChapter: boolean;
  hasNextChapter: boolean;
  nextChapterAccessible: boolean;
  hasFullAccess: boolean;
  isPreviewMode: boolean;
  previewChaptersRemaining: number;
  isLoggedIn?: boolean;
}

// Allowed HTML tags for chapter content (safe subset)
const ALLOWED_TAGS = ["p", "br", "strong", "em", "s", "h2", "h3", "blockquote", "ul", "ol", "li", "hr", "img"];
const ALLOWED_ATTR = ["style", "src", "alt", "width", "height", "class"];

// Helper function to format and sanitize chapter content
// Handles both HTML (from rich text editor) and plain text (legacy content)
function formatChapterContent(content: string): string {
  // Check if content appears to be HTML (contains common HTML tags)
  const isHtml = /<(p|div|h[1-6]|ul|ol|li|blockquote|br|strong|em|s)[^>]*>/i.test(content);

  let html: string;
  if (isHtml) {
    // Content is already HTML
    html = content;
  } else {
    // Plain text content - convert to paragraphs (escape HTML first)
    const escaped = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    html = escaped
      .split("\n\n")
      .map((p) => `<p style="margin-bottom: 1.5em; text-indent: 2em;">${p.replace(/\n/g, "<br>")}</p>`)
      .join("");
  }

  // Sanitize HTML to prevent XSS
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}

export function ReaderView({
  book,
  chapter,
  chapterNumber,
  totalChapters,
  allChapters,
  hasPreviousChapter,
  hasNextChapter,
  nextChapterAccessible,
  hasFullAccess,
  isPreviewMode,
  previewChaptersRemaining,
  isLoggedIn = false,
}: ReaderViewProps) {
  const router = useRouter();
  const [showControls, setShowControls] = React.useState(true);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showChapters, setShowChapters] = React.useState(false);
  const controlsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Reader settings hook
  const {
    settings,
    isLoaded: settingsLoaded,
    setTheme,
    setFontSize,
    setLineSpacing,
    resetSettings,
  } = useReaderSettings();

  // Reading progress hook (only for logged-in users)
  const { scrollProgress, markChapterComplete } = useReadingProgress({
    bookId: book.id,
    chapterId: chapter.id,
    chapterNumber,
    enabled: isLoggedIn,
  });

  // Hide controls after 3 seconds of inactivity
  const resetControlsTimeout = React.useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (!showSettings && !showChapters) {
        setShowControls(false);
      }
    }, 3000);
  }, [showSettings, showChapters]);

  // Show controls on tap/click
  const handleContentClick = () => {
    if (!showControls) {
      setShowControls(true);
      resetControlsTimeout();
    }
  };

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSettings || showChapters) return; // Don't navigate when sheets are open

      if (e.key === "ArrowLeft" && hasPreviousChapter) {
        router.push(`/read/${book.id}/${chapterNumber - 1}`);
      } else if (e.key === "ArrowRight" && hasNextChapter && nextChapterAccessible) {
        router.push(`/read/${book.id}/${chapterNumber + 1}`);
      } else if (e.key === "Escape") {
        if (showSettings) {
          setShowSettings(false);
        } else if (showChapters) {
          setShowChapters(false);
        } else {
          router.push("/library");
        }
      } else if (e.key === "s" || e.key === "S") {
        setShowSettings((prev) => !prev);
      } else if (e.key === "c" || e.key === "C") {
        setShowChapters((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [book.id, chapterNumber, hasPreviousChapter, hasNextChapter, nextChapterAccessible, router, showSettings, showChapters]);

  // Mark chapter complete when reaching end
  React.useEffect(() => {
    if (scrollProgress >= 95 && isLoggedIn) {
      markChapterComplete();
    }
  }, [scrollProgress, markChapterComplete, isLoggedIn]);

  // Theme styles
  const themeStyles = {
    light: {
      bg: "#FFFEF9",
      text: "#2C1810",
      secondary: "#666666",
      accent: "#722F37",
    },
    dark: {
      bg: "#1a1512",
      text: "#F0EBE3",
      secondary: "#a0a0a0",
      accent: "#C9A227",
    },
    sepia: {
      bg: "#f4ecd8",
      text: "#5c4b37",
      secondary: "#8b7355",
      accent: "#8b7355",
    },
  };

  const currentTheme = themeStyles[settings.theme];
  const chapterTitle = chapter.title_si || chapter.title_en || `Chapter ${chapterNumber}`;

  // Don't render until settings are loaded to avoid flash
  if (!settingsLoaded) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#FFFEF9" }}
      >
        <div className="animate-pulse">
          <svg
            className="w-8 h-8 text-[var(--auth-burgundy)]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: currentTheme.bg }}
      data-reader-theme={settings.theme}
    >
      {/* Top bar - Kindle-style minimal */}
      <header
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-300
          ${showControls ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}
        `}
        style={{ backgroundColor: currentTheme.bg }}
      >
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between">
          {/* Back button */}
          <Link
            href="/library"
            className="p-1.5 -ml-1.5 transition-opacity hover:opacity-60"
            aria-label="Back to library"
          >
            <svg
              className="w-5 h-5"
              style={{ color: currentTheme.text }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>

          {/* Chapter indicator - clickable to open chapters list */}
          <button
            onClick={() => setShowChapters(true)}
            className="flex items-center gap-1.5 px-2 py-1 -mx-2 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            aria-label="View all chapters"
          >
            <svg
              className="w-4 h-4"
              style={{ color: `${currentTheme.text}60` }}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06v-11a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3a8.963 8.963 0 00-4.25 1.065V16.82zM9.25 4.065A8.963 8.963 0 005 3c-.85 0-1.673.118-2.454.339A.75.75 0 002 4.06v11a.75.75 0 00.954.721A7.506 7.506 0 015 15.5c1.579 0 3.042.487 4.25 1.32V4.065z" />
            </svg>
            <span
              className="text-[11px] tracking-widest uppercase"
              style={{ color: `${currentTheme.text}60` }}
            >
              {chapterNumber} of {totalChapters}
            </span>
            <svg
              className="w-3 h-3"
              style={{ color: `${currentTheme.text}40` }}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Quick controls */}
          <div className="flex items-center">
            {/* Font size controls */}
            <button
              onClick={() => setFontSize(Math.max(14, settings.fontSize - 2))}
              className="px-1 py-2 transition-opacity hover:opacity-60 disabled:opacity-30"
              disabled={settings.fontSize <= 14}
              aria-label="Decrease font size"
            >
              <span style={{ color: currentTheme.text, fontSize: "12px", fontWeight: 500 }}>
                A<span style={{ fontSize: "9px", opacity: 0.5 }}>−</span>
              </span>
            </button>
            <button
              onClick={() => setFontSize(Math.min(28, settings.fontSize + 2))}
              className="px-1 py-2 transition-opacity hover:opacity-60 disabled:opacity-30"
              disabled={settings.fontSize >= 28}
              aria-label="Increase font size"
            >
              <span style={{ color: currentTheme.text, fontSize: "18px", fontWeight: 500 }}>
                A<span style={{ fontSize: "11px", opacity: 0.5 }}>+</span>
              </span>
            </button>

            {/* Divider */}
            <div
              className="w-px h-4 mx-1"
              style={{ backgroundColor: `${currentTheme.text}20` }}
            />

            {/* Theme toggle - cycles through light → dark → sepia */}
            <button
              onClick={() => {
                const themes: Array<"light" | "dark" | "sepia"> = ["light", "dark", "sepia"];
                const currentIndex = themes.indexOf(settings.theme);
                const nextTheme = themes[(currentIndex + 1) % themes.length];
                setTheme(nextTheme);
              }}
              className="p-2 transition-opacity hover:opacity-60"
              aria-label={`Current theme: ${settings.theme}. Click to change.`}
            >
              {settings.theme === "dark" ? (
                <svg
                  className="w-4 h-4"
                  style={{ color: currentTheme.text }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              ) : settings.theme === "sepia" ? (
                <svg
                  className="w-4 h-4"
                  style={{ color: currentTheme.text }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  style={{ color: currentTheme.text }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              )}
            </button>

            {/* Settings button */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 -mr-1.5 transition-opacity hover:opacity-60"
              aria-label="Open settings"
            >
              <svg
                className="w-4 h-4"
                style={{ color: currentTheme.text }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Preview mode banner */}
      {isPreviewMode && previewChaptersRemaining >= 0 && (
        <div
          className={`
            fixed top-0 left-0 right-0 z-40 transition-all duration-300
            ${showControls ? "translate-y-[60px]" : "translate-y-0"}
          `}
        >
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center py-2 px-4 text-sm">
            {previewChaptersRemaining > 0 ? (
              <span>
                Preview Mode — {previewChaptersRemaining} free chapter{previewChaptersRemaining !== 1 ? "s" : ""} remaining
              </span>
            ) : (
              <span>Last preview chapter — <Link href={`/purchase/${book.id}`} className="underline font-medium">Purchase to continue reading</Link></span>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <main
        className="max-w-3xl mx-auto px-6 sm:px-8 py-24 sm:py-32"
        onClick={handleContentClick}
      >
        {/* Chapter header */}
        <header className="mb-12 text-center">
          <p className="font-serif text-sm mb-2" style={{ color: currentTheme.secondary }}>
            Chapter {chapterNumber}
          </p>
          <h1
            className="sinhala font-serif text-2xl sm:text-3xl font-medium leading-relaxed"
            style={{ color: currentTheme.text }}
          >
            {chapterTitle}
          </h1>
        </header>

        {/* Chapter content */}
        <article
          className="sinhala reader-content"
          style={{
            color: currentTheme.text,
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineSpacing,
          }}
          dangerouslySetInnerHTML={{
            __html: formatChapterContent(chapter.content),
          }}
        />

        {/* End of chapter - minimal */}
        <footer className="mt-12 pt-6">
          <div
            className="w-12 h-px mx-auto mb-6"
            style={{ backgroundColor: `${currentTheme.text}20` }}
          />

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4">
            {hasPreviousChapter && (
              <>
                <Link
                  href={`/read/${book.id}/${chapterNumber - 1}`}
                  className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
                  style={{ color: `${currentTheme.text}60` }}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                  <span>Previous</span>
                </Link>
                <span style={{ color: `${currentTheme.text}25` }}>·</span>
              </>
            )}

            {hasNextChapter ? (
              nextChapterAccessible ? (
                <Link
                  href={`/read/${book.id}/${chapterNumber + 1}`}
                  className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
                  style={{ color: currentTheme.text }}
                >
                  <span>Next Chapter</span>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </Link>
              ) : (
                <Link
                  href={`/purchase/${book.id}`}
                  className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
                  style={{ color: currentTheme.accent }}
                >
                  <span>Purchase to continue</span>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </Link>
              )
            ) : (
              <Link
                href="/library"
                className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
                style={{ color: `${currentTheme.text}70` }}
              >
                <span>Back to library</span>
              </Link>
            )}
          </div>
        </footer>
      </main>

      {/* Bottom navigation bar - minimal Kindle-style */}
      <nav
        className={`
          fixed bottom-0 left-0 right-0 z-50 transition-all duration-300
          ${showControls ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
        `}
        style={{ backgroundColor: currentTheme.bg }}
      >
        <div className="safe-bottom">
          <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-between">
            <button
              onClick={() => hasPreviousChapter && router.push(`/read/${book.id}/${chapterNumber - 1}`)}
              disabled={!hasPreviousChapter}
              className="p-1.5 transition-opacity disabled:opacity-20"
              aria-label="Previous chapter"
            >
              <svg className="w-4 h-4" style={{ color: currentTheme.secondary }} viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Minimal progress indicator */}
            <div className="flex-1 mx-6">
              {/* Progress bar */}
              <div
                className="h-[3px] rounded-full"
                style={{ backgroundColor: `${currentTheme.text}12` }}
              >
                <div
                  className="h-full rounded-full transition-all duration-150"
                  style={{
                    width: `${scrollProgress}%`,
                    backgroundColor: `${currentTheme.text}40`,
                  }}
                />
              </div>
              {/* Page info */}
              <p
                className="text-center text-[10px] mt-1 tabular-nums"
                style={{ color: `${currentTheme.text}50` }}
              >
                {Math.round(scrollProgress)}%
              </p>
            </div>

            <button
              onClick={() => hasNextChapter && nextChapterAccessible && router.push(`/read/${book.id}/${chapterNumber + 1}`)}
              disabled={!hasNextChapter || !nextChapterAccessible}
              className="p-1.5 transition-opacity disabled:opacity-20"
              aria-label="Next chapter"
            >
              <svg className="w-4 h-4" style={{ color: currentTheme.secondary }} viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Settings Bottom Sheet */}
      <SettingsSheet
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        theme={settings.theme}
        fontSize={settings.fontSize}
        lineSpacing={settings.lineSpacing}
        onThemeChange={setTheme}
        onFontSizeChange={setFontSize}
        onLineSpacingChange={setLineSpacing}
        onReset={resetSettings}
      />

      {/* Chapters Bottom Sheet */}
      <ChaptersSheet
        isOpen={showChapters}
        onClose={() => setShowChapters(false)}
        bookId={book.id}
        bookTitle={book.title_si || book.title_en}
        chapters={allChapters}
        currentChapter={chapterNumber}
        freePreviewChapters={book.free_preview_chapters}
        hasFullAccess={hasFullAccess}
        theme={settings.theme}
      />
    </div>
  );
}
