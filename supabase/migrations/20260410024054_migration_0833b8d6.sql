-- Add enquiries table for contact form submissions
CREATE TABLE IF NOT EXISTS enquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  course_interest TEXT,
  preferred_dates TEXT,
  message TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

-- Public can create enquiries (anonymous submissions)
CREATE POLICY "anon_insert_enquiries" ON enquiries
  FOR INSERT WITH CHECK (true);

-- Admin can view all enquiries
CREATE POLICY "admin_view_enquiries" ON enquiries
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'trainer')
  );

-- Admin can update enquiries
CREATE POLICY "admin_update_enquiries" ON enquiries
  FOR UPDATE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'trainer')
  );

-- Add invoice_number to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS invoice_generated_at TIMESTAMP WITH TIME ZONE;

-- Create invoice counter table
CREATE TABLE IF NOT EXISTS invoice_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  current_number INTEGER DEFAULT 1000,
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO invoice_counter (id, current_number) VALUES (1, 1000)
ON CONFLICT (id) DO NOTHING;

-- Function to generate next invoice number
CREATE OR REPLACE FUNCTION get_next_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  invoice_num TEXT;
BEGIN
  UPDATE invoice_counter 
  SET current_number = current_number + 1 
  WHERE id = 1
  RETURNING current_number INTO next_num;
  
  invoice_num := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(next_num::TEXT, 4, '0');
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;