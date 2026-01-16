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

## Custom Commands

### /commit
Commits all changes and pushes to remote without any AI attribution. Creates a clean commit message following conventional commit format.

## Custom Skills

### Nano Banana (Image Generation)

Generate images using Google's Nano Banana (Gemini Image) API.

**Usage:**
```bash
# Using the shell script
./.claude/skills/nano-banana/generate.sh "A cozy reading nook with warm lighting" "reading-nook"

# Using TypeScript
npx ts-node .claude/skills/nano-banana/generate.ts "prompt" "filename"
```

**Output:** Images are saved to `/public/images/generated/` and can be referenced as `/images/generated/filename.png`

**When to use:** When the user asks for an image to be generated for book covers, illustrations, UI elements, etc.
