-- Add missing column to notification_preferences
ALTER TABLE notification_preferences 
ADD COLUMN IF NOT EXISTS has_seen_admin_dashboard_tutorial BOOLEAN DEFAULT false;