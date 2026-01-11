# Fix: Missing 'description' Column in wishlist_items

## Error
```
Could not find the 'description' column of 'wishlist_items' in the schema cache
Code: PGRST204
```

## Root Cause
The TypeScript types include `description` as an optional field, but the actual database table doesn't have this column. When queries use `.select("*")`, PostgREST validates against its schema cache and fails because `description` doesn't exist.

## Solution Applied

### 1. Created Migration File
✅ Created `supabase/migrations/002_add_description_to_wishlist_items.sql`

### 2. Updated Code to Explicitly Select Columns
Updated all queries to explicitly list columns (excluding `description` for now):

**Files Updated:**
- ✅ `app/api/extension/get-items/route.ts`
- ✅ `app/api/wishlist-items/all/route.ts`
- ✅ `hooks/use-wishlist-items.ts`
- ✅ `app/actions/wishlist-actions.ts`
- ✅ `app/api/wishlists/items/route.ts`
- ✅ `app/api/extension/add-item/route.ts`
- ✅ `lib/wishlist-helpers.ts`

All queries now explicitly select:
```
id, wishlist_id, product_name, product_url, product_price, product_image, quantity, priority, category, stock_status, created_at, updated_at, title, asin, image_url, list_price, currency, review_star, review_count, affiliate_url, source, price_snapshot_at, store_name
```

## Next Steps

### To Permanently Fix (Run Migration):

1. **Open Supabase Dashboard**
2. **Go to SQL Editor**
3. **Run this SQL:**

```sql
-- Add description column to wishlist_items table
ALTER TABLE wishlist_items 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment to document the column
COMMENT ON COLUMN wishlist_items.description IS 'Product description or notes about the wishlist item';
```

4. **Refresh PostgREST Schema Cache:**
   - Wait 10-30 seconds (automatic refresh)
   - OR go to Supabase Dashboard > API > Refresh Schema
   - OR restart your Supabase project (if local)

### After Migration is Applied:

Once the column exists, you can optionally update the queries to include `description` in the select list, or revert to using `.select("*")` if preferred.

## Current Status

✅ **Code is now resilient** - queries will work even without the `description` column
⚠️ **Migration needs to be run** - to add the column to the database
✅ **TypeScript types already include** `description?: string | null`

The error should be resolved after running the migration and refreshing the schema cache.
