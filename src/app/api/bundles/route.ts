import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch active bundles with their books
    const { data: bundles, error } = await supabase
      .from("bundles")
      .select(`
        id,
        name_en,
        name_si,
        description_en,
        description_si,
        price_lkr,
        bundle_books (
          book_id,
          books (
            id,
            title_en,
            title_si,
            cover_image_url,
            price_lkr,
            is_published
          )
        )
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bundles:", error);
      return NextResponse.json({ bundles: [] });
    }

    // Transform and filter bundles (only include published books)
    const transformedBundles = (bundles || []).map((bundle: any) => {
      const books = bundle.bundle_books
        ?.map((bb: any) => bb.books)
        .filter((book: any) => book && book.is_published) || [];

      const originalPrice = books.reduce((sum: number, book: any) => sum + (book?.price_lkr || 0), 0);

      return {
        id: bundle.id,
        name_en: bundle.name_en,
        name_si: bundle.name_si,
        description_en: bundle.description_en,
        description_si: bundle.description_si,
        price_lkr: bundle.price_lkr,
        books: books.map((book: any) => ({
          id: book.id,
          title_en: book.title_en,
          title_si: book.title_si,
          cover_image_url: book.cover_image_url,
          price_lkr: book.price_lkr,
        })),
        original_price: originalPrice,
        savings: originalPrice - bundle.price_lkr,
        book_count: books.length,
      };
    }).filter((bundle: any) => bundle.book_count >= 2); // Only show bundles with at least 2 published books

    return NextResponse.json({ bundles: transformedBundles });
  } catch (error) {
    console.error("Error in bundles GET:", error);
    return NextResponse.json({ bundles: [] });
  }
}
