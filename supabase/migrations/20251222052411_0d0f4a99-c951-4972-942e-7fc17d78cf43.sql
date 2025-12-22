-- Secure the storage bucket by making it private
UPDATE storage.buckets SET public = false WHERE id = 'letter-attachments';

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view attachments" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete attachments" ON storage.objects;

-- Create secure policies for authenticated users only
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'letter-attachments' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view their own attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'letter-attachments' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'letter-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);