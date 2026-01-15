"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LanguagePreference, ReaderTheme } from "@/types";

export default function SettingsPage() {
  const router = useRouter();
  const [phone, setPhone] = React.useState<string | null>(null);
  const [language, setLanguage] = React.useState<LanguagePreference>("si");
  const [theme, setTheme] = React.useState<ReaderTheme>("light");
  const [fontSize, setFontSize] = React.useState(18);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);

  // Load user data and preferences
  React.useEffect(() => {
    async function loadData() {
      try {
        // Get session
        const sessionRes = await fetch("/api/auth/session");
        if (sessionRes.ok) {
          const { user } = await sessionRes.json();
          setPhone(user?.phone || null);
        }

        // Get preferences
        const prefsRes = await fetch("/api/user/preferences");
        if (prefsRes.ok) {
          const { preferences } = await prefsRes.json();
          if (preferences) {
            setLanguage(preferences.language_preference || "si");
            setTheme(preferences.reader_theme || "light");
            setFontSize(preferences.font_size || 18);
          }
        }

        // Also load from localStorage for reader settings
        const savedSettings = localStorage.getItem("reader-settings");
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setTheme(parsed.theme || "light");
          setFontSize(parsed.fontSize || 18);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }
    loadData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Save to API
      await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language_preference: language,
          reader_theme: theme,
          font_size: fontSize,
        }),
      });

      // Also save to localStorage for reader
      localStorage.setItem(
        "reader-settings",
        JSON.stringify({ theme, fontSize, lineSpacing: 1.9 })
      );

      setSaveMessage("Settings saved successfully!");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaveMessage("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("94") && cleaned.length === 11) {
      return `+94 ${cleaned.slice(2, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    return phone;
  };

  const THEMES: { id: ReaderTheme; name: string; bg: string; text: string }[] = [
    { id: "light", name: "Light", bg: "#FFFEF9", text: "#2C1810" },
    { id: "sepia", name: "Sepia", bg: "#f4ecd8", text: "#5c4b37" },
    { id: "dark", name: "Dark", bg: "#1a1512", text: "#F0EBE3" },
  ];

  return (
    <main className="settings-page min-h-screen bg-[var(--auth-cream)] dark:bg-[#0f0d0a]">
      <div className="max-w-xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <Link
            href="/library"
            className="inline-flex items-center gap-2 text-sm text-[var(--auth-ink)]/50 dark:text-[#F5F0E8]/40 hover:text-[var(--auth-ink)] dark:hover:text-[#F5F0E8] transition-colors mb-4"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            <span>Back to Library</span>
          </Link>
          <h1 className="font-serif text-3xl font-medium text-[var(--auth-ink)] dark:text-[#F5F0E8]">
            Settings
          </h1>
          <p className="sinhala text-lg text-[var(--auth-ink)]/50 dark:text-[#F5F0E8]/40 mt-1">
            සැකසුම්
          </p>
        </header>

        {/* Account section */}
        <section className="settings-section">
          <h2 className="settings-section-title">Account</h2>
          <div className="settings-card">
            <div className="settings-row">
              <div className="flex items-center gap-3">
                <div className="settings-avatar">
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[var(--auth-ink)] dark:text-[#F5F0E8]">
                    {phone ? formatPhone(phone) : "Loading..."}
                  </p>
                  <p className="text-xs text-[var(--auth-ink)]/40 dark:text-[#F5F0E8]/30">
                    Phone number
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Language section */}
        <section className="settings-section">
          <h2 className="settings-section-title">
            <span>Language</span>
            <span className="sinhala opacity-50 text-sm ml-2">භාෂාව</span>
          </h2>
          <div className="settings-card">
            <div className="settings-language-options">
              <button
                className={`settings-language-btn ${language === "en" ? "settings-language-btn-active" : ""}`}
                onClick={() => setLanguage("en")}
              >
                <span className="font-serif text-lg">A</span>
                <span>English</span>
              </button>
              <button
                className={`settings-language-btn ${language === "si" ? "settings-language-btn-active" : ""}`}
                onClick={() => setLanguage("si")}
              >
                <span className="sinhala text-lg">අ</span>
                <span className="sinhala">සිංහල</span>
              </button>
            </div>
          </div>
        </section>

        {/* Reader settings section */}
        <section className="settings-section">
          <h2 className="settings-section-title">
            <span>Reader Settings</span>
            <span className="sinhala opacity-50 text-sm ml-2">කියවුම් සැකසුම්</span>
          </h2>
          <div className="settings-card">
            {/* Theme */}
            <div className="settings-row">
              <span className="text-sm text-[var(--auth-ink)]/70 dark:text-[#F5F0E8]/60">Theme</span>
              <div className="flex gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`settings-theme-swatch ${theme === t.id ? "settings-theme-swatch-active" : ""}`}
                    style={{ backgroundColor: t.bg }}
                    title={t.name}
                  >
                    {theme === t.id && (
                      <svg className="w-3 h-3" style={{ color: t.text }} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Font size */}
            <div className="settings-row">
              <span className="text-sm text-[var(--auth-ink)]/70 dark:text-[#F5F0E8]/60">Font Size</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                  disabled={fontSize <= 14}
                  className="settings-size-btn"
                >
                  <span className="text-sm">A-</span>
                </button>
                <span className="w-8 text-center font-serif font-medium text-[var(--auth-ink)] dark:text-[#F5F0E8]">
                  {fontSize}
                </span>
                <button
                  onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                  disabled={fontSize >= 32}
                  className="settings-size-btn"
                >
                  <span className="text-lg">A+</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="settings-save-btn"
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span>Saving...</span>
            </span>
          ) : (
            "Save Changes"
          )}
        </button>

        {saveMessage && (
          <p className={`text-center text-sm mt-3 ${saveMessage.includes("Failed") ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>
            {saveMessage}
          </p>
        )}

        {/* Links section */}
        <section className="settings-section mt-8">
          <h2 className="settings-section-title">More</h2>
          <div className="settings-card">
            <Link href="/books" className="settings-link-row">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 opacity-50" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06v-11a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3a8.963 8.963 0 00-4.25 1.065V16.82zM9.25 4.065A8.963 8.963 0 005 3c-.85 0-1.673.118-2.454.339A.75.75 0 002 4.06v11a.75.75 0 00.954.721A7.506 7.506 0 015 15.5c1.579 0 3.042.487 4.25 1.32V4.065z" />
                </svg>
                <span>Browse Books</span>
              </div>
              <svg className="w-4 h-4 opacity-30" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </Link>

            <Link href="/library" className="settings-link-row">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 opacity-50" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 4.75A.75.75 0 016.75 4h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 4.75zM6 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 10zm0 5.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75a.75.75 0 01-.75-.75zM1.99 4.75a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01zM1.99 15.25a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01zM1.99 10a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1V10z" clipRule="evenodd" />
                </svg>
                <span>My Library</span>
              </div>
              <svg className="w-4 h-4 opacity-30" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </section>

        {/* Logout section */}
        <section className="settings-section mt-8">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="settings-logout-btn"
          >
            {isLoggingOut ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <span>Logging out...</span>
              </span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M6 10a.75.75 0 01.75-.75h9.546l-1.048-.943a.75.75 0 111.004-1.114l2.5 2.25a.75.75 0 010 1.114l-2.5 2.25a.75.75 0 11-1.004-1.114l1.048-.943H6.75A.75.75 0 016 10z" clipRule="evenodd" />
                </svg>
                <span>Log Out</span>
              </>
            )}
          </button>
        </section>

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-[var(--auth-ink)]/30 dark:text-[#F5F0E8]/20">
          <p>Book Reader v0.1.0</p>
          <p className="sinhala mt-1">සිංහල නවකතා කියවීමේ යෙදුම</p>
        </footer>
      </div>
    </main>
  );
}
