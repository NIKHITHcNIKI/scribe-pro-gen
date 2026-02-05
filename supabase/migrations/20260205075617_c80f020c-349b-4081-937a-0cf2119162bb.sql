-- Make the letter-attachments bucket public for logo viewing
UPDATE storage.buckets SET public = true WHERE id = 'letter-attachments';

-- Add policy to allow public read access
CREATE POLICY "Public read access for logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'letter-attachments');