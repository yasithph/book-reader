/**
 * Resend Email API Client
 * For sending OTP codes via email
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResponse {
  success: boolean;
  error?: string;
  messageId?: string;
}

export type EmailErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RATE_LIMIT"
  | "UNKNOWN";

export class EmailError extends Error {
  constructor(
    public code: EmailErrorCode,
    message: string
  ) {
    super(message);
    this.name = "EmailError";
  }
}

/**
 * Send an email using Resend API
 */
export async function sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

  if (!apiKey) {
    throw new EmailError("UNAUTHORIZED", "RESEND_API_KEY not configured");
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: request.to,
      subject: request.subject,
      html: request.html,
      text: request.text,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw new EmailError("UNKNOWN", error.message || "Failed to send email");
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    if (error instanceof EmailError) {
      throw error;
    }

    console.error("Email sending error:", error);
    throw new EmailError(
      "UNKNOWN",
      error instanceof Error ? error.message : "Failed to send email"
    );
  }
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  // RFC 5322 compliant email validation (simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Format email address to lowercase and trim
 */
export function formatEmail(email: string): string {
  return email.trim().toLowerCase();
}
