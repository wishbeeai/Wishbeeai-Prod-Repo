-- =============================================================================
-- Add status field to gift_settlements for pooled donation workflow
-- Migration: 020_gift_settlements_status.sql
-- =============================================================================

ALTER TABLE gift_settlements
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_pool' 
CHECK (status IN ('pending_pool', 'sent_to_charity'));

-- Backfill existing rows
UPDATE gift_settlements
SET status = 'pending_pool'
WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS idx_gift_settlements_status ON gift_settlements(status);
