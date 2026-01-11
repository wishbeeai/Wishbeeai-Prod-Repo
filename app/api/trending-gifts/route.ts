import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTrendingGifts, addTrendingGift, removeTrendingGift } from './store'

// Ensure store is initialized at module level
console.log(`[trending-gifts-route] Module loaded, initial store count: ${getTrendingGifts().length}`)

// GET - Fetch all trending gifts
export async function GET(req: NextRequest) {
  try {
    const trendingGifts = getTrendingGifts()
    
    return NextResponse.json({
      success: true,
      gifts: trendingGifts,
      total: trendingGifts.length,
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

    // Create trending gift from affiliate product - include ALL fields including attributes
    const trendingGift = {
      id: Date.now().toString(),
      productName: body.productName,
      image: body.image,
      category: body.category || 'General',
      source: body.source || body.storeName || 'Unknown',
      price: parseFloat(body.price) || 0,
      originalPrice: body.originalPrice ? parseFloat(body.originalPrice) : undefined,
      rating: body.rating ? parseFloat(body.rating) : 0,
      reviewCount: body.reviewCount ? parseFloat(body.reviewCount) : 0,
      productLink: body.productLink,
      description: body.description || `${body.productName} from ${body.source || body.storeName || 'Unknown'}`,
      amazonChoice: body.amazonChoice || false,
      bestSeller: body.bestSeller || false,
      overallPick: body.overallPick || false,
      attributes: body.attributes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Add to store
    const savedGift = addTrendingGift(trendingGift)

    console.log(`[trending-gifts] Product added to trending gifts: ${savedGift.id}`)
    console.log(`[trending-gifts] Total trending gifts in store: ${getTrendingGifts().length}`)
    console.log(`[trending-gifts] Saved gift data:`, JSON.stringify(savedGift, null, 2))

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

    const removed = removeTrendingGift(giftId)
    
    if (removed) {
      console.log(`[trending-gifts] Product removed from trending gifts: ${giftId}`)
      console.log(`[trending-gifts] Total trending gifts remaining: ${getTrendingGifts().length}`)
      
      return NextResponse.json({
        success: true,
        message: 'Product removed from trending gifts successfully',
      })
    } else {
      return NextResponse.json(
        { error: 'Gift not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('[trending-gifts] Error removing from trending gifts:', error)
    return NextResponse.json(
      { error: 'Failed to remove product from trending gifts' },
      { status: 500 }
    )
  }
}

