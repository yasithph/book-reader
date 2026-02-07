import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import type { Book } from "@/types";
import { IntroPageView } from "./intro-page-view";

const VALID_INTRO_PAGES = ["disclaimer", "copyright", "thank_you", "offering", "contents"] as const;
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

/**
 * Get the list of active intro pages for a book.
 * Always includes disclaimer, copyright, contents.
 * Conditionally includes thank_you and offering if content exists.
 */
function getActiveIntroPages(book: Book): IntroPageType[] {
  const pages: IntroPageType[] = ["disclaimer", "copyright"];
  if (book.intro_thank_you) pages.push("thank_you");
  if (book.intro_offering) pages.push("offering");
  pages.push("contents");
  return pages;
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

  const pageTitle: Record<IntroPageType, string> = {
    disclaimer: "Disclaimer",
    copyright: "Copyright",
    thank_you: "Thank You",
    offering: "Offering",
    contents: "Table of Contents",
  };

  return {
    title: `${pageTitle[page]} - ${book.title_en}`,
    description: `${pageTitle[page]} for ${book.title_en}`,
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

  // If user navigates directly to a page that has no content, redirect to next valid page
  const activePages = getActiveIntroPages(book);
  if (!activePages.includes(page)) {
    // Find the next valid page after where this page would be
    const fullOrder: IntroPageType[] = ["disclaimer", "copyright", "thank_you", "offering", "contents"];
    const pageIndex = fullOrder.indexOf(page);
    const nextPage = fullOrder.slice(pageIndex + 1).find((p) => activePages.includes(p));
    redirect(`/read/${bookId}/intro/${nextPage || "contents"}`);
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
