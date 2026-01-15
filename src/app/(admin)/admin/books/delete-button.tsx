"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteBookButtonProps {
  bookId: string;
  bookTitle: string;
}

export function DeleteBookButton({ bookId, bookTitle }: DeleteBookButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/books/${bookId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete book");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete book");
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="delete-confirm-inline">
        <span>Delete?</span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="admin-btn admin-btn-danger admin-btn-sm"
        >
          {isDeleting ? "..." : "Yes"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="admin-btn admin-btn-secondary admin-btn-sm"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="admin-btn admin-btn-ghost admin-btn-sm"
      style={{ color: "var(--destructive)" }}
      title={`Delete ${bookTitle}`}
    >
      🗑️
    </button>
  );
}
