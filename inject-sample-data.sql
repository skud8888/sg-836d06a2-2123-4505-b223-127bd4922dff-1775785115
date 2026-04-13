-- ========================================
-- SAMPLE DATA INJECTION SCRIPT
-- ========================================
-- This script populates your Training Centre database with realistic sample data
-- All sample data is tagged with metadata for easy identification and removal
-- 
-- Usage:
--   1. Run this script in Supabase SQL Editor
--   2. Explore the app with populated data
--   3. Run cleanup-sample-data.sql when done
--
-- Note: This creates 10 students, 3 trainers, 2 admins, 15 courses, 30 bookings, etc.
-- ========================================

-- First, let's create a helper function to generate sample users
CREATE OR REPLACE FUNCTION create_sample_user(
  p_email TEXT,
  p_password TEXT DEFAULT 'SamplePass123!',
  p_full_name TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Create auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', COALESCE(p_full_name, split_part(p_email, '@', 1))),
    NOW(),
    NOW(),
    '',
    ''
  ) RETURNING id INTO v_user_id;

  -- Profile is auto-created by trigger
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 1. CREATE SAMPLE USERS
-- ========================================

-- Students (10 users)
DO $$
DECLARE
  v_user_id UUID;
  v_student_emails TEXT[] := ARRAY[
    'alice.smith@example.com',
    'bob.jones@example.com',
    'carol.white@example.com',
    'david.brown@example.com',
    'emma.davis@example.com',
    'frank.wilson@example.com',
    'grace.taylor@example.com',
    'henry.moore@example.com',
    'iris.anderson@example.com',
    'jack.thomas@example.com'
  ];
  v_student_names TEXT[] := ARRAY[
    'Alice Smith',
    'Bob Jones',
    'Carol White',
    'David Brown',
    'Emma Davis',
    'Frank Wilson',
    'Grace Taylor',
    'Henry Moore',
    'Iris Anderson',
    'Jack Thomas'
  ];
BEGIN
  FOR i IN 1..10 LOOP
    v_user_id := create_sample_user(v_student_emails[i], 'SamplePass123!', v_student_names[i]);
    
    -- Assign student role
    INSERT INTO user_roles (user_id, role) VALUES (v_user_id, 'student');
    
    -- Tag as sample data
    UPDATE profiles 
    SET metadata = jsonb_build_object('is_sample_data', true, 'created_by', 'sample_data_script')
    WHERE id = v_user_id;
  END LOOP;
END $$;

-- Trainers (3 users)
DO $$
DECLARE
  v_user_id UUID;
  v_trainer_emails TEXT[] := ARRAY[
    'sarah.instructor@example.com',
    'mike.trainer@example.com',
    'lisa.coach@example.com'
  ];
  v_trainer_names TEXT[] := ARRAY[
    'Sarah Johnson',
    'Mike Rodriguez',
    'Lisa Chen'
  ];
BEGIN
  FOR i IN 1..3 LOOP
    v_user_id := create_sample_user(v_trainer_emails[i], 'SamplePass123!', v_trainer_names[i]);
    
    -- Assign trainer role
    INSERT INTO user_roles (user_id, role) VALUES (v_user_id, 'trainer');
    
    -- Tag as sample data
    UPDATE profiles 
    SET metadata = jsonb_build_object('is_sample_data', true, 'created_by', 'sample_data_script')
    WHERE id = v_user_id;
  END LOOP;
END $$;

-- Admins (2 users)
DO $$
DECLARE
  v_user_id UUID;
  v_admin_emails TEXT[] := ARRAY[
    'admin.demo@example.com',
    'manager.demo@example.com'
  ];
  v_admin_names TEXT[] := ARRAY[
    'Demo Admin',
    'Demo Manager'
  ];
BEGIN
  FOR i IN 1..2 LOOP
    v_user_id := create_sample_user(v_admin_emails[i], 'SamplePass123!', v_admin_names[i]);
    
    -- Assign admin role
    INSERT INTO user_roles (user_id, role) VALUES (v_user_id, 'admin');
    
    -- Tag as sample data
    UPDATE profiles 
    SET metadata = jsonb_build_object('is_sample_data', true, 'created_by', 'sample_data_script')
    WHERE id = v_user_id;
  END LOOP;
END $$;

-- ========================================
-- 2. CREATE SAMPLE COURSE TEMPLATES
-- ========================================

