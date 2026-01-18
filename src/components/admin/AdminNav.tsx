"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePWAInstall } from "@/hooks/use-pwa-install";

// Navigation items (consolidated from 5 to 4)
const navItems = [
  {
    href: "/admin",
    label: "Write",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        <path d="m15 5 4 4" />
      </svg>
    ),
  },
  {
    href: "/admin/sales",
    label: "Sales",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/admin/books",
    label: "Books",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      </svg>
    ),
  },
];

// Sun icon for light mode
const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

// Moon icon for dark mode
const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

// Arrow/Back icon
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

// Profile/User icon
const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M20 21a8 8 0 0 0-16 0" />
  </svg>
);

// Logout icon
const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

// Download/Install icon
const InstallIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

interface AdminNavProps {
  isDark: boolean;
  onToggleDark: () => void;
}

export function AdminNav({ isDark, onToggleDark }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Check if current path matches nav item
  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  const handleInstall = async () => {
    await promptInstall();
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".admin-profile-menu-container")) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showProfileMenu]);

  return (
    <>
      {/* Mobile Header */}
      <header className="admin-mobile-header">
        <span className="admin-mobile-title">Admin</span>
        <div className="admin-mobile-actions">
          {/* PWA Install Button - only show if installable */}
          {isInstallable && !isInstalled && (
            <button
              onClick={handleInstall}
              className="admin-action-btn"
              aria-label="Install app"
              title="Install app"
            >
              <InstallIcon />
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={onToggleDark}
            className="admin-action-btn"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Profile Menu */}
          <div className="admin-profile-menu-container">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="admin-action-btn"
              aria-label="Profile menu"
            >
              <ProfileIcon />
            </button>
            {showProfileMenu && (
              <div className="admin-profile-menu">
                <button
                  onClick={handleLogout}
                  className="admin-profile-menu-item"
                  disabled={isLoggingOut}
                >
                  <LogoutIcon />
                  <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="admin-sidebar">
        {/* Logo */}
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">K</div>
          <span className="admin-sidebar-title">Admin</span>
        </div>

        {/* Navigation */}
        <nav className="admin-sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-sidebar-link ${isActive(item.href) ? "active" : ""}`}
            >
              <span className="admin-sidebar-icon">{item.icon}</span>
              <span className="admin-sidebar-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="admin-sidebar-footer">
          {/* PWA Install Button - only show if installable */}
          {isInstallable && !isInstalled && (
            <button
              onClick={handleInstall}
              className="admin-sidebar-link"
              aria-label="Install app"
            >
              <span className="admin-sidebar-icon">
                <InstallIcon />
              </span>
              <span className="admin-sidebar-label">Install App</span>
            </button>
          )}

          <button
            onClick={onToggleDark}
            className="admin-sidebar-link"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className="admin-sidebar-icon">
              {isDark ? <SunIcon /> : <MoonIcon />}
            </span>
            <span className="admin-sidebar-label">{isDark ? "Light Mode" : "Dark Mode"}</span>
          </button>

          <Link href="/" className="admin-sidebar-link">
            <span className="admin-sidebar-icon">
              <BackIcon />
            </span>
            <span className="admin-sidebar-label">Back to App</span>
          </Link>

          <button
            onClick={handleLogout}
            className="admin-sidebar-link admin-sidebar-logout"
            disabled={isLoggingOut}
          >
            <span className="admin-sidebar-icon">
              <LogoutIcon />
            </span>
            <span className="admin-sidebar-label">{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="admin-bottom-nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`admin-bottom-link ${isActive(item.href) ? "active" : ""}`}
          >
            <span className="admin-bottom-icon">{item.icon}</span>
            <span className="admin-bottom-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}

// Theme provider hook for admin
export function useAdminTheme() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage for saved preference
    const saved = localStorage.getItem("admin-theme");
    if (saved === "dark") {
      setIsDark(true);
    } else if (saved === "light") {
      setIsDark(false);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(prefersDark);
    }
  }, []);

  const toggleDark = () => {
    const newValue = !isDark;
    setIsDark(newValue);
    localStorage.setItem("admin-theme", newValue ? "dark" : "light");
  };

  return { isDark, toggleDark, mounted };
}
