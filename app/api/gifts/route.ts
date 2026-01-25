// Import store at module level to ensure shared state
import { getTrendingGifts } from '../trending-gifts/store'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const giftData = await req.json()

    console.log("[v0] Creating gift collection:", giftData)

    // Validate required fields
    if (!giftData.collectionTitle || !giftData.giftName || !giftData.targetAmount || !giftData.deadline) {
      return Response.json(
        { error: "Collection title, gift name, target amount, and deadline are required" },
        { status: 400 },
      )
    }

    // In production, this would be stored in a database
    // For now, we'll simulate a successful save
    const savedGift = {
      id: Date.now().toString(),
      ...giftData,
      createdDate: new Date().toISOString(),
      currentAmount: 0,
      contributors: 0,
      status: "active",
    }

    console.log("[v0] Gift collection created successfully:", savedGift.id)

    return Response.json({
      success: true,
      id: savedGift.id,
      gift: savedGift,
    })
  } catch (error) {
    console.error("[v0] Error creating gift collection:", error)
    return Response.json({ error: "Failed to create gift collection" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    // Fetch from database (primary source)
    const supabase = await createClient()
    const { data: dbGifts, error } = await supabase
      .from('trending_gifts')
      .select('*')
      .order('created_at', { ascending: false })
    
    let trendingGifts: any[] = []
    
    if (error) {
      console.error('[gifts-api] Database error, falling back to in-memory store:', error)
      // Fallback to in-memory store if database fails
      trendingGifts = getTrendingGifts()
    } else {
      // Convert database format to TrendingGift format
      trendingGifts = (dbGifts || []).map((gift) => ({
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
    }

    console.log(`[gifts-api] Fetching gifts, found ${trendingGifts.length} trending gifts`)
    if (trendingGifts.length > 0) {
      console.log(`[gifts-api] Sample gift:`, JSON.stringify(trendingGifts[0], null, 2))
      console.log(`[gifts-api] Sample gift attributes:`, trendingGifts[0].attributes)
    }

    // Convert trending gifts to gift format for display - include ALL fields including attributes
    const gifts = trendingGifts.map((gift) => {
      const attrs = gift.attributes || {}
      return {
        id: gift.id,
        collectionTitle: `Trending: ${gift.productName}`,
        giftName: gift.productName,
        description: gift.description || `${gift.productName} from ${gift.source}`,
        targetAmount: gift.price,
        currentAmount: 0, // Can be updated when contributions are made
        contributors: 0,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        bannerImage: gift.image,
        image: gift.image,
        createdDate: gift.createdAt,
        status: 'active',
        category: gift.category,
        rating: gift.rating,
        reviewCount: gift.reviewCount,
        productLink: gift.productLink,
        source: gift.source,
        originalPrice: gift.originalPrice,
        amazonChoice: gift.amazonChoice,
        bestSeller: gift.bestSeller,
        overallPick: gift.overallPick,
        attributes: attrs,
        // Top-level variant options for Add to Wishlist modal (capacity, color, etc.)
        ...(attrs.capacity && { capacity: attrs.capacity }),
        ...(attrs.color && { color: attrs.color }),
        ...(attrs.size && { size: attrs.size }),
        ...(attrs.style && { style: attrs.style }),
        ...(attrs.configuration && { configuration: attrs.configuration }),
        ...(attrs.set && { set: attrs.set }),
      }
    })

    console.log(`[gifts-api] Returning ${gifts.length} gifts`)

    return Response.json({
      success: true,
      gifts: gifts,
    })
  } catch (error) {
    console.error("[v0] Error fetching gifts:", error)
    return Response.json({ error: "Failed to fetch gifts" }, { status: 500 })
  }
}
