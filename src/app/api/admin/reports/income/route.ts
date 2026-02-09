import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await getCurrentUser();
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Fetch all approved purchases with book and bundle details
    // Return raw records (NOT deduplicated) so the client can:
    // - Income: deduplicate by purchase_group_id for true income totals
    // - Books sold: count every book record including books within bundles
    const { data: purchases, error } = await supabase
      .from("purchases")
      .select(`
        id,
        book_id,
        bundle_id,
        amount_lkr,
        purchase_group_id,
        created_at,
        books!purchases_book_id_fkey (
          title_en
        ),
        bundles (
          name_en
        )
      `)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching report data:", error);
      return NextResponse.json(
        { error: "Failed to fetch report data" },
        { status: 500 }
      );
    }

    const records = (purchases || []).map((p: any) => ({
      id: p.id,
      book_id: p.book_id,
      bundle_id: p.bundle_id,
      amount_lkr: p.amount_lkr,
      purchase_group_id: p.purchase_group_id,
      created_at: p.created_at,
      book_title: p.books?.title_en || null,
      bundle_name: p.bundles?.name_en || null,
    }));

    return NextResponse.json({ records });
  } catch (error) {
    console.error("Error in reports/income GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
