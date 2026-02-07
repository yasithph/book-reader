"use client";

import { useState, useEffect } from "react";
import { usePWAInstall } from "@/hooks/use-pwa-install";

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function InstallPrompt() {
  const { isInstallable, isInstalled, isIOS, promptInstall, dismissPrompt } =
    usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);

  useEffect(() => {
    // Check if user has dismissed recently
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < DISMISS_DURATION) {
        return;
      }
    }

    // Show prompt if installable and not already installed
    if (isInstallable && !isInstalled) {
      // Delay showing the prompt to not interrupt the user immediately
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    setIsPrompting(true);
    const success = await promptInstall();
    setIsPrompting(false);

    if (success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    dismissPrompt();
    setShowPrompt(false);
  };

  // Don't show if already installed or not installable
  if (isInstalled || !showPrompt) return null;

  // iOS-specific message
  if (isIOS) {
    return (
      <div className="kindle-prompt">
        <div className="kindle-prompt-body">
          <div className="kindle-prompt-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="kindle-prompt-text">
            <h3 className="kindle-prompt-title">Install Meera</h3>
            <p className="kindle-prompt-description">
              Tap{" "}
              <svg
                className="inline"
                width="14"
                height="14"
                viewBox="0 0 20 20"
                fill="currentColor"
                style={{ verticalAlign: "-2px" }}
              >
                <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.474l6.733-3.367A2.52 2.52 0 0113 4.5z" />
              </svg>{" "}
              then &quot;Add to Home Screen&quot;
            </p>
          </div>
        </div>
        <div className="kindle-prompt-actions">
          <button onClick={handleDismiss} className="kindle-prompt-btn kindle-prompt-btn-dismiss">
            Maybe Later
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="kindle-prompt">
      <div className="kindle-prompt-body">
        <div className="kindle-prompt-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div className="kindle-prompt-text">
          <h3 className="kindle-prompt-title">Install Meera</h3>
          <p className="kindle-prompt-description">
            Read offline with a native app experience.
          </p>
        </div>
      </div>
      <div className="kindle-prompt-actions">
        <button
          onClick={handleDismiss}
          className="kindle-prompt-btn kindle-prompt-btn-dismiss"
        >
          Not Now
        </button>
        <button
          onClick={handleInstall}
          disabled={isPrompting}
          className="kindle-prompt-btn kindle-prompt-btn-action"
        >
          {isPrompting ? "Installing..." : "Install"}
        </button>
      </div>
    </div>
  );
}
