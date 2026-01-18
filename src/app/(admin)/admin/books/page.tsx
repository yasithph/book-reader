import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { DeleteBookButton } from "./delete-button";
import { PurchaseActions } from "../purchase-actions";
import { BundlesSection } from "./bundles-section";

export const dynamic = "force-dynamic";

interface Book {
  id: string;
  title_en: string;
  title_si: string;
  author_en: string;
  author_si: string;
  cover_image_url: string | null;
  price_lkr: number;
  is_free: boolean;
  is_published: boolean;
  total_chapters: number;
  created_at: string;
}

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
  description_si: string | null;
  price_lkr: number;
  is_active: boolean;
  books: BundleBook[];
  original_price: number;
  savings: number;
  book_count: number;
}

async function getStats() {
  const supabase = createAdminClient();

  const [usersRes, booksRes, purchasesRes, pendingPurchasesRes] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "user"),
    supabase.from("books").select("id", { count: "exact", head: true }),
    supabase
      .from("purchases")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("purchases")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  return {
    totalUsers: usersRes.count || 0,
    totalBooks: booksRes.count || 0,
    totalPurchases: purchasesRes.count || 0,
    pendingPurchases: pendingPurchasesRes.data || [],
  };
}

async function getBooks(): Promise<Book[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching books:", error);
    return [];
  }

  return data || [];
}

