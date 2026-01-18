"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Chapter {
  id: string;
  chapter_number: number;
  title_en: string;
  title_si: string;
  word_count: number;
  estimated_reading_time: number;
  is_published?: boolean;
  has_draft?: boolean;
}

interface ChapterListProps {
  bookId: string;
  chapters: Chapter[];
}

export function ChapterList({ bookId, chapters }: ChapterListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (chapterId: string) => {
    if (!confirm("Are you sure you want to delete this chapter?")) return;

    setDeletingId(chapterId);
    try {
      const res = await fetch(`/api/admin/chapters/${chapterId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete chapter");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete chapter");
    } finally {
      setDeletingId(null);
    }
  };

  if (chapters.length === 0) {
    return (
      <div className="admin-empty-state" style={{ padding: "2rem" }}>
        <div className="admin-empty-icon">📄</div>
        <div className="admin-empty-title">No chapters yet</div>
        <div className="admin-empty-text">Add chapters to this book</div>
      </div>
    );
  }

  return (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            <th style={{ width: "60px" }}>#</th>
            <th>Title</th>
            <th style={{ width: "100px" }}>Status</th>
            <th style={{ width: "100px" }}>Words</th>
            <th style={{ width: "100px" }}>Reading</th>
            <th style={{ width: "120px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {chapters.map((chapter) => {
            const isUnpublished = !chapter.is_published;
            const hasDraftChanges = chapter.has_draft;

            return (
              <tr key={chapter.id}>
                <td>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "28px",
                      height: "28px",
                      background: "var(--muted)",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                    }}
                  >
                    {chapter.chapter_number}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: 500 }}>{chapter.title_en || `Chapter ${chapter.chapter_number}`}</div>
                  {chapter.title_si && (
                    <div
                      style={{
                        fontFamily: "var(--font-sinhala)",
                        fontSize: "0.8125rem",
                        color: "var(--muted-foreground)",
                      }}
                    >
                      {chapter.title_si}
                    </div>
                  )}
                </td>
                <td>
                  {isUnpublished ? (
                    <span
                      style={{
                        display: "inline-flex",
                        padding: "0.125rem 0.5rem",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        borderRadius: "9999px",
                        background: "rgba(245, 158, 11, 0.15)",
                        color: "rgb(180, 83, 9)",
                        border: "1px dashed rgba(245, 158, 11, 0.5)",
                      }}
                    >
                      Draft
                    </span>
                  ) : hasDraftChanges ? (
                    <span
                      style={{
                        display: "inline-flex",
                        padding: "0.125rem 0.5rem",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        borderRadius: "9999px",
                        background: "rgba(59, 130, 246, 0.15)",
                        color: "rgb(37, 99, 235)",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                      }}
                    >
                      Changes
                    </span>
                  ) : (
                    <span
                      style={{
                        display: "inline-flex",
                        padding: "0.125rem 0.5rem",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        borderRadius: "9999px",
                        background: "rgba(34, 197, 94, 0.15)",
                        color: "rgb(22, 163, 74)",
                      }}
                    >
                      Published
                    </span>
                  )}
                </td>
                <td>
                  <span style={{ color: "var(--muted-foreground)" }}>
                    {chapter.word_count.toLocaleString()}
                  </span>
                </td>
                <td>
                  <span style={{ color: "var(--muted-foreground)" }}>
                    {chapter.estimated_reading_time} min
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Link
                      href={`/admin?bookId=${bookId}&chapterId=${chapter.id}`}
                      className="admin-btn admin-btn-secondary admin-btn-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(chapter.id)}
                      disabled={deletingId === chapter.id}
                      className="admin-btn admin-btn-ghost admin-btn-sm"
                      style={{ color: "var(--destructive)" }}
                    >
                      {deletingId === chapter.id ? "..." : "🗑️"}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
