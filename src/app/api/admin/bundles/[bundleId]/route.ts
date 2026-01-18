import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

interface RouteParams {
  params: Promise<{ bundleId: string }>;
}

// GET - Get single bundle with books
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await checkAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { bundleId } = await params;

    if (!UUID_REGEX.test(bundleId)) {
      return NextResponse.json({ error: "Invalid bundle ID" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: bundle, error } = await supabase
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
      .eq("id", bundleId)
      .single();

    if (error || !bundle) {
      return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
    }

    const books = bundle.bundle_books?.map((bb: any) => bb.books).filter(Boolean) || [];
    const originalPrice = books.reduce((sum: number, book: any) => sum + (book?.price_lkr || 0), 0);

    return NextResponse.json({
      bundle: {
        ...bundle,
        books,
        original_price: originalPrice,
        savings: originalPrice - bundle.price_lkr,
        book_count: books.length,
      }
    });
  } catch (error) {
    console.error("Error in bundle GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update bundle
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await checkAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { bundleId } = await params;

    if (!UUID_REGEX.test(bundleId)) {
      return NextResponse.json({ error: "Invalid bundle ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name_en, name_si, description_en, description_si, price_lkr, is_active, book_ids } = body;

    const supabase = createAdminClient();

    // Update bundle details
    const updateData: any = {};
    if (name_en !== undefined) updateData.name_en = name_en.trim();
    if (name_si !== undefined) updateData.name_si = name_si?.trim() || null;
    if (description_en !== undefined) updateData.description_en = description_en?.trim() || null;
    if (description_si !== undefined) updateData.description_si = description_si?.trim() || null;
    if (price_lkr !== undefined) updateData.price_lkr = price_lkr;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { error: updateError } = await supabase
      .from("bundles")
      .update(updateData)
      .eq("id", bundleId);

    if (updateError) {
      console.error("Error updating bundle:", updateError);
      return NextResponse.json({ error: "Failed to update bundle" }, { status: 500 });
    }

    // Update books if provided
    if (book_ids && Array.isArray(book_ids)) {
      if (book_ids.length < 2) {
        return NextResponse.json(
          { error: "Bundle requires at least 2 books" },
          { status: 400 }
        );
      }

      // Delete existing bundle_books
      await supabase.from("bundle_books").delete().eq("bundle_id", bundleId);

      // Add new books
      const bundleBooks = book_ids.map((bookId: string) => ({
        bundle_id: bundleId,
        book_id: bookId,
      }));

      const { error: booksError } = await supabase
        .from("bundle_books")
        .insert(bundleBooks);

      if (booksError) {
        console.error("Error updating bundle books:", booksError);
        return NextResponse.json({ error: "Failed to update bundle books" }, { status: 500 });
      }
    }

    // Fetch updated bundle
    const { data: bundle } = await supabase
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
      .eq("id", bundleId)
      .single();

    const books = bundle?.bundle_books?.map((bb: any) => bb.books).filter(Boolean) || [];
    const originalPrice = books.reduce((sum: number, book: any) => sum + (book?.price_lkr || 0), 0);

    return NextResponse.json({
      bundle: {
        ...bundle,
        books,
        original_price: originalPrice,
        savings: originalPrice - (bundle?.price_lkr || 0),
        book_count: books.length,
      }
    });
  } catch (error) {
    console.error("Error in bundle PUT:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete bundle
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await checkAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { bundleId } = await params;

    if (!UUID_REGEX.test(bundleId)) {
      return NextResponse.json({ error: "Invalid bundle ID" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Check if bundle has any purchases
    const { count } = await supabase
      .from("purchases")
      .select("id", { count: "exact", head: true })
      .eq("bundle_id", bundleId);

    if (count && count > 0) {
      // Soft delete - just deactivate
      const { error } = await supabase
        .from("bundles")
        .update({ is_active: false })
        .eq("id", bundleId);

      if (error) {
        return NextResponse.json({ error: "Failed to deactivate bundle" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Bundle deactivated (has existing purchases)"
      });
    }

    // Hard delete if no purchases
    const { error } = await supabase
      .from("bundles")
      .delete()
      .eq("id", bundleId);

    if (error) {
      console.error("Error deleting bundle:", error);
      return NextResponse.json({ error: "Failed to delete bundle" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in bundle DELETE:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
