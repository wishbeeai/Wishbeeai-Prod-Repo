# Fix Database Schema - Critical Issue

## Problem

The `wishlist_items` table is **MISSING the `wishlist_id` column** which is required to link items to wishlists.

## Current Database Schema

The table has these columns:
- id, product_url, asin, title, image_url, list_price, currency, review_star, review_count, price_snapshot_at, affiliate_url, source, created_at

**But it's MISSING:**
- `wishlist_id` (foreign key to wishlists table) ❌

## Solution

### Step 1: Add wishlist_id Column

Run this SQL in Supabase SQL Editor:

```sql
-- Add wishlist_id column (foreign key to wishlists table)
ALTER TABLE wishlist_items 
ADD COLUMN wishlist_id UUID REFERENCES wishlists(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX idx_wishlist_items_wishlist_id ON wishlist_items(wishlist_id);
```

Or use the migration file: `supabase/migrations/add_wishlist_id_to_wishlist_items.sql`

### Step 2: Update Existing Data (if any)

If you have existing rows in `wishlist_items`, you'll need to set `wishlist_id` for them:

```sql
-- Example: Assign existing items to the first wishlist of each user
-- (Adjust this based on your needs)
UPDATE wishlist_items 
SET wishlist_id = (
  SELECT w.id 
  FROM wishlists w 
  WHERE w.user_id = ... 
  LIMIT 1
);
```

### Step 3: Make Column Required (Optional)

If you want to enforce that all items must belong to a wishlist:

```sql
ALTER TABLE wishlist_items 
ALTER COLUMN wishlist_id SET NOT NULL;
```

## Code Changes Made

✅ Updated `app/api/extension/add-item/route.ts` to use correct column names:
- `title` (instead of product_name)
- `list_price` (in cents, instead of product_price)  
- `image_url` (instead of product_image)
- `product_url` (same)

✅ Updated `app/api/extension/get-items/route.ts` to map from database schema to extension format

## After Running Migration

1. The extension should work correctly
2. Items will be properly linked to wishlists
3. The 500 errors should be resolved

## Verify

After running the migration, verify the column exists:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'wishlist_items' 
AND column_name = 'wishlist_id';
```

You should see:
| column_name | data_type |
|-------------|-----------|
| wishlist_id | uuid      |





