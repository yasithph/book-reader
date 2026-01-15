"use client";

import * as React from "react";
import type { ReaderTheme, ReaderSettings } from "@/types";

const DEFAULT_SETTINGS: ReaderSettings = {
  theme: "light",
  fontSize: 18,
  lineSpacing: 1.9,
};

const STORAGE_KEY = "reader-settings";

export function useReaderSettings() {
  const [settings, setSettings] = React.useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load settings from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({
          theme: parsed.theme || DEFAULT_SETTINGS.theme,
          fontSize: parsed.fontSize || DEFAULT_SETTINGS.fontSize,
          lineSpacing: parsed.lineSpacing || DEFAULT_SETTINGS.lineSpacing,
        });
      }
    } catch (error) {
      console.error("Failed to load reader settings:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = React.useCallback((newSettings: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Failed to save reader settings:", error);
      }
      return updated;
    });
  }, []);

  // Individual setters
  const setTheme = React.useCallback(
    (theme: ReaderTheme) => saveSettings({ theme }),
    [saveSettings]
  );

  const setFontSize = React.useCallback(
    (fontSize: number) => saveSettings({ fontSize: Math.min(32, Math.max(14, fontSize)) }),
    [saveSettings]
  );

  const setLineSpacing = React.useCallback(
    (lineSpacing: number) =>
      saveSettings({ lineSpacing: Math.min(2.5, Math.max(1.2, lineSpacing)) }),
    [saveSettings]
  );

  const resetSettings = React.useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch (error) {
      console.error("Failed to reset reader settings:", error);
    }
  }, []);

  return {
    settings,
    isLoaded,
    setTheme,
    setFontSize,
    setLineSpacing,
    saveSettings,
    resetSettings,
  };
}
