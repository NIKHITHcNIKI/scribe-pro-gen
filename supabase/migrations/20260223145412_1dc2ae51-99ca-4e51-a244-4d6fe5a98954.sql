-- Make bucket private
UPDATE storage.buckets SET public = false WHERE id = 'letter-attachments';

-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Public read access for logos" ON storage.objects;

-- Drop the weak upload policy
DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects;

-- Add user-scoped SELECT policy
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'letter-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add user-scoped INSERT policy with path ownership
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'letter-attachments' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);