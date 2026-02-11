-- =============================================================================
-- Add 'failed' status for immediate donation error handling
-- Migration: 023_gift_settlements_immediate.sql
-- =============================================================================

-- Add fee_covered column (true = user pays fee; false = fee deducted from amount)
ALTER TABLE gift_settlements
ADD COLUMN IF NOT EXISTS fee_covered BOOLEAN DEFAULT true;

-- Add transaction_fee column for audit
ALTER TABLE gift_settlements
ADD COLUMN IF NOT EXISTS transaction_fee DECIMAL(12, 2);

-- Update status constraint to include 'failed'
ALTER TABLE gift_settlements DROP CONSTRAINT IF EXISTS gift_settlements_status_check;
ALTER TABLE gift_settlements ADD CONSTRAINT gift_settlements_status_check
  CHECK (status IN ('pending_pool', 'sent_to_charity', 'completed', 'failed'));
