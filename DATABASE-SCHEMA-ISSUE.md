# Database Schema Mismatch Issue

## Errors Found

1. **Column `wishlist_id` does not exist**
   ```
   Error: column wishlist_items.wishlist_id does not exist
   Code: 42703
   ```

2. **Column `description` does not exist**
   ```
   Error: Could not find the 'description' column of 'wishlist_items' in the schema cache
   Code: PGRST204
   ```

## Problem

The TypeScript types in `types/supabase.ts` show:
- `wishlist_id: string` (required)
- `description?: string | null` (optional)

But the actual database schema doesn't have these columns (or has different names).

## Solution

### Immediate Fix (Done)
- ✅ Removed `description` field from insert query

### Needed Fix (Pending)
- ⚠️ Need to verify the actual column name for the wishlist foreign key

## How to Check Database Schema

### Option 1: Supabase Dashboard
1. Open Supabase dashboard
2. Go to Table Editor
3. Select `wishlist_items` table
4. Check the column names

### Option 2: SQL Query
Run this in Supabase SQL Editor:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'wishlist_items'
ORDER BY ordinal_position;
```

### Option 3: Check Existing Working Code
Look at `app/api/wishlist-items/all/route.ts` which uses:
```typescript
.in("wishlist_id", wishlistIds)
```

If this route also fails, then the column name is definitely wrong.

## Possible Column Names

The column might be named:
- `wishlist_id` (what we're using - but doesn't exist)
- `wishlistId` (camelCase)
- `wishlist_uuid` 
- `wishlist_fk`
- Something else

Once we know the actual column name, we can update the code.



