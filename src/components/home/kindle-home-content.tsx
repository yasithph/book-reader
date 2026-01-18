"use client";

import * as React from "react";
import Link from "next/link";
import type { Book } from "@/types";

interface BundleBook {
  id: string;
  title_en: string;
  title_si: string;
  cover_image_url: string | null;
  price_lkr: number;
}

interface Bundle {
  id: string;
  name_en: string;
  name_si: string | null;
  description_en: string | null;
  price_lkr: number;
  books: BundleBook[];
  original_price: number;
  savings: number;
  book_count: number;
}

interface KindleHomeContentProps {
  books: Book[];
  bundles?: Bundle[];
  purchasedIds?: string[];
  progressData?: Record<string, number[]>;
}

export function KindleHomeContent({
  books,
  bundles = [],
  purchasedIds = [],
  progressData = {},
}: KindleHomeContentProps) {
  // Convert to Sets/Maps for efficient lookup
  const purchasedBookIds = React.useMemo(() => new Set(purchasedIds), [purchasedIds]);
  const progressMap = React.useMemo(() => new Map(Object.entries(progressData)), [progressData]);

  // Helper to get the link for a book
  const getBookLink = (book: Book) => {
    const hasAccess = book.is_free || purchasedBookIds.has(book.id);
    if (hasAccess) {
      const completedChapters = progressMap.get(book.id) || [];
      const currentChapter = completedChapters.length > 0
        ? Math.min(Math.max(...completedChapters) + 1, book.total_chapters)
        : 1;
      return `/read/${book.id}/${currentChapter}`;
    }
    return `/books/${book.id}`;
  };
  if (books.length === 0) {
    return (
      <main className="kindle-home">
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
          <h2 className="kindle-empty-title">No books available</h2>
          <p className="kindle-empty-text">
            Check back soon for new releases
          </p>
        </div>
      </main>
    );
  }

  const [featuredBook, ...otherBooks] = books;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <main className="kindle-home">
      {/* Featured Book Banner */}
      {featuredBook && (
        <section className="kindle-home-section">
          <div className="kindle-home-inner">
            <Link href={getBookLink(featuredBook)} className="kindle-featured-banner">
              <span className="kindle-featured-badge">New</span>
              <div className="kindle-featured-cover">
                {featuredBook.cover_image_url ? (
                  <img
                    src={featuredBook.cover_image_url}
                    alt={featuredBook.title_en}
                  />
                ) : (
                  <div className="kindle-book-cover-placeholder">
                    {featuredBook.title_si.charAt(0)}
                  </div>
                )}
              </div>
              <div className="kindle-featured-info">
                <h2 className="kindle-featured-title">{featuredBook.title_si}</h2>
                <p className="kindle-featured-subtitle">{featuredBook.title_en}</p>
                {featuredBook.description_si && (
                  <p className="kindle-featured-desc">{featuredBook.description_si}</p>
                )}
                <span className="kindle-featured-cta">
                  {(featuredBook.is_free || purchasedBookIds.has(featuredBook.id))
                    ? (progressMap.get(featuredBook.id)?.length ? "Continue" : "Read")
                    : formatPrice(featuredBook.price_lkr)}
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Bundles Section */}
      {bundles.length > 0 && (
        <section className="kindle-bundles-section">
          <div className="kindle-bundles-inner">
            <p className="kindle-section-label">Bundle Deals</p>
            <div className="kindle-bundle-list">
              {bundles.map((bundle) => (
                <Link
                  key={bundle.id}
                  href={`/bundles/${bundle.id}`}
                  className="kindle-bundle-card"
                >
                  {/* Stacked book covers */}
                  <div className="kindle-bundle-covers">
                    {bundle.books.slice(0, 3).map((book, index) => (
                      <div
                        key={book.id}
                        className="kindle-bundle-cover"
                        style={{
                          zIndex: 3 - index,
                          transform: `translateX(${index * 16}px) rotate(${index * 4 - 4}deg)`,
                        }}
                      >
                        {book.cover_image_url ? (
                          <img src={book.cover_image_url} alt={book.title_en} />
                        ) : (
                          <div className="kindle-bundle-cover-placeholder">
                            {book.title_si?.charAt(0) || "B"}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Bundle info */}
                  <div className="kindle-bundle-info">
                    <h3 className="kindle-bundle-name">{bundle.name_si || bundle.name_en}</h3>
                    <p className="kindle-bundle-count">{bundle.book_count} පොත්</p>
                    <div className="kindle-bundle-pricing">
                      <span className="kindle-bundle-original">
                        Rs. {bundle.original_price.toLocaleString()}
                      </span>
                      <span className="kindle-bundle-price">
                        Rs. {bundle.price_lkr.toLocaleString()}
                      </span>
                      {bundle.savings > 0 && (
                        <span className="kindle-bundle-savings">
                          Rs. {bundle.savings.toLocaleString()} ඉතිරි
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Books Grid */}
      {otherBooks.length > 0 && (
        <section className="kindle-books-section">
          <div className="kindle-books-inner">
            <p className="kindle-section-label">All Books</p>
            <div className="kindle-book-grid">
              {otherBooks.map((book) => (
                <Link
                  key={book.id}
                  href={getBookLink(book)}
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

                    {/* Price badge */}
                    {book.is_free && (
                      <div className="kindle-book-free-badge">
                        Free
                      </div>
                    )}
                  </div>

                  <div className="kindle-book-info">
                    <h3 className="kindle-book-title">{book.title_si}</h3>
                    <p className="kindle-book-author">{book.author_si}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
