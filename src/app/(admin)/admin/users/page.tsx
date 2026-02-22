"use client";

import { useState, useEffect, useMemo } from "react";
import UserReport from "@/components/admin/UserReport";
import { getAvatarUrl } from "@/lib/avatar";

type ViewMode = "users" | "reports";

interface UserWithBooks {
  id: string;
  phone: string | null;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_active_at: string | null;
  purchases: Array<{
    book: {
      id: string;
      title_en: string;
    };
    amount_lkr: number;
    purchase_group_id: string | null;
    bundle_id: string | null;
  }>;
}

type DateFilter = "all" | "today" | "yesterday" | "7d" | "30d";

function calcTotalSpent(purchases: UserWithBooks["purchases"]): number {
  if (!purchases?.length) return 0;
  const seen = new Set<string>();
  let total = 0;
  for (const p of purchases) {
    const groupKey = p.purchase_group_id || p.bundle_id;
    if (groupKey) {
      if (seen.has(groupKey)) continue;
      seen.add(groupKey);
    }
    total += p.amount_lkr || 0;
  }
  return total;
}

function matchesDateFilter(createdAt: string, filter: DateFilter): boolean {
  if (filter === "all") return true;
  const date = new Date(createdAt);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filter) {
    case "today":
      return date >= startOfToday;
    case "yesterday": {
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      return date >= startOfYesterday && date < startOfToday;
    }
    case "7d": {
      const weekAgo = new Date(startOfToday);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    }
    case "30d": {
      const monthAgo = new Date(startOfToday);
      monthAgo.setDate(monthAgo.getDate() - 30);
      return date >= monthAgo;
    }
    default:
      return true;
  }
}

