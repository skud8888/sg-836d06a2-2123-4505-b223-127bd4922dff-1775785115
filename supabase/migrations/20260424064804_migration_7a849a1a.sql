-- Add has_seen_admin_tour column to notification_preferences table
ALTER TABLE notification_preferences 
ADD COLUMN IF NOT EXISTS has_seen_admin_tour BOOLEAN DEFAULT false;

-- Update existing users to not show tour (only new users will see it)
UPDATE notification_preferences 
SET has_seen_admin_tour = false 
WHERE has_seen_admin_tour IS NULL;

SELECT 'Admin tour tracking enabled' as status;