"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

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

  const handleContentChange = (content: string) => {
    setFormData((prev) => ({ ...prev, content }));
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

  // Word count - strip HTML tags for accurate count
  const plainText = formData.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = plainText ? plainText.split(/\s+/).filter((w) => w.length > 0).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <form onSubmit={handleSubmit} className="chapter-form">
      {error && (
        <div className="admin-error-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <p>{error}</p>
        </div>
      )}

      <div className="admin-card chapter-details-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Chapter Details</h2>
        </div>
        <div className="admin-card-body">
          <div className="chapter-form-grid">
            <div className="admin-form-group chapter-number-field">
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
            <div className="admin-form-group">
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
            <div className="admin-form-group">
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

      <div className="admin-card chapter-content-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Content</h2>
          <div className="chapter-stats">
            <span className="chapter-stat">
              <svg viewBox="0 0 20 20" fill="currentColor" className="chapter-stat-icon">
                <path d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" />
              </svg>
              {wordCount.toLocaleString()} words
            </span>
            <span className="chapter-stat">
              <svg viewBox="0 0 20 20" fill="currentColor" className="chapter-stat-icon">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
              </svg>
              ~{readingTime} min read
            </span>
          </div>
        </div>
        <div className="chapter-editor-wrapper">
          <RichTextEditor
            content={formData.content}
            onChange={handleContentChange}
            placeholder="Start writing your chapter here... (Sinhala text supported)"
          />
        </div>
      </div>

      <div className="chapter-form-actions">
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
              <span className="admin-btn-spinner" />
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
