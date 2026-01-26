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
import {
  sendOTPEmail,
  generateOTPCode,
  isValidEmail,
  formatEmail,
} from "@/lib/email";

type AuthMethod = "phone" | "email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, email, method } = body;

    // Determine authentication method
    const authMethod: AuthMethod = method || (phone ? "phone" : "email");

    // Validate based on method
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
          { error: "Invalid Sri Lankan phone number" },
          { status: 400 }
        );
      }

      identifier = formatPhoneNumber(phone);
      identifierType = "phone";
    } else {
      // Email method
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

    // Check rate limit - count OTPs sent in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentAttempts } = await supabase
      .from("otp_codes")
      .select("*", { count: "exact", head: true })
      .eq("identifier", identifier)
      .eq("identifier_type", identifierType)
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
      .update({ verified: true }) // Mark as verified to invalidate
      .eq("identifier", identifier)
      .eq("identifier_type", identifierType)
      .eq("verified", false);

    // Generate new OTP
    const code = identifierType === "phone" ? generateOTP() : generateOTPCode();
    const expiresAt = new Date(
      Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
    ).toISOString();

    // Store OTP in database with new schema
    const { error: insertError } = await supabase.from("otp_codes").insert({
      identifier,
      identifier_type: identifierType,
      phone: identifierType === "phone" ? identifier : null,
      email: identifierType === "email" ? identifier : null,
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

    // DEV BYPASS: Skip sending in development, log to console
    if (process.env.NODE_ENV === "development") {
      console.log(
        `\n🔐 DEV OTP for ${identifier} (${identifierType}): ${code}\n   (or use bypass code: 123456)\n`
      );
    } else {
      // Send OTP via appropriate channel
      if (identifierType === "phone") {
        const result = await sendOTP(identifier, code);

        if (!result.success) {
          // Clean up the OTP record if SMS fails
          await supabase
            .from("otp_codes")
            .delete()
            .eq("identifier", identifier)
            .eq("code", code);

          return NextResponse.json(
            { error: result.error || "Failed to send OTP" },
            { status: 500 }
          );
        }
      } else {
        // Send via email
        try {
          await sendOTPEmail(identifier, code, OTP_EXPIRY_MINUTES);
        } catch (error) {
          console.error("Failed to send email OTP:", error);

          // Clean up the OTP record if email fails
          await supabase
            .from("otp_codes")
            .delete()
            .eq("identifier", identifier)
            .eq("code", code);

          return NextResponse.json(
            { error: "Failed to send OTP email" },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      expiresIn: OTP_EXPIRY_MINUTES * 60, // seconds
      method: identifierType,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
