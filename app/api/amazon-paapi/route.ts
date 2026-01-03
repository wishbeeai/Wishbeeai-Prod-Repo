import { NextRequest, NextResponse } from "next/server"
import { getAmazonItem, normalizeAmazonItem } from "@/lib/amazonClient"

const AMAZON_ACCESS_KEY = process.env.AMAZON_ACCESS_KEY || ""
const AMAZON_SECRET_KEY = process.env.AMAZON_SECRET_KEY || ""
const AMAZON_ASSOCIATE_TAG = process.env.AMAZON_ASSOCIATE_TAG || ""

/**
 * Extract ASIN from Amazon URL
 * Handles multiple Amazon URL patterns: /dp/, /gp/product/, etc.
 */
function extractASIN(url: string): string | null {
  const regex = /(?:\/dp\/|\/gp\/product\/)([A-Z0-9]{10})/
  const match = url.match(regex)
  return match ? match[1] : null
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
      productASIN = extractASIN(productUrl)
      if (!productASIN) {
        return NextResponse.json(
          { 
            error: "Invalid Amazon URL. ASIN not found.",
            message: "Could not extract ASIN from the provided Amazon URL. Please ensure the URL contains a valid product ASIN.",
            details: "Expected URL format: https://www.amazon.com/.../dp/ASIN or .../gp/product/ASIN"
          },
          { status: 400 }
        )
      }
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
    console.log(`[PA-API] Credentials check - Access Key: ${AMAZON_ACCESS_KEY ? 'SET' : 'MISSING'}, Secret Key: ${AMAZON_SECRET_KEY ? 'SET' : 'MISSING'}, Associate Tag: ${AMAZON_ASSOCIATE_TAG ? 'SET' : 'MISSING'}`)

    // Call PA-API
    let paapiResponse
    try {
      paapiResponse = await fetchAmazonProduct(productASIN)
      console.log(`[PA-API] Response received:`, JSON.stringify(paapiResponse, null, 2).substring(0, 500))

      // Check for errors in response
      if (paapiResponse.Errors && paapiResponse.Errors.length > 0) {
        const error = paapiResponse.Errors[0]
        console.error(`[PA-API] PA-API returned errors:`, JSON.stringify(error, null, 2))
        return NextResponse.json(
          {
            error: error.Message || error.message || "PA-API error",
            code: error.Code || error.code,
            details: error,
            message: error.Message || error.message || "Amazon PA-API returned an error",
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
      const errorMessage = apiError instanceof Error ? apiError.message : String(apiError)
      const errorStack = apiError instanceof Error ? apiError.stack : undefined
      
      return NextResponse.json(
        {
          error: "Failed to fetch product from Amazon PA-API",
          details: errorMessage,
          message: errorMessage,
          stack: errorStack,
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
    return NextResponse.json(
      {
        error: "Failed to fetch product from Amazon PA-API",
        details: error instanceof Error ? error.message : "Unknown error",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    )
  }
}

