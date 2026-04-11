-- Create email queue table for automated email processing
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  template_type TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html_template TEXT NOT NULL,
  variables JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create waitlist table
CREATE TABLE IF NOT EXISTS course_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_template_id UUID NOT NULL REFERENCES course_templates(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_phone TEXT,
  position INTEGER NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'enrolled', 'expired', 'cancelled')),
  notified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student progress table
CREATE TABLE IF NOT EXISTS student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_template_id UUID NOT NULL REFERENCES course_templates(id) ON DELETE CASCADE,
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed', 'dropped')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  certificate_issued BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(enrollment_id)
);

-- Create lesson completions table
CREATE TABLE IF NOT EXISTS lesson_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_progress_id UUID NOT NULL REFERENCES student_progress(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_progress_id, lesson_id)
);

-- Create attendance records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(enrollment_id, session_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created ON email_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_course ON course_waitlist(course_template_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON course_waitlist(status);
CREATE INDEX IF NOT EXISTS idx_student_progress_enrollment ON student_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_student ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_progress ON lesson_completions(student_progress_id);
CREATE INDEX IF NOT EXISTS idx_attendance_enrollment ON attendance_records(enrollment_id);

-- RLS Policies for email_queue
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all emails"
ON email_queue FOR SELECT
USING (check_user_role('super_admin') OR check_user_role('admin'));

CREATE POLICY "System can insert emails"
ON email_queue FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update emails"
ON email_queue FOR UPDATE
USING (true);

-- RLS Policies for email_templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage templates"
ON email_templates FOR ALL
USING (check_user_role('super_admin') OR check_user_role('admin'));

-- RLS Policies for course_waitlist
ALTER TABLE course_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist"
ON course_waitlist FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their waitlist entries"
ON course_waitlist FOR SELECT
USING (student_email = auth.jwt()->>'email' OR check_user_role('super_admin') OR check_user_role('admin'));

CREATE POLICY "Admins can manage waitlist"
ON course_waitlist FOR ALL
USING (check_user_role('super_admin') OR check_user_role('admin'));

-- RLS Policies for student_progress
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own progress"
ON student_progress FOR SELECT
USING (student_id = auth.uid() OR check_user_role('super_admin') OR check_user_role('admin') OR check_user_role('trainer'));

CREATE POLICY "Admins can manage progress"
ON student_progress FOR ALL
USING (check_user_role('super_admin') OR check_user_role('admin') OR check_user_role('trainer'));

-- RLS Policies for lesson_completions
ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their completions"
ON lesson_completions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM student_progress sp
    WHERE sp.id = lesson_completions.student_progress_id
    AND sp.student_id = auth.uid()
  ) OR check_user_role('super_admin') OR check_user_role('admin') OR check_user_role('trainer')
);

CREATE POLICY "Students can mark lessons complete"
ON lesson_completions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM student_progress sp
    WHERE sp.id = lesson_completions.student_progress_id
    AND sp.student_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage completions"
ON lesson_completions FOR ALL
USING (check_user_role('super_admin') OR check_user_role('admin') OR check_user_role('trainer'));

-- RLS Policies for attendance_records
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their attendance"
ON attendance_records FOR SELECT
USING (student_id = auth.uid() OR check_user_role('super_admin') OR check_user_role('admin') OR check_user_role('trainer'));

CREATE POLICY "Admins can manage attendance"
ON attendance_records FOR ALL
USING (check_user_role('super_admin') OR check_user_role('admin') OR check_user_role('trainer'));

