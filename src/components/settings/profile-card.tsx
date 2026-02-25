"use client";

import * as React from "react";
import type { ReadingStats } from "@/types";

interface ProfileCardProps {
  avatarUrl: string;
  displayName: string | null;
  phone: string | null;
  stats: ReadingStats;
  isTopReader?: boolean;
  topReaderRank?: number;
  onAvatarClick: () => void;
  onNameChange: (name: string) => void;
}

export function ProfileCard({
  avatarUrl,
  displayName,
  phone,
  stats,
  isTopReader,
  topReaderRank,
  onAvatarClick,
  onNameChange,
}: ProfileCardProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const savingRef = React.useRef(false);

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("94") && cleaned.length === 11) {
      return `+94 ${cleaned.slice(2, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    return phone;
  };

  const startEditing = () => {
    setEditValue(displayName || "");
    setIsEditing(true);
    savingRef.current = false;
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const saveEdit = () => {
    if (savingRef.current) return;
    savingRef.current = true;
    const trimmed = editValue.trim();
    if (trimmed.length >= 2 && trimmed.length <= 50) {
      onNameChange(trimmed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      savingRef.current = true;
      setIsEditing(false);
    }
  };

  const isTopThree = isTopReader && topReaderRank !== undefined && topReaderRank <= 3;
  const badgeSrc = isTopThree
    ? "/images/generated/badge-top3.png"
    : "/images/generated/badge-top-reader.png";

  return (
    <section className="kindle-settings-section">
      <h2 className="kindle-settings-section-title">Account</h2>
      <div className="kindle-settings-card">
        <div className="kindle-profile-card">
          <button
            className="kindle-profile-avatar-btn"
            onClick={onAvatarClick}
            aria-label="Change avatar"
          >
            <img
              src={avatarUrl}
              alt="Profile avatar"
              className="kindle-profile-avatar-img"
            />
            <span className="kindle-profile-avatar-edit">
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L3.462 11.1a.25.25 0 00-.064.108l-.631 2.208 2.208-.63a.25.25 0 00.108-.064l8.609-8.61a.25.25 0 000-.353l-1.086-1.086z" />
              </svg>
            </span>
          </button>

          <div className="kindle-profile-info">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={handleKeyDown}
                className="kindle-profile-name-input"
                maxLength={50}
                placeholder="Your name"
              />
            ) : (
              <button
                className="kindle-profile-name-btn"
                onClick={startEditing}
              >
                <span className={`kindle-profile-name ${!displayName ? "kindle-profile-name-placeholder" : ""}`}>
                  {displayName || "Set your name"}
                </span>
                <svg className="kindle-profile-name-edit-icon" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L3.462 11.1a.25.25 0 00-.064.108l-.631 2.208 2.208-.63a.25.25 0 00.108-.064l8.609-8.61a.25.25 0 000-.353l-1.086-1.086z" />
                </svg>
              </button>
            )}
            <p className="kindle-profile-phone">
              {phone ? formatPhone(phone) : "Loading..."}
            </p>
            <p className="kindle-profile-points">
              {stats.engagementScore ?? 0} points
            </p>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="kindle-profile-achievements">
          <div className="kindle-profile-achievements-header">
            <span className="kindle-profile-achievements-title">Achievements</span>
          </div>
          <div className="kindle-profile-achievements-row">
            {isTopReader && (
              <div className="kindle-profile-achievement">
                <img src={badgeSrc} alt="" className="kindle-profile-achievement-img" />
                <span className="kindle-profile-achievement-label">
                  {isTopThree ? `Top #${topReaderRank}` : "Top Reader"}
                </span>
              </div>
            )}
            <div className="kindle-profile-achievement">
              <img src="/images/generated/badge-chapters.png" alt="" className="kindle-profile-achievement-img" />
              <span className="kindle-profile-achievement-label">
                {stats.totalCompletedChapters} Chapters
              </span>
            </div>
            <div className="kindle-profile-achievement">
              <img src="/images/generated/badge-books.png" alt="" className="kindle-profile-achievement-img" />
              <span className="kindle-profile-achievement-label">
                {stats.totalCompletedBooks} Books
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
