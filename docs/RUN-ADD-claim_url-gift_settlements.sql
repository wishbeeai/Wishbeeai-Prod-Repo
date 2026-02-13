-- Fix: "Could not find the 'claim_url' column of 'gift_settlements' in the schema cache"
-- Run this in Supabase Dashboard → SQL Editor → New query → paste → Run

ALTER TABLE gift_settlements
ADD COLUMN IF NOT EXISTS claim_url TEXT;

ALTER TABLE gift_settlements
ADD COLUMN IF NOT EXISTS order_id TEXT;

CREATE INDEX IF NOT EXISTS idx_gift_settlements_order_id ON gift_settlements(order_id) WHERE order_id IS NOT NULL;

COMMENT ON COLUMN gift_settlements.claim_url IS 'Tremendous reward claim URL (delivery.link).';
COMMENT ON COLUMN gift_settlements.order_id IS 'Tremendous order ID for bonus gift card settlements.';
