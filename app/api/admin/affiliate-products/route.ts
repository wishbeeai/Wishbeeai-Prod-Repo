import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getProducts, addProduct } from "./store"

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

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const userEmail = user?.email?.toLowerCase().trim()
    const adminEmail = ADMIN_EMAIL.toLowerCase().trim()
    if (!user || userEmail !== adminEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const products = getProducts()
    return NextResponse.json({
      products,
      total: products.length,
    })
  } catch (error) {
    console.error("Error fetching affiliate products:", error)
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

    // Build attributes object - include all possible attributes
    const attributes: any = {}
    if (body.attributes) {
      const attributeFields = [
        "brand", "color", "material", "capacity", "dimensions",
        "caratWeight", "gemstone", "size", "storage", "offerType", "kindleUnlimited", "fitType", "style", "volume",
        "skinType", "ingredients", "weight", "assembly", "ageRange",
        "safetyInfo", "author", "publisher", "pageCount", "isbn"
      ]
      
      attributeFields.forEach((field) => {
        if (body.attributes[field]) {
          attributes[field] = body.attributes[field]
        }
      })
    }

    // Create a short and understandable title from the product name
    const shortTitle = body.productName ? createShortTitle(body.productName, 10) : body.productName
    
    // Create new product
    const newProduct = {
      id: Date.now().toString(),
      productName: shortTitle || body.productName,
      image: body.image || "/placeholder.svg",
      category: body.category,
      source: body.source,
      rating: body.rating || 0,
      reviewCount: body.reviewCount || 0,
      price: parseFloat(body.price),
      originalPrice: body.originalPrice ? parseFloat(body.originalPrice) : undefined,
      productLink: body.productLink || "",
      amazonChoice: body.amazonChoice || false,
      bestSeller: body.bestSeller || false,
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      tags: body.tags && Array.isArray(body.tags) && body.tags.length > 0 ? body.tags : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Add to store (in production, insert into database)
    const savedProduct = addProduct(newProduct)

    return NextResponse.json({
      success: true,
      message: "Product added successfully",
      product: savedProduct,
    })
  } catch (error) {
    console.error("Error creating affiliate product:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

