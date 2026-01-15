"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Chapter {
  id?: string;
  book_id: string;
  chapter_number: number;
  title_en: string;
  title_si: string;
  content: string;
}

interface ChapterFormProps {
  bookId: string;
  chapter?: Partial<Chapter>;
  nextChapterNumber?: number;
  isEdit?: boolean;
}

export function ChapterForm({
  bookId,
  chapter,
  nextChapterNumber = 1,
  isEdit = false,
}: ChapterFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    chapter_number: chapter?.chapter_number || nextChapterNumber,
    title_en: chapter?.title_en || "",
    title_si: chapter?.title_si || "",
    content: chapter?.content || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 1 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const url = isEdit
        ? `/api/admin/chapters/${chapter?.id}`
        : "/api/admin/chapters";

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book_id: bookId,
          ...formData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save chapter");
      }

      router.push(`/admin/books/${bookId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save chapter");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Word count for preview
  const wordCount = formData.content
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="admin-error-banner" style={{ marginBottom: "1.5rem" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <p>{error}</p>
        </div>
      )}

      <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
        <div className="admin-card-header">
          <h2 className="admin-card-title">Chapter Details</h2>
        </div>
        <div className="admin-card-body">
          <div className="admin-form">
            <div className="admin-form-row">
              <div className="admin-form-group" style={{ maxWidth: "120px" }}>
                <label className="admin-label">Chapter #</label>
                <input
                  type="number"
                  name="chapter_number"
                  value={formData.chapter_number}
                  onChange={handleChange}
                  className="admin-input"
                  min="1"
                  required
                />
              </div>
              <div className="admin-form-group" style={{ flex: 1 }}>
                <label className="admin-label">Title (English)</label>
                <input
                  type="text"
                  name="title_en"
                  value={formData.title_en}
                  onChange={handleChange}
                  className="admin-input"
                  placeholder="Chapter title in English"
                />
              </div>
              <div className="admin-form-group" style={{ flex: 1 }}>
                <label className="admin-label">Title (Sinhala)</label>
                <input
                  type="text"
                  name="title_si"
                  value={formData.title_si}
                  onChange={handleChange}
                  className="admin-input"
                  placeholder="පරිච්ඡේද මාතෘකාව"
                  style={{ fontFamily: "var(--font-sinhala)" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
        <div className="admin-card-header">
          <h2 className="admin-card-title">Content</h2>
          <div style={{ display: "flex", gap: "1rem", fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
            <span>{wordCount.toLocaleString()} words</span>
            <span>~{readingTime} min read</span>
          </div>
        </div>
        <div className="admin-card-body">
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            className="admin-input chapter-content-editor"
            placeholder="Enter chapter content here... (Sinhala text supported)"
            required
            rows={20}
            style={{
              fontFamily: "var(--font-sinhala)",
              fontSize: "1.0625rem",
              lineHeight: 1.8,
              minHeight: "400px",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={() => router.push(`/admin/books/${bookId}`)}
          className="admin-btn admin-btn-secondary"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="admin-btn admin-btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="admin-btn-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              Saving...
            </>
          ) : (
            <>{isEdit ? "Update Chapter" : "Create Chapter"}</>
          )}
        </button>
      </div>
    </form>
  );
}
