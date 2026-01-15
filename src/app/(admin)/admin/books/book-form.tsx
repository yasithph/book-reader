"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Book {
  id?: string;
  title_en: string;
  title_si: string;
  description_en: string;
  description_si: string;
  author_en: string;
  author_si: string;
  cover_image_url: string;
  price_lkr: number;
  is_free: boolean;
  free_preview_chapters: number;
  is_published: boolean;
}

interface BookFormProps {
  book?: Book;
  isEdit?: boolean;
}

const emptyBook: Book = {
  title_en: "",
  title_si: "",
  description_en: "",
  description_si: "",
  author_en: "",
  author_si: "",
  cover_image_url: "",
  price_lkr: 0,
  is_free: false,
  free_preview_chapters: 2,
  is_published: false,
};

export function BookForm({ book = emptyBook, isEdit = false }: BookFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<Book>(book);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
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
        ? `/api/admin/books/${book.id}`
        : "/api/admin/books";

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save book");
      }

      router.push("/admin/books");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save book");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="book-form">
      {error && (
        <div className="admin-error-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <p>{error}</p>
        </div>
      )}

      {/* Basic Info */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Basic Information</h2>
        </div>
        <div className="admin-card-body">
          <div className="admin-form">
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Title (English) *</label>
                <input
                  type="text"
                  name="title_en"
                  value={formData.title_en}
                  onChange={handleChange}
                  className="admin-input"
                  required
                  placeholder="Enter book title in English"
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Title (Sinhala) *</label>
                <input
                  type="text"
                  name="title_si"
                  value={formData.title_si}
                  onChange={handleChange}
                  className="admin-input"
                  required
                  placeholder="සිංහල මාතෘකාව ඇතුලත් කරන්න"
                  style={{ fontFamily: "var(--font-sinhala)" }}
                />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Author (English) *</label>
                <input
                  type="text"
                  name="author_en"
                  value={formData.author_en}
                  onChange={handleChange}
                  className="admin-input"
                  required
                  placeholder="Author name"
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Author (Sinhala) *</label>
                <input
                  type="text"
                  name="author_si"
                  value={formData.author_si}
                  onChange={handleChange}
                  className="admin-input"
                  required
                  placeholder="කතුවරයාගේ නම"
                  style={{ fontFamily: "var(--font-sinhala)" }}
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Cover Image URL</label>
              <input
                type="url"
                name="cover_image_url"
                value={formData.cover_image_url}
                onChange={handleChange}
                className="admin-input"
                placeholder="https://example.com/cover.jpg"
              />
              {formData.cover_image_url && (
                <div style={{ marginTop: "0.75rem" }}>
                  <img
                    src={formData.cover_image_url}
                    alt="Cover preview"
                    style={{
                      width: "80px",
                      height: "120px",
                      objectFit: "cover",
                      borderRadius: "6px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Descriptions */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Description</h2>
        </div>
        <div className="admin-card-body">
          <div className="admin-form">
            <div className="admin-form-group">
              <label className="admin-label">Description (English)</label>
              <textarea
                name="description_en"
                value={formData.description_en}
                onChange={handleChange}
                className="admin-input admin-textarea"
                placeholder="Book description in English..."
                rows={4}
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Description (Sinhala)</label>
              <textarea
                name="description_si"
                value={formData.description_si}
                onChange={handleChange}
                className="admin-input admin-textarea"
                placeholder="පොතේ විස්තරය සිංහලෙන්..."
                rows={4}
                style={{ fontFamily: "var(--font-sinhala)" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pricing & Settings */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Pricing & Settings</h2>
        </div>
        <div className="admin-card-body">
          <div className="admin-form">
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Price (LKR)</label>
                <input
                  type="number"
                  name="price_lkr"
                  value={formData.price_lkr}
                  onChange={handleChange}
                  className="admin-input"
                  min="0"
                  step="50"
                  disabled={formData.is_free}
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Free Preview Chapters</label>
                <input
                  type="number"
                  name="free_preview_chapters"
                  value={formData.free_preview_chapters}
                  onChange={handleChange}
                  className="admin-input"
                  min="0"
                  max="10"
                />
              </div>
            </div>

            <div className="admin-form-row" style={{ marginTop: "1rem" }}>
              <label className="book-form-checkbox">
                <input
                  type="checkbox"
                  name="is_free"
                  checked={formData.is_free}
                  onChange={handleChange}
                />
                <span className="book-form-checkbox-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <span className="book-form-checkbox-label">
                  <strong>Free Book</strong>
                  <span>Make this book available to all users for free</span>
                </span>
              </label>

              <label className="book-form-checkbox">
                <input
                  type="checkbox"
                  name="is_published"
                  checked={formData.is_published}
                  onChange={handleChange}
                />
                <span className="book-form-checkbox-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <span className="book-form-checkbox-label">
                  <strong>Published</strong>
                  <span>Make this book visible in the catalog</span>
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="book-form-actions">
        <button
          type="button"
          onClick={() => router.push("/admin/books")}
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
            <>{isEdit ? "Update Book" : "Create Book"}</>
          )}
        </button>
      </div>
    </form>
  );
}
