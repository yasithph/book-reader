import { BottomNav } from "@/components/layout/bottom-nav";

export default function LibraryLoading() {
  return (
    <>
      <main className="kindle-library">
        {/* Header Skeleton */}
        <header className="kindle-library-header">
          <div className="kindle-library-header-inner">
            <div className="kindle-skeleton-text" style={{ width: 100, height: 28, marginBottom: 8 }} />
            <div className="kindle-skeleton-text" style={{ width: 120, height: 18 }} />
          </div>
        </header>

        {/* Continue Reading Skeleton */}
        <section className="kindle-continue-section">
          <div className="kindle-continue-inner">
            <div className="kindle-skeleton-text" style={{ width: 120, height: 12, marginBottom: 12 }} />
            <div className="kindle-continue-card kindle-skeleton-continue">
              <div className="kindle-continue-cover">
                <div className="kindle-skeleton-cover-library" />
              </div>
              <div className="kindle-continue-info">
                <div className="kindle-skeleton-text" style={{ width: '70%', height: 20, marginBottom: 8 }} />
                <div className="kindle-skeleton-text" style={{ width: '50%', height: 14, marginBottom: 16 }} />
                <div className="kindle-skeleton-text" style={{ width: '100%', height: 4, marginBottom: 8, borderRadius: 2 }} />
                <div className="kindle-skeleton-text" style={{ width: '40%', height: 12 }} />
              </div>
            </div>
          </div>
        </section>

        {/* Book Grid Skeleton */}
        <section className="kindle-books-section">
          <div className="kindle-books-inner">
            <div className="kindle-skeleton-text" style={{ width: 80, height: 12, marginBottom: 16 }} />
            <div className="kindle-book-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="kindle-book-card kindle-skeleton-card">
                  <div className="kindle-book-cover">
                    <div className="kindle-skeleton-book-cover" />
                  </div>
                  <div className="kindle-book-info">
                    <div className="kindle-skeleton-book-title" />
                    <div className="kindle-skeleton-book-author" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <BottomNav isLoggedIn={true} />
    </>
  );
}
