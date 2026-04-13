-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  action_category TEXT CHECK (action_category IN ('user_management', 'authentication', 'course_management', 'booking_management', 'payment', 'system', 'content')),
  severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')) DEFAULT 'info',
  details TEXT,
  metadata JSONB DEFAULT '{}',
  affected_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_category ON audit_logs(action_category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_affected_user ON audit_logs(affected_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- RLS policies for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admins can view audit logs"
ON audit_logs FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'super_admin'
));

CREATE POLICY "System can insert audit logs"
ON audit_logs FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- Create user_onboarding table
CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 5,
  completed_steps TEXT[] DEFAULT '{}',
  is_completed BOOLEAN DEFAULT FALSE,
  skipped BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_step_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- RLS policies for user_onboarding
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding"
ON user_onboarding FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding"
ON user_onboarding FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create onboarding"
ON user_onboarding FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to create onboarding record on user creation
CREATE OR REPLACE FUNCTION create_user_onboarding()
RETURNS TRIGGER AS $$
BEGIN
  -- Create onboarding for student role
  INSERT INTO user_onboarding (user_id, role, total_steps)
  VALUES (NEW.id, 'student', 5)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create onboarding
DROP TRIGGER IF EXISTS on_profile_created_onboarding ON profiles;
CREATE TRIGGER on_profile_created_onboarding
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_onboarding();