-- Create pre_course_materials table for pre-course study resources
CREATE TABLE IF NOT EXISTS pre_course_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_template_id UUID NOT NULL REFERENCES course_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  material_type TEXT NOT NULL CHECK (material_type IN ('video', 'pdf', 'document', 'link', 'quiz')),
  file_url TEXT,
  external_url TEXT,
  duration_minutes INTEGER, -- For videos
  order_index INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_pre_course_materials_course ON pre_course_materials(course_template_id);
CREATE INDEX IF NOT EXISTS idx_pre_course_materials_published ON pre_course_materials(is_published);

-- Create material_access table to track student progress
CREATE TABLE IF NOT EXISTS material_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES pre_course_materials(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  first_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  time_spent_minutes INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(student_id, material_id, enrollment_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_material_access_student ON material_access(student_id);
CREATE INDEX IF NOT EXISTS idx_material_access_material ON material_access(material_id);
CREATE INDEX IF NOT EXISTS idx_material_access_enrollment ON material_access(enrollment_id);

-- Create sms_notifications table for SMS tracking
CREATE TABLE IF NOT EXISTS sms_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_phone TEXT NOT NULL,
  recipient_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  message_body TEXT NOT NULL,
  notification_type TEXT NOT NULL, -- 'booking_confirmation', 'class_reminder', 'payment_receipt', 'general'
  related_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  related_class_id UUID REFERENCES scheduled_classes(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  twilio_sid TEXT, -- Twilio message SID
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  cost_usd DECIMAL(10, 4), -- Track SMS costs
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sms_notifications_recipient ON sms_notifications(recipient_phone);
CREATE INDEX IF NOT EXISTS idx_sms_notifications_user ON sms_notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_sms_notifications_status ON sms_notifications(status);
CREATE INDEX IF NOT EXISTS idx_sms_notifications_type ON sms_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_sms_notifications_created ON sms_notifications(created_at DESC);

-- RLS Policies for pre_course_materials
ALTER TABLE pre_course_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pre-course materials" ON pre_course_materials
  FOR ALL
  USING (check_user_role('admin') OR check_user_role('super_admin') OR check_user_role('trainer'));

CREATE POLICY "Students can view published materials for their courses" ON pre_course_materials
  FOR SELECT
  USING (
    is_published = true AND
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.student_id = auth.uid()
      AND e.course_template_id = pre_course_materials.course_template_id
    )
  );

-- RLS Policies for material_access
ALTER TABLE material_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own material access" ON material_access
  FOR ALL
  USING (student_id = auth.uid());

CREATE POLICY "Admins can view all material access" ON material_access
  FOR SELECT
  USING (check_user_role('admin') OR check_user_role('super_admin') OR check_user_role('trainer'));

-- RLS Policies for sms_notifications
ALTER TABLE sms_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all SMS notifications" ON sms_notifications
  FOR ALL
  USING (check_user_role('admin') OR check_user_role('super_admin'));

CREATE POLICY "Users can view their own SMS notifications" ON sms_notifications
  FOR SELECT
  USING (recipient_user_id = auth.uid());