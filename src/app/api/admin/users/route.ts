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

    const { data: users, error } = await supabase
      .from("users")
      .select(
        `
        id,
        phone,
        email,
        display_name,
        created_at,
        last_active_at,
        purchases:purchases!purchases_user_id_fkey (
          status,
          amount_lkr,
          purchase_group_id,
          bundle_id,
          book:books (
            id,
            title_en
          )
        )
      `
      )
      .eq("role", "user")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error("Error in users GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
