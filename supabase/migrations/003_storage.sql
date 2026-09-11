-- VGU CS AI Project Hub - Storage Bucket Setup
-- Migration 003: Bucket creation and storage access policies

-- Create bucket for lecture materials with 50MB file size limit
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lecture-materials',
  'lecture-materials',
  true,
  52428800, -- 50 MB max file size (Free Tier limit)
  ARRAY[
    'application/pdf',
    'text/html',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/zip'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- Storage Policies
DROP POLICY IF EXISTS "Storage: public read" ON storage.objects;
CREATE POLICY "Storage: public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'lecture-materials');

DROP POLICY IF EXISTS "Storage: authenticated upload" ON storage.objects;
CREATE POLICY "Storage: authenticated upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'lecture-materials' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Storage: authenticated update" ON storage.objects;
CREATE POLICY "Storage: authenticated update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'lecture-materials' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Storage: authenticated delete" ON storage.objects;
CREATE POLICY "Storage: authenticated delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'lecture-materials' AND auth.role() = 'authenticated'
  );
