-- Create affiliate_products table for admin-managed affiliate products
-- This table stores products that admins add for display on trending/browse pages

CREATE TABLE IF NOT EXISTS affiliate_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  image TEXT,
  category TEXT NOT NULL,
  source TEXT NOT NULL,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  product_link TEXT,
  amazon_choice BOOLEAN DEFAULT FALSE,
  best_seller BOOLEAN DEFAULT FALSE,
  overall_pick BOOLEAN DEFAULT FALSE,
  attributes JSONB,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_affiliate_products_category ON affiliate_products(category);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_source ON affiliate_products(source);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_created_at ON affiliate_products(created_at DESC);

-- Enable RLS
ALTER TABLE affiliate_products ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (products are shown to all users)
CREATE POLICY "affiliate_products_public_read" ON affiliate_products
  FOR SELECT
  USING (true);

-- Policy: Only authenticated users can insert/update/delete (admin check done in API)
CREATE POLICY "affiliate_products_admin_insert" ON affiliate_products
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "affiliate_products_admin_update" ON affiliate_products
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "affiliate_products_admin_delete" ON affiliate_products
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_affiliate_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_affiliate_products_updated_at ON affiliate_products;
CREATE TRIGGER trigger_update_affiliate_products_updated_at
  BEFORE UPDATE ON affiliate_products
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_products_updated_at();
