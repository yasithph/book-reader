"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

// Admin navigation items
const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/register", label: "Register User", icon: "➕" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/books", label: "Books", icon: "📚" },
  { href: "/admin/import", label: "Import PDF", icon: "📄" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Check if user is admin
    async function checkAdmin() {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();

        if (!data.user || data.user.role !== "admin") {
          router.push("/");
          return;
        }

        setIsAdmin(true);
      } catch {
        router.push("/");
      }
    }

    checkAdmin();
  }, [router]);

  if (isAdmin === null) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p>Verifying admin access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="admin-layout">
      {/* Mobile header */}
      <header className="admin-mobile-header">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="admin-menu-btn"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <h1 className="admin-mobile-title">Book Reader Admin</h1>
      </header>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-sidebar-header">
          <h1>Book Reader</h1>
          <span>Admin Panel</span>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-item ${
                pathname === item.href ? "active" : ""
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span className="admin-nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link href="/" className="admin-back-link">
            ← Back to App
          </Link>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="admin-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="admin-main">{children}</main>
    </div>
  );
}
