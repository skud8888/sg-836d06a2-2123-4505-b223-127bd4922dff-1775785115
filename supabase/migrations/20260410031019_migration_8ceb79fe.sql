-- Create AI insights and predictions table
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insight_type TEXT NOT NULL CHECK (insight_type IN ('churn_risk', 'upsell_opportunity', 'no_show_risk', 'conversion_prediction', 'revenue_forecast')),
  related_booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  related_enquiry_id UUID REFERENCES enquiries(id) ON DELETE CASCADE,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  prediction_data JSONB NOT NULL,
  recommendation TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create AI actions queue for human-in-the-loop
CREATE TABLE IF NOT EXISTS ai_action_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_type TEXT NOT NULL CHECK (action_type IN ('send_email', 'create_enquiry', 'update_booking', 'schedule_followup', 'flag_risk')),
  target_entity TEXT NOT NULL,
  target_id UUID NOT NULL,
  proposed_action JSONB NOT NULL,
  reasoning TEXT,
  confidence_score DECIMAL(3,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'executed')),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email parsing logs
CREATE TABLE IF NOT EXISTS email_parse_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_email TEXT NOT NULL,
  subject TEXT,
  body_text TEXT,
  parsed_data JSONB,
  created_enquiry_id UUID REFERENCES enquiries(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'parsed', 'failed', 'ignored')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_status ON ai_insights(status);
CREATE INDEX IF NOT EXISTS idx_ai_insights_booking ON ai_insights(related_booking_id);
CREATE INDEX IF NOT EXISTS idx_ai_action_queue_status ON ai_action_queue(status);
CREATE INDEX IF NOT EXISTS idx_ai_action_queue_type ON ai_action_queue(action_type);
CREATE INDEX IF NOT EXISTS idx_email_parse_status ON email_parse_logs(status);

-- RLS Policies
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_action_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_parse_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only access for AI tables
CREATE POLICY "admin_full_access_ai_insights" ON ai_insights FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "admin_full_access_ai_actions" ON ai_action_queue FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "admin_full_access_email_logs" ON email_parse_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Function to calculate churn risk
CREATE OR REPLACE FUNCTION calculate_churn_risk(p_booking_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_booking RECORD;
  v_risk_score DECIMAL(3,2);
  v_factors JSONB;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Booking not found');
  END IF;
  
  -- Simple risk calculation based on payment status and time to course
  v_risk_score := 0.0;
  v_factors := '[]'::jsonb;
  
  -- Payment status factor
  IF v_booking.payment_status = 'unpaid' THEN
    v_risk_score := v_risk_score + 0.4;
    v_factors := v_factors || jsonb_build_array('Unpaid booking increases risk');
  ELSIF v_booking.payment_status = 'partial' THEN
    v_risk_score := v_risk_score + 0.2;
    v_factors := v_factors || jsonb_build_array('Partial payment - follow up needed');
  END IF;
  
  -- Time since booking factor
  IF EXTRACT(DAY FROM NOW() - v_booking.created_at) > 14 THEN
    v_risk_score := v_risk_score + 0.2;
    v_factors := v_factors || jsonb_build_array('Booking created over 2 weeks ago');
  END IF;
  
  -- Cap at 1.0
  IF v_risk_score > 1.0 THEN
    v_risk_score := 1.0;
  END IF;
  
  RETURN jsonb_build_object(
    'risk_score', v_risk_score,
    'factors', v_factors,
    'recommendation', CASE 
      WHEN v_risk_score > 0.6 THEN 'High risk - immediate follow-up recommended'
      WHEN v_risk_score > 0.3 THEN 'Medium risk - schedule check-in call'
      ELSE 'Low risk - standard monitoring'
    END
  );
END;
$$ LANGUAGE plpgsql;

-- Function to detect upsell opportunities
CREATE OR REPLACE FUNCTION detect_upsell_opportunities(p_booking_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_booking RECORD;
  v_student_history INT;
  v_opportunity_score DECIMAL(3,2);
  v_suggestions JSONB;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Booking not found');
  END IF;
  
  -- Check student's booking history
  SELECT COUNT(*) INTO v_student_history 
  FROM bookings 
  WHERE student_email = v_booking.student_email 
    AND status = 'completed';
  
  v_opportunity_score := 0.0;
  v_suggestions := '[]'::jsonb;
  
  -- Repeat customer bonus
  IF v_student_history > 0 THEN
    v_opportunity_score := v_opportunity_score + 0.3;
    v_suggestions := v_suggestions || jsonb_build_array('Loyal customer - offer advanced courses');
  END IF;
  
  -- Paid in full bonus
  IF v_booking.payment_status = 'paid' THEN
    v_opportunity_score := v_opportunity_score + 0.2;
    v_suggestions := v_suggestions || jsonb_build_array('Financially committed - good candidate for package deal');
  END IF;
  
  -- Course completion bonus
  IF v_booking.status = 'completed' THEN
    v_opportunity_score := v_opportunity_score + 0.3;
    v_suggestions := v_suggestions || jsonb_build_array('Course completed - follow up with next level certification');
  END IF;
  
  IF v_opportunity_score > 1.0 THEN
    v_opportunity_score := 1.0;
  END IF;
  
  RETURN jsonb_build_object(
    'opportunity_score', v_opportunity_score,
    'suggestions', v_suggestions,
    'student_history', v_student_history
  );
END;
$$ LANGUAGE plpgsql;