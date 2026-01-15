"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Book } from "@/types";

// Bank details - would come from environment variables in production
const BANK_DETAILS = {
  bankName: "Bank of Ceylon",
  bankNameSi: "ලංකා බැංකුව",
  accountName: "Book Reader (Pvt) Ltd",
  accountNumber: "0012345678",
  branch: "Colombo Main Branch",
  branchSi: "කොළඹ ප්‍රධාන ශාඛාව",
};

interface PurchaseFormProps {
  book: Book;
  existingPurchase: { id: string; status: string } | null;
}

type PurchaseStep = "details" | "upload" | "success";

export function PurchaseForm({ book, existingPurchase }: PurchaseFormProps) {
  const [step, setStep] = React.useState<PurchaseStep>(
    existingPurchase?.status === "pending" ? "success" : "details"
  );
  const [paymentRef, setPaymentRef] = React.useState("");
  const [proofFile, setProofFile] = React.useState<File | null>(null);
  const [proofPreview, setProofPreview] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      setProofFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProofPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!proofFile) {
      setError("Please upload payment proof");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("bookId", book.id);
      formData.append("amount", String(book.price_lkr));
      formData.append("paymentReference", paymentRef);
      formData.append("proofFile", proofFile);

      const res = await fetch("/api/purchases", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit purchase request");
      }

      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Success state
  if (step === "success" || existingPurchase?.status === "pending") {
    return (
      <main className="purchase-page min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-cream)' }}>
        <div className="purchase-success-card">
          <div className="purchase-success-icon">
            <svg viewBox="0 0 48 48" fill="none" className="w-16 h-16">
              <circle cx="24" cy="24" r="20" fill="currentColor" fillOpacity="0.1" />
              <path
                d="M16 24L22 30L32 18"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 500, color: 'var(--color-ink)', marginBottom: '0.5rem' }}>
            Request Submitted
          </h1>
          <p style={{ color: 'var(--color-ink-light)', textAlign: 'center', marginBottom: '0.5rem' }}>
            Your purchase request has been submitted successfully.
          </p>
          <p className="sinhala" style={{ color: 'var(--color-ink-muted)', textAlign: 'center', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            ඔබගේ මිලදී ගැනීමේ ඉල්ලීම සාර්ථකව ඉදිරිපත් කර ඇත.
          </p>
          <div className="purchase-success-info">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">
              We&apos;ll review your payment and approve access within 24 hours. You&apos;ll receive a notification once approved.
            </p>
          </div>
          <div className="flex gap-3 mt-6">
            <Link href="/books" className="purchase-secondary-btn">
              Browse More
            </Link>
            <Link href="/library" className="purchase-primary-btn">
              Go to Library
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="purchase-page min-h-screen" style={{ background: 'var(--color-cream)' }}>
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Back button */}
        <Link
          href={`/books/${book.id}`}
          className="inline-flex items-center gap-2 text-sm transition-colors mb-6"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          <span>Back to book</span>
        </Link>

        {/* Header */}
        <header className="text-center mb-8">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.875rem', fontWeight: 500, color: 'var(--color-ink)' }}>
            Complete Your Purchase
          </h1>
          <p className="sinhala" style={{ fontSize: '1.125rem', color: 'var(--color-ink-muted)', marginTop: '0.25rem' }}>
            ඔබගේ මිලදී ගැනීම සම්පූර්ණ කරන්න
          </p>
        </header>

        {/* Book card */}
        <div className="purchase-book-card mb-8">
          <div className="purchase-book-cover">
            {book.cover_image_url ? (
              <Image
                src={book.cover_image_url}
                alt={book.title_en}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(184, 97, 78, 0.2), rgba(184, 97, 78, 0.05))' }}>
                <span className="sinhala" style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', color: 'rgba(184, 97, 78, 0.3)' }}>
                  {book.title_si.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div className="purchase-book-info">
            <h2 className="sinhala" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--color-ink)' }}>
              {book.title_si}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted)', marginTop: '0.25rem' }}>
              {book.title_en}
            </p>
            <div className="purchase-book-price">
              {formatPrice(book.price_lkr)}
            </div>
          </div>
        </div>

        {step === "details" && (
          <>
            {/* Bank details */}
            <section className="purchase-bank-section mb-8">
              <div className="purchase-bank-header">
                <div className="purchase-bank-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, color: 'var(--color-ink)' }}>
                    Bank Transfer Details
                  </h3>
                  <p className="sinhala" style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted)' }}>
                    බැංකු මාරු විස්තර
                  </p>
                </div>
              </div>

              <div className="purchase-bank-details">
                <div className="purchase-bank-row">
                  <span className="purchase-bank-label">Bank / බැංකුව</span>
                  <span className="purchase-bank-value">{BANK_DETAILS.bankName}</span>
                </div>

                <div className="purchase-bank-row">
                  <span className="purchase-bank-label">Account Name</span>
                  <span className="purchase-bank-value">{BANK_DETAILS.accountName}</span>
                </div>

                <div className="purchase-bank-row purchase-bank-row-highlight">
                  <span className="purchase-bank-label">Account Number</span>
                  <div className="purchase-bank-copyable">
                    <span className="purchase-bank-value font-mono">{BANK_DETAILS.accountNumber}</span>
                    <button
                      onClick={() => handleCopy(BANK_DETAILS.accountNumber, "account")}
                      className="purchase-copy-btn"
                    >
                      {copiedField === "account" ? (
                        <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                          <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="purchase-bank-row">
                  <span className="purchase-bank-label">Branch / ශාඛාව</span>
                  <span className="purchase-bank-value">{BANK_DETAILS.branch}</span>
                </div>

                <div className="purchase-bank-row purchase-bank-row-highlight">
                  <span className="purchase-bank-label">Amount / මුදල</span>
                  <div className="purchase-bank-copyable">
                    <span className="purchase-bank-value font-serif text-lg font-medium">
                      {formatPrice(book.price_lkr)}
                    </span>
                    <button
                      onClick={() => handleCopy(String(book.price_lkr), "amount")}
                      className="purchase-copy-btn"
                    >
                      {copiedField === "amount" ? (
                        <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                          <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <p className="purchase-bank-note">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                </svg>
                <span>
                  Transfer the exact amount shown above. After completing the transfer, click &quot;Next&quot; to upload your payment proof.
                </span>
              </p>
            </section>

            <button
              onClick={() => setStep("upload")}
              className="purchase-primary-btn w-full"
            >
              <span>I&apos;ve Made the Payment</span>
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </button>
          </>
        )}

        {step === "upload" && (
          <>
            {/* Upload section */}
            <section className="purchase-upload-section mb-6">
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 500, color: 'var(--color-ink)', marginBottom: '0.25rem' }}>
                Upload Payment Proof
              </h3>
              <p className="sinhala" style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted)', marginBottom: '1rem' }}>
                ගෙවීම් සාක්ෂිය උඩුගත කරන්න
              </p>

              <div
                className={`purchase-upload-zone ${proofPreview ? "purchase-upload-zone-filled" : ""}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {proofPreview ? (
                  <div className="purchase-upload-preview">
                    <Image
                      src={proofPreview}
                      alt="Payment proof"
                      fill
                      className="object-contain"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProofFile(null);
                        setProofPreview(null);
                      }}
                      className="purchase-upload-remove"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="purchase-upload-placeholder">
                    <svg className="w-10 h-10 mb-3 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-sm font-medium">Click to upload</span>
                    <span className="text-xs opacity-50 mt-1">PNG, JPG up to 5MB</span>
                  </div>
                )}
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-faint)', marginTop: '0.75rem' }}>
                Upload a screenshot or photo of your bank transfer confirmation
              </p>
            </section>

            {/* Payment reference (optional) */}
            <section className="mb-6">
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-ink)', marginBottom: '0.5rem' }}>
                Payment Reference (Optional)
              </label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="e.g., Transaction ID or reference number"
                className="purchase-input"
              />
            </section>

            {/* Error message */}
            {error && (
              <div className="purchase-error mb-6">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep("details")}
                className="purchase-secondary-btn flex-1"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !proofFile}
                className="purchase-primary-btn flex-1"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    <span>Submitting...</span>
                  </span>
                ) : (
                  <span>Submit Request</span>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
