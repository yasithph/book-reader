"use client";

import { useState, useRef, useCallback } from "react";

interface ChapterImageUploadProps {
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ChapterImageUpload({
  imageUrl,
  onImageChange,
  disabled = false,
}: ChapterImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("Image must be under 10MB");
        return;
      }

      setError(null);
      setIsUploading(true);

      try {
        // Step 1: Get a signed upload URL from our API
        const params = new URLSearchParams({
          filename: file.name,
          contentType: file.type,
          type: "chapter",
        });

        const urlRes = await fetch(`/api/admin/upload?${params}`);
        const urlData = await urlRes.json();

        if (!urlRes.ok) {
          throw new Error(urlData.error || "Failed to get upload URL");
        }

        // Step 2: Upload directly to Supabase using the signed URL
        const uploadRes = await fetch(urlData.signedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload image to storage");
        }

        // Step 3: Use the public URL returned from step 1
        onImageChange(urlData.publicUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [onImageChange]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageChange(null);
    setError(null);
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="chapter-image-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: "none" }}
        disabled={disabled}
      />

      {imageUrl ? (
        /* Preview state */
        <div className="chapter-image-preview" onClick={handleClick}>
          <img src={imageUrl} alt="Chapter header" />
          <div className="chapter-image-overlay">
            <button
              type="button"
              className="chapter-image-remove"
              onClick={handleRemove}
              disabled={disabled}
              aria-label="Remove image"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <span className="chapter-image-change-hint">Click to change</span>
          </div>
        </div>
      ) : (
        /* Upload zone */
        <button
          type="button"
          className={`chapter-image-dropzone ${isDragOver ? "drag-over" : ""} ${isUploading ? "uploading" : ""}`}
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          disabled={disabled || isUploading}
        >
          {isUploading ? (
            <div className="chapter-image-loading">
              <div className="chapter-image-spinner" />
              <span>Uploading...</span>
            </div>
          ) : (
            <div className="chapter-image-placeholder">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
              <span>Add chapter image</span>
            </div>
          )}
          {isUploading && <div className="chapter-image-progress-bar" />}
        </button>
      )}

      {error && <p className="chapter-image-error">{error}</p>}
    </div>
  );
}
