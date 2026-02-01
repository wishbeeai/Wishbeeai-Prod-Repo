-- Create trending_gifts table for products added to trending gifts
-- This table stores products that are displayed on the trending gifts page

CREATE TABLE IF NOT EXISTS trending_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  image TEXT,
  category TEXT NOT NULL,
  source TEXT NOT NULL,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  product_link TEXT NOT NULL,
  description TEXT,
  amazon_choice BOOLEAN DEFAULT FALSE,
  best_seller BOOLEAN DEFAULT FALSE,
  overall_pick BOOLEAN DEFAULT FALSE,
  attributes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure unique product links (prevent duplicates)
  CONSTRAINT unique_product_link UNIQUE (product_link)
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_trending_gifts_category ON trending_gifts(category);
CREATE INDEX IF NOT EXISTS idx_trending_gifts_source ON trending_gifts(source);
CREATE INDEX IF NOT EXISTS idx_trending_gifts_created_at ON trending_gifts(created_at DESC);

-- Enable RLS
ALTER TABLE trending_gifts ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (so migration can be re-run)
DROP POLICY IF EXISTS "trending_gifts_public_read" ON trending_gifts;
DROP POLICY IF EXISTS "trending_gifts_admin_insert" ON trending_gifts;
DROP POLICY IF EXISTS "trending_gifts_admin_update" ON trending_gifts;
DROP POLICY IF EXISTS "trending_gifts_admin_delete" ON trending_gifts;

-- Policy: Allow public read access (trending gifts are shown to all users)
CREATE POLICY "trending_gifts_public_read" ON trending_gifts
  FOR SELECT
  USING (true);

-- Policy: Only authenticated users can insert/update/delete (admin check done in API)
CREATE POLICY "trending_gifts_admin_insert" ON trending_gifts
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "trending_gifts_admin_update" ON trending_gifts
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "trending_gifts_admin_delete" ON trending_gifts
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_trending_gifts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_trending_gifts_updated_at ON trending_gifts;
CREATE TRIGGER trigger_update_trending_gifts_updated_at
  BEFORE UPDATE ON trending_gifts
  FOR EACH ROW
  EXECUTE FUNCTION update_trending_gifts_updated_at();
