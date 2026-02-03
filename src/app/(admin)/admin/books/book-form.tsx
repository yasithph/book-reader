"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

// Hardcoded author name
const AUTHOR_EN = "Kashvi Amarasooriya";
const AUTHOR_SI = "කශ්වි අමරසූරිය";

// Database shape (allows null)
interface BookData {
  id?: string;
  title_en: string | null;
  title_si: string | null;
  description_en: string | null;
  description_si: string | null;
  author_en: string | null;
  author_si: string | null;
  cover_image_url: string | null;
  price_lkr: number | null;
  is_free: boolean | null;
  free_preview_chapters: number | null;
  is_published: boolean | null;
}

// Form state shape (no nulls - used by controlled inputs)
interface BookFormData {
  id?: string;
  title_en: string;
  title_si: string;
  description_en: string;
  description_si: string;
  cover_image_url: string;
  price_lkr: number;
  is_free: boolean;
  free_preview_chapters: number;
  is_published: boolean;
}

interface BookFormProps {
  book?: BookData;
  isEdit?: boolean;
}

const emptyBook: BookFormData = {
  title_en: "",
  title_si: "",
  description_en: "",
  description_si: "",
  cover_image_url: "",
  price_lkr: 0,
  is_free: false,
  free_preview_chapters: 2,
  is_published: false,
};

export function BookForm({ book, isEdit = false }: BookFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ensure no null values - convert to empty strings for controlled inputs
  const [formData, setFormData] = useState<BookFormData>(() => ({
    id: book?.id,
    title_en: book?.title_en ?? "",
    title_si: book?.title_si ?? "",
    description_en: book?.description_en ?? "",
    description_si: book?.description_si ?? "",
    cover_image_url: book?.cover_image_url ?? "",
    price_lkr: book?.price_lkr ?? 0,
    is_free: book?.is_free ?? false,
    free_preview_chapters: book?.free_preview_chapters ?? 2,
    is_published: book?.is_published ?? false,
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be less than 10MB");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formDataUpload,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      setFormData((prev) => ({ ...prev, cover_image_url: data.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, cover_image_url: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const url = isEdit
        ? `/api/admin/books/${formData.id}`
        : "/api/admin/books";

      // Include hardcoded author values
      const submitData = {
        ...formData,
        author_en: AUTHOR_EN,
        author_si: AUTHOR_SI,
      };

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
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

            <div className="admin-form-group">
              <label className="admin-label">Cover Image</label>
              <div className="cover-upload-area">
                {formData.cover_image_url ? (
                  <div className="cover-preview">
                    <img
                      src={formData.cover_image_url}
                      alt="Cover preview"
                      className="cover-preview-image"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder-cover.png";
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="cover-remove-btn"
                      title="Remove image"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label className="cover-upload-label">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="cover-upload-input"
                      disabled={isUploading}
                    />
                    <div className="cover-upload-content">
                      {isUploading ? (
                        <>
                          <span className="admin-btn-spinner" style={{ width: 24, height: 24 }} />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="cover-upload-icon">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                          </svg>
                          <span>Click to upload cover image</span>
                          <span className="cover-upload-hint">PNG, JPG up to 10MB</span>
                        </>
                      )}
                    </div>
                  </label>
                )}
              </div>
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
