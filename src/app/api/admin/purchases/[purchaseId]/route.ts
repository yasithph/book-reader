import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, getCurrentUser } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ purchaseId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { purchaseId } = await params;
  const body = await request.json();
  const { action, rejection_reason } = body;

  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Get the purchase
  const { data: purchase, error: fetchError } = await supabase
    .from("purchases")
    .select("*")
    .eq("id", purchaseId)
    .single();

  if (fetchError || !purchase) {
    return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
  }

  if (purchase.status !== "pending") {
    return NextResponse.json(
      { error: "Purchase is not pending" },
      { status: 400 }
    );
  }

  // For bundle purchases, update all purchases with the same purchase_group_id
  // For single book purchases, update just the one record
  const updateData = {
    status: action === "approve" ? "approved" : "rejected",
    rejection_reason: action === "reject" ? rejection_reason : null,
    reviewed_by: session.userId,
    reviewed_at: new Date().toISOString(),
  };

  let updateError;

  if (purchase.purchase_group_id) {
    // Bundle purchase - update all records in the group
    const { error } = await supabase
      .from("purchases")
      .update(updateData)
      .eq("purchase_group_id", purchase.purchase_group_id);
    updateError = error;
  } else {
    // Single book purchase - update just this record
    const { error } = await supabase
      .from("purchases")
      .update(updateData)
      .eq("id", purchaseId);
    updateError = error;
  }

  if (updateError) {
    console.error("Failed to update purchase:", updateError);
    return NextResponse.json(
      { error: "Failed to update purchase" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: action === "approve" ? "Purchase approved" : "Purchase rejected",
  });
}
