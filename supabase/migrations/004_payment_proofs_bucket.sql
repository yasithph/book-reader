-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to payment proofs (admins need to view them)
CREATE POLICY "Public read access for payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');

-- Allow all inserts (uploads go through admin client which bypasses RLS)
CREATE POLICY "Allow payment proof uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs');
