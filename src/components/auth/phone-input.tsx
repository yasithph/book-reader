"use client";

import * as React from "react";

interface PhoneInputProps {
  onSubmit: (phone: string) => void;
  loading?: boolean;
  error?: string;
  disabled?: boolean;
}

export function PhoneInput({
  onSubmit,
  loading = false,
  error,
  disabled = false,
}: PhoneInputProps) {
  const [phone, setPhone] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const formatDisplayPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setPhone(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 9) {
      onSubmit(phone);
    }
  };

  const isValidLength = phone.length >= 9;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <label
          htmlFor="phone"
          className="block font-serif text-sm text-[var(--auth-ink)]/70 dark:text-[#F5F0E8]/60"
        >
          Phone Number
          <span className="sinhala ml-2 text-[var(--auth-ink)]/40 dark:text-[#F5F0E8]/40">
            දුරකථන අංකය
          </span>
        </label>

        <div
          className={`
            relative flex items-center rounded-xl overflow-hidden transition-all duration-200
            ${isFocused
              ? "ring-2 ring-[var(--auth-burgundy)]/30 dark:ring-[var(--auth-gold)]/30"
              : ""
            }
          `}
          onClick={() => inputRef.current?.focus()}
        >
          {/* Country code badge */}
          <div className="flex-shrink-0 h-14 px-4 flex items-center justify-center bg-[var(--auth-burgundy)]/5 dark:bg-[var(--auth-gold)]/10 border-r border-[var(--auth-burgundy)]/10 dark:border-[var(--auth-gold)]/15">
            <span className="font-serif text-base text-[var(--auth-burgundy)] dark:text-[var(--auth-gold)] font-medium">
              +94
            </span>
          </div>

          {/* Input field */}
          <input
            ref={inputRef}
            id="phone"
            type="tel"
            inputMode="numeric"
            placeholder="7X XXX XXXX"
            value={formatDisplayPhone(phone)}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled || loading}
            autoComplete="tel"
            className="
              auth-input flex-1 h-14 px-4
              font-serif text-lg tracking-wide
              border-0 rounded-none
              text-[var(--auth-ink)] dark:text-[#F5F0E8]
              placeholder:text-[var(--auth-ink)]/25 dark:placeholder:text-[#F5F0E8]/25
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:ring-0 focus:outline-none
            "
          />

          {/* Status indicator */}
          {phone.length > 0 && (
            <div className="flex-shrink-0 pr-4">
              {isValidLength ? (
                <svg
                  className="w-5 h-5 text-emerald-500 dark:text-emerald-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <span className="font-serif text-sm text-[var(--auth-ink)]/30 dark:text-[#F5F0E8]/30">
                  {9 - phone.length}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="auth-error">
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

        {/* Helper text */}
        <p className="sinhala text-sm text-[var(--auth-ink)]/40 dark:text-[#F5F0E8]/35">
          ඔබගේ දුරකථන අංකයට සත්‍යාපන කේතයක් යවනු ලැබේ
        </p>
      </div>

      <button
        type="submit"
        disabled={!isValidLength || disabled || loading}
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
            <span>Sending code...</span>
          </>
        ) : (
          <>
            <span>Send Verification Code</span>
            <svg
              className="w-5 h-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                clipRule="evenodd"
              />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}