INSERT INTO course_templates (title, description, category, duration_hours, price, max_students, metadata)
VALUES
  ('First Aid & CPR Certification', 'Comprehensive first aid and CPR training including AED usage. Nationally recognized certification.', 'Health & Safety', 8, 199.00, 15, '{"is_sample_data": true}'),
  ('Forklift Operation License', 'Complete forklift training program covering safety, operation, and certification requirements.', 'Equipment Operation', 16, 450.00, 12, '{"is_sample_data": true}'),
  ('Workplace Safety Induction', 'Essential workplace safety training for all new employees. Covers WHS regulations and procedures.', 'Health & Safety', 4, 99.00, 20, '{"is_sample_data": true}'),
  ('Advanced Excel for Business', 'Master Excel formulas, pivot tables, macros, and data analysis for business applications.', 'Business Skills', 12, 299.00, 18, '{"is_sample_data": true}'),
  ('Project Management Fundamentals', 'Introduction to project management methodologies, tools, and best practices.', 'Business Skills', 16, 399.00, 15, '{"is_sample_data": true}'),
  ('Manual Handling Training', 'Prevent workplace injuries with proper manual handling techniques and ergonomic practices.', 'Health & Safety', 3, 79.00, 25, '{"is_sample_data": true}'),
  ('Customer Service Excellence', 'Develop exceptional customer service skills for frontline staff and service teams.', 'Soft Skills', 8, 249.00, 20, '{"is_sample_data": true}'),
  ('Warehouse Management Systems', 'Learn WMS software, inventory control, and warehouse optimization strategies.', 'Logistics', 12, 349.00, 14, '{"is_sample_data": true}'),
  ('Leadership & Team Building', 'Essential leadership skills for supervisors and team leaders. Build high-performing teams.', 'Leadership', 16, 499.00, 12, '{"is_sample_data": true}'),
  ('Confined Space Entry', 'Safety training for working in confined spaces. Covers permits, testing, and rescue procedures.', 'Health & Safety', 8, 299.00, 10, '{"is_sample_data": true}'),
  ('Basic Computer Skills', 'Introduction to computers, Windows, email, and internet for beginners.', 'Technology', 6, 149.00, 15, '{"is_sample_data": true}'),
  ('Conflict Resolution Skills', 'Learn to manage and resolve workplace conflicts effectively and professionally.', 'Soft Skills', 4, 199.00, 18, '{"is_sample_data": true}'),
  ('Food Safety Certification', 'Food handler certification covering hygiene, storage, and safety regulations.', 'Food Service', 4, 129.00, 20, '{"is_sample_data": true}'),
  ('Time Management Mastery', 'Boost productivity with proven time management techniques and organizational skills.', 'Soft Skills', 6, 179.00, 20, '{"is_sample_data": true}'),
  ('Introduction to Accounting', 'Learn accounting fundamentals, bookkeeping, and financial statement basics.', 'Business Skills', 20, 549.00, 16, '{"is_sample_data": true}');

-- ========================================
-- 3. CREATE SAMPLE CLASSES (Scheduled Sessions)
-- ========================================

DO $$
DECLARE
  v_course_id UUID;
  v_trainer_id UUID;
  v_start_date TIMESTAMP;
  v_courses CURSOR FOR SELECT id FROM course_templates WHERE metadata->>'is_sample_data' = 'true' LIMIT 10;
  v_trainers UUID[] := ARRAY(SELECT id FROM profiles WHERE metadata->>'is_sample_data' = 'true' AND id IN (SELECT user_id FROM user_roles WHERE role = 'trainer'));
BEGIN
  OPEN v_courses;
  
  FOR i IN 1..30 LOOP
    FETCH v_courses INTO v_course_id;
    IF NOT FOUND THEN
      -- Reset cursor when we run out
      CLOSE v_courses;
      OPEN v_courses;
      FETCH v_courses INTO v_course_id;
    END IF;
    
    -- Create classes in the past, present, and future
    v_start_date := NOW() + (INTERVAL '1 day' * (i - 15));
    
    INSERT INTO classes (
      course_template_id,
      start_date,
      end_date,
      status,
      current_students,
      trainer_id,
      location,
      metadata
    ) VALUES (
      v_course_id,
      v_start_date,
      v_start_date + INTERVAL '1 week',
      CASE 
        WHEN i <= 10 THEN 'completed'
        WHEN i <= 25 THEN 'scheduled'
        ELSE 'upcoming'
      END,
      FLOOR(RANDOM() * 8) + 3,
      v_trainers[1 + MOD(i, ARRAY_LENGTH(v_trainers, 1))],
      CASE MOD(i, 3)
        WHEN 0 THEN 'Brisbane Training Centre - Room A'
        WHEN 1 THEN 'Brisbane Training Centre - Room B'
        ELSE 'Gold Coast Campus - Main Hall'
      END,
      '{"is_sample_data": true}'
    );
  END LOOP;
  
  CLOSE v_courses;
