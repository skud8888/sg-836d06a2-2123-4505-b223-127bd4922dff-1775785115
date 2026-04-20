-- Create security_audits table for tracking security scans
CREATE TABLE IF NOT EXISTS security_audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_type TEXT NOT NULL CHECK (scan_type IN ('automated', 'manual', 'scheduled')),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  grade TEXT NOT NULL CHECK (grade IN ('A', 'B', 'C', 'D', 'F')),
  issues JSONB DEFAULT '[]'::jsonb,
  passed_checks JSONB DEFAULT '[]'::jsonb,
  scanned_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_security_audits_created_at ON security_audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audits_score ON security_audits(score);

-- RLS Policies
ALTER TABLE security_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "security_audits_select_admin" ON security_audits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "security_audits_insert_admin" ON security_audits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

COMMENT ON TABLE security_audits IS 'Security audit scan results and history';