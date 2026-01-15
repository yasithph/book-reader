"use client";

import { useState, useCallback, useEffect } from "react";
import {
  saveBookOffline,
  saveChapterOffline,
  getOfflineBook,
  getDownloadedChapterNumbers,
  deleteOfflineBook,
  isBookDownloaded as checkBookDownloaded,
  getDownloadProgress,
} from "@/lib/offline";

interface Book {
  id: string;
  title_en: string;
  title_si: string;
  author_en: string;
  author_si: string;
  cover_image_url: string | null;
  total_chapters: number;
}

interface Chapter {
  id: string;
  book_id: string;
  chapter_number: number;
  title_en: string;
  title_si: string;
  content: string;
  word_count: number;
  reading_time_minutes: number;
}

interface DownloadState {
  isDownloading: boolean;
  progress: number;
  currentChapter: number;
  totalChapters: number;
  error: string | null;
}

interface UseDownloadManagerReturn {
  downloadState: DownloadState;
  isDownloaded: boolean;
  downloadedChapters: number[];
  downloadProgress: { downloaded: number; total: number };
  downloadBook: (book: Book) => Promise<void>;
  downloadChapter: (bookId: string, chapterNumber: number) => Promise<void>;
  deleteDownload: () => Promise<void>;
  cancelDownload: () => void;
  checkDownloadStatus: () => Promise<void>;
}

export function useDownloadManager(bookId: string): UseDownloadManagerReturn {
  const [downloadState, setDownloadState] = useState<DownloadState>({
    isDownloading: false,
    progress: 0,
    currentChapter: 0,
    totalChapters: 0,
    error: null,
  });

  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloadedChapters, setDownloadedChapters] = useState<number[]>([]);
  const [downloadProgress, setDownloadProgress] = useState({ downloaded: 0, total: 0 });
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const checkDownloadStatus = useCallback(async () => {
    try {
      const downloaded = await checkBookDownloaded(bookId);
      setIsDownloaded(downloaded);

      if (downloaded) {
        const chapters = await getDownloadedChapterNumbers(bookId);
        setDownloadedChapters(chapters);

        const progress = await getDownloadProgress(bookId);
        setDownloadProgress(progress);
      } else {
        setDownloadedChapters([]);
        setDownloadProgress({ downloaded: 0, total: 0 });
      }
    } catch (error) {
      console.error("Failed to check download status:", error);
    }
  }, [bookId]);

  useEffect(() => {
    checkDownloadStatus();
  }, [checkDownloadStatus]);

  const downloadBook = useCallback(
    async (book: Book) => {
      const controller = new AbortController();
      setAbortController(controller);

      setDownloadState({
        isDownloading: true,
        progress: 0,
        currentChapter: 0,
        totalChapters: book.total_chapters,
        error: null,
      });

      try {
        // Fetch and cache cover image if available
        let coverBlob: Blob | null = null;
        if (book.cover_image_url) {
          try {
            const coverResponse = await fetch(book.cover_image_url, {
              signal: controller.signal,
            });
            if (coverResponse.ok) {
              coverBlob = await coverResponse.blob();
            }
          } catch {
            // Cover download failed, continue without it
          }
        }

        // Save book metadata
        await saveBookOffline({
          id: book.id,
          title_en: book.title_en,
          title_si: book.title_si,
          author_en: book.author_en,
          author_si: book.author_si,
          cover_image_url: book.cover_image_url,
          cover_blob: coverBlob,
          total_chapters: book.total_chapters,
          downloaded_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
        });

        // Download all chapters
        for (let i = 1; i <= book.total_chapters; i++) {
          if (controller.signal.aborted) {
            throw new Error("Download cancelled");
          }

          setDownloadState((prev) => ({
            ...prev,
            currentChapter: i,
            progress: Math.round((i / book.total_chapters) * 100),
          }));

          try {
            const response = await fetch(
              `/api/books/${book.id}/chapters/${i}`,
              { signal: controller.signal }
            );

            if (!response.ok) {
              if (response.status === 403) {
                // User doesn't have access to this chapter
                console.log(`Skipping chapter ${i} - no access`);
                continue;
              }
              throw new Error(`Failed to fetch chapter ${i}`);
            }

            const chapter: Chapter = await response.json();

            await saveChapterOffline({
              id: chapter.id,
              book_id: chapter.book_id,
              chapter_number: chapter.chapter_number,
              title_en: chapter.title_en,
              title_si: chapter.title_si,
              content: chapter.content,
              word_count: chapter.word_count,
              reading_time_minutes: chapter.reading_time_minutes,
              downloaded_at: new Date().toISOString(),
            });
          } catch (error) {
            if ((error as Error).name === "AbortError") {
              throw error;
            }
            console.error(`Failed to download chapter ${i}:`, error);
            // Continue with next chapter
          }
        }

        setDownloadState({
          isDownloading: false,
          progress: 100,
          currentChapter: book.total_chapters,
          totalChapters: book.total_chapters,
          error: null,
        });

        setIsDownloaded(true);
        await checkDownloadStatus();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Download failed";

        if (message !== "Download cancelled") {
          setDownloadState((prev) => ({
            ...prev,
            isDownloading: false,
            error: message,
          }));
        } else {
          setDownloadState({
            isDownloading: false,
            progress: 0,
            currentChapter: 0,
            totalChapters: 0,
            error: null,
          });
        }
      } finally {
        setAbortController(null);
      }
    },
    [checkDownloadStatus]
  );

  const downloadChapter = useCallback(
    async (bookIdParam: string, chapterNumber: number) => {
      try {
        const response = await fetch(
          `/api/books/${bookIdParam}/chapters/${chapterNumber}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch chapter");
        }

        const chapter: Chapter = await response.json();

        await saveChapterOffline({
          id: chapter.id,
          book_id: chapter.book_id,
          chapter_number: chapter.chapter_number,
          title_en: chapter.title_en,
          title_si: chapter.title_si,
          content: chapter.content,
          word_count: chapter.word_count,
          reading_time_minutes: chapter.reading_time_minutes,
          downloaded_at: new Date().toISOString(),
        });

        await checkDownloadStatus();
      } catch (error) {
        console.error("Failed to download chapter:", error);
        throw error;
      }
    },
    [checkDownloadStatus]
  );

  const deleteDownload = useCallback(async () => {
    try {
      await deleteOfflineBook(bookId);
      setIsDownloaded(false);
      setDownloadedChapters([]);
      setDownloadProgress({ downloaded: 0, total: 0 });
    } catch (error) {
      console.error("Failed to delete download:", error);
      throw error;
    }
  }, [bookId]);

  const cancelDownload = useCallback(() => {
    if (abortController) {
      abortController.abort();
    }
  }, [abortController]);

  return {
    downloadState,
    isDownloaded,
    downloadedChapters,
    downloadProgress,
    downloadBook,
    downloadChapter,
    deleteDownload,
    cancelDownload,
    checkDownloadStatus,
  };
}

// Hook for checking if we're offline
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
