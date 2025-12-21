import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import * as fal from "@fal-ai/serverless-client"

export const maxDuration = 60

const productImageSchema = z.object({
  imageUrl: z.string().nullable().describe("The URL of the main product image, or null if not found"),
  confidence: z.enum(["high", "medium", "low"]).describe("Confidence level in the extracted image"),
  description: z.string().describe("Brief description of the main product visible in the image"),
})

export async function POST(req: NextRequest) {
  try {
    const { productUrl, productName } = await req.json()

    if (!productUrl) {
      return NextResponse.json({ error: "Product URL is required" }, { status: 400 })
    }

    console.log("[v0] Starting JavaScript-aware image extraction for:", productUrl)

    if (productUrl.includes("dsw.com/product/")) {
      const dswImageUrl = constructDSWImageUrl(productUrl)
      if (dswImageUrl) {
        console.log("[v0] ✅ Constructed DSW image URL:", dswImageUrl)
        return NextResponse.json({
          imageUrl: dswImageUrl,
          extractedBy: "dsw-url-pattern",
          confidence: "high",
          totalImagesFound: 1,
        })
      }
    }

    // Fetch the HTML
    let response
    try {
      response = await fetch(productUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
        },
        signal: AbortSignal.timeout(10000),
      })
    } catch (fetchError) {
      console.log("[v0] Fetch failed, will try AI generation if product name available")
      response = null
    }

    if (!response || !response.ok) {
      console.log("[v0] Failed to fetch page, attempting AI image generation...")
      if (productName) {
        return await generateProductImageWithAI(productName)
      }
      return NextResponse.json({
        imageUrl: null,
        error: "Could not fetch the product page. Please paste the image URL manually.",
      })
    }

    const html = await response.text()

    console.log("[v0] Step 1: Looking for images in JavaScript variables...")
    const jsImageUrls = await extractFromJavaScriptVariables(html, productUrl)

    console.log("[v0] Step 2: Looking for images in JSON-LD...")
    const jsonLdImageUrls = await extractFromJsonLD(html)

    console.log("[v0] Step 3: Looking for images in meta tags...")
    const metaImageUrls = await extractFromMetaTags(html)

    console.log("[v0] Step 4: Looking for images in HTML attributes...")
    const htmlImageUrls = await extractFromHTMLAttributes(html, productUrl)

    // Combine all found images
    const allImages = [...new Set([...jsImageUrls, ...jsonLdImageUrls, ...metaImageUrls, ...htmlImageUrls])]

    console.log("[v0] Total unique images found:", allImages.length)
    console.log("[v0] Image URLs:", allImages.slice(0, 5))

    if (allImages.length === 0) {
      console.log("[v0] No images found via scraping, attempting AI image generation...")
      if (productName) {
        return await generateProductImageWithAI(productName)
      }
      return NextResponse.json({
        imageUrl: null,
        error: "Could not extract product image automatically. Please copy the image URL from the product page.",
      })
    }

    // Return the first (most likely) product image
    const selectedImage = allImages[0]
    console.log("[v0] ✅ Selected product image:", selectedImage)

    return NextResponse.json({
      imageUrl: selectedImage,
      extractedBy: "javascript-parsing",
      confidence: "high",
      totalImagesFound: allImages.length,
    })
  } catch (error) {
    console.error("[v0] Error in image extraction:", error)
    return NextResponse.json(
      {
        error: "Failed to extract product image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function extractFromJavaScriptVariables(html: string, productUrl: string): Promise<string[]> {
  const images: string[] = []

  // Pattern 1: Look for common JavaScript variable patterns
  const jsPatterns = [
    // DSW and many e-commerce sites use these patterns
    /(?:window\.__INITIAL_STATE__|__PRELOADED_STATE__|productData|pageData|dataLayer)\s*=\s*({[\s\S]{1,50000}?});/gi,
    // React/Next.js hydration data
    /__NEXT_DATA__\s*=\s*({[\s\S]{1,50000}?})<\/script>/gi,
    // Generic product data
    /var\s+(?:product|item|productInfo|productData)\s*=\s*({[\s\S]{1,10000}?});/gi,
  ]

  for (const pattern of jsPatterns) {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      try {
        const jsonStr = match[1]
        const data = JSON.parse(jsonStr)

        // Recursively search for image URLs
        const foundImages = findImageUrls(data, productUrl)
        images.push(...foundImages)

        if (foundImages.length > 0) {
          console.log(`[v0] Found ${foundImages.length} images in JavaScript variable`)
        }
      } catch (e) {
        // Skip invalid JSON
        continue
      }
    }
  }

  // Pattern 2: Look for direct image URL strings in scripts
  const scriptBlocks = html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)
  for (const block of scriptBlocks) {
    const scriptContent = block[1]

    // Find image URLs in the script content
    const urlPattern = /https?:\/\/[^\s"']+?\.(jpg|jpeg|png|webp)(?:[^\s"']*)?/gi
    const urlMatches = scriptContent.matchAll(urlPattern)

    for (const urlMatch of urlMatches) {
      const url = urlMatch[0]
      // Filter out tiny thumbnails and UI elements
      if (
        !url.includes("sprite") &&
        !url.includes("icon") &&
        !url.includes("logo") &&
        !url.includes("_40x40") &&
        !url.includes("_50x50") &&
        !url.includes("thumbnail") &&
        url.length > 30
      ) {
        images.push(url)
      }
    }
  }

  return Array.from(new Set(images))
}

function findImageUrls(obj: any, baseUrl: string, depth = 0): string[] {
  if (depth > 10) return [] // Prevent infinite recursion

  const images: string[] = []

  if (typeof obj === "string") {
    // Check if it's an image URL
    if (obj.match(/https?:\/\/[^\s"']+\.(jpg|jpeg|png|webp)/i)) {
      images.push(obj)
    }
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      images.push(...findImageUrls(item, baseUrl, depth + 1))
    }
  } else if (typeof obj === "object" && obj !== null) {
    // Check for common image property names
    const imageKeys = [
      "image",
      "images",
      "img",
      "photo",
      "photos",
      "picture",
      "pictures",
      "src",
      "url",
      "imageUrl",
      "imageURL",
      "thumbnail",
      "media",
    ]

    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase()

      // Prioritize keys that likely contain product images
      if (imageKeys.some((k) => lowerKey.includes(k))) {
        const value = obj[key]

        if (typeof value === "string" && value.match(/https?:\/\/[^\s"']+\.(jpg|jpeg|png|webp)/i)) {
          images.push(value)
        } else if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === "string" && item.match(/https?:\/\/[^\s"']+\.(jpg|jpeg|png|webp)/i)) {
              images.push(item)
            } else if (typeof item === "object" && item !== null) {
              images.push(...findImageUrls(item, baseUrl, depth + 1))
            }
          }
        } else if (typeof value === "object" && value !== null) {
          images.push(...findImageUrls(value, baseUrl, depth + 1))
        }
      } else {
        // Still search nested objects even if key doesn't match
        images.push(...findImageUrls(obj[key], baseUrl, depth + 1))
      }
    }
  }

  return images
}

async function extractFromJsonLD(html: string): Promise<string[]> {
  const images: string[] = []

  const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)

  for (const match of jsonLdMatches) {
    try {
      const jsonData = JSON.parse(match[1])

      if (jsonData["@type"] === "Product" || jsonData["@type"]?.includes("Product")) {
        const imageUrl = jsonData.image || jsonData.image?.[0] || jsonData.image?.url
        if (imageUrl && typeof imageUrl === "string" && imageUrl.startsWith("http")) {
          images.push(imageUrl)
          console.log("[v0] Found image in JSON-LD:", imageUrl.substring(0, 60))
        }
      }
    } catch (e) {
      continue
    }
  }

  return images
}

async function extractFromMetaTags(html: string): Promise<string[]> {
  const images: string[] = []

  // Open Graph image
  const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
  if (ogMatch && ogMatch[1]) {
    images.push(ogMatch[1])
    console.log("[v0] Found OG image:", ogMatch[1].substring(0, 60))
  }

  // Twitter image
  const twitterMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
  if (twitterMatch && twitterMatch[1]) {
    images.push(twitterMatch[1])
    console.log("[v0] Found Twitter image:", twitterMatch[1].substring(0, 60))
  }

  return images
}

async function extractFromHTMLAttributes(html: string, productUrl: string): Promise<string[]> {
  const images: string[] = []

  // Look for data attributes commonly used for product images
  const dataPatterns = [
    /data-zoom-image=["']([^"']+)["']/gi,
    /data-large-image=["']([^"']+)["']/gi,
    /data-full-size-image=["']([^"']+)["']/gi,
    /data-src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi,
  ]

  for (const pattern of dataPatterns) {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      if (match[1] && match[1].startsWith("http")) {
        images.push(match[1])
      }
    }
  }

  return images
}

