-- ============================================
-- SQL Queries to Check Wishlist Data in Supabase
-- ============================================
-- Run these in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ============================================
-- IMPORTANT: Replace 'wishbeeai@gmail.com' with your actual email address
-- ============================================

-- 1. CHECK YOUR USER ID AND EMAIL (RUN THIS FIRST!)
-- Replace 'wishbeeai@gmail.com' with your actual email
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'wishbeeai@gmail.com';

-- 2. CHECK ALL YOUR WISHLISTS (using email - no need to copy UUID!)
-- Replace 'wishbeeai@gmail.com' with your actual email
SELECT 
  w.id,
  w.title,
  w.description,
  w.user_id,
  u.email,
  w.created_at,
  w.updated_at
FROM wishlists w
JOIN auth.users u ON w.user_id = u.id
WHERE u.email = 'wishbeeai@gmail.com'
ORDER BY w.created_at DESC;

-- 3. CHECK ALL WISHLIST ITEMS (for your wishlists - using email!)
-- Replace 'wishbeeai@gmail.com' with your actual email
SELECT 
  wi.id,
  wi.wishlist_id,
  w.title as wishlist_title,
  wi.title as item_title,
  wi.product_url,
  wi.image_url,
  wi.list_price,
  wi.created_at
FROM wishlist_items wi
JOIN wishlists w ON wi.wishlist_id = w.id
JOIN auth.users u ON w.user_id = u.id
WHERE u.email = 'wishbeeai@gmail.com'
ORDER BY wi.created_at DESC;

-- 4. COUNT YOUR WISHLISTS AND ITEMS (using email!)
-- Replace 'wishbeeai@gmail.com' with your actual email
SELECT 
  (SELECT COUNT(*) 
   FROM wishlists w
   JOIN auth.users u ON w.user_id = u.id
   WHERE u.email = 'wishbeeai@gmail.com') as total_wishlists,
  (SELECT COUNT(*) 
   FROM wishlist_items wi
   JOIN wishlists w ON wi.wishlist_id = w.id
   JOIN auth.users u ON w.user_id = u.id
   WHERE u.email = 'wishbeeai@gmail.com') as total_items;

-- 5. CHECK ITEMS WITHOUT WISHLIST (orphaned items)
-- These might not show up if they're not linked to a wishlist
SELECT 
  id,
  wishlist_id,
  title,
  product_url,
  created_at
FROM wishlist_items
WHERE wishlist_id IS NULL
ORDER BY created_at DESC;

-- 6. CHECK ALL ITEMS IN DATABASE (admin view)
-- Shows all items regardless of user
SELECT 
  wi.id,
  wi.wishlist_id,
  wi.title,
  wi.product_url,
  w.user_id,
  w.title as wishlist_title,
  wi.created_at
FROM wishlist_items wi
LEFT JOIN wishlists w ON wi.wishlist_id = w.id
ORDER BY wi.created_at DESC
LIMIT 50;

-- 7. FIND YOUR USER ID BY EMAIL (quick lookup)
-- Replace 'wishbeeai@gmail.com' with your actual email
SELECT id, email FROM auth.users WHERE email = 'wishbeeai@gmail.com';

-- ============================================
-- DIAGNOSTIC QUERIES - Find Missing Items
-- ============================================

-- 8. CHECK IF ANY ITEMS EXIST AT ALL (regardless of user)
SELECT COUNT(*) as total_items_in_database FROM wishlist_items;

-- 9. CHECK ITEMS WITH NULL wishlist_id (orphaned items)
SELECT 
  COUNT(*) as orphaned_items_count,
  MIN(created_at) as oldest_orphan,
  MAX(created_at) as newest_orphan
FROM wishlist_items
WHERE wishlist_id IS NULL;

-- 10. LIST ALL ORPHANED ITEMS (items without wishlist)
SELECT 
  id,
  wishlist_id,
  title,
  product_url,
  image_url,
  created_at
FROM wishlist_items
WHERE wishlist_id IS NULL
ORDER BY created_at DESC;

-- 11. CHECK ITEMS THAT MIGHT BELONG TO DELETED WISHLISTS
SELECT 
  wi.id,
  wi.wishlist_id,
  wi.title,
  wi.created_at,
  w.id as wishlist_exists
FROM wishlist_items wi
LEFT JOIN wishlists w ON wi.wishlist_id = w.id
WHERE w.id IS NULL
ORDER BY wi.created_at DESC;

-- 12. CHECK ALL WISHLISTS (to see if any exist)
SELECT 
  id,
  user_id,
  title,
  created_at,
  (SELECT COUNT(*) FROM wishlist_items WHERE wishlist_id = wishlists.id) as item_count
