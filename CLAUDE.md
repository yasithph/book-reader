# Claude Code Rules

## Working Style

1. **Read before acting** - Always read relevant files before making changes. Never speculate about code you haven't opened. If a specific file is referenced, read it first.

2. **Check in before major changes** - Before any significant modifications, explain the plan and wait for approval.

3. **Explain changes concisely** - After each step, give a high-level summary of what was changed.

4. **Keep it simple** - Every change should be minimal and impact as little code as possible. Avoid complex or sweeping changes. Simplicity is paramount.

5. **No hallucinations** - Only make claims about code after investigating. If uncertain, investigate first. Give grounded, factual answers.

## Project Context

- **Stack**: Next.js 16 (App Router), Supabase, Tailwind CSS 4, TypeScript
- **Purpose**: Sinhala novel reading platform with phone OTP auth, book purchases, offline PWA support
- **Author**: Single author platform for "සමන්ති විජේසිංහ" (Samanthi Wijesinghe)

## Key Directories

- `src/app/(public)` - Public pages (books, auth, reader)
- `src/app/(authenticated)` - Protected pages (library, purchase, settings)
- `src/app/(admin)` - Admin panel
- `src/app/api` - API routes
- `src/components` - Reusable components
- `src/lib` - Utilities (supabase, auth, offline, i18n)
- `src/styles` - Feature-specific CSS files
- `supabase/` - Database schema and seed data

## Architecture Documentation

See `ARCHITECTURE.md` for detailed system documentation.
