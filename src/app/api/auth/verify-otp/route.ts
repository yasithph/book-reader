import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPhoneNumber, isValidSriLankanPhone } from "@/lib/textit";
import { isValidEmail } from "@/lib/resend";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, email, code } = body;

    // Must provide exactly one of phone or email
    if (!phone && !email) {
      return NextResponse.json(
        { error: "Phone number or email is required" },
        { status: 400 }
      );
    }

    if (phone && email) {
      return NextResponse.json(
        { error: "Provide either phone or email, not both" },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string" || code.length !== 6) {
      return NextResponse.json(
        { error: "Valid 6-digit OTP is required" },
        { status: 400 }
      );
    }

    const isEmailMode = !!email;

    // Validate identifier
    if (isEmailMode) {
      if (typeof email !== "string" || !isValidEmail(email)) {
        return NextResponse.json(
          { error: "Invalid email address" },
          { status: 400 }
        );
      }
    } else {
      if (!isValidSriLankanPhone(phone)) {
        return NextResponse.json(
          { error: "Invalid phone number" },
          { status: 400 }
        );
      }
    }

    const identifier = isEmailMode ? email.toLowerCase().trim() : formatPhoneNumber(phone);
    const identifierColumn = isEmailMode ? "email" : "phone";
    const supabase = createAdminClient();

    // DEV BYPASS: Accept "123456" as valid OTP in development
    const isDevBypass = process.env.NODE_ENV === "development" && code === "123456";

    if (!isDevBypass) {
      // Find the OTP record
      const { data: otpRecord, error: fetchError } = await supabase
        .from("otp_codes")
        .select("*")
        .eq(identifierColumn, identifier)
        .eq("code", code)
        .eq("verified", false)
        .single();

      if (fetchError || !otpRecord) {
        return NextResponse.json(
          { error: "Invalid or expired OTP" },
          { status: 400 }
        );
      }

      // Check if OTP is expired
      if (new Date(otpRecord.expires_at) < new Date()) {
        return NextResponse.json(
          { error: "OTP has expired" },
          { status: 400 }
        );
      }

      // Mark OTP as verified
      await supabase
        .from("otp_codes")
        .update({ verified: true })
        .eq("id", otpRecord.id);
    }

    // Check if user exists in public.users table
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq(identifierColumn, identifier)
      .single();

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      // Existing user - use their ID
      userId = existingUser.id;
    } else {
      // Check if auth user exists (might exist without public.users record)
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const existingAuthUser = isEmailMode
        ? authUsers?.users?.find((u) => u.email === identifier)
        : authUsers?.users?.find((u) => u.phone === identifier);

      if (existingAuthUser) {
        // Auth user exists but public.users record is missing - create it
        userId = existingAuthUser.id;
        isNewUser = true;

        const profileData: Record<string, string> = {
          id: userId,
          language_preference: "si",
        };
        if (isEmailMode) {
          profileData.email = identifier;
        } else {
          profileData.phone = identifier;
        }

        const { error: profileError } = await supabase.from("users").insert(profileData);

        if (profileError) {
          console.error("Failed to create user profile for existing auth user:", profileError);
          return NextResponse.json(
            { error: "Failed to create user profile" },
            { status: 500 }
          );
        }
      } else {
        // Truly new user - create auth user and profile
        const createUserData = isEmailMode
          ? { email: identifier, email_confirm: true }
          : { phone: identifier, phone_confirm: true };

        const { data: authUser, error: authError } = await supabase.auth.admin.createUser(createUserData);

        if (authError || !authUser.user) {
          console.error("Failed to create auth user:", authError);
          return NextResponse.json(
            { error: "Failed to create account" },
            { status: 500 }
          );
        }

        userId = authUser.user.id;
        isNewUser = true;

        // Create user profile
        const profileData: Record<string, string> = {
          id: userId,
          language_preference: "si",
        };
        if (isEmailMode) {
          profileData.email = identifier;
        } else {
          profileData.phone = identifier;
        }

        const { error: profileError } = await supabase.from("users").insert(profileData);

        if (profileError) {
          console.error("Failed to create user profile:", profileError);

          // Rollback: delete the auth user we just created
          const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
          if (deleteError) {
            console.error("Failed to rollback auth user:", deleteError);
          }

          return NextResponse.json(
            { error: "Failed to create user profile" },
            { status: 500 }
          );
        }
      }
    }

    const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      expires: sessionExpiry,
      path: "/",
    };

    // Store session cookies
    const cookieStore = await cookies();
    cookieStore.set("session_user_id", userId, cookieOptions);

    if (isEmailMode) {
      cookieStore.set("session_email", identifier, cookieOptions);
    } else {
      cookieStore.set("session_phone", identifier, cookieOptions);
    }

    return NextResponse.json({
      success: true,
      isNewUser,
      userId,
      message: isNewUser ? "Account created successfully" : "Logged in successfully",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
