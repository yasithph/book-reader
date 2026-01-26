"use client";

import { useState, useEffect } from "react";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import type { LanguagePreference } from "@/types";

const DISMISS_KEY = "push-notification-dismissed";
const DISMISS_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

const translations = {
  en: {
    title: "Stay Updated",
    description: "Get notified when new chapters are published.",
    dismiss: "Not Now",
    enable: "Enable",
    enabling: "Enabling...",
  },
  si: {
    title: "යාවත්කාල වන්න",
    description: "නව පරිච්ඡේද පළ වූ විට දැනුම්දීම් ලබා ගන්න.",
    dismiss: "පසුව",
    enable: "සක්‍රිය කරන්න",
    enabling: "සක්‍රිය කරමින්...",
  },
};

interface PushNotificationPromptProps {
  delay?: number;
}

export function PushNotificationPrompt({ delay = 10000 }: PushNotificationPromptProps) {
  const { permission, isSubscribed, isLoading, subscribe } = usePushNotifications();
  const [showPrompt, setShowPrompt] = useState(false);
  const [language, setLanguage] = useState<LanguagePreference>("si");

  // Fetch user's language preference
  useEffect(() => {
    async function fetchLanguage() {
      try {
        const res = await fetch("/api/user/preferences");
        if (res.ok) {
          const { preferences } = await res.json();
          if (preferences?.language_preference) {
            setLanguage(preferences.language_preference);
          }
        }
      } catch {
        // Use default language (si)
      }
    }
    fetchLanguage();
  }, []);

  useEffect(() => {
    if (isSubscribed || permission === "denied" || permission === "unsupported") {
      return;
    }

    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < DISMISS_DURATION) {
        return;
      }
    }

    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [isSubscribed, permission, delay]);

  const handleEnable = async () => {
    try {
      await subscribe();
    } catch (error) {
      console.error("Subscribe error:", error);
    } finally {
      // Always hide the prompt after attempting
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt || isSubscribed || permission === "denied" || permission === "unsupported") {
    return null;
  }

  const t = translations[language];

  return (
    <div className="push-notification-prompt">
      <div className="push-notification-content">
        <div className="push-notification-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </div>
        <div className="push-notification-text">
          <h3 className={language === "si" ? "sinhala" : ""}>{t.title}</h3>
          <p className={language === "si" ? "sinhala" : ""}>{t.description}</p>
        </div>
      </div>
      <div className="push-notification-actions">
        <button
          onClick={handleDismiss}
          className={`push-notification-btn-dismiss ${language === "si" ? "sinhala" : ""}`}
        >
          {t.dismiss}
        </button>
        <button
          onClick={handleEnable}
          disabled={isLoading}
          className={`push-notification-btn-enable ${language === "si" ? "sinhala" : ""}`}
        >
          {isLoading ? t.enabling : t.enable}
        </button>
      </div>
    </div>
  );
}
