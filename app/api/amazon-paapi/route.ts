import { NextRequest, NextResponse } from "next/server"
import amazonPaapi from "amazon-paapi"

const AMAZON_ACCESS_KEY = process.env.AMAZON_ACCESS_KEY || ""
const AMAZON_SECRET_KEY = process.env.AMAZON_SECRET_KEY || ""
const AMAZON_ASSOCIATE_TAG = process.env.AMAZON_ASSOCIATE_TAG || ""
const AMAZON_REGION = process.env.AMAZON_REGION || "us-east-1"
const AMAZON_HOST = process.env.AMAZON_HOST || "webservices.amazon.com"

// Common parameters for all PA-API requests
const commonParameters = {
  AccessKey: AMAZON_ACCESS_KEY,
  SecretKey: AMAZON_SECRET_KEY,
  PartnerTag: AMAZON_ASSOCIATE_TAG,
  PartnerType: "Associates",
  Marketplace: "www.amazon.com",
}

/**
 * Extract ASIN from Amazon URL
 */
function extractASIN(url: string): string | null {
  try {
    // Common Amazon URL patterns:
    // https://www.amazon.com/dp/ASIN
    // https://www.amazon.com/product-name/dp/ASIN
    // https://www.amazon.com/gp/product/ASIN
    // https://www.amazon.com/exec/obidos/ASIN/ASIN
    
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    
    // Pattern 1: /dp/ASIN or /product-name/dp/ASIN
    const dpMatch = pathname.match(/\/dp\/([A-Z0-9]{10})/)
    if (dpMatch) return dpMatch[1]
    
    // Pattern 2: /gp/product/ASIN
    const gpMatch = pathname.match(/\/gp\/product\/([A-Z0-9]{10})/)
    if (gpMatch) return gpMatch[1]
    
    // Pattern 3: /exec/obidos/ASIN/ASIN
    const obidosMatch = pathname.match(/\/exec\/obidos\/ASIN\/([A-Z0-9]{10})/)
    if (obidosMatch) return obidosMatch[1]
    
    // Pattern 4: ASIN as query parameter
    const asinParam = urlObj.searchParams.get("asin") || urlObj.searchParams.get("ASIN")
    if (asinParam && asinParam.length === 10) return asinParam
    
    // Pattern 5: Direct ASIN in path
    const directMatch = pathname.match(/\/([A-Z0-9]{10})(?:\/|$|\?)/)
    if (directMatch) return directMatch[1]
    
    return null
  } catch (error) {
    console.error("Error extracting ASIN:", error)
    return null
  }
}

/**
 * Call Amazon Product Advertising API 5.0 using amazon-paapi package
 */
async function callPAAPI(asin: string) {
  if (!AMAZON_ACCESS_KEY || !AMAZON_SECRET_KEY || !AMAZON_ASSOCIATE_TAG) {
    throw new Error("Amazon PA-API credentials not configured")
  }

  // Request parameters for GetItems
  const requestParameters = {
    ItemIds: [asin],
    ItemIdType: "ASIN",
    Resources: [
      "ItemInfo.Title",
      "ItemInfo.ByLineInfo",
      "ItemInfo.Classifications",
      "ItemInfo.ExternalIds",
      "ItemInfo.Features",
      "ItemInfo.ManufactureInfo",
      "ItemInfo.ProductInfo",
      "ItemInfo.TechnicalInfo",
      "ItemInfo.TradeInInfo",
      "Offers.Listings.Availability.MaxOrderQuantity",
      "Offers.Listings.Availability.Message",
      "Offers.Listings.Availability.Type",
      "Offers.Listings.Condition",
      "Offers.Listings.Condition.ConditionNote",
      "Offers.Listings.DeliveryInfo.IsAmazonFulfilled",
      "Offers.Listings.DeliveryInfo.IsFreeShippingEligible",
      "Offers.Listings.DeliveryInfo.IsPrimeEligible",
      "Offers.Listings.MerchantInfo",
      "Offers.Listings.Price",
      "Offers.Listings.ProgramEligibility.IsPrimeExclusive",
      "Offers.Listings.ProgramEligibility.IsPrimePantry",
      "Offers.Listings.Promotions",
      "Offers.Listings.SavingBasis",
      "Offers.Summaries.HighestPrice",
      "Offers.Summaries.LowestPrice",
      "Offers.Summaries.OfferCount",
      "Images.Primary.Large",
      "Images.Primary.Medium",
      "Images.Primary.Small",
      "Images.Variants.Large",
      "Images.Variants.Medium",
      "Images.Variants.Small",
      "CustomerReviews.StarRating",
      "CustomerReviews.Count",
      "BrowseNodeInfo.BrowseNodes",
      "BrowseNodeInfo.WebsiteSalesRank",
    ],
  }

  // Call PA-API using the package
  return await amazonPaapi.GetItems(commonParameters, requestParameters)
}

