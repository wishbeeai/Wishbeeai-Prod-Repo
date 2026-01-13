// Import store at module level to ensure shared state
import { getTrendingGifts } from '../../trending-gifts/store'

export async function GET(req: Request) {
  try {
    const trendingGifts = getTrendingGifts()

    console.log(`[gifts-browse-api] Fetching browse gifts, found ${trendingGifts.length} trending gifts`)
    if (trendingGifts.length > 0) {
      console.log(`[gifts-browse-api] Sample gift:`, JSON.stringify(trendingGifts[0], null, 2))
    }

    // Convert trending gifts to gift format for display - include ALL fields
    const gifts = trendingGifts.map((gift) => ({
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
    }))

    console.log(`[gifts-browse-api] Returning ${gifts.length} gifts`)

    return Response.json({
      success: true,
      gifts: gifts,
      total: gifts.length,
    })
  } catch (error) {
    console.error("[v0] Error fetching browse gifts:", error)
    return Response.json({ error: "Failed to fetch gifts" }, { status: 500 })
  }
}
