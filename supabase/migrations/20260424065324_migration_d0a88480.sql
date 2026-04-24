-- Create avatars storage bucket and add avatar_url to profiles
CREATE POLICY "public_avatar_read" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "authenticated_avatar_upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "own_avatar_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "own_avatar_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add avatar_url column to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

SELECT 'Avatar storage configured' as status;