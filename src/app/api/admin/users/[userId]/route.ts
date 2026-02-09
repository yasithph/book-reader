import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, getCurrentUser } from "@/lib/auth";
import { sendSMS, formatPhoneNumber, isValidSriLankanPhone } from "@/lib/textit/client";
import { sendEmail, isValidEmail } from "@/lib/resend/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  const body = await request.json();
  const { display_name, phone, email } = body;

  const supabase = createAdminClient();

  // Get current user data
  const { data: existingUser, error: fetchError } = await supabase
    .from("users")
    .select("id, phone, email")
    .eq("id", userId)
    .single();

  if (fetchError || !existingUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};

  // Handle display_name
  if (display_name !== undefined) {
    if (display_name && display_name.length > 100) {
      return NextResponse.json(
        { error: "Display name must be 100 characters or less" },
        { status: 400 }
      );
    }
    updateData.display_name = display_name?.trim() || null;
  }

  // Handle phone
  const phoneChanged = phone !== undefined && phone !== existingUser.phone;
  if (phone !== undefined) {
    if (phone) {
      if (!isValidSriLankanPhone(phone)) {
        return NextResponse.json(
          { error: "Invalid Sri Lankan phone number" },
          { status: 400 }
        );
      }
      const formatted = formatPhoneNumber(phone);
      // Check uniqueness
      const { data: phoneExists } = await supabase
        .from("users")
        .select("id")
        .eq("phone", formatted)
        .neq("id", userId)
        .single();
      if (phoneExists) {
        return NextResponse.json(
          { error: "Phone number already in use by another user" },
          { status: 409 }
        );
      }
      updateData.phone = formatted;
    } else {
      // Ensure at least one of phone or email remains
      const effectiveEmail = email !== undefined ? email : existingUser.email;
      if (!effectiveEmail) {
        return NextResponse.json(
          { error: "User must have at least a phone number or email" },
          { status: 400 }
        );
      }
      updateData.phone = null;
    }
  }

  // Handle email
  const emailChanged = email !== undefined && email !== existingUser.email;
  if (email !== undefined) {
    if (email) {
      if (!isValidEmail(email)) {
        return NextResponse.json(
          { error: "Invalid email address" },
          { status: 400 }
        );
      }
      // Check uniqueness
      const { data: emailExists } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .neq("id", userId)
        .single();
      if (emailExists) {
        return NextResponse.json(
          { error: "Email already in use by another user" },
          { status: 409 }
        );
      }
      updateData.email = email;
    } else {
      // Ensure at least one of phone or email remains
      const effectivePhone = phone !== undefined ? (phone ? formatPhoneNumber(phone) : null) : existingUser.phone;
      if (!effectivePhone) {
        return NextResponse.json(
          { error: "User must have at least a phone number or email" },
          { status: 400 }
        );
      }
      updateData.email = null;
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", userId);

  if (updateError) {
    // Handle unique constraint violation (race condition with concurrent requests)
    if (updateError.code === "23505") {
      const msg = updateError.message?.includes("phone")
        ? "Phone number already in use by another user"
        : "Email already in use by another user";
      return NextResponse.json({ error: msg }, { status: 409 });
    }
    console.error("Failed to update user:", updateError);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }

  // Send notifications for changed contact info
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bookreader.lk";

  if (phoneChanged && updateData.phone) {
    try {
      await sendSMS({
        to: updateData.phone as string,
        text: `Your phone number has been updated on Meera. Login at: ${appUrl}/auth`,
      });
    } catch (err) {
      console.error("Failed to send SMS notification:", err);
    }
  }

  if (emailChanged && updateData.email) {
    try {
      await sendEmail({
        to: updateData.email as string,
        subject: "Your email has been updated on Meera",
        html: `<p>Your email address has been updated on Meera.</p><p><a href="${appUrl}/auth">Login here</a></p>`,
        text: `Your email address has been updated on Meera. Login at: ${appUrl}/auth`,
      });
    } catch (err) {
      console.error("Failed to send email notification:", err);
    }
  }

  return NextResponse.json({ success: true, message: "User updated" });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  const supabase = createAdminClient();

  // Verify user exists and is not admin
  const { data: targetUser, error: fetchError } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", userId)
    .single();

  if (fetchError || !targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (targetUser.role === "admin") {
    return NextResponse.json(
      { error: "Cannot delete admin users" },
      { status: 403 }
    );
  }

  // Delete from public.users first (cascades to purchases, reading_progress, etc.)
  const { error: deleteError } = await supabase
    .from("users")
    .delete()
    .eq("id", userId);

  if (deleteError) {
    console.error("Failed to delete user:", deleteError);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }

  // Also delete from Supabase Auth so the phone/email can re-register
  const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
  if (authDeleteError) {
    console.error("Failed to delete auth user (public.users already deleted):", authDeleteError);
  }

  return NextResponse.json({ success: true, message: "User deleted" });
}
