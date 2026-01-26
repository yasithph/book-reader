import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPhoneNumber, isValidSriLankanPhone } from "@/lib/textit";
import { formatEmail, isValidEmail } from "@/lib/email";
import { cookies } from "next/headers";

type AuthMethod = "phone" | "email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, email, code, method } = body;

    // Validate OTP code
    if (!code || typeof code !== "string" || code.length !== 6) {
      return NextResponse.json(
        { error: "Valid 6-digit OTP is required" },
        { status: 400 }
      );
    }

    // Determine authentication method
    const authMethod: AuthMethod = method || (phone ? "phone" : "email");

    // Validate and format identifier based on method
    let identifier: string;
    let identifierType: "phone" | "email";

    if (authMethod === "phone") {
      if (!phone || typeof phone !== "string") {
        return NextResponse.json(
          { error: "Phone number is required" },
          { status: 400 }
        );
      }

      if (!isValidSriLankanPhone(phone)) {
        return NextResponse.json(
          { error: "Invalid phone number" },
          { status: 400 }
        );
      }

      identifier = formatPhoneNumber(phone);
      identifierType = "phone";
    } else {
      if (!email || typeof email !== "string") {
        return NextResponse.json(
          { error: "Email address is required" },
          { status: 400 }
        );
      }

      if (!isValidEmail(email)) {
        return NextResponse.json(
          { error: "Invalid email address" },
          { status: 400 }
        );
      }

      identifier = formatEmail(email);
      identifierType = "email";
    }

    const supabase = createAdminClient();

    // DEV BYPASS: Accept "123456" as valid OTP in development
    const isDevBypass = process.env.NODE_ENV === "development" && code === "123456";

    if (!isDevBypass) {
      // Find the OTP record using new schema
      const { data: otpRecord, error: fetchError } = await supabase
        .from("otp_codes")
        .select("*")
        .eq("identifier", identifier)
        .eq("identifier_type", identifierType)
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
    const userQuery = identifierType === "phone"
      ? supabase.from("users").select("id").eq("phone", identifier).single()
      : supabase.from("users").select("id").eq("email", identifier).single();

    const { data: existingUser } = await userQuery;

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      // Existing user - use their ID
      userId = existingUser.id;
    } else {
      // Check if auth user exists (might exist without public.users record)
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const existingAuthUser = authUsers?.users?.find((u) =>
        identifierType === "phone" ? u.phone === identifier : u.email === identifier
      );

      if (existingAuthUser) {
        // Auth user exists but public.users record is missing - create it
        userId = existingAuthUser.id;
        isNewUser = true;

        const { error: profileError } = await supabase.from("users").insert({
          id: userId,
          phone: identifierType === "phone" ? identifier : null,
          email: identifierType === "email" ? identifier : null,
          language_preference: "si",
        });

        if (profileError) {
          console.error("Failed to create user profile for existing auth user:", profileError);
          return NextResponse.json(
            { error: "Failed to create user profile" },
            { status: 500 }
          );
        }
      } else {
        // Truly new user - create auth user and profile
        const createUserParams = identifierType === "phone"
          ? { phone: identifier, phone_confirm: true }
          : { email: identifier, email_confirm: true };

        const { data: authUser, error: authError } = await supabase.auth.admin.createUser(
          createUserParams
        );

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
        const { error: profileError } = await supabase.from("users").insert({
          id: userId,
          phone: identifierType === "phone" ? identifier : null,
          email: identifierType === "email" ? identifier : null,
          language_preference: "si",
        });

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

    // Store session (we'll use cookies for this)
    const cookieStore = await cookies();
    cookieStore.set("session_user_id", userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: sessionExpiry,
      path: "/",
    });

    // Set identifier-specific cookie
    if (identifierType === "phone") {
      cookieStore.set("session_phone", identifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: sessionExpiry,
        path: "/",
      });
    } else {
      cookieStore.set("session_email", identifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: sessionExpiry,
        path: "/",
      });
    }

    return NextResponse.json({
      success: true,
      isNewUser,
      userId,
      method: identifierType,
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
