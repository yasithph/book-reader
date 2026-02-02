"use client";

import Link from "next/link";

interface ChapterInfo {
  chapter_number: number;
  title_en: string | null;
  title_si: string | null;
}

interface TocContentProps {
  bookId: string;
  chapters: ChapterInfo[];
  freePreviewChapters: number;
  hasFullAccess: boolean;
  textColor: string;
  secondaryColor: string;
  accentColor: string;
}

export function TocContent({
  bookId,
  chapters,
  freePreviewChapters,
  hasFullAccess,
  textColor,
  secondaryColor,
  accentColor,
}: TocContentProps) {
  const isChapterAccessible = (chapterNum: number) => {
    return hasFullAccess || chapterNum <= freePreviewChapters;
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="text-4xl mb-4 block">📑</span>
        <h1
          className="sinhala text-2xl font-medium mb-2"
          style={{ color: textColor }}
        >
          පරිච්ඡේද
        </h1>
        <p
          className="text-sm"
          style={{ color: secondaryColor }}
        >
          Table of Contents
        </p>
      </div>

      {/* Chapter list */}
      <nav className="space-y-1">
        {chapters.map((chapter) => {
          const isAccessible = isChapterAccessible(chapter.chapter_number);
          const title = chapter.title_si || chapter.title_en || `Chapter ${chapter.chapter_number}`;

          if (!isAccessible) {
            return (
              <div
                key={chapter.chapter_number}
                className="flex items-center gap-3 px-4 py-3 rounded-lg"
                style={{ opacity: 0.45 }}
              >
                {/* Chapter number */}
                <span
                  className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium flex-shrink-0"
                  style={{
                    backgroundColor: `${textColor}08`,
                    color: secondaryColor,
                  }}
                >
                  {chapter.chapter_number}
                </span>
                {/* Title */}
                <span
                  className="flex-1 sinhala text-sm"
                  style={{ color: textColor }}
                >
                  {title}
                </span>
                {/* Lock icon */}
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: secondaryColor }}
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
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            >
              {/* Chapter number */}
              <span
                className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium flex-shrink-0"
                style={{
                  backgroundColor: `${accentColor}15`,
                  color: accentColor,
                }}
              >
                {chapter.chapter_number}
              </span>
              {/* Title */}
              <span
                className="flex-1 sinhala text-sm"
                style={{ color: textColor }}
              >
                {title}
              </span>
              {/* Arrow */}
              <svg
                className="w-4 h-4 flex-shrink-0"
                style={{ color: secondaryColor }}
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
          );
        })}
      </nav>
    </div>
  );
}
