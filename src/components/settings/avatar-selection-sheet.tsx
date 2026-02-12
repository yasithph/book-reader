"use client";

import * as React from "react";

interface AvatarSelectionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl: string;
  predefinedAvatars: string[];
  onSelectAvatar: (url: string) => void;
  onUploadFile: (file: File) => void;
  isUploading: boolean;
}

export function AvatarSelectionSheet({
  isOpen,
  onClose,
  currentAvatarUrl,
  predefinedAvatars,
  onSelectAvatar,
  onUploadFile,
  isUploading,
}: AvatarSelectionSheetProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState(0);
  const startYRef = React.useRef(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    startYRef.current = clientY;
  };

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

  const handleDragEnd = React.useCallback(() => {
    if (dragOffset > 100) {
      onClose();
    }
    setIsDragging(false);
    setDragOffset(0);
  }, [dragOffset, onClose]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
    }
    // Reset so the same file can be re-selected
    e.target.value = "";
  };

  if (!isOpen) return null;

  return (
    <div
      className="kindle-avatar-backdrop"
      onClick={handleBackdropClick}
    >
      <div
        className="kindle-avatar-sheet"
        style={{
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? "none" : "transform 0.3s ease-out",
        }}
      >
        {/* Drag handle */}
        <div
          className="kindle-avatar-drag-handle"
          onTouchStart={handleDragStart}
          onMouseDown={handleDragStart}
        >
          <div className="kindle-avatar-drag-bar" />
        </div>

        {/* Header */}
        <header className="kindle-avatar-header">
          <h2 className="kindle-avatar-title">Choose Avatar</h2>
          <p className="kindle-avatar-subtitle sinhala">පැතිකඩ රූපය තෝරන්න</p>
        </header>

        {/* Avatar grid */}
        <div className="kindle-avatar-grid-container">
          <div className="kindle-avatar-grid">
            {predefinedAvatars.map((url) => {
              const isSelected = currentAvatarUrl === url;
              return (
                <button
                  key={url}
                  className={`kindle-avatar-option ${isSelected ? "kindle-avatar-option-selected" : ""}`}
                  onClick={() => onSelectAvatar(url)}
                  aria-label={isSelected ? "Currently selected avatar" : "Select avatar"}
                >
                  <img src={url} alt="" className="kindle-avatar-option-img" />
                  {isSelected && (
                    <span className="kindle-avatar-check">
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}

            {/* Upload option */}
            <button
              className="kindle-avatar-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              aria-label="Upload custom avatar"
            >
              {isUploading ? (
                <svg className="kindle-avatar-upload-spinner" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" strokeOpacity="0.2" />
                  <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </svg>
              ) : (
                <svg className="kindle-avatar-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.802.024-1.644-.035.34-1.332.907-2.55 2.18-3.303 1.236-.73 2.613-.587 3.953-.42.37.047.726.09 1.071.114A12.6 12.6 0 0012 3.5c.606.01 1.058.034 1.467.07.345-.024.7-.067 1.071-.114 1.34-.167 2.717-.31 3.952.42 1.274.754 1.84 1.971 2.18 3.303-.841.059-1.263.089-1.643.035a2.31 2.31 0 01-1.641-1.055" strokeLinecap="round" />
                  <path d="M12 16v-5m0 0l-1.75 1.75M12 11l1.75 1.75" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 16.75c1.088-.261 1.785-.694 2.152-1.312M8 16.75c-1.088-.261-1.785-.694-2.152-1.312" strokeLinecap="round" />
                </svg>
              )}
              <span className="kindle-avatar-upload-label">
                {isUploading ? "Uploading..." : "Upload"}
              </span>
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="kindle-avatar-file-input"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
