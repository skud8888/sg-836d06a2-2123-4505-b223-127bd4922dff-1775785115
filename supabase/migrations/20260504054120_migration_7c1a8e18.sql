-- Step 1: Drop existing table if needed (clean slate)
DROP TABLE IF EXISTS public.course_wishlist CASCADE;

-- Step 2: Create course_wishlist table with proper constraints
CREATE TABLE IF NOT EXISTS public.course_wishlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_template_id UUID NOT NULL REFERENCES public.course_templates(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, course_template_id)
);

-- Step 3: Add helpful comment
COMMENT ON TABLE public.course_wishlist IS 'Student course wishlist - tracks courses students are interested in';

-- Step 4: Create index for performance
CREATE INDEX IF NOT EXISTS idx_wishlist_student ON public.course_wishlist(student_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_course ON public.course_wishlist(course_template_id);

-- Step 5: Enable RLS
ALTER TABLE public.course_wishlist ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies
CREATE POLICY "Users can view their own wishlist" 
ON public.course_wishlist 
FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Users can insert to their own wishlist" 
ON public.course_wishlist 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can delete from their own wishlist" 
ON public.course_wishlist 
FOR DELETE 
USING (auth.uid() = student_id);

-- Step 7: Grant permissions
GRANT SELECT, INSERT, DELETE ON public.course_wishlist TO authenticated;
GRANT SELECT ON public.course_wishlist TO anon;

-- Step 8: Force PostgREST schema reload
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';