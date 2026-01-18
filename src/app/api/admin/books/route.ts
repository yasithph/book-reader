import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, getCurrentUser } from "@/lib/auth";

// Helper to check admin using session-based auth
async function checkAdmin() {
  const session = await getSession();
  if (!session) return { error: "Unauthorized", status: 401 };

  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { error: "Forbidden", status: 403 };

  return { user };
}

export async function GET() {
  try {
    const auth = await checkAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = createAdminClient();

    // Fetch books with chapter count
    const { data: books, error } = await supabase
      .from("books")
      .select(`
        id, title_en, title_si, author_en, author_si, cover_image_url, price_lkr,
        chapters(count)
      `)
      .order("title_en");

    if (error) {
      console.error("Error fetching books:", error);
      return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
    }

    // Transform to include total_chapters
    const booksWithCount = (books || []).map((book) => ({
      id: book.id,
      title_en: book.title_en,
      title_si: book.title_si,
      author_en: book.author_en,
      author_si: book.author_si,
      cover_image_url: book.cover_image_url,
      price_lkr: book.price_lkr,
      total_chapters: book.chapters?.[0]?.count || 0,
    }));

    return NextResponse.json({ books: booksWithCount });
  } catch (error) {
    console.error("Error in admin books GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await checkAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const {
      title_en,
      title_si,
      description_en,
      description_si,
      author_en,
      author_si,
      cover_image_url,
      price_lkr,
      is_free,
      free_preview_chapters,
      is_published,
    } = body;

    // Validate required fields
    if (!title_en || !title_si || !author_en || !author_si) {
      return NextResponse.json(
        { error: "Title and author are required in both languages" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: book, error } = await supabase
      .from("books")
      .insert({
        title_en,
        title_si,
        description_en: description_en || null,
        description_si: description_si || null,
        author_en,
        author_si,
        cover_image_url: cover_image_url || null,
        price_lkr: is_free ? 0 : (price_lkr || 0),
        is_free: is_free || false,
        free_preview_chapters: free_preview_chapters || 2,
        is_published: is_published || false,
        published_at: is_published ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating book:", error);
      return NextResponse.json({ error: "Failed to create book" }, { status: 500 });
    }

    return NextResponse.json({ book });
  } catch (error) {
    console.error("Error in admin books POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
