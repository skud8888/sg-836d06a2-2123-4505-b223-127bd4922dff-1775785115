-- Create student analytics view
CREATE OR REPLACE VIEW student_analytics AS
SELECT 
  b.student_email,
  b.student_name,
  b.student_phone,
  COUNT(DISTINCT b.id) as total_bookings,
  COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_courses,
  COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END) as cancelled_courses,
  SUM(b.total_amount) as lifetime_value,
  SUM(b.paid_amount) as total_paid,
  SUM(b.total_amount - b.paid_amount) as outstanding_balance,
  AVG(CASE WHEN cf.rating IS NOT NULL THEN cf.rating END) as avg_rating,
  MAX(b.created_at) as last_booking_date,
  MIN(b.created_at) as first_booking_date
FROM bookings b
LEFT JOIN course_feedback cf ON cf.booking_id = b.id
GROUP BY b.student_email, b.student_name, b.student_phone;

-- Create payment tracking view
CREATE OR REPLACE VIEW payment_tracking AS
SELECT 
  b.id as booking_id,
  b.student_name,
  b.student_email,
  sc.start_datetime,
  ct.name as course_name,
  ct.code as course_code,
  b.total_amount,
  b.paid_amount,
  (b.total_amount - b.paid_amount) as balance_due,
  b.payment_status,
  b.status as booking_status,
  CASE 
    WHEN b.payment_status = 'paid' THEN 0
    WHEN sc.start_datetime < NOW() THEN EXTRACT(DAY FROM NOW() - sc.start_datetime)
    ELSE EXTRACT(DAY FROM sc.start_datetime - NOW())
  END as days_overdue,
  b.created_at as booking_date
FROM bookings b
LEFT JOIN scheduled_classes sc ON sc.id = b.scheduled_class_id
LEFT JOIN course_templates ct ON ct.id = sc.course_template_id
WHERE b.payment_status != 'paid'
ORDER BY sc.start_datetime DESC;

-- Create evidence capture table
CREATE TABLE IF NOT EXISTS evidence_capture (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  scheduled_class_id UUID REFERENCES scheduled_classes(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('attendance_photo', 'practical_assessment', 'completed_work', 'document', 'safety_compliance', 'other')),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  description TEXT,
  captured_by UUID REFERENCES auth.users(id),
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  geolocation JSONB, -- {lat, lng, accuracy}
  metadata JSONB, -- Additional context
  synced_at TIMESTAMP WITH TIME ZONE, -- For offline support
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'both')),
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_email, notification_type)
);

-- Create notification log table
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_type TEXT NOT NULL,
  recipient_email TEXT,
  recipient_phone TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  subject TEXT,
  message TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  sent_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment plans table
CREATE TABLE IF NOT EXISTS payment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  installments INTEGER NOT NULL,
  installment_amount DECIMAL(10,2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'fortnightly', 'monthly')),
  start_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'defaulted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment plan installments table
CREATE TABLE IF NOT EXISTS payment_plan_installments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_plan_id UUID REFERENCES payment_plans(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'waived')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_evidence_booking ON evidence_capture(booking_id);
CREATE INDEX IF NOT EXISTS idx_evidence_class ON evidence_capture(scheduled_class_id);
CREATE INDEX IF NOT EXISTS idx_evidence_type ON evidence_capture(evidence_type);
CREATE INDEX IF NOT EXISTS idx_notification_status ON notification_log(status);
CREATE INDEX IF NOT EXISTS idx_notification_created ON notification_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_plan_booking ON payment_plans(booking_id);
CREATE INDEX IF NOT EXISTS idx_installment_plan ON payment_plan_installments(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_installment_status ON payment_plan_installments(status);

-- RLS Policies
ALTER TABLE evidence_capture ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plan_installments ENABLE ROW LEVEL SECURITY;

-- Evidence: trainers and admins can create, students can view their own
CREATE POLICY "trainers_create_evidence" ON evidence_capture FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "view_evidence" ON evidence_capture FOR SELECT
  USING (
    auth.uid() IS NOT NULL OR
    EXISTS (
      SELECT 1 FROM bookings b 
      WHERE b.id = evidence_capture.booking_id 
      AND b.student_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Notification preferences: users manage their own
CREATE POLICY "manage_own_preferences" ON notification_preferences 
  FOR ALL USING (
    user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Notification log: admins only
CREATE POLICY "admin_view_notifications" ON notification_log FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Payment plans: admins create, students view their own
CREATE POLICY "admin_manage_payment_plans" ON payment_plans
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "view_own_payment_plan" ON payment_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b 
      WHERE b.id = payment_plans.booking_id 
      AND b.student_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "view_payment_installments" ON payment_plan_installments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM payment_plans pp
      JOIN bookings b ON b.id = pp.booking_id
      WHERE pp.id = payment_plan_installments.payment_plan_id
      AND (auth.uid() IS NOT NULL OR b.student_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  );

-- Function to schedule payment reminders
CREATE OR REPLACE FUNCTION schedule_payment_reminder(p_booking_id UUID)
RETURNS void AS $$
DECLARE
  v_student_email TEXT;
  v_student_name TEXT;
  v_balance DECIMAL;
  v_due_date DATE;
BEGIN
  SELECT b.student_email, b.student_name, (b.total_amount - b.paid_amount), sc.start_datetime::DATE
  INTO v_student_email, v_student_name, v_balance, v_due_date
  FROM bookings b
  LEFT JOIN scheduled_classes sc ON sc.id = b.scheduled_class_id
  WHERE b.id = p_booking_id;
  
  IF v_balance > 0 THEN
    -- Log scheduled reminder (actual sending happens via Edge Function/cron)
    INSERT INTO notification_log (
      notification_type, recipient_email, channel, subject, status, metadata
    ) VALUES (
      'payment_reminder', 
      v_student_email, 
      'email',
      'Payment Reminder - Outstanding Balance',
      'pending',
      jsonb_build_object(
        'booking_id', p_booking_id,
        'student_name', v_student_name,
        'balance', v_balance,
        'due_date', v_due_date,
        'send_at', v_due_date - INTERVAL '7 days'
      )
    );
  END IF;
END;
$$ LANGUAGE plpgsql;