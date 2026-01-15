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
            <th style={{ width: "100px" }}>Words</th>
            <th style={{ width: "100px" }}>Reading</th>
            <th style={{ width: "120px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {chapters.map((chapter) => (
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
                <div style={{ fontWeight: 500 }}>{chapter.title_en || "Untitled"}</div>
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
                    href={`/admin/books/${bookId}/chapters/${chapter.id}`}
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
