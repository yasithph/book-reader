import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getStats() {
  const supabase = await createClient();

  const [usersRes, booksRes, purchasesRes, recentUsersRes] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("books").select("id", { count: "exact", head: true }),
    supabase
      .from("purchases")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
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
