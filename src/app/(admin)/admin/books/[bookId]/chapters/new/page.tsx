import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChapterForm } from "../chapter-form";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ bookId: string }>;
}

async function getBookAndNextChapter(bookId: string) {
  const supabase = await createClient();

  const [bookRes, chaptersRes] = await Promise.all([
    supabase.from("books").select("id, title_en").eq("id", bookId).single(),
    supabase
      .from("chapters")
      .select("chapter_number")
      .eq("book_id", bookId)
      .order("chapter_number", { ascending: false })
      .limit(1),
  ]);

  if (bookRes.error || !bookRes.data) {
    return null;
  }

  const lastChapter = chaptersRes.data?.[0]?.chapter_number || 0;

  return {
    book: bookRes.data,
    nextChapterNumber: lastChapter + 1,
  };
}

export default async function NewChapterPage({ params }: PageProps) {
  const { bookId } = await params;
  const data = await getBookAndNextChapter(bookId);

  if (!data) {
    notFound();
  }

  return (
    <div className="admin-animate-in">
      <div className="admin-page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <Link
            href={`/admin/books/${bookId}`}
            className="admin-btn admin-btn-ghost admin-btn-sm"
            style={{ padding: "0.25rem 0.5rem" }}
          >
            ← Back to Book
          </Link>
        </div>
        <h1 className="admin-page-title">Add New Chapter</h1>
        <p className="admin-page-subtitle">{data.book.title_en}</p>
      </div>

      <ChapterForm bookId={bookId} nextChapterNumber={data.nextChapterNumber} />
    </div>
  );
}
