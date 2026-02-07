import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { LibraryContent } from "./library-content";
import { BottomNav } from "@/components/layout/bottom-nav";

export const metadata = {
  title: "My Library",
  description: "Your personal collection of Sinhala novels",
};

interface LibraryBook {
  book_id: string;
  title_en: string;
  title_si: string;
  author_en: string;
  author_si: string;
  cover_image_url: string | null;
  total_chapters: number;
  current_chapter: number | null;
  completed_chapters: number[];
  last_read_at: string | null;
  purchased_at: string;
}

async function getLibraryBooks(userId: string): Promise<LibraryBook[]> {
  const supabase = createAdminClient();

  // Get user's purchased books with reading progress
  const { data: purchases, error: purchaseError } = await supabase
    .from("purchases")
    .select(`
      book_id,
      created_at,
      books (
        id,
        title_en,
        title_si,
        author_en,
        author_si,
        cover_image_url,
        total_chapters
      )
    `)
    .eq("user_id", userId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (purchaseError) {
    console.error("Error fetching purchases:", purchaseError);
    return [];
  }

  // Get reading progress for all books
  const { data: progress, error: progressError } = await supabase
    .from("reading_progress")
    .select("book_id, chapter_id, completed_chapters, last_read_at, chapters(chapter_number)")
    .eq("user_id", userId);

  if (progressError) {
    console.error("Error fetching progress:", progressError);
  }

  // Map progress to books
  const progressMap = new Map(
    (progress || []).map((p) => [p.book_id, p])
  );

  // Also get free books the user has started reading
  const { data: freeBooks, error: freeBooksError } = await supabase
    .from("books")
    .select("*")
    .eq("is_free", true)
    .eq("is_published", true);

  if (freeBooksError) {
    console.error("Error fetching free books:", freeBooksError);
  }

  // Get published chapter counts for all books
  const bookIds = [
    ...(purchases || []).map((p) => {
      const book = Array.isArray(p.books) ? p.books[0] : p.books;
      return book?.id;
    }).filter(Boolean),
    ...(freeBooks || []).map((b) => b.id),
  ];

  const publishedChapterCounts = new Map<string, number>();
  if (bookIds.length > 0) {
    const { data: chapters } = await supabase
      .from("chapters")
      .select("book_id")
      .in("book_id", bookIds)
      .eq("is_published", true);

    // Count published chapters per book
    for (const ch of chapters || []) {
      publishedChapterCounts.set(
        ch.book_id,
        (publishedChapterCounts.get(ch.book_id) || 0) + 1
      );
    }
  }

  // Combine purchased books
  const libraryBooks: LibraryBook[] = (purchases || [])
    .filter((p) => p.books)
    .map((p) => {
      // Handle both single object and array responses from Supabase
      const booksData = p.books;
      const book = (Array.isArray(booksData) ? booksData[0] : booksData) as {
        id: string;
        title_en: string;
        title_si: string;
        author_en: string;
        author_si: string;
        cover_image_url: string | null;
        total_chapters: number;
      };
      const bookProgress = progressMap.get(book.id);
      // Use published chapter count instead of total_chapters
      // If we have the count (even if 0), use it; otherwise fall back to total_chapters
      const totalPublished = publishedChapterCounts.has(book.id)
        ? publishedChapterCounts.get(book.id)!
        : book.total_chapters;

      return {
        book_id: book.id,
        title_en: book.title_en,
        title_si: book.title_si,
        author_en: book.author_en,
        author_si: book.author_si,
        cover_image_url: book.cover_image_url,
        total_chapters: totalPublished,
        current_chapter: (() => {
          if (!bookProgress) return null;
          const chapterFromProgress = Array.isArray(bookProgress.chapters)
            ? bookProgress.chapters[0]?.chapter_number
            : (bookProgress.chapters as { chapter_number: number } | null)?.chapter_number;
          if (chapterFromProgress) return chapterFromProgress;
          return bookProgress.completed_chapters?.length
            ? Math.min(Math.max(...bookProgress.completed_chapters) + 1, totalPublished)
            : 1;
        })(),
        completed_chapters: bookProgress?.completed_chapters || [],
        last_read_at: bookProgress?.last_read_at || null,
        purchased_at: p.created_at,
      };
    });

  // Add free books that have progress
  if (freeBooks) {
    for (const book of freeBooks) {
      const bookProgress = progressMap.get(book.id);
      if (bookProgress && !libraryBooks.find((lb) => lb.book_id === book.id)) {
        // Use published chapter count instead of total_chapters
        const totalPublished = publishedChapterCounts.has(book.id)
          ? publishedChapterCounts.get(book.id)!
          : book.total_chapters;

        libraryBooks.push({
          book_id: book.id,
          title_en: book.title_en,
          title_si: book.title_si,
          author_en: book.author_en,
          author_si: book.author_si,
          cover_image_url: book.cover_image_url,
          total_chapters: totalPublished,
          current_chapter: (() => {
            const chapterFromProgress = Array.isArray(bookProgress.chapters)
              ? bookProgress.chapters[0]?.chapter_number
              : (bookProgress.chapters as { chapter_number: number } | null)?.chapter_number;
            if (chapterFromProgress) return chapterFromProgress;
            return bookProgress.completed_chapters?.length
              ? Math.min(Math.max(...bookProgress.completed_chapters) + 1, totalPublished)
              : 1;
          })(),
          completed_chapters: bookProgress.completed_chapters || [],
          last_read_at: bookProgress.last_read_at,
          purchased_at: bookProgress.last_read_at || new Date().toISOString(),
        });
      }
    }
  }

  // Sort by: recently read books first, then unread books by purchase date
  return libraryBooks.sort((a, b) => {
    // If both have been read, sort by last_read_at
    if (a.last_read_at && b.last_read_at) {
      return new Date(b.last_read_at).getTime() - new Date(a.last_read_at).getTime();
    }
    // Read books come before unread books
    if (a.last_read_at && !b.last_read_at) return -1;
    if (!a.last_read_at && b.last_read_at) return 1;
    // Both unread: sort by purchased_at
    return new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime();
  });
}

export default async function LibraryPage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth?redirect=/library");
  }

  const books = await getLibraryBooks(session.userId);

  return (
    <>
      <LibraryContent books={books} />
      <BottomNav isLoggedIn={true} />
    </>
  );
}
