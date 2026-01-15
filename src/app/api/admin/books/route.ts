import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Helper to check admin
async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized", status: 401 };

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") return { error: "Forbidden", status: 403 };

  return { user, userData };
}

export async function GET() {
  try {
    const auth = await checkAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = await createClient();
    const { data: books, error } = await supabase
      .from("books")
      .select("id, title_en, title_si, author_en, author_si, cover_image_url, price_lkr")
      .order("title_en");

    if (error) {
      console.error("Error fetching books:", error);
      return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
    }

    return NextResponse.json({ books });
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
