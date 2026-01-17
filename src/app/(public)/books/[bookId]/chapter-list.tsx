"use client";

import Link from "next/link";
import type { Chapter } from "@/types";

interface ChapterListProps {
  chapters: Chapter[];
  bookId: string;
  freePreviewCount: number;
  isBookFree: boolean;
  hasFullAccess?: boolean;
}

export function ChapterList({
  chapters,
  bookId,
  freePreviewCount,
  isBookFree,
  hasFullAccess = false,
}: ChapterListProps) {
  const formatReadingTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const isChapterAccessible = (chapterNumber: number) => {
    return isBookFree || hasFullAccess || chapterNumber <= freePreviewCount;
  };

  if (chapters.length === 0) {
    return (
      <div className="kindle-chapter-empty">
        <p>පරිච්ඡේද ඉක්මනින් එකතු වේ...</p>
      </div>
    );
  }

  return (
    <div className="kindle-chapter-list">
      {chapters.map((chapter, index) => {
        const accessible = isChapterAccessible(chapter.chapter_number);
        const isFreePreview = !isBookFree && chapter.chapter_number <= freePreviewCount;

        const ChapterContent = (
          <>
            <div className="kindle-chapter-left">
              <span className={`kindle-chapter-number ${!accessible ? "kindle-chapter-number-locked" : ""}`}>
                {String(chapter.chapter_number).padStart(2, "0")}
              </span>
              <div className="kindle-chapter-info">
                <span className={`kindle-chapter-title ${!accessible ? "kindle-chapter-title-locked" : ""}`}>
                  {chapter.title_si || chapter.title_en || `පරිච්ඡේදය ${chapter.chapter_number}`}
                </span>
                {isFreePreview && (
                  <span className="kindle-chapter-free-badge">FREE</span>
                )}
              </div>
            </div>

            <div className="kindle-chapter-right">
              <span className={`kindle-chapter-meta ${!accessible ? "kindle-chapter-meta-locked" : ""}`}>
                {formatReadingTime(chapter.estimated_reading_time)}
              </span>
              {accessible ? (
                <svg className="kindle-chapter-arrow" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="kindle-chapter-lock" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </>
        );

        if (accessible) {
          return (
            <Link
              key={chapter.id}
              href={`/read/${bookId}/${chapter.chapter_number}`}
              className="kindle-chapter-item"
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              {ChapterContent}
            </Link>
          );
        }

        return (
          <Link
            key={chapter.id}
            href={`/purchase/${bookId}`}
            className="kindle-chapter-item kindle-chapter-item-locked"
            style={{ animationDelay: `${index * 0.03}s` }}
          >
            {ChapterContent}
          </Link>
        );
      })}

      {/* Purchase prompt for locked chapters */}
      {!isBookFree && chapters.length > freePreviewCount && (
        <div className="kindle-chapter-purchase-prompt">
          <div className="kindle-chapter-purchase-icon">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="kindle-chapter-purchase-content">
            <h4>ඉතිරි පරිච්ඡේද {chapters.length - freePreviewCount} අගුළු හරින්න</h4>
            <p>සම්පූර්ණ කතාව කියවීමට පොත මිලදී ගන්න</p>
          </div>
          <Link href={`/purchase/${bookId}`} className="kindle-chapter-purchase-btn">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M6 5v1H4.667a1.75 1.75 0 00-1.743 1.598l-.826 9.5A1.75 1.75 0 003.84 19H16.16a1.75 1.75 0 001.743-1.902l-.826-9.5A1.75 1.75 0 0015.333 6H14V5a4 4 0 00-8 0zm4-2.5A2.5 2.5 0 007.5 5v1h5V5A2.5 2.5 0 0010 2.5zM7.5 10a2.5 2.5 0 005 0V8.75a.75.75 0 011.5 0V10a4 4 0 01-8 0V8.75a.75.75 0 011.5 0V10z"
                clipRule="evenodd"
              />
            </svg>
            <span>මිලදී ගන්න</span>
          </Link>
        </div>
      )}
    </div>
  );
}
