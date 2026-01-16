import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

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

      {/* Actions Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <Link href="/admin/register" className="admin-btn admin-btn-primary">
          ➕ Register New User
        </Link>
      </div>

      {/* Users List */}
      <div className="admin-card">
        {users.length > 0 ? (
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
                              background: "var(--auth-burgundy)",
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
                            <div
                              style={{
                                fontSize: "0.8125rem",
                                color: "var(--muted-foreground)",
                              }}
                            >
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
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--muted-foreground)",
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
                            color: "var(--auth-burgundy)",
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
                          <span style={{ color: "var(--muted-foreground)" }}>
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
        ) : (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">👥</div>
            <div className="admin-empty-title">No users registered</div>
            <div className="admin-empty-text">
              Register your first user to get started
            </div>
            <Link
              href="/admin/register"
              className="admin-btn admin-btn-primary"
              style={{ marginTop: "1.5rem" }}
            >
              Register User
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
