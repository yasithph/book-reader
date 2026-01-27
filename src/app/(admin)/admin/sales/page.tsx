"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { formatPhoneNumber, isValidSriLankanPhone } from "@/lib/textit/client";

interface Book {
  id: string;
  title_en: string;
  title_si: string;
  author_en: string;
  cover_image_url: string | null;
  price_lkr: number;
  is_free: boolean;
}

interface Bundle {
  id: string;
  name_en: string;
  name_si: string | null;
  price_lkr: number;
  is_active: boolean;
  books: { id: string; title_en: string; price_lkr: number }[];
  original_price: number;
  savings: number;
}

interface User {
  id: string;
  phone: string | null;
  email: string | null;
  display_name: string | null;
  created_at: string;
}

interface Purchase {
  id: string;
  user_id: string;
  book_id: string | null;
  bundle_id: string | null;
  amount_lkr: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  payment_proof_url?: string | null;
  payment_reference?: string | null;
  user?: { phone: string | null; email: string | null; display_name: string | null };
  book?: { title_en: string };
  bundle?: { name_en: string };
}

type ViewMode = "new-sale" | "history";
type SellerMode = "new-user" | "existing-user";
type ProductMode = "books" | "bundles";

interface SelectedBook extends Book {
  customPrice: number;
}

interface SaleResult {
  user: { phone: string | null; email: string | null; display_name: string | null };
  items: { title: string; price: number }[];
  total: number;
  smsSent: boolean;
}

