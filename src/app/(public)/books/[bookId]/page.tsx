import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import type { Book, Chapter } from "@/types";
import { ChapterList } from "./chapter-list";
import "@/styles/kindle.css";

interface BookPageProps {
  params: Promise<{ bookId: string }>;
}

async function getBook(bookId: string): Promise<Book | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .eq("is_published", true)
    .single();

  if (error) {
    console.error("Error fetching book:", error);
    return null;
  }

  return data;
}

async function getChapters(bookId: string): Promise<Chapter[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chapters")
    .select("id, book_id, chapter_number, title_en, title_si, word_count, estimated_reading_time, created_at, updated_at")
    .eq("book_id", bookId)
    .eq("is_published", true)  // Only show published chapters to readers
    .order("chapter_number", { ascending: true });

  if (error) {
    console.error("Error fetching chapters:", error);
    return [];
  }

  return (data || []).map(chapter => ({ ...chapter, content: "" }));
}

async function getPurchaseStatus(userId: string | null, bookId: string): Promise<"approved" | "pending" | "rejected" | null> {
  if (!userId) return null;

  const supabase = createAdminClient();

  const { data } = await supabase
    .from("purchases")
    .select("status")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .single();

  return data?.status || null;
}

export async function generateMetadata({ params }: BookPageProps) {
  const { bookId } = await params;
  const book = await getBook(bookId);

  if (!book) {
    return { title: "Book Not Found" };
  }

  return {
    title: `${book.title_si} | කශ්වි අමරසූරිය`,
    description: book.description_en || `Read ${book.title_en} by Kashvi Amarasooriya`,
  };
}

export default async function BookPage({ params }: BookPageProps) {
  const { bookId } = await params;
  const session = await getSession();

  const [book, chapters, purchaseStatus] = await Promise.all([
    getBook(bookId),
    getChapters(bookId),
    getPurchaseStatus(session?.userId || null, bookId),
  ]);

  if (!book) {
    notFound();
  }

  const hasPendingPurchase = purchaseStatus === "pending";
  const hasApprovedPurchase = purchaseStatus === "approved";

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const totalReadingTime = chapters.reduce((acc, ch) => acc + ch.estimated_reading_time, 0);
  const totalWords = chapters.reduce((acc, ch) => acc + ch.word_count, 0);

  return (
    <main className="kindle-book-detail">
      {/* Header with back button */}
      <header className="kindle-book-detail-header">
        <Link href="/?browse=true" className="kindle-book-detail-back">
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

      {/* Book content */}
      <div className="kindle-book-detail-content">
        {/* Cover section */}
        <div className="kindle-book-detail-cover-section">
          <div className="kindle-book-detail-cover">
            {book.cover_image_url ? (
              <img
                src={book.cover_image_url}
                alt={book.title_en}
              />
            ) : (
              <div className="kindle-book-detail-cover-placeholder">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Info section */}
        <div className="kindle-book-detail-info">
          {/* Title */}
          <div className="kindle-book-detail-titles">
            <h1 className="kindle-book-detail-title">{book.title_si}</h1>
            <p className="kindle-book-detail-subtitle">{book.title_en}</p>
          </div>

          {/* Stats */}
          <div className="kindle-book-detail-stats">
            <div className="kindle-book-detail-stat">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06v-11a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3a8.963 8.963 0 00-4.25 1.065V16.82zM9.25 4.065A8.963 8.963 0 005 3c-.85 0-1.673.118-2.454.339A.75.75 0 002 4.06v11a.75.75 0 00.954.721A7.506 7.506 0 015 15.5c1.579 0 3.042.487 4.25 1.32V4.065z" />
              </svg>
              <span>{book.total_chapters} පරිච්ඡේද</span>
            </div>
            <div className="kindle-book-detail-stat">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
              </svg>
              <span>විනාඩි {totalReadingTime}ක් කියවීමට</span>
            </div>
            <div className="kindle-book-detail-stat">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
              </svg>
              <span>වචන {totalWords.toLocaleString()}</span>
            </div>
          </div>

          {/* Description */}
          {(book.description_si || book.description_en) && (
            <div className="kindle-book-detail-description">
              {book.description_si && (
                <p className="kindle-book-detail-description-si">{book.description_si}</p>
              )}
              {book.description_en && (
                <p className="kindle-book-detail-description-en">{book.description_en}</p>
              )}
            </div>
          )}

          {/* Price and actions */}
          <div className="kindle-book-detail-actions">
            {book.is_free || hasApprovedPurchase ? (
              <Link href={`/read/${book.id}/intro/disclaimer`} className="kindle-book-detail-btn-primary">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06v-11a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3a8.963 8.963 0 00-4.25 1.065V16.82zM9.25 4.065A8.963 8.963 0 005 3c-.85 0-1.673.118-2.454.339A.75.75 0 002 4.06v11a.75.75 0 00.954.721A7.506 7.506 0 015 15.5c1.579 0 3.042.487 4.25 1.32V4.065z" />
                </svg>
                <span>{book.is_free ? "කියවීම අරඹන්න — නොමිලේ" : "කියවීම අරඹන්න"}</span>
              </Link>
            ) : hasPendingPurchase ? (
              <>
                <div className="kindle-book-detail-pending">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                  </svg>
                  <span className="kindle-book-detail-pending-title">Pending Approval</span>
                </div>
                {book.free_preview_chapters > 0 && (
                  <Link href={`/read/${book.id}/intro/disclaimer`} className="kindle-book-detail-btn-secondary">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                      <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    <span>පෙරදසුන ({book.free_preview_chapters} පරිච්ඡේද)</span>
                  </Link>
                )}
              </>
            ) : (
              <>
                <div className="kindle-book-detail-price">
                  {formatPrice(book.price_lkr)}
                </div>
                <div className="kindle-book-detail-btn-group">
                  {book.free_preview_chapters > 0 && (
                    <Link href={`/read/${book.id}/intro/disclaimer`} className="kindle-book-detail-btn-secondary">
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                        <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      <span>පෙරදසුන ({book.free_preview_chapters} පරිච්ඡේද)</span>
                    </Link>
                  )}
                  <Link href={`/purchase/${book.id}`} className="kindle-book-detail-btn-primary">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 5v1H4.667a1.75 1.75 0 00-1.743 1.598l-.826 9.5A1.75 1.75 0 003.84 19H16.16a1.75 1.75 0 001.743-1.902l-.826-9.5A1.75 1.75 0 0015.333 6H14V5a4 4 0 00-8 0zm4-2.5A2.5 2.5 0 007.5 5v1h5V5A2.5 2.5 0 0010 2.5zM7.5 10a2.5 2.5 0 005 0V8.75a.75.75 0 011.5 0V10a4 4 0 01-8 0V8.75a.75.75 0 011.5 0V10z" clipRule="evenodd" />
                    </svg>
                    <span>මිලදී ගන්න</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chapter list section */}
      <section className="kindle-book-detail-chapters">
        <div className="kindle-book-detail-chapters-header">
          <h2 className="kindle-book-detail-chapters-title">
            පරිච්ඡේද
            <span>Chapters</span>
          </h2>
        </div>

        <ChapterList
          chapters={chapters}
          bookId={book.id}
          freePreviewCount={book.free_preview_chapters}
          isBookFree={book.is_free}
          hasFullAccess={hasApprovedPurchase}
        />
      </section>
    </main>
  );
}
