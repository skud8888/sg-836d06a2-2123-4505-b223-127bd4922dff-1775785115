-- Create batch reports table
CREATE TABLE IF NOT EXISTS batch_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'custom')),
  report_name TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES profiles(id),
  file_url TEXT,
  recipients TEXT[],
  status TEXT CHECK (status IN ('pending', 'generating', 'sent', 'failed')) DEFAULT 'pending',
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create student AI insights table (student-facing)
CREATE TABLE IF NOT EXISTS student_ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('learning_pattern', 'strength', 'improvement_area', 'recommendation', 'milestone')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data JSONB,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Create push notification subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Create notification queue table
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  icon TEXT,
  badge TEXT,
  url TEXT,
  status TEXT CHECK (status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for batch_reports
ALTER TABLE batch_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_view_reports" ON batch_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "admin_create_reports" ON batch_reports FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- RLS Policies for student_ai_insights
ALTER TABLE student_ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_view_own_insights" ON student_ai_insights FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "students_update_own_insights" ON student_ai_insights FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- RLS Policies for push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_subscriptions" ON push_subscriptions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for notification_queue
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_notifications" ON notification_queue FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "admin_manage_all_notifications" ON notification_queue FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Function to generate student AI insights
CREATE OR REPLACE FUNCTION generate_student_insights(student_uuid UUID)
RETURNS void AS $$
DECLARE
  total_courses INT;
  completed_courses INT;
  avg_completion_rate FLOAT;
  streak_days INT;
  total_points INT;
BEGIN
  -- Get student stats
  SELECT COUNT(*) INTO total_courses
  FROM enrollments
  WHERE student_id = student_uuid;

  SELECT COUNT(*) INTO completed_courses
  FROM enrollments
  WHERE student_id = student_uuid AND status = 'completed';

  SELECT COALESCE(AVG(completion_percentage), 0) INTO avg_completion_rate
  FROM student_progress
  WHERE enrollment_id IN (
    SELECT id FROM enrollments WHERE student_id = student_uuid
  );

  SELECT COALESCE(streak_days, 0) INTO streak_days
  FROM student_points
  WHERE student_id = student_uuid;

  SELECT COALESCE(total_points, 0) INTO total_points
  FROM student_points
  WHERE student_id = student_uuid;

  -- Delete old insights (keep last 30 days)
  DELETE FROM student_ai_insights
  WHERE student_id = student_uuid
  AND created_at < NOW() - INTERVAL '30 days';

  -- Learning Pattern Insight
  IF avg_completion_rate > 80 THEN
    INSERT INTO student_ai_insights (student_id, insight_type, title, description, priority, data)
    VALUES (
      student_uuid,
      'learning_pattern',
      'Excellent Progress!',
      'You maintain an average course completion rate of ' || ROUND(avg_completion_rate) || '%. Keep up the great work!',
      'high',
      jsonb_build_object('completion_rate', avg_completion_rate)
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Strength Insight (High Points)
  IF total_points > 500 THEN
    INSERT INTO student_ai_insights (student_id, insight_type, title, description, priority, data)
    VALUES (
      student_uuid,
      'strength',
      'Top Performer',
      'You''ve earned ' || total_points || ' points! You''re in the top tier of learners.',
      'high',
      jsonb_build_object('points', total_points)
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Streak Insight
  IF streak_days >= 7 THEN
    INSERT INTO student_ai_insights (student_id, insight_type, title, description, priority, data)
    VALUES (
      student_uuid,
      'milestone',
      'Amazing Streak!',
      'You''ve maintained a ' || streak_days || '-day learning streak. Consistency is key to success!',
      'high',
      jsonb_build_object('streak', streak_days)
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Improvement Area (Low Completion)
  IF avg_completion_rate < 30 AND total_courses > 0 THEN
    INSERT INTO student_ai_insights (student_id, insight_type, title, description, priority, data)
    VALUES (
      student_uuid,
      'improvement_area',
      'Course Completion Focus',
      'Consider focusing on completing your current courses before enrolling in new ones. Average completion: ' || ROUND(avg_completion_rate) || '%',
      'medium',
      jsonb_build_object('completion_rate', avg_completion_rate)
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Recommendation (Course Variety)
  IF completed_courses >= 3 THEN
    INSERT INTO student_ai_insights (student_id, insight_type, title, description, priority, data)
    VALUES (
      student_uuid,
      'recommendation',
      'Explore New Topics',
      'You''ve completed ' || completed_courses || ' courses! Consider exploring new subject areas to broaden your skills.',
      'medium',
      jsonb_build_object('completed', completed_courses)
    )
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to schedule batch report
CREATE OR REPLACE FUNCTION schedule_batch_report(
  report_type_param TEXT,
  report_name_param TEXT,
  recipients_param TEXT[]
)
RETURNS UUID AS $$
DECLARE
  report_id UUID;
BEGIN
  INSERT INTO batch_reports (report_type, report_name, recipients, status)
  VALUES (report_type_param, report_name_param, recipients_param, 'pending')
  RETURNING id INTO report_id;
  
  RETURN report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;