/**
 * POST /api/share/create
 * 
 * Creates a shareable link for a wishlist or specific product.
 * Requires authentication.
 * 
 * Input:
 * - wishlistId: string (required) - The wishlist to share
 * - productId?: string (optional) - Specific product to share
 * - accessLevel: 'view' | 'contribute' (default: 'view')
 * - expiresInDays?: number (optional) - Days until link expires
 * 
 * Output:
 * - shareUrl: string - The full share URL
 * - token: string - The share token
 * - expiresAt: string | null - Expiration date if set
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateShareToken, getShareUrl } from '@/lib/share-utils'
import { z } from 'zod'
import type { ShareAccessLevel } from '@/types/supabase'

// Input validation schema
const createShareSchema = z.object({
  wishlistId: z.string().uuid('Invalid wishlist ID'),
  productId: z.string().uuid('Invalid product ID').optional().nullable(),
  accessLevel: z.enum(['view', 'contribute']).default('view'),
  expiresInDays: z.number().min(1).max(365).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 1. Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to share your wishlist.' },
        { status: 401 }
      )
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const validationResult = createShareSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      )
    }
    
    const { wishlistId, productId, accessLevel, expiresInDays } = validationResult.data

    // 3. Verify the user owns this wishlist
    const { data: wishlist, error: wishlistError } = await supabase
      .from('wishlists')
      .select('id, user_id, title')
      .eq('id', wishlistId)
      .single()

    if (wishlistError || !wishlist) {
      return NextResponse.json(
        { error: 'Wishlist not found' },
        { status: 404 }
      )
    }

    if (wishlist.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only share your own wishlists' },
        { status: 403 }
      )
    }

    // 4. If productId is provided, verify it belongs to this wishlist
    if (productId) {
      const { data: product, error: productError } = await supabase
        .from('wishlist_items')
        .select('id, wishlist_id')
        .eq('id', productId)
        .single()

      if (productError || !product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      if (product.wishlist_id !== wishlistId) {
        return NextResponse.json(
          { error: 'Product does not belong to this wishlist' },
          { status: 400 }
        )
      }
    }

    // 5. Check for existing share link with same parameters
    // This prevents creating duplicate links
    const existingQuery = supabase
      .from('share_links')
      .select('*')
      .eq('wishlist_id', wishlistId)
      .eq('created_by_user_id', user.id)
      .eq('access_level', accessLevel)
    
    // Handle productId - check for null or specific value
    if (productId) {
      existingQuery.eq('product_id', productId)
    } else {
      existingQuery.is('product_id', null)
    }

    const { data: existingLinks } = await existingQuery

    // If an unexpired link exists, return it instead of creating a new one
    if (existingLinks && existingLinks.length > 0) {
      const validLink = existingLinks.find(link => {
        if (!link.expires_at) return true
        return new Date(link.expires_at) > new Date()
      })

      if (validLink) {
        return NextResponse.json({
          shareUrl: getShareUrl(validLink.token),
          token: validLink.token,
          expiresAt: validLink.expires_at,
          isExisting: true,
        })
      }
    }

    // 6. Generate a new unique token
    const token = generateShareToken()

    // 7. Calculate expiration date if specified
    let expiresAt: string | null = null
    if (expiresInDays) {
      const expDate = new Date()
      expDate.setDate(expDate.getDate() + expiresInDays)
      expiresAt = expDate.toISOString()
    }

    // 8. Create the share link
    const { data: shareLink, error: createError } = await supabase
      .from('share_links')
      .insert({
        token,
        wishlist_id: wishlistId,
        product_id: productId || null,
        created_by_user_id: user.id,
        access_level: accessLevel as ShareAccessLevel,
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating share link:', createError)
      return NextResponse.json(
        { error: 'Failed to create share link' },
        { status: 500 }
      )
    }

    // 9. Return the share URL
    return NextResponse.json({
      shareUrl: getShareUrl(token),
      token,
      expiresAt,
      isExisting: false,
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error in share create API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
