-- Ensure backups storage bucket exists and has correct policies
DO $$
BEGIN
  -- Create backups bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('backups', 'backups', false)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Drop existing storage policies for clean slate
DROP POLICY IF EXISTS "Super admins can upload backups" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can view backups" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can delete backups" ON storage.objects;

-- Create storage policies for backups bucket (super admins only)
CREATE POLICY "Super admins can upload backups"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'backups' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can view backups"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'backups'
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Super admins can delete backups"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'backups'
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Initialize default backup configuration if none exists
INSERT INTO backup_config (
  id,
  schedule,
  time,
  retention_days,
  enabled,
  backup_location,
  encryption_enabled,
  notify_on_failure,
  notification_emails
) VALUES (
  uuid_generate_v4(),
  'daily',
  '02:00:00',
  30,
  true,
  'backups/daily/',
  true,
  true,
  ARRAY['admin@example.com']
)
ON CONFLICT DO NOTHING;

SELECT 'Backup storage configured successfully' as status;