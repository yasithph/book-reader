"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

interface LibraryBook {
  book_id: string;
  title_en: string;
  title_si: string;
  author_en: string;
  author_si: string;
  cover_image_url: string | null;
  total_chapters: number;
  current_chapter: number | null;
  completed_chapters: number[];
  last_read_at: string | null;
  purchased_at: string;
}

type FilterType = "all" | "reading" | "completed";

interface LibraryContentProps {
  books: LibraryBook[];
}

export function LibraryContent({ books }: LibraryContentProps) {
  const [filter, setFilter] = React.useState<FilterType>("all");

  const filteredBooks = React.useMemo(() => {
    switch (filter) {
      case "reading":
        return books.filter(
          (b) => b.completed_chapters.length > 0 && b.completed_chapters.length < b.total_chapters
        );
      case "completed":
        return books.filter((b) => b.completed_chapters.length >= b.total_chapters);
      default:
        return books;
    }
  }, [books, filter]);

  const mostRecentBook = books.find((b) => b.last_read_at) || books[0];

  const getProgressPercent = (book: LibraryBook) => {
    if (book.total_chapters === 0) return 0;
    return Math.round((book.completed_chapters.length / book.total_chapters) * 100);
  };

  const formatLastRead = (date: string | null) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <main className="library-page min-h-screen bg-[var(--auth-cream)] dark:bg-[#0f0d0a]">
      {/* Header */}
      <header className="library-header">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[var(--auth-ink)] dark:text-[#F5F0E8]">
                <span className="block">My Library</span>
                <span className="sinhala block text-2xl sm:text-3xl opacity-60 mt-1">
                  මගේ පුස්තකාලය
                </span>
              </h1>
              <p className="mt-2 text-sm text-[var(--auth-ink)]/50 dark:text-[#F5F0E8]/40">
                {books.length} {books.length === 1 ? "book" : "books"} in your collection
              </p>
            </div>

            {/* Browse more link */}
            <Link
              href="/books"
              className="library-browse-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-serif text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              <span>Browse Books</span>
            </Link>
          </div>

          {/* Filter tabs */}
          {books.length > 0 && (
            <div className="library-filters mt-6">
              {(["all", "reading", "completed"] as FilterType[]).map((f) => (
                <button
                  key={f}
                  className={`library-filter-tab ${filter === f ? "library-filter-tab-active" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" && "All"}
                  {f === "reading" && "Reading"}
                  {f === "completed" && "Completed"}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        {books.length === 0 ? (
          /* Empty state */
          <div className="library-empty">
            <div className="library-empty-icon">
              <svg viewBox="0 0 48 48" fill="none" className="w-20 h-20">
                <path
                  d="M8 12C8 10.9 8.9 10 10 10H20C22.2 10 24 11.8 24 14V38C24 36.9 23.1 36 22 36H10C8.9 36 8 35.1 8 34V12Z"
                  fill="currentColor"
                  fillOpacity="0.1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M40 12C40 10.9 39.1 10 38 10H28C25.8 10 24 11.8 24 14V38C24 36.9 24.9 36 26 36H38C39.1 36 40 35.1 40 34V12Z"
                  fill="currentColor"
                  fillOpacity="0.05"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <h2 className="font-serif text-2xl font-medium text-[var(--auth-ink)] dark:text-[#F5F0E8] mb-2">
              Your library is empty
            </h2>
            <p className="text-[var(--auth-ink)]/50 dark:text-[#F5F0E8]/40 mb-6 max-w-sm text-center">
              Start building your collection by exploring our catalog of Sinhala novels
            </p>
            <Link href="/books" className="library-empty-btn">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" />
              </svg>
              <span>Browse Catalog</span>
            </Link>
          </div>
        ) : filteredBooks.length === 0 ? (
          /* No results for filter */
          <div className="library-empty">
            <p className="text-[var(--auth-ink)]/50 dark:text-[#F5F0E8]/40">
              No {filter} books found
            </p>
          </div>
        ) : (
          <>
            {/* Continue reading hero (only show on "all" filter) */}
            {filter === "all" && mostRecentBook && mostRecentBook.last_read_at && (
              <div className="library-continue-hero mb-8">
                <div className="library-continue-content">
                  <span className="library-continue-label">Continue Reading</span>
                  <h2 className="sinhala font-serif text-xl sm:text-2xl font-medium text-[var(--auth-ink)] dark:text-[#F5F0E8] mb-1">
                    {mostRecentBook.title_si}
                  </h2>
                  <p className="text-sm text-[var(--auth-ink)]/50 dark:text-[#F5F0E8]/40 mb-4">
                    Chapter {mostRecentBook.current_chapter || 1} of {mostRecentBook.total_chapters}
                  </p>
                  <Link
                    href={`/read/${mostRecentBook.book_id}/${mostRecentBook.current_chapter || 1}`}
                    className="library-continue-btn"
                  >
                    <span>Resume</span>
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
                <div className="library-continue-cover">
                  {mostRecentBook.cover_image_url ? (
                    <Image
                      src={mostRecentBook.cover_image_url}
                      alt={mostRecentBook.title_en}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[var(--auth-burgundy)]/20 to-[var(--auth-burgundy)]/5 dark:from-[var(--auth-gold)]/20 dark:to-[var(--auth-gold)]/5 flex items-center justify-center">
                      <span className="sinhala text-4xl font-serif text-[var(--auth-burgundy)]/30 dark:text-[var(--auth-gold)]/30">
                        {mostRecentBook.title_si.charAt(0)}
                      </span>
                    </div>
                  )}
                  {/* Progress ring overlay */}
                  <div className="library-continue-progress">
                    <CircularProgress percent={getProgressPercent(mostRecentBook)} size={48} />
                  </div>
                </div>
              </div>
            )}

            {/* Book grid */}
            <div className="library-grid">
              {filteredBooks.map((book, index) => (
                <Link
                  key={book.book_id}
                  href={`/read/${book.book_id}/${book.current_chapter || 1}`}
                  className="library-book-card"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Cover */}
                  <div className="library-book-cover">
                    {book.cover_image_url ? (
                      <Image
                        src={book.cover_image_url}
                        alt={book.title_en}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[var(--auth-burgundy)]/20 to-[var(--auth-burgundy)]/5 dark:from-[var(--auth-gold)]/20 dark:to-[var(--auth-gold)]/5 flex items-center justify-center">
                        <span className="sinhala text-3xl font-serif text-[var(--auth-burgundy)]/30 dark:text-[var(--auth-gold)]/30">
                          {book.title_si.charAt(0)}
                        </span>
                      </div>
                    )}

                    {/* Progress ring */}
                    <div className="library-book-progress">
                      <CircularProgress percent={getProgressPercent(book)} size={40} />
                    </div>

                    {/* Completed badge */}
                    {book.completed_chapters.length >= book.total_chapters && (
                      <div className="library-book-completed">
                        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="library-book-info">
                    <h3 className="sinhala font-medium text-[var(--auth-ink)] dark:text-[#F5F0E8] line-clamp-2 leading-snug">
                      {book.title_si}
                    </h3>
                    <p className="sinhala text-xs text-[var(--auth-ink)]/50 dark:text-[#F5F0E8]/40 mt-1 line-clamp-1">
                      {book.author_si}
                    </p>
                    <div className="library-book-meta mt-2">
                      <span className="text-xs">
                        {book.completed_chapters.length}/{book.total_chapters} chapters
                      </span>
                      {book.last_read_at && (
                        <span className="text-xs opacity-60">
                          {formatLastRead(book.last_read_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

// Circular progress component
function CircularProgress({ percent, size }: { percent: number; size: number }) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="circular-progress" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="circular-progress-svg">
        {/* Background circle */}
        <circle
          className="circular-progress-bg"
          strokeWidth={strokeWidth}
          fill="none"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className="circular-progress-bar"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <span className="circular-progress-text">{percent}%</span>
    </div>
  );
}
