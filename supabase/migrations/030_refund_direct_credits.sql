-- =============================================================================
-- Cash refund direct: user credits (store credit fallback), user_id on contributions
-- Migration: 030_refund_direct_credits.sql
-- =============================================================================

-- 1. Allow disposition 'credit' on gift_settlements (store credit fallback audit)
ALTER TABLE gift_settlements DROP CONSTRAINT IF EXISTS gift_settlements_disposition_check;
ALTER TABLE gift_settlements ADD CONSTRAINT gift_settlements_disposition_check
  CHECK (disposition IN ('charity', 'tip', 'bonus', 'refund', 'credit'));

-- 2. user_id on gift_payment_contributions (for addUserCredit fallback when refund fails)
ALTER TABLE gift_payment_contributions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_gift_payment_contributions_user_id
  ON gift_payment_contributions(user_id) WHERE user_id IS NOT NULL;

-- 3. stripe_refund_id on gift_payment_contributions (after successful Stripe refund)
ALTER TABLE gift_payment_contributions
  ADD COLUMN IF NOT EXISTS stripe_refund_id TEXT;

COMMENT ON COLUMN gift_payment_contributions.stripe_refund_id IS 'Stripe Refund ID after successful cash refund.';

-- 4. Wishbee Store Credit ledger (audit trail)
CREATE TABLE IF NOT EXISTS user_credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  type TEXT NOT NULL DEFAULT 'refund_fallback'
    CHECK (type IN ('refund_fallback', 'adjustment', 'redemption')),
  reference_id TEXT,
  reference_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_credit_ledger_user_id ON user_credit_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credit_ledger_created_at ON user_credit_ledger(created_at DESC);

ALTER TABLE user_credit_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_credit_ledger_select_own"
  ON user_credit_ledger FOR SELECT
  USING (auth.uid() = user_id);

-- Inserts/updates only via service role (server action addUserCredit)
CREATE POLICY "user_credit_ledger_insert_service"
  ON user_credit_ledger FOR INSERT WITH CHECK (true);

COMMENT ON TABLE user_credit_ledger IS 'Wishbee Store Credit: ledger for refund fallback and redemptions.';
