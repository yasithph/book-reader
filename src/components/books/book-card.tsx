"use client";

import * as React from "react";
import Link from "next/link";
import type { Book } from "@/types";

interface BookCardProps {
  book: Book;
  priority?: boolean;
}

export function BookCard({ book, priority = false }: BookCardProps) {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const estimatedReadingTime = Math.ceil(book.total_words / 200); // 200 words per minute

  return (
    <Link
      href={`/books/${book.id}`}
      className="group block"
    >
      <article className="book-card relative bg-white dark:bg-[#1f1a14] rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-[var(--auth-burgundy)]/10 dark:hover:shadow-black/30">
        {/* Book Cover */}
        <div className="aspect-[2/3] relative overflow-hidden bg-gradient-to-br from-[var(--auth-cream)] to-[var(--auth-cream-dark)] dark:from-[#2a241c] dark:to-[#1f1a14]">
          {book.cover_image_url && !imageError ? (
            <>
              {/* Placeholder shimmer */}
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              )}
              <img
                src={book.cover_image_url}
                alt={book.title_en}
                className={`
                  w-full h-full object-cover transition-all duration-500
                  group-hover:scale-105
                  ${imageLoaded ? "opacity-100" : "opacity-0"}
                `}
                loading={priority ? "eager" : "lazy"}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </>
          ) : (
            /* Fallback book cover design */
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-[var(--auth-burgundy)]/10 dark:bg-[var(--auth-gold)]/10 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-[var(--auth-burgundy)]/40 dark:text-[var(--auth-gold)]/40"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <p className="sinhala text-sm text-[var(--auth-ink)]/60 dark:text-[#F5F0E8]/50 line-clamp-3">
                {book.title_si}
              </p>
            </div>
          )}

          {/* Price badge */}
          <div className="absolute top-3 right-3">
            {book.is_free ? (
              <span className="px-3 py-1.5 text-xs font-medium bg-emerald-500 text-white rounded-full shadow-lg">
                Free
              </span>
            ) : (
              <span className="px-3 py-1.5 text-xs font-serif font-medium bg-white/90 dark:bg-[#1f1a14]/90 text-[var(--auth-burgundy)] dark:text-[var(--auth-gold)] rounded-full shadow-lg backdrop-blur-sm">
                {formatPrice(book.price_lkr)}
              </span>
            )}
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Book Info */}
        <div className="p-4 space-y-2">
          {/* Title */}
          <h3 className="font-serif text-lg font-medium text-[var(--auth-ink)] dark:text-[#F5F0E8] line-clamp-1 group-hover:text-[var(--auth-burgundy)] dark:group-hover:text-[var(--auth-gold)] transition-colors">
            {book.title_si}
          </h3>
          <p className="text-sm text-[var(--auth-ink)]/50 dark:text-[#F5F0E8]/40 line-clamp-1">
            {book.title_en}
          </p>

          {/* Author */}
          <p className="sinhala text-sm text-[var(--auth-ink)]/60 dark:text-[#F5F0E8]/50">
            {book.author_si}
          </p>

          {/* Meta info */}
          <div className="flex items-center gap-3 pt-2 text-xs text-[var(--auth-ink)]/40 dark:text-[#F5F0E8]/30">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06v-11a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3a8.963 8.963 0 00-4.25 1.065V16.82zM9.25 4.065A8.963 8.963 0 005 3c-.85 0-1.673.118-2.454.339A.75.75 0 002 4.06v11a.75.75 0 00.954.721A7.506 7.506 0 015 15.5c1.579 0 3.042.487 4.25 1.32V4.065z" />
              </svg>
              {book.total_chapters} chapters
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
              </svg>
              {estimatedReadingTime} min
            </span>
          </div>
        </div>

        {/* Decorative corner */}
        <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-[var(--auth-burgundy)]/0 group-hover:border-[var(--auth-burgundy)]/20 dark:group-hover:border-[var(--auth-gold)]/20 transition-colors duration-300 rounded-tl-xl" />
      </article>
    </Link>
  );
}
