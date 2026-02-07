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
  const { action, rejection_reason, amount_lkr, created_at } = body;

  if (!["approve", "reject", "edit"].includes(action)) {
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

  // Handle edit action
  if (action === "edit") {
    const editData: Record<string, unknown> = {};
    if (amount_lkr !== undefined) editData.amount_lkr = amount_lkr;
    if (created_at !== undefined) editData.created_at = created_at;

    if (Object.keys(editData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    let updateError;

    if (purchase.purchase_group_id) {
      const { error } = await supabase
        .from("purchases")
        .update(editData)
        .eq("purchase_group_id", purchase.purchase_group_id);
      updateError = error;
    } else {
      const { error } = await supabase
        .from("purchases")
        .update(editData)
        .eq("id", purchaseId);
      updateError = error;
    }

    if (updateError) {
      console.error("Failed to edit purchase:", updateError);
      return NextResponse.json(
        { error: "Failed to edit purchase" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Purchase updated",
    });
  }

  // Approve/reject requires pending status
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
