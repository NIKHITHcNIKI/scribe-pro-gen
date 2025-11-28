-- Create storage bucket for letter attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('letter-attachments', 'letter-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload files to letter-attachments bucket
CREATE POLICY "Anyone can upload attachments"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'letter-attachments');

-- Allow anyone to view attachments
CREATE POLICY "Anyone can view attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'letter-attachments');

-- Allow anyone to delete their uploaded attachments
CREATE POLICY "Anyone can delete attachments"
ON storage.objects
FOR DELETE
USING (bucket_id = 'letter-attachments');