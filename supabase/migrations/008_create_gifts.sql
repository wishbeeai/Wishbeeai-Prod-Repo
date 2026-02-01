-- =============================================================================
-- GIFT COLLECTIONS - Database Schema
-- Migration: 008_create_gifts.sql
-- Stores user-created gift collections (Create Gift Collection flow)
-- =============================================================================

-- =============================================================================
-- GIFTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Core fields (required for create)
  collection_title TEXT NOT NULL,
  gift_name TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(12, 2) NOT NULL,
  current_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  contributors INTEGER NOT NULL DEFAULT 0,
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),

  -- Display & product
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

  -- Event / recipient
  recipient_name TEXT,
  occasion TEXT,
  evite_settings JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_gifts_user_id ON gifts(user_id);
CREATE INDEX IF NOT EXISTS idx_gifts_status ON gifts(status);
CREATE INDEX IF NOT EXISTS idx_gifts_deadline ON gifts(deadline);
CREATE INDEX IF NOT EXISTS idx_gifts_created_at ON gifts(created_at DESC);

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;

-- Users can read/insert/update/delete only their own gifts
CREATE POLICY "gifts_select_own" ON gifts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "gifts_insert_own" ON gifts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "gifts_update_own" ON gifts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "gifts_delete_own" ON gifts
  FOR DELETE USING (auth.uid() = user_id);

-- Public read for contribute page (anyone with link can view gift details)
CREATE POLICY "gifts_select_public_for_contribute" ON gifts
  FOR SELECT USING (true);

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

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
  EXECUTE FUNCTION update_gifts_updated_at();
