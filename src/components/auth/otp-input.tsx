"use client";

import * as React from "react";

interface OTPInputProps {
  onSubmit: (code: string) => void;
  onResend: () => void;
  loading?: boolean;
  error?: string;
  phone: string;
  expiresIn?: number;
}

export function OTPInput({
  onSubmit,
  onResend,
  loading = false,
  error,
  phone,
  expiresIn = 60,
}: OTPInputProps) {
  const [code, setCode] = React.useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = React.useState(expiresIn);
  const [canResend, setCanResend] = React.useState(false);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  React.useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Reset timer when expiresIn changes
  React.useEffect(() => {
    setTimeLeft(expiresIn);
    setCanResend(false);
  }, [expiresIn]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "");

    // Multi-digit input (paste delivered via onChange on mobile)
    if (digits.length > 1) {
      const newCode = [...code];
      for (let i = 0; i < digits.length && index + i < 6; i++) {
        newCode[index + i] = digits[i];
      }
      setCode(newCode);

      const nextEmpty = newCode.findIndex((c) => !c);
      const focusIndex = nextEmpty === -1 ? 5 : nextEmpty;
      inputRefs.current[focusIndex]?.focus();

      const fullCode = newCode.join("");
      if (fullCode.length === 6) {
        onSubmit(fullCode);
      }
      return;
    }

    const digit = digits.slice(-1);

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (digit && index === 5) {
      const fullCode = newCode.join("");
      if (fullCode.length === 6) {
        onSubmit(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

    if (pastedData.length > 0) {
      const newCode = [...code];
      for (let i = 0; i < 6; i++) {
        newCode[i] = pastedData[i] || "";
      }
      setCode(newCode);

      const nextEmpty = newCode.findIndex((c) => !c);
      const focusIndex = nextEmpty === -1 ? 5 : nextEmpty;
      inputRefs.current[focusIndex]?.focus();

      if (pastedData.length === 6) {
        onSubmit(pastedData);
      }
    }
  };

  const handleResend = () => {
    setCode(["", "", "", "", "", ""]);
    setTimeLeft(expiresIn);
    setCanResend(false);
    onResend();
    inputRefs.current[0]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length === 6) {
      onSubmit(fullCode);
    }
  };

  const maskedPhone = phone.replace(/(\d{2})(\d+)(\d{2})/, "$1****$3");

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Phone display */}
      <div className="text-center space-y-1">
        <p className="text-sm text-[var(--auth-ink)]/50 dark:text-[#F5F0E8]/40">
          Enter the code sent to
        </p>
        <p className="font-serif text-lg text-[var(--auth-ink)] dark:text-[#F5F0E8] font-medium tracking-wide">
          +94 {maskedPhone}
        </p>
      </div>

      {/* OTP Digit Boxes */}
      <div className="space-y-3">
        <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
          {code.map((digit, index) => (
            <React.Fragment key={index}>
              <input
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                autoComplete={index === 0 ? "one-time-code" : "off"}
                disabled={loading}
                className={`
                  otp-digit
                  ${digit ? "filled" : ""}
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                autoFocus={index === 0}
              />
              {/* Separator after 3rd digit */}
              {index === 2 && (
                <div className="flex items-center justify-center w-4">
                  <span className="text-[var(--auth-burgundy)]/30 dark:text-[var(--auth-gold)]/30 text-2xl font-light">
                    –
                  </span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="auth-error justify-center">
            <svg
              className="w-4 h-4 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Timer and resend */}
      <div className="text-center space-y-3">
        {timeLeft > 0 ? (
          <div className="flex items-center justify-center gap-2">
            <svg
              className="w-4 h-4 text-[var(--auth-ink)]/40 dark:text-[#F5F0E8]/35"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm text-[var(--auth-ink)]/50 dark:text-[#F5F0E8]/40">
              Code expires in{" "}
              <span className="auth-timer">{formatTime(timeLeft)}</span>
            </span>
          </div>
        ) : (
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
            Code has expired
          </p>
        )}

        <button
          type="button"
          onClick={handleResend}
          disabled={!canResend || loading}
          className="auth-link text-sm"
        >
          {canResend ? (
            <span className="flex items-center gap-2">
              <svg
                className="w-4 h-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
                  clipRule="evenodd"
                />
              </svg>
              Resend Code
            </span>
          ) : (
            `Resend available in ${formatTime(timeLeft)}`
          )}
        </button>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={code.join("").length !== 6 || loading}
        className="auth-button w-full h-14 flex items-center justify-center gap-3"
      >
        {loading ? (
          <>
            <svg
              className="w-5 h-5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>Verifying...</span>
          </>
        ) : (
          <>
            <span>Verify & Continue</span>
            <svg
              className="w-5 h-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}
