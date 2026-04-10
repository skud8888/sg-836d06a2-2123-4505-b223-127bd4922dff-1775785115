-- Drop old notification_preferences table and create new comprehensive one
DROP TABLE IF EXISTS notification_preferences CASCADE;

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Email notifications
  email_new_booking BOOLEAN DEFAULT true,
  email_booking_cancelled BOOLEAN DEFAULT true,
  email_payment_received BOOLEAN DEFAULT true,
  email_payment_failed BOOLEAN DEFAULT true,
  email_new_enquiry BOOLEAN DEFAULT true,
  email_course_reminder BOOLEAN DEFAULT true,
  email_attendance_marked BOOLEAN DEFAULT false,
  email_document_uploaded BOOLEAN DEFAULT false,
  
  -- SMS notifications
  sms_new_booking BOOLEAN DEFAULT false,
  sms_booking_cancelled BOOLEAN DEFAULT false,
  sms_payment_received BOOLEAN DEFAULT false,
  sms_course_reminder BOOLEAN DEFAULT true,
  
  -- Digest settings
  daily_digest BOOLEAN DEFAULT false,
  weekly_digest BOOLEAN DEFAULT false,
  digest_time TIME DEFAULT '09:00:00',
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '07:00:00',
  
  -- Other settings
  notification_sound BOOLEAN DEFAULT true,
  desktop_notifications BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own preferences"
  ON notification_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Function to auto-create preferences for new users
CREATE OR REPLACE FUNCTION create_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create preferences on user signup
DROP TRIGGER IF EXISTS on_auth_user_created_notification_prefs ON auth.users;
CREATE TRIGGER on_auth_user_created_notification_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_preferences();

-- Create activity_feed view from system_audit_logs
CREATE OR REPLACE VIEW activity_feed AS
SELECT 
  id,
  action,
  resource_type,
  resource_id,
  metadata,
  created_at,
  user_email,
  -- Derive event type from action and resource
  CASE 
    WHEN action = 'create' AND resource_type = 'booking' THEN 'booking_created'
    WHEN action = 'update' AND resource_type = 'booking' THEN 'booking_updated'
    WHEN action = 'delete' AND resource_type = 'booking' THEN 'booking_cancelled'
    WHEN action = 'create' AND resource_type = 'payment' THEN 'payment_received'
    WHEN action = 'create' AND resource_type = 'enquiry' THEN 'enquiry_submitted'
    WHEN action = 'create' AND resource_type = 'document' THEN 'document_uploaded'
    WHEN action = 'update' AND resource_type = 'student' THEN 'student_updated'
    WHEN action = 'create' AND resource_type = 'course' THEN 'course_created'
    ELSE action || '_' || resource_type
  END as event_type,
  -- Icon placeholder
  '' as event_icon
FROM system_audit_logs
WHERE created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- Grant select on view
GRANT SELECT ON activity_feed TO authenticated;

SELECT 'Notification preferences and activity feed setup complete' as status;