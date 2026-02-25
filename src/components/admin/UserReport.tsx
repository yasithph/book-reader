"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getAvatarUrl } from "@/lib/avatar";

interface AdminTopReader {
  user_id: string;
  engagement_score: number;
  rank: number;
  chapters_completed: number;
  comments_count: number;
  chapter_likes_count: number;
  comment_likes_count: number;
  comment_likes_received_count: number;
  refreshed_at: string;
  display_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface UserRecord {
  id: string;
  created_at: string;
}

interface PurchaseRecord {
  user_id: string;
  book_id: string | null;
  amount_lkr: number;
  purchase_group_id: string | null;
  bundle_id: string | null;
}

interface ReadingProgressRecord {
  user_id: string;
  book_id: string;
  completed_chapters: number[];
  last_read_at: string | null;
  display_name: string | null;
  phone: string | null;
  email: string | null;
}

interface BookRecord {
  id: string;
  title_en: string;
}

type Period =
  | "all-time"
  | "today"
  | "this-week"
  | "last-week"
  | "this-month"
  | "last-month"
  | "this-year"
  | "last-year";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "all-time", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "this-week", label: "This Week" },
  { value: "last-week", label: "Last Week" },
  { value: "this-month", label: "This Month" },
  { value: "last-month", label: "Last Month" },
  { value: "this-year", label: "This Year" },
  { value: "last-year", label: "Last Year" },
];

const COLORS = [
  "#FF9900",
  "#067D62",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#6366F1",
  "#EF4444",
  "#14B8A6",
];

function getDateRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  switch (period) {
    case "all-time": {
      const start = new Date(2000, 0, 1);
      const end = new Date(now.getFullYear() + 1, 0, 1);
      return { start, end };
    }
    case "today": {
      const end = new Date(today);
      end.setDate(today.getDate() + 1);
      return { start: today, end };
    }
    case "this-week": {
      const start = new Date(today);
      start.setDate(today.getDate() - mondayOffset);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      return { start, end };
    }
    case "last-week": {
      const start = new Date(today);
      start.setDate(today.getDate() - mondayOffset - 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      return { start, end };
    }
    case "this-month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { start, end };
    }
    case "last-month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end };
    }
    case "this-year": {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear() + 1, 0, 1);
      return { start, end };
    }
    case "last-year": {
      const start = new Date(now.getFullYear() - 1, 0, 1);
      const end = new Date(now.getFullYear(), 0, 1);
      return { start, end };
    }
  }
}

function getBucketKey(date: Date, period: Period): string {
  if (period === "all-time") return String(date.getFullYear());
  if (period === "today") return "Today";
  if (period === "this-week" || period === "last-week") {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dayOfWeek = date.getDay();
    const idx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    return days[idx];
  }
  if (period === "this-month" || period === "last-month") {
    const dayOfMonth = date.getDate();
    const weekNum = Math.ceil(dayOfMonth / 7);
    return `Week ${weekNum}`;
  }
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return months[date.getMonth()];
}

function getAllBuckets(period: Period, dates?: Date[]): string[] {
  if (period === "all-time") {
    if (!dates?.length) return [String(new Date().getFullYear())];
    const years = dates.map((d) => d.getFullYear());
    const min = Math.min(...years);
    const max = Math.max(...years);
    const buckets: string[] = [];
    for (let y = min; y <= max; y++) buckets.push(String(y));
    return buckets;
  }
  if (period === "today") return ["Today"];
  if (period === "this-week" || period === "last-week") {
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  }
  if (period === "this-month" || period === "last-month") {
    return ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];
  }
  return [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
}

