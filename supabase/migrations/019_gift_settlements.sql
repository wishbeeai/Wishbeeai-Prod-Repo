-- =============================================================================
-- GIFT SETTLEMENTS - Donation/Tip records for donation receipts
-- Migration: 019_gift_settlements.sql
-- Stores settlement records (charity donation, tip, bonus) for receipt display
-- =============================================================================

CREATE TABLE IF NOT EXISTS gift_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id UUID NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,

  -- Settlement details
  amount DECIMAL(12, 2) NOT NULL,
  disposition TEXT NOT NULL CHECK (disposition IN ('charity', 'tip', 'bonus')),

  -- Charity-specific
  charity_name TEXT,
  dedication TEXT,

  -- Context for receipt
  recipient_name TEXT,
  gift_name TEXT,
  total_funds_collected DECIMAL(12, 2),
  final_gift_price DECIMAL(12, 2),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_settlements_gift_id ON gift_settlements(gift_id);
CREATE INDEX IF NOT EXISTS idx_gift_settlements_created_at ON gift_settlements(created_at DESC);

ALTER TABLE gift_settlements ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can view a settlement (for receipt page via link)
DROP POLICY IF EXISTS "gift_settlements_select_public" ON gift_settlements;
CREATE POLICY "gift_settlements_select_public" ON gift_settlements
  FOR SELECT USING (true);

-- Authenticated users can insert for gifts they own
DROP POLICY IF EXISTS "gift_settlements_insert_own_gift" ON gift_settlements;
CREATE POLICY "gift_settlements_insert_own_gift" ON gift_settlements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM gifts WHERE gifts.id = gift_settlements.gift_id AND gifts.user_id = auth.uid()
    )
  );
