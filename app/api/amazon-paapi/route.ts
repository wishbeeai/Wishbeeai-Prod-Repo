import { NextRequest, NextResponse } from "next/server"
import { getAmazonItem, normalizeAmazonItem } from "@/lib/amazonClient"

const AMAZON_ACCESS_KEY = process.env.AMAZON_ACCESS_KEY || ""
const AMAZON_SECRET_KEY = process.env.AMAZON_SECRET_KEY || ""
const AMAZON_ASSOCIATE_TAG = process.env.AMAZON_ASSOCIATE_TAG || ""

/**
 * Extract ASIN from Amazon URL
 * Handles multiple Amazon URL patterns:
 * - /dp/ASIN
 * - /gp/product/ASIN
 * - /product/ASIN
 * - /exec/obidos/ASIN/ASIN
 * - Query parameters: ?asin=ASIN or &asin=ASIN
 * - Short URLs: amzn.to/... (will need to follow redirect)
 */
function extractASIN(url: string): string | null {
  if (!url) return null
  
  // Clean the URL - remove fragments and normalize
  let cleanUrl = url.trim()
  
  // Remove URL fragment if present
  const fragmentIndex = cleanUrl.indexOf('#')
  if (fragmentIndex !== -1) {
    cleanUrl = cleanUrl.substring(0, fragmentIndex)
  }
  
  // Pattern 1: /dp/ASIN or /dp/ASIN/ or /dp/ASIN? or /dp/ASIN&
  let match = cleanUrl.match(/\/dp\/([A-Z0-9]{10})(?:\/|$|\?|&)/i)
  if (match) return match[1].toUpperCase()
  
  // Pattern 2: /gp/product/ASIN or /gp/product/ASIN/ or /gp/product/ASIN?
  match = cleanUrl.match(/\/gp\/product\/([A-Z0-9]{10})(?:\/|$|\?|&)/i)
  if (match) return match[1].toUpperCase()
  
  // Pattern 3: /product/ASIN
  match = cleanUrl.match(/\/product\/([A-Z0-9]{10})(?:\/|$|\?|&)/i)
  if (match) return match[1].toUpperCase()
  
  // Pattern 4: /exec/obidos/ASIN/ASIN
  match = cleanUrl.match(/\/exec\/obidos\/ASIN\/([A-Z0-9]{10})(?:\/|$|\?|&)/i)
  if (match) return match[1].toUpperCase()
  
  // Pattern 5: Query parameter ?asin=ASIN or &asin=ASIN
  match = cleanUrl.match(/[?&]asin=([A-Z0-9]{10})(?:&|$)/i)
  if (match) return match[1].toUpperCase()
  
  // Pattern 6: Query parameter ?ASIN=ASIN or &ASIN=ASIN
  match = cleanUrl.match(/[?&]ASIN=([A-Z0-9]{10})(?:&|$)/i)
  if (match) return match[1].toUpperCase()
  
  // Pattern 7: Look for ASIN in any position (10 alphanumeric chars, not preceded by another alphanumeric)
  // This is a fallback for unusual URL formats
  match = cleanUrl.match(/(?:^|[^A-Z0-9])([A-Z0-9]{10})(?:[^A-Z0-9]|$)/i)
  if (match) {
    const potentialASIN = match[1].toUpperCase()
    // Validate it's a valid ASIN format (starts with letter or number, 10 chars)
    if (/^[A-Z0-9]{10}$/.test(potentialASIN)) {
      return potentialASIN
    }
  }
  
  return null
}

/**
 * Fetch Amazon product using PA-API
 */
