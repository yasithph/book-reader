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

interface RouteParams {
  params: Promise<{ bookId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await checkAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { bookId } = await params;
    const supabase = await createClient();

    const { data: book, error } = await supabase
      .from("books")
      .select("*")
      .eq("id", bookId)
      .single();

    if (error || !book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    return NextResponse.json({ book });
  } catch (error) {
    console.error("Error in admin books GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await checkAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { bookId } = await params;
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

    // Get current book to check published status change
    const { data: currentBook } = await supabase
      .from("books")
      .select("is_published")
      .eq("id", bookId)
      .single();

    const wasPublished = currentBook?.is_published;
    const nowPublished = is_published;

    const { data: book, error } = await supabase
      .from("books")
      .update({
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
        // Set published_at when first published
        ...(nowPublished && !wasPublished
          ? { published_at: new Date().toISOString() }
          : {}),
      })
      .eq("id", bookId)
      .select()
      .single();

    if (error) {
      console.error("Error updating book:", error);
      return NextResponse.json({ error: "Failed to update book" }, { status: 500 });
    }

    return NextResponse.json({ book });
  } catch (error) {
    console.error("Error in admin books PUT:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await checkAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { bookId } = await params;
    const supabase = createAdminClient();

    // Delete book (chapters will cascade due to FK)
    const { error } = await supabase
      .from("books")
      .delete()
      .eq("id", bookId);

    if (error) {
      console.error("Error deleting book:", error);
      return NextResponse.json({ error: "Failed to delete book" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in admin books DELETE:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
