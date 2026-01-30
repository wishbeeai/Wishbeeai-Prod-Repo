import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ADMIN_EMAIL = "wishbeeai@gmail.com"

export async function GET(req: NextRequest) {
  console.log("[API] GET /api/admin/affiliate-products - Request received")
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    console.log("[API] User check:", { hasUser: !!user, userEmail: user?.email })

    const userEmail = user?.email?.toLowerCase().trim()
    const adminEmail = ADMIN_EMAIL.toLowerCase().trim()
    if (!user || userEmail !== adminEmail) {
      console.log("[API] Unauthorized access attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[API] Admin access confirmed, fetching products from database...")
    
    // Fetch from Supabase database
    const { data: products, error } = await supabase
      .from('affiliate_products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error("[API] Database error:", error)
      return NextResponse.json({ error: "Database error", details: error.message }, { status: 500 })
    }

    // Transform database format to frontend format
    const transformedProducts = (products || []).map((p: any) => ({
      id: p.id,
      productName: p.product_name,
      image: p.image || "/placeholder.svg",
      category: p.category,
      source: p.source,
      rating: p.rating || 0,
      reviewCount: p.review_count || 0,
      price: p.price,
      originalPrice: p.original_price,
      productLink: p.product_link || "",
      amazonChoice: p.amazon_choice || false,
      bestSeller: p.best_seller || false,
      overallPick: false,
      attributes: p.attributes || undefined,
      tags: p.tags || undefined,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }))

    console.log("[API] Products found:", transformedProducts.length)
    return NextResponse.json({
      products: transformedProducts,
      total: transformedProducts.length,
    })
  } catch (error) {
    console.error("[API] Error fetching affiliate products:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const userEmail = user?.email?.toLowerCase().trim()
    const adminEmail = ADMIN_EMAIL.toLowerCase().trim()
    if (!user || userEmail !== adminEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    // Validate required fields
    if (!body.productName || !body.category || !body.source || body.price === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: productName, category, source, price" },
        { status: 400 }
      )
    }

    // Build attributes object - include ALL attributes including variant options
    const attributes: any = {}
    if (body.attributes && typeof body.attributes === 'object') {
      // Excluded keys (only multi-value arrays, not single variant selections)
      const excludedKeys = ['sizeOptions', 'colorVariants', 'combinedVariants', 'styleOptions']
      
      // Include ALL attributes except excluded ones
      Object.entries(body.attributes).forEach(([key, value]) => {
        if (!excludedKeys.includes(key) && value !== null && value !== undefined && value !== '') {
          attributes[key] = value
        }
      })
      
      console.log('[API POST] Saving attributes:', JSON.stringify(attributes, null, 2))
    }
    
    // Add variant options from body directly (style, color, size, set, configuration, capacity)
    if (body.style) attributes.style = body.style
    if (body.color) attributes.color = body.color
    if (body.size) attributes.size = body.size
    if (body.set) attributes.set = body.set
    if (body.configuration) attributes.configuration = body.configuration
    if (body.capacity) attributes.capacity = body.capacity

    // Use the full product name (no truncation)
    const fullProductName = body.productName ? body.productName.trim() : body.productName

    // Insert into Supabase database
    const { data: savedProduct, error } = await supabase
      .from('affiliate_products')
      .insert({
        product_name: fullProductName,
        image: body.image || "/placeholder.svg",
        category: body.category,
        source: body.source,
        rating: body.rating || 0,
        review_count: body.reviewCount || 0,
        price: parseFloat(body.price),
        original_price: body.originalPrice ? parseFloat(body.originalPrice) : null,
        product_link: body.productLink || "",
        amazon_choice: body.amazonChoice || false,
        best_seller: body.bestSeller || false,
        attributes: Object.keys(attributes).length > 0 ? attributes : null,
        tags: body.tags && Array.isArray(body.tags) && body.tags.length > 0 ? body.tags : null,
      })
      .select()
      .single()

    if (error) {
      console.error("[API] Database insert error:", error)
      return NextResponse.json({ error: "Failed to save product", details: error.message }, { status: 500 })
    }

    // Transform to frontend format
    const responseProduct = {
      id: savedProduct.id,
      productName: savedProduct.product_name,
      image: savedProduct.image,
      category: savedProduct.category,
      source: savedProduct.source,
      rating: savedProduct.rating,
      reviewCount: savedProduct.review_count,
      price: savedProduct.price,
      originalPrice: savedProduct.original_price,
      productLink: savedProduct.product_link,
      amazonChoice: savedProduct.amazon_choice,
      bestSeller: savedProduct.best_seller,
      overallPick: false,
      attributes: savedProduct.attributes,
      tags: savedProduct.tags,
      createdAt: savedProduct.created_at,
      updatedAt: savedProduct.updated_at,
    }

    console.log("[API] Product saved successfully:", savedProduct.id)

    return NextResponse.json({
      success: true,
      message: "Product added successfully",
      product: responseProduct,
    })
  } catch (error) {
    console.error("Error creating affiliate product:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
