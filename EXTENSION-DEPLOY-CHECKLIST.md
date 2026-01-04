# Extension API - Deployment Checklist

## Code Changes Made ✅

### 1. `app/api/extension/add-item/route.ts`
- ✅ Updated column mappings:
  - `title` (instead of product_name)
  - `list_price` in cents (instead of product_price)
  - `image_url` (instead of product_image)
  - `product_url` (same)
- ✅ Added required fields:
  - `currency: 'USD'`
  - `source: 'extension'`
  - `price_snapshot_at: new Date()`
- ✅ Removed non-existent columns:
  - `product_name`
  - `product_price`
  - `product_image`
  - `quantity`
  - `description`

### 2. `app/api/extension/get-items/route.ts`
- ✅ Updated to map from database schema:
  - `title` → `title`
  - `list_price` (cents) → `price` (dollars: divide by 100)
  - `image_url` → `image`
  - `product_url` → `url`

### 3. Extension popup.js
- ✅ API URL set to: `https://www.wishbee.ai`

## Database Status ✅

- ✅ `wishlist_id` column exists (confirmed by user)
- ✅ Schema columns: id, product_url, asin, title, image_url, list_price, currency, review_star, review_count, price_snapshot_at, affiliate_url, source, created_at

## Next Steps

1. **Deploy Code Changes**
   - Commit the changes
   - Deploy to production

2. **Test After Deployment**
   - Reload extension in Chrome
   - Try clipping an item
   - Check if it syncs successfully

3. **If Still Getting 500 Errors**
   - Check production server logs
   - Verify the exact error message
   - The logs should show which column is causing the issue

## Expected Behavior After Fix

- Extension should successfully add items to database
- Items should appear in the "My Wishlist" page
- No more 500 errors from `/api/extension/add-item`

