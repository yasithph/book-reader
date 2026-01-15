import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChapterForm } from "../chapter-form";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ bookId: string; chapterId: string }>;
}

async function getChapterAndBook(bookId: string, chapterId: string) {
  const supabase = await createClient();

  const [bookRes, chapterRes] = await Promise.all([
    supabase.from("books").select("id, title_en").eq("id", bookId).single(),
    supabase.from("chapters").select("*").eq("id", chapterId).single(),
  ]);

  if (bookRes.error || !bookRes.data || chapterRes.error || !chapterRes.data) {
    return null;
  }

  return {
    book: bookRes.data,
    chapter: chapterRes.data,
  };
}

export default async function EditChapterPage({ params }: PageProps) {
  const { bookId, chapterId } = await params;
  const data = await getChapterAndBook(bookId, chapterId);

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
        <h1 className="admin-page-title">Edit Chapter {data.chapter.chapter_number}</h1>
        <p className="admin-page-subtitle">{data.book.title_en}</p>
      </div>

      <ChapterForm bookId={bookId} chapter={data.chapter} isEdit />
    </div>
  );
}
