"use client";

import { useState, useEffect } from "react";
import { useOnlineStatus } from "@/hooks/use-download-manager";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!isOnline && !isDismissed) {
      setShowBanner(true);
    } else if (isOnline) {
      setShowBanner(false);
      setIsDismissed(false); // Reset dismissed state when back online
    }
  }, [isOnline, isDismissed]);

  if (!showBanner) return null;

  return (
    <div className="offline-banner">
      <svg
        className="offline-banner-icon"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z"
          clipRule="evenodd"
        />
        <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
      </svg>
      <span className="offline-banner-text">
        You&apos;re offline. Downloaded books are still available.
      </span>
      <button
        onClick={() => setIsDismissed(true)}
        className="offline-banner-dismiss"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}
