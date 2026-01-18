"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminNav, useAdminTheme } from "@/components/admin/AdminNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const { isDark, toggleDark, mounted } = useAdminTheme();

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

  // Loading state
  if (isAdmin === null || !mounted) {
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
    <div className={`admin-shell ${isDark ? "admin-dark" : ""}`}>
      <AdminNav isDark={isDark} onToggleDark={toggleDark} />

      <main className="admin-content">
        <div className="admin-content-inner">
          {children}
        </div>
      </main>
    </div>
  );
}
