# Admin Privileges Check for wishbeeai@gmail.com

## Where to See Admin Privileges

### 1. Header Menu (Desktop)
- **Location**: Click on "My Account" button in the header (top right)
- **What you should see**: 
  - Profile
  - Settings
  - **Manage Affiliate Products** ← This is the admin menu item
  - Logout

### 2. Header Menu (Mobile)
- **Location**: Click the hamburger menu (☰) icon
- **What you should see**:
  - All menu items
  - **Manage Affiliate Products** ← This is the admin menu item
  - Profile
  - Settings
  - Logout

### 3. Direct URL Access
- **URL**: `/admin/affiliate-products`
- **What you should see**: Full admin page with product management

## How to Verify Admin Status

1. **Check Browser Console**:
   - Open browser DevTools (F12)
   - Go to Console tab
   - Log in with wishbeeai@gmail.com
   - Look for logs:
     ```
     [Header] User email: wishbeeai@gmail.com
     [Header] Admin email: wishbeeai@gmail.com
     [Header] Is admin: true
     ```

2. **Verify Login**:
   - Make sure you're logged in with: `wishbeeai@gmail.com`
   - Check that the email matches exactly (case-insensitive)

3. **Check Menu Visibility**:
   - After logging in, click on "My Account" dropdown
   - You should see "Manage Affiliate Products" between Settings and Logout

## Troubleshooting

If you don't see the admin menu:
1. Verify you're logged in with `wishbeeai@gmail.com`
2. Check browser console for debug logs
3. Try logging out and logging back in
4. Clear browser cache and cookies
5. Check that the email in Supabase matches exactly

## Admin Features Available

- ✅ View all affiliate products
- ✅ Add new products
- ✅ Edit existing products
- ✅ Delete products
- ✅ Search and filter products
- ✅ Pagination controls