// DSW image URL construction function
function constructDSWImageUrl(productUrl: string): string | null {
  try {
    const url = new URL(productUrl)

    // Extract product ID from path: /product/naturalizer-ginger-pump/557283
    const pathParts = url.pathname.split("/")
    const productId = pathParts[pathParts.length - 1]

    // Extract color code from query parameter: ?activeColor=600
    const colorCode = url.searchParams.get("activeColor")

    if (productId && colorCode) {
      // DSW image URL pattern: https://images.dsw.com/is/image/DSWShoes/{PRODUCT_ID}_{COLOR_CODE}_ss_01
      const imageUrl = `https://images.dsw.com/is/image/DSWShoes/${productId}_${colorCode}_ss_01?impolicy=qlt-medium-high&imwidth=640&imdensity=2`
      return imageUrl
    }

    return null
  } catch (error) {
    console.log("[v0] Failed to construct DSW image URL:", error)
    return null
  }
}

async function generateProductImageWithAI(productName: string): Promise<NextResponse> {
  try {
    console.log("[v0] Generating product image with AI for:", productName)

    const FAL_KEY = process.env.FAL_KEY
    if (!FAL_KEY) {
      console.log("[v0] FAL_KEY not configured, cannot generate image")
      return NextResponse.json({
        imageUrl: null,
        error: "Image generation not available",
      })
    }

    fal.config({
      credentials: FAL_KEY,
    })

    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: `Professional product photography of ${productName}, studio lighting, white background, high quality, commercial product shot, 4k, detailed, centered composition`,
        image_size: "square",
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: false,
      },
      logs: true,
    })

    const imageUrl = result.images?.[0]?.url

    if (imageUrl) {
      console.log("[v0] ✅ AI generated product image:", imageUrl)
      return NextResponse.json({
        imageUrl,
        extractedBy: "ai-generation",
        confidence: "medium",
        totalImagesFound: 1,
      })
    }

    return NextResponse.json({
      imageUrl: null,
      error: "Could not generate product image",
    })
  } catch (error) {
    console.error("[v0] AI image generation failed:", error)
    return NextResponse.json({
      imageUrl: null,
      error: "Image generation failed",
    })
  }
}
