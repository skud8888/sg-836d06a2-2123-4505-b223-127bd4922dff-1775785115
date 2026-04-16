-- Create gamification tables
CREATE TABLE IF NOT EXISTS student_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  points_to_next_level INTEGER DEFAULT 100,
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id)
);

CREATE TABLE IF NOT EXISTS student_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  points_awarded INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT,
  total_points INTEGER,
  rank INTEGER,
  badges_count INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id)
);

-- Create course recommendations table
CREATE TABLE IF NOT EXISTS course_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_template_id UUID NOT NULL REFERENCES course_templates(id) ON DELETE CASCADE,
  recommendation_score DECIMAL(3,2) DEFAULT 0.0,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_template_id)
);

-- RLS Policies for gamification tables
ALTER TABLE student_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_recommendations ENABLE ROW LEVEL SECURITY;

-- Students can view their own gamification data
CREATE POLICY "students_select_own_points" ON student_points FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "students_select_own_badges" ON student_badges FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "students_select_own_transactions" ON point_transactions FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "students_select_own_recommendations" ON course_recommendations FOR SELECT USING (auth.uid() = student_id);

-- Everyone can view leaderboard
CREATE POLICY "public_read_leaderboard" ON leaderboard_cache FOR SELECT USING (true);

-- Admins can manage all gamification data
CREATE POLICY "admins_manage_points" ON student_points FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "admins_manage_badges" ON student_badges FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "admins_manage_transactions" ON point_transactions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "admins_manage_recommendations" ON course_recommendations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
  )
);

