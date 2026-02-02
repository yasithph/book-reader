import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import type { Book } from "@/types";
import { IntroPageView } from "./intro-page-view";

const VALID_INTRO_PAGES = ["disclaimer", "copyright", "contents"] as const;
type IntroPageType = (typeof VALID_INTRO_PAGES)[number];

interface IntroPageProps {
  params: Promise<{
    bookId: string;
    page: string;
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
    .eq("is_published", true)
    .order("chapter_number", { ascending: true });

  if (error) return [];
  return data || [];
}

async function getUserPurchaseStatus(
  userId: string | null,
  bookId: string
): Promise<"approved" | "pending" | "rejected" | null> {
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

function isValidIntroPage(page: string): page is IntroPageType {
  return VALID_INTRO_PAGES.includes(page as IntroPageType);
}

export async function generateMetadata({ params }: IntroPageProps) {
  const { bookId, page } = await params;

  if (!isValidIntroPage(page)) {
    return { title: "Page Not Found" };
  }

  const book = await getBook(bookId);

  if (!book) {
    return { title: "Book Not Found" };
  }

  const pageTitle = {
    disclaimer: "Disclaimer",
    copyright: "Copyright",
    contents: "Table of Contents",
  }[page];

  return {
    title: `${pageTitle} - ${book.title_en}`,
    description: `${pageTitle} for ${book.title_en}`,
  };
}

export default async function IntroPage({ params }: IntroPageProps) {
  const { bookId, page } = await params;

  if (!isValidIntroPage(page)) {
    notFound();
  }

  const [book, session] = await Promise.all([getBook(bookId), getSession()]);

  if (!book) {
    notFound();
  }

  // Get chapters and purchase status in parallel
  const [allChapters, purchaseStatus] = await Promise.all([
    getAllChapters(bookId),
    getUserPurchaseStatus(session?.userId || null, bookId),
  ]);
  const hasFullAccess = book.is_free || purchaseStatus === "approved";

  return (
    <IntroPageView
      book={book}
      page={page}
      chapters={allChapters}
      hasFullAccess={hasFullAccess}
    />
  );
}
