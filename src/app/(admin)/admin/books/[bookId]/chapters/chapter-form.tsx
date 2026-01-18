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
    <form onSubmit={handleSubmit} className="chapter-editor-page">
      {error && (
        <div className="chapter-editor-error">
          {error}
          <button type="button" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Compact Header */}
      <div className="chapter-editor-header">
        <div className="chapter-editor-meta">
          <span className="chapter-number-badge">Ch. {formData.chapter_number}</span>
          <span className="chapter-meta-divider">·</span>
          <span className="chapter-meta-stat">{wordCount.toLocaleString()} words</span>
          <span className="chapter-meta-divider">·</span>
          <span className="chapter-meta-stat">{readingTime} min read</span>
        </div>
        <div className="chapter-editor-actions">
          <button
            type="button"
            onClick={() => router.push(`/admin/books/${bookId}`)}
            className="chapter-btn-ghost"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="chapter-btn-save"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : isEdit ? "Update" : "Publish"}
          </button>
        </div>
      </div>

      {/* Title Inputs - Minimal */}
      <div className="chapter-title-section">
        <input
          type="text"
          name="title_en"
          value={formData.title_en}
          onChange={handleChange}
          className="chapter-title-input"
          placeholder="Chapter title"
          autoFocus
        />
        <input
          type="text"
          name="title_si"
          value={formData.title_si}
          onChange={handleChange}
          className="chapter-title-input chapter-title-si"
          placeholder="පරිච්ඡේද මාතෘකාව"
        />
      </div>

      {/* Hidden chapter number - can be changed in settings */}
      <input type="hidden" name="chapter_number" value={formData.chapter_number} />

      {/* Full-width Editor */}
      <div className="chapter-editor-main">
        <RichTextEditor
          content={formData.content}
          onChange={handleContentChange}
          placeholder="Start writing..."
        />
      </div>
    </form>
  );
}
