-- =============================================================================
-- Add Amazon gift card tracking fields to gift_settlements
-- Migration: 022_gift_settlements_amazon_gc.sql
-- Used when disposition = 'bonus' (Amazon eGift Card)
-- =============================================================================

-- Amazon AGCOD creationRequestId - idempotency key used for the API call
ALTER TABLE gift_settlements
ADD COLUMN IF NOT EXISTS amazon_request_id TEXT;

-- Amazon gcClaimCode - the gift card claim code (store for delivery, erase after distribution per Amazon guidelines)
ALTER TABLE gift_settlements
ADD COLUMN IF NOT EXISTS gc_claim_code TEXT;

-- Optional: recipient email for gift card delivery
ALTER TABLE gift_settlements
ADD COLUMN IF NOT EXISTS recipient_email TEXT;

CREATE INDEX IF NOT EXISTS idx_gift_settlements_amazon_request_id ON gift_settlements(amazon_request_id);
