-- Add average rating column to course_templates for quick access
ALTER TABLE course_templates 
ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

-- Create function to update course ratings
CREATE OR REPLACE FUNCTION update_course_rating(p_course_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE course_templates
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM course_feedback cf
      JOIN scheduled_classes sc ON sc.id = cf.scheduled_class_id
      WHERE sc.course_template_id = p_course_id
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM course_feedback cf
      JOIN scheduled_classes sc ON sc.id = cf.scheduled_class_id
      WHERE sc.course_template_id = p_course_id
    )
  WHERE id = p_course_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-update ratings
CREATE OR REPLACE FUNCTION trigger_update_course_rating()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_course_rating(
    (SELECT course_template_id FROM scheduled_classes WHERE id = NEW.scheduled_class_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_feedback_insert ON course_feedback;
CREATE TRIGGER after_feedback_insert
AFTER INSERT ON course_feedback
FOR EACH ROW
EXECUTE FUNCTION trigger_update_course_rating();