-- Create student social profiles table
CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  location TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  interests TEXT[],
  is_public BOOLEAN DEFAULT true,
  show_achievements BOOLEAN DEFAULT true,
  show_courses BOOLEAN DEFAULT true,
  show_activity BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create referral system tables
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  uses_count INTEGER DEFAULT 0,
  max_uses INTEGER,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT REFERENCES referral_codes(code),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  reward_amount DECIMAL(10,2),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create offline sync queue table
CREATE TABLE IF NOT EXISTS offline_sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_data JSONB NOT NULL,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  error_message TEXT
);

-- RLS Policies for student profiles
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles viewable by all" ON student_profiles
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own profile" ON student_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON student_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON student_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for referral codes
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own codes" ON referral_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own codes" ON referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own codes" ON referral_codes
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Public can create referrals" ON referrals
  FOR INSERT WITH CHECK (true);

-- RLS Policies for offline sync queue
ALTER TABLE offline_sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sync queue" ON offline_sync_queue
  FOR ALL USING (auth.uid() = user_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := upper(substring(md5(random()::text || p_user_id::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  INSERT INTO referral_codes (user_id, code)
  VALUES (p_user_id, v_code);
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process referral
CREATE OR REPLACE FUNCTION process_referral(p_code TEXT, p_referred_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_referrer_id UUID;
  v_code_valid BOOLEAN;
  v_result JSONB;
BEGIN
  -- Check if code exists and is valid
  SELECT user_id, is_active INTO v_referrer_id, v_code_valid
  FROM referral_codes
  WHERE code = p_code
    AND (max_uses IS NULL OR uses_count < max_uses)
    AND (expires_at IS NULL OR expires_at > NOW());
  
  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired referral code');
  END IF;
  
  -- Check if user already used a referral
  IF EXISTS(SELECT 1 FROM referrals WHERE referred_id = p_referred_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User already referred');
  END IF;
  
  -- Create referral record
  INSERT INTO referrals (referrer_id, referred_id, referral_code, status)
  VALUES (v_referrer_id, p_referred_id, p_code, 'pending');
  
  -- Update code usage count
  UPDATE referral_codes SET uses_count = uses_count + 1 WHERE code = p_code;
  
  RETURN jsonb_build_object('success', true, 'referrer_id', v_referrer_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;