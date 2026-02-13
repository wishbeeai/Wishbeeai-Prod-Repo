-- Fix: "Could not find the 'fee_covered' column of 'gift_settlements' in the schema cache"
-- Run this in Supabase Dashboard → SQL Editor → New query → paste → Run
-- (Same as migration 023_gift_settlements_immediate.sql)

-- Add fee_covered column (true = user pays fee; false = fee deducted from amount)
ALTER TABLE gift_settlements
ADD COLUMN IF NOT EXISTS fee_covered BOOLEAN DEFAULT true;

-- Add transaction_fee column for audit
ALTER TABLE gift_settlements
ADD COLUMN IF NOT EXISTS transaction_fee DECIMAL(12, 2);

-- Update status constraint to include 'failed' (for immediate donation error handling)
ALTER TABLE gift_settlements DROP CONSTRAINT IF EXISTS gift_settlements_status_check;
ALTER TABLE gift_settlements ADD CONSTRAINT gift_settlements_status_check
  CHECK (status IN ('pending_pool', 'sent_to_charity', 'completed', 'failed'));
