-- Add course feedback/reviews table
CREATE TABLE IF NOT EXISTS course_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  scheduled_class_id UUID NOT NULL REFERENCES scheduled_classes(id) ON DELETE CASCADE,
  student_email TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  course_quality INTEGER CHECK (course_quality >= 1 AND course_quality <= 5),
  trainer_quality INTEGER CHECK (trainer_quality >= 1 AND trainer_quality <= 5),
  venue_quality INTEGER CHECK (venue_quality >= 1 AND venue_quality <= 5),
  comments TEXT,
  would_recommend BOOLEAN,
  testimonial_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for course feedback
ALTER TABLE course_feedback ENABLE ROW LEVEL SECURITY;

-- Students can create feedback for their own bookings
CREATE POLICY "students_insert_own_feedback" ON course_feedback
  FOR INSERT
  WITH CHECK (true); -- Anyone can submit (booking_id validation on client)

-- Anyone can read approved testimonials
CREATE POLICY "public_read_approved" ON course_feedback
  FOR SELECT
  USING (testimonial_approved = true);

-- Admin/trainers can read all feedback
CREATE POLICY "admin_read_all_feedback" ON course_feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'trainer')
    )
  );

-- Admin can update feedback (approve testimonials)
CREATE POLICY "admin_update_feedback" ON course_feedback
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Add student portal access token to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS access_token TEXT UNIQUE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE;

-- Function to generate student access tokens
CREATE OR REPLACE FUNCTION generate_student_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_class ON course_feedback(scheduled_class_id);
CREATE INDEX IF NOT EXISTS idx_feedback_approved ON course_feedback(testimonial_approved);
CREATE INDEX IF NOT EXISTS idx_bookings_token ON bookings(access_token);