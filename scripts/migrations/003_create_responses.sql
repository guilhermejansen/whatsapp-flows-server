-- Migration 003: Create flow_responses table
-- Stores completed Flow responses

CREATE TABLE IF NOT EXISTS flow_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES flow_sessions(id) ON DELETE CASCADE,
  flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  flow_token VARCHAR(500) NOT NULL,
  phone_number VARCHAR(50),
  response_data JSONB NOT NULL,
  raw_webhook_payload JSONB,
  received_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_flow_responses_session_id ON flow_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_flow_responses_flow_id ON flow_responses(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_responses_flow_token ON flow_responses(flow_token);
CREATE INDEX IF NOT EXISTS idx_flow_responses_phone ON flow_responses(phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_flow_responses_received_at ON flow_responses(received_at DESC);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 003: flow_responses table created successfully';
END $$;
