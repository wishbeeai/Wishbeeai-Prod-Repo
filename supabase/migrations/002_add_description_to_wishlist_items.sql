-- Migration: Add description column to wishlist_items table
-- This column is referenced in the TypeScript types and code but doesn't exist in the database
-- Error: Could not find the 'description' column of 'wishlist_items' in the schema cache

-- Add description column (nullable text field)
ALTER TABLE wishlist_items 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment to document the column
COMMENT ON COLUMN wishlist_items.description IS 'Product description or notes about the wishlist item';

-- Note: After running this migration, Supabase PostgREST will automatically refresh its schema cache
-- PostgREST refreshes its schema cache automatically every few seconds
-- If you still see the error after running this migration:
-- 1. Wait 5-10 seconds for the cache to refresh automatically
-- 2. Or restart your Supabase project (if using local development: `supabase stop && supabase start`)
