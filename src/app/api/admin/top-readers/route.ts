import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";

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

// GET - Fetch current top readers with user details
export async function GET() {
  try {
    const auth = await checkAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = createAdminClient();

    const { data: topReaders, error } = await supabase
      .from("top_readers")
      .select("*, users!top_readers_user_id_fkey(display_name, phone, avatar_url)")
      .order("rank", { ascending: true });

    if (error) {
      console.error("Error fetching top readers:", error);
      return NextResponse.json({ error: "Failed to fetch top readers" }, { status: 500 });
    }

    const formatted = (topReaders || []).map((tr: any) => ({
      ...tr,
      display_name: tr.users?.display_name,
      phone: tr.users?.phone,
      avatar_url: tr.users?.avatar_url,
    }));

    return NextResponse.json({ topReaders: formatted });
  } catch (error) {
    console.error("Error in top-readers GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Refresh the top readers leaderboard
export async function POST() {
  try {
    const auth = await checkAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = createAdminClient();

    const { error: rpcError } = await supabase.rpc("refresh_top_readers", { top_n: 20 });

    if (rpcError) {
      console.error("Error refreshing top readers:", rpcError);
      return NextResponse.json({ error: "Failed to refresh top readers" }, { status: 500 });
    }

    // Return refreshed list
    const { data: topReaders, error } = await supabase
      .from("top_readers")
      .select("*, users!top_readers_user_id_fkey(display_name, phone, avatar_url)")
      .order("rank", { ascending: true });

    if (error) {
      console.error("Error fetching refreshed top readers:", error);
      return NextResponse.json({ error: "Failed to fetch refreshed list" }, { status: 500 });
    }

    const formatted = (topReaders || []).map((tr: any) => ({
      ...tr,
      display_name: tr.users?.display_name,
      phone: tr.users?.phone,
      avatar_url: tr.users?.avatar_url,
    }));

    return NextResponse.json({ topReaders: formatted });
  } catch (error) {
    console.error("Error in top-readers POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
