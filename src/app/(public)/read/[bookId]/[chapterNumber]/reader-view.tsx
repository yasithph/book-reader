"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DOMPurify from "dompurify";
import type { Book, Chapter, ReaderTheme } from "@/types";
import { SettingsSheet } from "@/components/reader";
import { useReadingProgress, useReaderSettings } from "@/hooks";

interface ReaderViewProps {
  book: Book;
  chapter: Chapter;
  chapterNumber: number;
  totalChapters: number;
  hasPreviousChapter: boolean;
  hasNextChapter: boolean;
  nextChapterAccessible: boolean;
  isPreviewMode: boolean;
  previewChaptersRemaining: number;
  isLoggedIn?: boolean;
}

// Allowed HTML tags for chapter content (safe subset)
const ALLOWED_TAGS = ["p", "br", "strong", "em", "s", "h2", "h3", "blockquote", "ul", "ol", "li", "hr"];
const ALLOWED_ATTR = ["style"];

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
  hasPreviousChapter,
  hasNextChapter,
  nextChapterAccessible,
  isPreviewMode,
  previewChaptersRemaining,
  isLoggedIn = false,
}: ReaderViewProps) {
  const router = useRouter();
  const [showControls, setShowControls] = React.useState(true);
  const [showSettings, setShowSettings] = React.useState(false);
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
      if (!showSettings) {
        setShowControls(false);
      }
    }, 3000);
  }, [showSettings]);

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
      if (showSettings) return; // Don't navigate when settings open

      if (e.key === "ArrowLeft" && hasPreviousChapter) {
        router.push(`/read/${book.id}/${chapterNumber - 1}`);
      } else if (e.key === "ArrowRight" && hasNextChapter && nextChapterAccessible) {
        router.push(`/read/${book.id}/${chapterNumber + 1}`);
      } else if (e.key === "Escape") {
        if (showSettings) {
          setShowSettings(false);
        } else {
          router.push(`/books/${book.id}`);
        }
      } else if (e.key === "s" || e.key === "S") {
        setShowSettings((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [book.id, chapterNumber, hasPreviousChapter, hasNextChapter, nextChapterAccessible, router, showSettings]);

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
      {/* Top bar */}
      <header
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-300
          ${showControls ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}
        `}
        style={{ backgroundColor: `${currentTheme.bg}ee` }}
      >
        <div className="backdrop-blur-md border-b" style={{ borderColor: `${currentTheme.text}15` }}>
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link
              href={`/books/${book.id}`}
              className="flex items-center gap-2 text-sm font-serif"
              style={{ color: currentTheme.secondary }}
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="hidden sm:inline sinhala">{book.title_si}</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="text-sm font-serif" style={{ color: currentTheme.secondary }}>
                {chapterNumber} / {totalChapters}
              </span>

              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                aria-label="Open settings"
              >
                <svg
                  className="w-5 h-5"
                  style={{ color: currentTheme.text }}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
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

        {/* End of chapter */}
        <footer className="mt-16 pt-8 border-t" style={{ borderColor: `${currentTheme.text}15` }}>
          <p className="text-center text-sm font-serif mb-8" style={{ color: currentTheme.secondary }}>
            End of Chapter {chapterNumber}
          </p>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            {hasPreviousChapter ? (
              <Link
                href={`/read/${book.id}/${chapterNumber - 1}`}
                className="flex items-center gap-2 px-4 py-3 rounded-xl transition-colors font-serif"
                style={{
                  backgroundColor: `${currentTheme.text}08`,
                  color: currentTheme.text,
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="hidden sm:inline">Previous</span>
              </Link>
            ) : (
              <div />
            )}

            {hasNextChapter ? (
              nextChapterAccessible ? (
                <Link
                  href={`/read/${book.id}/${chapterNumber + 1}`}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl transition-colors font-serif font-medium"
                  style={{
                    backgroundColor: currentTheme.accent,
                    color: settings.theme === "dark" ? "#1a1512" : "#FFFEF9",
                  }}
                >
                  <span>Next Chapter</span>
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              ) : (
                <Link
                  href={`/purchase/${book.id}`}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl transition-colors font-serif font-medium"
                  style={{
                    backgroundColor: currentTheme.accent,
                    color: settings.theme === "dark" ? "#1a1512" : "#FFFEF9",
                  }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Purchase to Continue</span>
                </Link>
              )
            ) : (
              <Link
                href={`/books/${book.id}`}
                className="flex items-center gap-2 px-6 py-3 rounded-xl transition-colors font-serif"
                style={{
                  backgroundColor: `${currentTheme.text}08`,
                  color: currentTheme.text,
                }}
              >
                <span>Finished</span>
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            )}
          </div>
        </footer>
      </main>

      {/* Bottom navigation bar with scroll progress */}
      <nav
        className={`
          fixed bottom-0 left-0 right-0 z-50 transition-all duration-300
          ${showControls ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
        `}
        style={{ backgroundColor: `${currentTheme.bg}ee` }}
      >
        {/* Scroll progress indicator */}
        <div
          className="h-0.5 transition-all duration-150"
          style={{ backgroundColor: `${currentTheme.text}10` }}
        >
          <div
            className="h-full transition-all duration-150"
            style={{
              width: `${scrollProgress}%`,
              backgroundColor: currentTheme.accent,
            }}
          />
        </div>

        <div className="backdrop-blur-md border-t safe-bottom" style={{ borderColor: `${currentTheme.text}15` }}>
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => hasPreviousChapter && router.push(`/read/${book.id}/${chapterNumber - 1}`)}
              disabled={!hasPreviousChapter}
              className="p-3 rounded-lg transition-colors disabled:opacity-30"
              style={{ backgroundColor: hasPreviousChapter ? `${currentTheme.text}10` : "transparent" }}
              aria-label="Previous chapter"
            >
              <svg className="w-5 h-5" style={{ color: currentTheme.text }} viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Chapter progress */}
            <div className="flex-1 mx-4">
              <div className="flex items-center justify-center gap-1">
                {Array.from({ length: totalChapters }).map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 rounded-full transition-all duration-200"
                    style={{
                      width: i === chapterNumber - 1 ? "16px" : "6px",
                      backgroundColor:
                        i < chapterNumber
                          ? currentTheme.accent
                          : i === chapterNumber - 1
                          ? currentTheme.accent
                          : `${currentTheme.text}20`,
                      opacity: i < chapterNumber ? 1 : i === chapterNumber - 1 ? 1 : 0.5,
                    }}
                  />
                ))}
              </div>
              <p className="text-center text-xs mt-1 font-serif" style={{ color: currentTheme.secondary }}>
                {Math.round(scrollProgress)}% of chapter
              </p>
            </div>

            <button
              onClick={() => hasNextChapter && nextChapterAccessible && router.push(`/read/${book.id}/${chapterNumber + 1}`)}
              disabled={!hasNextChapter || !nextChapterAccessible}
              className="p-3 rounded-lg transition-colors disabled:opacity-30"
              style={{ backgroundColor: hasNextChapter && nextChapterAccessible ? `${currentTheme.text}10` : "transparent" }}
              aria-label="Next chapter"
            >
              <svg className="w-5 h-5" style={{ color: currentTheme.text }} viewBox="0 0 20 20" fill="currentColor">
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
    </div>
  );
}
