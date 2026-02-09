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

    // Fetch all non-admin users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, created_at, last_active_at")
      .eq("role", "user");

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Fetch approved purchases
    const { data: purchases, error: purchasesError } = await supabase
      .from("purchases")
      .select("user_id, book_id, amount_lkr, purchase_group_id, bundle_id")
      .eq("status", "approved");

    if (purchasesError) {
      console.error("Error fetching purchases:", purchasesError);
      return NextResponse.json(
        { error: "Failed to fetch purchases" },
        { status: 500 }
      );
    }

    // Fetch reading progress with user info
    const { data: readingProgress, error: progressError } = await supabase
      .from("reading_progress")
      .select(`
        user_id,
        book_id,
        completed_chapters,
        last_read_at,
        users!reading_progress_user_id_fkey (
          display_name,
          phone,
          email
        )
      `);

    if (progressError) {
      console.error("Error fetching reading progress:", progressError);
      return NextResponse.json(
        { error: "Failed to fetch reading progress" },
        { status: 500 }
      );
    }

    // Fetch books for title lookup
    const { data: books, error: booksError } = await supabase
      .from("books")
      .select("id, title_en");

    if (booksError) {
      console.error("Error fetching books:", booksError);
      return NextResponse.json(
        { error: "Failed to fetch books" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: users || [],
      purchases: purchases || [],
      readingProgress: (readingProgress || []).map((rp: any) => ({
        user_id: rp.user_id,
        book_id: rp.book_id,
        completed_chapters: rp.completed_chapters,
        last_read_at: rp.last_read_at,
        display_name: rp.users?.display_name || null,
        phone: rp.users?.phone || null,
        email: rp.users?.email || null,
      })),
      books: books || [],
    });
  } catch (error) {
    console.error("Error in reports/users GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
