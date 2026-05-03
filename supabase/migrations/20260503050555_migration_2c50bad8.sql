-- Create missing course_wishlist table
CREATE TABLE IF NOT EXISTS public.course_wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_template_id UUID NOT NULL REFERENCES course_templates(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_template_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_wishlist_student ON course_wishlist(student_id);
CREATE INDEX IF NOT EXISTS idx_course_wishlist_course ON course_wishlist(course_template_id);

-- RLS policies
ALTER TABLE course_wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_wishlist" ON course_wishlist
  FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "public_view_wishlist_counts" ON course_wishlist
  FOR SELECT USING (true);

GRANT ALL ON course_wishlist TO authenticated;
GRANT SELECT ON course_wishlist TO anon;

-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';