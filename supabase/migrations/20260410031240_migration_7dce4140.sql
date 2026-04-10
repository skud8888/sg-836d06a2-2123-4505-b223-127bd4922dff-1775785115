-- Create full-text search index for documents
CREATE INDEX IF NOT EXISTS idx_documents_search ON documents USING gin(to_tsvector('english', file_name || ' ' || COALESCE(notes, '')));

-- Create full-text search index for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_search ON bookings USING gin(to_tsvector('english', student_name || ' ' || student_email || ' ' || COALESCE(student_phone, '') || ' ' || COALESCE(usi_number, '')));

-- Create full-text search index for enquiries
CREATE INDEX IF NOT EXISTS idx_enquiries_search ON enquiries USING gin(to_tsvector('english', name || ' ' || email || ' ' || COALESCE(phone, '') || ' ' || COALESCE(message, '')));

-- Create full-text search index for courses
CREATE INDEX IF NOT EXISTS idx_courses_search ON course_templates USING gin(to_tsvector('english', name || ' ' || code || ' ' || COALESCE(description, '')));

-- Universal search function
CREATE OR REPLACE FUNCTION universal_search(p_query TEXT, p_limit INT DEFAULT 20)
RETURNS TABLE (
  result_type TEXT,
  result_id UUID,
  title TEXT,
  subtitle TEXT,
  metadata JSONB,
  relevance DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  
  -- Search bookings
  SELECT 
    'booking'::TEXT,
    b.id,
    b.student_name,
    COALESCE(ct.name, 'Unknown Course'),
    jsonb_build_object(
      'email', b.student_email,
      'phone', b.student_phone,
      'status', b.status,
      'payment_status', b.payment_status,
      'course_code', ct.code
    ),
    ts_rank(to_tsvector('english', b.student_name || ' ' || b.student_email || ' ' || COALESCE(b.student_phone, '') || ' ' || COALESCE(b.usi_number, '')), plainto_tsquery('english', p_query))
  FROM bookings b
  LEFT JOIN scheduled_classes sc ON b.scheduled_class_id = sc.id
  LEFT JOIN course_templates ct ON sc.course_template_id = ct.id
  WHERE to_tsvector('english', b.student_name || ' ' || b.student_email || ' ' || COALESCE(b.student_phone, '') || ' ' || COALESCE(b.usi_number, '')) @@ plainto_tsquery('english', p_query)
  
  UNION ALL
  
  -- Search enquiries
  SELECT 
    'enquiry'::TEXT,
    e.id,
    e.name,
    COALESCE(e.course_interest, 'General Enquiry'),
    jsonb_build_object(
      'email', e.email,
      'phone', e.phone,
      'status', e.status,
      'message', e.message
    ),
    ts_rank(to_tsvector('english', e.name || ' ' || e.email || ' ' || COALESCE(e.phone, '') || ' ' || COALESCE(e.message, '')), plainto_tsquery('english', p_query))
  FROM enquiries e
  WHERE to_tsvector('english', e.name || ' ' || e.email || ' ' || COALESCE(e.phone, '') || ' ' || COALESCE(e.message, '')) @@ plainto_tsquery('english', p_query)
  
  UNION ALL
  
  -- Search documents
  SELECT 
    'document'::TEXT,
    d.id,
    d.file_name,
    d.document_type,
    jsonb_build_object(
      'file_size', d.file_size,
      'mime_type', d.mime_type,
      'notes', d.notes,
      'tags', d.tags,
      'uploaded_at', d.uploaded_at
    ),
    ts_rank(to_tsvector('english', d.file_name || ' ' || COALESCE(d.notes, '')), plainto_tsquery('english', p_query))
  FROM documents d
  WHERE d.is_latest_version = true 
    AND d.deleted_at IS NULL
    AND to_tsvector('english', d.file_name || ' ' || COALESCE(d.notes, '')) @@ plainto_tsquery('english', p_query)
  
  UNION ALL
  
  -- Search courses
  SELECT 
    'course'::TEXT,
    ct.id,
    ct.name,
    ct.code,
    jsonb_build_object(
      'description', ct.description,
      'price_full', ct.price_full,
      'price_deposit', ct.price_deposit,
      'duration_hours', ct.duration_hours
    ),
    ts_rank(to_tsvector('english', ct.name || ' ' || ct.code || ' ' || COALESCE(ct.description, '')), plainto_tsquery('english', p_query))
  FROM course_templates ct
  WHERE to_tsvector('english', ct.name || ' ' || ct.code || ' ' || COALESCE(ct.description, '')) @@ plainto_tsquery('english', p_query)
  
  ORDER BY relevance DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION universal_search TO authenticated;