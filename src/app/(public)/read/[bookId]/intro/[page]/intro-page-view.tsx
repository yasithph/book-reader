"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Book } from "@/types";
import { useReaderSettings } from "@/hooks";
import {
  DisclaimerContent,
  CopyrightContent,
  TocContent,
  DynamicIntroContent,
} from "@/components/reader/intro-pages";

interface ChapterInfo {
  chapter_number: number;
  title_en: string | null;
  title_si: string | null;
}

type IntroPageType = "disclaimer" | "copyright" | "thank_you" | "offering" | "contents";

interface IntroPageViewProps {
  book: Book;
  page: IntroPageType;
  chapters: ChapterInfo[];
  hasFullAccess: boolean;
}

// Build the list of active intro pages based on book content
function getActiveIntroPages(book: Book): IntroPageType[] {
  const pages: IntroPageType[] = ["disclaimer", "copyright"];
  if (book.intro_thank_you) pages.push("thank_you");
  if (book.intro_offering) pages.push("offering");
  pages.push("contents");
  return pages;
}

function getNextIntroPage(
  current: IntroPageType,
  activePages: IntroPageType[]
): string | null {
  const currentIndex = activePages.indexOf(current);
  if (currentIndex < activePages.length - 1) {
    return activePages[currentIndex + 1];
  }
  return null; // Last intro page, next is chapter 1
}

function getPrevIntroPage(
  current: IntroPageType,
  activePages: IntroPageType[]
): string | null {
  const currentIndex = activePages.indexOf(current);
  if (currentIndex > 0) {
    return activePages[currentIndex - 1];
  }
  return null; // First intro page, no previous
}

// Page titles for display
const PAGE_TITLES: Record<IntroPageType, string> = {
  disclaimer: "Disclaimer",
  copyright: "Copyright",
  thank_you: "Thank You",
  offering: "Offering",
  contents: "Contents",
};

export function IntroPageView({
  book,
  page,
  chapters,
  hasFullAccess,
}: IntroPageViewProps) {
  const router = useRouter();
  const [showControls, setShowControls] = React.useState(true);
  const controlsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Reader settings hook
  const { settings, isLoaded: settingsLoaded, setTheme } = useReaderSettings();

  const activePages = React.useMemo(() => getActiveIntroPages(book), [book]);

  // Hide controls after 3 seconds of inactivity
  const resetControlsTimeout = React.useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

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
      const prevPage = getPrevIntroPage(page, activePages);
      const nextPage = getNextIntroPage(page, activePages);

      if (e.key === "ArrowLeft" && prevPage) {
        router.push(`/read/${book.id}/intro/${prevPage}`);
      } else if (e.key === "ArrowRight") {
        if (nextPage) {
          router.push(`/read/${book.id}/intro/${nextPage}`);
        } else {
          router.push(`/read/${book.id}/1`);
        }
      } else if (e.key === "Escape") {
        router.push("/library");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [book.id, page, activePages, router]);

  // Theme styles (matching reader-view.tsx)
  const themeStyles = {
    light: {
      bg: "#FFFEF9",
      text: "#2C1810",
      secondary: "#666666",
      accent: "#722F37",
    },
    dark: {
      bg: "#000000",
      text: "#E8E8E8",
      secondary: "#888888",
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
  const prevPage = getPrevIntroPage(page, activePages);
  const nextPage = getNextIntroPage(page, activePages);
  const currentPageIndex = activePages.indexOf(page);

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

  // Render page content based on type
  const renderPageContent = () => {
    switch (page) {
      case "disclaimer":
        if (book.intro_disclaimer) {
          return (
            <DynamicIntroContent
              content={book.intro_disclaimer}
              textColor={currentTheme.text}
              secondaryColor={currentTheme.secondary}
            />
          );
        }
        return (
          <DisclaimerContent
            textColor={currentTheme.text}
            secondaryColor={currentTheme.secondary}
          />
        );
      case "copyright":
        if (book.intro_copyright) {
          return (
            <DynamicIntroContent
              content={book.intro_copyright}
              textColor={currentTheme.text}
              secondaryColor={currentTheme.secondary}
            />
          );
        }
        return (
          <CopyrightContent
            textColor={currentTheme.text}
            secondaryColor={currentTheme.secondary}
          />
        );
      case "thank_you":
        return (
          <DynamicIntroContent
            content={book.intro_thank_you!}
            textColor={currentTheme.text}
            secondaryColor={currentTheme.secondary}
          />
        );
      case "offering":
        return (
          <DynamicIntroContent
            content={book.intro_offering!}
            textColor={currentTheme.text}
            secondaryColor={currentTheme.secondary}
          />
        );
      case "contents":
        return (
          <TocContent
            bookId={book.id}
            chapters={chapters}
            freePreviewChapters={book.free_preview_chapters}
            hasFullAccess={hasFullAccess}
            textColor={currentTheme.text}
            secondaryColor={currentTheme.secondary}
            accentColor={currentTheme.accent}
          />
        );
    }
  };

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
        style={{ backgroundColor: currentTheme.bg }}
      >
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between">
          {/* Back button */}
          <Link
            href={`/books/${book.id}`}
            className="p-1.5 -ml-1.5 transition-opacity hover:opacity-60"
            aria-label="Back to book"
          >
            <svg
              className="w-5 h-5"
              style={{ color: currentTheme.text }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </Link>

          {/* Page indicator */}
          <span
            className="text-[11px] tracking-widest uppercase"
            style={{ color: `${currentTheme.text}60` }}
          >
            {PAGE_TITLES[page]}
          </span>

          {/* Theme toggle */}
          <button
            onClick={() => {
              const themes: Array<"light" | "dark" | "sepia"> = [
                "light",
                "dark",
                "sepia",
              ];
              const currentIndex = themes.indexOf(settings.theme);
              const nextTheme = themes[(currentIndex + 1) % themes.length];
              setTheme(nextTheme);
            }}
            className="p-2 -mr-1.5 transition-opacity hover:opacity-60"
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                />
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Content */}
      <main
        className="max-w-3xl mx-auto px-6 sm:px-8 py-24 sm:py-32 min-h-screen flex items-center justify-center"
        onClick={handleContentClick}
      >
        {renderPageContent()}
      </main>

      {/* Bottom navigation bar */}
      <nav
        className={`
          fixed bottom-0 left-0 right-0 z-50 transition-all duration-300
          ${showControls ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
        `}
        style={{ backgroundColor: currentTheme.bg }}
      >
        <div className="safe-bottom">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            {/* Previous */}
            {prevPage ? (
              <Link
                href={`/read/${book.id}/intro/${prevPage}`}
                className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
                style={{ color: `${currentTheme.text}60` }}
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Previous</span>
              </Link>
            ) : (
              <div />
            )}

            {/* Progress dots */}
            <div className="flex items-center gap-2">
              {activePages.map((p, i) => (
                <div
                  key={p}
                  className="w-2 h-2 rounded-full transition-colors"
                  style={{
                    backgroundColor:
                      i === currentPageIndex
                        ? currentTheme.accent
                        : `${currentTheme.text}20`,
                  }}
                />
              ))}
            </div>

            {/* Next */}
            {nextPage ? (
              <Link
                href={`/read/${book.id}/intro/${nextPage}`}
                className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
                style={{ color: currentTheme.text }}
              >
                <span>Next</span>
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            ) : (
              <Link
                href={`/read/${book.id}/1`}
                className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
                style={{ color: currentTheme.accent }}
              >
                <span>Start Reading</span>
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
