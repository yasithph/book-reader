import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--auth-cream)] dark:bg-[#0f0d0a]">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[var(--auth-burgundy)] dark:bg-[var(--auth-gold)] rounded-full opacity-[0.03] blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[var(--auth-gold)] dark:bg-[var(--auth-burgundy)] rounded-full opacity-[0.04] blur-3xl" />
          {/* Decorative lines */}
          <div className="absolute top-20 left-10 w-px h-32 bg-gradient-to-b from-transparent via-[var(--auth-burgundy)]/20 to-transparent dark:via-[var(--auth-gold)]/20" />
          <div className="absolute bottom-20 right-10 w-px h-32 bg-gradient-to-b from-transparent via-[var(--auth-burgundy)]/20 to-transparent dark:via-[var(--auth-gold)]/20" />
        </div>

        <div className="relative max-w-4xl text-center auth-stagger">
          {/* Book icon */}
          <div className="auth-animate-in opacity-0 mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[var(--auth-burgundy)]/10 dark:bg-[var(--auth-gold)]/10 border border-[var(--auth-burgundy)]/20 dark:border-[var(--auth-gold)]/20">
              <svg
                className="w-10 h-10 text-[var(--auth-burgundy)] dark:text-[var(--auth-gold)]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="auth-animate-in opacity-0 mb-6" style={{ animationDelay: "0.1s" }}>
            <span className="sinhala block font-serif text-5xl sm:text-6xl md:text-7xl font-medium text-[var(--auth-ink)] dark:text-[#F5F0E8] leading-tight">
              සිංහල නවකතා
            </span>
            <span className="block mt-3 font-serif text-xl sm:text-2xl text-[var(--auth-ink)]/50 dark:text-[#F5F0E8]/40">
              Sinhala Novels
            </span>
          </h1>

          {/* Description */}
          <div className="auth-animate-in opacity-0 max-w-2xl mx-auto mb-10" style={{ animationDelay: "0.15s" }}>
            <p className="sinhala text-lg sm:text-xl text-[var(--auth-ink)]/70 dark:text-[#F5F0E8]/60 leading-relaxed mb-3">
              ඔබේ ප්‍රියතම සිංහල නවකතා ඔන්ලයින් සහ ඔෆ්ලයින් කියවන්න
            </p>
            <p className="text-base text-[var(--auth-ink)]/50 dark:text-[#F5F0E8]/40">
              Read your favorite Sinhala novels online and offline. A beautiful reading experience for Sri Lankan literature.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="auth-animate-in opacity-0 flex flex-col sm:flex-row gap-4 justify-center" style={{ animationDelay: "0.2s" }}>
            <Link
              href="/books"
              className="auth-button inline-flex items-center justify-center gap-3 px-8 py-4 text-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06v-11a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3a8.963 8.963 0 00-4.25 1.065V16.82zM9.25 4.065A8.963 8.963 0 005 3c-.85 0-1.673.118-2.454.339A.75.75 0 002 4.06v11a.75.75 0 00.954.721A7.506 7.506 0 015 15.5c1.579 0 3.042.487 4.25 1.32V4.065z" />
              </svg>
              <span className="sinhala">පොත් පරිශීලනය කරන්න</span>
            </Link>
            <Link
              href="/auth"
              className="auth-link inline-flex items-center justify-center gap-2 px-8 py-4 border border-[var(--auth-burgundy)]/20 dark:border-[var(--auth-gold)]/20 rounded-lg text-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
              </svg>
              <span className="sinhala">පිවිසෙන්න</span>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg
            className="w-6 h-6 text-[var(--auth-ink)]/30 dark:text-[#F5F0E8]/20"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative px-4 py-24 border-t border-[var(--auth-burgundy)]/10 dark:border-[var(--auth-gold)]/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[var(--auth-ink)] dark:text-[#F5F0E8] mb-3">
              <span className="sinhala">විශේෂාංග</span>
            </h2>
            <p className="text-[var(--auth-ink)]/50 dark:text-[#F5F0E8]/40">
              Features designed for the best reading experience
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zm6.905 9.97a.75.75 0 00-1.06 0l-3 3a.75.75 0 101.06 1.06l1.72-1.72V18a.75.75 0 001.5 0v-4.19l1.72 1.72a.75.75 0 101.06-1.06l-3-3z" clipRule="evenodd" />
                  <path d="M14.25 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0016.5 7.5h-1.875a.375.375 0 01-.375-.375V5.25z" />
                </svg>
              }
              titleSi="ඔෆ්ලයින් කියවීම"
              titleEn="Offline Reading"
              descSi="අන්තර්ජාලය නොමැතිව පොත් කියවන්න"
              descEn="Download books and read without internet"
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                </svg>
              }
              titleSi="අභිරුචි තේමා"
              titleEn="Custom Themes"
              descSi="ආලෝකය, අඳුරු, සහ සේපියා තේමා"
              descEn="Light, dark, and sepia reading modes"
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
                </svg>
              }
              titleSi="ප්‍රගතිය සුරකින්න"
              titleEn="Save Progress"
              descSi="ඔබ නතර කළ තැනින් දිගටම කියවන්න"
              descEn="Continue reading where you left off"
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10.5 18.75a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" />
                  <path fillRule="evenodd" d="M8.625.75A3.375 3.375 0 005.25 4.125v15.75a3.375 3.375 0 003.375 3.375h6.75a3.375 3.375 0 003.375-3.375V4.125A3.375 3.375 0 0015.375.75h-6.75zM7.5 4.125C7.5 3.504 8.004 3 8.625 3h6.75c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-6.75a1.125 1.125 0 01-1.125-1.125V4.125z" clipRule="evenodd" />
                </svg>
              }
              titleSi="PWA සහාය"
              titleEn="Install as App"
              descSi="ඔබේ මුල් පිටුවට යෙදුම එක් කරන්න"
              descEn="Add to home screen for quick access"
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M2.25 5.25a3 3 0 013-3h13.5a3 3 0 013 3V15a3 3 0 01-3 3h-3v.257c0 .597.237 1.17.659 1.591l.621.622a.75.75 0 01-.53 1.28h-9a.75.75 0 01-.53-1.28l.621-.622a2.25 2.25 0 00.659-1.59V18h-3a3 3 0 01-3-3V5.25zm1.5 0v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5z" clipRule="evenodd" />
                </svg>
              }
              titleSi="සියලු උපාංගවල"
              titleEn="All Devices"
              descSi="දුරකථන, ටැබ්ලට්, සහ පරිගණක"
              descEn="Read on phone, tablet, or desktop"
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM8.547 4.505a8.25 8.25 0 1011.672 11.672 1 1 0 01-.347.172 1 1 0 00-.206.034c-.472.095-.787.088-1.166-.034-.296-.096-.56-.27-.836-.486-.276-.216-.56-.486-.863-.812a8.233 8.233 0 01-.696-.796.75.75 0 111.18-.92c.177.228.362.442.546.636.27.285.516.514.74.687.224.173.416.3.58.38.165.078.307.108.429.108.123 0 .25-.025.364-.07a8.24 8.24 0 01-9.397-10.577z" clipRule="evenodd" />
                </svg>
              }
              titleSi="ද්විභාෂා"
              titleEn="Bilingual"
              descSi="සිංහල සහ ඉංග්‍රීසි අතුරුමුහුණත"
              descEn="Sinhala and English interface"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 bg-gradient-to-b from-transparent via-[var(--auth-burgundy)]/5 to-transparent dark:via-[var(--auth-gold)]/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[var(--auth-ink)] dark:text-[#F5F0E8] mb-4">
            <span className="sinhala">දැන්ම කියවීම ආරම්භ කරන්න</span>
          </h2>
          <p className="text-[var(--auth-ink)]/60 dark:text-[#F5F0E8]/50 mb-8">
            Start reading your favorite Sinhala novels today
          </p>
          <Link
            href="/books"
            className="auth-button inline-flex items-center justify-center gap-2 px-8 py-4 text-lg"
          >
            <span>Browse Collection</span>
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--auth-burgundy)]/10 dark:border-[var(--auth-gold)]/10 px-4 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--auth-ink)]/40 dark:text-[#F5F0E8]/30">
          <p className="font-serif">© 2025 Book Reader. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/auth" className="hover:text-[var(--auth-burgundy)] dark:hover:text-[var(--auth-gold)] transition-colors">
              Sign In
            </Link>
            <Link href="/books" className="hover:text-[var(--auth-burgundy)] dark:hover:text-[var(--auth-gold)] transition-colors">
              Books
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  titleSi,
  titleEn,
  descSi,
  descEn,
}: {
  icon: React.ReactNode;
  titleSi: string;
  titleEn: string;
  descSi: string;
  descEn: string;
}) {
  return (
    <div className="group p-6 rounded-xl bg-white/60 dark:bg-white/5 border border-[var(--auth-burgundy)]/8 dark:border-[var(--auth-gold)]/8 hover:border-[var(--auth-burgundy)]/20 dark:hover:border-[var(--auth-gold)]/20 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--auth-burgundy)]/5 dark:hover:shadow-black/20">
      <div className="w-12 h-12 rounded-xl bg-[var(--auth-burgundy)]/10 dark:bg-[var(--auth-gold)]/10 flex items-center justify-center mb-4 text-[var(--auth-burgundy)] dark:text-[var(--auth-gold)] group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="font-serif text-lg font-medium text-[var(--auth-ink)] dark:text-[#F5F0E8] mb-1">
        <span className="sinhala">{titleSi}</span>
      </h3>
      <p className="text-sm text-[var(--auth-ink)]/50 dark:text-[#F5F0E8]/40 mb-2">
        {titleEn}
      </p>
      <p className="sinhala text-sm text-[var(--auth-ink)]/60 dark:text-[#F5F0E8]/50">
        {descSi}
      </p>
    </div>
  );
}
