"use client";

import Link from "next/link";
import type { Chapter } from "@/types";

interface ChapterListProps {
  chapters: Chapter[];
  bookId: string;
  freePreviewCount: number;
  isBookFree: boolean;
}

export function ChapterList({
  chapters,
  bookId,
  freePreviewCount,
  isBookFree,
}: ChapterListProps) {
  const formatReadingTime = (minutes: number) => {
    if (minutes < 60) return `විනාඩි ${minutes}`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `පැය ${hours} විනාඩි ${mins}`;
  };

  const isChapterAccessible = (chapterNumber: number) => {
    return isBookFree || chapterNumber <= freePreviewCount;
  };

  if (chapters.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem 1.5rem',
        color: 'var(--color-ink-muted)',
        fontFamily: 'var(--font-sinhala)',
      }}>
        පරිච්ඡේද ඉක්මනින් එකතු වේ...
      </div>
    );
  }

  return (
    <div className="chapter-list">
      {/* Show ALL chapters */}
      {chapters.map((chapter) => {
        const accessible = isChapterAccessible(chapter.chapter_number);
        const isFreePreview = !isBookFree && chapter.chapter_number <= freePreviewCount;

        const ChapterContent = (
          <>
            {/* Chapter number */}
            <div className="chapter-item-info">
              <span
                className="chapter-number"
                style={{ opacity: accessible ? 1 : 0.5 }}
              >
                {chapter.chapter_number}
              </span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    className="chapter-title"
                    style={{ opacity: accessible ? 1 : 0.6 }}
                  >
                    {chapter.title_si || chapter.title_en || `පරිච්ඡේදය ${chapter.chapter_number}`}
                  </span>
                  {isFreePreview && (
                    <span style={{
                      padding: '2px 8px',
                      fontSize: '0.6875rem',
                      fontWeight: 500,
                      background: 'rgba(139, 154, 125, 0.15)',
                      color: 'var(--color-sage)',
                      borderRadius: '4px',
                    }}>
                      නොමිලේ
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Meta and action */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="chapter-meta" style={{ opacity: accessible ? 1 : 0.5 }}>
                <span>වචන {chapter.word_count.toLocaleString()}</span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span>{formatReadingTime(chapter.estimated_reading_time)}</span>
              </div>

              {accessible ? (
                <svg
                  style={{ width: 20, height: 20, color: 'var(--color-terracotta)' }}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="chapter-lock-icon"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
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

        // Accessible chapters link to reader
        if (accessible) {
          return (
            <Link
              key={chapter.id}
              href={`/read/${bookId}/${chapter.chapter_number}`}
              className="chapter-item"
            >
              {ChapterContent}
            </Link>
          );
        }

        // Locked chapters link to purchase page
        return (
          <Link
            key={chapter.id}
            href={`/purchase/${bookId}`}
            className="chapter-item chapter-item-locked"
          >
            {ChapterContent}
          </Link>
        );
      })}

      {/* Purchase prompt for locked chapters */}
      {!isBookFree && chapters.length > freePreviewCount && (
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, var(--color-cream-soft) 0%, var(--color-cream) 100%)',
          border: '1px solid rgba(184, 97, 78, 0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{
              flexShrink: 0,
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(184, 97, 78, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg
                style={{ width: 24, height: 24, color: 'var(--color-terracotta)' }}
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
            <div style={{ flex: 1 }}>
              <h4 style={{
                fontFamily: 'var(--font-sinhala)',
                fontSize: '1.125rem',
                fontWeight: 500,
                color: 'var(--color-ink)',
                marginBottom: '0.5rem',
              }}>
                ඉතිරි පරිච්ඡේද {chapters.length - freePreviewCount} අගුළු හරින්න
              </h4>
              <p style={{
                fontFamily: 'var(--font-sinhala)',
                fontSize: '0.9375rem',
                color: 'var(--color-ink-muted)',
                marginBottom: '1rem',
                lineHeight: 1.6,
              }}>
                සම්පූර්ණ කතාව කියවීමට පොත මිලදී ගන්න
              </p>
              <Link
                href={`/purchase/${bookId}`}
                className="book-detail-btn-primary"
                style={{ display: 'inline-flex', fontSize: '0.9375rem' }}
              >
                <svg
                  style={{ width: 18, height: 18 }}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 5v1H4.667a1.75 1.75 0 00-1.743 1.598l-.826 9.5A1.75 1.75 0 003.84 19H16.16a1.75 1.75 0 001.743-1.902l-.826-9.5A1.75 1.75 0 0015.333 6H14V5a4 4 0 00-8 0zm4-2.5A2.5 2.5 0 007.5 5v1h5V5A2.5 2.5 0 0010 2.5zM7.5 10a2.5 2.5 0 005 0V8.75a.75.75 0 011.5 0V10a4 4 0 01-8 0V8.75a.75.75 0 011.5 0V10z"
                    clipRule="evenodd"
                  />
                </svg>
                පොත මිලදී ගන්න
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
