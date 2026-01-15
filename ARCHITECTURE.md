# Architecture Documentation

## Overview

A Sinhala novel reading platform built for a single author. Users authenticate via phone OTP, browse/purchase books, and read offline via PWA.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | Custom phone OTP via TextIt.lk + Supabase Auth |
| Styling | Tailwind CSS 4 + feature CSS files |
| Offline | IndexedDB + Service Worker |

## Database Schema

### Tables
- **users** - User profiles with reader preferences (theme, font size, line spacing)
- **books** - Book metadata (bilingual titles, price, chapter count)
- **chapters** - Chapter content with word count and reading time
- **purchases** - Payment tracking with proof upload and admin approval
- **reading_progress** - Scroll position and chapter progress per user/book
- **otp_codes** - Phone verification codes with expiry

### Key RLS Policies
- Anyone can view published books and all chapter metadata
- Only authenticated users can create purchases
- Only purchasers/free book readers can access chapter content in reader
- Admins have full access to all tables

## Route Structure

```
src/app/
├── (public)/           # No auth required
│   ├── books/          # Catalog and book details
│   ├── auth/           # Phone + OTP login
│   └── read/           # Reader (checks access server-side)
├── (authenticated)/    # Auth required (middleware redirects)
│   ├── library/        # User's purchased books
│   ├── purchase/       # Bank transfer flow
│   ├── settings/       # User preferences
│   └── welcome/        # First login onboarding
├── (admin)/            # Admin role required
│   └── admin/          # Dashboard, books, users, purchases
└── api/                # API routes
    ├── auth/           # OTP send/verify, session, logout
    ├── admin/          # Book/chapter CRUD
    ├── purchases/      # Purchase submission
    └── progress/       # Reading progress sync
```

## Authentication Flow

1. User enters phone number → API sends OTP via TextIt.lk
2. User enters OTP → API verifies and creates Supabase auth user
3. Session stored in HTTP-only cookie
4. Middleware checks session for protected routes

## Purchase Flow

1. User clicks "Purchase" → Redirected to login if not authenticated
2. Shows bank transfer details (account number, amount)
3. User makes transfer and uploads proof screenshot
4. Admin reviews in dashboard and approves/rejects
5. On approval, book appears in user's library

## Offline Strategy

1. **Service Worker** - Caches static assets and API responses
2. **IndexedDB** - Stores downloaded book content for offline reading
3. **Sync Manager** - Queues reading progress updates, syncs when online

## Styling Architecture

CSS is split by feature in `src/styles/`:
- `globals.css` - Tailwind imports, CSS variables, base styles
- `auth.css` - Login/OTP forms
- `books.css` - Catalog, book cards, chapter list
- `reader.css` - Reader themes (light/dark/sepia)
- `pages.css` - Purchase, settings pages
- `admin.css` - Admin panel
- `nav.css` - Navigation header
- `pwa.css` - Install prompts, offline indicators

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth | Phone OTP | Common in Sri Lanka, no email needed |
| Payments | Bank transfer + manual approval | Simple for small scale, no payment gateway fees |
| Styling | CSS variables + feature files | Easy theming, smaller bundles than CSS-in-JS |
| Offline | IndexedDB | Large storage capacity for book content |
| i18n | Server dictionaries | SEO benefit, no client bundle bloat |
