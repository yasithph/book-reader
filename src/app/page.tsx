import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import type { Book } from "@/types";
import { KindleHomeContent } from "@/components/home/kindle-home-content";
import { BottomNav } from "@/components/layout/bottom-nav";

export const metadata = {
  title: "කශ්වි අමරසූරිය - Kashvi Amarasooriya",
  description: "කශ්වි අමරසූරියගේ සිංහල නවකතා එකතුව. Read Sinhala dark romance novels by Kashvi Amarasooriya.",
};

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

async function getBundles(): Promise<Bundle[]> {
  const supabase = await createClient();

  const { data: bundles, error } = await supabase
    .from("bundles")
    .select(`
      id,
      name_en,
      name_si,
      description_en,
      description_si,
      price_lkr,
      bundle_books (
        book_id,
        books (
          id,
          title_en,
          title_si,
          cover_image_url,
          price_lkr,
          is_published
        )
      )
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching bundles:", error);
    return [];
  }

  // Transform and filter bundles
  return (bundles || []).map((bundle: any) => {
    const books = bundle.bundle_books
      ?.map((bb: any) => bb.books)
      .filter((book: any) => book && book.is_published) || [];

    const originalPrice = books.reduce((sum: number, book: any) => sum + (book?.price_lkr || 0), 0);

    return {
      id: bundle.id,
      name_en: bundle.name_en,
      name_si: bundle.name_si,
      description_en: bundle.description_en,
      price_lkr: bundle.price_lkr,
      books: books.map((book: any) => ({
        id: book.id,
        title_en: book.title_en,
        title_si: book.title_si,
        cover_image_url: book.cover_image_url,
        price_lkr: book.price_lkr,
      })),
      original_price: originalPrice,
      savings: originalPrice - bundle.price_lkr,
      book_count: books.length,
    };
  }).filter((bundle: Bundle) => bundle.book_count >= 2);
}

// Format price helper
function formatPrice(price: number) {
  return `Rs. ${price.toLocaleString()}`;
}

// Public book card - minimal Kindle style
function PublicBookCard({ book, index }: { book: Book; index: number }) {
  return (
    <Link
      href={`/books/${book.id}`}
      className="landing-book-card"
      style={{ animationDelay: `${0.02 * index}s` }}
    >
      <div className="landing-book-cover">
        {book.cover_image_url ? (
          <img
            src={book.cover_image_url}
            alt={book.title_en}
            loading={index < 4 ? "eager" : "lazy"}
          />
        ) : (
          <div className="landing-book-cover-placeholder">
            {book.title_si.charAt(0)}
          </div>
        )}
        {book.is_free && <div className="landing-book-free-badge">Free</div>}
      </div>
      <div className="landing-book-info">
        <h3 className="landing-book-title">{book.title_si}</h3>
        <p className="landing-book-price">
          {book.is_free ? "නොමිලේ" : formatPrice(book.price_lkr)}
        </p>
      </div>
    </Link>
  );
}

// Public bundle card - minimal Kindle style
function PublicBundleCard({ bundle, index }: { bundle: Bundle; index: number }) {
  return (
    <Link
      href={`/bundles/${bundle.id}`}
      className="landing-bundle-card"
      style={{ animationDelay: `${0.05 * index}s` }}
    >
      {/* Stacked covers */}
      <div className="landing-bundle-covers">
        {bundle.books.slice(0, 3).map((book, i) => (
          <div
            key={book.id}
            className="landing-bundle-cover"
            style={{
              zIndex: 3 - i,
              transform: `translateX(${i * 12}px) rotate(${i * 3 - 3}deg)`,
            }}
          >
            {book.cover_image_url ? (
              <img src={book.cover_image_url} alt={book.title_en} />
            ) : (
              <div className="landing-bundle-cover-placeholder">
                {book.title_si?.charAt(0) || "B"}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bundle info */}
      <div className="landing-bundle-info">
        <h3 className="landing-bundle-name">{bundle.name_si || bundle.name_en}</h3>
        <p className="landing-bundle-count">{bundle.book_count} පොත්</p>
        <div className="landing-bundle-pricing">
          <span className="landing-bundle-original">{formatPrice(bundle.original_price)}</span>
          <span className="landing-bundle-price">{formatPrice(bundle.price_lkr)}</span>
        </div>
        {bundle.savings > 0 && (
          <span className="landing-bundle-savings">Save {formatPrice(bundle.savings)}</span>
        )}
      </div>
    </Link>
  );
}

// Featured book banner - dark gradient style
function FeaturedBookBanner({ book }: { book: Book }) {
  return (
    <Link href={`/books/${book.id}`} className="landing-featured-banner">
      <span className="landing-featured-badge">New</span>
      <div className="landing-featured-cover">
        {book.cover_image_url ? (
          <img src={book.cover_image_url} alt={book.title_en} />
        ) : (
          <div className="landing-featured-cover-placeholder">
            {book.title_si.charAt(0)}
          </div>
        )}
      </div>
      <div className="landing-featured-info">
        <h2 className="landing-featured-title">{book.title_si}</h2>
        <p className="landing-featured-subtitle">{book.title_en}</p>
        {book.description_si && (
          <p className="landing-featured-desc">
            {book.description_si.length > 100
              ? book.description_si.substring(0, 100) + "..."
              : book.description_si}
          </p>
        )}
        <span className="landing-featured-cta">
          {book.is_free ? "Read Now" : formatPrice(book.price_lkr)}
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

// Loading skeleton for public view
function LandingSkeleton() {
  return (
    <main className="landing-page">
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="landing-skeleton-text" style={{ width: '180px', height: '32px' }} />
          <div className="landing-skeleton-text" style={{ width: '120px', height: '16px', marginTop: '4px' }} />
        </div>
      </header>
      <div className="landing-content">
        <section className="landing-section">
          <div className="landing-featured-banner landing-skeleton-featured">
            <div className="landing-featured-cover">
              <div className="landing-skeleton-cover" />
            </div>
            <div className="landing-featured-info">
              <div className="landing-skeleton-text" style={{ width: '70%', height: '24px' }} />
              <div className="landing-skeleton-text" style={{ width: '50%', height: '14px', marginTop: '8px' }} />
            </div>
          </div>
        </section>
        <section className="landing-section">
          <div className="landing-book-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="landing-book-card landing-skeleton-card">
                <div className="landing-book-cover">
                  <div className="landing-skeleton-cover" />
                </div>
                <div className="landing-book-info">
                  <div className="landing-skeleton-text" style={{ width: '80%', height: '16px' }} />
                  <div className="landing-skeleton-text" style={{ width: '50%', height: '12px', marginTop: '6px' }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

// Loading skeleton for Kindle home (logged-in users)
function KindleHomeSkeleton() {
  return (
    <>
      <main className="kindle-home">
        {/* Featured Book Skeleton */}
        <section className="kindle-home-section">
          <div className="kindle-home-inner">
            <div className="kindle-featured-banner kindle-skeleton-featured">
              <div className="kindle-skeleton-badge" />
              <div className="kindle-featured-cover">
                <div className="kindle-skeleton-cover" />
              </div>
              <div className="kindle-featured-info">
                <div className="kindle-skeleton-title" />
                <div className="kindle-skeleton-subtitle" />
                <div className="kindle-skeleton-cta" />
              </div>
            </div>
          </div>
        </section>

        {/* All Books Grid Skeleton */}
        <section className="kindle-books-section">
          <div className="kindle-books-inner">
            <div className="kindle-skeleton-label" />
            <div className="kindle-book-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="kindle-book-card kindle-skeleton-card">
                  <div className="kindle-book-cover">
                    <div className="kindle-skeleton-book-cover" />
                  </div>
                  <div className="kindle-book-info">
                    <div className="kindle-skeleton-book-title" />
                    <div className="kindle-skeleton-book-author" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <BottomNav isLoggedIn={true} />
    </>
  );
}

// Public landing content
async function PublicLandingContent() {
  const [books, bundles] = await Promise.all([getBooks(), getBundles()]);

  if (books.length === 0 && bundles.length === 0) {
    return (
      <div className="landing-empty">
        <svg className="landing-empty-icon" viewBox="0 0 48 48" fill="none">
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
        <h2 className="landing-empty-title">Coming Soon</h2>
        <p className="landing-empty-text">New books will be available shortly</p>
      </div>
    );
  }

  const [featuredBook, ...otherBooks] = books;

  return (
    <div className="landing-content">
      {/* Featured Book */}
      {featuredBook && (
        <section className="landing-section">
          <FeaturedBookBanner book={featuredBook} />
        </section>
      )}

      {/* Bundle Deals */}
      {bundles.length > 0 && (
        <section className="landing-section">
          <p className="landing-section-label">Bundle Deals</p>
          <div className="landing-bundle-grid">
            {bundles.map((bundle, index) => (
              <PublicBundleCard key={bundle.id} bundle={bundle} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* All Books */}
      {otherBooks.length > 0 && (
        <section className="landing-section">
          <p className="landing-section-label">All Books</p>
          <div className="landing-book-grid">
            {otherBooks.map((book, index) => (
              <PublicBookCard key={book.id} book={book} index={index} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Get user's most recent reading session to continue where they left off
async function getLastReadingSession(userId: string) {
  const supabase = createAdminClient();

  // Get the most recent reading progress
  const { data: progress } = await supabase
    .from("reading_progress")
    .select(`
      book_id,
      completed_chapters,
      last_read_at,
      books!inner (
        id,
        is_published
      )
    `)
    .eq("user_id", userId)
    .order("last_read_at", { ascending: false })
    .limit(1)
    .single();

  if (!progress || !progress.last_read_at) return null;

  // Check if the book is still published
  // Handle both single object and array responses from Supabase
  const booksData = progress.books;
  const book = (Array.isArray(booksData) ? booksData[0] : booksData) as {
    id: string;
    is_published: boolean;
  } | undefined;
  if (!book?.is_published) return null;

  // Get all published chapter numbers for this book
  const { data: publishedChapters } = await supabase
    .from("chapters")
    .select("chapter_number")
    .eq("book_id", progress.book_id)
    .eq("is_published", true)
    .order("chapter_number", { ascending: true });

  if (!publishedChapters || publishedChapters.length === 0) {
    return null;
  }

  const publishedNumbers = publishedChapters.map(c => c.chapter_number);
  const completedChapters = progress.completed_chapters || [];

  let targetChapter: number;
  if (completedChapters.length === 0) {
    // No chapters completed - start at first published chapter
    targetChapter = publishedNumbers[0];
  } else {
    // Find the next published chapter after the highest completed
    const highestCompleted = Math.max(...completedChapters);
    const nextChapter = publishedNumbers.find(n => n > highestCompleted);
    if (!nextChapter) {
      // User has completed all published chapters - don't redirect
      return null;
    }
    targetChapter = nextChapter;
  }

  return {
    bookId: progress.book_id,
    chapterNumber: targetChapter,
    lastReadAt: progress.last_read_at,
  };
}

// Get user's purchased books and reading progress
async function getUserPurchasesAndProgress(userId: string) {
  const supabase = createAdminClient();

  // Get purchased book IDs
  const { data: purchases } = await supabase
    .from("purchases")
    .select("book_id")
    .eq("user_id", userId)
    .eq("status", "approved");

  // Get reading progress
  const { data: progress } = await supabase
    .from("reading_progress")
    .select("book_id, completed_chapters")
    .eq("user_id", userId);

  const purchasedBookIds = new Set((purchases || []).map((p) => p.book_id));
  const progressMap = new Map(
    (progress || []).map((p) => [p.book_id, p.completed_chapters || []])
  );

  return { purchasedBookIds, progressMap };
}

// Logged-in home content with Kindle design
async function LoggedInHomeContent() {
  const session = await getSession();
  const [books, bundles] = await Promise.all([getBooks(), getBundles()]);

  // Get user's purchases and progress
  const { purchasedBookIds, progressMap } = session
    ? await getUserPurchasesAndProgress(session.userId)
    : { purchasedBookIds: new Set<string>(), progressMap: new Map<string, number[]>() };

  // Convert to serializable formats for client component
  const purchasedIds = Array.from(purchasedBookIds);
  const progressData = Object.fromEntries(progressMap);

  return (
    <>
      <KindleHomeContent
        books={books}
        bundles={bundles}
        purchasedIds={purchasedIds}
        progressData={progressData}
      />
      <BottomNav isLoggedIn={true} />
    </>
  );
}

interface HomePageProps {
  searchParams: Promise<{ browse?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await getSession();
  const params = await searchParams;

  // Show Kindle-style interface for logged-in users
  if (session) {
    // Check if user wants to browse (explicit navigation to home)
    const wantsToBrowse = params.browse === "true";

    // If not explicitly browsing, check for active reading session
    if (!wantsToBrowse) {
      const lastSession = await getLastReadingSession(session.userId);
      if (lastSession) {
        // Redirect to continue reading
        redirect(`/read/${lastSession.bookId}/${lastSession.chapterNumber}`);
      }
    }

    return (
      <Suspense fallback={<KindleHomeSkeleton />}>
        <LoggedInHomeContent />
      </Suspense>
    );
  }

  // Show public landing page for non-logged-in users
  return (
    <main className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <h1 className="landing-title">කශ්වි අමරසූරිය</h1>
          <p className="landing-subtitle">Kashvi Amarasooriya</p>
        </div>
        <Link href="/auth" className="landing-login-btn">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M6 10a.75.75 0 01.75-.75h9.546l-1.048-.943a.75.75 0 111.004-1.114l2.5 2.25a.75.75 0 010 1.114l-2.5 2.25a.75.75 0 11-1.004-1.114l1.048-.943H6.75A.75.75 0 016 10z" clipRule="evenodd" />
          </svg>
          Sign In
        </Link>
      </header>

      {/* Content */}
      <Suspense fallback={<LandingSkeleton />}>
        <PublicLandingContent />
      </Suspense>
    </main>
  );
}
