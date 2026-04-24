-- Create backup metadata table for tracking
CREATE TABLE IF NOT EXISTS backup_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  backup_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  tables_backed_up TEXT[] NOT NULL,
  record_counts JSONB NOT NULL,
  backup_size_kb INTEGER NOT NULL,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('manual', 'automated', 'scheduled')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index for recent backups query
CREATE INDEX IF NOT EXISTS idx_backup_metadata_timestamp ON backup_metadata(backup_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_backup_metadata_status ON backup_metadata(status, backup_timestamp DESC);

-- RLS policies for backup metadata
ALTER TABLE backup_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admins_full_access" ON backup_metadata
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- Create storage bucket for backups
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for backups bucket
CREATE POLICY "super_admins_upload_backups" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'backups' AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

CREATE POLICY "super_admins_read_backups" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'backups' AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

COMMENT ON TABLE backup_metadata IS 'Tracks automated database backup operations';
COMMENT ON COLUMN backup_metadata.backup_type IS 'Type of backup: manual (user-triggered), automated (edge function), scheduled (cron)';
COMMENT ON COLUMN backup_metadata.record_counts IS 'JSON object with table names as keys and record counts as values';