async function fetchAmazonProduct(asin: string) {
  if (!AMAZON_ACCESS_KEY || !AMAZON_SECRET_KEY || !AMAZON_ASSOCIATE_TAG) {
    throw new Error("Amazon PA-API credentials not configured")
  }

  try {
    console.log("[PA-API] Fetching product for ASIN:", asin)
    const response = await getAmazonItem(asin)
    
    console.log("[PA-API] Raw response from getAmazonItem:", JSON.stringify(response, null, 2).substring(0, 500))
    
    // Check if response has Errors property (PA-API error response format)
    if (response && typeof response === 'object' && 'Errors' in response) {
      console.error("[PA-API] Response contains Errors:", response.Errors)
      return response // Return as-is so error handling above can process it
    }
    
    if (!response) {
      throw new Error("No items found in PA-API response")
    }

    // Wrap in the expected response format
    return {
      ItemsResult: {
        Items: [response]
      }
    }
  } catch (error) {
    console.error("[PA-API] Error fetching Amazon product:", error)
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    }
    console.error("[PA-API] Error details:", JSON.stringify(errorDetails, null, 2))
    throw error
  }
}


export async function POST(req: NextRequest) {
  // Helper function to sanitize Access Key IDs from error messages
  const sanitizeAccessKey = (text: string): string => {
    // Match Access Key IDs (AKIA followed by 16 alphanumeric characters = 20 total)
    const accessKeyPattern = /AKIA[0-9A-Z]{16}/gi
    return text.replace(accessKeyPattern, "AKIA***REDACTED***")
  }

  try {
    // Check if credentials are configured
    if (!AMAZON_ACCESS_KEY || !AMAZON_SECRET_KEY || !AMAZON_ASSOCIATE_TAG) {
      return NextResponse.json(
        {
          error: "Amazon PA-API credentials not configured",
          details: "Please configure AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, and AMAZON_ASSOCIATE_TAG environment variables",
        },
        { status: 500 }
      )
    }

    const body = await req.json()
    const { productUrl, asin } = body

    if (!productUrl && !asin) {
      return NextResponse.json(
        { error: "productUrl or asin is required" },
        { status: 400 }
      )
    }

    // Extract ASIN if URL provided
    let productASIN = asin
    if (!productASIN && productUrl) {
      console.log("[PA-API] Attempting to extract ASIN from URL:", productUrl)
      productASIN = extractASIN(productUrl)
      if (!productASIN) {
        console.error("[PA-API] Failed to extract ASIN from URL:", productUrl)
        return NextResponse.json(
          { 
            error: "Invalid Amazon URL. ASIN not found.",
            message: "Could not extract ASIN from the provided Amazon URL. Please ensure the URL contains a valid product ASIN.",
            details: `Supported URL formats:
- https://www.amazon.com/dp/ASIN
- https://www.amazon.com/gp/product/ASIN
- https://www.amazon.com/product/ASIN
- https://www.amazon.com/exec/obidos/ASIN/ASIN
- URLs with ?asin=ASIN or &asin=ASIN query parameters
Provided URL: ${productUrl.substring(0, 200)}`
          },
          { status: 400 }
        )
      }
      console.log("[PA-API] Successfully extracted ASIN:", productASIN)
    }

    if (!productASIN || productASIN.length !== 10) {
      return NextResponse.json(
        { 
          error: "Invalid ASIN. ASIN must be 10 characters",
          message: `The ASIN "${productASIN || "unknown"}" is not valid. ASIN must be exactly 10 characters.`,
          details: `Received ASIN length: ${productASIN?.length || 0}`
        },
        { status: 400 }
      )
    }

    console.log(`[PA-API] Fetching product details for ASIN: ${productASIN}`)
    // Removed credential logging to prevent exposure

    // Call PA-API
    let paapiResponse
    try {
      paapiResponse = await fetchAmazonProduct(productASIN)
      console.log(`[PA-API] Response received:`, JSON.stringify(paapiResponse, null, 2).substring(0, 500))

      // Check for errors in response
      if (paapiResponse.Errors && paapiResponse.Errors.length > 0) {
        const error = paapiResponse.Errors[0]
        console.error(`[PA-API] PA-API returned errors:`, JSON.stringify(error, null, 2))
        
        // Sanitize error message before returning
        const errorMessage = sanitizeAccessKey(error.Message || error.message || "PA-API error")
        const sanitizedError = {
          ...error,
          Message: errorMessage,
          message: errorMessage,
        }
        
        return NextResponse.json(
          {
            error: errorMessage,
            code: error.Code || error.code,
            details: sanitizedError,
            message: errorMessage,
          },
          { status: 400 }
        )
      }

      // Check if response has items
      if (!paapiResponse.ItemsResult || !paapiResponse.ItemsResult.Items || paapiResponse.ItemsResult.Items.length === 0) {
        console.error(`[PA-API] No items found in response. Full response:`, JSON.stringify(paapiResponse, null, 2))
        return NextResponse.json(
          {
            error: "No product data found",
            details: "The product may not be available or the ASIN may be invalid",
            message: "No product data found for this ASIN",
          },
          { status: 404 }
        )
      }
    } catch (apiError) {
      console.error(`[PA-API] Exception during API call:`, apiError)
      
      // Extract error message and sanitize immediately
      let errorMessage = apiError instanceof Error ? apiError.message : String(apiError)
      errorMessage = sanitizeAccessKey(errorMessage)
      
      const errorStack = apiError instanceof Error ? apiError.stack : undefined
      const sanitizedStack = errorStack ? sanitizeAccessKey(errorStack) : undefined
      
      // Double-check: sanitize again to catch any Access Keys that might have been missed
      const finalMessage = sanitizeAccessKey(errorMessage)
      const finalStack = sanitizedStack ? sanitizeAccessKey(sanitizedStack) : undefined
      
      return NextResponse.json(
        {
          error: "Failed to fetch product from Amazon PA-API",
          details: finalMessage,
          message: finalMessage,
          stack: finalStack,
        },
        { status: 500 }
      )
    }

    // Normalize the item to our format
    const item = paapiResponse.ItemsResult.Items[0]
    const normalized = normalizeAmazonItem(item)
    
    // Convert to the format expected by the frontend
    const productData = {
      productName: normalized.title,
      imageUrl: normalized.image_url,
      image: normalized.image_url,
      price: normalized.list_price ? (normalized.list_price / 100).toString() : null, // PA-API returns in cents
      originalPrice: normalized.list_price ? (normalized.list_price / 100).toString() : undefined,
      rating: normalized.review_star?.Value ? parseFloat(normalized.review_star.Value) : 0,
      reviewCount: normalized.review_count ? parseInt(normalized.review_count) : 0,
      productLink: normalized.affiliate_url || `https://www.amazon.com/dp/${productASIN}?tag=${AMAZON_ASSOCIATE_TAG}`,
      affiliateUrl: normalized.affiliate_url || `https://www.amazon.com/dp/${productASIN}?tag=${AMAZON_ASSOCIATE_TAG}`,
      category: "General",
      source: "Amazon",
      asin: productASIN,
      amazonChoice: false,
      bestSeller: false,
    }

    return NextResponse.json({
      success: true,
      source: "amazon-paapi",
      productData,
      asin: productASIN,
    })
  } catch (error) {
    console.error("[PA-API] Top-level catch error:", error)
    console.error("[PA-API] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    
    // Helper function to sanitize Access Key IDs
    const sanitizeAccessKey = (text: string): string => {
      const accessKeyPattern = /AKIA[0-9A-Z]{16}/gi
      return text.replace(accessKeyPattern, "AKIA***REDACTED***")
    }
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const sanitizedMessage = sanitizeAccessKey(errorMessage)
    const sanitizedStack = error instanceof Error ? sanitizeAccessKey(error.stack || "") : undefined
    
    return NextResponse.json(
      {
        error: "Failed to fetch product from Amazon PA-API",
        details: sanitizedMessage,
        message: sanitizedMessage,
        stack: sanitizedStack,
      },
      { status: 500 }
    )
  }
}

