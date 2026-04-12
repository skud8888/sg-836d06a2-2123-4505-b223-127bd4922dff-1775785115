-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_template_id UUID NOT NULL REFERENCES course_templates(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completion_date DATE,
  instructor_name TEXT,
  instructor_signature TEXT,
  pdf_url TEXT,
  verification_code TEXT UNIQUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create certificate templates table
CREATE TABLE IF NOT EXISTS certificate_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  template_type TEXT DEFAULT 'completion' CHECK (template_type IN ('completion', 'attendance', 'achievement')),
  header_text TEXT DEFAULT 'Certificate of Completion',
  body_template TEXT NOT NULL,
  footer_text TEXT,
  logo_url TEXT,
  signature_url TEXT,
  background_url TEXT,
  border_style TEXT DEFAULT 'classic',
  color_scheme JSONB DEFAULT '{"primary": "#1a365d", "secondary": "#2c5282", "accent": "#d4af37"}'::jsonb,
  font_family TEXT DEFAULT 'serif',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create instructor payouts table
CREATE TABLE IF NOT EXISTS instructor_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  instructor_share DECIMAL(10,2) DEFAULT 0,
  platform_fee DECIMAL(10,2) DEFAULT 0,
  commission_rate DECIMAL(5,2) DEFAULT 70.00,
  students_taught INTEGER DEFAULT 0,
  courses_completed INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'paid', 'failed')),
  payment_method TEXT,
  payment_reference TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payout rules table
CREATE TABLE IF NOT EXISTS payout_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_template_id UUID REFERENCES course_templates(id) ON DELETE CASCADE,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 70.00,
  minimum_payout DECIMAL(10,2) DEFAULT 50.00,
  payout_schedule TEXT DEFAULT 'monthly' CHECK (payout_schedule IN ('weekly', 'biweekly', 'monthly')),
  payment_method TEXT DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'stripe', 'paypal', 'check')),
  is_active BOOLEAN DEFAULT true,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(instructor_id, course_template_id)
);

-- Create discussion threads table
CREATE TABLE IF NOT EXISTS discussion_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_template_id UUID NOT NULL REFERENCES course_templates(id) ON DELETE CASCADE,
  course_module_id UUID REFERENCES course_modules(id) ON DELETE SET NULL,
  course_lesson_id UUID REFERENCES course_lessons(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'question', 'announcement', 'discussion', 'resource')),
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  is_answered BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  upvotes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create discussion replies table
CREATE TABLE IF NOT EXISTS discussion_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES discussion_threads(id) ON DELETE CASCADE,
  parent_reply_id UUID REFERENCES discussion_replies(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_instructor_answer BOOLEAN DEFAULT false,
  is_helpful BOOLEAN DEFAULT false,
  upvotes_count INTEGER DEFAULT 0,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create thread subscriptions for notifications
CREATE TABLE IF NOT EXISTS thread_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES discussion_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(thread_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON certificates(course_template_id);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_instructor_payouts_instructor ON instructor_payouts(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_payouts_period ON instructor_payouts(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_payout_rules_instructor ON payout_rules(instructor_id);
CREATE INDEX IF NOT EXISTS idx_discussion_threads_course ON discussion_threads(course_template_id);
CREATE INDEX IF NOT EXISTS idx_discussion_threads_author ON discussion_threads(author_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_thread ON discussion_replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_author ON discussion_replies(author_id);

-- Insert default certificate template
INSERT INTO certificate_templates (
  name,
  template_type,
  header_text,
  body_template,
  footer_text,
  is_default
) VALUES (
  'Classic Completion Certificate',
  'completion',
  'Certificate of Completion',
  'This is to certify that {{student_name}} has successfully completed the course {{course_name}} on {{completion_date}}.',
  'Issued by {{organization_name}} | Certificate #{{certificate_number}}',
  true
) ON CONFLICT DO NOTHING;

-- RLS Policies for certificates
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own certificates"
ON certificates FOR SELECT
USING (auth.uid() = student_id OR check_user_role('super_admin') OR check_user_role('admin'));

CREATE POLICY "Admins can manage certificates"
ON certificates FOR ALL
USING (check_user_role('super_admin') OR check_user_role('admin'));

-- RLS Policies for certificate templates
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view certificate templates"
ON certificate_templates FOR SELECT
USING (true);

CREATE POLICY "Admins can manage templates"
ON certificate_templates FOR ALL
USING (check_user_role('super_admin') OR check_user_role('admin'));

-- RLS Policies for instructor payouts
ALTER TABLE instructor_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view their own payouts"
ON instructor_payouts FOR SELECT
USING (auth.uid() = instructor_id OR check_user_role('super_admin') OR check_user_role('admin'));

CREATE POLICY "Admins can manage payouts"
ON instructor_payouts FOR ALL
USING (check_user_role('super_admin') OR check_user_role('admin'));

-- RLS Policies for payout rules
ALTER TABLE payout_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view their own payout rules"
ON payout_rules FOR SELECT
USING (auth.uid() = instructor_id OR check_user_role('super_admin') OR check_user_role('admin'));

CREATE POLICY "Admins can manage payout rules"
ON payout_rules FOR ALL
USING (check_user_role('super_admin') OR check_user_role('admin'));

-- RLS Policies for discussion threads
ALTER TABLE discussion_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enrolled students and instructors can view threads"
ON discussion_threads FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM enrollments e
    WHERE e.course_template_id = discussion_threads.course_template_id
    AND e.student_id = auth.uid()
  )
  OR check_user_role('admin')
  OR check_user_role('trainer')
);

CREATE POLICY "Enrolled students can create threads"
ON discussion_threads FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM enrollments e
    WHERE e.course_template_id = course_template_id
    AND e.student_id = auth.uid()
  )
);

CREATE POLICY "Authors and admins can update their threads"
ON discussion_threads FOR UPDATE
USING (auth.uid() = author_id OR check_user_role('admin'));

CREATE POLICY "Authors and admins can delete threads"
ON discussion_threads FOR DELETE
USING (auth.uid() = author_id OR check_user_role('admin'));

-- RLS Policies for discussion replies
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone enrolled can view replies"
ON discussion_replies FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM discussion_threads dt
    JOIN enrollments e ON e.course_template_id = dt.course_template_id
    WHERE dt.id = discussion_replies.thread_id
    AND e.student_id = auth.uid()
  )
  OR check_user_role('admin')
  OR check_user_role('trainer')
);

CREATE POLICY "Enrolled students can create replies"
ON discussion_replies FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM discussion_threads dt
    JOIN enrollments e ON e.course_template_id = dt.course_template_id
    WHERE dt.id = thread_id
    AND e.student_id = auth.uid()
  )
);

CREATE POLICY "Authors and admins can update replies"
ON discussion_replies FOR UPDATE
USING (auth.uid() = author_id OR check_user_role('admin'));

CREATE POLICY "Authors and admins can delete replies"
ON discussion_replies FOR DELETE
USING (auth.uid() = author_id OR check_user_role('admin'));

-- RLS Policies for thread subscriptions
ALTER TABLE thread_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own subscriptions"
ON thread_subscriptions FOR ALL
USING (auth.uid() = user_id);