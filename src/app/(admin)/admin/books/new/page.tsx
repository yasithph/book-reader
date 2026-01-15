import Link from "next/link";
import { BookForm } from "../book-form";

export default function NewBookPage() {
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
        <h1 className="admin-page-title">Add New Book</h1>
        <p className="admin-page-subtitle">
          Create a new book in your catalog
        </p>
      </div>

      <BookForm />
    </div>
  );
}
