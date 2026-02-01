// Import store at module level to ensure shared state
import { getTrendingGifts } from '../trending-gifts/store'
import { createClient } from '@/lib/supabase/server'

const JSON_500_HEADERS = { "Content-Type": "application/json" } as const

function send500(details: string, code?: string): Response {
  const body = JSON.stringify({
    error: "Failed to create gift collection",
    details: details || "Unknown error",
    ...(code && { code }),
  })
  return new Response(body, { status: 500, headers: JSON_500_HEADERS })
}

export async function POST(req: Request): Promise<Response> {
  try {
    let supabase: Awaited<ReturnType<typeof createClient>>
    try {
      supabase = await createClient()
    } catch (supabaseErr) {
      const msg = supabaseErr instanceof Error ? supabaseErr.message : String(supabaseErr)
      console.error("[v0] Supabase createClient failed:", msg)
      return send500(msg)
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: "You must be signed in to create a gift collection" }, { status: 401 })
    }

    let giftData: Record<string, unknown>
    try {
      giftData = await req.json()
    } catch (parseErr) {
      console.error("[v0] Invalid JSON body:", parseErr)
      return Response.json({ error: "Invalid request body", details: "Expected valid JSON" }, { status: 400 })
    }
    if (!giftData || typeof giftData !== "object") {
      return Response.json({ error: "Invalid request body", details: "Body must be a JSON object" }, { status: 400 })
    }

    console.log("[v0] Creating gift collection:", giftData)

    // Validate required fields
    if (!giftData.collectionTitle || !giftData.giftName || !giftData.targetAmount || !giftData.deadline) {
      return Response.json(
        { error: "Collection title, gift name, target amount, and deadline are required" },
        { status: 400 },
      )
    }

    const targetAmount = Number(giftData.targetAmount)
    if (isNaN(targetAmount) || targetAmount <= 0) {
      return Response.json({ error: "Target amount must be a positive number" }, { status: 400 })
    }

    // Normalize deadline to ISO string for TIMESTAMPTZ (YYYY-MM-DD → full day in UTC)
    let deadlineValue: string = String(giftData.deadline).trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(deadlineValue)) {
      deadlineValue = `${deadlineValue}T23:59:59.000Z`
    } else if (deadlineValue && isNaN(Date.parse(deadlineValue))) {
      return Response.json({ error: "Invalid deadline date format" }, { status: 400 })
    }

    const { data: savedGift, error } = await supabase
      .from('gifts')
      .insert({
        user_id: user.id,
        collection_title: giftData.collectionTitle,
        gift_name: giftData.giftName,
        description: giftData.description || null,
        target_amount: targetAmount,
        current_amount: 0,
        contributors: 0,
        deadline: deadlineValue,
        status: 'active',
        banner_image: giftData.bannerImage || null,
        product_image: giftData.productImage || null,
        product_link: giftData.productLink || null,
        product_name: giftData.giftName,
        category: giftData.category || null,
        brand: giftData.brand || null,
        store_name: giftData.storeName || null,
        price: giftData.price != null ? Number(giftData.price) : null,
        rating: giftData.rating != null ? Number(giftData.rating) : null,
        review_count: giftData.reviewCount != null ? Number(giftData.reviewCount) : null,
        specifications: giftData.specifications || null,
        preference_options: giftData.preferenceOptions || null,
        recipient_name: giftData.recipientName || null,
        occasion: giftData.occasion || null,
        evite_settings: giftData.eviteSettings || null,
      })
      .select()
      .single()

    if (error) {
      const err = error as { message?: string; code?: string; details?: string }
      console.error("[v0] Error inserting gift collection:", err?.code, err?.message, err?.details)
      const message = err?.message || (error as Error)?.message || "Unknown database error"
      return send500(message, err?.code)
    }

    console.log("[v0] Gift collection created successfully:", savedGift.id)

    // Return shape expected by create form (id, gift with camelCase for client).
    // Do not spread giftData - it may contain circular refs or non-JSON-serializable values
    // and cause Response.json() to throw, resulting in 500 with empty body.
    const giftForClient = {
      id: savedGift.id,
      collectionTitle: savedGift.collection_title,
      giftName: savedGift.gift_name,
      description: savedGift.description,
      targetAmount: Number(savedGift.target_amount),
      currentAmount: Number(savedGift.current_amount),
      contributors: savedGift.contributors,
      deadline: savedGift.deadline,
      status: savedGift.status,
      bannerImage: savedGift.banner_image,
      productImage: savedGift.product_image,
      productLink: savedGift.product_link,
      createdDate: savedGift.created_at,
      category: savedGift.category ?? giftData.category ?? null,
      brand: savedGift.brand ?? giftData.brand ?? null,
      storeName: savedGift.store_name ?? giftData.storeName ?? null,
      price: savedGift.price != null ? Number(savedGift.price) : giftData.price ?? null,
      rating: savedGift.rating != null ? Number(savedGift.rating) : giftData.rating ?? null,
      reviewCount: savedGift.review_count ?? giftData.reviewCount ?? null,
      specifications: savedGift.specifications ?? giftData.specifications ?? null,
      preferenceOptions: savedGift.preference_options ?? giftData.preferenceOptions ?? null,
      recipientName: savedGift.recipient_name ?? giftData.recipientName ?? null,
      occasion: savedGift.occasion ?? giftData.occasion ?? null,
      eviteSettings: savedGift.evite_settings ?? giftData.eviteSettings ?? null,
    }

    return Response.json({
      success: true,
      id: savedGift.id,
      gift: giftForClient,
    })
  } catch (error) {
    console.error("[v0] Error creating gift collection:", error)
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined
    if (stack) console.error("[v0] Stack:", stack)
    return send500(message)
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
