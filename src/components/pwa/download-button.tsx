"use client";

import { useDownloadManager } from "@/hooks/use-download-manager";

interface Book {
  id: string;
  title_en: string;
  title_si: string;
  author_en: string;
  author_si: string;
  cover_image_url: string | null;
  total_chapters: number;
}

interface DownloadButtonProps {
  book: Book;
  className?: string;
  variant?: "default" | "compact";
}

export function DownloadButton({
  book,
  className = "",
  variant = "default",
}: DownloadButtonProps) {
  const {
    downloadState,
    isDownloaded,
    downloadProgress,
    downloadBook,
    deleteDownload,
    cancelDownload,
  } = useDownloadManager(book.id);

  const handleClick = async () => {
    if (downloadState.isDownloading) {
      cancelDownload();
    } else if (isDownloaded) {
      if (window.confirm("Remove this book from offline storage?")) {
        await deleteDownload();
      }
    } else {
      await downloadBook(book);
    }
  };

  if (variant === "compact") {
    if (isDownloaded) {
      return (
        <div className="download-indicator">
          <svg
            className="download-indicator-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
              clipRule="evenodd"
            />
          </svg>
          <span>Offline</span>
        </div>
      );
    }
    return null;
  }

  // Default variant
  if (downloadState.isDownloading) {
    return (
      <button
        onClick={handleClick}
        className={`download-btn download-btn-downloading ${className}`}
      >
        <div
          className="download-btn-progress"
          style={{ width: `${downloadState.progress}%` }}
        />
        <svg
          className="download-btn-icon relative z-10"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
        <span className="relative z-10">
          {downloadState.progress}% - Tap to cancel
        </span>
      </button>
    );
  }

  if (isDownloaded) {
    return (
      <button onClick={handleClick} className={`download-btn ${className}`}>
        <svg
          className="download-btn-icon"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
            clipRule="evenodd"
          />
        </svg>
        <span>
          Downloaded ({downloadProgress.downloaded}/{downloadProgress.total})
        </span>
      </button>
    );
  }

  return (
    <button onClick={handleClick} className={`download-btn ${className}`}>
      <svg
        className="download-btn-icon"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
      </svg>
      <span>Download for Offline</span>
    </button>
  );
}
