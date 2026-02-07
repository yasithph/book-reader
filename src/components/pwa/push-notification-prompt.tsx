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
    <div className="kindle-prompt kindle-prompt-notification">
      <div className="kindle-prompt-body">
        <div className="kindle-prompt-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
          </svg>
        </div>
        <div className="kindle-prompt-text">
          <h3 className={`kindle-prompt-title ${language === "si" ? "sinhala" : ""}`}>{t.title}</h3>
          <p className={`kindle-prompt-description ${language === "si" ? "sinhala" : ""}`}>{t.description}</p>
        </div>
      </div>
      <div className="kindle-prompt-actions">
        <button
          onClick={handleDismiss}
          className={`kindle-prompt-btn kindle-prompt-btn-dismiss ${language === "si" ? "sinhala" : ""}`}
        >
          {t.dismiss}
        </button>
        <button
          onClick={handleEnable}
          disabled={isLoading}
          className={`kindle-prompt-btn kindle-prompt-btn-action ${language === "si" ? "sinhala" : ""}`}
        >
          {isLoading ? t.enabling : t.enable}
        </button>
      </div>
    </div>
  );
}