async function getBundles(): Promise<Bundle[]> {
  const supabase = createAdminClient();

  const { data: bundles, error } = await supabase
    .from("bundles")
    .select(`
      *,
      bundle_books (
        book_id,
        books (
          id,
          title_en,
          title_si,
          cover_image_url,
          price_lkr
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching bundles:", error);
    return [];
  }

  // Transform the data to include calculated fields
  return (bundles || []).map((bundle: any) => {
    const books = bundle.bundle_books?.map((bb: any) => bb.books).filter(Boolean) || [];
    const originalPrice = books.reduce((sum: number, book: any) => sum + (book?.price_lkr || 0), 0);

    return {
      ...bundle,
      books,
      original_price: originalPrice,
      savings: originalPrice - bundle.price_lkr,
      book_count: books.length,
    };
  });
}

export default async function AdminBooksPage() {
  const [books, stats, bundles] = await Promise.all([getBooks(), getStats(), getBundles()]);

  return (
    <div className="admin-animate-in">
      {/* Stats Grid */}
      <div className="admin-stats admin-stagger">
        <div className="admin-stat">
          <div className="admin-stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="admin-stat-value">{stats.totalUsers}</div>
          <div className="admin-stat-label">Users</div>
        </div>

        <div className="admin-stat">
          <div className="admin-stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          </div>
          <div className="admin-stat-value">{stats.totalBooks}</div>
          <div className="admin-stat-label">Books</div>
        </div>

        <div className="admin-stat">
          <div className="admin-stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div className="admin-stat-value">{stats.totalPurchases}</div>
          <div className="admin-stat-label">Purchases</div>
        </div>

        {stats.pendingPurchases.length > 0 && (
          <div className="admin-stat admin-stat--warning">
            <div className="admin-stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="admin-stat-value">{stats.pendingPurchases.length}</div>
            <div className="admin-stat-label">Pending</div>
          </div>
        )}
      </div>

      {/* Pending Approvals */}
      {stats.pendingPurchases.length > 0 && (
        <div className="admin-card admin-mb-3">
          <div className="admin-card-header">
            <h2 className="admin-card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Pending Approvals
              <span className="admin-card-badge">{stats.pendingPurchases.length}</span>
            </h2>
          </div>
          <div className="admin-card-body">
            <div className="admin-pending-list">
              {stats.pendingPurchases.map((purchase: any) => (
                <div key={purchase.id} className="admin-pending-item">
                  <div className="admin-pending-info">
                    <div className="admin-pending-title">Purchase Request</div>
                    <div className="admin-pending-meta">
                      LKR {purchase.amount_lkr} · {new Date(purchase.created_at).toLocaleDateString()}
                    </div>
                    {purchase.payment_reference && (
                      <div className="admin-pending-ref">Ref: {purchase.payment_reference}</div>
                    )}
                  </div>
                  <div className="admin-pending-actions">
                    <PurchaseActions
                      purchaseId={purchase.id}
                      paymentProofUrl={purchase.payment_proof_url}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="admin-page-header-actions">
        <div>
          <h1 className="admin-page-title">Books</h1>
          <p className="admin-page-subtitle">
            {books.length} {books.length === 1 ? "book" : "books"} in the catalog
          </p>
        </div>
        <Link href="/admin/books/new" className="admin-btn admin-btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Book
        </Link>
      </div>

      {/* Books - Mobile Grid */}
      {books.length > 0 && (
        <div className="admin-book-grid admin-stagger">
          {books.map((book) => (
            <Link key={book.id} href={`/admin/books/${book.id}`} className="admin-book-card">
              <div className="admin-book-cover">
                {book.cover_image_url ? (
                  <img src={book.cover_image_url} alt={book.title_en} />
                ) : (
                  <div className="admin-book-cover-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="admin-book-info">
                <div className="admin-book-title">{book.title_en}</div>
                <div className="admin-book-chapters">{book.total_chapters} chapters</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Books - Desktop Table */}
      {books.length > 0 ? (
        <div className="admin-card admin-hidden-mobile">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Author</th>
                  <th>Price</th>
                  <th>Chapters</th>
                  <th>Status</th>
                  <th style={{ width: "120px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          style={{
                            width: "48px",
                            height: "68px",
                            borderRadius: "4px",
                            overflow: "hidden",
                            background: "linear-gradient(135deg, #e8e4dc 0%, #d8d4cc 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          }}
                        >
                          {book.cover_image_url ? (
                            <img
                              src={book.cover_image_url}
                              alt={book.title_en}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 24, height: 24, color: "var(--admin-text-muted)" }}>
                              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                            </svg>
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, marginBottom: "0.125rem" }}>
                            {book.title_en}
                          </div>
                          <div style={{ fontFamily: "var(--font-sinhala)", fontSize: "0.8125rem", color: "var(--admin-text-muted)" }}>
                            {book.title_si}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{book.author_en}</div>
                      <div style={{ fontFamily: "var(--font-sinhala)", fontSize: "0.8125rem", color: "var(--admin-text-muted)" }}>
                        {book.author_si}
                      </div>
                    </td>
                    <td>
                      {book.is_free ? (
                        <span className="admin-badge admin-badge-success">Free</span>
                      ) : (
                        <span style={{ fontWeight: 600, color: "var(--admin-gold)" }}>
                          Rs. {book.price_lkr.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td>{book.total_chapters}</td>
                    <td>
                      <span className={`admin-badge ${book.is_published ? "admin-badge-success" : "admin-badge-warning"}`}>
                        {book.is_published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Link
                          href={`/admin/books/${book.id}`}
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                        >
                          Edit
                        </Link>
                        <DeleteBookButton bookId={book.id} bookTitle={book.title_en} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="admin-card">
          <div className="admin-card-empty">
            <div className="admin-card-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
            </div>
            <h3 className="admin-card-empty-title">No books yet</h3>
            <p className="admin-card-empty-text">
              Add your first book to get started
            </p>
            <Link
              href="/admin/books/new"
              className="admin-btn admin-btn-primary"
              style={{ marginTop: "1.5rem" }}
            >
              Add New Book
            </Link>
          </div>
        </div>
      )}

      {/* Bundles Section */}
      <BundlesSection
        initialBundles={bundles}
        allBooks={books.filter((b) => !b.is_free).map((b) => ({
          id: b.id,
          title_en: b.title_en,
          title_si: b.title_si,
          cover_image_url: b.cover_image_url,
          price_lkr: b.price_lkr,
        }))}
      />
    </div>
  );
}
