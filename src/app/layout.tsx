import type { Metadata, Viewport } from "next";
import { PWAProvider } from "@/components/pwa";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Meera",
    template: "%s | Meera",
  },
  description: "Read Sinhala novels online and offline. A beautiful reading experience for Sri Lankan literature.",
  keywords: ["sinhala novels", "sri lankan books", "online reading", "ebook reader"],
  authors: [{ name: "Meera" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Meera",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e89990" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="si" suppressHydrationWarning style={{ colorScheme: 'light' }}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        {/* Preconnect for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Preload Sinhala font (primary content font) for faster initial render */}
        <link
          rel="preload"
          href="https://fonts.gstatic.com/s/notosanssinhala/v26/yMJ2MJBya43H0SUF_WmcBEEf4rQVO2P524IF5Q.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Load all fonts with swap for better performance */}
        <link
          href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Noto+Sans+Sinhala:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen bg-background text-foreground">
        <PWAProvider>{children}</PWAProvider>
      </body>
    </html>
  );
}