END $$;

-- ========================================
-- 4. CREATE SAMPLE BOOKINGS
-- ========================================

DO $$
DECLARE
  v_class_id UUID;
  v_student_id UUID;
  v_classes UUID[] := ARRAY(SELECT id FROM classes WHERE metadata->>'is_sample_data' = 'true');
  v_students UUID[] := ARRAY(SELECT id FROM profiles WHERE metadata->>'is_sample_data' = 'true' AND id IN (SELECT user_id FROM user_roles WHERE role = 'student'));
  v_booking_count INT := 0;
BEGIN
  -- Create bookings for each class
  FOR i IN 1..ARRAY_LENGTH(v_classes, 1) LOOP
    v_class_id := v_classes[i];
    
    -- Add 3-8 random students per class
    FOR j IN 1..(3 + FLOOR(RANDOM() * 6)) LOOP
      v_student_id := v_students[1 + FLOOR(RANDOM() * ARRAY_LENGTH(v_students, 1))];
      
      -- Avoid duplicate bookings
      IF NOT EXISTS (SELECT 1 FROM bookings WHERE class_id = v_class_id AND student_id = v_student_id) THEN
        INSERT INTO bookings (
          class_id,
          student_id,
          status,
          payment_status,
          amount_paid,
          metadata
        ) VALUES (
          v_class_id,
          v_student_id,
          CASE FLOOR(RANDOM() * 10)
            WHEN 0 THEN 'cancelled'
            WHEN 1 THEN 'pending'
            ELSE 'confirmed'
          END,
          CASE FLOOR(RANDOM() * 10)
            WHEN 0 THEN 'pending'
            WHEN 1 THEN 'refunded'
            ELSE 'paid'
          END,
          99 + FLOOR(RANDOM() * 400),
          '{"is_sample_data": true}'
        );
        
        v_booking_count := v_booking_count + 1;
      END IF;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Created % sample bookings', v_booking_count;
END $$;

-- ========================================
-- 5. CREATE SAMPLE ENQUIRIES
-- ========================================

INSERT INTO enquiries (name, email, phone, message, status, metadata)
VALUES
  ('Jennifer Williams', 'jennifer.w@example.com', '0412345678', 'I''m interested in the First Aid certification. Do you offer evening classes?', 'responded', '{"is_sample_data": true}'),
  ('Robert Lee', 'robert.lee@example.com', '0423456789', 'What are the requirements for the Forklift Operation course?', 'open', '{"is_sample_data": true}'),
  ('Michelle Zhang', 'michelle.z@example.com', '0434567890', 'Can I get a group discount for 5 employees?', 'responded', '{"is_sample_data": true}'),
  ('James Martinez', 'james.m@example.com', '0445678901', 'Do you provide onsite training at our facility?', 'open', '{"is_sample_data": true}'),
  ('Patricia Kumar', 'patricia.k@example.com', '0456789012', 'Is the Excel course suitable for beginners?', 'closed', '{"is_sample_data": true}'),
  ('Thomas Anderson', 'thomas.a@example.com', '0467890123', 'I need urgent First Aid training for my team. Next available date?', 'responded', '{"is_sample_data": true}'),
  ('Susan Taylor', 'susan.t@example.com', '0478901234', 'Can I pay in installments for the Project Management course?', 'open', '{"is_sample_data": true}'),
  ('Christopher Brown', 'chris.b@example.com', '0489012345', 'What certification do I receive after completing the course?', 'closed', '{"is_sample_data": true}'),
  ('Linda Nguyen', 'linda.n@example.com', '0490123456', 'Do you offer corporate training packages?', 'responded', '{"is_sample_data": true}'),
  ('Daniel Garcia', 'daniel.g@example.com', '0401234567', 'I missed my scheduled class. Can I reschedule?', 'open', '{"is_sample_data": true}');

-- ========================================
-- 6. CREATE SAMPLE CERTIFICATES
-- ========================================

DO $$
DECLARE
  v_booking_id UUID;
  v_student_id UUID;
  v_course_title TEXT;
  v_completed_bookings CURSOR FOR 
    SELECT b.id, b.student_id, ct.title
    FROM bookings b
    JOIN classes c ON b.class_id = c.id
    JOIN course_templates ct ON c.course_template_id = ct.id
    WHERE b.status = 'confirmed' 
      AND c.status = 'completed'
      AND b.metadata->>'is_sample_data' = 'true'
    LIMIT 15;
