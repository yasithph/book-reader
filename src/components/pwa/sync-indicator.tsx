"use client";

import { useEffect, useState } from "react";
import { getSyncManager, type SyncState } from "@/lib/offline";

export function SyncIndicator() {
  const [syncState, setSyncState] = useState<SyncState>({
    status: "idle",
    lastSyncedAt: null,
    pendingCount: 0,
    error: null,
  });

  useEffect(() => {
    const syncManager = getSyncManager();

    // Subscribe to sync state changes
    const unsubscribe = syncManager.subscribe(setSyncState);

    // Start auto-sync
    syncManager.startAutoSync();

    return () => {
      unsubscribe();
    };
  }, []);

  // Don't show if idle with no pending items
  if (syncState.status === "idle" && syncState.pendingCount === 0) {
    return null;
  }

  const getStatusClass = () => {
    switch (syncState.status) {
      case "syncing":
        return "sync-indicator-syncing";
      case "error":
        return "sync-indicator-error";
      case "offline":
        return "sync-indicator-pending";
      default:
        return syncState.pendingCount > 0
          ? "sync-indicator-pending"
          : "sync-indicator-synced";
    }
  };

  const getStatusIcon = () => {
    switch (syncState.status) {
      case "syncing":
        return (
          <svg
            className="sync-indicator-icon sync-indicator-spinning"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm-1.23-8.678a.75.75 0 00-1.5 0v2.43l-.31-.31a7 7 0 00-11.712 3.138.75.75 0 001.449.39 5.5 5.5 0 019.201-2.466l.312.311H9.089a.75.75 0 000 1.5h4.243a.75.75 0 00.75-.75V2.746z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            className="sync-indicator-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "offline":
        return (
          <svg
            className="sync-indicator-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        if (syncState.pendingCount > 0) {
          return (
            <svg
              className="sync-indicator-icon"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
            </svg>
          );
        }
        return (
          <svg
            className="sync-indicator-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const getStatusText = () => {
    switch (syncState.status) {
      case "syncing":
        return "Syncing...";
      case "error":
        return "Sync error";
      case "offline":
        return `${syncState.pendingCount} pending`;
      default:
        if (syncState.pendingCount > 0) {
          return `${syncState.pendingCount} pending`;
        }
        return "Synced";
    }
  };

  return (
    <div className={`sync-indicator ${getStatusClass()}`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
    </div>
  );
}
