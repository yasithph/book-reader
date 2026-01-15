"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { LanguagePreference } from "@/types";

export default function WelcomePage() {
  const router = useRouter();
  const [language, setLanguage] = React.useState<LanguagePreference>("si");
  const [showPWAPrompt, setShowPWAPrompt] = React.useState(false);
  const [isInstallable, setIsInstallable] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [phone, setPhone] = React.useState<string | null>(null);
  const deferredPromptRef = React.useRef<BeforeInstallPromptEvent | null>(null);

  // Fetch user phone from session
  React.useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          setPhone(data.user?.phone || null);
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

  const formatPhone = (phone: string) => {
    // Format as +94 XX XXX XXXX
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("94") && cleaned.length === 11) {
      return `+94 ${cleaned.slice(2, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    return phone;
  };

  return (
    <main className="welcome-page min-h-screen flex flex-col items-center justify-center p-6">
      {/* Decorative background elements */}
      <div className="welcome-bg-pattern" />
      <div className="welcome-bg-glow" />

      <div className="welcome-container w-full max-w-md relative z-10">
        {/* Book icon */}
        <div className="welcome-icon">
          <svg viewBox="0 0 48 48" fill="none" className="w-16 h-16">
            <path
              d="M8 12C8 10.9 8.9 10 10 10H20C22.2 10 24 11.8 24 14V38C24 36.9 23.1 36 22 36H10C8.9 36 8 35.1 8 34V12Z"
              fill="currentColor"
              fillOpacity="0.1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M40 12C40 10.9 39.1 10 38 10H28C25.8 10 24 11.8 24 14V38C24 36.9 24.9 36 26 36H38C39.1 36 40 35.1 40 34V12Z"
              fill="currentColor"
              fillOpacity="0.15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M24 14V38" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        {/* Welcome text */}
        <header className="welcome-header text-center mb-10">
          <h1 className="welcome-title font-serif text-3xl sm:text-4xl font-medium mb-3">
            <span className="block">Welcome</span>
            <span className="sinhala block text-2xl sm:text-3xl opacity-80">සාදරයෙන් පිළිගනිමු</span>
          </h1>
          {phone && (
            <p className="welcome-phone font-serif text-lg opacity-60">
              {formatPhone(phone)}
            </p>
          )}
        </header>

        {/* Language selection */}
        <section className="welcome-section mb-8">
          <h2 className="welcome-section-title">
            <span>Choose your language</span>
            <span className="sinhala">භාෂාව තෝරන්න</span>
          </h2>

          <div className="language-cards">
            <button
              className={`language-card ${language === "en" ? "language-card-active" : ""}`}
              onClick={() => setLanguage("en")}
            >
              <div className="language-card-icon">
                <span className="text-2xl font-serif">A</span>
              </div>
              <div className="language-card-content">
                <span className="language-card-name">English</span>
                <span className="language-card-native">ඉංග්‍රීසි</span>
              </div>
              {language === "en" && (
                <div className="language-card-check">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>

            <button
              className={`language-card ${language === "si" ? "language-card-active" : ""}`}
              onClick={() => setLanguage("si")}
            >
              <div className="language-card-icon">
                <span className="text-2xl sinhala">අ</span>
              </div>
              <div className="language-card-content">
                <span className="language-card-name sinhala">සිංහල</span>
                <span className="language-card-native">Sinhala</span>
              </div>
              {language === "si" && (
                <div className="language-card-check">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          </div>
        </section>

        {/* PWA Install prompt */}
        {(showPWAPrompt || isInstallable) && (
          <section className="welcome-section pwa-section mb-8">
            <div className="pwa-card">
              <div className="pwa-card-header">
                <div className="pwa-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                    <path d="M12 18v-6m0 0V6m0 6h6m-6 0H6" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-serif font-medium">
                    {language === "si" ? "ඔබේ උපාංගයට එකතු කරන්න" : "Add to your device"}
                  </h3>
                  <p className="text-sm opacity-60">
                    {language === "si" ? "වේගවත් ප්‍රවේශයක්" : "For quick access"}
                  </p>
                </div>
              </div>

              <ul className="pwa-benefits">
                <li>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  <span>{language === "si" ? "අන්තර්ජාලය නැතිව කියවන්න" : "Read offline"}</span>
                </li>
                <li>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  <span>{language === "si" ? "වේගවත් පූරණය" : "Faster loading"}</span>
                </li>
                <li>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  <span>{language === "si" ? "මුල් පිටුවේ අයිකනය" : "Home screen icon"}</span>
                </li>
              </ul>

              <button className="pwa-install-btn" onClick={handleInstall}>
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                  <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                </svg>
                <span>{language === "si" ? "ස්ථාපනය කරන්න" : "Install App"}</span>
              </button>

              <button
                className="pwa-skip-btn"
                onClick={() => setShowPWAPrompt(false)}
              >
                {language === "si" ? "පසුව" : "Maybe later"}
              </button>
            </div>
          </section>
        )}

        {/* Continue button */}
        <button
          className="welcome-continue-btn"
          onClick={handleContinue}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span>{language === "si" ? "රැඳී සිටින්න..." : "Please wait..."}</span>
            </span>
          ) : (
            <>
              <span>{language === "si" ? "පටන් ගන්න" : "Get Started"}</span>
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </>
          )}
        </button>

        {/* Footer ornament */}
        <div className="welcome-footer">
          <svg viewBox="0 0 100 20" fill="currentColor" className="w-24 h-5 opacity-20">
            <path d="M0 10 Q12 2 25 10 T50 10 T75 10 T100 10" stroke="currentColor" strokeWidth="1" fill="none" />
            <circle cx="50" cy="10" r="2" />
          </svg>
        </div>
      </div>
    </main>
  );
}

// Type for PWA install prompt
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
