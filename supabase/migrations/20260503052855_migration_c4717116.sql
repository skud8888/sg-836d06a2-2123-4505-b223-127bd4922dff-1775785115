-- Drop and recreate course_wishlist table to ensure PostgREST sees it
DROP TABLE IF EXISTS public.course_wishlist CASCADE;

CREATE TABLE public.course_wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_template_id UUID NOT NULL REFERENCES course_templates(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_template_id)
);

-- Enable RLS
ALTER TABLE public.course_wishlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own wishlist"
  ON public.course_wishlist
  FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Users can add to their own wishlist"
  ON public.course_wishlist
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can remove from their own wishlist"
  ON public.course_wishlist
  FOR DELETE
  USING (auth.uid() = student_id);

-- Indexes for performance
CREATE INDEX idx_wishlist_student ON public.course_wishlist(student_id);
CREATE INDEX idx_wishlist_course ON public.course_wishlist(course_template_id);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.course_wishlist TO authenticated;
GRANT SELECT ON public.course_wishlist TO anon;

-- Force PostgREST schema reload
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';