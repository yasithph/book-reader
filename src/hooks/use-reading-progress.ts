"use client";

import * as React from "react";
import type { ReadingProgress } from "@/types";

interface UseReadingProgressOptions {
  bookId: string;
  chapterId: string;
  chapterNumber: number;
  enabled?: boolean;
  debounceMs?: number;
}

interface UseReadingProgressReturn {
  progress: ReadingProgress | null;
  scrollProgress: number;
  isLoading: boolean;
  saveProgress: (scrollPosition: number, isComplete?: boolean) => void;
  markChapterComplete: () => void;
}

export function useReadingProgress({
  bookId,
  chapterId,
  chapterNumber,
  enabled = true,
  debounceMs = 2000,
}: UseReadingProgressOptions): UseReadingProgressReturn {
  const [progress, setProgress] = React.useState<ReadingProgress | null>(null);
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastSavedPositionRef = React.useRef<number>(0);

  // Fetch initial progress
  React.useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    async function fetchProgress() {
      try {
        const res = await fetch(`/api/progress?bookId=${bookId}`);
        if (res.ok) {
          const data = await res.json();
          setProgress(data.progress);
          if (data.progress?.scroll_position) {
            lastSavedPositionRef.current = data.progress.scroll_position;
          }
        }
      } catch (error) {
        console.error("Failed to fetch progress:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProgress();
  }, [bookId, enabled]);

  // Track scroll progress
  React.useEffect(() => {
    function handleScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Save progress function (debounced)
  const saveProgress = React.useCallback(
    (scrollPosition: number, isComplete: boolean = false) => {
      if (!enabled) return;

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Only save if position changed significantly (>5%) or completing chapter
      const positionDiff = Math.abs(scrollPosition - lastSavedPositionRef.current);
      if (positionDiff < 5 && !isComplete) return;

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookId,
              chapterId,
              scrollPosition: Math.round(scrollPosition),
              isChapterComplete: isComplete,
              completedChapters: isComplete
                ? [...(progress?.completed_chapters || []), chapterNumber]
                : progress?.completed_chapters || [],
            }),
          });

          if (res.ok) {
            const data = await res.json();
            setProgress(data.progress);
            lastSavedPositionRef.current = scrollPosition;
          }
        } catch (error) {
          console.error("Failed to save progress:", error);
        }
      }, debounceMs);
    },
    [bookId, chapterId, chapterNumber, enabled, debounceMs, progress]
  );

  // Auto-save on scroll
  React.useEffect(() => {
    if (!enabled) return;

    function handleScrollSave() {
      saveProgress(scrollProgress, false);
    }

    window.addEventListener("scroll", handleScrollSave, { passive: true });
    return () => window.removeEventListener("scroll", handleScrollSave);
  }, [enabled, scrollProgress, saveProgress]);

  // Mark chapter as complete
  const markChapterComplete = React.useCallback(() => {
    saveProgress(100, true);
  }, [saveProgress]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    progress,
    scrollProgress,
    isLoading,
    saveProgress,
    markChapterComplete,
  };
}
