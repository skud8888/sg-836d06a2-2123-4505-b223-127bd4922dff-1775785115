-- Create course wishlist table
CREATE TABLE IF NOT EXISTS course_wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_template_id UUID NOT NULL REFERENCES course_templates(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  UNIQUE(student_id, course_template_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_wishlist_student ON course_wishlist(student_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_course ON course_wishlist(course_template_id);

-- RLS policies for wishlist
ALTER TABLE course_wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wishlist"
  ON course_wishlist FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Users can add to own wishlist"
  ON course_wishlist FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can remove from own wishlist"
  ON course_wishlist FOR DELETE
  USING (auth.uid() = student_id);

-- Add featured flag to course_templates
ALTER TABLE course_templates 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS featured_order INTEGER DEFAULT 0;

-- Create support messages table
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_from_student BOOLEAN DEFAULT true,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id UUID NOT NULL
);

-- Create index for chat sessions
CREATE INDEX IF NOT EXISTS idx_support_session ON support_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_support_student ON support_messages(student_id);

-- RLS policies for support messages
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own messages"
  ON support_messages FOR SELECT
  USING (auth.uid() = student_id OR auth.uid() = admin_id);

CREATE POLICY "Students can send messages"
  ON support_messages FOR INSERT
  WITH CHECK (auth.uid() = student_id AND is_from_student = true);

CREATE POLICY "Admins can view all messages"
  ON support_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin', 'receptionist')
    )
  );

CREATE POLICY "Admins can send messages"
  ON support_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin', 'receptionist')
    )
  );