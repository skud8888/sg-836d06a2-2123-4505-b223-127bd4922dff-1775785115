-- Create onboarding_progress table to track admin setup
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  step_name TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  skipped BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, step_id)
);

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_user_id ON onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_completed ON onboarding_progress(user_id, completed);

-- RLS policies for onboarding_progress
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding progress"
  ON onboarding_progress
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own onboarding progress"
  ON onboarding_progress
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own onboarding progress"
  ON onboarding_progress
  FOR UPDATE
  USING (user_id = auth.uid());

-- Create user_activity_logs table for tracking user actions
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  action_details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for activity logs
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_type ON user_activity_logs(action_type);

-- RLS policies for user_activity_logs
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity logs"
  ON user_activity_logs
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all activity logs"
  ON user_activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "System can insert activity logs"
  ON user_activity_logs
  FOR INSERT
  WITH CHECK (true);