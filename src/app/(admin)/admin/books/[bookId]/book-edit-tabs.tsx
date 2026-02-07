"use client";

import { useState } from "react";
import Link from "next/link";
import { BookForm } from "../book-form";
import { ChapterList } from "./chapter-list";
import { IntroPageForm } from "./intro-pages-form";

// Database shape (allows null)
interface BookData {
  id?: string;
  title_en: string | null;
  title_si: string | null;
  description_en: string | null;
  description_si: string | null;
  author_en: string | null;
  author_si: string | null;
  cover_image_url: string | null;
  price_lkr: number | null;
  is_free: boolean | null;
  free_preview_chapters: number | null;
  is_published: boolean | null;
  intro_disclaimer: string | null;
  intro_copyright: string | null;
  intro_thank_you: string | null;
  intro_offering: string | null;
}

interface Chapter {
  id: string;
  chapter_number: number;
  title_en: string;
  title_si: string;
  word_count: number;
  estimated_reading_time: number;
}

interface BookEditTabsProps {
  book: BookData;
  chapters: Chapter[];
  bookId: string;
}

export function BookEditTabs({ book, chapters, bookId }: BookEditTabsProps) {
  const [activeTab, setActiveTab] = useState<"details" | "chapters" | "intro">("details");

  const tabIndex = activeTab === "details" ? 0 : activeTab === "chapters" ? 1 : 2;

  return (
    <div className="book-edit-tabs">
      {/* Tab Navigation */}
      <div className="book-tabs-nav">
        <div className="book-tabs-track">
          <button
            onClick={() => setActiveTab("details")}
            className={`book-tab ${activeTab === "details" ? "active" : ""}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="book-tab-icon">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>Book Details</span>
          </button>
          <button
            onClick={() => setActiveTab("chapters")}
            className={`book-tab ${activeTab === "chapters" ? "active" : ""}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="book-tab-icon">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>Chapters</span>
            <span className="book-tab-count">{chapters.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("intro")}
            className={`book-tab ${activeTab === "intro" ? "active" : ""}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="book-tab-icon">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>Intro Pages</span>
          </button>
          <div
            className="book-tab-indicator book-tab-indicator-3"
            style={{
              transform: `translateX(${tabIndex * 100}%)`
            }}
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="book-tabs-content">
        {/* Book Details Tab */}
        <div className={`book-tab-panel ${activeTab === "details" ? "active" : ""}`}>
          <BookForm book={book} isEdit />
        </div>

        {/* Chapters Tab */}
        <div className={`book-tab-panel ${activeTab === "chapters" ? "active" : ""}`}>
          <div className="chapters-panel">
            {/* Chapters Header */}
            <div className="chapters-header">
              <div className="chapters-header-info">
                <h2 className="chapters-title">Chapter Management</h2>
                <p className="chapters-subtitle">
                  {chapters.length === 0
                    ? "No chapters yet"
                    : `${chapters.length} chapter${chapters.length !== 1 ? "s" : ""} · ${chapters.reduce((acc, c) => acc + c.word_count, 0).toLocaleString()} words total`
                  }
                </p>
              </div>
            </div>

            {/* Chapters List */}
            <div className="chapters-list-wrapper">
              {chapters.length === 0 ? (
                <div className="chapters-empty">
                  <div className="chapters-empty-illustration">
                    <svg viewBox="0 0 120 120" fill="none">
                      <rect x="20" y="10" width="80" height="100" rx="4" fill="#f5f3f0" stroke="#e0dcd6" strokeWidth="2"/>
                      <rect x="30" y="25" width="60" height="4" rx="2" fill="#d8d4cc"/>
                      <rect x="30" y="35" width="50" height="4" rx="2" fill="#d8d4cc"/>
                      <rect x="30" y="45" width="55" height="4" rx="2" fill="#d8d4cc"/>
                      <rect x="30" y="60" width="60" height="4" rx="2" fill="#e8e4dc"/>
                      <rect x="30" y="70" width="45" height="4" rx="2" fill="#e8e4dc"/>
                      <rect x="30" y="80" width="50" height="4" rx="2" fill="#e8e4dc"/>
                      <circle cx="95" cy="95" r="20" fill="#722f37" opacity="0.1"/>
                      <path d="M95 85v20M85 95h20" stroke="#722f37" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h3 className="chapters-empty-title">No chapters yet</h3>
                  <p className="chapters-empty-text">
                    Every great story begins with a first chapter. Add one to get started.
                  </p>
                  <Link
                    href={`/admin?bookId=${bookId}&newChapter=true`}
                    className="chapters-empty-btn"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Write First Chapter
                  </Link>
                </div>
              ) : (
                <div className="chapters-grid">
                  {chapters.map((chapter, index) => (
                    <Link
                      key={chapter.id}
                      href={`/admin?bookId=${bookId}&chapterId=${chapter.id}`}
                      className="chapter-card"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="chapter-card-number">
                        <span>{chapter.chapter_number}</span>
                      </div>
                      <div className="chapter-card-content">
                        <h4 className="chapter-card-title">
                          {chapter.title_en || `Chapter ${chapter.chapter_number}`}
                        </h4>
                        {chapter.title_si && (
                          <p className="chapter-card-title-si">{chapter.title_si}</p>
                        )}
                        <div className="chapter-card-meta">
                          <span className="chapter-card-stat">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <path d="M14 2v6h6"/>
                            </svg>
                            {chapter.word_count.toLocaleString()} words
                          </span>
                          <span className="chapter-card-stat">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <path d="M12 6v6l4 2"/>
                            </svg>
                            {chapter.estimated_reading_time} min read
                          </span>
                        </div>
                      </div>
                      <div className="chapter-card-arrow">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18l6-6-6-6"/>
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Intro Pages Tab */}
        <div className={`book-tab-panel ${activeTab === "intro" ? "active" : ""}`}>
          <IntroPageForm
            bookId={bookId}
            introDisclaimer={book.intro_disclaimer}
            introCopyright={book.intro_copyright}
            introThankYou={book.intro_thank_you}
            introOffering={book.intro_offering}
          />
        </div>
      </div>
    </div>
  );
}
