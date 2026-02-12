"use client";

import * as React from "react";
import type { ReadingStats } from "@/types";

interface ProfileCardProps {
  avatarUrl: string;
  displayName: string | null;
  phone: string | null;
  stats: ReadingStats;
  onAvatarClick: () => void;
  onNameChange: (name: string) => void;
}

export function ProfileCard({
  avatarUrl,
  displayName,
  phone,
  stats,
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
          </div>
        </div>

        <div className="kindle-profile-stats">
          <div className="kindle-profile-stat">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06v-11a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3a8.963 8.963 0 00-4.25 1.065V16.82zM9.25 4.065A8.963 8.963 0 005 3c-.85 0-1.673.118-2.454.339A.75.75 0 002 4.06v11a.75.75 0 00.954.721A7.506 7.506 0 015 15.5c1.579 0 3.042.487 4.25 1.32V4.065z" />
            </svg>
            <span className="sinhala">
              පරිච්ඡේද {stats.totalCompletedChapters}ක් කියවා ඇත
            </span>
          </div>
          <div className="kindle-profile-stat">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
            <span className="sinhala">
              පොත් {stats.totalCompletedBooks}ක් සම්පූර්ණයි
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
