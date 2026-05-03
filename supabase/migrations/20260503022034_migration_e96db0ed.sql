-- Add missing status column to course_templates
ALTER TABLE course_templates
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft', 'archived'));