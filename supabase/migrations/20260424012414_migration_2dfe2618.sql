-- Create storage buckets for GTSTrain Production

-- Documents bucket for student IDs, certificates, etc.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Evidence bucket for field photos and videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence',
  'evidence',
  false,
  104857600, -- 100MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Certificates bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificates',
  'certificates',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for documents bucket
CREATE POLICY "authenticated_upload_documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "authenticated_view_documents" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'documents');

-- Set up RLS policies for evidence bucket
CREATE POLICY "authenticated_upload_evidence" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'evidence');

CREATE POLICY "authenticated_view_evidence" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'evidence');

-- Set up RLS policies for certificates bucket
CREATE POLICY "authenticated_view_certificates" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'certificates');

CREATE POLICY "admin_upload_certificates" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'certificates' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = ANY(ARRAY['admin', 'super_admin'])
  )
);

SELECT 'Storage buckets created successfully' as status;