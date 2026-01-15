"use client";

import * as React from "react";
import type { ReaderTheme } from "@/types";

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ReaderTheme;
  fontSize: number;
  lineSpacing: number;
  onThemeChange: (theme: ReaderTheme) => void;
  onFontSizeChange: (size: number) => void;
  onLineSpacingChange: (spacing: number) => void;
  onReset: () => void;
}

const THEMES: { id: ReaderTheme; name: string; nameSi: string; bg: string; text: string; accent: string }[] = [
  { id: "light", name: "Light", nameSi: "සුදු", bg: "#FFFEF9", text: "#2C1810", accent: "#722F37" },
  { id: "sepia", name: "Sepia", nameSi: "පැරණි", bg: "#f4ecd8", text: "#5c4b37", accent: "#8b7355" },
  { id: "dark", name: "Dark", nameSi: "අඳුරු", bg: "#1a1512", text: "#F0EBE3", accent: "#C9A227" },
];

const SAMPLE_TEXT = "කතාවේ ආරම්භය...";

export function SettingsSheet({
  isOpen,
  onClose,
  theme,
  fontSize,
  lineSpacing,
  onThemeChange,
  onFontSizeChange,
  onLineSpacingChange,
  onReset,
}: SettingsSheetProps) {
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState(0);
  const startYRef = React.useRef(0);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle drag start
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    startYRef.current = clientY;
  };

  // Handle drag move
  const handleDragMove = React.useCallback(
    (e: TouchEvent | MouseEvent) => {
      if (!isDragging) return;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const delta = clientY - startYRef.current;
      if (delta > 0) {
        setDragOffset(delta);
      }
    },
    [isDragging]
  );

  // Handle drag end
  const handleDragEnd = React.useCallback(() => {
    if (dragOffset > 100) {
      onClose();
    }
    setIsDragging(false);
    setDragOffset(0);
  }, [dragOffset, onClose]);

  // Set up drag listeners
  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener("touchmove", handleDragMove, { passive: true });
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("touchend", handleDragEnd);
      window.addEventListener("mouseup", handleDragEnd);

      return () => {
        window.removeEventListener("touchmove", handleDragMove);
        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("touchend", handleDragEnd);
        window.removeEventListener("mouseup", handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Lock body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentThemeConfig = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <div
      className="settings-sheet-backdrop"
      onClick={handleBackdropClick}
      style={{ opacity: isOpen ? 1 : 0 }}
    >
      <div
        ref={sheetRef}
        className="settings-sheet"
        style={{
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? "none" : undefined,
        }}
      >
        {/* Drag handle */}
        <div
          className="settings-sheet-handle"
          onTouchStart={handleDragStart}
          onMouseDown={handleDragStart}
        >
          <div className="settings-sheet-handle-bar" />
          <div className="settings-sheet-handle-ornament">
            <svg width="24" height="8" viewBox="0 0 24 8" fill="currentColor" opacity="0.3">
              <path d="M0 4C0 4 4 0 6 0C8 0 8 4 12 4C16 4 16 0 18 0C20 0 24 4 24 4C24 4 20 8 18 8C16 8 16 4 12 4C8 4 8 8 6 8C4 8 0 4 0 4Z" />
            </svg>
          </div>
        </div>

        {/* Header */}
        <header className="settings-sheet-header">
          <h2 className="settings-sheet-title">
            <span className="font-serif">Reader Settings</span>
            <span className="sinhala text-sm opacity-50">කියවුම් සැකසුම්</span>
          </h2>
        </header>

        {/* Content */}
        <div className="settings-sheet-content">
          {/* Theme Selection */}
          <section className="settings-section">
            <h3 className="settings-section-title">
              <span>Theme</span>
              <span className="sinhala">තේමාව</span>
            </h3>
            <div className="theme-selector">
              {THEMES.map((t, index) => (
                <button
                  key={t.id}
                  className={`theme-swatch ${theme === t.id ? "theme-swatch-active" : ""}`}
                  onClick={() => onThemeChange(t.id)}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  aria-label={`${t.name} theme`}
                >
                  {/* Mini page preview */}
                  <div
                    className="theme-swatch-preview"
                    style={{ backgroundColor: t.bg }}
                  >
                    {/* Page lines */}
                    <div className="theme-swatch-lines" style={{ backgroundColor: t.text }}>
                      <span style={{ width: "85%" }} />
                      <span style={{ width: "70%" }} />
                      <span style={{ width: "90%" }} />
                      <span style={{ width: "60%" }} />
                    </div>
                    {/* Selection indicator */}
                    {theme === t.id && (
                      <div className="theme-swatch-check" style={{ color: t.accent }}>
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <span className="theme-swatch-label">{t.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Font Size */}
          <section className="settings-section">
            <h3 className="settings-section-title">
              <span>Font Size</span>
              <span className="sinhala">අකුරු ප්‍රමාණය</span>
            </h3>
            <div className="font-size-control">
              <button
                className="font-size-btn font-size-btn-decrease"
                onClick={() => onFontSizeChange(Math.max(14, fontSize - 2))}
                disabled={fontSize <= 14}
                aria-label="Decrease font size"
              >
                <span className="font-serif">A</span>
                <svg width="10" height="2" viewBox="0 0 10 2" fill="currentColor">
                  <rect width="10" height="2" rx="1" />
                </svg>
              </button>

              <div className="font-size-display">
                <span className="font-size-value">{fontSize}</span>
                <span className="font-size-unit">px</span>
              </div>

              <button
                className="font-size-btn font-size-btn-increase"
                onClick={() => onFontSizeChange(Math.min(32, fontSize + 2))}
                disabled={fontSize >= 32}
                aria-label="Increase font size"
              >
                <span className="font-serif text-lg">A</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <rect y="4" width="10" height="2" rx="1" />
                  <rect x="4" width="2" height="10" rx="1" />
                </svg>
              </button>
            </div>

            {/* Live preview */}
            <div
              className="font-preview"
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: lineSpacing,
                backgroundColor: currentThemeConfig.bg,
                color: currentThemeConfig.text,
              }}
            >
              <p className="sinhala">{SAMPLE_TEXT}</p>
            </div>
          </section>

          {/* Line Spacing */}
          <section className="settings-section">
            <h3 className="settings-section-title">
              <span>Line Spacing</span>
              <span className="sinhala">පේළි පරතරය</span>
            </h3>
            <div className="line-spacing-control">
              <div className="line-spacing-track">
                <input
                  type="range"
                  min="1.2"
                  max="2.5"
                  step="0.1"
                  value={lineSpacing}
                  onChange={(e) => onLineSpacingChange(parseFloat(e.target.value))}
                  className="line-spacing-slider"
                />
                <div
                  className="line-spacing-fill"
                  style={{ width: `${((lineSpacing - 1.2) / 1.3) * 100}%` }}
                />
              </div>
              <div className="line-spacing-labels">
                <span className="line-spacing-label">Compact</span>
                <span className="line-spacing-value">{lineSpacing.toFixed(1)}×</span>
                <span className="line-spacing-label">Relaxed</span>
              </div>
            </div>

            {/* Line spacing visual */}
            <div className="line-spacing-preview">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="line-spacing-preview-line"
                  style={{
                    marginBottom: `${(lineSpacing - 1) * 8}px`,
                    opacity: 0.3 + i * 0.2,
                  }}
                />
              ))}
            </div>
          </section>

          {/* Reset */}
          <section className="settings-section settings-section-reset">
            <button className="reset-button" onClick={onReset}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
              </svg>
              <span className="font-serif">Reset to Defaults</span>
            </button>
          </section>
        </div>

        {/* Footer ornament */}
        <div className="settings-sheet-footer">
          <div className="settings-sheet-footer-ornament">
            <svg width="120" height="20" viewBox="0 0 120 20" fill="currentColor" opacity="0.15">
              <path d="M0 10 Q15 0 30 10 T60 10 T90 10 T120 10" strokeWidth="1" stroke="currentColor" fill="none" />
              <circle cx="60" cy="10" r="3" />
              <circle cx="30" cy="10" r="2" />
              <circle cx="90" cy="10" r="2" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
