/**
 * Email OTP generation and templates
 */

import { sendEmail, type SendEmailResponse } from "./client";

/**
 * Generate a 6-digit OTP code
 */
export function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate OTP email HTML template
 */
export function generateOTPEmailHTML(code: string, expiresInMinutes: number = 5): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #000000;
      color: #ffffff;
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 40px 24px;
      text-align: center;
    }
    .greeting {
      font-size: 16px;
      color: #333333;
      margin-bottom: 24px;
    }
    .greeting-si {
      font-size: 14px;
      color: #666666;
      margin-top: 8px;
    }
    .otp-box {
      background-color: #f8f9fa;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      padding: 24px;
      margin: 32px 0;
    }
    .otp-label {
      font-size: 14px;
      color: #666666;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .otp-code {
      font-size: 36px;
      font-weight: 700;
      letter-spacing: 8px;
      color: #000000;
      font-family: 'Courier New', monospace;
    }
    .expiry {
      font-size: 14px;
      color: #666666;
      margin-top: 16px;
    }
    .footer {
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #999999;
      border-top: 1px solid #e9ecef;
    }
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 16px;
      margin: 24px 0;
      text-align: left;
    }
    .warning p {
      margin: 0;
      font-size: 14px;
      color: #856404;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Book Reader</h1>
    </div>
    <div class="content">
      <div class="greeting">
        <div>Welcome to Book Reader!</div>
        <div class="greeting-si">බුක් රීඩර් වෙත සාදරයෙන් පිළිගනිමු!</div>
      </div>

      <p style="font-size: 16px; color: #333333; margin-bottom: 24px;">
        Use this verification code to complete your sign-in:
      </p>

      <div class="otp-box">
        <div class="otp-label">Your Verification Code</div>
        <div class="otp-code">${code}</div>
        <div class="expiry">Expires in ${expiresInMinutes} minutes</div>
      </div>

      <div class="warning">
        <p><strong>Security Notice:</strong> Never share this code with anyone. Book Reader will never ask for this code outside of the sign-in page.</p>
        <p style="margin-top: 8px;"><strong>ආරක්ෂණ දැනුම්දීම:</strong> මෙම කේතය කිසිවෙකු සමඟ බෙදා නොගන්න.</p>
      </div>

      <p style="font-size: 14px; color: #666666; margin-top: 32px;">
        If you didn't request this code, please ignore this email.
      </p>
    </div>
    <div class="footer">
      <p>&copy; 2026 Book Reader. All rights reserved.</p>
      <p style="margin-top: 8px;">This is an automated message, please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of OTP email
 */
export function generateOTPEmailText(code: string, expiresInMinutes: number = 5): string {
  return `
Book Reader - Verification Code

Welcome to Book Reader!
බුක් රීඩර් වෙත සාදරයෙන් පිළිගනිමු!

Your verification code is: ${code}

This code will expire in ${expiresInMinutes} minutes.

SECURITY NOTICE:
Never share this code with anyone. Book Reader will never ask for this code outside of the sign-in page.

ආරක්ෂණ දැනුම්දීම:
මෙම කේතය කිසිවෙකු සමඟ බෙදා නොගන්න.

If you didn't request this code, please ignore this email.

---
© 2026 Book Reader. All rights reserved.
This is an automated message, please do not reply.
  `.trim();
}

/**
 * Send OTP code via email
 */
export async function sendOTPEmail(
  email: string,
  code: string,
  expiresInMinutes: number = 5
): Promise<SendEmailResponse> {
  const html = generateOTPEmailHTML(code, expiresInMinutes);
  const text = generateOTPEmailText(code, expiresInMinutes);

  return sendEmail({
    to: email,
    subject: `Your Book Reader verification code: ${code}`,
    html,
    text,
  });
}
