-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Update profiles table to add role column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'trainer', 'student'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE profiles ADD COLUMN phone TEXT;
  END IF;
END $$;

-- Course templates (e.g., "First Aid", "CPR", "White Card")
CREATE TABLE IF NOT EXISTS course_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  duration_hours NUMERIC NOT NULL,
  price_full NUMERIC NOT NULL,
  price_deposit NUMERIC NOT NULL DEFAULT 100,
  units TEXT[], -- AVETMISS units covered
  max_students INTEGER DEFAULT 20,
  requirements TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduled classes (specific course instances)
CREATE TABLE IF NOT EXISTS scheduled_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_template_id UUID NOT NULL REFERENCES course_templates(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  max_students INTEGER DEFAULT 20,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student bookings/enrollments
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scheduled_class_id UUID NOT NULL REFERENCES scheduled_classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_phone TEXT,
  booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'attended', 'no_show', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'deposit', 'paid', 'refunded')),
  total_amount NUMERIC NOT NULL,
  paid_amount NUMERIC DEFAULT 0,
  stripe_payment_id TEXT,
  invoice_number TEXT,
  qbo_invoice_id TEXT,
  usi_number TEXT,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'cash', 'eftpos', 'bank_transfer')),
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents (IDs, evidence photos, certificates, class docs)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  scheduled_class_id UUID REFERENCES scheduled_classes(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('student_id', 'evidence_photo', 'evidence_video', 'certificate', 'sign_in_sheet', 'risk_assessment', 'assessment_form', 'other')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- RLS Policies
ALTER TABLE course_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Course templates: public read, admin write
DROP POLICY IF EXISTS "public_read_courses" ON course_templates;
CREATE POLICY "public_read_courses" ON course_templates FOR SELECT USING (true);
DROP POLICY IF EXISTS "admin_manage_courses" ON course_templates;
CREATE POLICY "admin_manage_courses" ON course_templates FOR ALL 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Scheduled classes: public read, admin/trainer write
DROP POLICY IF EXISTS "public_read_classes" ON scheduled_classes;
CREATE POLICY "public_read_classes" ON scheduled_classes FOR SELECT USING (true);
DROP POLICY IF EXISTS "admin_manage_classes" ON scheduled_classes;
CREATE POLICY "admin_manage_classes" ON scheduled_classes FOR ALL 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'trainer'));

-- Bookings: students see own, admin/trainer see all
DROP POLICY IF EXISTS "students_read_own_bookings" ON bookings;
CREATE POLICY "students_read_own_bookings" ON bookings FOR SELECT 
  USING (auth.uid() = student_id OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'trainer'));
DROP POLICY IF EXISTS "anyone_create_booking" ON bookings;
CREATE POLICY "anyone_create_booking" ON bookings FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "admin_manage_bookings" ON bookings;
CREATE POLICY "admin_manage_bookings" ON bookings FOR ALL 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'trainer'));

-- Payments: linked to bookings access
DROP POLICY IF EXISTS "view_own_payments" ON payments;
CREATE POLICY "view_own_payments" ON payments FOR SELECT 
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE student_id = auth.uid()
    ) OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'trainer')
  );
DROP POLICY IF EXISTS "admin_manage_payments" ON payments;
CREATE POLICY "admin_manage_payments" ON payments FOR ALL 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'trainer'));

-- Documents: students see own, admin/trainer see all
DROP POLICY IF EXISTS "view_documents" ON documents;
CREATE POLICY "view_documents" ON documents FOR SELECT 
  USING (
    booking_id IN (SELECT id FROM bookings WHERE student_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'trainer')
  );
DROP POLICY IF EXISTS "upload_documents" ON documents;
CREATE POLICY "upload_documents" ON documents FOR INSERT WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'trainer')
  OR uploaded_by = auth.uid()
);