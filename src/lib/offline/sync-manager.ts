import {
  getUnsyncedProgress,
  markProgressSynced,
  getPendingSyncs,
  deletePendingSync,
  incrementSyncAttempts,
  saveProgressOffline,
} from "./indexed-db";

const MAX_SYNC_ATTEMPTS = 5;
const SYNC_INTERVAL = 30000; // 30 seconds

type SyncStatus = "idle" | "syncing" | "error" | "offline";

interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  pendingCount: number;
  error: string | null;
}

type SyncListener = (state: SyncState) => void;

class SyncManager {
  private listeners: Set<SyncListener> = new Set();
  private state: SyncState = {
    status: "idle",
    lastSyncedAt: null,
    pendingCount: 0,
    error: null,
  };
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;

  constructor() {
    if (typeof window !== "undefined") {
      this.isOnline = navigator.onLine;
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
    }
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.updateState({ status: "idle" });
    this.syncAll();
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.updateState({ status: "offline" });
  };

  private updateState(partial: Partial<SyncState>) {
    this.state = { ...this.state, ...partial };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState(): SyncState {
    return this.state;
  }

  startAutoSync() {
    if (this.syncInterval) return;
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.syncAll();
      }
    }, SYNC_INTERVAL);
    // Initial sync
    if (this.isOnline) {
      this.syncAll();
    }
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncAll(): Promise<void> {
    if (!this.isOnline) {
      this.updateState({ status: "offline" });
      return;
    }

    this.updateState({ status: "syncing", error: null });

    try {
      // Sync reading progress
      await this.syncReadingProgress();

      // Process pending syncs
      await this.processPendingSyncs();

      this.updateState({
        status: "idle",
        lastSyncedAt: new Date().toISOString(),
        error: null,
      });
    } catch (error) {
      console.error("Sync error:", error);
      this.updateState({
        status: "error",
        error: error instanceof Error ? error.message : "Sync failed",
      });
    }

    // Update pending count
    const pending = await getPendingSyncs();
    const unsynced = await getUnsyncedProgress();
    this.updateState({
      pendingCount: pending.length + unsynced.length,
    });
  }

  private async syncReadingProgress(): Promise<void> {
    const unsyncedProgress = await getUnsyncedProgress();

    for (const progress of unsyncedProgress) {
      try {
        const response = await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookId: progress.book_id,
            chapterId: progress.chapter_id,
            chapterNumber: progress.current_chapter,
            scrollPosition: progress.scroll_position,
            completedChapters: progress.completed_chapters,
          }),
        });

        if (response.ok) {
          await markProgressSynced(progress.book_id);
        } else if (response.status === 401) {
          // Not authenticated, skip sync
          console.log("Not authenticated, skipping progress sync");
          break;
        }
      } catch (error) {
        console.error("Failed to sync progress for book:", progress.book_id, error);
      }
    }
  }

  private async processPendingSyncs(): Promise<void> {
    const pendingSyncs = await getPendingSyncs();

    for (const sync of pendingSyncs) {
      if (sync.attempts >= MAX_SYNC_ATTEMPTS) {
        // Too many attempts, remove from queue
        await deletePendingSync(sync.id!);
        continue;
      }

      try {
        let success = false;

        if (sync.type === "progress") {
          const response = await fetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sync.payload),
          });
          success = response.ok;
        }

        if (success) {
          await deletePendingSync(sync.id!);
        } else {
          await incrementSyncAttempts(sync.id!);
        }
      } catch (error) {
        console.error("Failed to process pending sync:", sync.id, error);
        await incrementSyncAttempts(sync.id!);
      }
    }
  }

  // Save progress locally and queue for sync
  async saveProgress(progress: {
    bookId: string;
    chapterId: string | null;
    chapterNumber: number;
    scrollPosition: number;
    completedChapters: number[];
  }): Promise<void> {
    const now = new Date().toISOString();

    await saveProgressOffline({
      book_id: progress.bookId,
      chapter_id: progress.chapterId,
      current_chapter: progress.chapterNumber,
      scroll_position: progress.scrollPosition,
      completed_chapters: progress.completedChapters,
      last_read_at: now,
      synced: false,
      client_updated_at: now,
    });

    this.updateState({ pendingCount: this.state.pendingCount + 1 });

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncAll();
    }
  }

  destroy() {
    this.stopAutoSync();
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
    }
    this.listeners.clear();
  }
}

// Singleton instance
let syncManagerInstance: SyncManager | null = null;

export function getSyncManager(): SyncManager {
  if (!syncManagerInstance) {
    syncManagerInstance = new SyncManager();
  }
  return syncManagerInstance;
}

export type { SyncState, SyncStatus };
