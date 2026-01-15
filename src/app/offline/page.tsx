"use client";

import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="offline-page">
      <div className="offline-content">
        {/* Decorative book stack */}
        <div className="offline-illustration">
          <svg viewBox="0 0 120 120" fill="none" className="w-32 h-32">
            {/* Cloud with X */}
            <path
              d="M90 55c0-11-9-20-20-20-1 0-2 0-3 .2C64 25 54 18 42 18c-16 0-29 13-29 29 0 1 0 2 .1 3C6 52 1 59 1 67c0 11 9 20 20 20h66c9 0 16-7 16-16 0-7-4-13-10-15 0-.3 0-.7 0-1z"
              fill="currentColor"
              fillOpacity="0.1"
              stroke="currentColor"
              strokeWidth="2"
            />
            {/* X mark */}
            <path
              d="M45 45l30 30M75 45l-30 30"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h1 className="offline-title">You&apos;re Offline</h1>
        <p className="offline-subtitle sinhala">ඔබ නොබැඳි තත්වයේ සිටී</p>

        <p className="offline-message">
          Don&apos;t worry! Any books you&apos;ve downloaded are still available to read.
        </p>

        <div className="offline-actions">
          <Link href="/library" className="offline-btn-primary">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06v-11a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3a8.963 8.963 0 00-4.25 1.065V16.82zM9.25 4.065A8.963 8.963 0 005 3c-.85 0-1.673.118-2.454.339A.75.75 0 002 4.06v11a.75.75 0 00.954.721A7.506 7.506 0 015 15.5c1.579 0 3.042.487 4.25 1.32V4.065z" />
            </svg>
            Go to Library
          </Link>

          <button
            onClick={() => window.location.reload()}
            className="offline-btn-secondary"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm-1.23-8.678a.75.75 0 00-1.5 0v2.43l-.31-.31a7 7 0 00-11.712 3.138.75.75 0 001.449.39 5.5 5.5 0 019.201-2.466l.312.311H9.089a.75.75 0 000 1.5h4.243a.75.75 0 00.75-.75V2.746z"
                clipRule="evenodd"
              />
            </svg>
            Try Again
          </button>
        </div>

        <div className="offline-tip">
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            Tip: Download books for offline reading from your Library
          </span>
        </div>
      </div>
    </div>
  );
}
