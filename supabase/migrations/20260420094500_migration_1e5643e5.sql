-- Create error_logs table for comprehensive error tracking
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create activity_timeline table for user action tracking
CREATE TABLE IF NOT EXISTS activity_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_messages table for live chat
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id TEXT,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('direct', 'group', 'support')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create translations table for multi-language support
CREATE TABLE IF NOT EXISTS translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL,
  language TEXT NOT NULL,
  value TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(key, language)
);

-- Create bulk_operations table for tracking batch jobs
CREATE TABLE IF NOT EXISTS bulk_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_items INTEGER,
  processed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_activity_timeline_user_id ON activity_timeline(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_timeline_created_at ON activity_timeline(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient_id ON chat_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_translations_language ON translations(language);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_user_id ON bulk_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_status ON bulk_operations(status);

-- RLS Policies for error_logs
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "error_logs_select_admin" ON error_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "error_logs_insert_authenticated" ON error_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for activity_timeline
ALTER TABLE activity_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_timeline_select_own" ON activity_timeline
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "activity_timeline_select_admin" ON activity_timeline
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "activity_timeline_insert_authenticated" ON activity_timeline
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_messages_select_participant" ON chat_messages
  FOR SELECT USING (
    auth.uid() = sender_id OR 
    auth.uid() = recipient_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "chat_messages_insert_authenticated" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "chat_messages_update_own" ON chat_messages
  FOR UPDATE USING (auth.uid() = recipient_id);

-- RLS Policies for chat_rooms
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_rooms_select_all" ON chat_rooms
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "chat_rooms_insert_authenticated" ON chat_rooms
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- RLS Policies for translations
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "translations_select_all" ON translations
  FOR SELECT USING (true);

CREATE POLICY "translations_modify_admin" ON translations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for bulk_operations
ALTER TABLE bulk_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bulk_operations_select_own" ON bulk_operations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "bulk_operations_insert_authenticated" ON bulk_operations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bulk_operations_update_own" ON bulk_operations
  FOR UPDATE USING (auth.uid() = user_id);