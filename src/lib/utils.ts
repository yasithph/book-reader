import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const ErrorCodes = {
  AUTH_INVALID_PHONE: "AUTH_INVALID_PHONE",
  AUTH_OTP_EXPIRED: "AUTH_OTP_EXPIRED",
  AUTH_OTP_INVALID: "AUTH_OTP_INVALID",
  AUTH_MAX_ATTEMPTS: "AUTH_MAX_ATTEMPTS",
  BOOK_NOT_FOUND: "BOOK_NOT_FOUND",
  CHAPTER_NOT_FOUND: "CHAPTER_NOT_FOUND",
  ACCESS_DENIED: "ACCESS_DENIED",
  OFFLINE_UNAVAILABLE: "OFFLINE_UNAVAILABLE",
} as const;

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  console.error("Unexpected error:", error);
  return Response.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  );
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    return `+94${cleaned.slice(1)}`;
  }
  if (!cleaned.startsWith("94")) {
    return `+94${cleaned}`;
  }
  return `+${cleaned}`;
}

export function validateSriLankanPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  // Sri Lankan mobile numbers: 07X XXX XXXX (10 digits starting with 07)
  // Or with country code: 947X XXX XXXX
  if (cleaned.startsWith("07") && cleaned.length === 10) {
    return true;
  }
  if (cleaned.startsWith("947") && cleaned.length === 11) {
    return true;
  }
  if (cleaned.startsWith("7") && cleaned.length === 9) {
    return true;
  }
  return false;
}

export function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function formatReadingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remainingMinutes} min`;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("si-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
  }).format(price);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}