BEGIN
  OPEN v_completed_bookings;
  
  LOOP
    FETCH v_completed_bookings INTO v_booking_id, v_student_id, v_course_title;
    EXIT WHEN NOT FOUND;
    
    INSERT INTO certificates (
      student_id,
      course_title,
      issue_date,
      verification_code,
      pdf_url,
      metadata
    ) VALUES (
      v_student_id,
      v_course_title,
      NOW() - INTERVAL '1 day' * FLOOR(RANDOM() * 30),
      'CERT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10)),
      'https://example.com/certificates/' || gen_random_uuid() || '.pdf',
      '{"is_sample_data": true, "booking_id": "' || v_booking_id || '"}'
    );
  END LOOP;
  
  CLOSE v_completed_bookings;
END $$;

-- ========================================
-- 7. CREATE SAMPLE DISCUSSION THREADS
-- ========================================

DO $$
DECLARE
  v_course_id UUID;
  v_student_id UUID;
  v_trainer_id UUID;
  v_thread_id UUID;
  v_courses UUID[] := ARRAY(SELECT id FROM course_templates WHERE metadata->>'is_sample_data' = 'true' LIMIT 5);
  v_students UUID[] := ARRAY(SELECT id FROM profiles WHERE metadata->>'is_sample_data' = 'true' AND id IN (SELECT user_id FROM user_roles WHERE role = 'student') LIMIT 5);
  v_trainers UUID[] := ARRAY(SELECT id FROM profiles WHERE metadata->>'is_sample_data' = 'true' AND id IN (SELECT user_id FROM user_roles WHERE role = 'trainer'));
BEGIN
  -- Create 10 threads
  FOR i IN 1..10 LOOP
    v_course_id := v_courses[1 + MOD(i, ARRAY_LENGTH(v_courses, 1))];
    v_student_id := v_students[1 + MOD(i, ARRAY_LENGTH(v_students, 1))];
    
    INSERT INTO discussion_threads (
      course_id,
      user_id,
      title,
      content,
      upvotes,
      is_answered,
      metadata
    ) VALUES (
      v_course_id,
      v_student_id,
      CASE MOD(i, 5)
        WHEN 0 THEN 'Question about final assessment'
        WHEN 1 THEN 'Study materials available?'
        WHEN 2 THEN 'Clarification on safety procedures'
        WHEN 3 THEN 'Best practices for practical exam'
        ELSE 'Additional resources needed'
      END,
      'This is sample discussion content for thread #' || i || '. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      FLOOR(RANDOM() * 15),
      RANDOM() > 0.5,
      '{"is_sample_data": true}'
    ) RETURNING id INTO v_thread_id;
    
    -- Add replies from trainer
    IF RANDOM() > 0.3 THEN
      v_trainer_id := v_trainers[1 + FLOOR(RANDOM() * ARRAY_LENGTH(v_trainers, 1))];
      
      INSERT INTO discussion_replies (
        thread_id,
        user_id,
        content,
        is_instructor_answer,
        upvotes,
        metadata
      ) VALUES (
        v_thread_id,
        v_trainer_id,
        'Great question! Here''s my answer as the instructor. This is sample reply content.',
        TRUE,
        FLOOR(RANDOM() * 10),
        '{"is_sample_data": true}'
      );
    END IF;
  END LOOP;
END $$;

-- ========================================
-- 8. CREATE SAMPLE INSTRUCTOR PAYOUTS
-- ========================================

DO $$
DECLARE
  v_trainer_id UUID;
  v_trainers CURSOR FOR SELECT id FROM profiles WHERE metadata->>'is_sample_data' = 'true' AND id IN (SELECT user_id FROM user_roles WHERE role = 'trainer');
BEGIN
  FOR trainer_record IN v_trainers LOOP
    -- Create 3-5 payout records per trainer
    FOR i IN 1..(3 + FLOOR(RANDOM() * 3)) LOOP
      INSERT INTO instructor_payouts (
        instructor_id,
        period_start,
        period_end,
        total_earnings,
        classes_taught,
        status,
        metadata
      ) VALUES (
        trainer_record.id,
        NOW() - INTERVAL '1 month' * i,
        NOW() - INTERVAL '1 month' * (i - 1),
        500 + FLOOR(RANDOM() * 2000),
        2 + FLOOR(RANDOM() * 6),
        CASE FLOOR(RANDOM() * 3)
          WHEN 0 THEN 'pending'
          WHEN 1 THEN 'processing'
          ELSE 'paid'
        END,
        '{"is_sample_data": true}'
      );
    END LOOP;
  END LOOP;
