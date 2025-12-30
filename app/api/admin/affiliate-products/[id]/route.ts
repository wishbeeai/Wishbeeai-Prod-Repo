import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { updateProduct, deleteProduct } from "../store"

const ADMIN_EMAIL = "wishbeeai@gmail.com"

// Helper function to create a short and understandable title
function createShortTitle(fullTitle: string, maxWords: number = 10): string {
  if (!fullTitle) return ""
  
  // Decode HTML entities
  let cleanTitle = fullTitle
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#34;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x2F;/g, '/')
    .replace(/&#x60;/g, '`')
    .replace(/&nbsp;/g, ' ')
    .trim()
  
  // Remove common unnecessary phrases and patterns
  const removePatterns = [
    /\(newest\s+model\)/gi,
    /\(latest\s+version\)/gi,
    /\(updated\)/gi,
    /–\s*20%\s+faster/gi,
    /–\s*\d+%\s+faster/gi,
    /with\s+new\s+\d+["']\s+/gi,
    /weeks?\s+of\s+battery\s+life/gi,
    /battery\s+life[^–]*/gi,
    /glare-free\s+display/gi,
    /new\s+\d+["']/gi,
    /\s*–\s*[^–]+$/g, // Remove trailing dash sections
    /\s*\|\s*[^|]+$/g, // Remove trailing pipe sections
  ]
  
  for (const pattern of removePatterns) {
    cleanTitle = cleanTitle.replace(pattern, ' ').trim()
  }
  
  // Split into words
  let words = cleanTitle.split(/\s+/).filter(w => w.length > 0)
  
  // Remove common filler words if title is too long
  const fillerWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'including', 'against',
    'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his',
    'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'way', 'use', 'her'
  ])
  
  // Extract brand (usually first 1-2 words if capitalized)
  let brandWords: string[] = []
  let productWords: string[] = []
  let inBrand = true
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    // Check if word starts with capital (likely brand) or is a known brand pattern
    if (inBrand && (i < 2 || /^[A-Z]/.test(word) || /^(Ninja|Amazon|Apple|Samsung|Sony|LG|Dell|HP|Lenovo|Canon|Nikon)/i.test(word))) {
      brandWords.push(word)
      if (i >= 1) inBrand = false // Usually brand is 1-2 words
    } else {
      productWords.push(word)
      inBrand = false
    }
  }
  
  // If no brand detected, use first word as potential brand
  if (brandWords.length === 0 && words.length > 0) {
    brandWords.push(words[0])
    productWords = words.slice(1)
  }
  
  // Keep important words: brand, key product name, important specs (numbers, sizes, models)
  const importantWords: string[] = [...brandWords]
  
  for (let i = 0; i < productWords.length && importantWords.length < maxWords; i++) {
    const word = productWords[i]
    const lowerWord = word.toLowerCase()
    
    // Always include if it's a number, size, model, or important feature
    if (
      /\d/.test(word) || // Contains numbers
      /^[A-Z]/.test(word) || // Starts with capital (likely important)
      /^(Pro|XL|L|M|S|Plus|Max|Mini|Ultra|Premium|Deluxe|Standard)/i.test(word) || // Key descriptors
      !fillerWords.has(lowerWord) // Not a filler word
    ) {
      importantWords.push(word)
    }
  }
  
  // Limit to maxWords
  let finalWords = importantWords.slice(0, maxWords)
  
  // Join and clean up
  let result = finalWords.join(' ')
    .replace(/[\s\-–—,;:]+$/g, '') // Remove trailing punctuation and whitespace
    .replace(/^[\s\-–—,;:]+/g, '') // Remove leading punctuation and whitespace
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim()
  
  // If result is empty or too short, use original truncated version
  if (result.length < 10) {
    result = words.slice(0, maxWords).join(' ')
      .replace(/[\s\-–—,;:]+$/g, '')
      .replace(/^[\s\-–—,;:]+/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }
  
  return result
}

// GET handler for testing - verify route is accessible
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  console.log(`[GET API] Route handler called`)
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const productId = resolvedParams.id
    
    const { getProducts } = await import("../store")
    const allProducts = getProducts()
    // Convert both IDs to strings for comparison to handle type mismatches
    const product = allProducts.find(p => String(p.id) === String(productId))
    
    if (product) {
      return NextResponse.json({ product })
    } else {
      return NextResponse.json(
        { error: `Product not found. Available IDs: ${allProducts.map(p => p.id).join(", ")}` },
        { status: 404 }
      )
    }
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

    if (!user || user.email !== ADMIN_EMAIL) {
      console.log(`[PUT API] Unauthorized - user email: ${user?.email}`)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Handle params - can be a Promise in Next.js 15+
    const resolvedParams = params instanceof Promise ? await params : params
    const productId = resolvedParams.id

    console.log(`[PUT API] Received product ID: ${productId}`)

    if (!productId) {
      console.log(`[PUT API] No product ID provided`)
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      )
    }

    // Import getProducts to check what products exist
    const { getProducts } = await import("../store")
    const allProducts = getProducts()
    console.log(`[PUT API] Available product IDs:`, allProducts.map(p => p.id))

    const body = await req.json()
    
    console.log(`[PUT] Received update request for product ID: ${productId}`)
    console.log(`[PUT] Update payload:`, JSON.stringify(body, null, 2))

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

    // Prepare update data
    const updateData: any = {}
    
    // Always update these fields if provided
    if (body.productName !== undefined) {
      // Create a short and understandable title from the product name
      const shortTitle = createShortTitle(body.productName.trim(), 10)
      updateData.productName = shortTitle || body.productName.trim()
    }
    if (body.image !== undefined) updateData.image = body.image
    if (body.category !== undefined) updateData.category = body.category
    if (body.source !== undefined) updateData.source = body.source
    if (body.rating !== undefined) {
      const rating = parseFloat(body.rating)
      updateData.rating = (!isNaN(rating) && rating >= 0 && rating <= 5) ? rating : 0
    }
    if (body.reviewCount !== undefined) {
      const reviewCount = parseInt(body.reviewCount, 10)
      updateData.reviewCount = (!isNaN(reviewCount) && reviewCount >= 0) ? reviewCount : 0
    }
    if (body.price !== undefined) {
      const price = parseFloat(body.price)
      if (!isNaN(price) && price >= 0) {
        updateData.price = price
      }
    }
    if (body.originalPrice !== undefined) {
      if (body.originalPrice === null || body.originalPrice === "") {
        updateData.originalPrice = undefined
      } else {
        const originalPrice = parseFloat(body.originalPrice)
        if (!isNaN(originalPrice) && originalPrice >= 0) {
          updateData.originalPrice = originalPrice
        }
      }
    }
    if (body.productLink !== undefined) updateData.productLink = body.productLink
    if (body.amazonChoice !== undefined) updateData.amazonChoice = Boolean(body.amazonChoice)
    if (body.bestSeller !== undefined) updateData.bestSeller = Boolean(body.bestSeller)
    
    // Handle attributes - include all possible attributes
    if (body.attributes !== undefined) {
      const attributes: any = {}
      const attributeFields = [
        "brand", "color", "material", "capacity", "dimensions",
        "caratWeight", "gemstone", "size", "storage", "offerType", "kindleUnlimited", "fitType", "style", "volume",
        "skinType", "ingredients", "weight", "assembly", "ageRange",
        "safetyInfo", "author", "publisher", "pageCount", "isbn"
      ]
      
      attributeFields.forEach((field) => {
        if (body.attributes && body.attributes[field] !== undefined && body.attributes[field] !== null && body.attributes[field] !== "") {
          attributes[field] = String(body.attributes[field]).trim()
        }
      })
      updateData.attributes = Object.keys(attributes).length > 0 ? attributes : undefined
    }
    
    // Handle tags
    if (body.tags !== undefined) {
      if (body.tags === null || (Array.isArray(body.tags) && body.tags.length === 0)) {
        updateData.tags = undefined
      } else if (Array.isArray(body.tags)) {
        updateData.tags = body.tags.filter(tag => tag && tag.trim()).map(tag => tag.trim())
      }
    }

    console.log(`[PUT] Prepared update data:`, JSON.stringify(updateData, null, 2))

    // Update product (in production, update database)
    const updatedProduct = updateProduct(productId, updateData)

    if (!updatedProduct) {
      console.log(`[PUT API] Product not found in store: ${productId}`)
      return NextResponse.json(
        { error: `Product not found. Available IDs: ${allProducts.map(p => p.id).join(", ")}` },
        { status: 404 }
      )
    }

    console.log(`[PUT] Product updated successfully: ${productId}`)
    console.log(`[PUT] Updated product:`, JSON.stringify(updatedProduct, null, 2))
    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
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

    if (!user || user.email !== ADMIN_EMAIL) {
      console.log(`[DELETE API] Unauthorized - user email: ${user?.email}`)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Handle params - can be a Promise in Next.js 15+
    const resolvedParams = params instanceof Promise ? await params : params
    const productId = resolvedParams.id

    console.log(`[DELETE API] Received product ID: ${productId}`)

    if (!productId) {
      console.log(`[DELETE API] No product ID provided`)
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      )
    }

    // Import getProducts to check what products exist
    const { getProducts } = await import("../store")
    const allProducts = getProducts()
    console.log(`[DELETE API] Available product IDs:`, allProducts.map(p => p.id))
    console.log(`[DELETE API] Available product IDs (types):`, allProducts.map(p => ({ id: p.id, type: typeof p.id })))
    console.log(`[DELETE API] Attempting to delete product with ID: ${productId} (type: ${typeof productId})`)

    // Delete product (in production, delete from database)
    const deleted = deleteProduct(productId)

    if (!deleted) {
      console.log(`[DELETE API] Product not found in store: ${productId}`)
      console.log(`[DELETE API] Product ID comparison check:`)
      allProducts.forEach(p => {
        const idStr = String(p.id)
        const productIdStr = String(productId)
        console.log(`[DELETE API] Comparing: "${idStr}" === "${productIdStr}" ? ${idStr === productIdStr}`)
      })
      return NextResponse.json(
        { error: `Product not found. Available IDs: ${allProducts.map(p => p.id).join(", ")}` },
        { status: 404 }
      )
    }

    // Verify deletion by checking the store again
    const remainingProducts = getProducts()
    console.log(`[DELETE API] Products remaining after delete: ${remainingProducts.length}`)
    console.log(`[DELETE API] Remaining product IDs:`, remainingProducts.map(p => p.id))
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


