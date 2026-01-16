import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, getCurrentUser } from "@/lib/auth";

interface ChapterInput {
  number: number;
  title_si: string;
  title_en: string;
  content: string;
}

// Count words in text (strips HTML tags first)
function countWords(text: string): number {
  if (!text) return 0;

  const plainText = text
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!plainText) return 0;

  return plainText
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

// Estimate reading time (avg 200 words per minute for Sinhala)
function estimateReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200));
}

// Helper to check admin
async function checkAdmin() {
  const session = await getSession();
  if (!session) return { error: "Unauthorized", status: 401 };

  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { error: "Forbidden", status: 403 };

  return { user };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await checkAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { bookId, newBookTitle, chapters } = body as {
      bookId: string | null;
      newBookTitle: string | null;
      chapters: ChapterInput[];
    };

    // Validate input
    if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
      return NextResponse.json(
        { error: "No chapters provided" },
        { status: 400 }
      );
    }

    if (!bookId && !newBookTitle) {
      return NextResponse.json(
        { error: "Either bookId or newBookTitle must be provided" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    let targetBookId = bookId;

    // Create new book if needed
    if (!bookId && newBookTitle) {
      const { data: newBook, error: bookError } = await supabase
        .from("books")
        .insert({
          title_en: newBookTitle,
          title_si: newBookTitle, // Same title for both languages initially
          author_en: "Unknown", // Can be updated later
          author_si: "Unknown",
          is_published: false,
          is_free: false,
          price_lkr: 0,
          free_preview_chapters: 2,
        })
        .select("id")
        .single();

      if (bookError) {
        console.error("Error creating book:", bookError);
        return NextResponse.json(
          { error: "Failed to create new book" },
          { status: 500 }
        );
      }

      targetBookId = newBook.id;
    }

    // Verify book exists
    const { data: book } = await supabase
      .from("books")
      .select("id")
      .eq("id", targetBookId!)
      .single();

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Insert chapters
    const chaptersToInsert = chapters.map((ch) => {
      const wordCount = countWords(ch.content);
      return {
        book_id: targetBookId,
        chapter_number: ch.number,
        title_en: ch.title_en?.trim() || null,
        title_si: ch.title_si?.trim() || null,
        content: ch.content,
        word_count: wordCount,
        estimated_reading_time: estimateReadingTime(wordCount),
      };
    });

    const { data: insertedChapters, error: chaptersError } = await supabase
      .from("chapters")
      .insert(chaptersToInsert)
      .select("id, chapter_number");

    if (chaptersError) {
      console.error("Error inserting chapters:", chaptersError);

      // Check for duplicate chapter numbers
      if (chaptersError.code === "23505") {
        return NextResponse.json(
          { error: "Some chapter numbers already exist for this book" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Failed to import chapters" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bookId: targetBookId,
      chaptersImported: insertedChapters?.length || 0,
    });
  } catch (error) {
    console.error("Error in import save:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save import" },
      { status: 500 }
    );
  }
}
