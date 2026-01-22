/**
 * GET /api/share/[token]
 * 
 * Retrieves shared wishlist data by token.
 * This endpoint is PUBLIC - no authentication required.
 * 
 * Uses admin client to bypass RLS since this is a public share endpoint
 * that needs to access wishlist data regardless of the current user.
 * 
 * Output:
 * - wishlist: Wishlist data (public fields only)
 * - items: Array of wishlist items (public fields only)
 * - product: Single product if productId was specified in share
 * - accessLevel: 'view' | 'contribute'
 * - sharedBy: Owner's display name
 */

import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ token: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { token } = await params
    
    if (!token) {
      return NextResponse.json(
        { error: 'Share token is required' },
        { status: 400 }
      )
    }

    // Use public client (admin if available, otherwise anon with RLS)
    const supabase = await createPublicClient()

    // 1. Find the share link by token
    const { data: shareLink, error: shareLinkError } = await supabase
      .from('share_links')
      .select('*')
      .eq('token', token)
      .single()

    if (shareLinkError || !shareLink) {
      console.error('[Share API] Share link not found for token:', token, shareLinkError)
      return NextResponse.json(
        { error: 'Share link not found or has expired' },
        { status: 404 }
      )
    }

    console.log('[Share API] Found share link:', {
      token,
      wishlist_id: shareLink.wishlist_id,
      product_id: shareLink.product_id,
      created_by: shareLink.created_by_user_id
    })

    // 2. Check if the link has expired
    if (shareLink.expires_at) {
      const expirationDate = new Date(shareLink.expires_at)
      if (expirationDate < new Date()) {
        return NextResponse.json(
          { error: 'This share link has expired' },
          { status: 410 } // Gone
        )
      }
    }

    // 3. Increment view count (non-blocking)
    supabase.rpc('increment_share_link_views', { link_token: token }).then(() => {})

    // 4. Get the wishlist (public fields only)
    const { data: wishlist, error: wishlistError } = await supabase
      .from('wishlists')
      .select('id, title, description, created_at')
      .eq('id', shareLink.wishlist_id)
      .single()

    if (wishlistError || !wishlist) {
      console.error('[Share API] Wishlist not found for id:', shareLink.wishlist_id, wishlistError)
      return NextResponse.json(
        { error: 'Wishlist not found' },
        { status: 404 }
      )
    }

    console.log('[Share API] Found wishlist:', { id: wishlist.id, title: wishlist.title })

    // 5. Get owner's profile for display name
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', shareLink.created_by_user_id)
      .single()

    // Use first name or email prefix as display name
    let sharedBy = 'Someone'
    if (profile) {
      if (profile.name) {
        // Use first name only for privacy
        sharedBy = profile.name.split(' ')[0]
      } else if (profile.email) {
        // Use email prefix before @
        sharedBy = profile.email.split('@')[0]
      }
    }

    // 6. Get wishlist items (or single product if specified)
    let items: any[] = []
    let singleProduct: any = null

    if (shareLink.product_id) {
      // Sharing a specific product
      const { data: product, error: productError } = await supabase
        .from('wishlist_items')
        .select(`
          id,
          title,
          product_name,
          product_url,
          list_price,
          product_price,
          image_url,
          product_image,
          quantity,
          priority,
          description,
          category,
          stock_status,
          created_at,
          review_star,
          review_count,
          source,
          store_name
        `)
        .eq('id', shareLink.product_id)
        .single()

      if (!productError && product) {
        singleProduct = formatProductForPublic(product)
      }
    } else {
      // Sharing entire wishlist
      const { data: wishlistItems, error: itemsError } = await supabase
        .from('wishlist_items')
        .select(`
          id,
          title,
          product_name,
          product_url,
          list_price,
          product_price,
          image_url,
          product_image,
          quantity,
          priority,
          description,
          category,
          stock_status,
          created_at,
          review_star,
          review_count,
          source,
          store_name
        `)
        .eq('wishlist_id', shareLink.wishlist_id)
        .order('created_at', { ascending: false })

      if (itemsError) {
        console.error('[Share API] Error fetching wishlist items:', itemsError)
      } else {
        console.log(`[Share API] Found ${wishlistItems?.length || 0} items for wishlist_id: ${shareLink.wishlist_id}`)
        if (wishlistItems && wishlistItems.length > 0) {
          console.log('[Share API] First item sample:', JSON.stringify(wishlistItems[0], null, 2))
        }
        items = (wishlistItems || []).map(formatProductForPublic)
      }
    }

    // 7. Return public data
    return NextResponse.json({
      wishlist: {
        id: wishlist.id,
        title: wishlist.title,
        description: wishlist.description,
        createdAt: wishlist.created_at,
      },
      items,
      product: singleProduct,
      accessLevel: shareLink.access_level,
      sharedBy,
      // Disclaimer to show on frontend
      disclaimer: 'Prices, ratings, and availability may change on the retailer\'s site.',
    })

  } catch (error: any) {
    console.error('Error in share get API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Format a product for public display
 * Handles both old (product_name, product_price, product_image) and 
 * new (title, list_price, image_url) column formats
 */
function formatProductForPublic(product: any) {
  // Handle name: prefer title, fallback to product_name
  const name = product.title || product.product_name || 'Unnamed Product'
  
  // Handle price: prefer list_price, fallback to product_price
  const price = product.list_price ?? product.product_price ?? null
  
  // Handle image: prefer image_url, fallback to product_image
  const image = product.image_url || product.product_image || null
  
  // Handle rating: convert review_star to number if needed
  let rating = null
  if (product.review_star) {
    if (typeof product.review_star === 'object' && product.review_star.value) {
      rating = parseFloat(product.review_star.value)
    } else if (typeof product.review_star === 'number') {
      rating = product.review_star
    } else if (typeof product.review_star === 'string') {
      rating = parseFloat(product.review_star)
    }
  }
  
  return {
    id: product.id,
    name,
    url: product.product_url,
    price,
    image,
    quantity: product.quantity || 1,
    priority: product.priority,
    description: product.description,
    category: product.category,
    stockStatus: product.stock_status,
    addedAt: product.created_at,
    rating,
    reviewCount: product.review_count,
    storeName: product.store_name || product.source,
  }
}
