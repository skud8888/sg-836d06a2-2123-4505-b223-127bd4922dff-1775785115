-- Add signature completion function
CREATE OR REPLACE FUNCTION complete_signature(
  p_request_id UUID,
  p_signature_data TEXT,
  p_signer_ip TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_document_id UUID;
  v_request signature_requests;
BEGIN
  -- Get the signature request
  SELECT * INTO v_request
  FROM signature_requests
  WHERE id = p_request_id
  AND status = 'pending'
  AND expires_at > NOW();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Signature request not found or expired';
  END IF;

  -- Create signed document
  INSERT INTO documents (
    booking_id,
    document_type,
    file_path,
    uploaded_by,
    status
  )
  VALUES (
    v_request.booking_id,
    v_request.document_type,
    p_signature_data,
    NULL,
    'signed'
  )
  RETURNING id INTO v_document_id;

  -- Update signature request
  UPDATE signature_requests
  SET 
    status = 'signed',
    signed_at = NOW(),
    signer_ip = p_signer_ip,
    signed_document_id = v_document_id
  WHERE id = p_request_id;

  RETURN v_document_id;
END;
$$;

-- Add signature reminder function
CREATE OR REPLACE FUNCTION send_signature_reminder(p_request_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE signature_requests
  SET reminder_sent_at = NOW()
  WHERE id = p_request_id
  AND status = 'pending';
END;
$$;

-- Add notification preferences initialization trigger
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_created_notification_prefs ON auth.users;
CREATE TRIGGER on_user_created_notification_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();