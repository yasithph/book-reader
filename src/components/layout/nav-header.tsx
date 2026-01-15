"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavHeaderProps {
  showBackButton?: boolean;
  backHref?: string;
  title?: string;
  titleSi?: string;
}

export function NavHeader({
  showBackButton = false,
  backHref = "/library",
  title,
  titleSi,
}: NavHeaderProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <header
      className={`nav-header ${isScrolled ? "nav-header-scrolled" : ""}`}
    >
      <div className="nav-header-content">
        {/* Left side */}
        <div className="nav-header-left">
          {showBackButton ? (
            <Link href={backHref} className="nav-back-btn">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
            </Link>
          ) : (
            <Link href="/" className="nav-logo">
              <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
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
          )}

          {title && (
            <div className="nav-title">
              <span className="nav-title-en">{title}</span>
              {titleSi && <span className="nav-title-si sinhala">{titleSi}</span>}
            </div>
          )}
        </div>

        {/* Center - Navigation links (desktop) */}
        {!showBackButton && (
          <nav className="nav-links">
            <Link
              href="/books"
              className={`nav-link ${isActive("/books") ? "nav-link-active" : ""}`}
            >
              <svg className="w-4 h-4 sm:hidden" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06v-11a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3a8.963 8.963 0 00-4.25 1.065V16.82zM9.25 4.065A8.963 8.963 0 005 3c-.85 0-1.673.118-2.454.339A.75.75 0 002 4.06v11a.75.75 0 00.954.721A7.506 7.506 0 015 15.5c1.579 0 3.042.487 4.25 1.32V4.065z" />
              </svg>
              <span className="hidden sm:inline">Browse</span>
            </Link>
            <Link
              href="/library"
              className={`nav-link ${isActive("/library") ? "nav-link-active" : ""}`}
            >
              <svg className="w-4 h-4 sm:hidden" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 4.75A.75.75 0 016.75 4h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 4.75zM6 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 10zm0 5.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75a.75.75 0 01-.75-.75zM1.99 4.75a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01zM1.99 15.25a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01zM1.99 10a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1V10z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Library</span>
            </Link>
          </nav>
        )}

        {/* Right side */}
        <div className="nav-header-right">
          <Link href="/settings" className="nav-settings-btn">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
