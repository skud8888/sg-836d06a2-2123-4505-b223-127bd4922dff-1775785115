-- Add missing capacity column to scheduled_classes
ALTER TABLE scheduled_classes
ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS current_enrollment INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS location TEXT;