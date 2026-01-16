-- Create storage bucket for book covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to book covers
CREATE POLICY "Public read access for book covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'book-covers');

-- Allow authenticated admins to upload/update/delete
CREATE POLICY "Admin upload access for book covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'book-covers'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin update access for book covers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'book-covers'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin delete access for book covers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'book-covers'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
