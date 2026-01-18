import { openDB, DBSchema, IDBPDatabase } from "idb";

// Database schema
interface BookReaderDB extends DBSchema {
  books: {
    key: string;
    value: {
      id: string;
      title_en: string;
      title_si: string;
      author_en: string;
      author_si: string;
      cover_image_url: string | null;
      cover_blob: Blob | null;
      total_chapters: number;
      downloaded_at: string;
      last_synced_at: string;
    };
    indexes: { "by-downloaded": string };
  };
  chapters: {
    key: [string, number]; // composite: [book_id, chapter_number]
    value: {
      id: string;
      book_id: string;
      chapter_number: number;
      title_en: string;
      title_si: string;
      content: string;
      word_count: number;
      reading_time_minutes: number;
      downloaded_at: string;
    };
    indexes: { "by-book": string };
  };
  reading_progress: {
    key: string; // bookId
    value: {
      book_id: string;
      chapter_id: string | null;
      current_chapter: number;
      scroll_position: number;
      completed_chapters: number[];
      last_read_at: string;
      synced: boolean;
      client_updated_at: string;
    };
    indexes: { "by-synced": number };
  };
  pending_syncs: {
    key: number;
    value: {
      id?: number;
      type: "progress" | "purchase";
      payload: Record<string, unknown>;
      created_at: string;
      attempts: number;
    };
  };
  settings: {
    key: string;
    value: {
      key: string;
      value: unknown;
      updated_at: string;
    };
  };
  admin_drafts: {
    key: string; // chapter_id (UUID or temp_xxx)
    value: {
      chapter_id: string;
      book_id: string;
      chapter_number: number;
      title_en: string | null;
      title_si: string | null;
      content: string;
      updated_at: string;
      synced: boolean;
      pending_create: boolean; // true if chapter doesn't exist on server yet
    };
    indexes: {
      "by-book": string;
      "by-synced": number;
      "by-pending-create": number;
    };
  };
}

const DB_NAME = "book-reader-offline";
const DB_VERSION = 2; // v2: Added admin_drafts store

let dbInstance: IDBPDatabase<BookReaderDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<BookReaderDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<BookReaderDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Books store
      if (!db.objectStoreNames.contains("books")) {
        const bookStore = db.createObjectStore("books", { keyPath: "id" });
        bookStore.createIndex("by-downloaded", "downloaded_at");
      }

      // Chapters store
      if (!db.objectStoreNames.contains("chapters")) {
        const chapterStore = db.createObjectStore("chapters", {
          keyPath: ["book_id", "chapter_number"],
        });
        chapterStore.createIndex("by-book", "book_id");
      }

      // Reading progress store
      if (!db.objectStoreNames.contains("reading_progress")) {
        const progressStore = db.createObjectStore("reading_progress", {
          keyPath: "book_id",
        });
        progressStore.createIndex("by-synced", "synced");
      }

      // Pending syncs store
      if (!db.objectStoreNames.contains("pending_syncs")) {
        db.createObjectStore("pending_syncs", {
          keyPath: "id",
          autoIncrement: true,
        });
      }

      // Settings store
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }

      // Admin drafts store (v2)
      if (!db.objectStoreNames.contains("admin_drafts")) {
        const adminDraftsStore = db.createObjectStore("admin_drafts", {
          keyPath: "chapter_id",
        });
        adminDraftsStore.createIndex("by-book", "book_id");
        adminDraftsStore.createIndex("by-synced", "synced");
        adminDraftsStore.createIndex("by-pending-create", "pending_create");
      }
    },
  });

  return dbInstance;
}

// Book operations
export async function saveBookOffline(
  book: BookReaderDB["books"]["value"]
): Promise<void> {
  const db = await getDB();
  await db.put("books", book);
}

export async function getOfflineBook(
  bookId: string
): Promise<BookReaderDB["books"]["value"] | undefined> {
  const db = await getDB();
  return db.get("books", bookId);
}

export async function getAllOfflineBooks(): Promise<
  BookReaderDB["books"]["value"][]
> {
  const db = await getDB();
  return db.getAll("books");
}

export async function deleteOfflineBook(bookId: string): Promise<void> {
  const db = await getDB();
  await db.delete("books", bookId);
  // Also delete all chapters for this book
  const chapters = await db.getAllFromIndex("chapters", "by-book", bookId);
  const tx = db.transaction("chapters", "readwrite");
  for (const ch of chapters) {
    await tx.store.delete([ch.book_id, ch.chapter_number]);
  }
  await tx.done;
}

// Chapter operations
export async function saveChapterOffline(
  chapter: BookReaderDB["chapters"]["value"]
): Promise<void> {
  const db = await getDB();
  await db.put("chapters", chapter);
}

export async function getOfflineChapter(
  bookId: string,
  chapterNumber: number
): Promise<BookReaderDB["chapters"]["value"] | undefined> {
  const db = await getDB();
  return db.get("chapters", [bookId, chapterNumber]);
}

export async function getBookChapters(
  bookId: string
): Promise<BookReaderDB["chapters"]["value"][]> {
  const db = await getDB();
  return db.getAllFromIndex("chapters", "by-book", bookId);
}

export async function getDownloadedChapterNumbers(
  bookId: string
): Promise<number[]> {
  const chapters = await getBookChapters(bookId);
  return chapters.map((ch) => ch.chapter_number).sort((a, b) => a - b);
}

