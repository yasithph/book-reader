import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import "@/styles/kindle.css";

interface BundlePageProps {
  params: Promise<{ bundleId: string }>;
}

interface BundleBook {
  id: string;
  title_en: string;
  title_si: string;
  author_en: string;
  author_si: string;
  cover_image_url: string | null;
  price_lkr: number;
  total_chapters: number;
}

interface Bundle {
  id: string;
  name_en: string;
  name_si: string | null;
  description_en: string | null;
  description_si: string | null;
  price_lkr: number;
  books: BundleBook[];
  original_price: number;
  savings: number;
}

async function getBundle(bundleId: string): Promise<Bundle | null> {
  const supabase = await createClient();

  const { data: bundle, error } = await supabase
    .from("bundles")
    .select(`
      id,
      name_en,
      name_si,
      description_en,
      description_si,
      price_lkr,
      bundle_books (
        books (
          id,
          title_en,
          title_si,
          author_en,
          author_si,
          cover_image_url,
          price_lkr,
          total_chapters,
          is_published
        )
      )
    `)
    .eq("id", bundleId)
    .eq("is_active", true)
    .single();

  if (error || !bundle) {
    return null;
  }

  const books = bundle.bundle_books
    ?.map((bb: any) => bb.books)
    .filter((book: any) => book && book.is_published) || [];

  const originalPrice = books.reduce((sum: number, book: any) => sum + (book?.price_lkr || 0), 0);

  return {
    id: bundle.id,
    name_en: bundle.name_en,
    name_si: bundle.name_si,
    description_en: bundle.description_en,
    description_si: bundle.description_si,
    price_lkr: bundle.price_lkr,
    books,
    original_price: originalPrice,
    savings: originalPrice - bundle.price_lkr,
  };
}

async function getUserBundlePurchaseStatus(userId: string | null, bundleId: string): Promise<boolean> {
  if (!userId) return false;

  const supabase = createAdminClient();

  // Check if user has purchased this bundle
  const { data } = await supabase
    .from("purchases")
    .select("id")
    .eq("user_id", userId)
    .eq("bundle_id", bundleId)
    .eq("status", "approved")
    .limit(1);

  return (data?.length || 0) > 0;
}

export async function generateMetadata({ params }: BundlePageProps) {
  const { bundleId } = await params;
  const bundle = await getBundle(bundleId);

  if (!bundle) {
    return { title: "Bundle Not Found" };
  }

  return {
    title: `${bundle.name_si || bundle.name_en} | කශ්වි අමරසූරිය`,
    description: bundle.description_en || `Get ${bundle.books.length} books at a special price`,
  };
}

