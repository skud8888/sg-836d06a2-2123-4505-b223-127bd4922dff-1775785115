-- Database Index Optimization
-- Adding missing indexes for performance improvement

-- Bookings table - frequently searched by student email and dates
CREATE INDEX IF NOT EXISTS idx_bookings_student_email ON bookings(student_email);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_status_payment ON bookings(status, payment_status);

-- Scheduled classes - frequently queried by date ranges
CREATE INDEX IF NOT EXISTS idx_scheduled_classes_dates ON scheduled_classes(start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_scheduled_classes_status_date ON scheduled_classes(status, start_datetime);

-- Course templates - search and filtering
CREATE INDEX IF NOT EXISTS idx_course_templates_featured ON course_templates(is_featured, featured_order) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_course_templates_rating ON course_templates(average_rating DESC, total_ratings DESC);

-- Enrollments - student activity queries
CREATE INDEX IF NOT EXISTS idx_enrollments_student_status ON enrollments(student_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_status ON enrollments(course_template_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_dates ON enrollments(enrolled_at DESC);

-- Payments - financial reporting
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status_amount ON payments(status, amount);

-- Documents - fast document retrieval
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);

-- Course feedback - ratings and filtering
CREATE INDEX IF NOT EXISTS idx_course_feedback_rating ON course_feedback(rating DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_feedback_approved ON course_feedback(testimonial_approved, rating DESC) WHERE testimonial_approved = true;

-- Signature requests - status tracking
CREATE INDEX IF NOT EXISTS idx_signature_requests_status_date ON signature_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signature_requests_expires ON signature_requests(expires_at) WHERE status IN ('pending', 'sent', 'viewed');

-- Notifications - unread notifications query
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read, created_at DESC) WHERE is_read = false;

-- Audit logs - time-based queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_desc ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action);

-- Email queue - processing optimization
CREATE INDEX IF NOT EXISTS idx_email_queue_pending ON email_queue(status, created_at) WHERE status = 'pending';

-- SMS notifications - delivery tracking
CREATE INDEX IF NOT EXISTS idx_sms_notifications_pending ON sms_notifications(status, created_at) WHERE status IN ('pending', 'sent');

-- Support messages - session-based queries
CREATE INDEX IF NOT EXISTS idx_support_messages_session_time ON support_messages(session_id, created_at);

-- Discussion threads - popular and recent
CREATE INDEX IF NOT EXISTS idx_discussion_threads_popular ON discussion_threads(course_template_id, views_count DESC, replies_count DESC);
CREATE INDEX IF NOT EXISTS idx_discussion_threads_recent ON discussion_threads(course_template_id, created_at DESC);

-- Material access - progress tracking
CREATE INDEX IF NOT EXISTS idx_material_access_progress ON material_access(student_id, completed_at) WHERE completed_at IS NOT NULL;

-- Gamification - leaderboard queries
CREATE INDEX IF NOT EXISTS idx_student_points_level ON student_points(current_level DESC, total_points DESC);
CREATE INDEX IF NOT EXISTS idx_student_points_streak ON student_points(streak_days DESC) WHERE streak_days > 0;

-- Instructor payouts - financial tracking
CREATE INDEX IF NOT EXISTS idx_instructor_payouts_period_instructor ON instructor_payouts(instructor_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_instructor_payouts_pending ON instructor_payouts(status, created_at) WHERE status = 'pending';

-- AI insights - actionable insights
CREATE INDEX IF NOT EXISTS idx_ai_insights_pending ON ai_insights(status, confidence_score DESC) WHERE status = 'pending';

COMMENT ON INDEX idx_bookings_student_email IS 'Fast lookup by student email for booking history';
COMMENT ON INDEX idx_scheduled_classes_dates IS 'Optimizes date range queries for class schedules';
COMMENT ON INDEX idx_course_templates_featured IS 'Fast retrieval of featured courses for homepage';
COMMENT ON INDEX idx_enrollments_student_status IS 'Optimizes student enrollment status queries';
COMMENT ON INDEX idx_notifications_unread IS 'Fast unread notification counts per user';
COMMENT ON INDEX idx_signature_requests_expires IS 'Tracks expiring signature requests for reminders';