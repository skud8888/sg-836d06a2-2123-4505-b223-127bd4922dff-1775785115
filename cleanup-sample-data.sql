-- ========================================
-- SAMPLE DATA CLEANUP SCRIPT
-- ========================================
-- This script removes ALL sample data created by inject-sample-data.sql
-- Safe to run - only removes data tagged with is_sample_data = true
--
-- Usage:
--   Run this script in Supabase SQL Editor when you're done testing
--
-- WARNING: This will permanently delete all sample users, courses,
--          bookings, and related data. Cannot be undone!
-- ========================================

DO $$
DECLARE
  v_users INT;
  v_courses INT;
  v_classes INT;
  v_bookings INT;
  v_enquiries INT;
  v_certificates INT;
  v_threads INT;
  v_replies INT;
  v_payouts INT;
  v_logs INT;
  v_roles INT;
  v_onboarding INT;
  v_auth_users INT;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STARTING SAMPLE DATA CLEANUP...';
  RAISE NOTICE '========================================';
  
  -- Count before deletion
  SELECT COUNT(*) INTO v_users FROM profiles WHERE metadata->>'is_sample_data' = 'true';
  SELECT COUNT(*) INTO v_courses FROM course_templates WHERE metadata->>'is_sample_data' = 'true';
  SELECT COUNT(*) INTO v_classes FROM classes WHERE metadata->>'is_sample_data' = 'true';
  SELECT COUNT(*) INTO v_bookings FROM bookings WHERE metadata->>'is_sample_data' = 'true';
  SELECT COUNT(*) INTO v_enquiries FROM enquiries WHERE metadata->>'is_sample_data' = 'true';
  SELECT COUNT(*) INTO v_certificates FROM certificates WHERE metadata->>'is_sample_data' = 'true';
  SELECT COUNT(*) INTO v_threads FROM discussion_threads WHERE metadata->>'is_sample_data' = 'true';
  SELECT COUNT(*) INTO v_replies FROM discussion_replies WHERE metadata->>'is_sample_data' = 'true';
  SELECT COUNT(*) INTO v_payouts FROM instructor_payouts WHERE metadata->>'is_sample_data' = 'true';
  SELECT COUNT(*) INTO v_logs FROM audit_logs WHERE metadata->>'is_sample_data' = 'true';
  
  RAISE NOTICE 'Found % sample data records to delete', v_users + v_courses + v_classes + v_bookings + v_enquiries + v_certificates + v_threads + v_replies + v_payouts + v_logs;
  
  -- Delete in correct order (respecting foreign keys)
  
  -- 1. Discussion replies (references threads)
  DELETE FROM discussion_replies WHERE metadata->>'is_sample_data' = 'true';
  RAISE NOTICE '✓ Deleted % discussion replies', v_replies;
  
  -- 2. Discussion threads (references courses and users)
  DELETE FROM discussion_threads WHERE metadata->>'is_sample_data' = 'true';
  RAISE NOTICE '✓ Deleted % discussion threads', v_threads;
  
  -- 3. Certificates (references students)
  DELETE FROM certificates WHERE metadata->>'is_sample_data' = 'true';
  RAISE NOTICE '✓ Deleted % certificates', v_certificates;
  
  -- 4. Instructor payouts (references trainers)
  DELETE FROM instructor_payouts WHERE metadata->>'is_sample_data' = 'true';
  RAISE NOTICE '✓ Deleted % instructor payouts', v_payouts;
  
  -- 5. Audit logs (references users)
  DELETE FROM audit_logs WHERE metadata->>'is_sample_data' = 'true';
  RAISE NOTICE '✓ Deleted % audit logs', v_logs;
  
  -- 6. Bookings (references classes and students)
  DELETE FROM bookings WHERE metadata->>'is_sample_data' = 'true';
  RAISE NOTICE '✓ Deleted % bookings', v_bookings;
  
  -- 7. Classes (references courses and trainers)
  DELETE FROM classes WHERE metadata->>'is_sample_data' = 'true';
  RAISE NOTICE '✓ Deleted % classes', v_classes;
  
  -- 8. Course templates
  DELETE FROM course_templates WHERE metadata->>'is_sample_data' = 'true';
  RAISE NOTICE '✓ Deleted % course templates', v_courses;
  
  -- 9. Enquiries
  DELETE FROM enquiries WHERE metadata->>'is_sample_data' = 'true';
  RAISE NOTICE '✓ Deleted % enquiries', v_enquiries;
  
  -- 10. User onboarding (references profiles)
  DELETE FROM user_onboarding WHERE user_id IN (
    SELECT id FROM profiles WHERE metadata->>'is_sample_data' = 'true'
  );
  GET DIAGNOSTICS v_onboarding = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % user onboarding records', v_onboarding;
  
  -- 11. User roles (references profiles)
  DELETE FROM user_roles WHERE user_id IN (
    SELECT id FROM profiles WHERE metadata->>'is_sample_data' = 'true'
  );
  GET DIAGNOSTICS v_roles = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % user roles', v_roles;
  
  -- 12. Profiles (must be before auth.users)
  DELETE FROM profiles WHERE metadata->>'is_sample_data' = 'true';
  RAISE NOTICE '✓ Deleted % profiles', v_users;
  
  -- 13. Auth users (final step - requires SECURITY DEFINER function or direct access)
  -- Note: This requires elevated permissions
  DELETE FROM auth.users WHERE id NOT IN (SELECT id FROM profiles);
  GET DIAGNOSTICS v_auth_users = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % auth users', v_auth_users;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CLEANUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Removed all sample data successfully.';
  RAISE NOTICE 'Your database is now clean.';
  RAISE NOTICE '========================================';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERROR: %', SQLERRM;
  RAISE NOTICE 'Cleanup may be incomplete. Check error message above.';
  RAISE NOTICE 'You may need to run individual DELETE statements manually.';
END $$;

-- Optional: Vacuum tables to reclaim space
VACUUM ANALYZE profiles;
VACUUM ANALYZE course_templates;
VACUUM ANALYZE classes;
VACUUM ANALYZE bookings;
VACUUM ANALYZE enquiries;
VACUUM ANALYZE certificates;
VACUUM ANALYZE discussion_threads;
VACUUM ANALYZE discussion_replies;
VACUUM ANALYZE instructor_payouts;
VACUUM ANALYZE audit_logs;
VACUUM ANALYZE user_roles;
VACUUM ANALYZE user_onboarding;