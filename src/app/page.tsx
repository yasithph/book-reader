import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Book } from "@/types";

export const metadata = {
  title: "කශ්වි අමරසූරිය - Kashvi Amarasooriya",
  description: "කශ්වි අමරසූරියගේ සිංහල නවකතා එකතුව. Read Sinhala dark romance novels by Kashvi Amarasooriya.",
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

// Gold lotus flower icon
function LotusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C12 2 9 6 9 10C9 11.5 9.5 12.8 10.3 13.8C8.5 13.3 6.5 12 5 10C5 10 4 14 7 17C8.5 18.5 10.3 19 12 19C13.7 19 15.5 18.5 17 17C20 14 19 10 19 10C17.5 12 15.5 13.3 13.7 13.8C14.5 12.8 15 11.5 15 10C15 6 12 2 12 2Z" />
      <path d="M12 19C12 19 12 22 12 22" strokeWidth="2" stroke="currentColor" fill="none" />
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

// Featured book component - compact design
function FeaturedBook({ book }: { book: Book }) {
  return (
    <Link href={`/books/${book.id}`} className="featured-book-link">
      <article className="featured-book-compact">
        <div className="featured-book-cover-compact">
          {book.cover_image_url ? (
            <img src={book.cover_image_url} alt={book.title_en} />
          ) : (
            <div className="book-cover-placeholder">
              <BookIcon className="book-cover-placeholder-icon" />
            </div>
          )}
          <span className="featured-badge">නවතම</span>
        </div>
        <div className="featured-book-info">
          <h2 className="featured-book-title-compact">{book.title_si}</h2>
          <p className="featured-book-subtitle-compact">{book.title_en}</p>
          {book.description_si && (
            <p className="featured-book-desc-compact">
              {book.description_si.length > 120
                ? book.description_si.substring(0, 120) + "..."
                : book.description_si}
            </p>
          )}
          <span className="featured-book-cta-compact">
            කියවන්න
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
            </svg>
          </span>
        </div>
      </article>
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

export default function HomePage() {
  return (
    <main className="home-page">
      {/* Hero Header with Background Image */}
      <header className="hero-header">
        <div className="hero-bg">
          <img
            src="/images/generated/kerala-romance-header.png"
            alt=""
            className="hero-bg-image"
          />
          <div className="hero-overlay" />
        </div>

        <div className="hero-content">
          <LotusIcon className="hero-lotus" />
          <h1 className="hero-author-name">කශ්වි අමරසූරිය</h1>
          <p className="hero-author-name-en">Kashvi Amarasooriya</p>
          <p className="hero-tagline">Kerala Dark Romance</p>
        </div>
      </header>

      {/* Books Section */}
      <section className="books-section">
        <div className="books-section-header">
          <div className="section-title-wrapper">
            <span className="section-accent-line" />
            <h2 className="books-section-author">කශ්වි අමරසූරියගේ පොත්</h2>
            <span className="section-accent-line" />
          </div>
          <p className="books-section-subtitle">Books by Kashvi Amarasooriya</p>
        </div>

        <Suspense fallback={<BooksSkeleton />}>
          <BooksContent />
        </Suspense>
      </section>
    </main>
  );
}