export default function AdminSalesPage() {
  // View mode: new sale or history
  const [viewMode, setViewMode] = useState<ViewMode>("new-sale");

  // Sale form state
  const [sellerMode, setSellerMode] = useState<SellerMode>("new-user");
  const [productMode, setProductMode] = useState<ProductMode>("books");

  // New user fields
  const [contactMode, setContactMode] = useState<"phone" | "email">("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");

  // Existing user search
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Products
  const [books, setBooks] = useState<Book[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<SelectedBook[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Purchase history
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SaleResult | null>(null);

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        const [booksRes, bundlesRes, usersRes] = await Promise.all([
          fetch("/api/admin/books"),
          fetch("/api/admin/bundles"),
          fetch("/api/admin/users"),
        ]);

        const [booksData, bundlesData, usersData] = await Promise.all([
          booksRes.json(),
          bundlesRes.json(),
          usersRes.json(),
        ]);

        setBooks(booksData.books || []);
        setBundles((bundlesData.bundles || []).filter((b: Bundle) => b.is_active));
        setUsers(usersData.users || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Fetch purchase history when switching to history view
  useEffect(() => {
    if (viewMode === "history" && purchases.length === 0) {
      fetchPurchaseHistory();
    }
  }, [viewMode]);

  const fetchPurchaseHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/admin/purchases");
      const data = await res.json();
      setPurchases(data.purchases || []);
    } catch (err) {
      console.error("Error fetching purchases:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Filter paid books (exclude free)
  const paidBooks = useMemo(() => books.filter((b) => !b.is_free), [books]);

  // Filter books by search
  const filteredBooks = useMemo(() => {
    if (!searchQuery) return paidBooks;
    const q = searchQuery.toLowerCase();
    return paidBooks.filter(
      (book) =>
        book.title_en.toLowerCase().includes(q) ||
        book.title_si.includes(searchQuery) ||
        book.author_en.toLowerCase().includes(q)
    );
  }, [paidBooks, searchQuery]);

  // Filter users by search
  const filteredUsers = useMemo(() => {
    if (!userSearch) return users.slice(0, 10);
    const q = userSearch.toLowerCase();
    return users.filter(
      (user) =>
        user.phone?.includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.display_name?.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [users, userSearch]);

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

  // Select bundle
  const selectBundle = (bundle: Bundle | null) => {
    setSelectedBundle(bundle);
  };

  // Calculate total
  const total = useMemo(() => {
    if (productMode === "bundles" && selectedBundle) {
      return selectedBundle.price_lkr;
    }
    return selectedBooks.reduce((sum, book) => sum + book.customPrice, 0);
  }, [productMode, selectedBundle, selectedBooks]);

  // Validate contact info for new user
  const phoneValid = isValidSriLankanPhone(phone);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const formattedPhone = phone ? formatPhoneNumber(phone) : "";

  // Check if phone belongs to existing user
  const existingUserWithPhone = useMemo(() => {
    if (!phoneValid || !formattedPhone) return null;
    return users.find((u) => u.phone === formattedPhone) || null;
  }, [phoneValid, formattedPhone, users]);

  // Check if email belongs to existing user
  const existingUserWithEmail = useMemo(() => {
    if (!emailValid) return null;
    const normalizedEmail = email.toLowerCase().trim();
    return users.find((u) => u.email === normalizedEmail) || null;
  }, [emailValid, email, users]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    // User validation
    const hasUser = sellerMode === "existing-user"
      ? selectedUser !== null
      : contactMode === "email" ? emailValid : phoneValid;

    // Product validation
    const hasProduct = productMode === "bundles"
      ? selectedBundle !== null
      : selectedBooks.length > 0;

    return hasUser && hasProduct;
  }, [sellerMode, selectedUser, contactMode, phoneValid, emailValid, productMode, selectedBundle, selectedBooks]);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isFormValid) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {};

      // User info
      if (sellerMode === "existing-user" && selectedUser) {
        payload.userId = selectedUser.id;
      } else if (contactMode === "email") {
        payload.email = email.toLowerCase().trim();
        payload.displayName = displayName || null;
      } else {
        payload.phone = formattedPhone;
        payload.displayName = displayName || null;
      }

      // Product info
      if (productMode === "bundles" && selectedBundle) {
        payload.bundleId = selectedBundle.id;
        payload.amount = selectedBundle.price_lkr;
      } else {
        payload.books = selectedBooks.map((b) => ({
          bookId: b.id,
          price: b.customPrice,
        }));
      }

      const res = await fetch("/api/admin/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Sale failed");
      }

      setSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sale failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setPhone("");
    setEmail("");
    setDisplayName("");
    setContactMode("phone");
    setUserSearch("");
    setSelectedUser(null);
    setSelectedBooks([]);
    setSelectedBundle(null);
    setSearchQuery("");
    setError(null);
    setSuccess(null);
    setSellerMode("new-user");
    setProductMode("books");
  };

  if (isLoading) {
    return (
      <div className="sales-loading">
        <div className="sales-loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="sales-success-container">
        <div className="sales-success-card">
          <div className="sales-success-seal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <h1 className="sales-success-title">Sale Complete</h1>
          <p className="sales-success-subtitle">
            Purchase has been recorded successfully
          </p>

          <div className="sales-success-details">
            <div className="sales-success-row">
              <span className="sales-success-label">Customer</span>
              <span className="sales-success-value">
                {success.user.display_name || (success.user.phone ? `+${success.user.phone}` : success.user.email)}
              </span>
            </div>
            <div className="sales-success-divider" />
            <div className="sales-success-items">
              <span className="sales-success-label">Items</span>
              {success.items.map((item, i) => (
                <div key={i} className="sales-success-item">
                  <span>{item.title}</span>
                  <span>Rs. {item.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="sales-success-divider" />
            <div className="sales-success-row sales-success-total">
              <span>Total Amount</span>
              <span>Rs. {success.total.toLocaleString()}</span>
            </div>
          </div>

          <div className="sales-success-sms">
            {success.smsSent ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
                <span>Notification sent</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <span>Notification could not be sent</span>
              </>
            )}
          </div>

          <button onClick={resetForm} className="sales-btn sales-btn-primary">
            Record Another Sale
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sales-page">
      {/* View Toggle */}
      <div className="sales-view-toggle">
        <button
          className={`sales-view-btn ${viewMode === "new-sale" ? "active" : ""}`}
          onClick={() => setViewMode("new-sale")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Sale
        </button>
        <button
          className={`sales-view-btn ${viewMode === "history" ? "active" : ""}`}
          onClick={() => setViewMode("history")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          History
        </button>
      </div>

      {viewMode === "history" ? (
        <PurchaseHistory
          purchases={purchases}
          loading={historyLoading}
          onRefresh={fetchPurchaseHistory}
        />
      ) : (
        <>
          <div className="sales-header">
            <h1 className="sales-title">Record Sale</h1>
            <p className="sales-subtitle">
              Register a new purchase for a customer
            </p>
          </div>

          <form onSubmit={handleSubmit} className="sales-form">
            {error && (
              <div className="sales-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Customer Selection Card */}
            <div className="sales-card">
              <div className="sales-card-header">
                <span className="sales-card-number">1</span>
                <h2 className="sales-card-title">Customer</h2>
              </div>

              {/* Seller Mode Toggle */}
              <div className="sales-mode-toggle">
                <button
                  type="button"
                  className={`sales-mode-btn ${sellerMode === "new-user" ? "active" : ""}`}
                  onClick={() => {
                    setSellerMode("new-user");
                    setSelectedUser(null);
                  }}
                >
                  New Customer
                </button>
                <button
                  type="button"
                  className={`sales-mode-btn ${sellerMode === "existing-user" ? "active" : ""}`}
                  onClick={() => {
                    setSellerMode("existing-user");
                    setPhone("");
                    setEmail("");
                    setDisplayName("");
                  }}
                >
                  Existing Customer
                </button>
              </div>

              <div className="sales-card-body">
                {sellerMode === "new-user" ? (
                  <>
                    {/* Contact mode toggle */}
                    <div className="sales-mode-toggle" style={{ marginBottom: '12px' }}>
                      <button
                        type="button"
                        className={`sales-mode-btn ${contactMode === "phone" ? "active" : ""}`}
                        onClick={() => { setContactMode("phone"); setEmail(""); }}
                      >
                        Phone
                      </button>
                      <button
                        type="button"
                        className={`sales-mode-btn ${contactMode === "email" ? "active" : ""}`}
                        onClick={() => { setContactMode("email"); setPhone(""); }}
                      >
                        Email
                      </button>
                    </div>

                    {contactMode === "phone" ? (
                      <div className="sales-field">
                        <label className="sales-label">
                          Phone Number <span className="sales-required">*</span>
                        </label>
                        <div className="sales-phone-input">
                          <span className="sales-phone-prefix">+94</span>
                          <input
                            type="tel"
                            value={phone.replace(/^(\+?94|0)/, "")}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                            placeholder="77 123 4567"
                            className="sales-input"
                            maxLength={10}
                          />
                        </div>
                        {phone && !existingUserWithPhone && (
                          <span className={`sales-phone-status ${phoneValid ? "valid" : "invalid"}`}>
                            {phoneValid ? "Valid number" : "Enter a valid 9-digit mobile number"}
                          </span>
                        )}
                        {existingUserWithPhone && (
                          <div className="sales-phone-existing">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 8v4M12 16h.01" />
                            </svg>
                            <span>
                              This number belongs to{" "}
                              <strong>{existingUserWithPhone.display_name || "an existing customer"}</strong>
                            </span>
                            <button
                              type="button"
                              className="sales-phone-existing-btn"
                              onClick={() => {
                                setSellerMode("existing-user");
                                setSelectedUser(existingUserWithPhone);
                                setPhone("");
                                setDisplayName("");
                              }}
                            >
                              Select them
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="sales-field">
                        <label className="sales-label">
                          Email Address <span className="sales-required">*</span>
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="customer@example.com"
                          className="sales-input sales-input-full"
                        />
                        {email && !existingUserWithEmail && (
                          <span className={`sales-phone-status ${emailValid ? "valid" : "invalid"}`}>
                            {emailValid ? "Valid email" : "Enter a valid email address"}
                          </span>
                        )}
                        {existingUserWithEmail && (
                          <div className="sales-phone-existing">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 8v4M12 16h.01" />
                            </svg>
                            <span>
                              This email belongs to{" "}
                              <strong>{existingUserWithEmail.display_name || "an existing customer"}</strong>
                            </span>
                            <button
                              type="button"
                              className="sales-phone-existing-btn"
                              onClick={() => {
                                setSellerMode("existing-user");
                                setSelectedUser(existingUserWithEmail);
                                setEmail("");
                                setDisplayName("");
                              }}
                            >
                              Select them
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="sales-field">
                      <label className="sales-label">
                        Display Name <span className="sales-optional">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Customer's name"
                        className="sales-input sales-input-full"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="sales-field">
                      <label className="sales-label">Search Customer</label>
                      <div className="sales-search">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="8" />
                          <path d="M21 21l-4.35-4.35" />
                        </svg>
                        <input
                          type="text"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          placeholder="Search by phone or name..."
                          className="sales-search-input"
                        />
                      </div>
                    </div>

                    {selectedUser ? (
                      <div className="sales-selected-user">
                        <div className="sales-selected-user-info">
                          <div className="sales-selected-user-avatar">
                            {selectedUser.display_name?.[0] || selectedUser.phone?.slice(-2) || selectedUser.email?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <div className="sales-selected-user-name">
                              {selectedUser.display_name || "No name"}
                            </div>
                            <div className="sales-selected-user-phone">
                              {selectedUser.phone ? `+${selectedUser.phone}` : selectedUser.email}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedUser(null)}
                          className="sales-selected-user-remove"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="sales-user-list">
                        {filteredUsers.length === 0 ? (
                          <div className="sales-user-empty">
                            No customers found
                          </div>
                        ) : (
                          filteredUsers.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              className="sales-user-item"
                              onClick={() => setSelectedUser(user)}
                            >
                              <div className="sales-user-avatar">
                                {user.display_name?.[0] || user.phone?.slice(-2) || user.email?.[0]?.toUpperCase() || "?"}
                              </div>
                              <div className="sales-user-info">
                                <div className="sales-user-name">
                                  {user.display_name || "No name"}
                                </div>
                                <div className="sales-user-phone">
                                  {user.phone ? `+${user.phone}` : user.email}
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Product Selection Card */}
            <div className="sales-card">
              <div className="sales-card-header">
                <span className="sales-card-number">2</span>
                <h2 className="sales-card-title">Products</h2>
              </div>

              {/* Product Mode Toggle */}
              <div className="sales-mode-toggle">
                <button
                  type="button"
                  className={`sales-mode-btn ${productMode === "books" ? "active" : ""}`}
                  onClick={() => {
                    setProductMode("books");
                    setSelectedBundle(null);
                  }}
                >
                  Individual Books
                </button>
                <button
                  type="button"
                  className={`sales-mode-btn ${productMode === "bundles" ? "active" : ""}`}
                  onClick={() => {
                    setProductMode("bundles");
                    setSelectedBooks([]);
                  }}
                  disabled={bundles.length === 0}
                >
                  Bundles
                  {bundles.length === 0 && <span className="sales-mode-badge">None</span>}
                </button>
              </div>

              <div className="sales-card-body">
                {productMode === "books" ? (
                  <>
                    {/* Search */}
                    <div className="sales-search">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                      </svg>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search books..."
                        className="sales-search-input"
                      />
                    </div>

                    {/* Book List */}
                    <div className="sales-book-list">
                      {filteredBooks.length === 0 ? (
                        <div className="sales-empty">
                          <span>No books found</span>
                        </div>
                      ) : (
                        filteredBooks.map((book) => {
                          const isSelected = selectedBooks.some((b) => b.id === book.id);
                          return (
                            <div
                              key={book.id}
                              className={`sales-book-item ${isSelected ? "selected" : ""}`}
                              onClick={() => toggleBook(book)}
                            >
                              <div className="sales-book-checkbox">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <path d="M20 6L9 17l-5-5" />
                                </svg>
                              </div>
                              <div className="sales-book-cover">
                                {book.cover_image_url ? (
                                  <img src={book.cover_image_url} alt={book.title_en} />
                                ) : (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                                  </svg>
                                )}
                              </div>
                              <div className="sales-book-info">
                                <div className="sales-book-title">{book.title_en}</div>
                                <div className="sales-book-author">{book.author_en}</div>
                              </div>
                              <div className="sales-book-price">
                                Rs. {book.price_lkr.toLocaleString()}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                ) : (
                  /* Bundle List */
                  <div className="sales-bundle-list">
                    {bundles.length === 0 ? (
                      <div className="sales-empty">
                        <span>No bundles available</span>
                      </div>
                    ) : (
                      bundles.map((bundle) => {
                        const isSelected = selectedBundle?.id === bundle.id;
                        return (
                          <div
                            key={bundle.id}
                            className={`sales-bundle-item ${isSelected ? "selected" : ""}`}
                            onClick={() => selectBundle(isSelected ? null : bundle)}
                          >
                            <div className="sales-bundle-radio">
                              <div className="sales-bundle-radio-inner" />
                            </div>
                            <div className="sales-bundle-info">
                              <div className="sales-bundle-name">{bundle.name_en}</div>
                              <div className="sales-bundle-books">
                                {bundle.books.length} books included
                              </div>
                            </div>
                            <div className="sales-bundle-pricing">
                              <span className="sales-bundle-original">
                                Rs. {bundle.original_price.toLocaleString()}
                              </span>
                              <span className="sales-bundle-price">
                                Rs. {bundle.price_lkr.toLocaleString()}
                              </span>
                              {bundle.savings > 0 && (
                                <span className="sales-bundle-savings">
                                  Save Rs. {bundle.savings.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Items & Pricing Card */}
            {((productMode === "books" && selectedBooks.length > 0) ||
              (productMode === "bundles" && selectedBundle)) && (
              <div className="sales-card sales-card-highlight">
                <div className="sales-card-header">
                  <span className="sales-card-number">3</span>
                  <h2 className="sales-card-title">
                    Order Summary
                  </h2>
                </div>
                <div className="sales-card-body">
                  {productMode === "books" ? (
                    <div className="sales-selected-list">
                      {selectedBooks.map((book) => (
                        <div key={book.id} className="sales-selected-item">
                          <div className="sales-selected-info">
                            <div className="sales-selected-title">{book.title_en}</div>
                          </div>
                          <div className="sales-selected-price">
                            <input
                              type="number"
                              value={book.customPrice}
                              onChange={(e) =>
                                updatePrice(book.id, parseFloat(e.target.value) || 0)
                              }
                              className="sales-price-input"
                              min="0"
                              step="50"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeBook(book.id)}
                            className="sales-remove-btn"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : selectedBundle && (
                    <div className="sales-bundle-summary">
                      <div className="sales-bundle-summary-name">{selectedBundle.name_en}</div>
                      <div className="sales-bundle-summary-books">
                        {selectedBundle.books.map((book) => (
                          <div key={book.id} className="sales-bundle-summary-book">
                            {book.title_en}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="sales-total">
                    <span className="sales-total-label">Total Amount</span>
                    <span className="sales-total-value">
                      Rs. {total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="sales-actions">
              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="sales-btn sales-btn-primary sales-btn-submit"
              >
                {isSubmitting ? (
                  <>
                    <span className="sales-btn-spinner" />
                    Processing...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Complete Sale
                  </>
                )}
              </button>
              <p className="sales-actions-hint">
                A notification will be sent to the customer
              </p>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

// Purchase History Component
function PurchaseHistory({
  purchases,
  loading,
  onRefresh
}: {
  purchases: Purchase[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Get date boundaries
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(now);
  const daysSinceMonday = (now.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  startOfWeek.setDate(now.getDate() - daysSinceMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  // Filter approved purchases
  const approvedPurchases = purchases.filter((p) => p.status === "approved");

  // Calculate income totals
  const todayIncome = approvedPurchases
    .filter((p) => new Date(p.created_at) >= startOfToday)
    .reduce((sum, p) => sum + p.amount_lkr, 0);

  const thisWeekIncome = approvedPurchases
    .filter((p) => new Date(p.created_at) >= startOfWeek)
    .reduce((sum, p) => sum + p.amount_lkr, 0);

  const approvedCount = approvedPurchases.length;

  // Handle approve/reject
  const handleAction = async (action: "approve" | "reject") => {
    if (!selectedPurchase) return;

    setActionLoading(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/admin/purchases/${selectedPurchase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update purchase");
      }

      // Close modal and refresh list
      setSelectedPurchase(null);
      onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  // Check if payment proof is a PDF
  const isPDF = (url: string | null | undefined) => {
    if (!url) return false;
    return url.toLowerCase().endsWith(".pdf");
  };

  return (
    <div className="sales-history">
      <div className="sales-history-header">
        <div>
          <h1 className="sales-title">Purchase History</h1>
          <p className="sales-subtitle">
            {approvedCount} completed sales
          </p>
        </div>
        <button onClick={onRefresh} className="sales-refresh-btn" disabled={loading}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? "spinning" : ""}>
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </button>
      </div>

      {/* Income Summary - Using admin-stats pattern */}
      <div className="admin-stats" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-stat">
          <div className="admin-stat-value">Rs. {todayIncome.toLocaleString()}</div>
          <div className="admin-stat-label">Today</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-value">Rs. {thisWeekIncome.toLocaleString()}</div>
          <div className="admin-stat-label">This Week</div>
        </div>
      </div>

      {/* Purchase List */}
      {loading ? (
        <div className="sales-loading">
          <div className="sales-loading-spinner" />
          <p>Loading purchases...</p>
        </div>
      ) : purchases.length === 0 ? (
        <div className="sales-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h3>No purchases yet</h3>
          <p>Sales will appear here once recorded</p>
        </div>
      ) : (
        <div className="sales-purchase-list">
          {purchases.map((purchase) => (
            <div
              key={purchase.id}
              className={`sales-purchase-item ${purchase.status === "pending" ? "sales-purchase-item--clickable" : ""}`}
              onClick={() => purchase.status === "pending" && setSelectedPurchase(purchase)}
            >
              <div className="sales-purchase-main">
                <div className="sales-purchase-product">
                  {purchase.bundle?.name_en || purchase.book?.title_en || "Unknown"}
                </div>
                <div className="sales-purchase-customer">
                  {purchase.user?.display_name || (purchase.user?.phone ? `+${purchase.user.phone}` : purchase.user?.email) || "Unknown"}
                </div>
              </div>
              <div className="sales-purchase-meta">
                <span className={`sales-purchase-status sales-purchase-status--${purchase.status}`}>
                  {purchase.status}
                </span>
                <span className="sales-purchase-amount">
                  Rs. {purchase.amount_lkr.toLocaleString()}
                </span>
                <span className="sales-purchase-date">
                  {new Date(purchase.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Purchase Detail Modal */}
      {selectedPurchase && (
        <div className="sales-modal-overlay" onClick={() => !actionLoading && setSelectedPurchase(null)}>
          <div className="sales-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sales-modal-header">
              <h2 className="sales-modal-title">Review Purchase</h2>
              <button
                className="sales-modal-close"
                onClick={() => !actionLoading && setSelectedPurchase(null)}
                disabled={actionLoading}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="sales-modal-body">
              {/* Purchase Info */}
              <div className="sales-modal-info">
                <div className="sales-modal-info-row">
                  <span className="sales-modal-info-label">Product</span>
                  <span className="sales-modal-info-value">
                    {selectedPurchase.bundle?.name_en || selectedPurchase.book?.title_en || "Unknown"}
                  </span>
                </div>
                <div className="sales-modal-info-row">
                  <span className="sales-modal-info-label">Customer</span>
                  <span className="sales-modal-info-value">
                    {selectedPurchase.user?.display_name || "No name"}
                    <span className="sales-modal-info-phone">
                      {selectedPurchase.user?.phone ? `+${selectedPurchase.user.phone}` : selectedPurchase.user?.email}
                    </span>
                  </span>
                </div>
                <div className="sales-modal-info-row">
                  <span className="sales-modal-info-label">Amount</span>
                  <span className="sales-modal-info-value sales-modal-info-amount">
                    Rs. {selectedPurchase.amount_lkr.toLocaleString()}
                  </span>
                </div>
                <div className="sales-modal-info-row">
                  <span className="sales-modal-info-label">Date</span>
                  <span className="sales-modal-info-value">
                    {new Date(selectedPurchase.created_at).toLocaleString()}
                  </span>
                </div>
                {selectedPurchase.payment_reference && (
                  <div className="sales-modal-info-row">
                    <span className="sales-modal-info-label">Reference</span>
                    <span className="sales-modal-info-value">{selectedPurchase.payment_reference}</span>
                  </div>
                )}
              </div>

              {/* Payment Proof */}
              <div className="sales-modal-proof">
                <h3 className="sales-modal-proof-title">Payment Proof</h3>
                {selectedPurchase.payment_proof_url ? (
                  isPDF(selectedPurchase.payment_proof_url) ? (
                    <div className="sales-modal-proof-pdf">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14,2 14,8 20,8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <line x1="10" y1="9" x2="8" y2="9" />
                      </svg>
                      <span>PDF Document</span>
                      <a
                        href={selectedPurchase.payment_proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sales-modal-proof-link"
                      >
                        Open PDF
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                          <polyline points="15,3 21,3 21,9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    </div>
                  ) : (
                    <div className="sales-modal-proof-image">
                      <img
                        src={selectedPurchase.payment_proof_url}
                        alt="Payment proof"
                        onClick={() => window.open(selectedPurchase.payment_proof_url!, "_blank")}
                      />
                      <p className="sales-modal-proof-hint">Click to view full size</p>
                    </div>
                  )
                ) : (
                  <div className="sales-modal-proof-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21,15 16,10 5,21" />
                    </svg>
                    <span>No payment proof uploaded</span>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {actionError && (
                <div className="sales-modal-error">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  <span>{actionError}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="sales-modal-actions">
              <button
                className="sales-modal-btn sales-modal-btn-reject"
                onClick={() => handleAction("reject")}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <span className="sales-btn-spinner" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                )}
                Reject
              </button>
              <button
                className="sales-modal-btn sales-modal-btn-approve"
                onClick={() => handleAction("approve")}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <span className="sales-btn-spinner" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
