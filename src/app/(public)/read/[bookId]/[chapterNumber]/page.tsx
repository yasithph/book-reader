import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import type { Book, Chapter } from "@/types";
import { ReaderView } from "./reader-view";

interface ReaderPageProps {
  params: Promise<{
    bookId: string;
    chapterNumber: string;
  }>;
}

async function getBook(bookId: string): Promise<Book | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .eq("is_published", true)
    .single();

  if (error) return null;
  return data;
}

async function getChapter(
  bookId: string,
  chapterNumber: number
): Promise<Chapter | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("book_id", bookId)
    .eq("chapter_number", chapterNumber)
    .single();

  if (error) return null;
  return data;
}

async function getUserHasAccess(userId: string | null, bookId: string): Promise<boolean> {
  if (!userId) return false;

  const supabase = createAdminClient();

  // Check if user has purchased the book
  const { data } = await supabase
    .from("purchases")
    .select("id")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .eq("status", "approved")
    .single();

  return !!data;
}

export async function generateMetadata({ params }: ReaderPageProps) {
  const { bookId, chapterNumber } = await params;
  const chapterNum = parseInt(chapterNumber, 10);

  const [book, chapter] = await Promise.all([
    getBook(bookId),
    getChapter(bookId, chapterNum),
  ]);

  if (!book || !chapter) {
    return { title: "Chapter Not Found" };
  }

  const chapterTitle = chapter.title_si || chapter.title_en || `Chapter ${chapterNum}`;

  return {
    title: `${chapterTitle} - ${book.title_en}`,
    description: `Read ${chapterTitle} from ${book.title_en}`,
  };
}

export default async function ReaderPage({ params }: ReaderPageProps) {
  const { bookId, chapterNumber } = await params;
  const chapterNum = parseInt(chapterNumber, 10);

  if (isNaN(chapterNum) || chapterNum < 1) {
    notFound();
  }

  const [book, chapter, session] = await Promise.all([
    getBook(bookId),
    getChapter(bookId, chapterNum),
    getSession(),
  ]);

  if (!book || !chapter) {
    notFound();
  }

  // Check access
  const isPreviewChapter = chapterNum <= book.free_preview_chapters;
  const hasFullAccess = book.is_free || await getUserHasAccess(session?.userId || null, bookId);

  if (!isPreviewChapter && !hasFullAccess) {
    // Redirect to book page if trying to access locked chapter
    redirect(`/books/${bookId}`);
  }

  // Get chapter count for navigation
  const supabase = await createClient();
  const { count: totalChapters } = await supabase
    .from("chapters")
    .select("*", { count: "exact", head: true })
    .eq("book_id", bookId);

  const hasPreviousChapter = chapterNum > 1;
  const hasNextChapter = chapterNum < (totalChapters || 0);

  // Check if next chapter is accessible
  const nextChapterAccessible = hasNextChapter && (
    book.is_free ||
    hasFullAccess ||
    chapterNum + 1 <= book.free_preview_chapters
  );

  return (
    <ReaderView
      book={book}
      chapter={chapter}
      chapterNumber={chapterNum}
      totalChapters={totalChapters || 0}
      hasPreviousChapter={hasPreviousChapter}
      hasNextChapter={hasNextChapter}
      nextChapterAccessible={nextChapterAccessible}
      isPreviewMode={!hasFullAccess && !book.is_free}
      previewChaptersRemaining={book.free_preview_chapters - chapterNum}
      isLoggedIn={!!session}
    />
  );
}
