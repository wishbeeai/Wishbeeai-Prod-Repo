-- Store each contribution for "Recent Contributions" display (name, amount, time).
-- Run in Supabase SQL Editor, then: Project Settings -> API -> Reload schema.

CREATE TABLE IF NOT EXISTS gift_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id UUID NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
  contributor_name TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_contributions_gift_id ON gift_contributions(gift_id);
CREATE INDEX IF NOT EXISTS idx_gift_contributions_created_at ON gift_contributions(gift_id, created_at DESC);

ALTER TABLE gift_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gift_contributions_select"
  ON gift_contributions FOR SELECT
  USING (true);

CREATE POLICY "gift_contributions_insert"
  ON gift_contributions FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE gift_contributions IS 'One row per contribution for Recent Contributions display.';
