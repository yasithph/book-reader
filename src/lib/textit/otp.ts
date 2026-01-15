import { sendSMS, formatPhoneNumber, isValidSriLankanPhone, TextItError } from "./client";

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * OTP expiry time in minutes
 */
export const OTP_EXPIRY_MINUTES = 5;

/**
 * Rate limit: max OTP requests per phone per hour
 */
export const OTP_RATE_LIMIT = 5;

/**
 * Format OTP message for SMS
 */
export function formatOTPMessage(code: string, appName: string = "Book Reader"): string {
  return `Your ${appName} verification code is: ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`;
}

/**
 * Send OTP via SMS
 */
export async function sendOTP(
  phone: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  if (!isValidSriLankanPhone(phone)) {
    return { success: false, error: "Invalid phone number" };
  }

  const formattedPhone = formatPhoneNumber(phone);
  const message = formatOTPMessage(code);

  try {
    await sendSMS({
      to: formattedPhone,
      text: message,
      ref: `otp-${Date.now()}`, // For tracking in TextIt dashboard
    });

    return { success: true };
  } catch (error) {
    if (error instanceof TextItError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to send SMS" };
  }
}

export { formatPhoneNumber, isValidSriLankanPhone };
