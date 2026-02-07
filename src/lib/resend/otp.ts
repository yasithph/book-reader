import { sendEmail } from "./client";
import { generateOTP, OTP_EXPIRY_MINUTES } from "@/lib/textit/otp";

export { generateOTP, OTP_EXPIRY_MINUTES };

/**
 * Send OTP verification code via email
 */
export async function sendOTPEmail(
  email: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const result = await sendEmail({
    to: email,
    subject: `${code} - Your verification code`,
    html: formatOTPEmailHtml(code),
    text: `Your Meera verification code is: ${code}. Valid for ${OTP_EXPIRY_MINUTES} ${OTP_EXPIRY_MINUTES === 1 ? "minute" : "minutes"}.`,
  });

  return { success: result.success, error: result.error };
}

/**
 * Format bilingual HTML email template for OTP
 */
export function formatOTPEmailHtml(code: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:8px;overflow:hidden;">
    <tr>
      <td style="padding:32px 24px;text-align:center;">
        <h1 style="margin:0 0 8px;font-size:20px;color:#1a1a1a;">Verification Code</h1>
        <p style="margin:0 0 24px;font-size:14px;color:#666;">සත්‍යාපන කේතය</p>
        <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin:0 0 24px;">
          <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#1a1a1a;">${code}</span>
        </div>
        <p style="margin:0;font-size:14px;color:#888;">
          This code expires in ${OTP_EXPIRY_MINUTES} ${OTP_EXPIRY_MINUTES === 1 ? "minute" : "minutes"}.<br>
          මෙම කේතය මිනිත්තු ${OTP_EXPIRY_MINUTES}කින් කල් ඉකුත් වේ.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 24px;background:#fafafa;text-align:center;">
        <p style="margin:0;font-size:12px;color:#aaa;">
          If you didn't request this code, please ignore this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
