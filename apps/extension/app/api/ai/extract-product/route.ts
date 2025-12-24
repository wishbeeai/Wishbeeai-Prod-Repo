import { generateText } from "ai"
import { NextResponse } from "next/server"
import * as fal from "@fal-ai/serverless-client"
import { Buffer } from "buffer"

fal.config({
  credentials: process.env.FAL_KEY,
})

function extractStructuredData(html: string) {
  const structuredData: any = {}

  // Extract JSON-LD structured data (common in modern e-commerce)
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/is)
  if (jsonLdMatch) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1])
      if (jsonLd["@type"] === "Product" || jsonLd.itemListElement?.[0]?.["@type"] === "Product") {
        const product = jsonLd["@type"] === "Product" ? jsonLd : jsonLd.itemListElement?.[0]
        structuredData.name = product.name
        structuredData.description = product.description
        structuredData.image = product.image?.[0] || product.image
        structuredData.price = product.offers?.price || product.offers?.[0]?.price
        structuredData.brand = product.brand?.name || product.brand
        structuredData.color = product.color
        structuredData.material = product.material
        structuredData.type = product.type // Added type attribute
      }
    } catch (e) {
      console.log("[v0] Failed to parse JSON-LD:", e)
    }
  }

  // Extract Open Graph image as fallback
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
  if (ogImageMatch && !structuredData.image) {
    structuredData.image = ogImageMatch[1]
  }

  // Extract from meta tags
  const metaImageMatch = html.match(/<meta[^>]*name=["']image["'][^>]*content=["']([^"']+)["']/i)
  if (metaImageMatch && !structuredData.image) {
    structuredData.image = metaImageMatch[1]
  }

  // Find main product image in img tags
  const imgMatch = html.match(/<img[^>]*class=["'][^"']*product[^"']*["'][^>]*src=["']([^"']+)["']/i)
  if (imgMatch && !structuredData.image) {
    structuredData.image = imgMatch[1]
  }

  return structuredData
}

function extractColorFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const swatchColor = urlObj.searchParams.get("swatchColor")
    if (swatchColor) {
      return decodeURIComponent(swatchColor)
    }
  } catch (e) {
    console.error("[v0] Error parsing URL for color:", e)
  }
  return null
}

function extractBrandFromName(productName: string): string | null {
  if (!productName) return null

  // Common brand patterns
  const brandPatterns = [/^([A-Z][a-zA-Z\s&]+?)\s+(Women's|Men's|Kids|Unisex)/i, /^([A-Z][a-zA-Z\s&]+?)\s+[A-Z]/]

  for (const pattern of brandPatterns) {
    const match = productName.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  // Fallback: take first capitalized words before common product types
  const match = productName.match(/^([A-Z][a-z\s&]+?)\s+(Sweater|Dress|Shirt|Pants|Shoes|Jacket|Coat)/i)
  if (match && match[1]) {
    return match[1].trim()
  }

  return null
}

function sanitizeValue(value: any): any {
  if (value === "null" || value === "NULL" || value === "") {
    return null
  }
  return value
}

function convertMacysImageUrl(imageUrl: string): string {
  if (!imageUrl) return imageUrl

  // Convert Macy's .tif images to .jpg (browsers don't support TIF)
  if (imageUrl.includes("macysassets.com") && imageUrl.endsWith("_fpx.tif")) {
    // Replace .tif with .jpg and add quality parameters
    return imageUrl.replace("_fpx.tif", "_fpx.jpg") + "?wid=500&hei=500&fmt=jpeg&qlt=90"
  }

  // Handle other Macy's TIF formats
  if (imageUrl.includes("macysassets.com") && imageUrl.match(/\.tif$/i)) {
    return imageUrl.replace(/\.tif$/i, ".jpg") + "?fmt=jpeg&qlt=90"
  }

  return imageUrl
}

function extractPriceFromHTML(html: string): number | null {
  // Pattern 1: Look for price in meta tags
  const metaPriceMatch = html.match(/<meta[^>]*property=["']og:price:amount["'][^>]*content=["']([0-9.]+)["']/i)
  if (metaPriceMatch) {
    return Number.parseFloat(metaPriceMatch[1])
  }

  // Pattern 2: Look for price in JSON-LD
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/is)
  if (jsonLdMatch) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1])
      const product = jsonLd["@type"] === "Product" ? jsonLd : jsonLd.itemListElement?.[0]
      if (product?.offers?.price) {
        return Number.parseFloat(product.offers.price)
      }
      if (product?.offers?.[0]?.price) {
        return Number.parseFloat(product.offers[0].price)
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }

  // Pattern 3: Look for common price patterns in HTML
  const pricePatterns = [
    /["']price["']\s*:\s*["']?\$?([0-9]+\.?[0-9]*)/i,
    /data-price=["']([0-9.]+)["']/i,
    /<span[^>]*class=["'][^"']*price[^"']*["'][^>]*>\$?([0-9]+\.?[0-9]*)/i,
    /<div[^>]*class=["'][^"']*price[^"']*["'][^>]*>\$?([0-9]+\.?[0-9]*)/i,
    /"price":\s*"?\$?([0-9]+\.?[0-9]*)"?/i,
  ]

  for (const pattern of pricePatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      const price = Number.parseFloat(match[1])
      if (price > 0 && price < 100000) {
        // Sanity check
        return price
      }
    }
  }

  return null
}

export async function POST(request: Request) {
  try {
    console.log("[v0] === Product extraction API called ===")

    const body = await request.json()
    const { productUrl, url } = body
    const finalUrl = productUrl || url

    console.log("[v0] Received product URL:", finalUrl)

    if (!finalUrl) {
      console.log("[v0] ERROR: No product URL provided")
      return NextResponse.json({ error: "Product URL is required" }, { status: 400 })
    }

    const isUrl = finalUrl.startsWith("http://") || finalUrl.startsWith("https://")

    if (!isUrl) {
      console.log("[v0] Input is a gift idea, extracting product details")

      const giftIdeaPrompt = `You are a product research assistant. A user wants: "${finalUrl}"

Based on this gift idea, research and provide detailed product information. Return ONLY a JSON object:

{
  "productName": "specific best-selling product name that matches (e.g., 'Nike Air Max 270 Running Shoes' for 'nike shoe')",
  "price": competitive market price in USD (numeric value),
  "description": "Detailed product description with key features and specifications (4-6 sentences)",
  "storeName": "popular retailer (Amazon, Nike.com, Target, Best Buy, etc.)",
  "category": "ONE of: Electronics, Clothing, Home & Kitchen, Beauty, Sports, Toys, Books, or General",
  "imageUrl": null,
  "productLink": null,
  "stockStatus": "In Stock",
  "attributes": {}
}

Research the best-selling, highest-rated product in this category at competitive pricing from trusted stores.
Return ONLY valid JSON, no markdown, no explanation.`

      const { text } = await generateText({
        model: "openai/gpt-4o-mini",
        prompt: giftIdeaPrompt,
        maxTokens: 1500,
      })

      console.log("[v0] AI gift idea response:", text)

      let cleanedText = text.trim()
      cleanedText = cleanedText.replace(/```json\n?/g, "").replace(/```\n?/g, "")

      const jsonStart = cleanedText.indexOf("{")
      const jsonEnd = cleanedText.lastIndexOf("}")

      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanedText = cleanedText.slice(jsonStart, jsonEnd + 1)
      }

      const productData = JSON.parse(cleanedText)
      productData.notice =
        "Product details generated from your gift idea. You can refine by pasting a specific product URL."
      productData.isFromGiftIdea = true

      return NextResponse.json({
        productName: productData.productName,
        price: productData.price,
        description: productData.description,
        storeName: productData.storeName,
        category: productData.category,
        imageUrl: productData.imageUrl,
        productLink: productData.productLink,
        stockStatus: productData.stockStatus,
        attributes: productData.attributes || {},
        notice: productData.notice,
      })
    }

    console.log("[v0] Extracting product from URL:", finalUrl)

    const urlObj = new URL(finalUrl)
    const storeName = urlObj.hostname.replace("www.", "").split(".")[0]
    const storeNameCapitalized = storeName.charAt(0).toUpperCase() + storeName.slice(1)

    const knownBlockingSites = [
      "macys.com",
      "nordstrom.com",
      "bloomingdales.com",
      "saksfifthavenue.com",
      "neimanmarcus.com",
      "bergdorfgoodman.com",
      "dsw.com",
      "target.com",
      "walmart.com",
      "kohls.com",
      "jcpenney.com",
      "dillards.com",
    ]

    const hostname = urlObj.hostname.replace("www.", "")
    const shouldSkipFetch = knownBlockingSites.some((site) => hostname.includes(site))

    let pageContent = ""
    const imageUrls: string[] = []
    let fetchSucceeded = false
    let siteBlockedAccess = false

    const timeoutMs = 8000
    let timeoutId: NodeJS.Timeout | null = null

    if (shouldSkipFetch && process.env.OXYLABS_USERNAME && process.env.OXYLABS_PASSWORD) {
      console.log("[v0] Using Oxylabs API for blocked site:", hostname)

      try {
        console.log("[v0] Oxylabs credentials found - attempting extraction")
        console.log(
          "[v0] OXYLABS_USERNAME:",
          process.env.OXYLABS_USERNAME ? "SET (length: " + process.env.OXYLABS_USERNAME.length + ")" : "NOT SET",
        )
        console.log(
          "[v0] OXYLABS_PASSWORD:",
          process.env.OXYLABS_PASSWORD ? "SET (length: " + process.env.OXYLABS_PASSWORD.length + ")" : "NOT SET",
        )

        const username = process.env.OXYLABS_USERNAME
        const password = process.env.OXYLABS_PASSWORD

        // Check if username looks incomplete (should be like "wishbeeai_Hy2er")
        if (username && !username.includes("_")) {
          console.warn("[v0] ⚠️ WARNING: OXYLABS_USERNAME appears incomplete (no underscore found)")
          console.warn("[v0] Expected format: 'username_suffix' (e.g., 'wishbeeai_Hy2er')")
          console.warn("[v0] Current value:", username)
          console.warn("[v0] Please verify the full username in your Oxylabs dashboard")
        }

        // Determine the scraping source based on the domain
        let source = "universal"
        let domain = "com"

        if (hostname.includes("amazon")) {
          source = "amazon_product"
          if (hostname.includes(".co.uk")) domain = "co.uk"
          else if (hostname.includes(".ca")) domain = "ca"
          else if (hostname.includes(".de")) domain = "de"
          else domain = "com"
        } else if (hostname.includes("walmart")) {
          source = "walmart_product"
        } else if (hostname.includes("target")) {
          source = "target_product"
        } else if (hostname.includes("homedepot")) {
          source = "universal"
          // Home Depot requires rendering for JavaScript content
        }
        // All other sites (Macy's, Nordstrom, DSW, Kohl's, etc.) use "universal"

        const oxylabsPayload: any = {
          source: source,
          url: finalUrl,
          parse: true,
        }

        // Add domain for Amazon
        if (source === "amazon_product") {
          oxylabsPayload.domain = domain
        }

        // Enable rendering for sites that need JavaScript execution
        if (hostname.includes("homedepot") || hostname.includes("lowes") || hostname.includes("bestbuy")) {
          oxylabsPayload.render = "html"
          oxylabsPayload.parse = false // Disable parsing when rendering
        }

        console.log("[v0] Oxylabs request payload:", JSON.stringify(oxylabsPayload, null, 2))

        console.log("[v0] Sending request to Oxylabs API...")

        const credentials = `${username}:${password}`
        console.log("[v0] Credentials string length:", credentials.length)
        console.log("[v0] Username:", username)
        console.log("[v0] Password length:", password?.length)

        const base64Credentials = Buffer.from(credentials).toString("base64")
        console.log("[v0] Base64 credentials:", base64Credentials)
        console.log("[v0] Base64 length:", base64Credentials.length)

        const oxylabsResponse = await fetch("https://realtime.oxylabs.io/v1/queries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${base64Credentials}`,
          },
          body: JSON.stringify(oxylabsPayload),
        })

        console.log("[v0] Oxylabs API response status:", oxylabsResponse.status)

        if (oxylabsResponse.ok) {
          console.log("[v0] Oxylabs API returned successful response")
          const oxylabsData = await oxylabsResponse.json()
          console.log("[v0] Oxylabs API response parsed successfully")
          console.log("[v0] Response structure:", JSON.stringify(oxylabsData).substring(0, 500))

          const htmlContent =
            typeof oxylabsData.results?.[0]?.content === "string"
              ? oxylabsData.results[0].content
              : oxylabsData.results?.[0]?.html || ""

          const structuredData = extractStructuredData(htmlContent)
          console.log("[v0] Extracted structured data:", structuredData)

          // Initialize productData with default structure
          const productData: any = {
            productName: null,
            price: null,
            description: null,
            storeName: storeNameCapitalized,
            category: "General",
            imageUrl: null,
            productLink: finalUrl,
            stockStatus: "Unknown",
            attributes: {
              brand: null,
              color: null,
              size: null,
              material: null,
              type: null, // Added type attribute
              width: null,
              capacity: null,
              features: null,
              warranty: null,
              fitType: null, // Added fitType attribute for clothing
              heelHeight: null, // Added heelHeight attribute for shoes
              model: null, // Added model attribute for electronics
              specifications: null, // Added specifications attribute for electronics
              energyRating: null, // Added energyRating attribute for home appliances
              ageRange: null, // Added ageRange attribute for toys
              safetyInfo: null, // Added safetyInfo attribute for toys
              author: null, // Added author attribute for books
              publisher: null, // Added publisher attribute for books
              pageCount: null, // Added pageCount attribute for books
              isbn: null, // Added isbn attribute for books
              gemstone: null, // Added gemstone attribute for jewelry
              caratWeight: null, // Added caratWeight attribute for jewelry
              dimensions: null, // Added dimensions attribute for furniture
              weight: null, // Added weight attribute for furniture
              assembly: null, // Added assembly attribute for furniture
            },
          }

          // Use extractStructuredData for initial parsing
          if (structuredData.name) productData.productName = structuredData.name
          if (structuredData.description) productData.description = structuredData.description
          if (structuredData.image) productData.imageUrl = structuredData.image
          if (structuredData.price) productData.price = Number.parseFloat(String(structuredData.price))
          if (structuredData.brand) productData.attributes.brand = structuredData.brand
          if (structuredData.color) productData.attributes.color = structuredData.color
          if (structuredData.material) productData.attributes.material = structuredData.material
          if (structuredData.type) productData.attributes.type = structuredData.type // Added type attribute

          // Extract basic data from Oxylabs parsed response if not already set
          const content = oxylabsData.results?.[0]?.content || {}
          if (!productData.productName && content.title) productData.productName = content.title
          if (!productData.attributes.brand && content.brand) productData.attributes.brand = content.brand
          // Price extraction logic updated below
          if (!productData.description && content.description) productData.description = content.description

          if (content.availability) {
            productData.stockStatus = content.availability
            console.log("[v0] Extracted stock status from Oxylabs:", productData.stockStatus)
          } else if (content.stock) {
            productData.stockStatus = content.stock
            console.log("[v0] Extracted stock from Oxylabs:", productData.stockStatus)
          }

          const isOxylabsSource = true

          if (isOxylabsSource) {
            // For Amazon specifically, check for main_image field
            if (source === "amazon_product" && content.main_image) {
              console.log("[v0] Found Amazon main_image:", content.main_image)
              productData.imageUrl = content.main_image
            }
            // Try images array (used by Amazon)
            else if (content.images && Array.isArray(content.images) && content.images.length > 0) {
              console.log("[v0] Found images array:", content.images)
              const imageUrls = content.images
                .map((img: any) => {
                  if (typeof img === "string") return img
                  if (img.url) return img.url
                  if (img.link) return img.link
                  return null
                })
                .filter(Boolean)

              if (imageUrls.length > 0) {
                console.log("[v0] Found image URLs:", imageUrls)
                productData.imageUrl = imageUrls[0]
              }
            }
            // Try singular image field (used by Macy's, Nordstrom, etc.)
            else if (content.image) {
              console.log("[v0] Found image (singular):", content.image)
              productData.imageUrl = convertMacysImageUrl(content.image)
            }
          }

          if (!productData.imageUrl) {
            // Try singular format first (used by Macy's, Nordstrom, etc.)
            if (content.image) {
              console.log("[v0] Found image (singular):", content.image)
              productData.imageUrl = content.image
            }
            // Try plural format (used by Amazon, Target, etc.)
            else if (content.images && content.images.length > 0) {
              console.log("[v0] Found images (plural):", content.images[0])
              const rawImageUrl = content.images[0].url || content.images[0]
              productData.imageUrl = convertMacysImageUrl(rawImageUrl)
            }
          }

          // Extract color from URL first (highest priority)
          const colorFromUrl = extractColorFromUrl(finalUrl)
          if (colorFromUrl) {
            productData.attributes.color = colorFromUrl
            console.log("[v0] Extracted color from URL:", productData.attributes.color)
          }

          // Extract brand from product name if not already set
          if (!productData.attributes.brand && productData.productName) {
            const brandMatch = productData.productName.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+/i)
            if (brandMatch) {
              productData.attributes.brand = brandMatch[1].trim()
              console.log("[v0] Extracted brand from title:", productData.attributes.brand)
            }
          }

          // Price extraction logic updated: Check for sale price FIRST, then current price, then original price
          if (content.salePrice) {
            productData.price = Number.parseFloat(content.salePrice)
            console.log("[v0] Extracted sale price from Oxylabs:", productData.price)
          }

          // Check for current price
          if (!productData.price && content.price) {
            // Oxylabs can return price in various formats
            if (typeof content.price === "number") {
              productData.price = content.price
            } else if (typeof content.price === "string") {
              // Remove currency symbols and parse
              const priceStr = content.price.replace(/[$,]/g, "")
              productData.price = Number.parseFloat(priceStr)
            } else if (content.price.price) {
              productData.price = Number.parseFloat(content.price.price)
            } else if (content.price.amount) {
              productData.price = Number.parseFloat(content.price.amount)
            }
            console.log("[v0] Extracted price from Oxylabs content.price:", productData.price)
          }

          // Check for originalPrice only as last fallback
          if (!productData.price && content.originalPrice) {
            productData.price = Number.parseFloat(content.originalPrice)
            console.log("[v0] Extracted original price from Oxylabs:", productData.price)
          }

          // If price is still null, try extracting from HTML patterns
          if (!productData.price) {
            const extractedPrice = extractPriceFromHTML(htmlContent)
            if (extractedPrice) {
              productData.price = extractedPrice
              console.log("[v0] Price extracted from HTML patterns:", extractedPrice)
            }
          }

          // Single comprehensive AI extraction for all attributes
          const comprehensivePrompt = `Analyze this product page HTML and extract ALL available attributes.

HTML Content (first 15000 chars): ${typeof htmlContent === "string" ? htmlContent.substring(0, 15000) : JSON.stringify(htmlContent).substring(0, 15000)}

Product URL: ${finalUrl}
Product Name: ${productData.productName || "Unknown"}
Store: ${storeNameCapitalized}

Extract EVERY available field from the HTML. Look for:
- Price: Check meta tags, JSON-LD, data-price attributes, price display elements, or patterns like "$XX.XX" or "price":XX.XX
- Size: Check for SELECTED size in dropdowns (<option selected>), active size buttons, or default size. Look for "selected", "active", or "checked" attributes.
- Color: Already extracted from URL parameter
- Material: Look in product details, specifications, or fabric content sections
- Type: Extract the FIT TYPE or SIZE TYPE (e.g., "Regular", "Petite", "Plus", "Tall", "Maternity"), NOT the garment style. Check product name for "Regular", "Petite", "Plus Size", etc.

Return a JSON object with these fields (use null if not found):

{
  "category": "ONE of: Clothing, Shoes, Electronics, Kitchen Appliances, Home Appliances, Jewelry, Furniture, Toys, Books, or General",
  "color": "product color (if not already set)",
  "size": "SELECTED or DEFAULT size from the page (e.g., 'Medium', 'L', '8', 'Small')",
  "material": "material/fabric composition",
  "type": "FIT TYPE ONLY: Regular, Petite, Plus, Tall, Maternity, Standard, etc. (NOT Crewneck/V-Neck/etc.)",
  "features": "comma-separated key features",
  "capacity": "capacity with units (appliances only)",
  "warranty": "warranty period (electronics/appliances only)",
  "width": "shoe width (shoes only)",
  "price": numeric price value only (extract from $XX.XX patterns, meta tags, or JSON-LD)
}

CRITICAL INSTRUCTIONS:
- For TYPE: Look for "Regular", "Petite", "Plus Size", "Tall" in the product name or size options. If the product is for "Regular & Petite", extract "Regular" as the type.
- For PRICE: Look for <span class="price">, <meta property="product:price:amount">, JSON-LD "offers": {"price": XX.XX}, or visible $XX.XX text patterns
- For SIZE: Look for <option selected>, aria-selected="true", class="selected", or default size values. Check for data-size, data-value attributes.
- Return numeric price without $ symbol

Return ONLY valid JSON, no markdown, no explanation.`

          try {
            const { text: aiText } = await generateText({
              model: "openai/gpt-4o-mini",
              prompt: comprehensivePrompt,
              maxTokens: 800,
              temperature: 0.1,
            })

            console.log("[v0] AI extraction response:", aiText.substring(0, 500))

            // Clean up AI response - handle markdown wrapping
            let cleanedAiText = aiText.trim()
            cleanedAiText = cleanedAiText.replace(/```json\n?/g, "").replace(/```\n?/g, "")

            // Remove any leading/trailing text outside JSON object
            const jsonMatch = cleanedAiText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              cleanedAiText = jsonMatch[0]
            }

            const aiExtracted = JSON.parse(cleanedAiText)

            // Merge AI-extracted attributes (preserving URL-extracted color)
            if (aiExtracted.category) {
              productData.category = sanitizeValue(aiExtracted.category)
            }
            if (aiExtracted.color && !productData.attributes.color) {
              productData.attributes.color = sanitizeValue(aiExtracted.color)
            }
            if (aiExtracted.size) {
              productData.attributes.size = sanitizeValue(aiExtracted.size)
            }
            if (aiExtracted.material) {
              productData.attributes.material = sanitizeValue(aiExtracted.material)
            }
            if (aiExtracted.type) {
              productData.attributes.type = sanitizeValue(aiExtracted.type) // Added type attribute
            }
            if (aiExtracted.features) {
              productData.attributes.features = sanitizeValue(aiExtracted.features)
            }
            if (aiExtracted.capacity) {
              productData.attributes.capacity = sanitizeValue(aiExtracted.capacity)
            }
            if (aiExtracted.warranty) {
              productData.attributes.warranty = sanitizeValue(aiExtracted.warranty)
            }
            if (aiExtracted.width) {
              productData.attributes.width = sanitizeValue(aiExtracted.width)
            }
            if (aiExtracted.price && !productData.price) {
              const parsedPrice = Number.parseFloat(String(aiExtracted.price).replace(/[^0-9.]/g, ""))
              if (!isNaN(parsedPrice) && parsedPrice > 0) {
                productData.price = parsedPrice
              }
            }

            console.log("[v0] Successfully extracted attributes via AI")
          } catch (aiError) {
            console.error("[v0] AI extraction failed:", aiError)
            console.error("[v0] This is non-fatal, continuing with available data")
          }

          console.log("[v0] Final product data:", JSON.stringify(productData).substring(0, 1000))
          return NextResponse.json(productData)
        } else {
          const errorBody = await oxylabsResponse.text()
          console.log("[v0] Oxylabs API request failed with status:", oxylabsResponse.status)
          console.log("[v0] Error message:", errorBody)

          if (oxylabsResponse.status === 401) {
            console.error("[v0] ❌ AUTHENTICATION FAILED")
            console.error("[v0] The credentials are invalid or incomplete")
            console.error("[v0] Current username:", username)
            console.error("[v0] Please check:")
            console.error(
              "[v0]   1. OXYLABS_USERNAME should be the FULL username from your dashboard (e.g., 'wishbeeai_Hy2er')",
            )
            console.error("[v0]   2. OXYLABS_PASSWORD should match exactly (including special characters like '+')")
            console.error("[v0]   3. Update these in the Vars section of the v0 sidebar")

            return NextResponse.json(
              {
                error: "Oxylabs authentication failed",
                oxylabsAuthFailed: true,
                details: "Invalid credentials. Please check OXYLABS_USERNAME and OXYLABS_PASSWORD in Vars section.",
              },
              { status: 401 },
            )
          }

          console.log("[v0] Falling back to URL-based extraction")
        }
      } catch (oxylabsError) {
        console.error("[v0] Oxylabs API error occurred:", oxylabsError)
        console.error("[v0] Error type:", typeof oxylabsError)
        console.error(
          "[v0] Error message:",
          oxylabsError instanceof Error ? oxylabsError.message : String(oxylabsError),
        )
        if (oxylabsError instanceof Error) {
          console.error("[v0] Error stack:", oxylabsError.stack)
        }
        console.log("[v0] Falling back to URL-based extraction")
      }
    } else if (shouldSkipFetch) {
      console.log("[v0] Oxylabs credentials not configured - using URL-based extraction for blocked site")
    }

    let response: Response | null = null

    try {
      const controller = new AbortController()
      timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      const fetchPromise = new Promise<Response | null>((resolve) => {
        fetch(finalUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            Connection: "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Cache-Control": "max-age=0",
            Referer: urlObj.origin,
          },
        })
          .then(resolve)
          .catch(() => resolve(null)) // Silently catch all fetch errors
      })

      response = await fetchPromise
    } catch (fetchErr) {
      response = null
    }

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    if (!response) {
      console.log("[v0] Site blocks scraping or timeout - using URL-based extraction")
      siteBlockedAccess = true
      fetchSucceeded = false
    } else if (response.status === 403) {
      console.log("[v0] Site blocks scraping (403) - using URL-based extraction")
      siteBlockedAccess = true
      fetchSucceeded = false
    } else if (!response.ok) {
      console.log(`[v0] Site returned ${response.status} - using URL-based extraction`)
      siteBlockedAccess = true
      fetchSucceeded = false
    } else {
      fetchSucceeded = true
      const html = await response.text()

      // Use extractStructuredData for initial parsing
      const structuredData = extractStructuredData(html)
      if (structuredData.image) {
        const fullUrl = structuredData.image.startsWith("http")
          ? structuredData.image
          : new URL(structuredData.image, finalUrl).href
        if (!imageUrls.includes(fullUrl) && fullUrl.match(/\.(jpg|jpeg|png|webp)/i)) {
          imageUrls.push(fullUrl)
        }
      }

      const ogImageRegex = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/gi
      let match
      while ((match = ogImageRegex.exec(html)) !== null) {
        const imgUrl = match[1]
        if (imgUrl && imgUrl.match(/\.(jpg|jpeg|png|webp)/i)) {
          const fullUrl = imgUrl.startsWith("http") ? imgUrl : new URL(imgUrl, finalUrl).href
          if (!imageUrls.includes(fullUrl)) {
            imageUrls.push(fullUrl)
          }
        }
      }

      const twitterImageRegex = /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/gi
      while ((match = twitterImageRegex.exec(html)) !== null) {
        const imgUrl = match[1]
        if (imgUrl && imgUrl.match(/\.(jpg|jpeg|png|webp)/i)) {
          const fullUrl = imgUrl.startsWith("http") ? imgUrl : new URL(imgUrl, finalUrl).href
          if (!imageUrls.includes(fullUrl)) {
            imageUrls.push(fullUrl)
          }
        }
      }

      const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/gi
      while ((match = jsonLdRegex.exec(html)) !== null) {
        try {
          const jsonData = JSON.parse(match[1])
          const extractImageFromJsonLd = (obj: any): string | null => {
            if (obj.image) {
              const imgUrl = Array.isArray(obj.image) ? obj.image[0] : obj.image
              if (typeof imgUrl === "string") return imgUrl
              if (typeof imgUrl === "object" && imgUrl.url) return imgUrl.url
            }
            return null
          }

          let imgUrl = extractImageFromJsonLd(jsonData)
          if (!imgUrl && Array.isArray(jsonData)) {
            for (const item of jsonData) {
              imgUrl = extractImageFromJsonLd(item)
              if (imgUrl) break
            }
          }

          if (imgUrl && imgUrl.match(/\.(jpg|jpeg|png|webp)/i)) {
            const fullUrl = imgUrl.startsWith("http") ? imgUrl : new URL(imgUrl, finalUrl).href
            if (!imageUrls.includes(fullUrl)) {
              imageUrls.push(fullUrl)
            }
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }

      const jsDataRegex =
        /(?:window\.__INITIAL_STATE__|__PRELOADED_STATE__|productData|product_data)\s*=\s*({[^;]+});/gi
      while ((match = jsDataRegex.exec(html)) !== null) {
        try {
          const jsonStr = match[1]
          const jsonData = JSON.parse(jsonStr)

          const findImages = (obj: any): string[] => {
            const images: string[] = []
            if (typeof obj === "string" && obj.match(/https?:\/\/[^\s"']+\.(jpg|jpeg|png|webp)/i)) {
              images.push(obj)
            } else if (typeof obj === "object" && obj !== null) {
              for (const key of Object.keys(obj)) {
                if (
                  key.toLowerCase().includes("image") ||
                  key.toLowerCase().includes("photo") ||
                  key.toLowerCase().includes("picture")
                ) {
                  const val = obj[key]
                  if (typeof val === "string" && val.match(/https?:\/\/[^\s"']+\.(jpg|jpeg|png|webp)/i)) {
                    images.push(val)
                  } else if (Array.isArray(val)) {
                    val.forEach((item) => {
                      if (typeof item === "string" && item.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|webp)/i)) {
                        images.push(item)
                      } else if (typeof item === "object" && item !== null && item.url) {
                        images.push(item.url)
                      }
                    })
                  }
                }
                images.push(...findImages(obj[key]))
              }
            }
            return images
          }

          const foundImages = findImages(jsonData)
          foundImages.forEach((img) => {
            if (!imageUrls.includes(img) && !img.includes("sprite") && !img.includes("placeholder")) {
              imageUrls.push(img)
            }
          })
        } catch (e) {
          // Skip invalid JSON
        }
      }

      const dataAttrRegex = /<[^>]+data-[^>]*(?:image|img|photo|picture)[^>]*=["']([^"']+)["']/gi
      while ((match = dataAttrRegex.exec(html)) !== null) {
        const imgUrl = match[1]
        if (imgUrl.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|webp)/i)) {
          if (!imageUrls.includes(imgUrl) && !imgUrl.includes("sprite") && !imgUrl.includes("placeholder")) {
            imageUrls.push(imgUrl)
          }
        }
      }

      const imgRegex = /<img[^>]+src="([^">]+)"/gi
      while ((match = imgRegex.exec(html)) !== null) {
        let imgUrl = match[1]

        if (
          imgUrl.includes("sprite") ||
          imgUrl.includes("nav-") ||
          imgUrl.includes("logo") ||
          imgUrl.includes("icon") ||
          imgUrl.includes("arrow") ||
          imgUrl.includes("button") ||
          imgUrl.includes("fashion-store") ||
          imgUrl.includes("banner") ||
          imgUrl.includes("header") ||
          imgUrl.includes("footer") ||
          imgUrl.includes("thumbnail-placeholder") ||
          imgUrl.match(/\.(svg|gif)$/i) ||
          imgUrl.includes("blank.gif") ||
          imgUrl.includes("pixel.gif") ||
          imgUrl.includes("spacer") ||
          imgUrl.includes("lazy") ||
          imgUrl.includes("placeholder") ||
          imgUrl.length < 20
        ) {
          continue
        }

        if (
          imgUrl.includes("media-amazon.com/images/I/") ||
          imgUrl.includes("product") ||
          imgUrl.includes("item") ||
          imgUrl.includes("catalog") ||
          imgUrl.includes("merchandise") ||
          imgUrl.includes("goods") ||
          imgUrl.includes("cloudfront") ||
          imgUrl.includes("cdn") ||
          imgUrl.includes("assets") ||
          imgUrl.match(/\/images\/[^/]+\.(jpg|jpeg|png|webp)/i)
        ) {
          if (imgUrl.includes("media-amazon.com/images/I/")) {
            imgUrl = imgUrl.replace(/\._AC_[A-Z]{2}\d+_\./g, ".")
            imgUrl = imgUrl.replace(/\._[A-Z]{2}\d+_\./g, ".")
          }

          const fullUrl = imgUrl.startsWith("http") ? imgUrl : new URL(imgUrl, finalUrl).href
          if (!imageUrls.includes(fullUrl) && fullUrl.match(/\.(jpg|jpeg|png|webp)/i)) {
            imageUrls.push(fullUrl)
          }
        }
      }

      const dataSrcRegex = /<img[^>]+data-src="([^">]+)"/gi
      while ((match = dataSrcRegex.exec(html)) !== null) {
        let imgUrl = match[1]
        if (
          !imgUrl.includes("sprite") &&
          !imgUrl.includes("nav-") &&
          !imgUrl.includes("placeholder") &&
          imgUrl.match(/\.(jpg|jpeg|png|webp)/i)
        ) {
          if (imgUrl.includes("media-amazon.com/images/I/")) {
            imgUrl = imgUrl.replace(/\._AC_[A-Z]{2}\d+_\./g, ".")
            imgUrl = imgUrl.replace(/\._[A-Z]{2}\d+_\./g, ".")
          }
          const fullUrl = imgUrl.startsWith("http") ? imgUrl : new URL(imgUrl, finalUrl).href
          if (!imageUrls.includes(fullUrl)) {
            imageUrls.push(fullUrl)
          }
        }
      }

      const srcsetRegex = /<img[^>]+srcset="([^">]+)"/gi
      while ((match = srcsetRegex.exec(html)) !== null) {
        const srcset = match[1]
        const urls = srcset.split(",").map((s) => s.trim().split(" ")[0])
        const largestUrl = urls[urls.length - 1]
        if (
          largestUrl &&
          !largestUrl.includes("sprite") &&
          !largestUrl.includes("placeholder") &&
          largestUrl.match(/\.(jpg|jpeg|png|webp)/i)
        ) {
          const fullUrl = largestUrl.startsWith("http") ? largestUrl : new URL(largestUrl, finalUrl).href
          if (!imageUrls.includes(fullUrl)) {
            imageUrls.push(fullUrl)
          }
        }
      }

      console.log("[v0] Found image URLs:", imageUrls.slice(0, 5))

      const textContent = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 15000)

      pageContent = textContent
    }

    const bestImageUrl = imageUrls.length > 0 ? imageUrls[0] : null

    console.log("[v0] Best image URL selected:", bestImageUrl)

    const prompt =
      fetchSucceeded && pageContent
        ? `Extract complete product information from this webpage. Return ONLY a JSON object with these exact fields:

Webpage URL: ${finalUrl}
${bestImageUrl ? `Product Image URL (USE THIS EXACTLY): ${bestImageUrl}` : ""}
Webpage Content: ${pageContent}

Extract ALL available information:
{
  "productName": "exact product title from the page",
  "price": numeric price value only (e.g., 299.99),
  "description": "COMPLETE detailed product description including ALL key features, specifications, materials, dimensions, and benefits from the webpage (minimum 4-6 sentences with full details)",
  "storeName": "store/retailer name (e.g., Amazon, Target, DSW, etc.)",
  "category": "ONE of: Electronics, Clothing, Home & Kitchen, Beauty, Sports, Toys, Books, or General (determine from product type)",
  "imageUrl": "${bestImageUrl || "null"}",
  "productLink": "${finalUrl}",
  "stockStatus": "In Stock" or "Low Stock" or "Out of Stock",
  "attributes": {
    "brand": "brand name if available",
    "color": "color if available",
    "size": "size if available",
    "material": "material if available",
    "type": "product type/style if available",
    "width": "width for shoes if available",
    "capacity": "capacity with units for appliances (e.g., 2L Water Tank)",
    "features": "comma-separated key features (e.g., Built-in Grinder, Milk Frother)",
    "warranty": "warranty period if available (e.g., 2 years)"
  }
}

CRITICAL RULES:
- Extract the COMPLETE product description with ALL details available on the page
- Determine the most appropriate category from the product type
- For imageUrl, copy EXACTLY this URL without ANY modifications: ${bestImageUrl || "null"}
- Extract brand, color, size, and material into attributes object
- Do NOT truncate the description - include all important product information
- Return ONLY valid JSON, no markdown, no explanation.`
        : `The website blocks automated access. Analyze this product URL CAREFULLY to extract EXACT product details. Return ONLY a JSON object:

URL: ${finalUrl}
Store: ${storeNameCapitalized}

ANALYZE THE URL STRUCTURE CAREFULLY:
- Product name is in the URL path (e.g., "vince-camuto-womens-cozy-crewneck-long-sleeve-extend-shoulder-sweater")
- Look for URL parameters that might contain price, color, size, SKU, or product ID
- Extract brand name from product name (first part before product type)
- Infer color from URL or product description keywords
- Look for size information in URL parameters or product name

For MACY'S URLs specifically:
- Product ID parameter: ID=XXXXXX
- Color codes may be in URL or need to be inferred from product name
- Price information may be embedded in URL parameters or campaign data
- Size charts may be indicated in URL parameters

{
  "productName": "Full product name extracted from URL (preserve exact capitalization and all details)",
  "price": null,
  "description": "Based on the URL analysis, this appears to be [describe product type and features inferred from URL]. Please verify exact price, available colors, sizes, and other specifications by visiting ${storeNameCapitalized} directly at the link provided.",
  "storeName": "${storeNameCapitalized}",
  "category": "Infer category from product name (Electronics, Clothing, Home & Kitchen, Beauty, Sports, Toys, Books, or General)",
  "imageUrl": null,
  "productLink": "${finalUrl}",
  "stockStatus": "Unknown - Verify on store website",
  "attributes": {
    "brand": "Extract brand name from product name (first significant word or phrase before product type)",
    "color": "Infer color from product name or URL if possible, otherwise null",
    "size": "Extract size information if present in URL or product name, otherwise null",
    "material": "Infer material from product name if mentioned (e.g., cotton, leather, polyester), otherwise null",
    "type": "Infer product type/style from product name or URL if possible, otherwise null",
    "width": "Infer width for shoes if mentioned (e.g., Medium, Wide, Narrow, Regular), otherwise null",
    "capacity": "Infer capacity for appliances/containers if mentioned (e.g., 2L, 500ml), otherwise null",
    "features": "Extract key features from product name if present, otherwise null",
    "warranty": "Extract warranty information if present in product name or URL, otherwise null"
  }
}

EXAMPLE: For "vince-camuto-womens-cozy-crewneck-long-sleeve-extend-shoulder-sweater":
- Brand: "Vince Camuto"
- Category: "Clothing"
- Product name should include "Women's Cozy Crewneck Long Sleeve Extend Shoulder Sweater"
- If color appears in the name or URL, extract it (e.g., "amber", "navy", "black")

Return ONLY valid JSON, no markdown, no explanation.`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
      maxTokens: 2000,
      temperature: 0.1, // Added temperature for potentially more nuanced extraction
    })

    console.log("[v0] AI response:", text)

    let cleanedText = text.trim()
    cleanedText = cleanedText.replace(/```json\n?/g, "").replace(/```\n?/g, "")

    const jsonStart = cleanedText.indexOf("{")
    const jsonEnd = cleanedText.lastIndexOf("}")

    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanedText = cleanedText.slice(jsonStart, jsonEnd + 1)
    }

    const productData = JSON.parse(cleanedText)

    if (!productData.imageUrl || productData.imageUrl === "null" || productData.imageUrl === null) {
      console.log("[v0] No product image found - user can upload manually or use URL")
      productData.imageUrl = null
      productData.productUrlForImageExtraction = finalUrl
      if (!productData.notice) {
        productData.notice = siteBlockedAccess
          ? `⚠️ ${storeNameCapitalized} blocks automated access. Product image could not be extracted. You can paste an image URL or upload an image manually.`
          : "Product image could not be extracted automatically. You can paste an image URL or upload an image manually."
      }
    }

    if (!productData.attributes) {
      productData.attributes = {}
    }

    if (!productData.category) {
      productData.category = "General"
    }

    console.log("[v0] Extracted product:", productData)

    return NextResponse.json(productData)
  } catch (error) {
    console.error("[v0] === TOP LEVEL ERROR IN PRODUCT EXTRACTION API ===")
    console.error("[v0] Error type:", typeof error)
    console.error("[v0] Error object:", error)
    console.error("[v0] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return NextResponse.json(
      {
        error: "Failed to extract product information",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function constructDSWImageUrl(productUrl: string): string | null {
  try {
    const url = new URL(productUrl)

    const pathParts = url.pathname.split("/")
    const productId = pathParts[pathParts.length - 1]

    const colorCode = url.searchParams.get("activeColor")

    if (productId && colorCode) {
      const imageUrl = `https://images.dsw.com/is/image/DSWShoes/${productId}_${colorCode}_ss_01?impolicy=qlt-medium-high&imwidth=640&imdensity=2`
      return imageUrl
    }

    return null
  } catch (error) {
    console.log("[v0] Failed to construct DSW image URL:", error)
    return null
  }
}