END $$;

-- ========================================
-- 9. CREATE SAMPLE AUDIT LOGS
-- ========================================

DO $$
DECLARE
  v_admin_id UUID := (SELECT id FROM profiles WHERE metadata->>'is_sample_data' = 'true' AND id IN (SELECT user_id FROM user_roles WHERE role = 'admin') LIMIT 1);
  v_student_id UUID;
BEGIN
  -- Create various audit log entries
  FOR i IN 1..30 LOOP
    v_student_id := (SELECT id FROM profiles WHERE metadata->>'is_sample_data' = 'true' AND id IN (SELECT user_id FROM user_roles WHERE role = 'student') OFFSET FLOOR(RANDOM() * 10) LIMIT 1);
    
    INSERT INTO audit_logs (
      user_id,
      action,
      action_category,
      severity,
      details,
      metadata,
      affected_user_id,
      ip_address
    ) VALUES (
      v_admin_id,
      CASE MOD(i, 5)
        WHEN 0 THEN 'user_created'
        WHEN 1 THEN 'booking_created'
        WHEN 2 THEN 'course_updated'
        WHEN 3 THEN 'payment_processed'
        ELSE 'role_assigned'
      END,
      CASE MOD(i, 5)
        WHEN 0 THEN 'user_management'
        WHEN 1 THEN 'booking_management'
        WHEN 2 THEN 'course_management'
        WHEN 3 THEN 'payment'
        ELSE 'user_management'
      END,
      CASE MOD(i, 4)
        WHEN 0 THEN 'warning'
        ELSE 'info'
      END,
      'Sample audit log entry #' || i,
      '{"is_sample_data": true}',
      v_student_id,
      '192.168.1.' || (1 + FLOOR(RANDOM() * 254))
    );
  END LOOP;
END $$;

-- ========================================
-- CLEANUP: Remove helper function
-- ========================================

DROP FUNCTION IF EXISTS create_sample_user(TEXT, TEXT, TEXT);

-- ========================================
-- SUMMARY
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
  v_payouts INT;
  v_logs INT;
BEGIN
  SELECT COUNT(*) INTO v_users FROM profiles WHERE metadata->>'is_sample_data' = 'true';
  SELECT COUNT(*) INTO v_courses FROM course_templates WHERE metadata->>'is_sample_data' = 'true';
  SELECT COUNT(*) INTO v_classes FROM classes WHERE metadata->>'is_sample_data' = 'true';
  SELECT COUNT(*) INTO v_bookings FROM bookings WHERE metadata->>'is_sample_data' = 'true';
  SELECT COUNT(*) INTO v_enquiries FROM enquiries WHERE metadata->>'is_sample_data' = 'true';
  SELECT COUNT(*) INTO v_certificates FROM certificates WHERE metadata->>'is_sample_data' = 'true';
  SELECT COUNT(*) INTO v_threads FROM discussion_threads WHERE metadata->>'is_sample_data' = 'true';
  SELECT COUNT(*) INTO v_payouts FROM instructor_payouts WHERE metadata->>'is_sample_data' = 'true';
  SELECT COUNT(*) INTO v_logs FROM audit_logs WHERE metadata->>'is_sample_data' = 'true';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SAMPLE DATA INJECTION COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '  - % users (10 students, 3 trainers, 2 admins)', v_users;
  RAISE NOTICE '  - % course templates', v_courses;
  RAISE NOTICE '  - % scheduled classes', v_classes;
  RAISE NOTICE '  - % bookings', v_bookings;
  RAISE NOTICE '  - % enquiries', v_enquiries;
  RAISE NOTICE '  - % certificates', v_certificates;
  RAISE NOTICE '  - % discussion threads', v_threads;
  RAISE NOTICE '  - % instructor payouts', v_payouts;
  RAISE NOTICE '  - % audit log entries', v_logs;
  RAISE NOTICE '';
  RAISE NOTICE 'Sample Login Credentials:';
  RAISE NOTICE '  Student: alice.smith@example.com / SamplePass123!';
  RAISE NOTICE '  Trainer: sarah.instructor@example.com / SamplePass123!';
  RAISE NOTICE '  Admin: admin.demo@example.com / SamplePass123!';
  RAISE NOTICE '';
  RAISE NOTICE 'To remove all sample data, run: cleanup-sample-data.sql';
  RAISE NOTICE '========================================';
END $$;