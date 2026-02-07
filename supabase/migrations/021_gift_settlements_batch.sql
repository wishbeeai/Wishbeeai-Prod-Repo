-- =============================================================================
-- Add charity_id and batch_id for MonthlyDonationService
-- Migration: 021_gift_settlements_batch.sql
-- =============================================================================

-- Add charity_id (matches DONATION_CHARITIES ids: feeding-america, unicef, etc.)
ALTER TABLE gift_settlements
ADD COLUMN IF NOT EXISTS charity_id TEXT;

-- Add batch_id for completed pooled donations
ALTER TABLE gift_settlements
ADD COLUMN IF NOT EXISTS batch_id UUID;

-- Update status constraint to include 'completed'
-- Drop existing check and add new one
ALTER TABLE gift_settlements DROP CONSTRAINT IF EXISTS gift_settlements_status_check;
ALTER TABLE gift_settlements ADD CONSTRAINT gift_settlements_status_check
  CHECK (status IN ('pending_pool', 'sent_to_charity', 'completed'));

-- Backfill charity_id from charity_name where possible (optional, for existing data)
-- Charity name to id mapping: we don't backfill automatically; new records will have charity_id

CREATE INDEX IF NOT EXISTS idx_gift_settlements_charity_id ON gift_settlements(charity_id);
CREATE INDEX IF NOT EXISTS idx_gift_settlements_batch_id ON gift_settlements(batch_id);
