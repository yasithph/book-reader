"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPhoneNumber, isValidSriLankanPhone } from "@/lib/textit/client";

interface Book {
  id: string;
  title_en: string;
  title_si: string;
  author_en: string;
  author_si: string;
  cover_image_url: string | null;
  price_lkr: number;
}

interface SelectedBook extends Book {
  customPrice: number;
}

interface RegistrationResult {
  user: {
    phone: string;
    display_name: string | null;
  };
  books: Array<{
    title: string;
    price: number;
  }>;
  total: number;
  smsSent: boolean;
}

export default function AdminRegisterPage() {
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<SelectedBook[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<RegistrationResult | null>(null);

  // Fetch available books
  useEffect(() => {
    async function fetchBooks() {
      try {
        const res = await fetch("/api/admin/books");
        if (!res.ok) throw new Error("Failed to fetch books");
        const data = await res.json();
        setBooks(data.books || []);
      } catch (err) {
        console.error("Error fetching books:", err);
        setError("Failed to load books");
      } finally {
        setIsLoading(false);
      }
    }
    fetchBooks();
  }, []);

  // Filter books by search
  const filteredBooks = books.filter(
    (book) =>
      book.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.title_si.includes(searchQuery) ||
      book.author_en.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle book selection
  const toggleBook = useCallback((book: Book) => {
    setSelectedBooks((prev) => {
      const exists = prev.find((b) => b.id === book.id);
      if (exists) {
        return prev.filter((b) => b.id !== book.id);
      }
      return [...prev, { ...book, customPrice: book.price_lkr }];
    });
  }, []);

  // Update custom price
  const updatePrice = useCallback((bookId: string, price: number) => {
    setSelectedBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, customPrice: price } : b))
    );
  }, []);

  // Remove selected book
  const removeBook = useCallback((bookId: string) => {
    setSelectedBooks((prev) => prev.filter((b) => b.id !== bookId));
  }, []);

  // Calculate total
  const total = selectedBooks.reduce((sum, book) => sum + book.customPrice, 0);

  // Validate phone
  const phoneValid = isValidSriLankanPhone(phone);
  const formattedPhone = phone ? formatPhoneNumber(phone) : "";

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phoneValid) {
      setError("Please enter a valid Sri Lankan phone number");
      return;
    }

    if (selectedBooks.length === 0) {
      setError("Please select at least one book");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/register-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formattedPhone,
          displayName: displayName || null,
          books: selectedBooks.map((b) => ({
            bookId: b.id,
            price: b.customPrice,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setPhone("");
    setDisplayName("");
    setSelectedBooks([]);
    setSearchQuery("");
    setError(null);
    setSuccess(null);
  };

  if (isLoading) {
    return (
      <div className="register-loading">
        <div className="register-loading-spinner" />
        <p>Loading books...</p>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="register-success-container">
        <div className="register-success-card">
          <div className="register-success-seal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <h1 className="register-success-title">Registration Complete</h1>
          <p className="register-success-subtitle">
            User has been successfully registered
          </p>

          <div className="register-success-details">
            <div className="register-success-row">
              <span className="register-success-label">Phone</span>
              <span className="register-success-value">+{success.user.phone}</span>
            </div>
            {success.user.display_name && (
              <div className="register-success-row">
                <span className="register-success-label">Name</span>
                <span className="register-success-value">{success.user.display_name}</span>
              </div>
            )}
            <div className="register-success-divider" />
            <div className="register-success-books">
              <span className="register-success-label">Books Assigned</span>
              {success.books.map((book, i) => (
                <div key={i} className="register-success-book">
                  <span>{book.title}</span>
                  <span>Rs. {book.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="register-success-divider" />
            <div className="register-success-row register-success-total">
              <span>Total Amount</span>
              <span>Rs. {success.total.toLocaleString()}</span>
            </div>
          </div>

          <div className="register-success-sms">
            {success.smsSent ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
                <span>SMS notification sent to user</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <span>SMS notification could not be sent</span>
              </>
            )}
          </div>

          <button onClick={resetForm} className="register-btn register-btn-primary">
            Register Another User
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-header">
        <div className="register-header-ornament">❧</div>
        <h1 className="register-title">Register New User</h1>
        <p className="register-subtitle">
          Enroll a reader into the literary collection
        </p>
      </div>

      <form onSubmit={handleSubmit} className="register-form">
        {error && (
          <div className="register-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* User Details Card */}
        <div className="register-card">
          <div className="register-card-header">
            <span className="register-card-number">1</span>
            <h2 className="register-card-title">Reader Details</h2>
          </div>
          <div className="register-card-body">
            <div className="register-field">
              <label className="register-label">
                Phone Number <span className="register-required">*</span>
              </label>
              <div className="register-phone-input">
                <span className="register-phone-prefix">+94</span>
                <input
                  type="tel"
                  value={phone.replace(/^(\+?94|0)/, "")}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="77 123 4567"
                  className="register-input"
                  maxLength={10}
                />
              </div>
              {phone && (
                <span className={`register-phone-status ${phoneValid ? "valid" : "invalid"}`}>
                  {phoneValid ? "✓ Valid number" : "Enter a valid 9-digit mobile number"}
                </span>
              )}
            </div>

            <div className="register-field">
              <label className="register-label">
                Display Name <span className="register-optional">(optional)</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter reader's name"
                className="register-input register-input-full"
              />
            </div>
          </div>
        </div>

        {/* Book Selection Card */}
        <div className="register-card">
          <div className="register-card-header">
            <span className="register-card-number">2</span>
            <h2 className="register-card-title">Select Books</h2>
          </div>
          <div className="register-card-body">
            {/* Search */}
            <div className="register-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search books..."
                className="register-search-input"
              />
            </div>

            {/* Book List */}
            <div className="register-book-list">
              {filteredBooks.length === 0 ? (
                <div className="register-empty">
                  <span>📚</span>
                  <p>No books found</p>
                </div>
              ) : (
                filteredBooks.map((book) => {
                  const isSelected = selectedBooks.some((b) => b.id === book.id);
                  return (
                    <div
                      key={book.id}
                      className={`register-book-item ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleBook(book)}
                    >
                      <div className="register-book-checkbox">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                      <div className="register-book-cover">
                        {book.cover_image_url ? (
                          <img src={book.cover_image_url} alt={book.title_en} />
                        ) : (
                          <span>📖</span>
                        )}
                      </div>
                      <div className="register-book-info">
                        <div className="register-book-title">{book.title_en}</div>
                        <div className="register-book-title-si">{book.title_si}</div>
                        <div className="register-book-author">{book.author_en}</div>
                      </div>
                      <div className="register-book-price">
                        Rs. {book.price_lkr.toLocaleString()}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Selected Books & Pricing Card */}
        {selectedBooks.length > 0 && (
          <div className="register-card register-card-highlight">
            <div className="register-card-header">
              <span className="register-card-number">3</span>
              <h2 className="register-card-title">
                Selected Books
                <span className="register-card-count">{selectedBooks.length}</span>
              </h2>
            </div>
            <div className="register-card-body">
              <div className="register-selected-list">
                {selectedBooks.map((book) => (
                  <div key={book.id} className="register-selected-item">
                    <div className="register-selected-info">
                      <div className="register-selected-title">{book.title_en}</div>
                      <div className="register-selected-author">{book.author_en}</div>
                    </div>
                    <div className="register-selected-price">
                      <span className="register-price-label">Price (LKR)</span>
                      <input
                        type="number"
                        value={book.customPrice}
                        onChange={(e) =>
                          updatePrice(book.id, parseFloat(e.target.value) || 0)
                        }
                        className="register-price-input"
                        min="0"
                        step="50"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBook(book.id)}
                      className="register-remove-btn"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <div className="register-total">
                <span className="register-total-label">Total Amount</span>
                <span className="register-total-value">
                  Rs. {total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="register-actions">
          <button
            type="submit"
            disabled={isSubmitting || !phoneValid || selectedBooks.length === 0}
            className="register-btn register-btn-primary register-btn-submit"
          >
            {isSubmitting ? (
              <>
                <span className="register-btn-spinner" />
                Registering...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
                Register & Send SMS
              </>
            )}
          </button>
          <p className="register-actions-hint">
            An SMS will be sent to the user with login instructions
          </p>
        </div>
      </form>
    </div>
  );
}
