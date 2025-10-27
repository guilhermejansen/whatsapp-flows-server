-- Migration 004: Create webhook_events table
-- Logs all incoming webhooks for auditing

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  raw_payload JSONB NOT NULL,
  signature VARCHAR(255),
  signature_valid BOOLEAN DEFAULT false,
  processed BOOLEAN DEFAULT false,
  callback_sent BOOLEAN DEFAULT false,
  callback_url TEXT,
  callback_status_code INTEGER,
  callback_error TEXT,
  received_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  callback_sent_at TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_callback_sent ON webhook_events(callback_sent);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at ON webhook_events(received_at DESC);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 004: webhook_events table created successfully';
END $$;
