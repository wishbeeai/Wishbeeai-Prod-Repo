import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ADMIN_EMAIL = "wishbeeai@gmail.com"

// GET handler - get single product
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  console.log(`[GET API] Route handler called`)
  try {
    const supabase = await createClient()
    const resolvedParams = params instanceof Promise ? await params : params
    const productId = resolvedParams.id
    
    const { data: product, error } = await supabase
      .from('affiliate_products')
      .select('*')
      .eq('id', productId)
      .single()

    if (error || !product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    // Transform to frontend format
    const transformedProduct = {
      id: product.id,
      productName: product.product_name,
      image: product.image || "/placeholder.svg",
      category: product.category,
      source: product.source,
      rating: product.rating || 0,
      reviewCount: product.review_count || 0,
      price: product.price,
      originalPrice: product.original_price,
      productLink: product.product_link || "",
      amazonChoice: product.amazon_choice || false,
      bestSeller: product.best_seller || false,
      overallPick: false,
      attributes: product.attributes || undefined,
      tags: product.tags || undefined,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    }

    return NextResponse.json({ product: transformedProduct })
  } catch (error) {
    console.error("[GET API] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  console.log(`[PUT API] Route handler called`)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    console.log(`[PUT API] User:`, user?.email, `Admin email:`, ADMIN_EMAIL)

    const userEmail = user?.email?.toLowerCase().trim()
    const adminEmail = ADMIN_EMAIL.toLowerCase().trim()
    if (!user || userEmail !== adminEmail) {
      console.log(`[PUT API] Unauthorized - user email: ${user?.email}`)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Handle params - can be a Promise in Next.js 15+
    const resolvedParams = params instanceof Promise ? await params : params
    const productId = resolvedParams.id

    console.log(`[PUT API] Received product ID: ${productId}`)

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      )
    }

    const body = await req.json()
    console.log(`[PUT] Received update request for product ID: ${productId}`)

    // Validate required fields if provided
    if (body.productName !== undefined && (!body.productName || body.productName.trim() === "")) {
      return NextResponse.json(
        { error: "Product name cannot be empty" },
        { status: 400 }
      )
    }

    if (body.price !== undefined && (isNaN(parseFloat(body.price)) || parseFloat(body.price) < 0)) {
      return NextResponse.json(
        { error: "Price must be a valid positive number" },
        { status: 400 }
      )
    }

    // Prepare update data for database
    const updateData: any = {}
    
    if (body.productName !== undefined) updateData.product_name = body.productName.trim()
    if (body.image !== undefined) updateData.image = body.image
    if (body.category !== undefined) updateData.category = body.category
    if (body.source !== undefined) updateData.source = body.source
    if (body.rating !== undefined) {
      const rating = parseFloat(body.rating)
      updateData.rating = (!isNaN(rating) && rating >= 0 && rating <= 5) ? rating : 0
    }
    if (body.reviewCount !== undefined) {
      const reviewCount = parseFloat(body.reviewCount)
      updateData.review_count = (!isNaN(reviewCount) && reviewCount >= 0) ? reviewCount : 0
    }
    if (body.price !== undefined) {
      const price = parseFloat(body.price)
      if (!isNaN(price) && price >= 0) {
        updateData.price = price
      }
    }
    if (body.originalPrice !== undefined) {
      if (body.originalPrice === null || body.originalPrice === "") {
        updateData.original_price = null
      } else {
        const originalPrice = parseFloat(body.originalPrice)
        if (!isNaN(originalPrice) && originalPrice >= 0) {
          updateData.original_price = originalPrice
        }
      }
    }
    if (body.productLink !== undefined) updateData.product_link = body.productLink
    if (body.amazonChoice !== undefined) updateData.amazon_choice = Boolean(body.amazonChoice)
    if (body.bestSeller !== undefined) updateData.best_seller = Boolean(body.bestSeller)
    if (body.overallPick !== undefined) updateData.overall_pick = Boolean(body.overallPick)
    
    // Handle attributes
    if (body.attributes !== undefined) {
      const attributes: any = {}
      const excludedKeys = ['sizeOptions', 'colorVariants', 'combinedVariants', 'styleOptions']
      
      if (body.attributes && typeof body.attributes === 'object') {
        Object.entries(body.attributes).forEach(([key, value]) => {
          if (!excludedKeys.includes(key) && value !== null && value !== undefined && value !== '') {
            attributes[key] = typeof value === 'string' ? value.trim() : value
          }
        })
      }
      
      // Add variant options from body directly (style, color, size, set, configuration)
      if (body.style) attributes.style = body.style
      if (body.color) attributes.color = body.color
      if (body.size) attributes.size = body.size
      if (body.set) attributes.set = body.set
      if (body.configuration) attributes.configuration = body.configuration
      
      updateData.attributes = Object.keys(attributes).length > 0 ? attributes : null
    }
    
    // Handle tags
    if (body.tags !== undefined) {
      if (body.tags === null || (Array.isArray(body.tags) && body.tags.length === 0)) {
        updateData.tags = null
      } else if (Array.isArray(body.tags)) {
        updateData.tags = body.tags.filter((tag: string) => tag && tag.trim()).map((tag: string) => tag.trim())
      }
    }

    console.log(`[PUT] Prepared update data:`, JSON.stringify(updateData, null, 2))

    // Update in Supabase
    const { data: updatedProduct, error } = await supabase
      .from('affiliate_products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single()

    if (error) {
      console.error(`[PUT API] Database error:`, error)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }
      return NextResponse.json({ error: "Failed to update product", details: error.message }, { status: 500 })
    }

    // Transform to frontend format
    const responseProduct = {
      id: updatedProduct.id,
      productName: updatedProduct.product_name,
      image: updatedProduct.image,
      category: updatedProduct.category,
      source: updatedProduct.source,
      rating: updatedProduct.rating,
      reviewCount: updatedProduct.review_count,
      price: updatedProduct.price,
      originalPrice: updatedProduct.original_price,
      productLink: updatedProduct.product_link,
      amazonChoice: updatedProduct.amazon_choice,
      bestSeller: updatedProduct.best_seller,
      overallPick: false,
      attributes: updatedProduct.attributes,
      tags: updatedProduct.tags,
      createdAt: updatedProduct.created_at,
      updatedAt: updatedProduct.updated_at,
    }

    console.log(`[PUT] Product updated successfully: ${productId}`)
    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      product: responseProduct,
    })
  } catch (error) {
    console.error("[PUT API] Error updating affiliate product:", error)
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    console.log(`[DELETE API] User:`, user?.email, `Admin email:`, ADMIN_EMAIL)

    const userEmail = user?.email?.toLowerCase().trim()
    const adminEmail = ADMIN_EMAIL.toLowerCase().trim()
    if (!user || userEmail !== adminEmail) {
      console.log(`[DELETE API] Unauthorized - user email: ${user?.email}`)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Handle params - can be a Promise in Next.js 15+
    const resolvedParams = params instanceof Promise ? await params : params
    const productId = resolvedParams.id

    console.log(`[DELETE API] Received product ID: ${productId}`)

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      )
    }

    // Check if product exists first
    const { data: existingProduct, error: fetchError } = await supabase
      .from('affiliate_products')
      .select('id')
      .eq('id', productId)
      .single()

    if (fetchError || !existingProduct) {
      console.log(`[DELETE API] Product not found: ${productId}`)
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    // Delete from Supabase
    const { error } = await supabase
      .from('affiliate_products')
      .delete()
      .eq('id', productId)

    if (error) {
      console.error(`[DELETE API] Database error:`, error)
      return NextResponse.json(
        { error: "Failed to delete product", details: error.message },
        { status: 500 }
      )
    }

    console.log(`[DELETE API] Product deleted successfully: ${productId}`)
    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
      deletedId: productId,
    })
  } catch (error) {
    console.error("[DELETE API] Error deleting affiliate product:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
