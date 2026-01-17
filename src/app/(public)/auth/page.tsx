"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type AuthStep = "phone" | "otp" | "name";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [step, setStep] = React.useState<AuthStep>("phone");
  const [phone, setPhone] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [expiresIn, setExpiresIn] = React.useState(300);
  const [userId, setUserId] = React.useState<string | null>(null);

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
        // Show name input step for new users
        setUserId(data.userId);
        setStep("name");
      } else {
        router.push(redirectTo);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async (name: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: name }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to save name");
        return;
      }

      // Redirect to welcome page for PWA install prompt
      router.push("/welcome");
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
    <main className="kindle-auth">
      {/* Back to home link */}
      <Link href="/" className="kindle-auth-back">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
        </svg>
      </Link>

      <div className="kindle-auth-container">
        {/* Logo */}
        <div className="kindle-auth-logo">
          <svg viewBox="0 0 32 32" fill="none">
            <path
              d="M6 8C6 7.4 6.4 7 7 7H13C14.7 7 16 8.3 16 10V26C16 25.4 15.6 25 15 25H7C6.4 25 6 24.6 6 24V8Z"
              fill="currentColor"
              fillOpacity="0.15"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M26 8C26 7.4 25.6 7 25 7H19C17.3 7 16 8.3 16 10V26C16 25.4 16.4 25 17 25H25C25.6 25 26 24.6 26 24V8Z"
              fill="currentColor"
              fillOpacity="0.1"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        {/* Header */}
        <div className="kindle-auth-header">
          {step === "phone" ? (
            <>
              <h1 className="kindle-auth-title">Sign in</h1>
              <p className="kindle-auth-subtitle sinhala">ලොග් වන්න</p>
            </>
          ) : step === "otp" ? (
            <>
              <h1 className="kindle-auth-title">Verify</h1>
              <p className="kindle-auth-subtitle sinhala">සත්‍යාපනය</p>
            </>
          ) : (
            <>
              <h1 className="kindle-auth-title">Welcome</h1>
              <p className="kindle-auth-subtitle sinhala">සාදරයෙන් පිළිගනිමු</p>
            </>
          )}
        </div>

        {/* Content */}
        <div className="kindle-auth-content">
          {step === "phone" ? (
            <PhoneStep
              onSubmit={handleSendOTP}
              loading={loading}
              error={error}
            />
          ) : step === "otp" ? (
            <OTPStep
              phone={phone}
              onSubmit={handleVerifyOTP}
              onResend={handleResendOTP}
              onBack={handleBack}
              loading={loading}
              error={error}
              expiresIn={expiresIn}
            />
          ) : (
            <NameStep
              onSubmit={handleSaveName}
              loading={loading}
              error={error}
            />
          )}
        </div>

        {/* Footer */}
        <p className="kindle-auth-footer">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </main>
  );
}

