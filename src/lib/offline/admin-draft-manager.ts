import {
  saveAdminDraft,
  getAdminDraft,
  getUnsyncedAdminDrafts,
  markAdminDraftSynced,
  deleteAdminDraft,
  updateAdminDraftChapterId,
  type AdminDraft,
} from "./indexed-db";

export interface DraftData {
  bookId: string;
  chapterNumber: number;
  titleEn: string | null;
  titleSi: string | null;
  content: string;
}

type DraftListener = (status: DraftStatus) => void;

export interface DraftStatus {
  isSaving: boolean;
  lastSavedAt: string | null;
  isOffline: boolean;
  hasPendingChanges: boolean;
  error: string | null;
}

class AdminDraftManager {
  private listeners: Set<DraftListener> = new Set();
  private status: DraftStatus = {
    isSaving: false,
    lastSavedAt: null,
    isOffline: false,
    hasPendingChanges: false,
    error: null,
  };
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
    this.updateStatus({ isOffline: false });
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.updateStatus({ isOffline: true });
  };

  private updateStatus(partial: Partial<DraftStatus>) {
    this.status = { ...this.status, ...partial };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.status));
  }

  subscribe(listener: DraftListener): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  getStatus(): DraftStatus {
    return this.status;
  }

  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Generate a temporary ID for offline-created chapters
   */
  generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if an ID is a temporary (offline-created) ID
   */
  isTempId(id: string): boolean {
    return id.startsWith("temp_");
  }

  /**
   * Save draft locally (called on every auto-save)
   */
  async saveDraft(chapterId: string, data: DraftData): Promise<void> {
    this.updateStatus({ isSaving: true, error: null });

    try {
      const draft: AdminDraft = {
        chapter_id: chapterId,
        book_id: data.bookId,
        chapter_number: data.chapterNumber,
        title_en: data.titleEn,
        title_si: data.titleSi,
        content: data.content,
        updated_at: new Date().toISOString(),
        synced: false,
        pending_create: this.isTempId(chapterId),
      };

      await saveAdminDraft(draft);

      this.updateStatus({
        isSaving: false,
        lastSavedAt: draft.updated_at,
        hasPendingChanges: true,
      });
    } catch (error) {
      console.error("Failed to save draft locally:", error);
      this.updateStatus({
        isSaving: false,
        error: error instanceof Error ? error.message : "Failed to save draft",
      });
      throw error;
    }
  }

  /**
   * Get local draft for a chapter (may be newer than server)
   */
  async getDraft(chapterId: string): Promise<AdminDraft | null> {
    try {
      const draft = await getAdminDraft(chapterId);
      return draft || null;
    } catch (error) {
      console.error("Failed to get local draft:", error);
      return null;
    }
  }

  /**
   * Get all unsynced drafts for sync
   */
  async getUnsyncedDrafts(): Promise<AdminDraft[]> {
    try {
      return await getUnsyncedAdminDrafts();
    } catch (error) {
      console.error("Failed to get unsynced drafts:", error);
      return [];
    }
  }

  /**
   * Mark a draft as synced (after successful API save)
   */
  async markSynced(chapterId: string): Promise<void> {
    try {
      await markAdminDraftSynced(chapterId);
      this.updateStatus({ hasPendingChanges: false });
    } catch (error) {
      console.error("Failed to mark draft as synced:", error);
    }
  }

  /**
   * Update chapter ID after server creates it (for offline-created chapters)
   */
  async updateChapterId(oldId: string, newId: string): Promise<void> {
    try {
      await updateAdminDraftChapterId(oldId, newId);
    } catch (error) {
      console.error("Failed to update chapter ID:", error);
    }
  }

  /**
   * Delete local draft (after successful publish)
   */
  async deleteDraft(chapterId: string): Promise<void> {
    try {
      await deleteAdminDraft(chapterId);
      this.updateStatus({ hasPendingChanges: false });
    } catch (error) {
      console.error("Failed to delete local draft:", error);
    }
  }

  /**
   * Save draft to server (called when online)
   * Returns true if successful, false otherwise
   */
  async syncDraftToServer(draft: AdminDraft): Promise<{ success: boolean; newChapterId?: string }> {
    try {
      if (draft.pending_create) {
        // Create new chapter on server
        const res = await fetch(`/api/admin/books/${draft.book_id}/chapters`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chapter_number: draft.chapter_number,
            title_en: draft.title_en,
            title_si: draft.title_si,
            content_html: draft.content,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create chapter");
        }

        const data = await res.json();
        return { success: true, newChapterId: data.chapter.id };
      } else {
        // Update existing chapter
        const res = await fetch(`/api/admin/chapters/${draft.chapter_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chapter_number: draft.chapter_number,
            title_en: draft.title_en,
            title_si: draft.title_si,
            content: draft.content,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update chapter");
        }

        return { success: true };
      }
    } catch (error) {
      console.error("Failed to sync draft to server:", error);
      return { success: false };
    }
  }

  destroy() {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
    }
    this.listeners.clear();
  }
}

// Singleton instance
let adminDraftManagerInstance: AdminDraftManager | null = null;

export function getAdminDraftManager(): AdminDraftManager {
  if (!adminDraftManagerInstance) {
    adminDraftManagerInstance = new AdminDraftManager();
  }
  return adminDraftManagerInstance;
}

export type { AdminDraft };