export default async function BundlePage({ params }: BundlePageProps) {
  const { bundleId } = await params;
  const session = await getSession();

  const [bundle, hasPurchased] = await Promise.all([
    getBundle(bundleId),
    getUserBundlePurchaseStatus(session?.userId || null, bundleId),
  ]);

  if (!bundle) {
    notFound();
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const discountPercent = Math.round((bundle.savings / bundle.original_price) * 100);

  return (
    <main className="kindle-bundle-detail">
      {/* Header */}
      <header className="kindle-bundle-detail-header">
        <Link href="/?browse=true" className="kindle-bundle-detail-back">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
          <span>ආපසු</span>
        </Link>
      </header>

      <div className="kindle-bundle-detail-content">
        {/* Bundle Hero */}
        <div className="kindle-bundle-hero">
          {/* Stacked covers */}
          <div className="kindle-bundle-hero-covers">
            {bundle.books.slice(0, 3).map((book, index) => (
              <div
                key={book.id}
                className="kindle-bundle-hero-cover"
                style={{
                  zIndex: 3 - index,
                  transform: `translateX(${index * 24}px) rotate(${index * 5 - 5}deg)`,
                }}
              >
                {book.cover_image_url ? (
                  <img src={book.cover_image_url} alt={book.title_en} />
                ) : (
                  <div className="kindle-bundle-hero-cover-placeholder">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Savings badge */}
          {bundle.savings > 0 && (
            <div className="kindle-bundle-hero-badge">
              {discountPercent}% ඉතිරි
            </div>
          )}
        </div>

        {/* Bundle Info */}
        <div className="kindle-bundle-detail-info">
          <h1 className="kindle-bundle-detail-title">
            {bundle.name_si || bundle.name_en}
          </h1>
          {bundle.name_si && bundle.name_en && (
            <p className="kindle-bundle-detail-subtitle">{bundle.name_en}</p>
          )}

          <p className="kindle-bundle-detail-count">
            {bundle.books.length} පොත් ඇතුළත්
          </p>

          {(bundle.description_si || bundle.description_en) && (
            <div className="kindle-bundle-detail-desc">
              {bundle.description_si && <p>{bundle.description_si}</p>}
              {bundle.description_en && <p className="text-muted">{bundle.description_en}</p>}
            </div>
          )}

          {/* Pricing */}
          <div className="kindle-bundle-detail-pricing">
            <div className="kindle-bundle-detail-original">
              {formatPrice(bundle.original_price)}
            </div>
            <div className="kindle-bundle-detail-price">
              {formatPrice(bundle.price_lkr)}
            </div>
            {bundle.savings > 0 && (
              <div className="kindle-bundle-detail-savings">
                Rs. {bundle.savings.toLocaleString()} ඉතිරි
              </div>
            )}
          </div>

          {/* Action */}
          <div className="kindle-bundle-detail-actions">
            {hasPurchased ? (
              <div className="kindle-bundle-detail-owned">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span>ඔබ මෙම පැකේජය මිලදී ගෙන ඇත</span>
              </div>
            ) : session ? (
              <Link href={`/purchase/bundle/${bundle.id}`} className="kindle-bundle-detail-btn-primary">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 5v1H4.667a1.75 1.75 0 00-1.743 1.598l-.826 9.5A1.75 1.75 0 003.84 19H16.16a1.75 1.75 0 001.743-1.902l-.826-9.5A1.75 1.75 0 0015.333 6H14V5a4 4 0 00-8 0zm4-2.5A2.5 2.5 0 007.5 5v1h5V5A2.5 2.5 0 0010 2.5zM7.5 10a2.5 2.5 0 005 0V8.75a.75.75 0 011.5 0V10a4 4 0 01-8 0V8.75a.75.75 0 011.5 0V10z" clipRule="evenodd" />
                </svg>
                <span>මිලදී ගන්න — {formatPrice(bundle.price_lkr)}</span>
              </Link>
            ) : (
              <Link href={`/auth?redirect=/bundles/${bundle.id}`} className="kindle-bundle-detail-btn-primary">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clipRule="evenodd" />
                </svg>
                <span>පිවිසී මිලදී ගන්න</span>
              </Link>
            )}
          </div>
        </div>

        {/* Books in Bundle */}
        <section className="kindle-bundle-detail-books">
          <h2 className="kindle-bundle-detail-books-title">
            ඇතුළත් පොත්
            <span>Included Books</span>
          </h2>

          <div className="kindle-bundle-detail-books-list">
            {bundle.books.map((book) => (
              <Link
                key={book.id}
                href={`/books/${book.id}`}
                className="kindle-bundle-detail-book"
              >
                <div className="kindle-bundle-detail-book-cover">
                  {book.cover_image_url ? (
                    <img src={book.cover_image_url} alt={book.title_en} />
                  ) : (
                    <div className="kindle-bundle-detail-book-placeholder">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="kindle-bundle-detail-book-info">
                  <h3 className="kindle-bundle-detail-book-title">{book.title_si}</h3>
                  <p className="kindle-bundle-detail-book-subtitle">{book.title_en}</p>
                  <div className="kindle-bundle-detail-book-meta">
                    <span>{book.total_chapters} පරිච්ඡේද</span>
                    <span className="kindle-bundle-detail-book-price">
                      {formatPrice(book.price_lkr)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
