import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTrendingGifts, addTrendingGift, removeTrendingGift } from './store'

// Ensure store is initialized at module level
console.log(`[trending-gifts-route] Module loaded, initial store count: ${getTrendingGifts().length}`)

// GET - Fetch all trending gifts from database
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Fetch from database
    const { data: trendingGifts, error } = await supabase
      .from('trending_gifts')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('[trending-gifts] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch trending gifts from database' },
        { status: 500 }
      )
    }
    
    // Convert database format to TrendingGift interface format
    const gifts = (trendingGifts || []).map((gift) => ({
      id: gift.id,
      productName: gift.product_name,
      image: gift.image,
      category: gift.category,
      source: gift.source,
      price: parseFloat(gift.price.toString()),
      originalPrice: gift.original_price ? parseFloat(gift.original_price.toString()) : undefined,
      rating: parseFloat(gift.rating.toString()),
      reviewCount: gift.review_count,
      productLink: gift.product_link,
      description: gift.description,
      amazonChoice: gift.amazon_choice,
      bestSeller: gift.best_seller,
      overallPick: gift.overall_pick,
      attributes: gift.attributes,
      createdAt: gift.created_at,
      updatedAt: gift.updated_at,
    }))
    
    // Sync with in-memory store for backward compatibility
    const store = getTrendingGifts()
    if (store.length === 0 && gifts.length > 0) {
      gifts.forEach(gift => addTrendingGift(gift))
    }
    
    return NextResponse.json({
      success: true,
      gifts: gifts,
      total: gifts.length,
    })
  } catch (error) {
    console.error('[trending-gifts] Error fetching trending gifts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trending gifts' },
      { status: 500 }
    )
  }
}

// POST - Add a product to trending gifts
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to add products to trending gifts.' },
        { status: 401 }
      )
    }

    const body = await req.json()
    
    // Validate required fields
    if (!body.productName || !body.price || !body.image || !body.productLink) {
      return NextResponse.json(
        { error: 'Product name, price, image, and product link are required' },
        { status: 400 }
      )
    }

    // Check if product already exists in database (by product_link)
    const { data: existing } = await supabase
      .from('trending_gifts')
      .select('id, product_name')
      .eq('product_link', body.productLink)
      .single()
    
    // If product already exists, return a friendly error message
    if (existing) {
      console.log(`[trending-gifts] Product already exists: ${existing.product_name} (${existing.id})`)
      return NextResponse.json(
        { 
          error: 'This product is already in Trending Gifts',
          message: `"${existing.product_name || 'This product'}" is already added to Trending Gifts.`,
          existing: true,
          existingId: existing.id
        },
        { status: 409 } // 409 Conflict - resource already exists
      )
    }
    
    let savedGift
    
    {
      // Insert new gift
      const { data: inserted, error: insertError } = await supabase
        .from('trending_gifts')
        .insert({
          product_name: body.productName,
          image: body.image,
          category: body.category || 'General',
          source: body.source || body.storeName || 'Unknown',
          price: parseFloat(body.price) || 0,
          original_price: body.originalPrice ? parseFloat(body.originalPrice) : null,
          rating: body.rating ? parseFloat(body.rating) : 0,
          review_count: body.reviewCount ? parseInt(body.reviewCount.toString()) : 0,
          product_link: body.productLink,
          description: body.description || `${body.productName} from ${body.source || body.storeName || 'Unknown'}`,
          amazon_choice: body.amazonChoice || false,
          best_seller: body.bestSeller || false,
          overall_pick: body.overallPick || false,
          attributes: body.attributes || null,
        })
        .select()
        .single()
      
      if (insertError) {
        console.error('[trending-gifts] Insert error:', insertError)
        return NextResponse.json(
          { error: 'Failed to add trending gift', details: insertError.message },
          { status: 500 }
        )
      }
      
      savedGift = {
        id: inserted.id,
        productName: inserted.product_name,
        image: inserted.image,
        category: inserted.category,
        source: inserted.source,
        price: parseFloat(inserted.price.toString()),
        originalPrice: inserted.original_price ? parseFloat(inserted.original_price.toString()) : undefined,
        rating: parseFloat(inserted.rating.toString()),
        reviewCount: inserted.review_count,
        productLink: inserted.product_link,
        description: inserted.description,
        amazonChoice: inserted.amazon_choice,
        bestSeller: inserted.best_seller,
        overallPick: inserted.overall_pick,
        attributes: inserted.attributes,
        createdAt: inserted.created_at,
        updatedAt: inserted.updated_at,
      }
      
      console.log(`[trending-gifts] Product added to trending gifts: ${savedGift.id}`)
    }
    
    // Sync with in-memory store for backward compatibility
    addTrendingGift(savedGift)
    
    // Get total count
    const { count } = await supabase
      .from('trending_gifts')
      .select('*', { count: 'exact', head: true })
    
    console.log(`[trending-gifts] Total trending gifts in database: ${count || 0}`)

    return NextResponse.json({
      success: true,
      message: 'Product added to trending gifts successfully',
      gift: savedGift,
    }, { status: 201 })
  } catch (error) {
    console.error('[trending-gifts] Error adding to trending gifts:', error)
    return NextResponse.json(
      { error: 'Failed to add product to trending gifts' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a product from trending gifts
export async function DELETE(req: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to remove products.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const giftId = searchParams.get('id')
    
    if (!giftId) {
      return NextResponse.json(
        { error: 'Gift ID is required' },
        { status: 400 }
      )
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('trending_gifts')
      .delete()
      .eq('id', giftId)
    
    if (deleteError) {
      console.error('[trending-gifts] Delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove trending gift', details: deleteError.message },
        { status: 500 }
      )
    }
    
    // Also remove from in-memory store for backward compatibility
    removeTrendingGift(giftId)
    
    // Get remaining count
    const { count } = await supabase
      .from('trending_gifts')
      .select('*', { count: 'exact', head: true })
    
    console.log(`[trending-gifts] Product removed from trending gifts: ${giftId}`)
    console.log(`[trending-gifts] Total trending gifts remaining: ${count || 0}`)
    
    return NextResponse.json({
      success: true,
      message: 'Product removed from trending gifts successfully',
    })
  } catch (error) {
    console.error('[trending-gifts] Error removing from trending gifts:', error)
    return NextResponse.json(
      { error: 'Failed to remove product from trending gifts' },
      { status: 500 }
    )
  }
}

