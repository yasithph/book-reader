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
    .eq("is_published", true)  // Only show published chapters
    .single();

  if (error) return null;
  return data;
}

interface ChapterInfo {
  chapter_number: number;
  title_en: string | null;
  title_si: string | null;
}

async function getAllChapters(bookId: string): Promise<ChapterInfo[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chapters")
    .select("chapter_number, title_en, title_si")
    .eq("book_id", bookId)
    .eq("is_published", true)  // Only show published chapters
    .order("chapter_number", { ascending: true });

  if (error) return [];
  return data || [];
}

async function getUserPurchaseStatus(userId: string | null, bookId: string): Promise<"approved" | "pending" | "rejected" | null> {
  if (!userId) return null;

  const supabase = createAdminClient();

  // Check if user has purchased the book
  const { data } = await supabase
    .from("purchases")
    .select("status")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .single();

  return data?.status || null;
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
  const purchaseStatus = await getUserPurchaseStatus(session?.userId || null, bookId);
  const hasFullAccess = book.is_free || purchaseStatus === "approved";
  const hasPendingPurchase = purchaseStatus === "pending";

  if (!isPreviewChapter && !hasFullAccess) {
    // Redirect to book page if trying to access locked chapter (unless pending)
    if (!hasPendingPurchase) {
      redirect(`/books/${bookId}`);
    }
  }

  // Get all chapters for navigation
  const allChapters = await getAllChapters(bookId);
  const totalChapters = allChapters.length;

  const hasPreviousChapter = chapterNum > 1;
  const hasNextChapter = chapterNum < totalChapters;

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
      totalChapters={totalChapters}
      allChapters={allChapters}
      hasPreviousChapter={hasPreviousChapter}
      hasNextChapter={hasNextChapter}
      nextChapterAccessible={nextChapterAccessible}
      hasFullAccess={hasFullAccess}
      isPreviewMode={!hasFullAccess && !book.is_free}
      previewChaptersRemaining={book.free_preview_chapters - chapterNum}
      isLoggedIn={!!session}
      hasPendingPurchase={hasPendingPurchase}
    />
  );
}
