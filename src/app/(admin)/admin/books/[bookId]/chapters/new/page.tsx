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
    <div className="chapter-page-wrapper">
      <Link href={`/admin/books/${bookId}`} className="chapter-back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        {data.book.title_en}
      </Link>
      <ChapterForm bookId={bookId} nextChapterNumber={data.nextChapterNumber} />
    </div>
  );
}
