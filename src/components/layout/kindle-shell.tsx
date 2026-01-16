"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BottomNav } from "./bottom-nav";

interface KindleShellProps {
  children: React.ReactNode;
  isLoggedIn: boolean;
  showHeader?: boolean;
}

export function KindleShell({ children, isLoggedIn, showHeader = true }: KindleShellProps) {
  const pathname = usePathname();
  const isReaderPage = pathname.startsWith("/read/");
  const isHomePage = pathname === "/" || pathname === "/books";
  const isLibraryPage = pathname.startsWith("/library");

  // Don't show shell on reader pages
  if (isReaderPage) {
    return <>{children}</>;
  }

  return (
    <div className="kindle-shell">
      {/* Top header - minimal for logged in users */}
      {showHeader && isLoggedIn && (
        <header className="kindle-header">
          <div className="kindle-header-content">
            <Link href="/" className="kindle-logo">
              <svg viewBox="0 0 32 32" fill="none" className="kindle-logo-icon">
                <path
                  d="M6 8C6 7.4 6.4 7 7 7H13C14.7 7 16 8.3 16 10V26C16 25.4 15.6 25 15 25H7C6.4 25 6 24.6 6 24V8Z"
                  fill="currentColor"
                  fillOpacity="0.15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M26 8C26 7.4 25.6 7 25 7H19C17.3 7 16 8.3 16 10V26C16 25.4 16.4 25 17 25H25C25.6 25 26 24.6 26 24V8Z"
                  fill="currentColor"
                  fillOpacity="0.1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </Link>

            {/* Page title for desktop */}
            <h1 className="kindle-page-title">
              {isHomePage && "Home"}
              {isLibraryPage && "Library"}
            </h1>

            {/* Search placeholder - future feature */}
            <div className="kindle-header-actions">
              <button className="kindle-search-btn" aria-label="Search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main content */}
      <main className={`kindle-main ${isLoggedIn ? "kindle-main-with-nav" : ""}`}>
        {children}
      </main>

      {/* Bottom navigation */}
      <BottomNav isLoggedIn={isLoggedIn} />
    </div>
  );
}
