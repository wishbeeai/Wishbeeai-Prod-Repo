-- =============================================================================
-- Add stripe_payment_id to gift_settlements for Stripe Checkout webhook sync
-- Migration: 026_gift_settlements_stripe_payment.sql
-- =============================================================================

ALTER TABLE gift_settlements
ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT;

CREATE INDEX IF NOT EXISTS idx_gift_settlements_stripe_payment_id 
  ON gift_settlements(stripe_payment_id) 
  WHERE stripe_payment_id IS NOT NULL;

COMMENT ON COLUMN gift_settlements.stripe_payment_id IS 'Stripe payment intent or checkout session ID for payment tracking.';
