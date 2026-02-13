# How to Recover Deleted Wishlist Items

## What Happened
You clicked "Clear" in the browser extension, which deleted all wishlist items from the database permanently.

## Recovery Options

### Option 1: Check Supabase Backups (BEST CHANCE)
Supabase may have automatic backups you can restore from:

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard
   - Select your project

2. **Check Database Backups**
   - Go to **Database** → **Backups** (or **Point-in-time Recovery**)
   - Look for backups from **before** you cleared the items
   - If available, you can restore the database to that point

3. **Restore from Backup**
   - Click on a backup from before the deletion
   - Follow Supabase's restore instructions
   - **WARNING**: This will restore the entire database to that point, overwriting any new data

### Option 2: Check Extension Local Storage (MAYBE)
The extension stores items in browser local storage. If you haven't cleared browser data, they might still be there:

1. **Open Extension Popup**
   - Click the Wishbee extension icon in your browser

2. **Open Browser DevTools**
   - Right-click the extension popup → **Inspect**
   - Or press `F12` while popup is open

3. **Check Local Storage**
   - Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
   - Expand **Local Storage**
   - Look for `chrome-extension://[extension-id]` or similar
   - Check for a `wishlist` key

4. **If Items Found:**
   - Copy the JSON data
   - You can manually re-add items or we can create a script to restore them

### Option 3: Check Browser History
If you recently visited the product pages:
- Check your browser history
- Find the product URLs
- Re-add them to your wishlist

### Option 4: Manual Re-add
If no backups are available, you'll need to manually re-add items:
- Use the "Add Wishlist" button on `/wishlist` page
- Use the extension to clip items again
- Use the "Add to Wishlist" feature from product pages

## Prevention for Future

### Make Extension Clear Button Safer
We should modify the extension to:
1. Add a confirmation dialog with a warning
2. Optionally move items to "Deleted" instead of permanent deletion
3. Add a "Recently Deleted" section with restore option

### Enable Supabase Backups
1. Go to Supabase Dashboard → **Database** → **Backups**
2. Enable **Point-in-time Recovery** (if available on your plan)
3. This allows you to restore to any point in time

## Quick Check Commands

### Check Extension Local Storage (in browser console):
```javascript
// Run this in the extension popup's console
chrome.storage.local.get('wishlist', (data) => {
  console.log('Local wishlist items:', data.wishlist);
  console.log('Item count:', data.wishlist?.length || 0);
});
```

### Check Supabase Backups:
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Navigate to: **Database** → **Backups**
4. Look for backups from before the deletion date

## If Items Are Found in Local Storage

If you find items in the extension's local storage, I can help you:
1. Export the data
2. Create a script to restore them to the database
3. Re-add them to your wishlist

Let me know what you find!
