import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface UserWithBooks {
  id: string;
  phone: string;
  display_name: string | null;
  created_at: string;
  last_active_at: string | null;
  purchases: Array<{
    book: {
      id: string;
      title_en: string;
    };
    amount_lkr: number;
  }>;
}

async function getUsers(): Promise<UserWithBooks[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("users")
    .select(
      `
      id,
      phone,
      display_name,
      created_at,
      last_active_at,
      purchases:purchases!purchases_user_id_fkey (
        amount_lkr,
        book:books (
          id,
          title_en
        )
      )
    `
    )
    .eq("role", "user")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }

  return (data as unknown as UserWithBooks[]) || [];
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div className="admin-animate-in">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Users</h1>
        <p className="admin-page-subtitle">
          {users.length} registered {users.length === 1 ? "reader" : "readers"}
        </p>
      </div>

      {users.length > 0 ? (
        <>
          {/* Mobile Card View */}
          <div className="admin-user-list admin-stagger">
            {users.map((user) => {
              const totalSpent = user.purchases?.reduce(
                (sum, p) => sum + (p.amount_lkr || 0),
                0
              ) || 0;
              const bookCount = user.purchases?.length || 0;

              return (
                <div key={user.id} className="admin-user-card">
                  <div className="admin-user-avatar">
                    {user.display_name?.[0]?.toUpperCase() ||
                      user.phone.slice(-2)}
                  </div>
                  <div className="admin-user-info">
                    <div className="admin-user-name">
                      {user.display_name || "No name"}
                    </div>
                    <div className="admin-user-phone">+{user.phone}</div>
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
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const totalSpent = user.purchases?.reduce(
                      (sum, p) => sum + (p.amount_lkr || 0),
                      0
                    ) || 0;
                    const bookCount = user.purchases?.length || 0;

                    return (
                      <tr key={user.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                background: "var(--admin-gold)",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontWeight: 600,
                                fontSize: "0.875rem",
                                flexShrink: 0,
                              }}
                            >
                              {user.display_name?.[0]?.toUpperCase() ||
                                user.phone.slice(-2)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 500 }}>
                                {user.display_name || "No name"}
                              </div>
                              <div className="admin-text-muted" style={{ fontSize: "0.8125rem" }}>
                                +{user.phone}
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
            <h3 className="admin-card-empty-title">No users registered</h3>
            <p className="admin-card-empty-text">
              Users will appear here after their first purchase
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
