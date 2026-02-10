import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, getCurrentUser } from "@/lib/auth";
import { sendSMS } from "@/lib/textit/client";
import { sendEmail } from "@/lib/resend/client";

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
  const updateData: Record<string, unknown> = {
    status: action === "approve" ? "approved" : "rejected",
    rejection_reason: action === "reject" ? rejection_reason : null,
    reviewed_by: session.userId,
    reviewed_at: new Date().toISOString(),
  };

  // Allow changing the purchase date when approving
  if (action === "approve" && created_at) {
    const parsedDate = new Date(created_at);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    if (parsedDate > new Date()) {
      return NextResponse.json({ error: "Date cannot be in the future" }, { status: 400 });
    }
    updateData.created_at = parsedDate.toISOString();
  }

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

  // Send notification to user on approval
  if (action === "approve") {
    try {
      // Fetch user contact info
      const { data: purchaseUser } = await supabase
        .from("users")
        .select("phone, email")
        .eq("id", purchase.user_id)
        .single();

      if (purchaseUser) {
        // Fetch book/bundle titles for this purchase
        let itemTitles: string[] = [];
        if (purchase.purchase_group_id) {
          const { data: groupPurchases } = await supabase
            .from("purchases")
            .select("books!purchases_book_id_fkey(title_en), bundles(name_en)")
            .eq("purchase_group_id", purchase.purchase_group_id);
          const bundleName = (groupPurchases as any)?.[0]?.bundles?.name_en;
          if (bundleName) {
            itemTitles = [bundleName];
          } else {
            itemTitles = (groupPurchases || [])
              .map((p: any) => p.books?.title_en)
              .filter(Boolean);
          }
        } else {
          const { data: bookData } = await supabase
            .from("books")
            .select("title_en")
            .eq("id", purchase.book_id)
            .single();
          if (bookData?.title_en) itemTitles = [bookData.title_en];
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bookreader.lk";
        const itemList = itemTitles.join(", ") || "your purchase";

        if (purchaseUser.phone) {
          await sendSMS({
            to: purchaseUser.phone,
            text: `Your purchase of ${itemList} has been approved on Meera! Login to start reading: ${appUrl}/auth`,
            ref: `approval-${purchaseId}`,
          });
        } else if (purchaseUser.email) {
          await sendEmail({
            to: purchaseUser.email,
            subject: "Your purchase has been approved!",
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:8px;overflow:hidden;">
    <tr>
      <td style="padding:32px 24px;text-align:center;">
        <h1 style="margin:0 0 8px;font-size:20px;color:#1a1a1a;">Purchase Approved!</h1>
        <p style="margin:0 0 16px;font-size:14px;color:#666;">ඔබේ මිලදී ගැනීම අනුමත කර ඇත!</p>
        <p style="margin:0 0 16px;font-size:14px;color:#333;">
          Your purchase of <strong>${itemList}</strong> has been approved.
        </p>
        <a href="${appUrl}/auth" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">
          Sign In to Start Reading
        </a>
      </td>
    </tr>
  </table>
</body>
</html>`.trim(),
            text: `Your purchase of ${itemList} has been approved on Meera! Login to start reading: ${appUrl}/auth`,
          });
        }
      }
    } catch (notifError) {
      // Don't fail the approval if notification fails
      console.error("Failed to send approval notification:", notifError);
    }
  }

  return NextResponse.json({
    success: true,
    message: action === "approve" ? "Purchase approved" : "Purchase rejected",
  });
}

export async function DELETE(
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

  let deleteError;

  if (purchase.purchase_group_id) {
    // Bundle purchase - delete all records in the group
    const { error } = await supabase
      .from("purchases")
      .delete()
      .eq("purchase_group_id", purchase.purchase_group_id);
    deleteError = error;
  } else {
    // Single book purchase - delete just this record
    const { error } = await supabase
      .from("purchases")
      .delete()
      .eq("id", purchaseId);
    deleteError = error;
  }

  if (deleteError) {
    console.error("Failed to delete purchase:", deleteError);
    return NextResponse.json(
      { error: "Failed to delete purchase" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Purchase deleted",
  });
}
