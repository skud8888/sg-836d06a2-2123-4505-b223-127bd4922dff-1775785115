-- Add missing description column to activity_timeline
ALTER TABLE activity_timeline
ADD COLUMN IF NOT EXISTS description TEXT;