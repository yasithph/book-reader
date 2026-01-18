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
    <div className="chapter-page-wrapper">
      <Link href={`/admin/books/${bookId}`} className="chapter-back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        {data.book.title_en}
      </Link>
      <ChapterForm bookId={bookId} chapter={data.chapter} isEdit />
    </div>
  );
}