// Progress operations
export async function saveProgressOffline(
  progress: BookReaderDB["reading_progress"]["value"]
): Promise<void> {
  const db = await getDB();
  await db.put("reading_progress", progress);
}

export async function getOfflineProgress(
  bookId: string
): Promise<BookReaderDB["reading_progress"]["value"] | undefined> {
  const db = await getDB();
  return db.get("reading_progress", bookId);
}

export async function getUnsyncedProgress(): Promise<
  BookReaderDB["reading_progress"]["value"][]
> {
  const db = await getDB();
  // Get all progress where synced is false (0)
  return db.getAllFromIndex("reading_progress", "by-synced", 0);
}

export async function markProgressSynced(bookId: string): Promise<void> {
  const db = await getDB();
  const progress = await db.get("reading_progress", bookId);
  if (progress) {
    progress.synced = true;
    await db.put("reading_progress", progress);
  }
}

// Pending sync operations
export async function addPendingSync(
  sync: Omit<BookReaderDB["pending_syncs"]["value"], "id">
): Promise<number> {
  const db = await getDB();
  return db.add("pending_syncs", sync as BookReaderDB["pending_syncs"]["value"]);
}

export async function getPendingSyncs(): Promise<
  BookReaderDB["pending_syncs"]["value"][]
> {
  const db = await getDB();
  return db.getAll("pending_syncs");
}

export async function deletePendingSync(id: number): Promise<void> {
  const db = await getDB();
  await db.delete("pending_syncs", id);
}

export async function incrementSyncAttempts(id: number): Promise<void> {
  const db = await getDB();
  const sync = await db.get("pending_syncs", id);
  if (sync) {
    sync.attempts += 1;
    await db.put("pending_syncs", sync);
  }
}

// Settings operations
export async function saveSetting(
  key: string,
  value: unknown
): Promise<void> {
  const db = await getDB();
  await db.put("settings", {
    key,
    value,
    updated_at: new Date().toISOString(),
  });
}

export async function getSetting<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  const setting = await db.get("settings", key);
  return setting?.value as T | undefined;
}

// Utility functions
export async function isBookDownloaded(bookId: string): Promise<boolean> {
  const book = await getOfflineBook(bookId);
  return !!book;
}

export async function getDownloadProgress(
  bookId: string
): Promise<{ downloaded: number; total: number }> {
  const book = await getOfflineBook(bookId);
  if (!book) return { downloaded: 0, total: 0 };

  const chapters = await getBookChapters(bookId);
  return {
    downloaded: chapters.length,
    total: book.total_chapters,
  };
}

export async function clearAllOfflineData(): Promise<void> {
  const db = await getDB();
  await db.clear("books");
  await db.clear("chapters");
  await db.clear("reading_progress");
  await db.clear("pending_syncs");
  // Keep settings
}

// Storage estimation
export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
  percentage: number;
}> {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
      percentage: estimate.quota
        ? Math.round(((estimate.usage || 0) / estimate.quota) * 100)
        : 0,
    };
  }
  return { usage: 0, quota: 0, percentage: 0 };
}

// Admin draft operations
export type AdminDraft = BookReaderDB["admin_drafts"]["value"];

export async function saveAdminDraft(
  draft: AdminDraft
): Promise<void> {
  const db = await getDB();
  await db.put("admin_drafts", draft);
}

export async function getAdminDraft(
  chapterId: string
): Promise<AdminDraft | undefined> {
  const db = await getDB();
  return db.get("admin_drafts", chapterId);
}

export async function getAdminDraftsByBook(
  bookId: string
): Promise<AdminDraft[]> {
  const db = await getDB();
  return db.getAllFromIndex("admin_drafts", "by-book", bookId);
}

export async function getUnsyncedAdminDrafts(): Promise<AdminDraft[]> {
  const db = await getDB();
  // Get all drafts where synced is false
  const allDrafts = await db.getAll("admin_drafts");
  return allDrafts.filter(d => !d.synced);
}

export async function getPendingCreateDrafts(): Promise<AdminDraft[]> {
  const db = await getDB();
  const allDrafts = await db.getAll("admin_drafts");
  return allDrafts.filter(d => d.pending_create);
}

export async function markAdminDraftSynced(chapterId: string): Promise<void> {
  const db = await getDB();
  const draft = await db.get("admin_drafts", chapterId);
  if (draft) {
    draft.synced = true;
    await db.put("admin_drafts", draft);
  }
}

export async function updateAdminDraftChapterId(
  oldChapterId: string,
  newChapterId: string
): Promise<void> {
  const db = await getDB();
  const draft = await db.get("admin_drafts", oldChapterId);
  if (draft) {
    // Delete old entry
    await db.delete("admin_drafts", oldChapterId);
    // Insert with new chapter ID
    draft.chapter_id = newChapterId;
    draft.pending_create = false;
    await db.put("admin_drafts", draft);
  }
}

export async function deleteAdminDraft(chapterId: string): Promise<void> {
  const db = await getDB();
  await db.delete("admin_drafts", chapterId);
}

export async function clearAllAdminDrafts(): Promise<void> {
  const db = await getDB();
  await db.clear("admin_drafts");
}
