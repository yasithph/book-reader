"use client";

import * as React from "react";
import Link from "next/link";
import { isBookDownloaded } from "@/lib/offline/indexed-db";

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
  const [downloadedBooks, setDownloadedBooks] = React.useState<Set<string>>(new Set());

  // Check which books are available offline
  React.useEffect(() => {
    async function checkDownloads() {
      const results = await Promise.all(
        books.map(async (book) => {
          const downloaded = await isBookDownloaded(book.book_id);
          return downloaded ? book.book_id : null;
        })
      );
      setDownloadedBooks(new Set(results.filter(Boolean) as string[]));
    }
    if (books.length > 0) {
      checkDownloads();
    }
  }, [books]);

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

  const mostRecentBook = books.find((b) => b.last_read_at && b.completed_chapters.length < b.total_chapters) || books[0];

  const getProgressPercent = (book: LibraryBook) => {
    if (book.total_chapters === 0) return 0;
    // Use the highest completed chapter as the actual progress
    // (if you're on chapter 3, you've read chapters 1 and 2)
    const highestCompleted = book.completed_chapters.length > 0
      ? Math.max(...book.completed_chapters)
      : 0;
    return Math.round((highestCompleted / book.total_chapters) * 100);
  };

  const isCompleted = (book: LibraryBook) => {
    return book.completed_chapters.length >= book.total_chapters;
  };

  return (
    <main className="kindle-library">
      {/* Header */}
      <header className="kindle-library-header">
        <div className="kindle-library-header-inner">
          <h1 className="kindle-library-title">Library</h1>
          <p className="kindle-library-subtitle">මගේ පුස්තකාලය</p>

          {/* Filter tabs */}
          {books.length > 0 && (
            <div className="kindle-filter-tabs">
              {(["all", "reading", "completed"] as FilterType[]).map((f) => (
                <button
                  key={f}
                  className={`kindle-filter-tab ${filter === f ? "kindle-filter-tab-active" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" && `All (${books.length})`}
                  {f === "reading" && "Reading"}
                  {f === "completed" && "Completed"}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {books.length === 0 ? (
        /* Empty state */
        <div className="kindle-empty-state">
          <svg className="kindle-empty-icon" viewBox="0 0 48 48" fill="none">
            <path
              d="M8 12C8 10.9 8.9 10 10 10H20C22.2 10 24 11.8 24 14V38C24 36.9 23.1 36 22 36H10C8.9 36 8 35.1 8 34V12Z"
              fill="currentColor"
              fillOpacity="0.3"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M40 12C40 10.9 39.1 10 38 10H28C25.8 10 24 11.8 24 14V38C24 36.9 24.9 36 26 36H38C39.1 36 40 35.1 40 34V12Z"
              fill="currentColor"
              fillOpacity="0.15"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          <h2 className="kindle-empty-title">Your library is empty</h2>
          <p className="kindle-empty-text">
            Start building your collection by exploring our catalog of Sinhala novels
          </p>
          <Link href="/" className="kindle-empty-btn">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06v-11a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3a8.963 8.963 0 00-4.25 1.065V16.82zM9.25 4.065A8.963 8.963 0 005 3c-.85 0-1.673.118-2.454.339A.75.75 0 002 4.06v11a.75.75 0 00.954.721A7.506 7.506 0 015 15.5c1.579 0 3.042.487 4.25 1.32V4.065z" />
            </svg>
            Browse Books
          </Link>
        </div>
      ) : filteredBooks.length === 0 ? (
        /* No results for filter */
        <div className="kindle-empty-state">
          <p className="kindle-empty-text">
            No {filter} books found
          </p>
        </div>
      ) : (
        <>
          {/* Continue Reading Section (only on "all" filter) */}
          {filter === "all" && mostRecentBook && mostRecentBook.last_read_at && !isCompleted(mostRecentBook) && (
            <section className="kindle-continue-section">
              <div className="kindle-continue-inner">
                <p className="kindle-section-label">Continue Reading</p>
                <Link
                  href={mostRecentBook.current_chapter ? `/read/${mostRecentBook.book_id}/${mostRecentBook.current_chapter}` : `/read/${mostRecentBook.book_id}/intro/disclaimer`}
                  className="kindle-continue-card"
                >
                  <div className="kindle-continue-cover">
                    {mostRecentBook.cover_image_url ? (
                      <img
                        src={mostRecentBook.cover_image_url}
                        alt={mostRecentBook.title_en}
                      />
                    ) : (
                      <div className="kindle-continue-cover-placeholder">
                        {mostRecentBook.title_si.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="kindle-continue-info">
                    <h3 className="kindle-continue-title">{mostRecentBook.title_si}</h3>
                    <div className="kindle-progress-bar">
                      <div
                        className="kindle-progress-fill"
                        style={{ width: `${getProgressPercent(mostRecentBook)}%` }}
                      />
                    </div>
                    <p className="kindle-progress-text">
                      {getProgressPercent(mostRecentBook)}% complete • Chapter {mostRecentBook.current_chapter || 1} of {mostRecentBook.total_chapters}
                    </p>
                  </div>
                </Link>
              </div>
            </section>
          )}

          {/* Book Grid */}
          <section className="kindle-books-section">
            <div className="kindle-books-inner">
              {filter === "all" && mostRecentBook && mostRecentBook.last_read_at && (
                <p className="kindle-section-label">Your Books</p>
              )}
              <div className="kindle-book-grid">
                {filteredBooks.map((book) => (
                  <Link
                    key={book.book_id}
                    href={book.current_chapter ? `/read/${book.book_id}/${book.current_chapter}` : `/read/${book.book_id}/intro/disclaimer`}
                    className="kindle-book-card"
                  >
                    <div className="kindle-book-cover">
                      {book.cover_image_url ? (
                        <img
                          src={book.cover_image_url}
                          alt={book.title_en}
                        />
                      ) : (
                        <div className="kindle-book-cover-placeholder">
                          {book.title_si.charAt(0)}
                        </div>
                      )}

                      {/* Progress ring or completed badge */}
                      {isCompleted(book) ? (
                        <div className="kindle-book-completed-badge">
                          <svg viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : book.completed_chapters.length > 0 ? (
                        <ProgressRing percent={getProgressPercent(book)} />
                      ) : null}

                      {/* Downloaded for offline badge */}
                      {downloadedBooks.has(book.book_id) && (
                        <div className="kindle-book-downloaded-badge">
                          <svg viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 3a.75.75 0 01.75.75v7.19l2.22-2.22a.75.75 0 111.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 111.06-1.06l2.22 2.22V3.75A.75.75 0 0110 3z" />
                            <path d="M3.75 14.25a.75.75 0 01.75.75v1.5c0 .414.336.75.75.75h9.5a.75.75 0 00.75-.75V15a.75.75 0 011.5 0v1.5A2.25 2.25 0 0114.75 18.75h-9.5A2.25 2.25 0 013 16.5V15a.75.75 0 01.75-.75z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="kindle-book-info">
                      <h3 className="kindle-book-title">{book.title_si}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

// Progress ring component
function ProgressRing({ percent }: { percent: number }) {
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="kindle-book-progress-ring">
      <svg viewBox="0 0 22 22">
        <circle
          className="progress-bg"
          cx="11"
          cy="11"
          r={radius}
        />
        <circle
          className="progress-bar"
          cx="11"
          cy="11"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
    </div>
  );
}