export default function UserReport() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [readingProgress, setReadingProgress] = useState<ReadingProgressRecord[]>([]);
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("this-month");
  const [adminTopReaders, setAdminTopReaders] = useState<AdminTopReader[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [res, topReadersRes] = await Promise.all([
          fetch("/api/admin/reports/users"),
          fetch("/api/admin/top-readers"),
        ]);
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
          setPurchases(data.purchases || []);
          setReadingProgress(data.readingProgress || []);
          setBooks(data.books || []);
        }
        if (topReadersRes.ok) {
          const data = await topReadersRes.json();
          setAdminTopReaders(data.topReaders || []);
        }
      } catch (err) {
        console.error("Error fetching user report data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRefreshLeaderboard = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/top-readers", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setAdminTopReaders(data.topReaders || []);
      }
    } catch (err) {
      console.error("Error refreshing leaderboard:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const bookTitleMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const b of books) map[b.id] = b.title_en;
    return map;
  }, [books]);

  const { start, end } = useMemo(() => getDateRange(period), [period]);

  // Summary stats — all computed from all-time data for consistency
  const { totalUsers, avgBooks, avgSpend } = useMemo(() => {
    // Avg books per user
    const userBookCounts: Record<string, Set<string>> = {};
    for (const p of purchases) {
      if (!userBookCounts[p.user_id]) userBookCounts[p.user_id] = new Set();
      if (p.book_id) userBookCounts[p.user_id].add(p.book_id);
    }
    const totalBooksOwned = Object.values(userBookCounts).reduce(
      (sum, s) => sum + s.size,
      0
    );
    const avgBooksPerUser = users.length > 0 ? totalBooksOwned / users.length : 0;

    // Avg spend per user (deduplicate by purchase_group_id)
    const userSpend: Record<string, number> = {};
    const seenGroups = new Set<string>();
    for (const p of purchases) {
      if (p.purchase_group_id) {
        if (seenGroups.has(p.purchase_group_id)) continue;
        seenGroups.add(p.purchase_group_id);
      }
      userSpend[p.user_id] = (userSpend[p.user_id] || 0) + (p.amount_lkr || 0);
    }
    const totalSpend = Object.values(userSpend).reduce((s, v) => s + v, 0);
    const avgSpendPerUser = users.length > 0 ? totalSpend / users.length : 0;

    return {
      totalUsers: users.length,
      avgBooks: avgBooksPerUser,
      avgSpend: avgSpendPerUser,
    };
  }, [users, purchases]);

  // Chart 1: User Registrations
  const registrationChartData = useMemo(() => {
    const filtered = users.filter((u) => {
      const d = new Date(u.created_at);
      return d >= start && d < end;
    });
    const dates = filtered.map((u) => new Date(u.created_at));
    const buckets = getAllBuckets(period, dates);
    const bucketMap: Record<string, number> = {};
    for (const b of buckets) bucketMap[b] = 0;

    for (const u of filtered) {
      const d = new Date(u.created_at);
      const key = getBucketKey(d, period);
      if (key in bucketMap) bucketMap[key]++;
    }

    return buckets.map((b) => ({ name: b, registrations: bucketMap[b] }));
  }, [users, period, start, end]);

  // Today's Most Read Books
  const todaysMostRead = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const todayReads = readingProgress.filter((rp) => {
      if (!rp.last_read_at) return false;
      const d = new Date(rp.last_read_at);
      return d >= startOfToday && d < endOfToday;
    });

    // Group by book, count unique users
    const bookReaders: Record<string, Set<string>> = {};
    for (const rp of todayReads) {
      if (!bookReaders[rp.book_id]) bookReaders[rp.book_id] = new Set();
      bookReaders[rp.book_id].add(rp.user_id);
    }

    return Object.entries(bookReaders)
      .map(([bookId, userSet]) => ({
        bookId,
        title: bookTitleMap[bookId] || "Unknown",
        readers: userSet.size,
      }))
      .sort((a, b) => b.readers - a.readers);
  }, [readingProgress, bookTitleMap]);

  const tooltipStyle = {
    background: "var(--admin-elevated)",
    border: "1px solid var(--admin-border)",
    borderRadius: "8px",
    boxShadow: "var(--admin-shadow-lg)",
    fontSize: "0.8125rem",
    color: "var(--admin-text)",
  };

  const hasRegistrations = registrationChartData.some((d) => d.registrations > 0);

  if (loading) {
    return (
      <div className="admin-animate-in">
        <div className="admin-page-header">
          <h1 className="admin-page-title">User Reports</h1>
          <p className="admin-page-subtitle">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-animate-in">
      {/* Period Filter Chips */}
      <div className="report-period-filters">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`admin-user-filter-chip${period === opt.value ? " active" : ""}`}
            onClick={() => setPeriod(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="report-summary-row">
        <div className="report-summary-card">
          <div className="report-summary-label">Total Users</div>
          <div className="report-summary-value">{totalUsers}</div>
        </div>
        <div className="report-summary-card">
          <div className="report-summary-label">Avg Books/User</div>
          <div className="report-summary-value">{avgBooks.toFixed(1)}</div>
        </div>
        <div className="report-summary-card">
          <div className="report-summary-label">Avg Spend/User</div>
          <div className="report-summary-value">
            Rs. {Math.round(avgSpend).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Chart 1: User Registrations */}
      <h3 className="report-section-title">User Registrations</h3>
      {hasRegistrations ? (
        <div className="report-chart-container">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={registrationChartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" />
              <XAxis
                dataKey="name"
                tick={{ fill: "var(--admin-text-muted)", fontSize: 12 }}
                axisLine={{ stroke: "var(--admin-border)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--admin-text-muted)", fontSize: 12 }}
                axisLine={{ stroke: "var(--admin-border)" }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ fontWeight: 600, marginBottom: 4 }}
              />
              <Bar
                dataKey="registrations"
                name="New Users"
                fill={COLORS[0]}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="admin-card">
          <div className="admin-card-empty">
            <h3 className="admin-card-empty-title">No registrations in this period</h3>
            <p className="admin-card-empty-text">Try selecting a different time period</p>
          </div>
        </div>
      )}

      {/* Today's Most Read Books */}
      <h3 className="report-section-title">{"Today\u2019s Most Read"}</h3>
      {todaysMostRead.length > 0 ? (
        <div className="admin-card">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th style={{ textAlign: "right" }}>Readers</th>
                </tr>
              </thead>
              <tbody>
                {todaysMostRead.map((row, i) => (
                  <tr key={row.bookId}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: COLORS[i % COLORS.length],
                            flexShrink: 0,
                          }}
                        />
                        {row.title}
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {row.readers}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="admin-card">
          <div className="admin-card-empty">
            <h3 className="admin-card-empty-title">No reading activity today</h3>
            <p className="admin-card-empty-text">Books being read today will appear here</p>
          </div>
        </div>
      )}

      {/* Top Readers Table */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginTop: "1.5rem", marginBottom: "0.75rem" }}>
        <h3 className="report-section-title" style={{ margin: 0 }}>Top Readers</h3>
        <button
          className="admin-refresh-btn"
          onClick={handleRefreshLeaderboard}
          disabled={isRefreshing}
        >
          {isRefreshing ? "Refreshing..." : "Refresh Leaderboard"}
        </button>
      </div>
      {adminTopReaders.length > 0 ? (
        <div className="admin-card">
          {adminTopReaders[0]?.refreshed_at && (
            <div style={{ padding: "0.5rem 1rem", fontSize: "0.75rem", color: "var(--admin-text-muted)", borderBottom: "1px solid var(--admin-border)" }}>
              Last refreshed: {new Date(adminTopReaders[0].refreshed_at).toLocaleString()}
            </div>
          )}
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Reader</th>
                  <th style={{ textAlign: "right" }}>Points</th>
                  <th style={{ textAlign: "right" }}>Chapters</th>
                  <th style={{ textAlign: "right" }}>Comments</th>
                </tr>
              </thead>
              <tbody>
                {adminTopReaders.map((reader, i) => (
                  <tr key={reader.user_id}>
                    <td style={{ fontWeight: 600, width: "2rem" }}>{reader.rank}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <img
                          src={getAvatarUrl(reader.avatar_url, reader.user_id)}
                          alt=""
                          style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                        />
                        <div>
                          <div style={{ fontWeight: 500 }}>{reader.display_name || reader.phone || "Unknown"}</div>
                          {reader.display_name && reader.phone && (
                            <div className="admin-text-muted" style={{ fontSize: "0.75rem" }}>{reader.phone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      <span style={{ color: COLORS[i % COLORS.length] }}>{reader.engagement_score}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>{reader.chapters_completed}</td>
                    <td style={{ textAlign: "right" }}>{reader.comments_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="admin-card">
          <div className="admin-card-empty">
            <h3 className="admin-card-empty-title">No top readers yet</h3>
            <p className="admin-card-empty-text">Click &quot;Refresh Leaderboard&quot; to calculate scores</p>
          </div>
        </div>
      )}
    </div>
  );
}
