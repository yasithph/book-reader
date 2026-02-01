"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { LanguagePreference } from "@/types";
import "@/styles/kindle.css";

export default function WelcomePage() {
  const router = useRouter();
  const [language, setLanguage] = React.useState<LanguagePreference>("si");
  const [showPWAPrompt, setShowPWAPrompt] = React.useState(false);
  const [isInstallable, setIsInstallable] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [displayName, setDisplayName] = React.useState<string | null>(null);
  const deferredPromptRef = React.useRef<BeforeInstallPromptEvent | null>(null);

  // Fetch user info from session
  React.useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          setDisplayName(data.user?.display_name || null);
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
      }
    }
    fetchSession();
  }, []);

  // Listen for PWA install prompt
  React.useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setIsInstallable(true);
      setShowPWAPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstallable(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPromptRef.current) return;

    deferredPromptRef.current.prompt();
    const { outcome } = await deferredPromptRef.current.userChoice;

    if (outcome === "accepted") {
      setShowPWAPrompt(false);
    }
    deferredPromptRef.current = null;
  };

  const handleContinue = async () => {
    setIsSubmitting(true);

    try {
      // Save language preference
      await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language_preference: language,
          is_first_login: false,
        }),
      });

      router.push("/library");
    } catch (error) {
      console.error("Failed to save preferences:", error);
      // Continue anyway
      router.push("/library");
    }
  };

  return (
    <main className="kindle-welcome">
      <div className="kindle-welcome-container">
        {/* Logo */}
        <div className="kindle-welcome-logo">
          <svg viewBox="0 0 48 48" fill="none">
            <path
              d="M8 12C8 10.9 8.9 10 10 10H20C22.2 10 24 11.8 24 14V38C24 36.9 23.1 36 22 36H10C8.9 36 8 35.1 8 34V12Z"
              fill="currentColor"
              fillOpacity="0.08"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M40 12C40 10.9 39.1 10 38 10H28C25.8 10 24 11.8 24 14V38C24 36.9 24.9 36 26 36H38C39.1 36 40 35.1 40 34V12Z"
              fill="currentColor"
              fillOpacity="0.12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Welcome text */}
        <header className="kindle-welcome-header">
          <h1 className="kindle-welcome-title">
            {displayName ? (
              <>
                <span className="kindle-welcome-greeting">Welcome,</span>
                <span className="kindle-welcome-name">{displayName}</span>
              </>
            ) : (
              <>
                <span>Welcome</span>
                <span className="kindle-welcome-title-si">සාදරයෙන් පිළිගනිමු</span>
              </>
            )}
          </h1>
        </header>

        {/* Language selection */}
        <section className="kindle-welcome-section">
          <h2 className="kindle-welcome-section-title">
            <span>Choose your language</span>
            <span className="kindle-welcome-section-title-si">භාෂාව තෝරන්න</span>
          </h2>

          <div className="kindle-welcome-language-grid">
            <button
              className={`kindle-welcome-language-card ${language === "en" ? "kindle-welcome-language-card-active" : ""}`}
              onClick={() => setLanguage("en")}
            >
              <div className="kindle-welcome-language-icon">
                <span>A</span>
              </div>
              <div className="kindle-welcome-language-text">
                <span className="kindle-welcome-language-name">English</span>
                <span className="kindle-welcome-language-native">ඉංග්‍රීසි</span>
              </div>
              {language === "en" && (
                <div className="kindle-welcome-language-check">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>

            <button
              className={`kindle-welcome-language-card ${language === "si" ? "kindle-welcome-language-card-active" : ""}`}
              onClick={() => setLanguage("si")}
            >
              <div className="kindle-welcome-language-icon kindle-welcome-language-icon-si">
                <span>අ</span>
              </div>
              <div className="kindle-welcome-language-text">
                <span className="kindle-welcome-language-name kindle-welcome-language-name-si">සිංහල</span>
                <span className="kindle-welcome-language-native">Sinhala</span>
              </div>
              {language === "si" && (
                <div className="kindle-welcome-language-check">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          </div>
        </section>

        {/* PWA Install prompt - subtle card design */}
        {(showPWAPrompt || isInstallable) && (
          <section className="kindle-welcome-pwa">
            <div className="kindle-welcome-pwa-card">
              <div className="kindle-welcome-pwa-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" fill="currentColor" stroke="none" />
                  <path d="M3.5 14.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 20h10.5A2.75 2.75 0 0018 17.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <div className="kindle-welcome-pwa-content">
                <h3 className="kindle-welcome-pwa-title">
                  {language === "si" ? "App එක Install කරන්න" : "Install the App"}
                </h3>
                <p className="kindle-welcome-pwa-desc">
                  {language === "si" ? "Offline කියවීම සඳහා" : "Read offline anytime"}
                </p>
              </div>
              <button
                className="kindle-welcome-pwa-btn"
                onClick={handleInstall}
              >
                {language === "si" ? "Install" : "Install"}
              </button>
              <button
                className="kindle-welcome-pwa-dismiss"
                onClick={() => setShowPWAPrompt(false)}
                aria-label="Dismiss"
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          </section>
        )}

        {/* Continue button */}
        <button
          className="kindle-welcome-continue"
          onClick={handleContinue}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="kindle-welcome-continue-loading">
              <svg className="kindle-welcome-spinner" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span>{language === "si" ? "රැඳී සිටින්න..." : "Please wait..."}</span>
            </span>
          ) : (
            <>
              <span>{language === "si" ? "පටන් ගන්න" : "Get Started"}</span>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </>
          )}
        </button>

              </div>
    </main>
  );
}

// Type for PWA install prompt
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
