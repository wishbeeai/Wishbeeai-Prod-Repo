-- =============================================================================
-- Ensure gifts table has correct schema (fixes PGRST204: collection_title, etc.)
-- Run this ENTIRE file in Supabase SQL Editor. Then: Project Settings -> API -> Reload schema.
-- WARNING: DROP TABLE removes all existing rows in gifts.
-- =============================================================================

DROP TABLE IF EXISTS gifts CASCADE;

CREATE TABLE gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collection_title TEXT NOT NULL,
  gift_name TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(12, 2) NOT NULL,
  current_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  contributors INTEGER NOT NULL DEFAULT 0,
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  banner_image TEXT,
  product_image TEXT,
  product_link TEXT,
  product_name TEXT,
  category TEXT,
  brand TEXT,
  store_name TEXT,
  price DECIMAL(12, 2),
  rating DECIMAL(3, 2),
  review_count INTEGER,
  specifications JSONB,
  preference_options JSONB,
  recipient_name TEXT,
  occasion TEXT,
  evite_settings JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gifts_user_id ON gifts(user_id);
CREATE INDEX idx_gifts_status ON gifts(status);
CREATE INDEX idx_gifts_deadline ON gifts(deadline);
CREATE INDEX idx_gifts_created_at ON gifts(created_at DESC);

ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gifts_select_own" ON gifts;
DROP POLICY IF EXISTS "gifts_insert_own" ON gifts;
DROP POLICY IF EXISTS "gifts_update_own" ON gifts;
DROP POLICY IF EXISTS "gifts_delete_own" ON gifts;
DROP POLICY IF EXISTS "gifts_select_public_for_contribute" ON gifts;

CREATE POLICY "gifts_select_own" ON gifts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "gifts_insert_own" ON gifts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "gifts_update_own" ON gifts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "gifts_delete_own" ON gifts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "gifts_select_public_for_contribute" ON gifts FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION update_gifts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gifts_updated_at ON gifts;
CREATE TRIGGER trigger_update_gifts_updated_at
  BEFORE UPDATE ON gifts
  FOR EACH ROW
  EXECUTE PROCEDURE update_gifts_updated_at();
