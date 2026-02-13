# How to Restore Trending Gifts from Browser Console

## Understanding the Issue

Trending gifts are stored in the **Supabase database** (`trending_gifts` table), not in browser localStorage. If products disappeared after clearing the extension, they may have been deleted from the database.

## Quick Check: Are Products Still in Database?

### Method 1: Check via API (Browser Console)

Open your browser console (F12) on the trending gifts page (`/gifts/trending`) and run:

```javascript
// Check if trending gifts exist in database
fetch('/api/trending-gifts')
  .then(res => res.json())
  .then(data => {
    console.log('Trending gifts count:', data.total || data.gifts?.length || 0);
    console.log('Trending gifts:', data.gifts);
    
    if (data.gifts && data.gifts.length > 0) {
      console.log('✅ Products found in database!');
      console.table(data.gifts.map(g => ({
        id: g.id,
        name: g.productName,
        price: g.price,
        source: g.source,
        created: g.createdAt
      })));
    } else {
      console.log('❌ No products found in database');
    }
  })
  .catch(err => console.error('Error:', err));
```

### Method 2: Check via Supabase Direct Query (If you have access)

If you have Supabase credentials, you can check directly:

```sql
-- Check if products exist
SELECT COUNT(*) as total FROM trending_gifts;

-- See all products
SELECT 
  id,
  product_name,
  price,
  source,
  created_at
FROM trending_gifts
ORDER BY created_at DESC;
```

## Restore from Browser Console

### Step 1: Check Database First

```javascript
// Run this first to see what's in the database
fetch('/api/trending-gifts')
  .then(res => res.json())
  .then(data => {
    console.log('Current trending gifts:', data);
    window.__trendingGiftsBackup = data.gifts || [];
    console.log('✅ Backed up to window.__trendingGiftsBackup');
  });
```

### Step 2: If Products Are Missing - Check Supabase Backups

If the database is empty, check Supabase backups:

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Navigate to: **Database** → **Backups** (or **Point-in-time Recovery**)
4. Look for backups from **before** you cleared the extension
5. Restore from backup if available

### Step 3: Restore Products Manually (If you have product data)

If you have the product information saved somewhere, you can restore via console:

```javascript
// Example: Restore a single product
async function restoreTrendingGift(productData) {
  try {
    const response = await fetch('/api/trending-gifts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productName: productData.productName,
        image: productData.image,
        price: productData.price,
        productLink: productData.productLink,
        category: productData.category || 'General',
        source: productData.source || 'Unknown',
        rating: productData.rating || 0,
        reviewCount: productData.reviewCount || 0,
        description: productData.description,
        originalPrice: productData.originalPrice,
        amazonChoice: productData.amazonChoice || false,
        bestSeller: productData.bestSeller || false,
        attributes: productData.attributes || {}
      })
    });
    
    const result = await response.json();
    if (result.success) {
      console.log('✅ Product restored:', result.gift);
      return result.gift;
    } else {
      console.error('❌ Failed to restore:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error restoring product:', error);
    return null;
  }
}

// Example usage:
// restoreTrendingGift({
//   productName: "Example Product",
//   image: "https://example.com/image.jpg",
//   price: 99.99,
//   productLink: "https://example.com/product",
//   category: "Electronics",
//   source: "Amazon"
// });
```

### Step 4: Bulk Restore (If you have multiple products)

```javascript
// Restore multiple products at once
async function restoreMultipleTrendingGifts(productsArray) {
  const results = [];
  
  for (const product of productsArray) {
    console.log(`Restoring: ${product.productName}...`);
    const result = await restoreTrendingGift(product);
    results.push(result);
    
    // Wait 500ms between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`✅ Restored ${results.filter(r => r).length} of ${productsArray.length} products`);
  return results;
}

// Example usage:
// restoreMultipleTrendingGifts([
//   { productName: "Product 1", image: "...", price: 99, productLink: "..." },
//   { productName: "Product 2", image: "...", price: 149, productLink: "..." }
// ]);
```

## Check Extension Local Storage (If Extension Stores Data)

The extension might have cached data. Check extension storage:

```javascript
// For Chrome Extension
chrome.storage.local.get(null, (data) => {
  console.log('Extension storage:', data);
  
  // Look for trending gifts or product data
  if (data.trendingGifts) {
    console.log('Found trending gifts in extension:', data.trendingGifts);
    window.__extensionTrendingGifts = data.trendingGifts;
  }
});

// For Firefox Extension
browser.storage.local.get(null).then((data) => {
  console.log('Extension storage:', data);
  if (data.trendingGifts) {
    console.log('Found trending gifts in extension:', data.trendingGifts);
    window.__extensionTrendingGifts = data.trendingGifts;
  }
});
```

## Export Current Data (Before Making Changes)

Always backup first:

```javascript
// Export all trending gifts to JSON
fetch('/api/trending-gifts')
  .then(res => res.json())
  .then(data => {
    const json = JSON.stringify(data.gifts || [], null, 2);
    console.log('Trending gifts JSON:');
    console.log(json);
    
    // Copy to clipboard (if supported)
    navigator.clipboard.writeText(json).then(() => {
      console.log('✅ Copied to clipboard!');
    }).catch(() => {
      console.log('⚠️ Could not copy to clipboard. Copy manually from above.');
    });
    
    // Also save to window for easy access
    window.__trendingGiftsExport = data.gifts || [];
  });
```

## Check Server Logs

If products were deleted, check server logs for deletion events:

1. Check your deployment logs (Vercel, Netlify, etc.)
2. Look for DELETE requests to `/api/trending-gifts`
3. Check Supabase logs for DELETE operations on `trending_gifts` table

## Prevention: Make Extension Safer

To prevent accidental deletion in the future, we should:

1. **Add confirmation dialog** before clearing
2. **Add "Recently Deleted" section** with restore option
3. **Soft delete** instead of permanent deletion (add `deleted_at` column)

## Quick Diagnostic Commands

Run these in browser console to diagnose the issue:

```javascript
// 1. Check API endpoint
fetch('/api/trending-gifts').then(r => r.json()).then(d => console.log('API Response:', d));

// 2. Check if you're logged in (required for POST/DELETE)
fetch('/api/auth/user').then(r => r.json()).then(d => console.log('Auth:', d));

// 3. Check database connection
fetch('/api/gifts').then(r => r.json()).then(d => console.log('Gifts API:', d));

// 4. Check in-memory store (if accessible)
console.log('In-memory store:', window.__trendingGiftsStore);
```

## If All Else Fails

1. **Check Supabase Dashboard** → **Table Editor** → `trending_gifts`
2. **Check if RLS (Row Level Security) is blocking access**
3. **Check if you have admin permissions** to add/remove trending gifts
4. **Contact support** with the diagnostic information above

## Need Help?

If you need to restore specific products, provide:
- Product names/URLs
- Product images
- Prices
- Any other product details

I can help create a restore script tailored to your data.