// Phone Input Step
function PhoneStep({
  onSubmit,
  loading,
  error,
}: {
  onSubmit: (phone: string) => void;
  loading: boolean;
  error: string;
}) {
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

  const isValid = phone.length >= 9;

  return (
    <form onSubmit={handleSubmit} className="kindle-auth-form">
      <div className="kindle-auth-field">
        <label className="kindle-auth-label">
          Phone number
          <span className="kindle-auth-label-si sinhala">දුරකථන අංකය</span>
        </label>

        <div
          className={`kindle-auth-phone-input ${isFocused ? "kindle-auth-phone-input-focused" : ""}`}
          onClick={() => inputRef.current?.focus()}
        >
          <span className="kindle-auth-country-code">+94</span>
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            placeholder="7X XXX XXXX"
            value={formatDisplayPhone(phone)}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={loading}
            autoComplete="tel"
            className="kindle-auth-input"
          />
          {phone.length > 0 && (
            <span className="kindle-auth-input-status">
              {isValid ? (
                <svg viewBox="0 0 20 20" fill="currentColor" className="kindle-auth-check">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
              ) : (
                <span className="kindle-auth-remaining">{9 - phone.length}</span>
              )}
            </span>
          )}
        </div>

        {error && (
          <div className="kindle-auth-error">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <p className="kindle-auth-hint sinhala">
          ඔබගේ දුරකථන අංකයට සත්‍යාපන කේතයක් යවනු ලැබේ
        </p>
      </div>

      <button
        type="submit"
        disabled={!isValid || loading}
        className="kindle-auth-submit"
      >
        {loading ? (
          <span className="kindle-auth-loading">
            <svg className="kindle-auth-spinner" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
            Sending code...
          </span>
        ) : (
          <>
            Continue
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}

// OTP Input Step
function OTPStep({
  phone,
  onSubmit,
  onResend,
  onBack,
  loading,
  error,
  expiresIn,
}: {
  phone: string;
  onSubmit: (code: string) => void;
  onResend: () => void;
  onBack: () => void;
  loading: boolean;
  error: string;
  expiresIn: number;
}) {
  const [code, setCode] = React.useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = React.useState(expiresIn);
  const [canResend, setCanResend] = React.useState(false);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

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
    const digit = value.replace(/\D/g, "").slice(-1);
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
      inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
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
    <form onSubmit={handleSubmit} className="kindle-auth-form">
      {/* Back button */}
      <button type="button" onClick={onBack} className="kindle-auth-back-btn">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
        </svg>
        Change number
      </button>

      {/* Phone display */}
      <div className="kindle-auth-phone-display">
        <p className="kindle-auth-phone-label">Code sent to</p>
        <p className="kindle-auth-phone-number">+94 {maskedPhone}</p>
      </div>

      {/* OTP Input */}
      <div className="kindle-auth-otp-container" onPaste={handlePaste}>
        {code.map((digit, index) => (
          <React.Fragment key={index}>
            <input
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={loading}
              className={`kindle-auth-otp-digit ${digit ? "kindle-auth-otp-digit-filled" : ""}`}
              autoFocus={index === 0}
            />
            {index === 2 && <span className="kindle-auth-otp-separator">–</span>}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="kindle-auth-error kindle-auth-error-centered">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Timer */}
      <div className="kindle-auth-timer-section">
        {timeLeft > 0 ? (
          <p className="kindle-auth-timer-text">
            Code expires in <span className="kindle-auth-timer-value">{formatTime(timeLeft)}</span>
          </p>
        ) : (
          <p className="kindle-auth-timer-expired">Code has expired</p>
        )}

        <button
          type="button"
          onClick={handleResend}
          disabled={!canResend || loading}
          className="kindle-auth-resend"
        >
          {canResend ? "Resend code" : `Resend in ${formatTime(timeLeft)}`}
        </button>
      </div>

      <button
        type="submit"
        disabled={code.join("").length !== 6 || loading}
        className="kindle-auth-submit"
      >
        {loading ? (
          <span className="kindle-auth-loading">
            <svg className="kindle-auth-spinner" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
            Verifying...
          </span>
        ) : (
          <>
            Verify
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}

// Name Input Step (for new users)
function NameStep({
  onSubmit,
  loading,
  error,
}: {
  onSubmit: (name: string) => void;
  loading: boolean;
  error: string;
}) {
  const [name, setName] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length >= 2) {
      onSubmit(name.trim());
    }
  };

  const isValid = name.trim().length >= 2;

  return (
    <form onSubmit={handleSubmit} className="kindle-auth-form">
      <div className="kindle-auth-field">
        <label className="kindle-auth-label">
          What should we call you?
          <span className="kindle-auth-label-si sinhala">ඔබව අමතන්නේ කෙසේද?</span>
        </label>

        <div
          className={`kindle-auth-name-input ${isFocused ? "kindle-auth-name-input-focused" : ""}`}
          onClick={() => inputRef.current?.focus()}
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="kindle-auth-name-icon"
          >
            <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={loading}
            autoComplete="name"
            className="kindle-auth-input"
            maxLength={50}
          />
          {name.length > 0 && isValid && (
            <span className="kindle-auth-input-status">
              <svg viewBox="0 0 20 20" fill="currentColor" className="kindle-auth-check">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </div>

        {error && (
          <div className="kindle-auth-error">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <p className="kindle-auth-hint sinhala">
          මෙම නම ඔබගේ පැතිකඩෙහි පෙන්වනු ඇත
        </p>
      </div>

      <button
        type="submit"
        disabled={!isValid || loading}
        className="kindle-auth-submit"
      >
        {loading ? (
          <span className="kindle-auth-loading">
            <svg className="kindle-auth-spinner" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
            Saving...
          </span>
        ) : (
          <>
            Continue
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}

function AuthSkeleton() {
  return (
    <main className="kindle-auth">
      <div className="kindle-auth-container">
        <div className="kindle-auth-logo">
          <div className="kindle-auth-skeleton" style={{ width: 40, height: 40, borderRadius: 8 }} />
        </div>
        <div className="kindle-auth-header">
          <div className="kindle-auth-skeleton" style={{ width: 120, height: 32, marginBottom: 8 }} />
          <div className="kindle-auth-skeleton" style={{ width: 80, height: 20 }} />
        </div>
        <div className="kindle-auth-content">
          <div className="kindle-auth-skeleton" style={{ width: '100%', height: 56, marginBottom: 16 }} />
          <div className="kindle-auth-skeleton" style={{ width: '100%', height: 48 }} />
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
