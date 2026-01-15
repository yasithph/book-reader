"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PhoneInput, OTPInput } from "@/components/auth";

type AuthStep = "phone" | "otp";

function BookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 12C8 9.79086 9.79086 8 12 8H36C38.2091 8 40 9.79086 40 12V36C40 38.2091 38.2091 40 36 40H12C9.79086 40 8 38.2091 8 36V12Z"
        className="fill-[var(--auth-burgundy)] dark:fill-[var(--auth-gold)]"
        fillOpacity="0.1"
      />
      <path
        d="M14 14V34M14 14H34M14 14L24 24M34 14V34M34 14L24 24M14 34H34M14 34L24 24M34 34L24 24"
        className="stroke-[var(--auth-burgundy)] dark:stroke-[var(--auth-gold)]"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.4"
      />
      <path
        d="M24 8V40"
        className="stroke-[var(--auth-burgundy)] dark:stroke-[var(--auth-gold)]"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 8C12 8 16 11 24 11C32 11 36 8 36 8"
        className="stroke-[var(--auth-burgundy)] dark:stroke-[var(--auth-gold)]"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />
    </svg>
  );
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/library";

  const [step, setStep] = React.useState<AuthStep>("phone");
  const [phone, setPhone] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [expiresIn, setExpiresIn] = React.useState(300);

  const handleSendOTP = async (phoneNumber: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send OTP");
        return;
      }

      setPhone(phoneNumber);
      setExpiresIn(data.expiresIn || 300);
      setStep("otp");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (code: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid OTP");
        return;
      }

      if (data.isNewUser) {
        router.push("/welcome");
      } else {
        router.push(redirectTo);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    await handleSendOTP(phone);
  };

  const handleBack = () => {
    setStep("phone");
    setError("");
  };

  return (
    <main className="auth-background min-h-screen flex items-center justify-center p-4 sm:p-6">
      {/* Ambient decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-[var(--auth-burgundy)] dark:bg-[var(--auth-gold)] rounded-full opacity-[0.03] blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-[var(--auth-gold)] dark:bg-[var(--auth-burgundy)] rounded-full opacity-[0.04] blur-3xl" />
      </div>

      <div className="auth-card auth-card-animate w-full max-w-[420px] rounded-2xl p-8 sm:p-10">
        <div className="auth-stagger">
          {/* Header with book icon */}
          <div className="text-center mb-8 auth-animate-in opacity-0">
            <BookIcon className="book-icon-decoration" />

            {step === "phone" ? (
              <>
                <h1 className="auth-title text-3xl sm:text-4xl mb-2">
                  <span className="sinhala block">ලොග් වන්න</span>
                </h1>
                <p className="font-serif text-lg text-[var(--auth-ink)]/60 dark:text-[#F5F0E8]/50">
                  Sign in to continue
                </p>
              </>
            ) : (
              <>
                <h1 className="auth-title text-3xl sm:text-4xl mb-2">
                  <span className="sinhala block">සත්‍යාපනය</span>
                </h1>
                <p className="font-serif text-lg text-[var(--auth-ink)]/60 dark:text-[#F5F0E8]/50">
                  Verification
                </p>
              </>
            )}
          </div>

          {/* Content */}
          <div className="auth-animate-in opacity-0" style={{ animationDelay: "0.1s" }}>
            {step === "phone" ? (
              <PhoneInput
                onSubmit={handleSendOTP}
                loading={loading}
                error={error}
              />
            ) : (
              <div>
                <button
                  type="button"
                  onClick={handleBack}
                  className="auth-link flex items-center gap-2 mb-6 -ml-2 text-sm"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  Change number
                </button>

                <OTPInput
                  phone={phone}
                  onSubmit={handleVerifyOTP}
                  onResend={handleResendOTP}
                  loading={loading}
                  error={error}
                  expiresIn={expiresIn}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="auth-animate-in opacity-0 mt-10 pt-6 border-t border-[var(--auth-burgundy)]/10 dark:border-[var(--auth-gold)]/10" style={{ animationDelay: "0.2s" }}>
            <p className="text-xs text-center text-[var(--auth-ink)]/40 dark:text-[#F5F0E8]/30 leading-relaxed">
              By continuing, you agree to our{" "}
              <span className="text-[var(--auth-burgundy)] dark:text-[var(--auth-gold)] cursor-pointer hover:underline">
                Terms of Service
              </span>{" "}
              and{" "}
              <span className="text-[var(--auth-burgundy)] dark:text-[var(--auth-gold)] cursor-pointer hover:underline">
                Privacy Policy
              </span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function AuthSkeleton() {
  return (
    <main className="auth-background min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="auth-card w-full max-w-[420px] rounded-2xl p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-5 rounded-lg bg-[var(--auth-burgundy)]/10 dark:bg-[var(--auth-gold)]/10 animate-pulse" />
          <div className="h-10 w-32 mx-auto mb-2 rounded bg-[var(--auth-burgundy)]/10 dark:bg-[var(--auth-gold)]/10 animate-pulse" />
          <div className="h-5 w-24 mx-auto rounded bg-[var(--auth-burgundy)]/5 dark:bg-[var(--auth-gold)]/5 animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-4 w-28 rounded bg-[var(--auth-burgundy)]/10 dark:bg-[var(--auth-gold)]/10 animate-pulse" />
          <div className="h-14 w-full rounded-lg bg-[var(--auth-burgundy)]/5 dark:bg-[var(--auth-gold)]/5 animate-pulse" />
          <div className="h-3 w-48 rounded bg-[var(--auth-burgundy)]/5 dark:bg-[var(--auth-gold)]/5 animate-pulse" />
          <div className="h-14 w-full rounded-lg bg-[var(--auth-burgundy)]/10 dark:bg-[var(--auth-gold)]/10 animate-pulse" />
        </div>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <AuthContent />
    </Suspense>
  );
}
