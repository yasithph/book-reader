/**
 * TextIt.biz SMS API Client
 * Based on REST API Integration Guidelines Rev. 1.0
 */

const TEXTIT_API_URL = "https://api.textit.biz/";

export interface SendSMSRequest {
  to: string;
  text: string;
  ref?: string; // Optional pass-through parameter for tracking
  schd?: string; // Optional scheduled time: YYYY-MM-DD_HH:MM or YYYYMMDDHHMM
}

export interface SendSMSResponse {
  success: boolean;
  error?: string;
  statusCode: number;
}

export type TextItErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "LOW_BALANCE"
  | "UNKNOWN";

export class TextItError extends Error {
  constructor(
    public code: TextItErrorCode,
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "TextItError";
  }
}

function getErrorFromStatus(status: number): { code: TextItErrorCode; message: string } {
  switch (status) {
    case 400:
      return { code: "BAD_REQUEST", message: "Required parameters not present" };
    case 401:
      return { code: "UNAUTHORIZED", message: "Authentication failed" };
    case 403:
      return { code: "FORBIDDEN", message: "Authentication failed" };
    case 402:
      return { code: "LOW_BALANCE", message: "Low credit balance" };
    default:
      return { code: "UNKNOWN", message: `Request failed with status ${status}` };
  }
}

/**
 * Send an SMS using TextIt.biz API
 */
export async function sendSMS(request: SendSMSRequest): Promise<SendSMSResponse> {
  const apiKey = process.env.TEXTIT_API_KEY;

  if (!apiKey) {
    throw new TextItError("UNAUTHORIZED", 401, "TEXTIT_API_KEY not configured");
  }

  const response = await fetch(TEXTIT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
      "X-API-VERSION": "v1",
      Authorization: `Basic ${apiKey}`,
    },
    body: JSON.stringify({
      to: request.to,
      text: request.text,
      ...(request.ref && { ref: request.ref }),
      ...(request.schd && { schd: request.schd }),
    }),
  });

  if (!response.ok) {
    const { code, message } = getErrorFromStatus(response.status);
    throw new TextItError(code, response.status, message);
  }

  return {
    success: true,
    statusCode: response.status,
  };
}

/**
 * Format a Sri Lankan phone number to international format
 * Accepts: 0771234567, 771234567, +94771234567, 94771234567
 * Returns: 94771234567
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, "");

  // Remove leading +
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }

  // If starts with 0, replace with 94
  if (cleaned.startsWith("0")) {
    cleaned = "94" + cleaned.substring(1);
  }

  // If doesn't start with 94, add it
  if (!cleaned.startsWith("94")) {
    cleaned = "94" + cleaned;
  }

  return cleaned;
}

/**
 * Validate a Sri Lankan phone number
 */
export function isValidSriLankanPhone(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // Sri Lankan mobile numbers: 94 + 7X + 7 digits = 11 digits total
  return /^94[0-9]{9}$/.test(formatted);
}