/**
 * Convert PA-API response to our product data format
 */
function convertPAAPIResponse(paapiResponse: any, asin: string, originalUrl: string) {
  if (!paapiResponse.ItemsResult || !paapiResponse.ItemsResult.Items || paapiResponse.ItemsResult.Items.length === 0) {
    throw new Error("No items found in PA-API response")
  }

  const item = paapiResponse.ItemsResult.Items[0]
  const itemInfo = item.ItemInfo || {}
  const offers = item.Offers || {}
  const images = item.Images || {}
  const customerReviews = item.CustomerReviews || {}
  const browseNodeInfo = item.BrowseNodeInfo || {}

  // Extract product name
  const productName = itemInfo.Title?.DisplayValue || item.ASIN

  // Extract price
  let price: number | null = null
  let originalPrice: number | null = null
  
  if (offers.Listings && offers.Listings.length > 0) {
    const listing = offers.Listings[0]
    if (listing.Price) {
      price = parseFloat(listing.Price.Amount || "0")
      if (listing.Price.Currency === "USD" && price > 0) {
        price = price / 100 // PA-API returns prices in cents
      }
    }
    
    // Check for savings/sale price
    if (listing.SavingBasis && listing.SavingBasis.Amount) {
      originalPrice = parseFloat(listing.SavingBasis.Amount || "0")
      if (listing.SavingBasis.Currency === "USD" && originalPrice > 0) {
        originalPrice = originalPrice / 100
      }
    }
  }

  // Extract image
  let imageUrl: string | null = null
  if (images.Primary) {
    imageUrl = images.Primary.Large?.URL || images.Primary.Medium?.URL || images.Primary.Small?.URL || null
  }

  // Extract rating and review count
  let rating: number | null = null
  let reviewCount: number | null = null
  
  if (customerReviews.StarRating) {
    rating = parseFloat(customerReviews.StarRating.Value || "0")
  }
  
  if (customerReviews.Count) {
    reviewCount = parseInt(customerReviews.Count || "0", 10)
  }

  // Extract category
  let category: string | null = null
  if (browseNodeInfo.BrowseNodes && browseNodeInfo.BrowseNodes.length > 0) {
    category = browseNodeInfo.BrowseNodes[0].DisplayName || null
  }
  if (!category && itemInfo.Classifications) {
    category = itemInfo.Classifications.ProductGroup?.DisplayValue || null
  }

  // Extract brand
  let brand: string | null = null
  if (itemInfo.ByLineInfo) {
    brand = itemInfo.ByLineInfo.Brand?.DisplayValue || itemInfo.ByLineInfo.Manufacturer?.DisplayValue || null
  }

  // Extract features
  const features = itemInfo.Features?.DisplayValues || []
  const description = features.join(". ") || itemInfo.Title?.DisplayValue || ""

  // Extract Amazon Choice/Best Seller
  const amazonChoice = false // PA-API doesn't directly provide this
  const bestSeller = browseNodeInfo.WebsiteSalesRank ? true : false

  return {
    productName,
    price,
    originalPrice: originalPrice || undefined,
    image: imageUrl,
    imageUrl,
    category: category || "General",
    source: "Amazon",
    rating: rating || 0,
    reviewCount: reviewCount || 0,
    productLink: originalUrl,
    amazonChoice,
    bestSeller,
    brand,
    description,
    asin,
    attributes: {
      brand,
      features: features.length > 0 ? features : undefined,
    },
    stockStatus: offers.Listings?.[0]?.Availability?.Type === "Now" ? "In Stock" : "Out of Stock",
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
          { error: "Could not extract ASIN from Amazon URL" },
          { status: 400 }
        )
      }
    }

    if (!productASIN || productASIN.length !== 10) {
      return NextResponse.json(
        { error: "Invalid ASIN. ASIN must be 10 characters" },
        { status: 400 }
      )
    }

    console.log(`[PA-API] Fetching product details for ASIN: ${productASIN}`)

    // Call PA-API
    const paapiResponse = await callPAAPI(productASIN)

    // Check for errors in response
    if (paapiResponse.Errors && paapiResponse.Errors.length > 0) {
      const error = paapiResponse.Errors[0]
      return NextResponse.json(
        {
          error: error.Message || "PA-API error",
          code: error.Code,
          details: error,
        },
        { status: 400 }
      )
    }

    // Convert to our format
    const productData = convertPAAPIResponse(paapiResponse, productASIN, productUrl || `https://www.amazon.com/dp/${productASIN}`)

    return NextResponse.json({
      success: true,
      source: "amazon-paapi",
      productData,
      asin: productASIN,
    })
  } catch (error) {
    console.error("[PA-API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch product from Amazon PA-API",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

