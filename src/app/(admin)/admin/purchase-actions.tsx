"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PurchaseActionsProps {
  purchaseId: string;
  paymentProofUrl?: string;
}

export function PurchaseActions({ purchaseId, paymentProofUrl }: PurchaseActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = async () => {
    if (!confirm("Are you sure you want to approve this purchase?")) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/purchases/${purchaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to approve");
        return;
      }

      router.refresh();
    } catch (error) {
      alert("Failed to approve purchase");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/purchases/${purchaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejection_reason: rejectionReason }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to reject");
        return;
      }

      setShowRejectModal(false);
      router.refresh();
    } catch (error) {
      alert("Failed to reject purchase");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        {paymentProofUrl && (
          <a
            href={paymentProofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn admin-btn-ghost admin-btn-sm"
          >
            📷 View Proof
          </a>
        )}
        <button
          onClick={handleApprove}
          disabled={isLoading}
          className="admin-btn admin-btn-primary admin-btn-sm"
        >
          {isLoading ? "..." : "✓ Approve"}
        </button>
        <button
          onClick={() => setShowRejectModal(true)}
          disabled={isLoading}
          className="admin-btn admin-btn-secondary admin-btn-sm"
          style={{ color: "#ef4444" }}
        >
          ✕ Reject
        </button>
      </div>

      {showRejectModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowRejectModal(false)}
        >
          <div
            style={{
              background: "white",
              padding: "1.5rem",
              borderRadius: "12px",
              maxWidth: "400px",
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: "1rem" }}>Reject Purchase</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "8px",
                border: "1px solid #ddd",
                marginBottom: "1rem",
                minHeight: "100px",
              }}
            />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowRejectModal(false)}
                className="admin-btn admin-btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isLoading}
                className="admin-btn admin-btn-primary"
                style={{ background: "#ef4444" }}
              >
                {isLoading ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
