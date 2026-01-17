import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { display_name } = body;

    // Validate display name
    if (!display_name || typeof display_name !== "string") {
      return NextResponse.json(
        { error: "Display name is required" },
        { status: 400 }
      );
    }

    const trimmedName = display_name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return NextResponse.json(
        { error: "Display name must be between 2 and 50 characters" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Update user profile
    const { error } = await supabase
      .from("users")
      .update({ display_name: trimmedName })
      .eq("id", session.userId);

    if (error) {
      console.error("Failed to update profile:", error);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