-- Function to award points and update student level
CREATE OR REPLACE FUNCTION award_points(
  p_student_id UUID,
  p_points INTEGER,
  p_action_type TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_current_points INTEGER;
  v_new_points INTEGER;
  v_current_level INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Insert point transaction
  INSERT INTO point_transactions (student_id, points, action_type, description)
  VALUES (p_student_id, p_points, p_action_type, p_description);

  -- Update or insert student points
  INSERT INTO student_points (student_id, total_points, current_level, last_activity_date)
  VALUES (p_student_id, p_points, 1, CURRENT_DATE)
  ON CONFLICT (student_id) DO UPDATE
  SET 
    total_points = student_points.total_points + p_points,
    last_activity_date = CURRENT_DATE,
    updated_at = NOW();

  -- Get current points and calculate new level
  SELECT total_points, current_level INTO v_current_points, v_current_level
  FROM student_points
  WHERE student_id = p_student_id;

  -- Simple level calculation: level = floor(sqrt(total_points / 100)) + 1
  v_new_level := FLOOR(SQRT(v_current_points::DECIMAL / 100)) + 1;

  -- Update level if changed
  IF v_new_level > v_current_level THEN
    UPDATE student_points
    SET current_level = v_new_level,
        points_to_next_level = (POWER(v_new_level, 2) * 100) - v_current_points
    WHERE student_id = p_student_id;
  ELSE
    UPDATE student_points
    SET points_to_next_level = (POWER(v_current_level + 1, 2) * 100) - v_current_points
    WHERE student_id = p_student_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check and update daily streak
CREATE OR REPLACE FUNCTION update_daily_streak(p_student_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_new_streak INTEGER;
BEGIN
  SELECT last_activity_date, streak_days INTO v_last_activity, v_current_streak
  FROM student_points
  WHERE student_id = p_student_id;

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO student_points (student_id, streak_days, last_activity_date)
    VALUES (p_student_id, 1, CURRENT_DATE);
    RETURN 1;
  END IF;

  -- Check if activity is today
  IF v_last_activity = CURRENT_DATE THEN
    RETURN v_current_streak;
  END IF;

  -- Check if activity was yesterday (continue streak)
  IF v_last_activity = CURRENT_DATE - INTERVAL '1 day' THEN
    v_new_streak := v_current_streak + 1;
    
    UPDATE student_points
    SET streak_days = v_new_streak,
        last_activity_date = CURRENT_DATE
    WHERE student_id = p_student_id;

    -- Award streak milestone badges
    IF v_new_streak = 7 THEN
      INSERT INTO student_badges (student_id, badge_type, badge_name, badge_description, points_awarded)
      VALUES (p_student_id, 'streak', '7-Day Warrior', 'Maintained a 7-day learning streak', 50);
      PERFORM award_points(p_student_id, 50, 'streak_milestone', '7-day streak achieved');
    ELSIF v_new_streak = 30 THEN
      INSERT INTO student_badges (student_id, badge_type, badge_name, badge_description, points_awarded)
      VALUES (p_student_id, 'streak', 'Monthly Master', 'Maintained a 30-day learning streak', 200);
      PERFORM award_points(p_student_id, 200, 'streak_milestone', '30-day streak achieved');
    ELSIF v_new_streak = 100 THEN
      INSERT INTO student_badges (student_id, badge_type, badge_name, badge_description, points_awarded)
      VALUES (p_student_id, 'streak', 'Centurion', 'Maintained a 100-day learning streak', 500);
      PERFORM award_points(p_student_id, 500, 'streak_milestone', '100-day streak achieved');
    END IF;

    RETURN v_new_streak;
  ELSE
    -- Streak broken, reset to 1
    UPDATE student_points
    SET streak_days = 1,
        last_activity_date = CURRENT_DATE
    WHERE student_id = p_student_id;
    
    RETURN 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to generate course recommendations
CREATE OR REPLACE FUNCTION generate_course_recommendations(p_student_id UUID)
RETURNS void AS $$
DECLARE
  v_enrolled_courses UUID[];
  v_wishlist_courses UUID[];
  v_completed_courses UUID[];
BEGIN
  -- Get student's enrolled and completed courses
  SELECT ARRAY_AGG(course_template_id) INTO v_enrolled_courses
  FROM enrollments
  WHERE student_id = p_student_id;

  SELECT ARRAY_AGG(course_template_id) INTO v_wishlist_courses
  FROM course_wishlist
  WHERE student_id = p_student_id;

  SELECT ARRAY_AGG(e.course_template_id) INTO v_completed_courses
  FROM enrollments e
  JOIN student_progress sp ON sp.enrollment_id = e.id
  WHERE e.student_id = p_student_id AND sp.status = 'completed';

  -- Clear old recommendations
  DELETE FROM course_recommendations WHERE student_id = p_student_id;

  -- Recommend courses that similar students enrolled in
  INSERT INTO course_recommendations (student_id, course_template_id, recommendation_score, reason)
  SELECT 
    p_student_id,
    e2.course_template_id,
    0.8,
    'Students who took your courses also enrolled in this'
  FROM enrollments e1
  JOIN enrollments e2 ON e1.student_id != e2.student_id
  WHERE e1.student_id = p_student_id
    AND e1.course_template_id = ANY(v_enrolled_courses)
    AND e2.course_template_id != ALL(COALESCE(v_enrolled_courses, ARRAY[]::UUID[]))
    AND e2.course_template_id != ALL(COALESCE(v_wishlist_courses, ARRAY[]::UUID[]))
  GROUP BY e2.course_template_id
  HAVING COUNT(DISTINCT e2.student_id) >= 2
  LIMIT 5
  ON CONFLICT (student_id, course_template_id) DO NOTHING;

  -- Recommend highly rated courses
  INSERT INTO course_recommendations (student_id, course_template_id, recommendation_score, reason)
  SELECT 
    p_student_id,
    cf.course_template_id,
    0.7,
    'Highly rated by other students'
  FROM course_feedback cf
  WHERE cf.overall_rating >= 4
    AND cf.course_template_id != ALL(COALESCE(v_enrolled_courses, ARRAY[]::UUID[]))
    AND cf.course_template_id != ALL(COALESCE(v_wishlist_courses, ARRAY[]::UUID[]))
  GROUP BY cf.course_template_id
  HAVING AVG(cf.overall_rating) >= 4.0
  LIMIT 3
  ON CONFLICT (student_id, course_template_id) DO NOTHING;

  -- Recommend trending courses (most recent enrollments)
  INSERT INTO course_recommendations (student_id, course_template_id, recommendation_score, reason)
  SELECT 
    p_student_id,
    e.course_template_id,
    0.6,
    'Popular course - many recent enrollments'
  FROM enrollments e
  WHERE e.created_at >= NOW() - INTERVAL '30 days'
    AND e.course_template_id != ALL(COALESCE(v_enrolled_courses, ARRAY[]::UUID[]))
    AND e.course_template_id != ALL(COALESCE(v_wishlist_courses, ARRAY[]::UUID[]))
  GROUP BY e.course_template_id
  HAVING COUNT(*) >= 5
  LIMIT 3
  ON CONFLICT (student_id, course_template_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;