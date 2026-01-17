"use client";

import * as React from "react";
import Link from "next/link";
import type { Book } from "@/types";
import "@/styles/kindle.css";

// Bank details - would come from environment variables in production
const BANK_DETAILS = {
  bankName: "Bank of Ceylon",
  accountName: "Book Reader (Pvt) Ltd",
  accountNumber: "0012345678",
  branch: "Colombo Main Branch",
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
      <main className="kindle-purchase">
        <div className="kindle-purchase-success">
          <div className="kindle-purchase-success-icon">
            <svg viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" fill="currentColor" fillOpacity="0.1" />
              <path
                d="M16 24L22 30L32 18"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="kindle-purchase-success-title">Request Submitted</h1>
          <p className="kindle-purchase-success-subtitle">
            ඔබගේ මිලදී ගැනීමේ ඉල්ලීම සාර්ථකව ඉදිරිපත් කර ඇත
          </p>
          <div className="kindle-purchase-success-info">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
            <p>We&apos;ll review your payment and approve access within 24 hours.</p>
          </div>
          <div className="kindle-purchase-success-actions">
            <Link href="/?browse=true" className="kindle-purchase-btn-secondary">
              Browse More
            </Link>
            <Link href="/library" className="kindle-purchase-btn-primary">
              Go to Library
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="kindle-purchase">
      {/* Header */}
      <header className="kindle-purchase-header">
        <Link href={`/books/${book.id}`} className="kindle-purchase-back">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
        </Link>
        <div className="kindle-purchase-header-text">
          <h1>Purchase</h1>
          <p>ඔබගේ මිලදී ගැනීම සම්පූර්ණ කරන්න</p>
        </div>
      </header>

      <div className="kindle-purchase-content">
        {/* Book card */}
        <div className="kindle-purchase-book">
          <div className="kindle-purchase-book-cover">
            {book.cover_image_url ? (
              <img
                src={book.cover_image_url}
                alt={book.title_en}
              />
            ) : (
              <div className="kindle-purchase-book-placeholder">
                <span>{book.title_si.charAt(0)}</span>
              </div>
            )}
          </div>
          <div className="kindle-purchase-book-info">
            <h2>{book.title_si}</h2>
            <p>{book.title_en}</p>
            <div className="kindle-purchase-book-price">
              {formatPrice(book.price_lkr)}
            </div>
          </div>
        </div>

        {step === "details" && (
          <>
            {/* Bank details */}
            <section className="kindle-purchase-bank">
              <div className="kindle-purchase-bank-header">
                <div className="kindle-purchase-bank-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h3>Bank Transfer Details</h3>
                  <p>බැංකු මාරු විස්තර</p>
                </div>
              </div>

              <div className="kindle-purchase-bank-rows">
                <div className="kindle-purchase-bank-row">
                  <span className="kindle-purchase-bank-label">Bank</span>
                  <span className="kindle-purchase-bank-value">{BANK_DETAILS.bankName}</span>
                </div>

                <div className="kindle-purchase-bank-row">
                  <span className="kindle-purchase-bank-label">Account Name</span>
                  <span className="kindle-purchase-bank-value">{BANK_DETAILS.accountName}</span>
                </div>

                <div className="kindle-purchase-bank-row kindle-purchase-bank-row-copy">
                  <span className="kindle-purchase-bank-label">Account Number</span>
                  <div className="kindle-purchase-bank-copyable">
                    <span className="kindle-purchase-bank-value kindle-purchase-bank-mono">{BANK_DETAILS.accountNumber}</span>
                    <button
                      onClick={() => handleCopy(BANK_DETAILS.accountNumber, "account")}
                      className="kindle-purchase-copy-btn"
                      aria-label="Copy account number"
                    >
                      {copiedField === "account" ? (
                        <svg viewBox="0 0 20 20" fill="currentColor" className="kindle-purchase-copy-success">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 20 20" fill="currentColor">
                          <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                          <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="kindle-purchase-bank-row">
                  <span className="kindle-purchase-bank-label">Branch</span>
                  <span className="kindle-purchase-bank-value">{BANK_DETAILS.branch}</span>
                </div>

                <div className="kindle-purchase-bank-row kindle-purchase-bank-row-copy kindle-purchase-bank-row-amount">
                  <span className="kindle-purchase-bank-label">Amount</span>
                  <div className="kindle-purchase-bank-copyable">
                    <span className="kindle-purchase-bank-value kindle-purchase-bank-amount">{formatPrice(book.price_lkr)}</span>
                    <button
                      onClick={() => handleCopy(String(book.price_lkr), "amount")}
                      className="kindle-purchase-copy-btn"
                      aria-label="Copy amount"
                    >
                      {copiedField === "amount" ? (
                        <svg viewBox="0 0 20 20" fill="currentColor" className="kindle-purchase-copy-success">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 20 20" fill="currentColor">
                          <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                          <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="kindle-purchase-bank-note">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                </svg>
                <span>Transfer the exact amount shown above. After completing the transfer, click the button below to upload your payment proof.</span>
              </div>
            </section>

            <button
              onClick={() => setStep("upload")}
              className="kindle-purchase-btn-primary kindle-purchase-btn-full"
            >
              <span>I&apos;ve Made the Payment</span>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </button>
          </>
        )}

        {step === "upload" && (
          <>
            {/* Upload section */}
            <section className="kindle-purchase-upload">
              <h3>Upload Payment Proof</h3>
              <p>ගෙවීම් සාක්ෂිය උඩුගත කරන්න</p>

              <div
                className={`kindle-purchase-upload-zone ${proofPreview ? "kindle-purchase-upload-zone-filled" : ""}`}
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
                  <div className="kindle-purchase-upload-preview">
                    <img
                      src={proofPreview}
                      alt="Payment proof"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProofFile(null);
                        setProofPreview(null);
                      }}
                      className="kindle-purchase-upload-remove"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="kindle-purchase-upload-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Click to upload</span>
                    <span className="kindle-purchase-upload-hint">PNG, JPG up to 5MB</span>
                  </div>
                )}
              </div>
            </section>

            {/* Payment reference (optional) */}
            <section className="kindle-purchase-ref">
              <label>Payment Reference (Optional)</label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="e.g., Transaction ID"
                className="kindle-purchase-input"
              />
            </section>

            {/* Error message */}
            {error && (
              <div className="kindle-purchase-error">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="kindle-purchase-actions">
              <button
                onClick={() => setStep("details")}
                className="kindle-purchase-btn-secondary"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !proofFile}
                className="kindle-purchase-btn-primary"
              >
                {isSubmitting ? (
                  <span className="kindle-purchase-loading">
                    <svg viewBox="0 0 24 24" fill="none">
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
