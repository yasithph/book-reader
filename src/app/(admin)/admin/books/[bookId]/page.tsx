import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookForm } from "../book-form";
import { ChapterList } from "./chapter-list";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ bookId: string }>;
}

async function getBook(bookId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function getChapters(bookId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chapters")
    .select("id, chapter_number, title_en, title_si, word_count, estimated_reading_time")
    .eq("book_id", bookId)
    .order("chapter_number", { ascending: true });

  if (error) {
    console.error("Error fetching chapters:", error);
    return [];
  }

  return data || [];
}

export default async function EditBookPage({ params }: PageProps) {
  const { bookId } = await params;
  const [book, chapters] = await Promise.all([
    getBook(bookId),
    getChapters(bookId),
  ]);

  if (!book) {
    notFound();
  }

  return (
    <div className="admin-animate-in">
      <div className="admin-page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <Link
            href="/admin/books"
            className="admin-btn admin-btn-ghost admin-btn-sm"
            style={{ padding: "0.25rem 0.5rem" }}
          >
            ← Back
          </Link>
        </div>
        <h1 className="admin-page-title">Edit Book</h1>
        <p className="admin-page-subtitle">{book.title_en}</p>
      </div>

      <div style={{ display: "grid", gap: "2rem" }}>
        <BookForm book={book} isEdit />

        {/* Chapters Section */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">
              Chapters
              <span
                style={{
                  marginLeft: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--muted-foreground)",
                }}
              >
                ({chapters.length})
              </span>
            </h2>
            <Link
              href={`/admin/books/${bookId}/chapters/new`}
              className="admin-btn admin-btn-primary admin-btn-sm"
            >
              + Add Chapter
            </Link>
          </div>
          <ChapterList bookId={bookId} chapters={chapters} />
        </div>
      </div>
    </div>
  );
}
