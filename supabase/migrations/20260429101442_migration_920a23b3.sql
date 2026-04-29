-- Create contracts table for e-signature system
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  signature_request_id UUID REFERENCES signature_requests(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'expired', 'cancelled')),
  signed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "view_contracts" ON contracts FOR SELECT 
  USING (
    booking_id IN (SELECT id FROM bookings WHERE student_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'trainer', 'super_admin')
  );

CREATE POLICY "admin_manage_contracts" ON contracts FOR ALL 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'trainer', 'super_admin'));