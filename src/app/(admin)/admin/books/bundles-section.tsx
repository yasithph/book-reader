"use client";

import { useState, useEffect, useMemo } from "react";

interface Book {
  id: string;
  title_en: string;
  title_si: string;
  cover_image_url: string | null;
  price_lkr: number;
}

interface Bundle {
  id: string;
  name_en: string;
  name_si: string | null;
  description_en: string | null;
  description_si: string | null;
  price_lkr: number;
  is_active: boolean;
  books: Book[];
  original_price: number;
  savings: number;
  book_count: number;
}

interface BundlesSectionProps {
  initialBundles: Bundle[];
  allBooks: Book[];
}

export function BundlesSection({ initialBundles, allBooks }: BundlesSectionProps) {
  const [bundles, setBundles] = useState<Bundle[]>(initialBundles);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [nameEn, setNameEn] = useState("");
  const [nameSi, setNameSi] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [bundlePrice, setBundlePrice] = useState("");

  // Calculate original price and savings
  const originalPrice = useMemo(() => {
    return selectedBookIds.reduce((sum, bookId) => {
      const book = allBooks.find((b) => b.id === bookId);
      return sum + (book?.price_lkr || 0);
    }, 0);
  }, [selectedBookIds, allBooks]);

  const savings = useMemo(() => {
    const price = parseFloat(bundlePrice) || 0;
    return originalPrice - price;
  }, [originalPrice, bundlePrice]);

  const resetForm = () => {
    setNameEn("");
    setNameSi("");
    setDescriptionEn("");
    setSelectedBookIds([]);
    setBundlePrice("");
    setEditingBundle(null);
  };

  const openModal = (bundle?: Bundle) => {
    if (bundle) {
      setEditingBundle(bundle);
      setNameEn(bundle.name_en);
      setNameSi(bundle.name_si || "");
      setDescriptionEn(bundle.description_en || "");
      setSelectedBookIds(bundle.books.map((b) => b.id));
      setBundlePrice(bundle.price_lkr.toString());
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const toggleBook = (bookId: string) => {
    setSelectedBookIds((prev) =>
      prev.includes(bookId)
        ? prev.filter((id) => id !== bookId)
        : [...prev, bookId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBookIds.length < 2) {
      alert("Please select at least 2 books for a bundle");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name_en: nameEn,
        name_si: nameSi || null,
        description_en: descriptionEn || null,
        price_lkr: parseFloat(bundlePrice),
        book_ids: selectedBookIds,
      };

      const url = editingBundle
        ? `/api/admin/bundles/${editingBundle.id}`
        : "/api/admin/bundles";
      const method = editingBundle ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save bundle");
      }

      const data = await res.json();

      if (editingBundle) {
        setBundles((prev) =>
          prev.map((b) => (b.id === editingBundle.id ? data.bundle : b))
        );
      } else {
        setBundles((prev) => [data.bundle, ...prev]);
      }

      closeModal();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (bundleId: string) => {
    if (!confirm("Are you sure you want to delete this bundle?")) return;

    try {
      const res = await fetch(`/api/admin/bundles/${bundleId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete bundle");
      }

      const data = await res.json();
      if (data.message?.includes("deactivated")) {
        // Bundle was deactivated, update state
        setBundles((prev) =>
          prev.map((b) => (b.id === bundleId ? { ...b, is_active: false } : b))
        );
      } else {
        // Bundle was deleted
        setBundles((prev) => prev.filter((b) => b.id !== bundleId));
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const toggleActive = async (bundle: Bundle) => {
    try {
      const res = await fetch(`/api/admin/bundles/${bundle.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !bundle.is_active }),
      });

      if (!res.ok) throw new Error("Failed to update bundle");

      const data = await res.json();
      setBundles((prev) =>
        prev.map((b) => (b.id === bundle.id ? data.bundle : b))
      );
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <>
      {/* Bundles Header */}
      <div className="admin-page-header-actions" style={{ marginTop: "3rem" }}>
        <div>
          <h2 className="admin-page-title" style={{ fontSize: "1.5rem" }}>
            Bundles
          </h2>
          <p className="admin-page-subtitle">
            {bundles.filter((b) => b.is_active).length} active{" "}
            {bundles.filter((b) => b.is_active).length === 1 ? "bundle" : "bundles"}
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="admin-btn admin-btn-primary"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ width: 18, height: 18 }}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Bundle
        </button>
      </div>

      {/* Bundles Grid */}
      {bundles.length > 0 ? (
        <div className="admin-bundle-grid">
          {bundles.map((bundle) => (
            <div
              key={bundle.id}
              className={`admin-bundle-card ${!bundle.is_active ? "admin-bundle-card--inactive" : ""}`}
            >
              {/* Stacked Book Covers */}
              <div className="admin-bundle-covers">
                {bundle.books.slice(0, 3).map((book, index) => (
                  <div
                    key={book.id}
                    className="admin-bundle-cover"
                    style={{
                      zIndex: 3 - index,
                      transform: `translateX(${index * 20}px) rotate(${index * 3 - 3}deg)`,
                    }}
                  >
                    {book.cover_image_url ? (
                      <img src={book.cover_image_url} alt={book.title_en} />
                    ) : (
                      <div className="admin-bundle-cover-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bundle Info */}
              <div className="admin-bundle-info">
                <h3 className="admin-bundle-name">{bundle.name_en}</h3>
                {bundle.name_si && (
                  <p className="admin-bundle-name-si">{bundle.name_si}</p>
                )}
                <p className="admin-bundle-books-count">
                  {bundle.book_count} books included
                </p>

                {/* Pricing */}
                <div className="admin-bundle-pricing">
                  <span className="admin-bundle-original">
                    Rs. {bundle.original_price.toLocaleString()}
                  </span>
                  <span className="admin-bundle-price">
                    Rs. {bundle.price_lkr.toLocaleString()}
                  </span>
                  {bundle.savings > 0 && (
                    <span className="admin-bundle-savings">
                      Save Rs. {bundle.savings.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Status Badge */}
                {!bundle.is_active && (
                  <span className="admin-badge admin-badge-warning" style={{ marginTop: "0.5rem" }}>
                    Inactive
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="admin-bundle-actions">
                <button
                  onClick={() => openModal(bundle)}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleActive(bundle)}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  {bundle.is_active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => handleDelete(bundle.id)}
                  className="admin-btn admin-btn-danger admin-btn-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-card">
          <div className="admin-card-empty">
            <div className="admin-card-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="9" rx="1" />
                <rect x="8" y="12" width="8" height="9" rx="1" />
              </svg>
            </div>
            <h3 className="admin-card-empty-title">No bundles yet</h3>
            <p className="admin-card-empty-text">
              Create bundle deals to offer discounts on multiple books
            </p>
            <button
              onClick={() => openModal()}
              className="admin-btn admin-btn-primary"
              style={{ marginTop: "1.5rem" }}
            >
              Create Bundle
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {editingBundle ? "Edit Bundle" : "Create Bundle"}
              </h2>
              <button
                onClick={closeModal}
                className="admin-modal-close"
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="admin-modal-body">
              {/* Bundle Name */}
              <div className="admin-form-group">
                <label className="admin-form-label">
                  Bundle Name (English) <span className="admin-required">*</span>
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="admin-form-input"
                  placeholder="e.g., Complete Collection"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Bundle Name (Sinhala)</label>
                <input
                  type="text"
                  value={nameSi}
                  onChange={(e) => setNameSi(e.target.value)}
                  className="admin-form-input"
                  placeholder="සම්පූර්ණ එකතුව"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Description (Optional)</label>
                <textarea
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  className="admin-form-input admin-form-textarea"
                  placeholder="Brief description of the bundle..."
                  rows={2}
                />
              </div>

              {/* Book Selection */}
              <div className="admin-form-group">
                <label className="admin-form-label">
                  Select Books <span className="admin-required">*</span>
                  <span className="admin-form-hint">
                    (Select at least 2 books)
                  </span>
                </label>
                <div className="admin-book-selector">
                  {allBooks.map((book) => {
                    const isSelected = selectedBookIds.includes(book.id);
                    return (
                      <label
                        key={book.id}
                        className={`admin-book-selector-item ${isSelected ? "selected" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleBook(book.id)}
                          className="admin-book-selector-checkbox"
                        />
                        <div className="admin-book-selector-cover">
                          {book.cover_image_url ? (
                            <img src={book.cover_image_url} alt={book.title_en} />
                          ) : (
                            <div className="admin-book-selector-placeholder">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                              </svg>
                            </div>
                          )}
                          {isSelected && (
                            <div className="admin-book-selector-check">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="admin-book-selector-info">
                          <span className="admin-book-selector-title">{book.title_en}</span>
                          <span className="admin-book-selector-price">
                            Rs. {book.price_lkr.toLocaleString()}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Pricing */}
              <div className="admin-form-row">
                <div className="admin-form-group" style={{ flex: 1 }}>
                  <label className="admin-form-label">
                    Bundle Price (LKR) <span className="admin-required">*</span>
                  </label>
                  <input
                    type="number"
                    value={bundlePrice}
                    onChange={(e) => setBundlePrice(e.target.value)}
                    className="admin-form-input"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>

                {/* Live Calculation */}
                <div className="admin-bundle-calculation">
                  <div className="admin-bundle-calc-row">
                    <span>Original Price:</span>
                    <span>Rs. {originalPrice.toLocaleString()}</span>
                  </div>
                  <div className="admin-bundle-calc-row">
                    <span>Bundle Price:</span>
                    <span>Rs. {(parseFloat(bundlePrice) || 0).toLocaleString()}</span>
                  </div>
                  <div className={`admin-bundle-calc-row admin-bundle-calc-savings ${savings > 0 ? "positive" : savings < 0 ? "negative" : ""}`}>
                    <span>Savings:</span>
                    <span>
                      {savings >= 0 ? "Rs. " : "-Rs. "}
                      {Math.abs(savings).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="admin-modal-actions">
                <button
                  type="button"
                  onClick={closeModal}
                  className="admin-btn admin-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || selectedBookIds.length < 2}
                  className="admin-btn admin-btn-primary"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingBundle
                    ? "Update Bundle"
                    : "Create Bundle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
