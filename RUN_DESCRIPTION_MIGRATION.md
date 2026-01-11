# Fix: Add Description Column to wishlist_items Table

## Problem
The application is throwing the error: **"Could not find the 'description' column of 'wishlist_items' in the schema cache"**

This happens because:
- The TypeScript types (`types/supabase.ts`) include `description?: string | null` in the `wishlist_items` table
- The actual Supabase database table doesn't have this column yet
- PostgREST validates queries against the schema cache and fails when it sees references to a non-existent column

## Solution

### Step 1: Run the Database Migration

The migration file is already created at: `supabase/migrations/002_add_description_to_wishlist_items.sql`

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/002_add_description_to_wishlist_items.sql`:

```sql
-- Migration: Add description column to wishlist_items table
-- This column is referenced in the TypeScript types and code but doesn't exist in the database
-- Error: Could not find the 'description' column of 'wishlist_items' in the schema cache

-- Add description column (nullable text field)
ALTER TABLE wishlist_items 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment to document the column
COMMENT ON COLUMN wishlist_items.description IS 'Product description or notes about the wishlist item';
```

5. Click **Run** (or press `Cmd+Enter` / `Ctrl+Enter`)
6. Wait for the query to complete successfully

**Option B: Using Supabase CLI**

If you have Supabase CLI installed:

```bash
# Make sure you're in the project root directory
cd /Users/segar/Desktop/Wishbeeai-Prod

# Link to your Supabase project (if not already linked)
supabase link --project-ref your-project-ref

# Run the migration
supabase db push
```

### Step 2: Wait for Schema Cache Refresh

After running the migration, PostgREST will automatically refresh its schema cache:

- **Wait 5-10 seconds** - PostgREST automatically refreshes its schema cache periodically
- The cache refresh happens automatically; there's no manual button needed
- Try your application again after waiting a few seconds

**Note:** If you're running Supabase locally, you may need to restart:
```bash
supabase stop
supabase start
```

### Step 3: Verify the Migration

Run this query in the SQL Editor to verify the column exists:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'wishlist_items' 
AND column_name = 'description';
```

You should see:
```
column_name  | data_type | is_nullable
-------------|-----------|-------------
description  | text      | YES
```

### Step 4: Test the Application

1. Try adding a wishlist item through the application
2. The error should no longer appear
3. You can now use the `description` field in your queries

## Temporary Workaround (Already Applied)

As a temporary measure, I've updated the code to filter out `description` from insert/update operations:

- ✅ `app/actions/wishlist-actions.ts` - Filters out `description` from inserts/updates
- ✅ All `.select()` queries explicitly list columns (excluding `description`)

**Note:** After running the migration, you can remove the `description` filtering code from `app/actions/wishlist-actions.ts` (marked with `TODO` comments).

## Files Modified

- ✅ `supabase/migrations/002_add_description_to_wishlist_items.sql` - Migration file (created)
- ✅ `app/actions/wishlist-actions.ts` - Temporary filter for `description` (updated)
- ✅ All API routes - Explicit column selection (already updated)

## After Migration

Once the migration is complete and verified:

1. The error will stop appearing
2. You can use `description` in inserts/updates
3. You can remove the temporary filtering code in `app/actions/wishlist-actions.ts` (the `TODO` comments mark these)

---

**Need Help?**
- Check Supabase logs: Dashboard > Logs > Postgres Logs
- Verify your database connection settings
- Ensure you have the correct permissions to alter tables