export default function AdminUsersPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("users");
  const [users, setUsers] = useState<UserWithBooks[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [editingUser, setEditingUser] = useState<UserWithBooks | null>(null);
  const [editForm, setEditForm] = useState({ display_name: "", phone: "", email: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search filter
      if (search) {
        const q = search.toLowerCase();
        const matchesName = user.display_name?.toLowerCase().includes(q);
        const matchesPhone = user.phone?.includes(q);
        const matchesEmail = user.email?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesEmail) return false;
      }
      // Date filter
      return matchesDateFilter(user.created_at, dateFilter);
    });
  }, [users, search, dateFilter]);

  const openEdit = (user: UserWithBooks) => {
    setEditingUser(user);
    setEditForm({
      display_name: user.display_name || "",
      phone: user.phone?.startsWith("94") ? user.phone.slice(2) : user.phone || "",
      email: user.email || "",
    });
    setEditError("");
  };

  const handleEdit = async () => {
    if (!editingUser) return;
    setEditLoading(true);
    setEditError("");
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: editForm.display_name,
          phone: editForm.phone || null,
          email: editForm.email || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || "Failed to update user");
        return;
      }
      setEditingUser(null);
      await fetchUsers();
    } catch {
      setEditError("Failed to update user");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
        return;
      }
      setDeletingId(null);
      await fetchUsers();
    } catch {
      alert("Failed to delete user");
    } finally {
      setDeleteLoading(false);
    }
  };

  const dateFilterOptions: { value: DateFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
  ];

  if (loading) {
    return (
      <div className="admin-animate-in">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Users</h1>
          <p className="admin-page-subtitle">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-animate-in">
      {/* View Toggle */}
      <div className="sales-view-toggle">
        <button
          className={`sales-view-btn ${viewMode === "users" ? "active" : ""}`}
          onClick={() => setViewMode("users")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Users
        </button>
        <button
          className={`sales-view-btn ${viewMode === "reports" ? "active" : ""}`}
          onClick={() => setViewMode("reports")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
          Reports
        </button>
      </div>

      {viewMode === "reports" ? (
        <UserReport />
      ) : (
      <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Users</h1>
        <p className="admin-page-subtitle">
          {filteredUsers.length} of {users.length} registered{" "}
          {users.length === 1 ? "reader" : "readers"}
        </p>
      </div>

      {/* Search Bar */}
      <div className="admin-user-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, or email..."
          className="admin-user-search-input"
        />
      </div>

      {/* Date Filter Chips */}
      <div className="admin-user-filters">
        {dateFilterOptions.map((opt) => (
          <button
            key={opt.value}
            className={`admin-user-filter-chip${dateFilter === opt.value ? " active" : ""}`}
            onClick={() => setDateFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filteredUsers.length > 0 ? (
        <>
          {/* Mobile Card View */}
          <div className="admin-user-list admin-stagger">
            {filteredUsers.map((user) => {
              const totalSpent = calcTotalSpent(user.purchases);
              const bookCount = user.purchases?.length || 0;

              return (
                <div key={user.id} className="admin-user-card">
                  <div className="admin-user-avatar">
                    <img src={getAvatarUrl(user.avatar_url, user.id)} alt="" />
                  </div>
                  <div className="admin-user-info">
                    <div className="admin-user-name">
                      {user.display_name || "No name"}
                    </div>
                    <div className="admin-user-phone">
                      {user.phone ? `+${user.phone}` : user.email}
                    </div>
                    <div className="admin-user-meta">
                      {bookCount > 0 ? (
                        <span className="admin-badge admin-badge-success">
                          {bookCount} {bookCount === 1 ? "book" : "books"}
                        </span>
                      ) : (
                        <span className="admin-badge admin-badge-warning">
                          No books
                        </span>
                      )}
                      {totalSpent > 0 && (
                        <span className="admin-text-gold" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                          Rs. {totalSpent.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="admin-user-card-actions">
                    <button
                      className="admin-user-action-btn"
                      onClick={() => openEdit(user)}
                      title="Edit user"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    {deletingId === user.id ? (
                      <div className="admin-user-delete-confirm">
                        <button
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => handleDelete(user.id)}
                          disabled={deleteLoading}
                        >
                          {deleteLoading ? "..." : "Yes"}
                        </button>
                        <button
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          onClick={() => setDeletingId(null)}
                          disabled={deleteLoading}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        className="admin-user-action-btn delete"
                        onClick={() => setDeletingId(user.id)}
                        title="Delete user"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="admin-card admin-hidden-mobile">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Books</th>
                    <th>Total Spent</th>
                    <th>Registered</th>
                    <th>Last Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const totalSpent = calcTotalSpent(user.purchases);
                    const bookCount = user.purchases?.length || 0;

                    return (
                      <tr key={user.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <img
                              src={getAvatarUrl(user.avatar_url, user.id)}
                              alt=""
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                objectFit: "cover",
                                flexShrink: 0,
                              }}
                            />
                            <div>
                              <div style={{ fontWeight: 500 }}>
                                {user.display_name || "No name"}
                              </div>
                              <div className="admin-text-muted" style={{ fontSize: "0.8125rem" }}>
                                {user.phone ? `+${user.phone}` : user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {bookCount > 0 ? (
                            <div>
                              <span className="admin-badge admin-badge-success">
                                {bookCount} {bookCount === 1 ? "book" : "books"}
                              </span>
                              <div
                                className="admin-text-muted"
                                style={{
                                  fontSize: "0.75rem",
                                  marginTop: "0.25rem",
                                  maxWidth: "200px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {user.purchases
                                  ?.map((p) => p.book?.title_en)
                                  .filter(Boolean)
                                  .join(", ")}
                              </div>
                            </div>
                          ) : (
                            <span className="admin-badge admin-badge-warning">
                              No books
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            style={{
                              fontWeight: 600,
                              color: "var(--admin-gold)",
                            }}
                          >
                            Rs. {totalSpent.toLocaleString()}
                          </span>
                        </td>
                        <td>
                          {new Date(user.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td>
                          {user.last_active_at ? (
                            new Date(user.last_active_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              }
                            )
                          ) : (
                            <span className="admin-text-muted">
                              Never
                            </span>
                          )}
                        </td>
                        <td>
                          {deletingId === user.id ? (
                            <div className="admin-user-delete-confirm">
                              <span>Delete?</span>
                              <button
                                className="admin-btn admin-btn-danger admin-btn-sm"
                                onClick={() => handleDelete(user.id)}
                                disabled={deleteLoading}
                              >
                                {deleteLoading ? "..." : "Yes"}
                              </button>
                              <button
                                className="admin-btn admin-btn-secondary admin-btn-sm"
                                onClick={() => setDeletingId(null)}
                                disabled={deleteLoading}
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="admin-user-table-actions">
                              <button
                                className="admin-user-action-btn"
                                onClick={() => openEdit(user)}
                                title="Edit user"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button
                                className="admin-user-action-btn delete"
                                onClick={() => setDeletingId(user.id)}
                                title="Delete user"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="admin-card">
          <div className="admin-card-empty">
            <div className="admin-card-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="admin-card-empty-title">
              {search || dateFilter !== "all" ? "No users match your filters" : "No users registered"}
            </h3>
            <p className="admin-card-empty-text">
              {search || dateFilter !== "all"
                ? "Try adjusting your search or date filter"
                : "Users will appear here after their first purchase"}
            </p>
          </div>
        </div>
      )}

      </>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="sales-modal-overlay" onClick={() => !editLoading && setEditingUser(null)}>
          <div className="sales-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sales-modal-header">
              <h2 className="sales-modal-title">Edit User</h2>
              <button
                className="sales-modal-close"
                onClick={() => setEditingUser(null)}
                disabled={editLoading}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="sales-modal-body">
              <div className="admin-user-edit-field">
                <label className="admin-user-edit-label">Display Name</label>
                <input
                  type="text"
                  value={editForm.display_name}
                  onChange={(e) => setEditForm((f) => ({ ...f, display_name: e.target.value }))}
                  placeholder="Enter name"
                  className="admin-user-edit-input"
                />
              </div>
              <div className="admin-user-edit-field">
                <label className="admin-user-edit-label">Phone</label>
                <div className="sales-phone-input">
                  <span className="sales-phone-prefix">+94</span>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "") }))}
                    placeholder="77 123 4567"
                    className="sales-input"
                  />
                </div>
              </div>
              <div className="admin-user-edit-field">
                <label className="admin-user-edit-label">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="e.g. user@example.com"
                  className="admin-user-edit-input"
                />
              </div>
              {editError && (
                <div className="sales-modal-error" style={{ marginTop: "0.75rem" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  <span>{editError}</span>
                </div>
              )}
            </div>
            <div className="sales-modal-actions">
              <button
                className="sales-modal-btn sales-modal-btn-reject"
                onClick={() => setEditingUser(null)}
                disabled={editLoading}
              >
                Cancel
              </button>
              <button
                className="sales-modal-btn sales-modal-btn-approve"
                onClick={handleEdit}
                disabled={editLoading}
              >
                {editLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
