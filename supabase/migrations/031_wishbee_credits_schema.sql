-- =============================================================================
-- Wishbee Credits: profiles.credit_balance, credit_transactions, gift status
-- Migration: 031_wishbee_credits_schema.sql
-- =============================================================================

-- 1. User credit balance on profiles
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS credit_balance DECIMAL(12, 2) NOT NULL DEFAULT 0;

ALTER TABLE IF EXISTS public.profiles
  ADD CONSTRAINT profiles_credit_balance_non_negative
  CHECK (credit_balance >= 0);

COMMENT ON COLUMN public.profiles.credit_balance IS 'Wishbee Credits balance for use at checkout.';

-- 2. CreditTransaction — history (REFUND, SPEND, BONUS)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('REFUND', 'SPEND', 'BONUS')),
  wishbee_id UUID REFERENCES gifts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_wishbee_id ON credit_transactions(wishbee_id) WHERE wishbee_id IS NOT NULL;

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_transactions_select_own"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "credit_transactions_insert_service"
  ON credit_transactions FOR INSERT WITH CHECK (true);

COMMENT ON TABLE credit_transactions IS 'Wishbee Credits: REFUND (settlement to credits), SPEND (checkout), BONUS.';

-- 3. Gift status: settled_credits
ALTER TABLE gifts DROP CONSTRAINT IF EXISTS gifts_status_check;
ALTER TABLE gifts ADD CONSTRAINT gifts_status_check
  CHECK (status IN ('active', 'completed', 'cancelled', 'settled', 'refunding', 'settled_refund', 'settled_credits'));

COMMENT ON COLUMN gifts.status IS 'active | completed | cancelled | settled | refunding | settled_refund | settled_credits';

-- 4. Safe spend: row-level lock to prevent negative balance
CREATE OR REPLACE FUNCTION spend_credits(
  p_user_id UUID,
  p_amount DECIMAL,
  p_wishbee_id UUID DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_balance DECIMAL)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current DECIMAL(12,2);
  v_new_balance DECIMAL(12,2);
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN QUERY SELECT FALSE, NULL::DECIMAL;
    RETURN;
  END IF;
  SELECT credit_balance INTO v_current
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;
  IF NOT FOUND OR v_current IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::DECIMAL;
    RETURN;
  END IF;
  IF v_current < p_amount THEN
    RETURN QUERY SELECT FALSE, v_current;
    RETURN;
  END IF;
  v_new_balance := v_current - p_amount;
  UPDATE profiles SET credit_balance = v_new_balance, updated_at = NOW() WHERE id = p_user_id;
  INSERT INTO credit_transactions (user_id, amount, type, wishbee_id)
  VALUES (p_user_id, p_amount, 'SPEND', p_wishbee_id);
  RETURN QUERY SELECT TRUE, v_new_balance;
END;
$$;

COMMENT ON FUNCTION spend_credits IS 'Decrement user credit_balance; prevents negative balance. Returns (success, new_balance).';
