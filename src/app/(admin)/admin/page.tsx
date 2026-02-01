"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { getAdminDraftManager } from "@/lib/offline/admin-draft-manager";
import { getSyncManager } from "@/lib/offline/sync-manager";

// Dynamic import for rich text editor (avoid SSR issues)
const RichTextEditor = dynamic(
  () => import("@/components/admin/RichTextEditor").then((mod) => mod.RichTextEditor),
  { ssr: false, loading: () => <div className="write-loading-editor"><div className="write-loading-spinner" /></div> }
);

// Dynamic import for chapter image upload
const ChapterImageUpload = dynamic(
  () => import("@/components/admin/ChapterImageUpload").then((mod) => mod.ChapterImageUpload),
  { ssr: false }
);

interface Book {
  id: string;
  title_en: string;
  title_si: string;
  cover_image_url: string | null;
  total_chapters: number;
}

interface Chapter {
  id: string;
  chapter_number: number;
  title_en: string;
  title_si: string;
  content?: string;
  editable_content?: string;
  draft_content?: string | null;
  is_published?: boolean;
  has_draft?: boolean;
  word_count?: number;
}

type Step = "book" | "chapter" | "editor";
type SaveStatus = "idle" | "saving" | "saved" | "saved-offline" | "error";

export default function AdminWritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if editing existing chapter or adding new from URL params
  const editBookId = searchParams.get("bookId");
  const editChapterId = searchParams.get("chapterId");
  const newChapterParam = searchParams.get("newChapter");

  // Flow state
  const [step, setStep] = useState<Step>("book");
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [isNewChapter, setIsNewChapter] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [cameFromBooksPage, setCameFromBooksPage] = useState(false);

  // Editor state
  const [titleEn, setTitleEn] = useState("");
  const [titleSi, setTitleSi] = useState("");
  const [content, setContent] = useState("");
  const [chapterNumber, setChapterNumber] = useState(1);
  const [chapterImageUrl, setChapterImageUrl] = useState<string | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isLoadingChapter, setIsLoadingChapter] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-save and draft state
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isOnline, setIsOnline] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState("");
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const draftManagerRef = useRef(getAdminDraftManager());

  // Track online/offline status
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-save function
  const performAutoSave = useCallback(async () => {
    if (!selectedChapter || !selectedBook) return;
    if (content === lastSavedContent && !hasUnsavedChanges) return;

    setSaveStatus("saving");

    try {
      if (isOnline && !draftManagerRef.current.isTempId(selectedChapter.id)) {
        // Save to server
        const res = await fetch(`/api/admin/chapters/${selectedChapter.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chapter_number: chapterNumber,
            title_en: titleEn,
            title_si: titleSi || null,
            content: content,
            chapter_image_url: chapterImageUrl,
          }),
        });

        if (res.ok) {
          setSaveStatus("saved");
          setLastSavedContent(content);
          setHasUnsavedChanges(false);
          // Also save locally for offline access
          await draftManagerRef.current.saveDraft(selectedChapter.id, {
            bookId: selectedBook.id,
            chapterNumber,
            titleEn,
            titleSi,
            content,
          });
          await draftManagerRef.current.markSynced(selectedChapter.id);
        } else {
          throw new Error("Failed to save");
        }
      } else {
        // Save offline
        await draftManagerRef.current.saveDraft(selectedChapter.id, {
          bookId: selectedBook.id,
          chapterNumber,
          titleEn,
          titleSi,
          content,
        });
        setSaveStatus("saved-offline");
        setLastSavedContent(content);
        setHasUnsavedChanges(false);
      }

      // Clear status after 2 seconds
      setTimeout(() => {
        setSaveStatus((prev) => (prev === "saving" ? prev : "idle"));
      }, 2000);
    } catch (err) {
      console.error("Auto-save failed:", err);
      // Try saving offline as fallback
      try {
        await draftManagerRef.current.saveDraft(selectedChapter.id, {
          bookId: selectedBook.id,
          chapterNumber,
          titleEn,
          titleSi,
          content,
        });
        setSaveStatus("saved-offline");
      } catch {
        setSaveStatus("error");
      }
    }
  }, [selectedChapter, selectedBook, content, lastSavedContent, hasUnsavedChanges, isOnline, chapterNumber, titleEn, titleSi, chapterImageUrl]);

  // Debounced auto-save on content change
  useEffect(() => {
    if (step !== "editor" || !selectedChapter) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Mark as having unsaved changes
    if (content !== lastSavedContent) {
      setHasUnsavedChanges(true);
    }

    // Set new timeout for auto-save (2 seconds after last change)
    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [content, step, selectedChapter, performAutoSave, lastSavedContent]);

  // Fetch books on mount
  useEffect(() => {
    async function fetchBooks() {
      try {
        const res = await fetch("/api/admin/books");
        if (!res.ok) throw new Error("Failed to fetch books");
        const data = await res.json();
        setBooks(data.books || []);
      } catch (err) {
        console.error("Error fetching books:", err);
        setError("Failed to load books");
      } finally {
        setIsLoading(false);
      }
    }
    fetchBooks();
  }, []);

  // Handle URL params (edit mode or new chapter from books page)
  useEffect(() => {
    if (editBookId && books.length > 0) {
      const book = books.find(b => b.id === editBookId);
      if (book) {
        setSelectedBook(book);
        setCameFromBooksPage(true);

        if (editChapterId) {
          // Edit existing chapter
          setIsEditMode(true);
          setIsNewChapter(false);
          loadChapterForEdit(editChapterId);
        } else if (newChapterParam === "true") {
          // New chapter from books page - create chapter and go to editor
          createNewChapter(book);
        }
      }
    }
  }, [editBookId, editChapterId, newChapterParam, books]);

  async function loadChapterForEdit(chapterId: string) {
    setIsLoadingChapter(true);
    try {
      const res = await fetch(`/api/admin/chapters/${chapterId}`);
      if (!res.ok) throw new Error("Failed to fetch chapter");
      const data = await res.json();
      const chapter = data.chapter;

      // Check for local draft that might be newer
      const localDraft = await draftManagerRef.current.getDraft(chapterId);
      const serverContent = chapter.editable_content || chapter.draft_content || chapter.content || "";

      // Use local draft if it exists and is newer
      let contentToUse = serverContent;
      if (localDraft && new Date(localDraft.updated_at) > new Date(chapter.updated_at)) {
        contentToUse = localDraft.content;
        setSaveStatus("saved-offline"); // Indicate there are offline changes
      }

      setSelectedChapter(chapter);
      setTitleEn(chapter.title_en || "");
      setTitleSi(chapter.title_si || "");
      setContent(contentToUse);
      setLastSavedContent(contentToUse);
      setChapterNumber(chapter.chapter_number);
      setChapterImageUrl(chapter.chapter_image_url || null);
      setHasUnsavedChanges(false);
      setStep("editor");
    } catch (err) {
      console.error("Error loading chapter:", err);
      setError("Failed to load chapter");
    } finally {
      setIsLoadingChapter(false);
    }
  }

  // Fetch chapters when book is selected
  useEffect(() => {
    if (selectedBook && !isEditMode) {
      fetchChapters(selectedBook.id);
    }
  }, [selectedBook, isEditMode]);

  async function fetchChapters(bookId: string) {
    setIsLoadingChapters(true);
    try {
      const res = await fetch(`/api/admin/books/${bookId}/chapters`);
      if (!res.ok) throw new Error("Failed to fetch chapters");
      const data = await res.json();
      setChapters(data.chapters || []);
    } catch (err) {
      console.error("Error fetching chapters:", err);
      setChapters([]);
    } finally {
      setIsLoadingChapters(false);
    }
  }

  // Handlers
  function handleSelectBook(book: Book) {
    setSelectedBook(book);
    setStep("chapter");
  }

  function handleSelectChapter(chapter: Chapter) {
    // Navigate to write page with edit params
    router.push(`/admin?bookId=${selectedBook!.id}&chapterId=${chapter.id}`);
  }

  const [isCreatingChapter, setIsCreatingChapter] = useState(false);

  async function createNewChapter(book: Book) {
    setIsCreatingChapter(true);
    setError(null);

    try {
      const newChapterNumber = (book.total_chapters || 0) + 1;

      // Create chapter in database immediately with empty content
      const res = await fetch(`/api/admin/books/${book.id}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapter_number: newChapterNumber,
          title_en: null,
          title_si: null,
          content_html: "<p></p>",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create chapter");
      }

      const data = await res.json();
      const newChapter = data.chapter;

      // Set up editor state for the new chapter
      setSelectedBook({ ...book, total_chapters: newChapterNumber });
      setSelectedChapter(newChapter);
      setIsEditMode(true);
      setIsNewChapter(false);
      setTitleEn("");
      setTitleSi("");
      setContent("");
      setChapterNumber(newChapterNumber);

      // Go directly to editor
      setStep("editor");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create chapter");
    } finally {
      setIsCreatingChapter(false);
    }
  }

  function handleNewChapter() {
    if (!selectedBook) return;
    createNewChapter(selectedBook);
  }

  async function handlePublish() {
    if (!selectedBook || !selectedChapter) return;
    if (!content.trim() || content === "<p></p>") {
      setError("Please write some content before publishing");
      return;
    }

    // Cannot publish while offline or with temp ID
    if (!isOnline) {
      setError("Cannot publish while offline. Your changes are saved locally and will sync when you're back online.");
      return;
    }

    if (draftManagerRef.current.isTempId(selectedChapter.id)) {
      setError("Please wait for this chapter to sync before publishing.");
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      // First, ensure the latest draft is saved
      if (hasUnsavedChanges) {
        const saveRes = await fetch(`/api/admin/chapters/${selectedChapter.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chapter_number: chapterNumber,
            title_en: titleEn,
            title_si: titleSi || null,
            content: content,
            chapter_image_url: chapterImageUrl,
          }),
        });

        if (!saveRes.ok) {
          const data = await saveRes.json();
          throw new Error(data.error || "Failed to save draft before publishing");
        }
      }

      // Now publish
      const res = await fetch(`/api/admin/chapters/${selectedChapter.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to publish chapter");
      }

      // Clear local draft after successful publish
      await draftManagerRef.current.deleteDraft(selectedChapter.id);

      // Go back to chapter list
      setIsEditMode(false);
      setSelectedChapter(null);
      setTitleEn("");
      setTitleSi("");
      setContent("");
      setChapterImageUrl(null);
      setLastSavedContent("");
      setHasUnsavedChanges(false);
      setSaveStatus("idle");
      setStep("chapter");
      router.replace("/admin", { scroll: false });
      fetchChapters(selectedBook.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setIsPublishing(false);
    }
  }

  function handleClearContent() {
    if (confirm("Clear all content? This cannot be undone.")) {
      setTitleEn("");
      setTitleSi("");
      setContent("");
    }
  }

  function handleBack() {
    // Clear auto-save timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    switch (step) {
      case "chapter":
        setSelectedBook(null);
        setChapters([]);
        setCameFromBooksPage(false);
        setStep("book");
        // Clear URL params
        router.replace("/admin", { scroll: false });
        break;
      case "editor":
        // Clear edit mode and show chapter list in Write page
        setIsEditMode(false);
        setSelectedChapter(null);
        setTitleEn("");
        setTitleSi("");
        setContent("");
        setChapterImageUrl(null);
        setLastSavedContent("");
        setHasUnsavedChanges(false);
        setSaveStatus("idle");
        setStep("chapter");
        // Clear URL params but stay on Write page
        router.replace("/admin", { scroll: false });
        // Fetch chapters for the selected book
        if (selectedBook) {
          fetchChapters(selectedBook.id);
        }
        break;
    }
  }

  // Word count for editor
  const plainText = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = plainText ? plainText.split(/\s+/).filter((w) => w.length > 0).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Loading state
  if (isLoading || isLoadingChapter) {
    return (
      <div className="write-flow">
        <div className="write-flow-loading">
          <div className="write-loading-spinner" />
          <span>{isLoadingChapter ? "Loading chapter..." : "Loading..."}</span>
        </div>
      </div>
    );
  }

  // No books state
  if (books.length === 0) {
    return (
      <div className="write-flow">
        <div className="write-empty">
          <div className="write-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h2 className="write-empty-title">No books yet</h2>
          <p className="write-empty-text">Create a book first to start writing chapters</p>
          <a href="/admin/books/new" className="write-empty-btn">
            Add New Book
          </a>
        </div>
      </div>
    );
  }

  // Step 1: Book Selection
  if (step === "book" && !isEditMode) {
    return (
      <div className="write-flow">
        <div className="write-step-header">
          <div>
            <h1 className="write-step-title">Select a Book</h1>
            <p className="write-step-subtitle">Choose which book to write for</p>
          </div>
        </div>

        <div className="write-book-grid">
          {books.map((book, index) => (
            <button
              key={book.id}
              className="write-book-card"
              onClick={() => handleSelectBook(book)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="write-book-cover">
                {book.cover_image_url ? (
                  <img src={book.cover_image_url} alt={book.title_en} />
                ) : (
                  <div className="write-book-cover-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="write-book-info">
                <h3 className="write-book-title">{book.title_en}</h3>
                <p className="write-book-chapters">{book.total_chapters || 0} chapters</p>
              </div>
              <div className="write-book-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step 2: Chapter Selection
  if (step === "chapter" && !isEditMode) {
    return (
      <div className="write-flow">
        <button className="write-back-btn" onClick={handleBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </button>

        <div className="write-step-header">
          <div>
            <h1 className="write-step-title">{selectedBook?.title_en}</h1>
            <p className="write-step-subtitle">Select a chapter to edit or create new</p>
          </div>
        </div>

        {/* New Chapter Button */}
        <button
          className="write-new-chapter-btn"
          onClick={handleNewChapter}
          disabled={isCreatingChapter}
        >
          <div className="write-new-chapter-icon">
            {isCreatingChapter ? (
              <div className="write-loading-spinner" style={{ width: 20, height: 20 }} />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            )}
          </div>
          <div className="write-new-chapter-text">
            <span className="write-new-chapter-title">
              {isCreatingChapter ? "Creating..." : "New Chapter"}
            </span>
            <span className="write-new-chapter-subtitle">
              Chapter {(selectedBook?.total_chapters || 0) + 1}
            </span>
          </div>
        </button>

        {/* Error message */}
        {error && (
          <div className="write-error-inline" style={{ marginTop: "1rem" }}>
            {error}
          </div>
        )}

        {/* Existing Chapters */}
        {isLoadingChapters ? (
          <div className="write-chapters-loading">
            <div className="write-loading-spinner" />
          </div>
        ) : chapters.length > 0 ? (
          <div className="write-chapters-list">
            <div className="write-chapters-divider">
              <span>Or edit existing</span>
            </div>
            {chapters.map((chapter, index) => {
              // Determine chapter status:
              // - "draft": not published yet (is_published = false)
              // - "has-changes": published but has draft changes (has_draft = true)
              // - "published": published with no pending changes
              const isUnpublished = !chapter.is_published;
              const hasDraftChanges = chapter.has_draft;
              const isDraft = isUnpublished || hasDraftChanges;

              return (
                <button
                  key={chapter.id}
                  className={`write-chapter-item ${isDraft ? "is-draft" : "is-published"}`}
                  onClick={() => handleSelectChapter(chapter)}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="write-chapter-number">
                    <span>{chapter.chapter_number}</span>
                  </div>
                  <div className="write-chapter-info">
                    <span className="write-chapter-title">
                      {chapter.title_en || `Chapter ${chapter.chapter_number}`}
                      {isUnpublished && (
                        <span className="write-chapter-draft-badge">Draft</span>
                      )}
                      {!isUnpublished && hasDraftChanges && (
                        <span className="write-chapter-draft-badge has-changes">Changes</span>
                      )}
                      {!isDraft && (
                        <span className="write-chapter-published-badge">Published</span>
                      )}
                    </span>
                    {chapter.title_si && (
                      <span className="write-chapter-title-si">{chapter.title_si}</span>
                    )}
                </div>
                  <div className="write-chapter-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

  // Determine if chapter can be published
  const canPublish = isOnline &&
    content.trim() &&
    content !== "<p></p>" &&
    selectedChapter &&
    !draftManagerRef.current.isTempId(selectedChapter.id);

  // Determine if chapter needs publishing (has draft or not published yet)
  const needsPublish = selectedChapter && (
    !selectedChapter.is_published ||
    selectedChapter.has_draft ||
    hasUnsavedChanges
  );

  // Get save status text
  const getSaveStatusText = () => {
    if (!isOnline) return "Offline";
    switch (saveStatus) {
      case "saving": return "Saving...";
      case "saved": return "Draft saved";
      case "saved-offline": return "Saved offline";
      case "error": return "Save failed";
      default: return hasUnsavedChanges ? "Unsaved" : "";
    }
  };

  // Step 3: Editor (both new and edit modes)
  return (
    <div className="write-editor-screen">
      {/* Error Toast */}
      {error && (
        <div className="write-error-toast">
          {error}
          <button type="button" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Minimal Header */}
      <div className="write-editor-header">
        <button className="write-editor-back" onClick={handleBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        <div className="write-editor-meta">
          <span className="write-editor-book">{selectedBook?.title_en}</span>
          <span className="write-editor-divider">·</span>
          <span className="write-editor-chapter">Ch. {chapterNumber}</span>
          {wordCount > 0 && (
            <>
              <span className="write-editor-divider hide-mobile">·</span>
              <span className="write-editor-words hide-mobile">{wordCount.toLocaleString()} words</span>
            </>
          )}
          {wordCount > 0 && (
            <>
              <span className="write-editor-divider hide-mobile">·</span>
              <span className="write-editor-words hide-mobile">{readingTime} min</span>
            </>
          )}
          {/* Save status indicator */}
          {getSaveStatusText() && (
            <>
              <span className="write-editor-divider">·</span>
              <span className={`write-editor-status ${saveStatus === "error" ? "status-error" : saveStatus === "saved-offline" || !isOnline ? "status-offline" : ""}`}>
                {!isOnline && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14, marginRight: 4 }}>
                    <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
                  </svg>
                )}
                {getSaveStatusText()}
              </span>
            </>
          )}
        </div>

        <div className="write-editor-actions">
          {(titleEn || titleSi || content) && (
            <button
              type="button"
              onClick={handleClearContent}
              className="write-editor-btn-ghost"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing || !canPublish}
            className={`write-editor-btn-publish ${needsPublish ? "needs-publish" : ""}`}
            title={!isOnline ? "Cannot publish while offline" : !canPublish ? "Write some content to publish" : "Publish chapter to make it visible to readers"}
          >
            {isPublishing ? "Publishing..." : needsPublish ? "Publish" : "Published"}
          </button>
        </div>
      </div>

      {/* Chapter Header Image */}
      <div style={{ padding: "0 1.5rem" }}>
        <ChapterImageUpload
          imageUrl={chapterImageUrl}
          onImageChange={(url) => {
            setChapterImageUrl(url);
            setHasUnsavedChanges(true);
          }}
          disabled={isPublishing}
        />
      </div>

      {/* Editor */}
      <div className="write-editor-content">
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder="Start writing..."
        />
      </div>
    </div>
  );
}
