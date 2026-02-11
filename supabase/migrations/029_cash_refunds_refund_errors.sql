-- =============================================================================
-- Cash refunds: gift statuses, refund_errors, disposition 'refund', gift_payment_contributions
-- Migration: 029_cash_refunds_refund_errors.sql
-- =============================================================================

-- 1. Extend gifts.status to include refund flow
ALTER TABLE gifts DROP CONSTRAINT IF EXISTS gifts_status_check;
ALTER TABLE gifts ADD CONSTRAINT gifts_status_check
  CHECK (status IN ('active', 'completed', 'cancelled', 'settled', 'refunding', 'settled_refund'));

COMMENT ON COLUMN gifts.status IS 'active | completed | cancelled | settled | refunding | settled_refund';

-- 2. Allow disposition 'refund' on gift_settlements (for settlement history)
ALTER TABLE gift_settlements DROP CONSTRAINT IF EXISTS gift_settlements_disposition_check;
ALTER TABLE gift_settlements ADD CONSTRAINT gift_settlements_disposition_check
  CHECK (disposition IN ('charity', 'tip', 'bonus', 'refund'));

-- 3. Table: refund_errors — failed refunds for admin resolution
CREATE TABLE IF NOT EXISTS refund_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id UUID NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
  contribution_id UUID,
  amount DECIMAL(12, 2) NOT NULL,
  error_message TEXT NOT NULL,
  stripe_error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refund_errors_gift_id ON refund_errors(gift_id);
CREATE INDEX IF NOT EXISTS idx_refund_errors_created_at ON refund_errors(created_at DESC);
ALTER TABLE refund_errors ENABLE ROW LEVEL SECURITY;

-- Service role can manage; no public access
CREATE POLICY "refund_errors_service_only"
  ON refund_errors FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE refund_errors IS 'Failed proportional refunds (e.g. expired card) for admin resolution.';

-- 4. Table: gift_payment_contributions — per-contributor Stripe payment for proportional refunds
-- Populated when contributors pay via Stripe Checkout; used by processCashRefunds.
CREATE TABLE IF NOT EXISTS gift_payment_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id UUID NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_intent_id TEXT,
  contributor_email TEXT,
  contributor_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gift_payment_contributions_amount_positive CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_gift_payment_contributions_gift_id ON gift_payment_contributions(gift_id);
CREATE INDEX IF NOT EXISTS idx_gift_payment_contributions_status ON gift_payment_contributions(gift_id, status);
CREATE INDEX IF NOT EXISTS idx_gift_payment_contributions_stripe ON gift_payment_contributions(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

ALTER TABLE gift_payment_contributions ENABLE ROW LEVEL SECURITY;

-- RLS: service role used in server actions; read/insert/update via API only
CREATE POLICY "gift_payment_contributions_select"
  ON gift_payment_contributions FOR SELECT USING (true);
CREATE POLICY "gift_payment_contributions_insert"
  ON gift_payment_contributions FOR INSERT WITH CHECK (true);
CREATE POLICY "gift_payment_contributions_update"
  ON gift_payment_contributions FOR UPDATE USING (true);

COMMENT ON TABLE gift_payment_contributions IS 'Per-contributor Stripe payments for a gift; used for proportional cash refunds.';
COMMENT ON COLUMN gift_payment_contributions.status IS 'pending | completed (SUCCESS) | failed | refunded';
