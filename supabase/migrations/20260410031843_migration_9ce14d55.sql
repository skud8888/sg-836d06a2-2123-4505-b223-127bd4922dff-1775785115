-- Create user roles and permissions system
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'trainer', 'receptionist', 'student')),
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, role)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'trainer', 'receptionist', 'student')),
  resource TEXT NOT NULL, -- 'bookings', 'courses', 'trainers', 'analytics', etc.
  action TEXT NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete', 'export')),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role, resource, action)
);

-- Create system audit logs table
CREATE TABLE IF NOT EXISTS system_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT,
  action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'LOGIN', etc.
  resource_type TEXT NOT NULL, -- 'booking', 'document', 'user', 'payment', etc.
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON system_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON system_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON system_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON system_audit_logs(created_at);

-- Enable RLS on new tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all roles"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- RLS Policies for role_permissions (read-only for all authenticated users)
CREATE POLICY "Anyone can view role permissions"
  ON role_permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for system_audit_logs
CREATE POLICY "Super admins can view all audit logs"
  ON system_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Admins can view audit logs"
  ON system_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Insert default role permissions
INSERT INTO role_permissions (role, resource, action) VALUES
-- Super Admin: Full access to everything
('super_admin', 'bookings', 'create'),
('super_admin', 'bookings', 'read'),
('super_admin', 'bookings', 'update'),
('super_admin', 'bookings', 'delete'),
('super_admin', 'bookings', 'export'),
('super_admin', 'courses', 'create'),
('super_admin', 'courses', 'read'),
('super_admin', 'courses', 'update'),
('super_admin', 'courses', 'delete'),
('super_admin', 'courses', 'export'),
('super_admin', 'trainers', 'create'),
('super_admin', 'trainers', 'read'),
('super_admin', 'trainers', 'update'),
('super_admin', 'trainers', 'delete'),
('super_admin', 'users', 'create'),
('super_admin', 'users', 'read'),
('super_admin', 'users', 'update'),
('super_admin', 'users', 'delete'),
('super_admin', 'analytics', 'read'),
('super_admin', 'analytics', 'export'),
('super_admin', 'audit_logs', 'read'),
('super_admin', 'audit_logs', 'export'),

-- Admin: Most access except user management and deletions
('admin', 'bookings', 'create'),
('admin', 'bookings', 'read'),
('admin', 'bookings', 'update'),
('admin', 'bookings', 'export'),
('admin', 'courses', 'create'),
('admin', 'courses', 'read'),
('admin', 'courses', 'update'),
('admin', 'courses', 'export'),
('admin', 'trainers', 'read'),
('admin', 'analytics', 'read'),
('admin', 'analytics', 'export'),

-- Trainer: View assigned classes and update attendance
('trainer', 'bookings', 'read'),
('trainer', 'courses', 'read'),
('trainer', 'trainers', 'read'),

-- Receptionist: Create bookings, record payments
('receptionist', 'bookings', 'create'),
('receptionist', 'bookings', 'read'),
('receptionist', 'bookings', 'update'),
('receptionist', 'courses', 'read'),

-- Student: View own data only (enforced by RLS)
('student', 'bookings', 'read')
ON CONFLICT (role, resource, action) DO NOTHING;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id UUID,
  p_resource TEXT,
  p_action TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = p_user_id
      AND rp.resource = p_resource
      AND rp.action = p_action
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_user_role TEXT;
  v_log_id UUID;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();
  
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  
  SELECT role INTO v_user_role 
  FROM user_roles 
  WHERE user_id = v_user_id 
  ORDER BY assigned_at DESC 
  LIMIT 1;
  
  -- Insert audit log
  INSERT INTO system_audit_logs (
    user_id,
    user_email,
    user_role,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    metadata
  ) VALUES (
    v_user_id,
    v_user_email,
    v_user_role,
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    p_metadata
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to auto-log booking changes
CREATE OR REPLACE FUNCTION audit_booking_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(
      'CREATE',
      'booking',
      NEW.id::TEXT,
      NULL,
      to_jsonb(NEW),
      jsonb_build_object('table', 'bookings')
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit_event(
      'UPDATE',
      'booking',
      NEW.id::TEXT,
      to_jsonb(OLD),
      to_jsonb(NEW),
      jsonb_build_object('table', 'bookings')
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event(
      'DELETE',
      'booking',
      OLD.id::TEXT,
      to_jsonb(OLD),
      NULL,
      jsonb_build_object('table', 'bookings')
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers
DROP TRIGGER IF EXISTS audit_bookings_trigger ON bookings;
CREATE TRIGGER audit_bookings_trigger
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW EXECUTE FUNCTION audit_booking_changes();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION has_permission TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit_event TO authenticated;