FROM wishlists
ORDER BY created_at DESC;

-- 13. FIND ITEMS BY CREATION DATE (recent items)
SELECT 
  id,
  wishlist_id,
  title,
  product_url,
  created_at
FROM wishlist_items
ORDER BY created_at DESC
LIMIT 20;

-- 14. CHECK IF ITEMS EXIST BUT BELONG TO DIFFERENT USER
-- Replace 'wishbeeai@gmail.com' with your actual email
SELECT 
  wi.id,
  wi.wishlist_id,
  wi.title,
  u.email as wishlist_owner_email,
  w.title as wishlist_title
FROM wishlist_items wi
LEFT JOIN wishlists w ON wi.wishlist_id = w.id
LEFT JOIN auth.users u ON w.user_id = u.id
WHERE u.email != 'wishbeeai@gmail.com' OR u.email IS NULL
ORDER BY wi.created_at DESC
LIMIT 20;

-- ============================================
-- QUICK CHECK (Run this - uses email, no UUID needed!)
-- ============================================
-- Replace 'wishbeeai@gmail.com' with your actual email

-- Step 1: Check wishlists count
SELECT COUNT(*) as wishlist_count 
FROM wishlists w
JOIN auth.users u ON w.user_id = u.id
WHERE u.email = 'wishbeeai@gmail.com';

-- Step 2: Check items count
SELECT COUNT(*) as item_count 
FROM wishlist_items wi
JOIN wishlists w ON wi.wishlist_id = w.id
JOIN auth.users u ON w.user_id = u.id
WHERE u.email = 'wishbeeai@gmail.com';

-- ============================================
-- RECOVERY QUERIES - If items exist but aren't linked
-- ============================================

-- 15. RECOVER ORPHANED ITEMS (assign to first wishlist)
-- WARNING: Only run this if you're sure! Replace YOUR_USER_ID and YOUR_WISHLIST_ID
/*
UPDATE wishlist_items
SET wishlist_id = 'YOUR_WISHLIST_ID'
WHERE wishlist_id IS NULL
AND EXISTS (
  SELECT 1 FROM wishlists 
  WHERE id = 'YOUR_WISHLIST_ID' 
  AND user_id = 'YOUR_USER_ID'
);
*/

-- ============================================
-- CHECK ITEMS ADDED FROM TRENDING GIFTS
-- ============================================

-- 16. CHECK RECENT ITEMS FOR YOUR EMAIL (last 7 days)
-- Replace 'wishbeeai@gmail.com' with your actual email
SELECT 
  wi.id,
  wi.wishlist_id,
  w.title as wishlist_title,
  wi.title as item_title,
  wi.product_url,
  wi.source,
  wi.created_at,
  u.email as owner_email
FROM wishlist_items wi
LEFT JOIN wishlists w ON wi.wishlist_id = w.id
LEFT JOIN auth.users u ON w.user_id = u.id
WHERE wi.created_at >= NOW() - INTERVAL '7 days'
  AND (u.email = 'wishbeeai@gmail.com' OR wi.wishlist_id IS NULL)
ORDER BY wi.created_at DESC;

-- 17. CHECK ITEMS WITH SOURCE = 'amazon' OR 'trending' (items from trending gifts)
-- Replace 'wishbeeai@gmail.com' with your actual email
SELECT 
  wi.id,
  wi.wishlist_id,
  w.title as wishlist_title,
  wi.title as item_title,
  wi.source,
  wi.product_url,
  wi.created_at,
  u.email as owner_email
FROM wishlist_items wi
LEFT JOIN wishlists w ON wi.wishlist_id = w.id
LEFT JOIN auth.users u ON w.user_id = u.id
WHERE wi.source IN ('amazon', 'trending', 'Amazon')
  AND (u.email = 'wishbeeai@gmail.com' OR wi.wishlist_id IS NULL)
ORDER BY wi.created_at DESC
LIMIT 50;

-- 18. FIND ALL ITEMS THAT SHOULD BE VISIBLE BUT AREN'T
-- This checks for items in wishlists owned by the user
-- Replace 'wishbeeai@gmail.com' with your actual email
SELECT 
  wi.id,
  wi.wishlist_id,
  w.id as wishlist_exists,
  w.user_id,
  u.email,
  wi.title,
  wi.created_at
FROM wishlist_items wi
JOIN wishlists w ON wi.wishlist_id = w.id
JOIN auth.users u ON w.user_id = u.id
WHERE u.email = 'wishbeeai@gmail.com'
ORDER BY wi.created_at DESC;
