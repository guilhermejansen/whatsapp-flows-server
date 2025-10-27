-- Migration 002: Create flow_sessions table
-- Tracks active user sessions interacting with Flows

CREATE TABLE IF NOT EXISTS flow_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  flow_token VARCHAR(500) NOT NULL UNIQUE,
  phone_number VARCHAR(50),
  current_screen VARCHAR(255),
  session_data JSONB DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'error')),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT NOW(),
  error_message TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_flow_sessions_flow_token ON flow_sessions(flow_token);
CREATE INDEX IF NOT EXISTS idx_flow_sessions_flow_id ON flow_sessions(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_sessions_status ON flow_sessions(status);
CREATE INDEX IF NOT EXISTS idx_flow_sessions_phone ON flow_sessions(phone_number) WHERE phone_number IS NOT NULL;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_flow_sessions_updated_at ON flow_sessions;
CREATE TRIGGER update_flow_sessions_updated_at
  BEFORE UPDATE ON flow_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 002: flow_sessions table created successfully';
END $$;
