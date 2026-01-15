import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { DeleteBookButton } from "./delete-button";

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

export default async function AdminBooksPage() {
  const books = await getBooks();

  return (
    <div className="admin-animate-in">
      <div className="admin-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="admin-page-title">Books</h1>
          <p className="admin-page-subtitle">
            {books.length} {books.length === 1 ? "book" : "books"} in the catalog
          </p>
        </div>
        <Link href="/admin/books/new" className="admin-btn admin-btn-primary">
          ➕ Add New Book
        </Link>
      </div>

      {/* Books Table */}
      {books.length > 0 ? (
        <div className="admin-card">
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
                            <span style={{ fontSize: "1.5rem" }}>📖</span>
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, marginBottom: "0.125rem" }}>
                            {book.title_en}
                          </div>
                          <div style={{ fontFamily: "var(--font-sinhala)", fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                            {book.title_si}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{book.author_en}</div>
                      <div style={{ fontFamily: "var(--font-sinhala)", fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                        {book.author_si}
                      </div>
                    </td>
                    <td>
                      {book.is_free ? (
                        <span className="admin-badge admin-badge-success">Free</span>
                      ) : (
                        <span style={{ fontWeight: 600, color: "var(--auth-burgundy)" }}>
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
          <div className="admin-empty-state">
            <div className="admin-empty-icon">📚</div>
            <div className="admin-empty-title">No books yet</div>
            <div className="admin-empty-text">
              Add your first book to get started
            </div>
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
    </div>
  );
}
