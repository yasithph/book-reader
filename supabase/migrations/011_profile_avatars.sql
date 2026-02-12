-- Add avatar_url column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;

-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to profile pictures
CREATE POLICY "Public read access for profile pictures"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-pictures');

-- Allow profile picture uploads (uploads go through admin client which bypasses RLS)
CREATE POLICY "Allow profile picture uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-pictures');

-- Allow profile picture updates
CREATE POLICY "Allow profile picture updates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-pictures');

-- Allow profile picture deletes
CREATE POLICY "Allow profile picture deletes"
ON storage.objects FOR DELETE
USING (bucket_id = 'profile-pictures');
