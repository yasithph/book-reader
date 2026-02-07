"use client";

import { useState } from "react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

interface IntroPageFormProps {
  bookId: string;
  introDisclaimer: string | null;
  introCopyright: string | null;
  introThankYou: string | null;
  introOffering: string | null;
}

interface SectionConfig {
  key: "disclaimer" | "copyright" | "thankYou" | "offering";
  label: string;
  description: string;
  fallbackNote?: string;
}

const SECTIONS: SectionConfig[] = [
  {
    key: "disclaimer",
    label: "Disclaimer",
    description: "The disclaimer page shown at the start of the book.",
    fallbackNote: "If left empty, the default disclaimer will be shown.",
  },
  {
    key: "copyright",
    label: "Copyright",
    description: "Copyright notice and legal information.",
    fallbackNote: "If left empty, the default copyright page will be shown.",
  },
  {
    key: "thankYou",
    label: "Thank You",
    description: "An acknowledgements or thank you page.",
    fallbackNote: "If left empty, this page will be skipped.",
  },
  {
    key: "offering",
    label: "Offering",
    description: "A dedication or offering page.",
    fallbackNote: "If left empty, this page will be skipped.",
  },
];

export function IntroPageForm({
  bookId,
  introDisclaimer,
  introCopyright,
  introThankYou,
  introOffering,
}: IntroPageFormProps) {
  const [disclaimer, setDisclaimer] = useState(introDisclaimer || "");
  const [copyright, setCopyright] = useState(introCopyright || "");
  const [thankYou, setThankYou] = useState(introThankYou || "");
  const [offering, setOffering] = useState(introOffering || "");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (introDisclaimer) initial.add("disclaimer");
    if (introCopyright) initial.add("copyright");
    if (introThankYou) initial.add("thankYou");
    if (introOffering) initial.add("offering");
    // If nothing is expanded, expand disclaimer by default
    if (initial.size === 0) initial.add("disclaimer");
    return initial;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const getContent = (key: string) => {
    switch (key) {
      case "disclaimer": return disclaimer;
      case "copyright": return copyright;
      case "thankYou": return thankYou;
      case "offering": return offering;
      default: return "";
    }
  };

  const setContent = (key: string, value: string) => {
    switch (key) {
      case "disclaimer": setDisclaimer(value); break;
      case "copyright": setCopyright(value); break;
      case "thankYou": setThankYou(value); break;
      case "offering": setOffering(value); break;
    }
    setSaveStatus("idle");
  };

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveStatus("idle");

    try {
      // Fetch current book data to get required fields
      const bookRes = await fetch(`/api/admin/books/${bookId}`);
      const bookData = await bookRes.json();

      if (!bookRes.ok) {
        throw new Error(bookData.error || "Failed to fetch book data");
      }

      const book = bookData.book;

      // PUT with all required fields + intro fields
      const res = await fetch(`/api/admin/books/${bookId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title_en: book.title_en,
          title_si: book.title_si,
          author_en: book.author_en,
          author_si: book.author_si,
          description_en: book.description_en,
          description_si: book.description_si,
          cover_image_url: book.cover_image_url,
          price_lkr: book.price_lkr,
          is_free: book.is_free,
          free_preview_chapters: book.free_preview_chapters,
          is_published: book.is_published,
          intro_disclaimer: disclaimer || null,
          intro_copyright: copyright || null,
          intro_thank_you: thankYou || null,
          intro_offering: offering || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save intro pages");
      }

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="intro-pages-form">
      <div className="chapters-header">
        <div className="chapters-header-info">
          <h2 className="chapters-title">Intro Pages</h2>
          <p className="chapters-subtitle">
            Customize the introductory pages shown before chapter one
          </p>
        </div>
      </div>

      <div className="intro-sections">
        {SECTIONS.map((section) => (
          <div key={section.key} className="intro-section">
            <button
              type="button"
              className="intro-section-header"
              onClick={() => toggleSection(section.key)}
            >
              <div className="intro-section-header-left">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`intro-section-chevron ${expandedSections.has(section.key) ? "expanded" : ""}`}
                >
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <span className="intro-section-label">{section.label}</span>
                  {getContent(section.key) && (
                    <span className="intro-section-badge">Custom</span>
                  )}
                </div>
              </div>
              <span className="intro-section-desc">{section.description}</span>
            </button>

            {expandedSections.has(section.key) && (
              <div className="intro-section-content">
                {section.fallbackNote && (
                  <p className="intro-section-note">{section.fallbackNote}</p>
                )}
                <RichTextEditor
                  content={getContent(section.key)}
                  onChange={(value) => setContent(section.key, value)}
                  placeholder={`Enter ${section.label.toLowerCase()} content...`}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="intro-save-bar">
        {error && (
          <p className="intro-save-error">{error}</p>
        )}
        {saveStatus === "success" && (
          <p className="intro-save-success">Saved successfully</p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="admin-btn admin-btn-primary"
        >
          {isSaving ? "Saving..." : "Save Intro Pages"}
        </button>
      </div>
    </div>
  );
}
