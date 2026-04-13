-- Create rate_limit_log table for tracking API request rates
CREATE TABLE IF NOT EXISTS rate_limit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_endpoint ON rate_limit_log(ip, endpoint, window_start);

-- Create index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_window_start ON rate_limit_log(window_start);

-- Enable RLS
ALTER TABLE rate_limit_log ENABLE ROW LEVEL SECURITY;

-- Only system can manage rate limits (no user access)
CREATE POLICY "System can manage rate limits" ON rate_limit_log
  FOR ALL
  USING (false);