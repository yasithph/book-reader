import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendOTP,
  generateOTP,
  formatPhoneNumber,
  isValidSriLankanPhone,
  OTP_EXPIRY_MINUTES,
  OTP_RATE_LIMIT,
} from "@/lib/textit";
import { isValidEmail, sendOTPEmail } from "@/lib/resend";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, email } = body;

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

    const supabase = createAdminClient();
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
      if (!phone || typeof phone !== "string") {
        return NextResponse.json(
          { error: "Phone number is required" },
          { status: 400 }
        );
      }

      if (!isValidSriLankanPhone(phone)) {
        return NextResponse.json(
          { error: "Invalid Sri Lankan phone number" },
          { status: 400 }
        );
      }
    }

    const identifier = isEmailMode ? email.toLowerCase().trim() : formatPhoneNumber(phone);
    const identifierColumn = isEmailMode ? "email" : "phone";

    // Check rate limit - count OTPs sent in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentAttempts } = await supabase
      .from("otp_codes")
      .select("*", { count: "exact", head: true })
      .eq(identifierColumn, identifier)
      .gte("created_at", oneHourAgo);

    if (recentAttempts && recentAttempts >= OTP_RATE_LIMIT) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please try again later." },
        { status: 429 }
      );
    }

    // Invalidate any existing OTPs for this identifier
    await supabase
      .from("otp_codes")
      .update({ verified: true })
      .eq(identifierColumn, identifier)
      .eq("verified", false);

    // Generate new OTP
    const code = generateOTP();
    const expiresAt = new Date(
      Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
    ).toISOString();

    // Store OTP in database
    const insertData: Record<string, string | boolean> = {
      code,
      expires_at: expiresAt,
      verified: false,
    };
    insertData[identifierColumn] = identifier;

    const { error: insertError } = await supabase.from("otp_codes").insert(insertData);

    if (insertError) {
      console.error("Failed to store OTP:", insertError);
      return NextResponse.json(
        { error: "Failed to generate OTP" },
        { status: 500 }
      );
    }

    // DEV BYPASS: Skip sending in development, log to console
    if (process.env.NODE_ENV === "development") {
      console.log(`\n🔐 DEV OTP for ${identifier}: ${code}\n   (or use bypass code: 123456)\n`);
    } else if (isEmailMode) {
      // Send OTP via email
      const result = await sendOTPEmail(identifier, code);

      if (!result.success) {
        await supabase
          .from("otp_codes")
          .delete()
          .eq(identifierColumn, identifier)
          .eq("code", code);

        return NextResponse.json(
          { error: result.error || "Failed to send OTP email" },
          { status: 500 }
        );
      }
    } else {
      // Send OTP via SMS
      const result = await sendOTP(identifier, code);

      if (!result.success) {
        await supabase
          .from("otp_codes")
          .delete()
          .eq(identifierColumn, identifier)
          .eq("code", code);

        return NextResponse.json(
          { error: result.error || "Failed to send OTP" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      expiresIn: OTP_EXPIRY_MINUTES * 60, // seconds
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
