-- Migration: Add wishlist_id column to wishlist_items table
-- This column is required to link items to wishlists

-- Add wishlist_id column (foreign key to wishlists table)
ALTER TABLE wishlist_items 
ADD COLUMN IF NOT EXISTS wishlist_id UUID REFERENCES wishlists(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_id ON wishlist_items(wishlist_id);

-- Add not null constraint (optional - uncomment if you want to enforce it)
-- ALTER TABLE wishlist_items ALTER COLUMN wishlist_id SET NOT NULL;

-- Note: If you have existing data, you'll need to set wishlist_id for existing rows
-- Example: UPDATE wishlist_items SET wishlist_id = (SELECT id FROM wishlists WHERE user_id = ... LIMIT 1);


