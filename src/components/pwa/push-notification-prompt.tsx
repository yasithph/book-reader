"use client";

import { useState, useEffect } from "react";
import { usePushNotifications } from "@/hooks/use-push-notifications";

const DISMISS_KEY = "push-notification-dismissed";
const DISMISS_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

interface PushNotificationPromptProps {
  /**
   * Delay in milliseconds before showing the prompt
   * Default: 10000 (10 seconds)
   */
  delay?: number;
}

export function PushNotificationPrompt({ delay = 10000 }: PushNotificationPromptProps) {
  const { permission, isSubscribed, isLoading, subscribe } = usePushNotifications();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Don't show if already subscribed or denied
    if (isSubscribed || permission === "denied" || permission === "unsupported") {
      return;
    }

    // Check if user has dismissed recently
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < DISMISS_DURATION) {
        return;
      }
    }

    // Show prompt after delay
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [isSubscribed, permission, delay]);

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setShowPrompt(false);
  };

  // Don't show if already subscribed, denied, unsupported, or dismissed
  if (!showPrompt || isSubscribed || permission === "denied" || permission === "unsupported") {
    return null;
  }

  return (
    <div className="pwa-install-prompt">
      <div className="pwa-install-header">
        <div className="pwa-install-icon">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </div>
        <div>
          <h3 className="pwa-install-title">
            Stay Updated / යාවත්කාල වන්න
          </h3>
          <p className="pwa-install-description">
            Get notified when new chapters are published for books you purchased.
            <br />
            <span className="text-sm opacity-80">
              ඔබ මිලදී ගත් පොත් සඳහා නව පරිච්ඡේද පළ කළ විට දැනුම්දීම් ලබා ගන්න.
            </span>
          </p>
        </div>
      </div>
      <div className="pwa-install-actions">
        <button
          onClick={handleDismiss}
          className="pwa-install-btn pwa-install-btn-secondary"
        >
          Not Now / පසුව
        </button>
        <button
          onClick={handleEnable}
          disabled={isLoading}
          className="pwa-install-btn pwa-install-btn-primary"
        >
          {isLoading ? "Enabling... / සක්‍රිය කරමින්..." : "Enable / සක්‍රිය කරන්න"}
        </button>
      </div>
    </div>
  );
}
