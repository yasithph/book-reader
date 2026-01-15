import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPhoneNumber, isValidSriLankanPhone } from "@/lib/textit";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code } = body;

    // Validate inputs
    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string" || code.length !== 6) {
      return NextResponse.json(
        { error: "Valid 6-digit OTP is required" },
        { status: 400 }
      );
    }

    if (!isValidSriLankanPhone(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);
    const supabase = createAdminClient();

    // DEV BYPASS: Accept "123456" as valid OTP in development
    const isDevBypass = process.env.NODE_ENV === "development" && code === "123456";

    if (!isDevBypass) {
      // Find the OTP record
      const { data: otpRecord, error: fetchError } = await supabase
        .from("otp_codes")
        .select("*")
        .eq("phone", formattedPhone)
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

    // Check if user exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("phone", formattedPhone)
      .single();

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      // Existing user - get their auth user
      userId = existingUser.id;
    } else {
      // New user - create auth user and profile
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        phone: formattedPhone,
        phone_confirm: true,
      });

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
        phone: formattedPhone,
        language: "si", // Default to Sinhala
      });

      if (profileError) {
        console.error("Failed to create user profile:", profileError);
        // Continue anyway - profile can be created later
      }
    }

    // Create a session for the user
    // Since we're using phone OTP (not Supabase's built-in), we need to use admin API
    // to generate a session token
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: `${formattedPhone}@phone.local`, // Placeholder email for phone users
    });

    // Alternative: Use a custom JWT or session approach
    // For now, we'll use Supabase's session management with a workaround

    // Generate session using signInWithPassword (we'll set a secure random password)
    // Actually, let's use a simpler approach with custom session handling

    // Create a simple session token
    const sessionToken = crypto.randomUUID();
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

    cookieStore.set("session_phone", formattedPhone, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: sessionExpiry,
      path: "/",
    });

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
