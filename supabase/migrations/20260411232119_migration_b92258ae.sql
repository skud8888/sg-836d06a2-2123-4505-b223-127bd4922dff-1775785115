-- Create course modules table
CREATE TABLE IF NOT EXISTS course_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES course_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  duration_hours DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create course lessons table
CREATE TABLE IF NOT EXISTS course_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  duration_minutes INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learning objectives table
CREATE TABLE IF NOT EXISTS learning_objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  objective TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create course materials table
CREATE TABLE IF NOT EXISTS course_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_template_id UUID NOT NULL REFERENCES course_templates(id),
  student_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  payment_type TEXT,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  amount_due DECIMAL(10,2),
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  stripe_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_course_modules_course ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module ON course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_learning_objectives_lesson ON learning_objectives(lesson_id);
CREATE INDEX IF NOT EXISTS idx_course_materials_lesson ON course_materials(lesson_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_template_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- Enable RLS
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course content (admins and trainers can manage, public can view published)
CREATE POLICY "Public can view course modules"
ON course_modules FOR SELECT
USING (true);

CREATE POLICY "Admins can manage course modules"
ON course_modules FOR ALL
USING (check_user_role('super_admin') OR check_user_role('admin') OR check_user_role('trainer'));

CREATE POLICY "Public can view course lessons"
ON course_lessons FOR SELECT
USING (true);

CREATE POLICY "Admins can manage course lessons"
ON course_lessons FOR ALL
USING (check_user_role('super_admin') OR check_user_role('admin') OR check_user_role('trainer'));

CREATE POLICY "Public can view learning objectives"
ON learning_objectives FOR SELECT
USING (true);

CREATE POLICY "Admins can manage learning objectives"
ON learning_objectives FOR ALL
USING (check_user_role('super_admin') OR check_user_role('admin') OR check_user_role('trainer'));

CREATE POLICY "Public can view course materials"
ON course_materials FOR SELECT
USING (true);

CREATE POLICY "Admins can manage course materials"
ON course_materials FOR ALL
USING (check_user_role('super_admin') OR check_user_role('admin') OR check_user_role('trainer'));

-- RLS Policies for enrollments
CREATE POLICY "Students can view own enrollments"
ON enrollments FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all enrollments"
ON enrollments FOR SELECT
USING (check_user_role('super_admin') OR check_user_role('admin') OR check_user_role('trainer') OR check_user_role('receptionist'));

CREATE POLICY "Anyone can create enrollment"
ON enrollments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can update enrollments"
ON enrollments FOR UPDATE
USING (check_user_role('super_admin') OR check_user_role('admin') OR check_user_role('receptionist'));

CREATE POLICY "Admins can delete enrollments"
ON enrollments FOR DELETE
USING (check_user_role('super_admin') OR check_user_role('admin'));