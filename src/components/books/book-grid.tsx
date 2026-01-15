import type { Book } from "@/types";
import { BookCard } from "./book-card";

interface BookGridProps {
  books: Book[];
  emptyMessage?: string;
}

export function BookGrid({ books, emptyMessage = "No books found" }: BookGridProps) {
  if (books.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--auth-burgundy)]/5 dark:bg-[var(--auth-gold)]/10 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-[var(--auth-burgundy)]/30 dark:text-[var(--auth-gold)]/30"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
        <p className="font-serif text-lg text-[var(--auth-ink)]/50 dark:text-[#F5F0E8]/40">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
      {books.map((book, index) => (
        <BookCard
          key={book.id}
          book={book}
          priority={index < 4}
        />
      ))}
    </div>
  );
}
