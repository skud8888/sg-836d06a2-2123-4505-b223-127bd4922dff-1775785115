-- ============================================
-- QUICK SETUP: First Super Admin User
-- ============================================
-- 
-- INSTRUCTIONS:
-- 1. First, create a user in Supabase Dashboard:
--    Authentication → Users → Add user
--    - Email: your-email@example.com
--    - Password: YourSecurePassword123!
--    - Auto Confirm: ON
--
-- 2. Replace 'YOUR-EMAIL-HERE' below with the email you just created
-- 3. Run this entire script in Supabase SQL Editor
-- 4. Login at: http://localhost:3000/admin/login
--
-- ============================================

-- Replace this email with your actual email:
DO $$
DECLARE
    v_user_id uuid;
    v_email text := 'YOUR-EMAIL-HERE@example.com'; -- ← CHANGE THIS!
BEGIN
    -- Find the user
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email;
    
    -- Check if user exists
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found! Make sure you created the user in Supabase Dashboard first and the email matches exactly.';
    END IF;
    
    -- Assign super_admin role
    INSERT INTO user_roles (user_id, role, assigned_by)
    VALUES (v_user_id, 'super_admin', v_user_id)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Create notification preferences with good defaults
    INSERT INTO notification_preferences (
        user_id,
        email_new_booking,
        email_payment_received,
        email_new_enquiry,
        sms_new_booking,
        daily_digest,
        digest_time
    )
    VALUES (
        v_user_id,
        true,  -- Get emails for new bookings
        true,  -- Get emails for payments
        true,  -- Get emails for enquiries
        true,  -- Get SMS for urgent bookings
        true,  -- Daily summary email
        '09:00:00'  -- Digest at 9 AM
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE '✅ SUCCESS! Super Admin created for: %', v_email;
    RAISE NOTICE 'Login at: http://localhost:3000/admin/login';
END $$;

-- Verify everything worked:
SELECT 
    '✅ User Details' as status,
    u.email,
    u.created_at,
    ur.role,
    ur.assigned_at as role_assigned,
    CASE WHEN np.user_id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_preferences
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN notification_preferences np ON u.id = np.user_id
WHERE u.email = 'YOUR-EMAIL-HERE@example.com'; -- ← CHANGE THIS TOO!

-- Show notification preferences
SELECT 
    '✅ Notification Settings' as status,
    email_new_booking,
    email_payment_received,
    sms_new_booking,
    daily_digest,
    digest_time
FROM notification_preferences np
JOIN auth.users u ON np.user_id = u.id
WHERE u.email = 'YOUR-EMAIL-HERE@example.com'; -- ← AND THIS!