# Nano Banana Image Generation Skill

Generate images using Google's Nano Banana (Gemini Image) API and save them to the project's public/images folder.

## Usage

When the user asks for an image to be generated, use this skill to:
1. Generate the image using the Nano Banana API
2. Save it to `/public/images/` with a descriptive filename
3. Return the path so it can be used in the project

## How to Generate Images

Run the generation script:

```bash
npx ts-node .claude/skills/nano-banana/generate.ts "your image prompt here" "output-filename"
```

Example:
```bash
npx ts-node .claude/skills/nano-banana/generate.ts "A cozy reading nook with warm lighting and bookshelves" "reading-nook"
```

This will save the image to `/public/images/reading-nook.png`

## Environment Setup

Requires `GEMINI_API_KEY` environment variable to be set.

Get your API key from: https://aistudio.google.com/apikey

## Models Available

- **gemini-2.5-flash-image** (default): Fast, efficient, good for most use cases
- **gemini-3-pro-image-preview**: Higher quality, better text rendering, supports 2K/4K

## Tips for Good Prompts

- Be specific about style, lighting, and composition
- Mention the intended use (e.g., "website hero image", "book cover")
- Include mood descriptors (cozy, dramatic, minimal, etc.)
- For this Sinhala book platform, consider: warm tones, literary aesthetic, Sri Lankan cultural elements
