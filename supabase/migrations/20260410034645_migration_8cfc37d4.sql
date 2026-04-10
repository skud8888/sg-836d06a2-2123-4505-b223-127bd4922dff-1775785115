-- Create signature_requests table
CREATE TABLE IF NOT EXISTS signature_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('enrollment_contract', 'liability_waiver', 'terms_of_service', 'consent_form', 'other')),
  contract_template_id UUID,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'viewed', 'signed', 'declined', 'expired')),
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  signature_data TEXT,
  signed_document_id UUID,
  signer_ip TEXT,
  reminder_sent_count INTEGER DEFAULT 0,
  last_reminder_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  template_content TEXT NOT NULL,
  variables JSONB,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stripe_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_checkout_session_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'aud',
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded')),
  payment_method TEXT,
  receipt_url TEXT,
  refund_id TEXT,
  refunded_amount INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_signature_requests_booking ON signature_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_booking ON stripe_payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_intent ON stripe_payments(stripe_payment_intent_id);

-- RLS Policies
ALTER TABLE signature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_signature_requests" ON signature_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "students_view_own_signature_requests" ON signature_requests
  FOR SELECT USING (
    recipient_email IN (
      SELECT student_email FROM bookings WHERE id = booking_id
    )
  );

CREATE POLICY "admin_manage_contract_templates" ON contract_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "admin_view_stripe_payments" ON stripe_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin', 'receptionist')
    )
  );

-- Function to send signature reminder
CREATE OR REPLACE FUNCTION send_signature_reminder(p_request_id UUID)
RETURNS void AS $$
DECLARE
  v_request signature_requests;
BEGIN
  SELECT * INTO v_request FROM signature_requests WHERE id = p_request_id;
  
  IF v_request.status = 'pending' OR v_request.status = 'sent' THEN
    UPDATE signature_requests
    SET 
      reminder_sent_count = reminder_sent_count + 1,
      last_reminder_at = NOW()
    WHERE id = p_request_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to complete signature
CREATE OR REPLACE FUNCTION complete_signature(
  p_request_id UUID,
  p_signature_data TEXT,
  p_signer_ip TEXT
)
RETURNS UUID AS $$
DECLARE
  v_request signature_requests;
  v_document_id UUID;
BEGIN
  SELECT * INTO v_request FROM signature_requests WHERE id = p_request_id;
  
  -- Create signed document record
  INSERT INTO documents (
    file_name,
    file_path,
    document_type,
    booking_id,
    notes,
    uploaded_by
  ) VALUES (
    v_request.document_type || '_signed_' || v_request.recipient_name || '.pdf',
    'signatures/' || p_request_id || '.pdf',
    'contract',
    v_request.booking_id,
    'Signed contract - ' || v_request.document_type,
    auth.uid()
  )
  RETURNING id INTO v_document_id;
  
  -- Update signature request
  UPDATE signature_requests
  SET
    status = 'signed',
    signed_at = NOW(),
    signature_data = p_signature_data,
    signed_document_id = v_document_id,
    signer_ip = p_signer_ip,
    updated_at = NOW()
  WHERE id = p_request_id;
  
  RETURN v_document_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON signature_requests TO authenticated;
GRANT ALL ON contract_templates TO authenticated;
GRANT ALL ON stripe_payments TO authenticated;
GRANT EXECUTE ON FUNCTION send_signature_reminder TO authenticated;
GRANT EXECUTE ON FUNCTION complete_signature TO authenticated;