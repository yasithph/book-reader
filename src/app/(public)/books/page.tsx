import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Book } from "@/types";

export const metadata = {
  title: "සමන්ති විජේසිංහ - මගේ පොත් එකතුව",
  description: "සමන්ති විජේසිංහගේ සිංහල නවකතා එකතුව. Read Sinhala novels by Samanthi Wijesinghe.",
};

async function getBooks(): Promise<Book[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error fetching books:", error);
    return [];
  }

  return data || [];
}

// Decorative flourish SVG
function Flourish() {
  return (
    <svg
      className="author-flourish-icon"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2L9.5 9.5L2 12L9.5 14.5L12 22L14.5 14.5L22 12L14.5 9.5L12 2Z" opacity="0.6" />
    </svg>
  );
}

// Book icon for placeholder
function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

// Personal book card component
function PersonalBookCard({ book, index }: { book: Book; index: number }) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const estimatedReadingTime = Math.ceil(book.total_words / 200);

  return (
    <Link href={`/books/${book.id}`} className="block">
      <article className="book-card-personal">
        {/* Book Cover */}
        <div className="book-cover-wrapper">
          {book.cover_image_url ? (
            <img
              src={book.cover_image_url}
              alt={book.title_en}
              className="book-cover-image"
              loading={index < 4 ? "eager" : "lazy"}
            />
          ) : (
            <div className="book-cover-placeholder">
              <BookIcon className="book-cover-placeholder-icon" />
              <p className="book-cover-placeholder-title">{book.title_si}</p>
            </div>
          )}

          {/* Price badge */}
          <div className={`book-price-badge ${book.is_free ? "book-price-badge-free" : "book-price-badge-paid"}`}>
            {book.is_free ? "නොමිලේ" : formatPrice(book.price_lkr)}
          </div>
        </div>

        {/* Book Info */}
        <div className="book-info">
          <h3 className="book-title-sinhala">{book.title_si}</h3>
          <p className="book-title-english">{book.title_en}</p>

          <div className="book-meta">
            <span className="book-meta-item">
              <svg className="book-meta-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06v-11a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3a8.963 8.963 0 00-4.25 1.065V16.82zM9.25 4.065A8.963 8.963 0 005 3c-.85 0-1.673.118-2.454.339A.75.75 0 002 4.06v11a.75.75 0 00.954.721A7.506 7.506 0 015 15.5c1.579 0 3.042.487 4.25 1.32V4.065z" />
              </svg>
              {book.total_chapters} පරිච්ඡේද
            </span>
            <span className="book-meta-item">
              <svg className="book-meta-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
              </svg>
              {estimatedReadingTime} min
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// Featured book component
function FeaturedBook({ book }: { book: Book }) {
  return (
    <Link href={`/books/${book.id}`} className="block">
      <div className="featured-book">
        <div className="featured-book-cover">
          {book.cover_image_url ? (
            <img src={book.cover_image_url} alt={book.title_en} />
          ) : (
            <div className="book-cover-placeholder">
              <BookIcon className="book-cover-placeholder-icon" />
            </div>
          )}
        </div>
        <div className="featured-book-content">
          <span className="featured-book-label">නවතම පොත</span>
          <h2 className="featured-book-title">{book.title_si}</h2>
          <p className="featured-book-subtitle">{book.title_en}</p>
          {book.description_si && (
            <p className="featured-book-description">
              {book.description_si.length > 150
                ? book.description_si.substring(0, 150) + "..."
                : book.description_si}
            </p>
          )}
          <span className="featured-book-cta">
            කියවන්න
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

// Loading skeleton
function BooksSkeleton() {
  return (
    <div className="book-collection">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="book-card-personal" style={{ opacity: 1, animation: 'none' }}>
          <div className="book-cover-wrapper skeleton" />
          <div className="book-info">
            <div className="skeleton" style={{ height: '1.25rem', width: '80%', marginBottom: '0.5rem', borderRadius: '4px' }} />
            <div className="skeleton" style={{ height: '1rem', width: '60%', marginBottom: '0.75rem', borderRadius: '4px' }} />
            <div className="skeleton" style={{ height: '0.75rem', width: '40%', borderRadius: '4px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Books content component
async function BooksContent() {
  const books = await getBooks();

  if (books.length === 0) {
    return (
      <div className="books-empty">
        <div className="books-empty-icon">
          <BookIcon />
        </div>
        <p className="books-empty-text">පොත් ඉක්මනින් එකතු වේ...</p>
      </div>
    );
  }

  // Get the most recent book as featured
  const [featuredBook, ...otherBooks] = books;

  return (
    <>
      {/* Featured Book */}
      {featuredBook && (
        <FeaturedBook book={featuredBook} />
      )}

      {/* Other Books Grid */}
      {otherBooks.length > 0 && (
        <div className="book-collection">
          {otherBooks.map((book, index) => (
            <PersonalBookCard key={book.id} book={book} index={index} />
          ))}
        </div>
      )}
    </>
  );
}

export default function BooksPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-cream)' }}>
      {/* Author Welcome Section */}
      <section className="author-section">
        {/* Decorative flourish */}
        <div className="author-flourish">
          <div className="author-flourish-line" />
          <Flourish />
          <div className="author-flourish-line" />
        </div>

        {/* Author avatar placeholder */}
        <div className="author-avatar">
          <span className="author-avatar-placeholder">ස</span>
        </div>

        {/* Author name */}
        <h1 className="author-name-sinhala">සමන්ති විජේසිංහ</h1>

        {/* Welcome message */}
        <p className="author-welcome">
          මගේ නවකතා එකතුවට සාදරයෙන් පිළිගනිමු. මෙහි ඔබට මගේ කතා කියවා
          භුක්ති විඳිය හැකිය.
        </p>
      </section>

      {/* Decorative divider */}
      <div className="books-divider">
        <div className="books-divider-line" />
        <div className="books-divider-dot" />
        <div className="books-divider-line" />
      </div>

      {/* Books Section */}
      <section className="books-section">
        <div className="books-section-header">
          <h2 className="books-section-title">මගේ පොත්</h2>
          <p className="books-section-subtitle">My Collection</p>
        </div>

        <Suspense fallback={<BooksSkeleton />}>
          <BooksContent />
        </Suspense>
      </section>
    </main>
  );
}
