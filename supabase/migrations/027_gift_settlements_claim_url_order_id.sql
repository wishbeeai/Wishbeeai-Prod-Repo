-- =============================================================================
-- GiftSettlement (gift_settlements): Tremendous link and order tracking
-- Migration: 027_gift_settlements_claim_url_order_id.sql
-- claim_url = Tremendous delivery.link (displayed on Wishbee Impact page)
-- order_id = Tremendous Order ID / Reward ID
-- =============================================================================

ALTER TABLE gift_settlements
ADD COLUMN IF NOT EXISTS claim_url TEXT;

ALTER TABLE gift_settlements
ADD COLUMN IF NOT EXISTS order_id TEXT;

CREATE INDEX IF NOT EXISTS idx_gift_settlements_order_id ON gift_settlements(order_id) WHERE order_id IS NOT NULL;

COMMENT ON COLUMN gift_settlements.claim_url IS 'Tremendous reward claim URL (delivery.link).';
COMMENT ON COLUMN gift_settlements.order_id IS 'Tremendous order ID for bonus gift card settlements.';
