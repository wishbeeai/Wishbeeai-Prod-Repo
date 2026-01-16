/**
 * GET /api/share/[token]
 * 
 * Retrieves shared wishlist data by token.
 * This endpoint is PUBLIC - no authentication required.
 * 
 * Output:
 * - wishlist: Wishlist data (public fields only)
 * - items: Array of wishlist items (public fields only)
 * - product: Single product if productId was specified in share
 * - accessLevel: 'view' | 'contribute'
 * - sharedBy: Owner's display name
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const supabase = await createClient()

    // 1. Find the share link by token
    const { data: shareLink, error: shareLinkError } = await supabase
      .from('share_links')
      .select('*')
      .eq('token', token)
      .single()

    if (shareLinkError || !shareLink) {
      return NextResponse.json(
        { error: 'Share link not found or has expired' },
        { status: 404 }
      )
    }

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
      return NextResponse.json(
        { error: 'Wishlist not found' },
        { status: 404 }
      )
    }

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
          product_name,
          product_url,
          product_price,
          product_image,
          quantity,
          priority,
          description,
          category,
          stock_status,
          created_at
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
          product_name,
          product_url,
          product_price,
          product_image,
          quantity,
          priority,
          description,
          category,
          stock_status,
          created_at
        `)
        .eq('wishlist_id', shareLink.wishlist_id)
        .order('created_at', { ascending: false })

      if (!itemsError && wishlistItems) {
        items = wishlistItems.map(formatProductForPublic)
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
 * Removes any sensitive or internal fields
 */
function formatProductForPublic(product: any) {
  return {
    id: product.id,
    name: product.product_name,
    url: product.product_url,
    price: product.product_price,
    image: product.product_image,
    quantity: product.quantity || 1,
    priority: product.priority,
    description: product.description,
    category: product.category,
    stockStatus: product.stock_status,
    addedAt: product.created_at,
  }
}
