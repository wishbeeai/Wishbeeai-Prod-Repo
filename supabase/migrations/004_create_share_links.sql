-- Migration: Create share_links table for wishlist sharing functionality
-- This table stores shareable links for wishlists and individual products

-- Create the share_links table
CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- The unique token used in the share URL (e.g., /s/:token)
  -- Must be URL-safe and unguessable
  token VARCHAR(32) UNIQUE NOT NULL,
  
  -- Reference to the wishlist being shared
  wishlist_id UUID REFERENCES wishlists(id) ON DELETE CASCADE,
  
  -- Optional: Reference to a specific product/item being shared
  -- If null, the entire wishlist is shared
  product_id UUID REFERENCES wishlist_items(id) ON DELETE CASCADE,
  
  -- The user who created this share link
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Access level: 'view' (read-only) or 'contribute' (can contribute to gifts)
  access_level VARCHAR(20) NOT NULL DEFAULT 'view' CHECK (access_level IN ('view', 'contribute')),
  
  -- Optional expiration date for the share link
  expires_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  
  -- Track usage
  view_count INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);
CREATE INDEX IF NOT EXISTS idx_share_links_wishlist_id ON share_links(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_share_links_created_by ON share_links(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_share_links_product_id ON share_links(product_id);

-- Enable Row Level Security
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create share links for their own wishlists
CREATE POLICY "Users can create share links for own wishlists"
  ON share_links
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by_user_id = auth.uid()
    AND (
      -- For wishlist shares, verify ownership
      wishlist_id IS NULL
      OR EXISTS (
        SELECT 1 FROM wishlists WHERE id = wishlist_id AND user_id = auth.uid()
      )
    )
  );

-- Policy: Users can view their own share links
CREATE POLICY "Users can view own share links"
  ON share_links
  FOR SELECT
  TO authenticated
  USING (created_by_user_id = auth.uid());

-- Policy: Anyone can view share links by token (for public access)
-- This is handled by the API route with service role
CREATE POLICY "Public can view share links by token"
  ON share_links
  FOR SELECT
  TO anon
  USING (
    -- Only allow access to non-expired links
    expires_at IS NULL OR expires_at > NOW()
  );

-- Policy: Users can update their own share links
CREATE POLICY "Users can update own share links"
  ON share_links
  FOR UPDATE
  TO authenticated
  USING (created_by_user_id = auth.uid())
  WITH CHECK (created_by_user_id = auth.uid());

-- Policy: Users can delete their own share links
CREATE POLICY "Users can delete own share links"
  ON share_links
  FOR DELETE
  TO authenticated
  USING (created_by_user_id = auth.uid());

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_share_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_share_links_updated_at
  BEFORE UPDATE ON share_links
  FOR EACH ROW
  EXECUTE FUNCTION update_share_links_updated_at();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_share_link_views(link_token VARCHAR)
RETURNS void AS $$
BEGIN
  UPDATE share_links 
  SET 
    view_count = view_count + 1,
    last_viewed_at = NOW()
  WHERE token = link_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION increment_share_link_views(VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION increment_share_link_views(VARCHAR) TO authenticated;
