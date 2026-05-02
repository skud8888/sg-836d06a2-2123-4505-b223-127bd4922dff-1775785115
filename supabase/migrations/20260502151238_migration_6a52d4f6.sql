-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_messages_session ON support_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_student ON support_messages(student_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_read ON support_messages(read_at) WHERE read_at IS NULL;