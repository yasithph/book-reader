"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface PurchaseRecord {
  id: string;
  book_id: string | null;
  bundle_id: string | null;
  amount_lkr: number;
  purchase_group_id: string | null;
  created_at: string;
  book_title: string | null;
  bundle_name: string | null;
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

// Color palette for stacked bars
const COLORS = [
  "#FF9900", // admin accent orange
  "#067D62", // admin success green
  "#3B82F6", // blue
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#F59E0B", // amber
  "#10B981", // emerald
  "#6366F1", // indigo
  "#EF4444", // red
  "#14B8A6", // teal
];

function getDateRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = today.getDay(); // 0=Sun
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

function getBucketKey(
  date: Date,
  period: Period,
  rangeStart: Date
): string {
  if (period === "all-time") {
    return String(date.getFullYear());
  }
  if (period === "today") {
    return "Today";
  }
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
  // Year periods: month names
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return months[date.getMonth()];
}

function getAllBuckets(period: Period, filtered?: PurchaseRecord[]): string[] {
  if (period === "all-time") {
    if (!filtered?.length) return [String(new Date().getFullYear())];
    const years = filtered.map((r) => new Date(r.created_at).getFullYear());
    const min = Math.min(...years);
    const max = Math.max(...years);
    const buckets: string[] = [];
    for (let y = min; y <= max; y++) buckets.push(String(y));
    return buckets;
  }
  if (period === "today") {
    return ["Today"];
  }
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

function getItemLabel(record: PurchaseRecord): string {
  if (record.bundle_id && record.bundle_name) {
    return `Bundle: ${record.bundle_name}`;
  }
  return record.book_title || "Unknown";
}

export default function IncomeReport() {
  const [records, setRecords] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("this-month");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/admin/reports/income");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setRecords(data.records || []);
      } catch (err) {
        console.error("Error fetching report data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  interface BookStat {
    label: string;
    sold: number;
    income: number;
    color: string;
  }

  const { chartData, bookKeys, totalIncome, totalBooksSold, bookStats, perBookSold } = useMemo(() => {
    const { start, end } = getDateRange(period);

    // Filter records to the selected period
    const filtered = records.filter((r) => {
      const d = new Date(r.created_at);
      return d >= start && d < end;
    });

    // For income: deduplicate by purchase_group_id
    const seenGroups = new Set<string>();
    let income = 0;
    for (const r of filtered) {
      if (r.purchase_group_id) {
        if (seenGroups.has(r.purchase_group_id)) continue;
        seenGroups.add(r.purchase_group_id);
      }
      income += r.amount_lkr || 0;
    }

    // For books sold: count every record (each book in a bundle = 1 book sold)
    const booksSold = filtered.length;

    // Collect all unique item labels
    const allLabels = new Set<string>();
    for (const r of filtered) {
      allLabels.add(getItemLabel(r));
    }
    const labels = Array.from(allLabels).sort();

    // Build chart data: group by time bucket
    const buckets = getAllBuckets(period, filtered);
    const bucketMap: Record<string, Record<string, number>> = {};
    for (const b of buckets) {
      bucketMap[b] = {};
      for (const l of labels) {
        bucketMap[b][l] = 0;
      }
    }

    // For chart income attribution: deduplicate bundles per bucket
    const seenGroupsPerBucket: Record<string, Set<string>> = {};
    for (const b of buckets) {
      seenGroupsPerBucket[b] = new Set();
    }

    for (const r of filtered) {
      const d = new Date(r.created_at);
      const bucket = getBucketKey(d, period, start);
      if (!bucketMap[bucket]) continue;

      const label = getItemLabel(r);

      // For income chart: deduplicate bundles within each bucket
      if (r.purchase_group_id) {
        if (seenGroupsPerBucket[bucket].has(r.purchase_group_id)) continue;
        seenGroupsPerBucket[bucket].add(r.purchase_group_id);
      }

      bucketMap[bucket][label] = (bucketMap[bucket][label] || 0) + (r.amount_lkr || 0);
    }

    const data = buckets.map((b) => ({
      name: b,
      ...bucketMap[b],
    }));

    // Per-book stats: sold count + income (deduplicated for bundles)
    const statsMap: Record<string, { sold: number; income: number }> = {};
    const seenGroupsForStats = new Set<string>();
    for (const r of filtered) {
      const label = getItemLabel(r);
      if (!statsMap[label]) statsMap[label] = { sold: 0, income: 0 };

      // Books sold: every record counts
      statsMap[label].sold += 1;

      // Income: deduplicate by purchase_group_id
      if (r.purchase_group_id) {
        if (seenGroupsForStats.has(r.purchase_group_id)) continue;
        seenGroupsForStats.add(r.purchase_group_id);
      }
      statsMap[label].income += r.amount_lkr || 0;
    }

    const stats: BookStat[] = labels.map((label, i) => ({
      label,
      sold: statsMap[label]?.sold || 0,
      income: statsMap[label]?.income || 0,
      color: COLORS[i % COLORS.length],
    }));

    // Sort by income descending
    stats.sort((a, b) => b.income - a.income);

    // Per-book sold stats: count by book_title regardless of bundle
    const perBookMap: Record<string, { sold: number; fromBundles: number }> = {};
    for (const r of filtered) {
      const title = r.book_title || "Unknown";
      if (!perBookMap[title]) perBookMap[title] = { sold: 0, fromBundles: 0 };
      perBookMap[title].sold += 1;
      if (r.bundle_id) perBookMap[title].fromBundles += 1;
    }
    const perBookSold = Object.entries(perBookMap)
      .map(([title, { sold, fromBundles }]) => ({ title, sold, fromBundles }))
      .sort((a, b) => b.sold - a.sold);

    return {
      chartData: data,
      bookKeys: labels,
      totalIncome: income,
      totalBooksSold: booksSold,
      bookStats: stats,
      perBookSold,
    };
  }, [records, period]);

  if (loading) {
    return (
      <div className="admin-animate-in">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Income Report</h1>
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
          <div className="report-summary-label">Total Income</div>
          <div className="report-summary-value">
            Rs. {totalIncome.toLocaleString()}
          </div>
        </div>
        <div className="report-summary-card">
          <div className="report-summary-label">Books Sold</div>
          <div className="report-summary-value">{totalBooksSold}</div>
        </div>
      </div>

      {/* Chart */}
      {totalIncome > 0 ? (
        <>
        <div className="report-chart-container">
          <ResponsiveContainer width="100%" height={360}>
            <BarChart
              data={chartData}
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
                tickFormatter={(v) => `Rs.${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--admin-elevated)",
                  border: "1px solid var(--admin-border)",
                  borderRadius: "8px",
                  boxShadow: "var(--admin-shadow-lg)",
                  fontSize: "0.8125rem",
                  color: "var(--admin-text)",
                }}
                labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={((value: any, name: any) => [
                  `Rs. ${(value ?? 0).toLocaleString()}`,
                  name,
                ]) as any}
              />
              <Legend
                wrapperStyle={{ fontSize: "0.8125rem", paddingTop: "12px" }}
              />
              {bookKeys.map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="income"
                  fill={COLORS[i % COLORS.length]}
                  radius={
                    i === bookKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]
                  }
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Per-Book Stats Table */}
        <div className="admin-card" style={{ marginTop: "1.25rem" }}>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th style={{ textAlign: "right" }}>Sold</th>
                  <th style={{ textAlign: "right" }}>Income</th>
                </tr>
              </thead>
              <tbody>
                {bookStats.map((stat) => (
                  <tr key={stat.label}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: stat.color,
                            flexShrink: 0,
                          }}
                        />
                        {stat.label}
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>{stat.sold}</td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: "var(--admin-accent)" }}>
                      Rs. {stat.income.toLocaleString()}
                    </td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 600, borderTop: "2px solid var(--admin-border)" }}>
                  <td>Total</td>
                  <td style={{ textAlign: "right" }}>{totalBooksSold}</td>
                  <td style={{ textAlign: "right", color: "var(--admin-accent)" }}>
                    Rs. {totalIncome.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Per-Book Sold Table */}
        <div className="admin-card" style={{ marginTop: "1.25rem" }}>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th style={{ textAlign: "right" }}>Individual</th>
                  <th style={{ textAlign: "right" }}>From Bundles</th>
                  <th style={{ textAlign: "right" }}>Total Sold</th>
                </tr>
              </thead>
              <tbody>
                {perBookSold.map((row) => (
                  <tr key={row.title}>
                    <td>{row.title}</td>
                    <td style={{ textAlign: "right" }}>{row.sold - row.fromBundles}</td>
                    <td style={{ textAlign: "right" }}>{row.fromBundles}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{row.sold}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 600, borderTop: "2px solid var(--admin-border)" }}>
                  <td>Total</td>
                  <td style={{ textAlign: "right" }}>
                    {perBookSold.reduce((s, r) => s + r.sold - r.fromBundles, 0)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {perBookSold.reduce((s, r) => s + r.fromBundles, 0)}
                  </td>
                  <td style={{ textAlign: "right" }}>{totalBooksSold}</td>
                </tr>
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
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <h3 className="admin-card-empty-title">No sales in this period</h3>
            <p className="admin-card-empty-text">
              Try selecting a different time period
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