-- Function to automatically create student_progress on enrollment
CREATE OR REPLACE FUNCTION create_student_progress_on_enrollment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO student_progress (
    enrollment_id,
    student_id,
    course_template_id,
    status
  ) VALUES (
    NEW.id,
    NEW.student_id,
    NEW.course_template_id,
    'not_started'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_enrollment_create_progress
AFTER INSERT ON enrollments
FOR EACH ROW
EXECUTE FUNCTION create_student_progress_on_enrollment();

-- Function to update completion percentage when lessons are marked complete
CREATE OR REPLACE FUNCTION update_completion_percentage()
RETURNS TRIGGER AS $$
DECLARE
  total_lessons INTEGER;
  completed_lessons INTEGER;
  new_percentage DECIMAL(5,2);
BEGIN
  -- Count total lessons in the course
  SELECT COUNT(*)
  INTO total_lessons
  FROM course_lessons cl
  INNER JOIN course_modules cm ON cl.module_id = cm.id
  INNER JOIN student_progress sp ON sp.course_template_id = cm.course_id
  WHERE sp.id = NEW.student_progress_id;

  -- Count completed lessons
  SELECT COUNT(*)
  INTO completed_lessons
  FROM lesson_completions
  WHERE student_progress_id = NEW.student_progress_id
  AND completed = TRUE;

  -- Calculate percentage
  IF total_lessons > 0 THEN
    new_percentage := (completed_lessons::DECIMAL / total_lessons::DECIMAL) * 100;
  ELSE
    new_percentage := 0;
  END IF;

  -- Update student_progress
  UPDATE student_progress
  SET 
    completion_percentage = new_percentage,
    status = CASE 
      WHEN new_percentage = 100 THEN 'completed'
      WHEN new_percentage > 0 THEN 'in_progress'
      ELSE 'not_started'
    END,
    completed_at = CASE 
      WHEN new_percentage = 100 THEN NOW()
      ELSE NULL
    END,
    updated_at = NOW()
  WHERE id = NEW.student_progress_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_lesson_completion_update_progress
AFTER INSERT OR UPDATE ON lesson_completions
FOR EACH ROW
EXECUTE FUNCTION update_completion_percentage();

-- Insert default email templates
INSERT INTO email_templates (name, subject, html_template, variables, description) VALUES
('enrollment_confirmation', 
 'Welcome to {{course_name}} - Enrollment Confirmed!',
 '<h2>Enrollment Confirmed!</h2><p>Dear {{student_name}},</p><p>Welcome to <strong>{{course_name}}</strong>!</p><p><strong>Course Details:</strong></p><ul><li>Duration: {{duration}} hours</li><li>Start Date: {{start_date}}</li><li>Amount Paid: ${{amount_paid}}</li><li>Amount Due: ${{amount_due}}</li></ul><p>We''re excited to have you join us!</p><p>If you have any questions, please don''t hesitate to contact us.</p><p>Best regards,<br>GTS Training Team</p>',
 '{"course_name": "Course name", "student_name": "Student full name", "duration": "Course duration", "start_date": "Course start date", "amount_paid": "Amount paid", "amount_due": "Amount remaining"}',
 'Sent when a student successfully enrolls in a course'),

('payment_reminder',
 'Payment Reminder - {{course_name}}',
 '<h2>Payment Reminder</h2><p>Dear {{student_name}},</p><p>This is a friendly reminder that you have an outstanding balance for <strong>{{course_name}}</strong>.</p><p><strong>Payment Details:</strong></p><ul><li>Amount Due: ${{amount_due}}</li><li>Due Date: {{due_date}}</li></ul><p>Please make your payment at your earliest convenience to maintain your enrollment.</p><p><a href="{{payment_link}}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">Make Payment</a></p><p>Thank you!</p><p>GTS Training Team</p>',
 '{"course_name": "Course name", "student_name": "Student name", "amount_due": "Outstanding amount", "due_date": "Payment due date", "payment_link": "Payment URL"}',
 'Sent 7 days before payment is due'),

('course_start_reminder',
 'Your Course Starts Soon - {{course_name}}',
 '<h2>Course Starting Soon!</h2><p>Dear {{student_name}},</p><p>This is a reminder that <strong>{{course_name}}</strong> starts in 3 days!</p><p><strong>Course Details:</strong></p><ul><li>Start Date: {{start_date}}</li><li>Time: {{start_time}}</li><li>Location: {{location}}</li><li>Duration: {{duration}} hours</li></ul><p><strong>What to Bring:</strong></p><ul><li>Valid ID</li><li>Notebook and pen</li><li>Any materials specified in the course outline</li></ul><p>We look forward to seeing you!</p><p>GTS Training Team</p>',
 '{"course_name": "Course name", "student_name": "Student name", "start_date": "Start date", "start_time": "Start time", "location": "Venue address", "duration": "Course duration"}',
 'Sent 3 days before course starts'),

('course_completion',
 'Congratulations! Course Completed - {{course_name}}',
 '<h2>Congratulations!</h2><p>Dear {{student_name}},</p><p>Congratulations on successfully completing <strong>{{course_name}}</strong>!</p><p>Your certificate is attached to this email and is also available in your student portal.</p><p><strong>Course Summary:</strong></p><ul><li>Completion Date: {{completion_date}}</li><li>Final Score: {{final_score}}%</li><li>Attendance: {{attendance}}%</li></ul><p>We hope you found the course valuable and wish you all the best in your future endeavors!</p><p>Best regards,<br>GTS Training Team</p>',
 '{"course_name": "Course name", "student_name": "Student name", "completion_date": "Date completed", "final_score": "Final score percentage", "attendance": "Attendance percentage"}',
 'Sent when student completes a course'),

('waitlist_spot_available',
 'A Spot is Now Available - {{course_name}}',
 '<h2>Great News!</h2><p>Dear {{student_name}},</p><p>A spot has become available in <strong>{{course_name}}</strong>!</p><p>You have <strong>48 hours</strong> to claim this spot by completing your enrollment.</p><p><a href="{{enrollment_link}}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">Claim Your Spot</a></p><p>If you don''t claim your spot within 48 hours, it will be offered to the next person on the waitlist.</p><p>Don''t miss this opportunity!</p><p>GTS Training Team</p>',
 '{"course_name": "Course name", "student_name": "Student name", "enrollment_link": "Enrollment URL"}',
 'Sent when a waitlist spot becomes available')
ON CONFLICT (name) DO NOTHING;