import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";

// Helper to check admin
async function checkAdmin() {
  const session = await getSession();
  if (!session) return { error: "Unauthorized", status: 401 };

  const supabase = createAdminClient();
  const { data: user } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", session.userId)
    .single();

  if (!user) return { error: "Unauthorized", status: 401 };
  if (user.role !== "admin") return { error: "Forbidden", status: 403 };

  return { session, user };
}

// GET - List all bundles with their books
export async function GET() {
  try {
    const auth = await checkAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = createAdminClient();

    // Get all bundles with their books
    const { data: bundles, error } = await supabase
      .from("bundles")
      .select(`
        *,
        bundle_books (
          book_id,
          books (
            id,
            title_en,
            title_si,
            cover_image_url,
            price_lkr
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bundles:", error);
      return NextResponse.json({ error: "Failed to fetch bundles" }, { status: 500 });
    }

    // Transform the data to include calculated fields
    const bundlesWithCalculations = (bundles || []).map((bundle: any) => {
      const books = bundle.bundle_books?.map((bb: any) => bb.books).filter(Boolean) || [];
      const originalPrice = books.reduce((sum: number, book: any) => sum + (book?.price_lkr || 0), 0);

      return {
        ...bundle,
        books,
        original_price: originalPrice,
        savings: originalPrice - bundle.price_lkr,
        book_count: books.length,
      };
    });

    return NextResponse.json({ bundles: bundlesWithCalculations });
  } catch (error) {
    console.error("Error in bundles GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new bundle
export async function POST(request: NextRequest) {
  try {
    const auth = await checkAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { name_en, name_si, description_en, description_si, price_lkr, book_ids } = body;

    // Validate required fields
    if (!name_en || !price_lkr || !book_ids || book_ids.length < 2) {
      return NextResponse.json(
        { error: "Bundle requires a name, price, and at least 2 books" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Create the bundle
    const { data: bundle, error: bundleError } = await supabase
      .from("bundles")
      .insert({
        name_en: name_en.trim(),
        name_si: name_si?.trim() || null,
        description_en: description_en?.trim() || null,
        description_si: description_si?.trim() || null,
        price_lkr,
        is_active: true,
      })
      .select()
      .single();

    if (bundleError) {
      console.error("Error creating bundle:", bundleError);
      return NextResponse.json({ error: "Failed to create bundle" }, { status: 500 });
    }

    // Add books to the bundle
    const bundleBooks = book_ids.map((bookId: string) => ({
      bundle_id: bundle.id,
      book_id: bookId,
    }));

    const { error: booksError } = await supabase
      .from("bundle_books")
      .insert(bundleBooks);

    if (booksError) {
      console.error("Error adding books to bundle:", booksError);
      // Clean up the bundle if books failed to add
      await supabase.from("bundles").delete().eq("id", bundle.id);
      return NextResponse.json({ error: "Failed to add books to bundle" }, { status: 500 });
    }

    // Fetch the complete bundle with books
    const { data: completeBundle } = await supabase
      .from("bundles")
      .select(`
        *,
        bundle_books (
          book_id,
          books (
            id,
            title_en,
            title_si,
            cover_image_url,
            price_lkr
          )
        )
      `)
      .eq("id", bundle.id)
      .single();

    const books = completeBundle?.bundle_books?.map((bb: any) => bb.books).filter(Boolean) || [];
    const originalPrice = books.reduce((sum: number, book: any) => sum + (book?.price_lkr || 0), 0);

    return NextResponse.json({
      bundle: {
        ...completeBundle,
        books,
        original_price: originalPrice,
        savings: originalPrice - completeBundle.price_lkr,
        book_count: books.length,
      }
    });
  } catch (error) {
    console.error("Error in bundles POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
