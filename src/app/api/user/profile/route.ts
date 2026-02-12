import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    const { data: user, error } = await supabase
      .from("users")
      .select("id, phone, display_name, avatar_url")
      .eq("id", session.userId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile: user });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const { display_name, avatar_url } = body;

    const updates: Record<string, string> = {};

    // Validate display name if provided
    if (display_name !== undefined) {
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
      updates.display_name = trimmedName;
    }

    // Handle avatar_url if provided
    if (avatar_url !== undefined) {
      if (typeof avatar_url !== "string") {
        return NextResponse.json(
          { error: "Invalid avatar URL" },
          { status: 400 }
        );
      }
      // Allow predefined avatars or Supabase storage URLs
      const isPredefined = /^\/images\/avatars\/avatar-\d+\.png$/.test(avatar_url);
      const isStorageUrl = avatar_url.includes("supabase") && avatar_url.includes("profile-pictures");
      if (!isPredefined && !isStorageUrl) {
        return NextResponse.json(
          { error: "Invalid avatar URL" },
          { status: 400 }
        );
      }
      updates.avatar_url = avatar_url;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Update user profile
    const { error } = await supabase
      .from("users")
      .update(updates)
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
