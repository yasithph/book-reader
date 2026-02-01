"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LanguagePreference, ReaderTheme } from "@/types";
import { BottomNav } from "@/components/layout/bottom-nav";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { usePushNotifications } from "@/hooks/use-push-notifications";

export default function SettingsPage() {
  const router = useRouter();
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const { permission, isSubscribed, isLoading: isNotifLoading, subscribe, unsubscribe } = usePushNotifications();
  const [phone, setPhone] = React.useState<string | null>(null);
  const [language, setLanguage] = React.useState<LanguagePreference>("si");
  const [theme, setTheme] = React.useState<ReaderTheme>("light");
  const [fontSize, setFontSize] = React.useState(18);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [isInstalling, setIsInstalling] = React.useState(false);

  // Track initial values for change detection
  const initialValues = React.useRef({ language: "si", theme: "light", fontSize: 18 });

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
            initialValues.current = {
              language: preferences.language_preference || "si",
              theme: preferences.reader_theme || "light",
              fontSize: preferences.font_size || 18,
            };
          }
        }

        // Also load from localStorage for reader settings
        const savedSettings = localStorage.getItem("reader-settings");
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setTheme(parsed.theme || "light");
          setFontSize(parsed.fontSize || 18);
          initialValues.current.theme = parsed.theme || "light";
          initialValues.current.fontSize = parsed.fontSize || 18;
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }
    loadData();
  }, []);

  // Check for changes
  React.useEffect(() => {
    const changed =
      language !== initialValues.current.language ||
      theme !== initialValues.current.theme ||
      fontSize !== initialValues.current.fontSize;
    setHasChanges(changed);
  }, [language, theme, fontSize]);

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

      // Update initial values
      initialValues.current = { language, theme, fontSize };
      setHasChanges(false);

      setSaveMessage("Saved");
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaveMessage("Failed to save");
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

  const THEMES: { id: ReaderTheme; name: string; nameSi: string; bg: string; text: string }[] = [
    { id: "light", name: "Light", nameSi: "සුදු", bg: "#FFFEF9", text: "#1a1a1a" },
    { id: "sepia", name: "Sepia", nameSi: "සේපියා", bg: "#f4ecd8", text: "#433422" },
    { id: "dark", name: "Dark", nameSi: "අඳුරු", bg: "#000000", text: "#E8E8E8" },
  ];

  const handleInstallApp = async () => {
    setIsInstalling(true);
    try {
      await promptInstall();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <>
      <main className="kindle-settings">
        {/* Header */}
        <header className="kindle-settings-header">
          <div className="kindle-settings-header-inner">
            <h1 className="kindle-settings-title">Settings</h1>
            <p className="kindle-settings-subtitle">සැකසුම්</p>
          </div>
        </header>

        <div className="kindle-settings-content">
          {/* Account Section */}
          <section className="kindle-settings-section">
            <h2 className="kindle-settings-section-title">Account</h2>
            <div className="kindle-settings-card">
              <div className="kindle-settings-account">
                <div className="kindle-settings-avatar">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <div className="kindle-settings-account-info">
                  <p className="kindle-settings-phone">
                    {phone ? formatPhone(phone) : "Loading..."}
                  </p>
                  <p className="kindle-settings-phone-label">Phone number</p>
                </div>
              </div>
            </div>
          </section>

          {/* Language Section */}
          <section className="kindle-settings-section">
            <h2 className="kindle-settings-section-title">
              Language <span className="kindle-settings-section-title-si">භාෂාව</span>
            </h2>
            <div className="kindle-settings-card">
              <div className="kindle-settings-language-grid">
                <button
                  className={`kindle-settings-language-option ${language === "en" ? "kindle-settings-language-option-active" : ""}`}
                  onClick={() => setLanguage("en")}
                >
                  <span className="kindle-settings-language-icon">A</span>
                  <span className="kindle-settings-language-name">English</span>
                  {language === "en" && (
                    <span className="kindle-settings-check">
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </button>
                <button
                  className={`kindle-settings-language-option ${language === "si" ? "kindle-settings-language-option-active" : ""}`}
                  onClick={() => setLanguage("si")}
                >
                  <span className="kindle-settings-language-icon sinhala">අ</span>
                  <span className="kindle-settings-language-name sinhala">සිංහල</span>
                  {language === "si" && (
                    <span className="kindle-settings-check">
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* Reader Settings Section */}
          <section className="kindle-settings-section">
            <h2 className="kindle-settings-section-title">
              Reader <span className="kindle-settings-section-title-si">කියවුම්</span>
            </h2>
            <div className="kindle-settings-card">
              {/* Theme Selection */}
              <div className="kindle-settings-row">
                <div className="kindle-settings-row-label">
                  <span>Theme</span>
                  <span className="kindle-settings-row-label-si sinhala">තේමාව</span>
                </div>
                <div className="kindle-settings-theme-options">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`kindle-settings-theme-btn ${theme === t.id ? "kindle-settings-theme-btn-active" : ""}`}
                      style={{
                        backgroundColor: t.bg,
                        color: t.text,
                        borderColor: theme === t.id ? t.text : 'transparent'
                      }}
                      title={t.name}
                    >
                      <span className="kindle-settings-theme-label">{t.name[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div className="kindle-settings-row">
                <div className="kindle-settings-row-label">
                  <span>Font Size</span>
                  <span className="kindle-settings-row-label-si sinhala">අකුරු ප්‍රමාණය</span>
                </div>
                <div className="kindle-settings-font-size">
                  <button
                    onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                    disabled={fontSize <= 14}
                    className="kindle-settings-font-btn"
                    aria-label="Decrease font size"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" />
                    </svg>
                  </button>
                  <span className="kindle-settings-font-value">{fontSize}</span>
                  <button
                    onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                    disabled={fontSize >= 32}
                    className="kindle-settings-font-btn"
                    aria-label="Increase font size"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="kindle-settings-preview" style={{
                backgroundColor: THEMES.find(t => t.id === theme)?.bg,
                color: THEMES.find(t => t.id === theme)?.text
              }}>
                <p style={{ fontSize: `${fontSize}px` }} className="sinhala">
                  මෙය පෙරදසුනකි
                </p>
                <p className="kindle-settings-preview-label">Preview</p>
              </div>
            </div>
          </section>

          {/* Save Button */}
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="kindle-settings-save-btn"
            >
              {isSaving ? (
                <span className="kindle-settings-save-loading">
                  <svg className="kindle-settings-spinner" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          )}

          {/* Notifications Section */}
          {permission !== "unsupported" && (
            <section className="kindle-settings-section kindle-settings-section-spaced">
              <h2 className="kindle-settings-section-title">
                Notifications <span className="kindle-settings-section-title-si">දැනුම්දීම්</span>
              </h2>
              <div className="kindle-settings-card">
                <div className="kindle-settings-notification-row">
                  <div className="kindle-settings-notification-info">
                    <div className="kindle-settings-notification-title">
                      New Chapter Alerts
                    </div>
                    <div className="kindle-settings-notification-desc">
                      නව පරිච්ඡේද දැනුම්දීම්
                    </div>
                  </div>
                  <button
                    onClick={() => (isSubscribed ? unsubscribe() : subscribe())}
                    disabled={isNotifLoading || permission === "denied"}
                    className={`kindle-settings-toggle ${isSubscribed ? "kindle-settings-toggle-on" : ""}`}
                  >
                    <span className="kindle-settings-toggle-slider" />
                  </button>
                </div>
                {permission === "denied" && (
                  <p className="kindle-settings-notification-blocked">
                    Notifications are blocked. Please enable them in your browser settings.
                  </p>
                )}
                {isSubscribed && (
                  <p className="kindle-settings-notification-enabled">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    You&apos;ll receive notifications when new chapters are published
                  </p>
                )}
              </div>
            </section>
          )}

          {saveMessage && (
            <p className={`kindle-settings-message ${saveMessage.includes("Failed") ? "kindle-settings-message-error" : ""}`}>
              {saveMessage === "Saved" && (
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              )}
              {saveMessage}
            </p>
          )}

          {/* About Section */}
          <section className="kindle-settings-section kindle-settings-section-spaced">
            <h2 className="kindle-settings-section-title">About</h2>
            <div className="kindle-settings-card">
              <div className="kindle-settings-about-row">
                <span>Version</span>
                <span className="kindle-settings-about-value">1.0.0</span>
              </div>
              <div className="kindle-settings-about-row">
                <span>App</span>
                <span className="kindle-settings-about-value">Meera</span>
              </div>
            </div>
          </section>

          {/* Install App Section */}
          {!isInstalled && (
            <section className="kindle-settings-section">
              <h2 className="kindle-settings-section-title">
                Install App <span className="kindle-settings-section-title-si">යෙදුම ස්ථාපනය</span>
              </h2>
              <div className="kindle-settings-card">
                {isInstallable ? (
                  <button
                    onClick={handleInstallApp}
                    disabled={isInstalling}
                    className="kindle-settings-install-btn"
                  >
                    {isInstalling ? (
                      <span className="kindle-settings-save-loading">
                        <svg className="kindle-settings-spinner" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeOpacity="0.25" />
                          <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                        </svg>
                        Installing...
                      </span>
                    ) : (
                      <>
                        <svg viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                          <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                        </svg>
                        Install App
                      </>
                    )}
                  </button>
                ) : isIOS ? (
                  <div className="kindle-settings-ios-install">
                    <p className="kindle-settings-ios-text">
                      To install on iOS:
                    </p>
                    <ol className="kindle-settings-ios-steps">
                      <li>Tap the Share button <span className="kindle-settings-ios-icon">⎋</span></li>
                      <li>Select &quot;Add to Home Screen&quot;</li>
                    </ol>
                  </div>
                ) : (
                  <p className="kindle-settings-install-unavailable">
                    Use Chrome or Safari to install this app on your device
                  </p>
                )}
              </div>
            </section>
          )}

          {isInstalled && (
            <section className="kindle-settings-section">
              <div className="kindle-settings-card">
                <div className="kindle-settings-installed">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  <span>App installed</span>
                </div>
              </div>
            </section>
          )}

          {/* Logout */}
          <section className="kindle-settings-section">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="kindle-settings-logout-btn"
            >
              {isLoggingOut ? (
                <span className="kindle-settings-save-loading">
                  <svg className="kindle-settings-spinner" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                  </svg>
                  Logging out...
                </span>
              ) : (
                <>
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M6 10a.75.75 0 01.75-.75h9.546l-1.048-.943a.75.75 0 111.004-1.114l2.5 2.25a.75.75 0 010 1.114l-2.5 2.25a.75.75 0 11-1.004-1.114l1.048-.943H6.75A.75.75 0 016 10z" clipRule="evenodd" />
                  </svg>
                  Sign Out
                </>
              )}
            </button>
          </section>
        </div>
      </main>

      <BottomNav isLoggedIn={true} />
    </>
  );
}
