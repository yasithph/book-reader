-- Add draft support to chapters
-- draft_content: stores unsaved/unpublished changes
-- is_published: whether the chapter is visible to readers

ALTER TABLE public.chapters
ADD COLUMN IF NOT EXISTS draft_content TEXT,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;

-- Migrate existing chapters: mark all as published (preserve current behavior)
-- Only chapters with actual content should be marked as published
UPDATE public.chapters
SET is_published = TRUE
WHERE content IS NOT NULL AND content != '' AND content != '<p></p>';

-- Update RLS policy for readers: only show published chapters of published books
DROP POLICY IF EXISTS "Anyone can view chapters of published books" ON public.chapters;

CREATE POLICY "Anyone can view published chapters of published books"
ON public.chapters FOR SELECT
USING (
    is_published = TRUE
    AND EXISTS (
        SELECT 1 FROM public.books b
        WHERE b.id = book_id
        AND b.is_published = TRUE
    )
);

-- Admin can still see all chapters (existing policy should cover this via service role)
