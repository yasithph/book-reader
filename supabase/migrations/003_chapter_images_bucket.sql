-- Create storage bucket for chapter images
INSERT INTO storage.buckets (id, name, public)
VALUES ('chapter-images', 'chapter-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to chapter images
CREATE POLICY "Public read access for chapter images"
ON storage.objects FOR SELECT
USING (bucket_id = 'chapter-images');

-- Allow authenticated admins to upload
CREATE POLICY "Admin upload access for chapter images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chapter-images'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow authenticated admins to update
CREATE POLICY "Admin update access for chapter images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'chapter-images'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow authenticated admins to delete
CREATE POLICY "Admin delete access for chapter images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chapter-images'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
