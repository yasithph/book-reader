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
  const latestScrollRef = React.useRef<number>(0);
  const progressRef = React.useRef(progress);

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

          // Save initial progress if no record exists or it's for a different chapter
          if (!data.progress || data.progress.chapter_id !== chapterId) {
            const saveRes = await fetch("/api/progress", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                bookId,
                chapterId,
                scrollPosition: 0,
                isChapterComplete: false,
                completedChapters: data.progress?.completed_chapters || [],
              }),
            });
            if (saveRes.ok) {
              const saveData = await saveRes.json();
              setProgress(saveData.progress);
              lastSavedPositionRef.current = 0;
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch progress:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProgress();
  }, [bookId, chapterId, enabled]);

  // Keep refs in sync
  React.useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  React.useEffect(() => {
    latestScrollRef.current = scrollProgress;
  }, [scrollProgress]);

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
          const payload = {
            bookId,
            chapterId,
            scrollPosition: Math.round(scrollPosition),
            isChapterComplete: isComplete,
            completedChapters: isComplete
              ? [...(progress?.completed_chapters || []), chapterNumber]
              : progress?.completed_chapters || [],
          };
          const res = await fetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
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

  // Flush pending save on unmount instead of cancelling
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Fire a final save with latest position
      const pos = latestScrollRef.current;
      const positionDiff = Math.abs(pos - lastSavedPositionRef.current);
      if (enabled && positionDiff >= 1) {
        const payload = {
          bookId,
          chapterId,
          scrollPosition: Math.round(pos),
          isChapterComplete: false,
          completedChapters: progressRef.current?.completed_chapters || [],
        };
        navigator.sendBeacon(
          "/api/progress",
          new Blob([JSON.stringify(payload)], { type: "application/json" })
        );
      }
    };
    // Only depend on stable identifiers — refs handle the mutable state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, chapterId, enabled]);

  return {
    progress,
    scrollProgress,
    isLoading,
    saveProgress,
    markChapterComplete,
  };
}
