"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import type { Book, Chapter } from "@/types";
import {
  getOfflineBook,
  getOfflineChapter,
  getBookChapters,
} from "@/lib/offline/indexed-db";
import { ReaderView } from "./reader-view";

export default function ReaderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string;
  const chapterNumber = parseInt(params.chapterNumber as string, 10);

  const [offlineBook, setOfflineBook] = React.useState<Book | null>(null);
  const [offlineChapter, setOfflineChapter] = React.useState<Chapter | null>(null);
  const [allChapterInfos, setAllChapterInfos] = React.useState<
    { chapter_number: number; title_en: string | null; title_si: string | null }[]
  >([]);
  const [downloadedNumbers, setDownloadedNumbers] = React.useState<number[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [notAvailable, setNotAvailable] = React.useState(false);

  React.useEffect(() => {
    // Invalid chapter number
    if (isNaN(chapterNumber) || chapterNumber < 1) {
      setNotAvailable(true);
      setLoading(false);
      return;
    }

    async function loadOfflineData() {
      try {
        const [book, chapter, chapters] = await Promise.all([
          getOfflineBook(bookId),
          getOfflineChapter(bookId, chapterNumber),
          getBookChapters(bookId),
        ]);

        if (!book || !chapter) {
          setNotAvailable(true);
          setLoading(false);
          return;
        }

        const numbers = chapters
          .map((ch) => ch.chapter_number)
          .sort((a, b) => a - b);
        setDownloadedNumbers(numbers);

        // Map offline book to Book type
        const mappedBook: Book = {
          id: book.id,
          title_en: book.title_en,
          title_si: book.title_si,
          description_en: null,
          description_si: null,
          author_en: book.author_en,
          author_si: book.author_si,
          cover_image_url: book.cover_image_url,
          price_lkr: 0,
          is_free: false,
          free_preview_chapters: 0,
          is_published: true,
          published_at: book.downloaded_at,
          total_chapters: book.total_chapters,
          total_words: 0,
          created_at: book.downloaded_at,
          updated_at: book.last_synced_at,
          intro_disclaimer: null,
          intro_copyright: null,
          intro_thank_you: null,
          intro_offering: null,
        };

        // Map offline chapter to Chapter type
        const mappedChapter: Chapter = {
          id: chapter.id,
          book_id: chapter.book_id,
          chapter_number: chapter.chapter_number,
          title_en: chapter.title_en,
          title_si: chapter.title_si,
          content: chapter.content,
          word_count: chapter.word_count,
          estimated_reading_time: chapter.reading_time_minutes,
          chapter_image_url: null,
          created_at: chapter.downloaded_at,
          updated_at: chapter.downloaded_at,
        };

        // Map all chapters to ChapterInfo
        const infos = chapters
          .map((ch) => ({
            chapter_number: ch.chapter_number,
            title_en: ch.title_en,
            title_si: ch.title_si,
          }))
          .sort((a, b) => a.chapter_number - b.chapter_number);

        setOfflineBook(mappedBook);
        setOfflineChapter(mappedChapter);
        setAllChapterInfos(infos);
      } catch {
        setNotAvailable(true);
      } finally {
        setLoading(false);
      }
    }

    loadOfflineData();
  }, [bookId, chapterNumber]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFEF9]">
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

  // Chapter not available offline
  if (notAvailable || !offlineBook || !offlineChapter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFEF9] px-6">
        <div className="text-center max-w-sm">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-gray-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9.75v6.75m0 0l-3-3m3 3l3-3m-8.25 6a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 4.502 4.502 0 013.516 5.855A4.5 4.5 0 0115.75 18.75H7.5z"
            />
          </svg>
          <h2 className="text-lg font-medium text-[#2C1810] mb-2">
            Chapter not available offline
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            This chapter hasn&apos;t been downloaded yet. Connect to the internet to read it.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={reset}
              className="w-full py-2.5 px-4 bg-[#722F37] text-white text-sm rounded-lg hover:bg-[#5a252c] transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => router.push("/library")}
              className="w-full py-2.5 px-4 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Back to Library
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render offline reader — only grant access if the chapter was actually downloaded
  const hasOfflineAccess = downloadedNumbers.includes(chapterNumber);
  const totalChapters = offlineBook.total_chapters;
  const hasPreviousChapter = chapterNumber > 1;
  const hasNextChapter = chapterNumber < totalChapters;
  const nextChapterAccessible = hasNextChapter && downloadedNumbers.includes(chapterNumber + 1);

  return (
    <ReaderView
      book={offlineBook}
      chapter={offlineChapter}
      chapterNumber={chapterNumber}
      totalChapters={totalChapters}
      allChapters={allChapterInfos}
      hasPreviousChapter={hasPreviousChapter}
      hasNextChapter={hasNextChapter}
      nextChapterAccessible={nextChapterAccessible}
      hasFullAccess={hasOfflineAccess}
      isPreviewMode={false}
      previewChaptersRemaining={0}
      isLoggedIn={true}
      hasPendingPurchase={false}
    />
  );
}
