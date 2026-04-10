-- Add missing columns to the existing documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_latest_version BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES course_templates(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS trainer_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Create document audit logs table
CREATE TABLE IF NOT EXISTS document_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'viewed', 'downloaded', 'updated', 'deleted', 'shared', 'version_created')),
  performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for audit logs
ALTER TABLE document_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_view_audit_logs" ON document_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "all_insert_audit_logs" ON document_audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Function to log document access
CREATE OR REPLACE FUNCTION log_document_access(
  p_document_id UUID,
  p_action TEXT,
  p_user_id UUID DEFAULT auth.uid(),
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS void AS $$
BEGIN
  INSERT INTO document_audit_logs (document_id, action, performed_by, metadata)
  VALUES (p_document_id, p_action, p_user_id, p_metadata);
END;
$$ LANGUAGE plpgsql;

-- Function to create new document version
CREATE OR REPLACE FUNCTION create_document_version(
  p_document_id UUID,
  p_new_file_path TEXT,
  p_new_filename TEXT,
  p_uploaded_by UUID
) RETURNS UUID AS $$
DECLARE
  v_new_version INTEGER;
  v_new_doc_id UUID;
  v_original_doc RECORD;
BEGIN
  -- Get original document details
  SELECT * INTO v_original_doc FROM documents WHERE id = p_document_id;
  
  -- Mark old version as not latest
  UPDATE documents SET is_latest_version = false WHERE id = p_document_id;
  
  -- Get next version number
  SELECT COALESCE(MAX(version), 0) + 1 INTO v_new_version
  FROM documents 
  WHERE parent_document_id = p_document_id OR id = p_document_id;
  
  -- Create new version
  INSERT INTO documents (
    file_name,
    file_path,
    document_type,
    version,
    parent_document_id,
    is_latest_version,
    booking_id,
    scheduled_class_id,
    course_id,
    trainer_id,
    tags,
    notes,
    uploaded_by
  ) VALUES (
    p_new_filename,
    p_new_file_path,
    v_original_doc.document_type,
    v_new_version,
    p_document_id,
    true,
    v_original_doc.booking_id,
    v_original_doc.scheduled_class_id,
    v_original_doc.course_id,
    v_original_doc.trainer_id,
    v_original_doc.tags,
    v_original_doc.notes,
    p_uploaded_by
  ) RETURNING id INTO v_new_doc_id;
  
  -- Log the version creation
  INSERT INTO document_audit_logs (document_id, action, performed_by, metadata)
  VALUES (v_new_doc_id, 'version_created', p_uploaded_by, jsonb_build_object('previous_version', p_document_id));
  
  RETURN v_new_doc_id;
END;
$$ LANGUAGE plpgsql;