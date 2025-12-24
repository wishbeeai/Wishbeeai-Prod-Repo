import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { z } from "zod"
import * as fal from "@fal-ai/serverless-client"

fal.config({
  credentials: process.env.FAL_KEY,
})

const TRUSTED_STORES = [
  { name: "Amazon", domain: "amazon.com", searchUrl: "https://www.amazon.com/s?k=" },
  { name: "Walmart", domain: "walmart.com", searchUrl: "https://www.walmart.com/search?q=" },
  { name: "Target", domain: "target.com", searchUrl: "https://www.target.com/s?searchTerm=" },
  { name: "Best Buy", domain: "bestbuy.com", searchUrl: "https://www.bestbuy.com/site/searchpage.jsp?st=" },
  { name: "Home Depot", domain: "homedepot.com", searchUrl: "https://www.homedepot.com/s/" },
  { name: "Nike", domain: "nike.com", searchUrl: "https://www.nike.com/w?q=" },
  { name: "Nordstrom", domain: "nordstrom.com", searchUrl: "https://www.nordstrom.com/sr?keyword=" },
  { name: "Macy's", domain: "macys.com", searchUrl: "https://www.macys.com/shop/search?keyword=" },
]

export async function POST(request: NextRequest) {
  try {
    const { productName, currentPrice, currentStore, description, brand, category, color, size } = await request.json()

    console.log("[v0] Comparing prices for:", productName, "at $", currentPrice, "from", currentStore)

    if (!productName || typeof productName !== "string") {
      console.error("[v0] Invalid productName:", productName)
      return NextResponse.json(
        {
          alternatives: [],
          note: "Unable to compare prices - invalid product name",
        },
        { status: 200 },
      )
    }

    if (!brand && !color && !size) {
      console.log("[v0] Insufficient product details for exact matching - skipping price comparison")
      return NextResponse.json({
        alternatives: [],
        note: "Exact price comparison not available - missing specific product details (brand, color, or size). Please verify product details on the original store website.",
      })
    }

    const productSchema = z.object({
      alternatives: z.array(
        z.object({
          productName: z.string(),
          storeName: z.string(),
          price: z.number(),
          description: z.string(),
          productUrl: z.string(),
          imageUrl: z.string(),
          stockStatus: z.enum(["In Stock", "Low Stock", "Out of Stock"]),
          color: z.string().nullable(),
          size: z.string().nullable(),
          brand: z.string().nullable(),
          category: z.string(),
          savings: z.number().nullable(),
          trustScore: z.number().min(1).max(10),
          matchConfidence: z.enum(["Exact Match", "Likely Match", "Uncertain"]),
        }),
      ),
      note: z.string(),
    })

    const { object: priceComparison } = await generateObject({
      model: "openai/gpt-4o-mini",
      schema: productSchema,
      prompt: `You are a price comparison expert. Your task is to find the EXACT SAME product at other retailers with IDENTICAL specifications.

PRODUCT DETAILS:
- Product Name: ${productName}
- Brand: ${brand || "Unknown"}
- Color: ${color || "Unknown"}
- Size: ${size || "Unknown"}
- Current Price: $${currentPrice || "Unknown"}
- Current Store: ${currentStore}
- Description: ${description || "Not provided"}
- Category: ${category || "General"}

ABSOLUTE REQUIREMENTS FOR EXACT MATCH:
1. IDENTICAL BRAND - MUST be "${brand || "extracted brand"}" (no substitutes, no alternatives)
2. IDENTICAL MODEL - MUST be "${productName}" (exact product line/model)
3. IDENTICAL COLOR - MUST be "${color || "extracted color"}" (no "similar" colors, must be exact)
4. IDENTICAL SIZE - MUST be "${size || "extracted size"}" if size was specified
5. ONLY include results where you are 100% confident the product is IDENTICAL

TRUSTED RETAILERS TO CHECK:
${TRUSTED_STORES.filter((s) => s.name !== currentStore)
  .map((s) => s.name)
  .join(", ")}

CRITICAL INSTRUCTIONS:
- If you cannot find the EXACT product with EXACT specifications at another store, return an EMPTY array
- Do NOT include "similar" products or "alternatives" - only IDENTICAL products
- If any key attribute (brand, color, size) doesn't match EXACTLY, exclude it
- Set matchConfidence to "Exact Match" ONLY if all attributes match perfectly
- If uncertain about any detail, use matchConfidence "Uncertain" or exclude the result
- Return realistic market prices based on the actual product
- Exclude ${currentStore} from results

BE CONSERVATIVE: It's better to return NO results than to show products that aren't identical.
Only return 1-3 alternatives maximum, and ONLY if you're highly confident they're the exact same product.`,
      maxTokens: 2500,
    })

    console.log("[v0] Price comparison found:", priceComparison.alternatives.length, "alternatives")

    const exactMatches = priceComparison.alternatives.filter(
      (alt) =>
        alt.matchConfidence === "Exact Match" &&
        (brand ? alt.brand?.toLowerCase() === brand.toLowerCase() : true) &&
        (color ? alt.color?.toLowerCase() === color.toLowerCase() : true) &&
        (size ? alt.size?.toLowerCase() === size.toLowerCase() : true),
    )

    console.log("[v0] Filtered to", exactMatches.length, "exact matches")

    if (exactMatches.length === 0) {
      return NextResponse.json({
        alternatives: [],
        note: "No exact matches found at other stores. This product may be exclusive to the original retailer, or specific details (color/size) may not be available elsewhere.",
      })
    }

    const enrichedAlternatives = await Promise.all(
      exactMatches.map(async (alt) => {
        const store = TRUSTED_STORES.find((s) => s.name.toLowerCase() === alt.storeName.toLowerCase())

        const searchTerms = [alt.brand || brand, productName, alt.color || color, alt.size || size]
          .filter(Boolean)
          .join(" ")

        const searchUrl = store
          ? `${store.searchUrl}${encodeURIComponent(searchTerms)}`
          : `https://www.google.com/search?q=${encodeURIComponent(searchTerms + " " + alt.storeName)}`

        let imageUrl = alt.imageUrl
        try {
          console.log("[v0] Generating product image for:", alt.productName)
          const result = (await fal.subscribe("fal-ai/flux/schnell", {
            input: {
              prompt: `Professional product photography of ${productName}. Studio lighting, white background, high detail, commercial quality, centered composition. Product should be clearly visible and well-lit. ${alt.color ? `Color: ${alt.color}.` : ""} ${alt.brand ? `Brand: ${alt.brand}.` : ""}`,
              image_size: "square",
              num_inference_steps: 4,
              num_images: 1,
              enable_safety_checker: true,
            },
          })) as { images: Array<{ url: string }> }

          if (result.images?.[0]?.url) {
            imageUrl = result.images[0].url
            console.log("[v0] Generated image for", alt.storeName)
          }
        } catch (error) {
          console.error("[v0] Failed to generate image:", error)
        }

        return {
          ...alt,
          productUrl: searchUrl,
          imageUrl: imageUrl,
        }
      }),
    )

    return NextResponse.json({
      alternatives: enrichedAlternatives,
      note:
        priceComparison.note ||
        "These are potential matches - please verify product details on store websites before purchasing.",
    })
  } catch (error) {
    console.error("[v0] Price comparison error:", error)
    return NextResponse.json(
      {
        alternatives: [],
        note: "Unable to compare prices at this time. Please search for the product manually at other retailers.",
      },
      { status: 200 },
    )
  }
}
