-- Fix: "Could not find the 'gc_claim_code' column of 'gift_settlements' in the schema cache"
-- Run this in Supabase Dashboard → SQL Editor → New query
-- Same as migration 022_gift_settlements_amazon_gc.sql

ALTER TABLE gift_settlements
ADD COLUMN IF NOT EXISTS amazon_request_id TEXT;

ALTER TABLE gift_settlements
ADD COLUMN IF NOT EXISTS gc_claim_code TEXT;

ALTER TABLE gift_settlements
ADD COLUMN IF NOT EXISTS recipient_email TEXT;

CREATE INDEX IF NOT EXISTS idx_gift_settlements_amazon_request_id ON gift_settlements(amazon_request_id);
