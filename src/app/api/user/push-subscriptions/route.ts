import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";

/**
 * GET /api/user/push-subscriptions
 * Retrieves all push subscriptions for the current user
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching push subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch push subscriptions" },
      { status: 500 }
    );
  }

  return NextResponse.json({ subscriptions: data });
}

/**
 * POST /api/user/push-subscriptions
 * Saves a new push subscription for the current user
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { endpoint, keys, userAgent } = body;

  // Validate required fields
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json(
      { error: "Missing required subscription data" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Upsert subscription (insert or update if endpoint already exists)
  const { data, error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: session.userId,
        endpoint: endpoint,
        keys_p256dh: keys.p256dh,
        keys_auth: keys.auth,
        user_agent: userAgent || null,
        notifications_enabled: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "endpoint",
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (error) {
    console.error("Error saving push subscription:", error);
    return NextResponse.json(
      { error: "Failed to save push subscription" },
      { status: 500 }
    );
  }

  return NextResponse.json({ subscription: data });
}

/**
 * DELETE /api/user/push-subscriptions
 * Removes a push subscription by endpoint
 */
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get("endpoint");

  if (!endpoint) {
    return NextResponse.json(
      { error: "Missing endpoint parameter" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", session.userId)
    .eq("endpoint", endpoint);

  if (error) {
    console.error("Error deleting push subscription:", error);
    return NextResponse.json(
      { error: "Failed to delete push subscription" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
