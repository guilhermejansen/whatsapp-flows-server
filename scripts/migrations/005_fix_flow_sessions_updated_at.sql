-- Migration 005: Fix flow_sessions table - Add missing updated_at column
-- This field is required by the update_updated_at_column() trigger

-- Add updated_at column
ALTER TABLE flow_sessions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Update existing records
UPDATE flow_sessions SET updated_at = last_activity_at WHERE updated_at IS NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 005: flow_sessions updated_at column added successfully';
END $$;
