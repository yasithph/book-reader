import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";

// POST - Mark badge as notified for current user
export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from("top_readers")
      .update({ badge_notified: true })
      .eq("user_id", session.userId);

    if (error) {
      console.error("Error updating badge_notified:", error);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in badge-notified POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
