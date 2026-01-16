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

Generate images using Google's Gemini Image API.

**Environment:** Requires `GEMINI_API_KEY` environment variable.

**Recommended Usage (Direct API call with proper parsing):**
```bash
cd "/Users/yasith/Dev/Book Reader" && mkdir -p public/images/generated && curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=$GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{"text": "Generate an image: YOUR_PROMPT_HERE"}]
    }],
    "generationConfig": {
      "responseModalities": ["TEXT", "IMAGE"]
    }
  }' | python3 -c "
import sys, json, base64
d = json.load(sys.stdin)
for part in d.get('candidates', [{}])[0].get('content', {}).get('parts', []):
    if 'inlineData' in part:
        img_data = part['inlineData']['data']
        with open('public/images/generated/FILENAME.jpg', 'wb') as f:
            f.write(base64.b64decode(img_data))
        print('Image saved!')
        break
"
```

**Note:** The shell script at `.claude/skills/nano-banana/generate.sh` has JSON parsing issues with the API response format. Use the direct curl + python approach above for reliable image generation.

**Output:** Images are saved to `/public/images/generated/` and can be referenced as `/images/generated/filename.jpg`

**When to use:** When the user asks for an image to be generated for book covers, illustrations, UI elements, etc.
