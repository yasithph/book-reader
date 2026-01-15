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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    // Validate phone number
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

    const formattedPhone = formatPhoneNumber(phone);
    const supabase = createAdminClient();

    // Check rate limit - count OTPs sent in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentAttempts } = await supabase
      .from("otp_codes")
      .select("*", { count: "exact", head: true })
      .eq("phone", formattedPhone)
      .gte("created_at", oneHourAgo);

    if (recentAttempts && recentAttempts >= OTP_RATE_LIMIT) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please try again later." },
        { status: 429 }
      );
    }

    // Invalidate any existing OTPs for this phone
    await supabase
      .from("otp_codes")
      .update({ verified: true }) // Mark as verified to invalidate
      .eq("phone", formattedPhone)
      .eq("verified", false);

    // Generate new OTP
    const code = generateOTP();
    const expiresAt = new Date(
      Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
    ).toISOString();

    // Store OTP in database
    const { error: insertError } = await supabase.from("otp_codes").insert({
      phone: formattedPhone,
      code,
      expires_at: expiresAt,
      verified: false,
    });

    if (insertError) {
      console.error("Failed to store OTP:", insertError);
      return NextResponse.json(
        { error: "Failed to generate OTP" },
        { status: 500 }
      );
    }

    // DEV BYPASS: Skip SMS in development, log to console
    if (process.env.NODE_ENV === "development") {
      console.log(`\n🔐 DEV OTP for ${formattedPhone}: ${code}\n   (or use bypass code: 123456)\n`);
    } else {
      // Send OTP via SMS
      const result = await sendOTP(formattedPhone, code);

      if (!result.success) {
        // Clean up the OTP record if SMS fails
        await supabase
          .from("otp_codes")
          .delete()
          .eq("phone", formattedPhone)
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
