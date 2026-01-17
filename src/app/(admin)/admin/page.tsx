import { createAdminClient } from "@/lib/supabase/admin";
import { PurchaseActions } from "./purchase-actions";

export const dynamic = "force-dynamic";

async function getStats() {
  const supabase = createAdminClient();

  const [usersRes, booksRes, purchasesRes, pendingPurchasesRes, recentUsersRes] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("books").select("id", { count: "exact", head: true }),
    supabase
      .from("purchases")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("purchases")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("users")
      .select("id, phone, display_name, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return {
    totalUsers: usersRes.count || 0,
    totalBooks: booksRes.count || 0,
    totalPurchases: purchasesRes.count || 0,
    pendingPurchases: pendingPurchasesRes.data || [],
    recentUsers: recentUsersRes.data || [],
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="admin-animate-in">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-subtitle">
          Overview of your book reader platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon">👥</div>
          <div className="admin-stat-value">{stats.totalUsers}</div>
          <div className="admin-stat-label">Total Users</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">📚</div>
          <div className="admin-stat-value">{stats.totalBooks}</div>
          <div className="admin-stat-label">Books</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">✓</div>
          <div className="admin-stat-value">{stats.totalPurchases}</div>
          <div className="admin-stat-label">Active Purchases</div>
        </div>

        {stats.pendingPurchases.length > 0 && (
          <div className="admin-stat-card" style={{ borderColor: "#f59e0b", background: "rgba(245, 158, 11, 0.1)" }}>
            <div className="admin-stat-icon">⏳</div>
            <div className="admin-stat-value" style={{ color: "#f59e0b" }}>{stats.pendingPurchases.length}</div>
            <div className="admin-stat-label">Pending Approval</div>
          </div>
        )}
      </div>

      {/* Pending Purchases */}
      <div className="admin-card" style={{ marginBottom: "1.5rem", borderColor: stats.pendingPurchases.length > 0 ? "#f59e0b" : undefined }}>
        <div className="admin-card-header">
          <h2 className="admin-card-title">
            ⏳ Pending Purchase Approvals
            {stats.pendingPurchases.length > 0 && (
              <span style={{
                marginLeft: "8px",
                background: "#f59e0b",
                color: "white",
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "0.75rem"
              }}>
                {stats.pendingPurchases.length}
              </span>
            )}
          </h2>
        </div>
        {stats.pendingPurchases.length > 0 ? (
          <div className="admin-card-body">
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {stats.pendingPurchases.map((purchase: any) => (
                <div
                  key={purchase.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "1rem",
                    background: "rgba(0,0,0,0.02)",
                    borderRadius: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                      Purchase Request
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#666" }}>
                      LKR {purchase.amount_lkr} • {new Date(purchase.created_at).toLocaleDateString()}
                    </div>
                    {purchase.payment_reference && (
                      <div style={{ fontSize: "0.75rem", color: "#999" }}>
                        Ref: {purchase.payment_reference}
                      </div>
                    )}
                  </div>
                  <PurchaseActions
                    purchaseId={purchase.id}
                    paymentProofUrl={purchase.payment_proof_url}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="admin-card-body">
            <p style={{ color: "#666", textAlign: "center", padding: "1rem 0" }}>
              No pending approvals
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
        <div className="admin-card-header">
          <h2 className="admin-card-title">Quick Actions</h2>
        </div>
        <div className="admin-card-body">
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <a href="/admin/register" className="admin-btn admin-btn-primary">
              ➕ Register New User
            </a>
            <a href="/admin/users" className="admin-btn admin-btn-secondary">
              👥 View All Users
            </a>
            <a href="/admin/books" className="admin-btn admin-btn-secondary">
              📚 Manage Books
            </a>
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Recent Registrations</h2>
          <a
            href="/admin/users"
            className="admin-btn admin-btn-ghost admin-btn-sm"
          >
            View All →
          </a>
        </div>
        {stats.recentUsers.length > 0 ? (
          <div>
            {stats.recentUsers.map((user) => (
              <div key={user.id} className="admin-user-item">
                <div className="admin-user-avatar">
                  {user.display_name?.[0]?.toUpperCase() ||
                    user.phone.slice(-2)}
                </div>
                <div className="admin-user-info">
                  <div className="admin-user-name">
                    {user.display_name || "No name"}
                  </div>
                  <div className="admin-user-phone">{user.phone}</div>
                </div>
                <div className="admin-user-date">
                  {new Date(user.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">👥</div>
            <div className="admin-empty-title">No users yet</div>
            <div className="admin-empty-text">
              Register your first user to get started
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
