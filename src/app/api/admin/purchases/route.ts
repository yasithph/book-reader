import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    // Check if requesting user is admin
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await getCurrentUser();
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Fetch purchases with related data
    // Group by purchase_group_id for bundles to avoid duplicates
    const { data: purchases, error } = await supabase
      .from("purchases")
      .select(`
        id,
        user_id,
        book_id,
        bundle_id,
        amount_lkr,
        status,
        created_at,
        purchase_group_id,
        users!purchases_user_id_fkey (
          phone,
          display_name
        ),
        books!purchases_book_id_fkey (
          title_en
        ),
        bundles (
          name_en
        )
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching purchases:", error);
      return NextResponse.json(
        { error: "Failed to fetch purchases" },
        { status: 500 }
      );
    }

    // Separate bundle purchases (dedupe by purchase_group_id) from individual purchases
    const seenGroups = new Set<string>();
    const bundlePurchases: any[] = [];
    const individualPurchases: any[] = [];

    for (const p of purchases || []) {
      if (p.purchase_group_id && p.bundle_id) {
        // Bundle purchase - only keep first record per group (all have same amount)
        if (!seenGroups.has(p.purchase_group_id)) {
          seenGroups.add(p.purchase_group_id);
          bundlePurchases.push(p);
        }
      } else {
        // Individual book purchase
        individualPurchases.push(p);
      }
    }

    // Transform individual purchases
    const transformedIndividual = individualPurchases.map((p: any) => ({
      id: p.id,
      user_id: p.user_id,
      book_id: p.book_id,
      bundle_id: null,
      amount_lkr: p.amount_lkr,
      status: p.status,
      created_at: p.created_at,
      user: p.users ? {
        phone: p.users.phone,
        display_name: p.users.display_name,
      } : null,
      book: p.books ? {
        title_en: p.books.title_en,
      } : null,
      bundle: null,
    }));

    // Transform bundle purchases (one entry per group, amount is already full bundle price)
    const transformedBundles = bundlePurchases.map((p: any) => ({
      id: p.id,
      user_id: p.user_id,
      book_id: null,
      bundle_id: p.bundle_id,
      amount_lkr: p.amount_lkr,
      status: p.status,
      created_at: p.created_at,
      user: p.users ? {
        phone: p.users.phone,
        display_name: p.users.display_name,
      } : null,
      book: null,
      bundle: p.bundles ? {
        name_en: p.bundles.name_en,
      } : null,
    }));

    // Combine and sort by date
    const transformedPurchases = [...transformedIndividual, ...transformedBundles]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ purchases: transformedPurchases });
  } catch (error) {
    console.error("Error in purchases GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
