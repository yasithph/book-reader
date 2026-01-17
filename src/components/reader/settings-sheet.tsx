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

const THEMES: { id: ReaderTheme; name: string; bg: string; text: string }[] = [
  { id: "light", name: "Light", bg: "#FFFFFF", text: "#1a1a1a" },
  { id: "sepia", name: "Sepia", bg: "#f4ecd8", text: "#433422" },
  { id: "dark", name: "Dark", bg: "#000000", text: "#E8E8E8" },
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
      className="kindle-reader-backdrop"
      onClick={handleBackdropClick}
    >
      <div
        ref={sheetRef}
        className="kindle-reader-sheet"
        style={{
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? "none" : undefined,
        }}
      >
        {/* Drag handle */}
        <div
          className="kindle-reader-handle"
          onTouchStart={handleDragStart}
          onMouseDown={handleDragStart}
        >
          <div className="kindle-reader-handle-bar" />
        </div>

        {/* Header */}
        <header className="kindle-reader-header">
          <h2 className="kindle-reader-title">Display</h2>
        </header>

        {/* Content */}
        <div className="kindle-reader-content">
          {/* Theme Selection */}
          <section className="kindle-reader-section">
            <div className="kindle-reader-themes">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  className={`kindle-reader-theme ${theme === t.id ? "kindle-reader-theme-active" : ""}`}
                  onClick={() => onThemeChange(t.id)}
                  aria-label={`${t.name} theme`}
                >
                  <div
                    className="kindle-reader-theme-preview"
                    style={{ backgroundColor: t.bg, borderColor: t.id === 'dark' ? '#333' : undefined }}
                  >
                    <div className="kindle-reader-theme-lines">
                      <span style={{ backgroundColor: t.text }} />
                      <span style={{ backgroundColor: t.text }} />
                      <span style={{ backgroundColor: t.text }} />
                    </div>
                  </div>
                  <span className="kindle-reader-theme-label">{t.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Font Size */}
          <section className="kindle-reader-section">
            <div className="kindle-reader-font-control">
              <button
                className="kindle-reader-font-btn"
                onClick={() => onFontSizeChange(Math.max(14, fontSize - 2))}
                disabled={fontSize <= 14}
                aria-label="Decrease font size"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                </svg>
                <span>A</span>
              </button>

              <div className="kindle-reader-font-display">
                <span className="kindle-reader-font-value">{fontSize}</span>
                <span className="kindle-reader-font-unit">px</span>
              </div>

              <button
                className="kindle-reader-font-btn"
                onClick={() => onFontSizeChange(Math.min(32, fontSize + 2))}
                disabled={fontSize >= 32}
                aria-label="Increase font size"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                </svg>
                <span>A</span>
              </button>
            </div>

            {/* Live preview */}
            <div
              className="kindle-reader-preview"
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
          <section className="kindle-reader-section">
            <div className="kindle-reader-spacing">
              <div className="kindle-reader-spacing-track">
                <input
                  type="range"
                  min="1.4"
                  max="2.4"
                  step="0.1"
                  value={lineSpacing}
                  onChange={(e) => onLineSpacingChange(parseFloat(e.target.value))}
                  className="kindle-reader-spacing-input"
                />
                <div
                  className="kindle-reader-spacing-fill"
                  style={{ width: `${((lineSpacing - 1.4) / 1.0) * 100}%` }}
                />
                <div
                  className="kindle-reader-spacing-thumb"
                  style={{ left: `${((lineSpacing - 1.4) / 1.0) * 100}%` }}
                />
              </div>
              <div className="kindle-reader-spacing-labels">
                <span>Compact</span>
                <span className="kindle-reader-spacing-value">{lineSpacing.toFixed(1)}×</span>
                <span>Relaxed</span>
              </div>
            </div>
          </section>

          {/* Reset */}
          <section className="kindle-reader-section kindle-reader-section-reset">
            <button className="kindle-reader-reset" onClick={onReset}>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
              </svg>
              Reset to Defaults
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
