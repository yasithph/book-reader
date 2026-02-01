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
      <div className="pwa-install-prompt">
        <div className="pwa-install-header">
          <div className="pwa-install-icon">
            <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
              <path
                d="M6 8C6 7.4 6.4 7 7 7H13C14.7 7 16 8.3 16 10V26C16 25.4 15.6 25 15 25H7C6.4 25 6 24.6 6 24V8Z"
                fill="currentColor"
                fillOpacity="0.3"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M26 8C26 7.4 25.6 7 25 7H19C17.3 7 16 8.3 16 10V26C16 25.4 16.4 25 17 25H25C25.6 25 26 24.6 26 24V8Z"
                fill="currentColor"
                fillOpacity="0.2"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </div>
          <div>
            <h3 className="pwa-install-title">Install Meera</h3>
            <p className="pwa-install-description">
              Add to your home screen: tap{" "}
              <svg
                className="inline w-4 h-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.474l6.733-3.367A2.52 2.52 0 0113 4.5z" />
              </svg>{" "}
              then &quot;Add to Home Screen&quot;
            </p>
          </div>
        </div>
        <div className="pwa-install-actions">
          <button onClick={handleDismiss} className="pwa-install-btn pwa-install-btn-secondary">
            Maybe Later
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pwa-install-prompt">
      <div className="pwa-install-header">
        <div className="pwa-install-icon">
          <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
            <path
              d="M6 8C6 7.4 6.4 7 7 7H13C14.7 7 16 8.3 16 10V26C16 25.4 15.6 25 15 25H7C6.4 25 6 24.6 6 24V8Z"
              fill="currentColor"
              fillOpacity="0.3"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M26 8C26 7.4 25.6 7 25 7H19C17.3 7 16 8.3 16 10V26C16 25.4 16.4 25 17 25H25C25.6 25 26 24.6 26 24V8Z"
              fill="currentColor"
              fillOpacity="0.2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </div>
        <div>
          <h3 className="pwa-install-title">Install Meera</h3>
          <p className="pwa-install-description">
            Read offline, get faster access, and enjoy a native app experience.
          </p>
        </div>
      </div>
      <div className="pwa-install-actions">
        <button
          onClick={handleDismiss}
          className="pwa-install-btn pwa-install-btn-secondary"
        >
          Not Now
        </button>
        <button
          onClick={handleInstall}
          disabled={isPrompting}
          className="pwa-install-btn pwa-install-btn-primary"
        >
          {isPrompting ? "Installing..." : "Install"}
        </button>
      </div>
    </div>
  );
}
