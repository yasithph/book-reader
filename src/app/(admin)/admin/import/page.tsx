"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

// Strip HTML tags for preview display
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

interface ExtractedChapter {
  number: number;
  title_si: string;
  title_en: string;
  content: string;
}

interface Book {
  id: string;
  title_en: string;
  title_si: string;
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [chapters, setChapters] = useState<ExtractedChapter[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [newBookTitle, setNewBookTitle] = useState("");
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch books on mount
  useEffect(() => {
    fetch("/api/admin/books")
      .then((res) => res.json())
      .then((data) => setBooks(data.books || []))
      .catch(console.error);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setChapters([]);
      setError(null);
    } else {
      setError("Please select a PDF file");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setChapters([]);
      setError(null);
    } else {
      setError("Please drop a PDF file");
    }
  };

  const handleExtract = async () => {
    if (!file) return;

    setExtracting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Extraction failed");
      }

      const data = await response.json();
      setChapters(data.chapters);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setExtracting(false);
    }
  };

  const updateChapter = (index: number, field: keyof ExtractedChapter, value: string | number) => {
    setChapters((prev) =>
      prev.map((ch, i) => (i === index ? { ...ch, [field]: value } : ch))
    );
  };

  const removeChapter = (index: number) => {
    setChapters((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    if (chapters.length === 0) return;
    if (!selectedBookId && !newBookTitle) {
      setError("Please select an existing book or enter a title for a new book");
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/import/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: selectedBookId || null,
          newBookTitle: newBookTitle || null,
          chapters,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Import failed");
      }

      setImportSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  if (importSuccess) {
    return (
      <div className="admin-animate-in">
        <div className="admin-success-message">
          <div className="admin-success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="admin-success-title">Import Successful!</h2>
          <p className="admin-success-text">
            {chapters.length} chapter{chapters.length !== 1 ? "s" : ""} have been imported successfully.
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <Link href="/admin/books" className="admin-btn admin-btn-primary">
              View Books
            </Link>
            <button
              onClick={() => {
                setFile(null);
                setChapters([]);
                setImportSuccess(false);
                setSelectedBookId("");
                setNewBookTitle("");
              }}
              className="admin-btn admin-btn-secondary"
            >
              Import Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-animate-in">
      <div className="admin-page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <Link
            href="/admin/books"
            className="admin-btn admin-btn-ghost admin-btn-sm"
            style={{ padding: "0.25rem 0.5rem" }}
          >
            ← Back
          </Link>
        </div>
        <h1 className="admin-page-title">Import from PDF</h1>
        <p className="admin-page-subtitle">
          Extract chapters from a PDF file using AI
        </p>
      </div>

      {error && (
        <div className="admin-error-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>{error}</p>
        </div>
      )}

      {/* Step 1: Upload PDF */}
      <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
        <div className="admin-card-header">
          <h2 className="admin-card-title">
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: "var(--auth-burgundy)",
              color: "white",
              fontSize: "0.75rem",
              marginRight: "0.75rem"
            }}>1</span>
            Upload PDF
          </h2>
        </div>
        <div className="admin-card-body">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
            style={{ display: "none" }}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            style={{
              border: "2px dashed var(--border)",
              borderRadius: "12px",
              padding: "3rem 2rem",
              textAlign: "center",
              cursor: "pointer",
              background: file ? "rgba(114, 47, 55, 0.04)" : "#fafafa",
              transition: "all 0.2s",
            }}
          >
            {file ? (
              <div>
                <svg
                  style={{ width: "48px", height: "48px", color: "var(--auth-burgundy)", margin: "0 auto 1rem" }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <p style={{ fontWeight: 500, color: "var(--auth-ink)", marginBottom: "0.25rem" }}>
                  {file.name}
                </p>
                <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <svg
                  style={{ width: "48px", height: "48px", color: "var(--muted-foreground)", margin: "0 auto 1rem" }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p style={{ fontWeight: 500, color: "var(--auth-ink)", marginBottom: "0.25rem" }}>
                  Drop PDF here or click to browse
                </p>
                <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                  Supports text-based PDF files
                </p>
              </div>
            )}
          </div>

          {file && chapters.length === 0 && (
            <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
              <button
                onClick={handleExtract}
                disabled={extracting}
                className="admin-btn admin-btn-primary"
              >
                {extracting ? (
                  <>
                    <span className="admin-btn-spinner" />
                    Extracting with AI...
                  </>
                ) : (
                  <>
                    <svg style={{ width: "18px", height: "18px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 1v6m0 6v10M1 12h6m6 0h10" />
                    </svg>
                    Extract Chapters
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Review Chapters */}
      {chapters.length > 0 && (
        <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
          <div className="admin-card-header">
            <h2 className="admin-card-title">
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "var(--auth-burgundy)",
                color: "white",
                fontSize: "0.75rem",
                marginRight: "0.75rem"
              }}>2</span>
              Review Chapters ({chapters.length})
            </h2>
          </div>
          <div className="admin-card-body">
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {chapters.map((chapter, index) => (
                <div
                  key={index}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    padding: "1.25rem",
                    background: "#fafafa",
                  }}
                >
                  <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                    <div style={{ width: "80px" }}>
                      <label className="admin-label" style={{ fontSize: "0.75rem" }}>Chapter #</label>
                      <input
                        type="number"
                        value={chapter.number}
                        onChange={(e) => updateChapter(index, "number", parseInt(e.target.value) || 0)}
                        className="admin-input"
                        style={{ textAlign: "center" }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="admin-label" style={{ fontSize: "0.75rem" }}>Title (Sinhala)</label>
                      <input
                        type="text"
                        value={chapter.title_si}
                        onChange={(e) => updateChapter(index, "title_si", e.target.value)}
                        className="admin-input sinhala"
                        placeholder="පරිච්ඡේදය"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="admin-label" style={{ fontSize: "0.75rem" }}>Title (English)</label>
                      <input
                        type="text"
                        value={chapter.title_en}
                        onChange={(e) => updateChapter(index, "title_en", e.target.value)}
                        className="admin-input"
                        placeholder="Chapter title"
                      />
                    </div>
                    <button
                      onClick={() => removeChapter(index)}
                      className="admin-btn admin-btn-ghost"
                      style={{ padding: "0.5rem", alignSelf: "flex-end" }}
                      title="Remove chapter"
                    >
                      <svg style={{ width: "18px", height: "18px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                  <div>
                    <label className="admin-label" style={{ fontSize: "0.75rem" }}>
                      Content Preview ({chapter.content.length.toLocaleString()} characters)
                    </label>
                    <div
                      className="sinhala"
                      style={{
                        padding: "0.75rem",
                        background: "white",
                        border: "1px solid var(--border)",
                        borderRadius: "6px",
                        maxHeight: "120px",
                        overflow: "hidden",
                        fontSize: "0.9rem",
                        lineHeight: "1.6",
                        color: "var(--muted-foreground)",
                      }}
                    >
                      {stripHtml(chapter.content).slice(0, 500)}
                      {chapter.content.length > 500 && "..."}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Select Target Book */}
      {chapters.length > 0 && (
        <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
          <div className="admin-card-header">
            <h2 className="admin-card-title">
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "var(--auth-burgundy)",
                color: "white",
                fontSize: "0.75rem",
                marginRight: "0.75rem"
              }}>3</span>
              Select Target Book
            </h2>
          </div>
          <div className="admin-card-body">
            <div className="admin-form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="admin-label">Add to Existing Book</label>
              <select
                value={selectedBookId}
                onChange={(e) => {
                  setSelectedBookId(e.target.value);
                  if (e.target.value) setNewBookTitle("");
                }}
                className="admin-input admin-select"
              >
                <option value="">Select a book...</option>
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title_en} {book.title_si && `(${book.title_si})`}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ textAlign: "center", color: "var(--muted-foreground)", margin: "1rem 0" }}>
              — or —
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Create New Book</label>
              <input
                type="text"
                value={newBookTitle}
                onChange={(e) => {
                  setNewBookTitle(e.target.value);
                  if (e.target.value) setSelectedBookId("");
                }}
                className="admin-input"
                placeholder="Enter new book title"
              />
            </div>

            <div style={{ marginTop: "2rem", textAlign: "center" }}>
              <button
                onClick={handleImport}
                disabled={importing || (!selectedBookId && !newBookTitle)}
                className="admin-btn admin-btn-primary admin-btn-lg"
              >
                {importing ? (
                  <>
                    <span className="admin-btn-spinner" />
                    Importing...
                  </>
                ) : (
                  <>
                    <svg style={{ width: "18px", height: "18px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Import {chapters.length} Chapter{chapters.length !== 1 ? "s" : ""}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
