import { NextResponse } from "next/server"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

const ProductSchema = z.object({
  productName: z.string(),
  storeName: z.string(),
  price: z.number(),
  description: z.string(),
  color: z.string().optional(),
  size: z.string().optional(),
  stockStatus: z.string(),
})

const ProductsResponseSchema = z.object({
  products: z.array(ProductSchema),
})

const TRUSTED_STORES = [
  "amazon.com",
  "walmart.com",
  "target.com",
  "bestbuy.com",
  "nike.com",
  "adidas.com",
  "ebay.com",
  "etsy.com",
  "macys.com",
  "nordstrom.com",
  "zappos.com",
  "costco.com",
  "homedepot.com",
  "lowes.com",
  "sephora.com",
  "ulta.com",
]

export async function POST(request: Request) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    console.log("[v0] Searching for products:", query)

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: ProductsResponseSchema,
      prompt: `You are a shopping assistant helping users find real, currently available products from trusted retailers.

User is searching for: "${query}"

Generate EXACTLY 5 realistic product recommendations based on REAL products that exist in the market today:

CRITICAL REQUIREMENTS:
1. Use REAL brand names and specific model names/numbers (e.g., "Nike Air Max 270", "KitchenAid Artisan Stand Mixer", "Apple AirPods Pro 2nd Gen")
2. Match ALL keywords from the query: "${query}"
3. If a COLOR is specified, ALL products must be that exact color (include color in product name)
4. If a MATERIAL is specified, ALL products must use that material
5. Prices must be realistic current market prices
6. Include variety across different brands and price points

EXAMPLES of REAL vs GENERIC:
✅ GOOD: "Sony WH-1000XM5 Noise Cancelling Headphones"
❌ BAD: "Wireless Headphones"

✅ GOOD: "Nespresso Vertuo Next Coffee Maker by Breville"  
❌ BAD: "Coffee Machine"

✅ GOOD: "Nike Air Zoom Pegasus 40 Running Shoes - Red"
❌ BAD: "Red Running Shoes"

Use ONLY these trusted stores: ${TRUSTED_STORES.join(", ")}.

For each product provide:
- Product name with specific brand and model
- Realistic store (from trusted list)
- Current market price (realistic USD amount)
- Brief feature description
- Color (if specified in query)
- Size (if specified in query)
- Stock status: "In Stock"

You MUST provide exactly 5 products with different brands/models.`,
      temperature: 0.7,
    })

    console.log("[v0] AI response received with", object.products.length, "products")

    const products = object.products
      .filter((product) => {
        const domain = product.storeName.toLowerCase().replace(/\s+/g, "")
        return TRUSTED_STORES.some((store) => domain.includes(store.replace(".com", "")))
      })
      .map((product) => {
        const searchTerm = encodeURIComponent(product.productName)
        const storeLower = product.storeName.toLowerCase()

        let productUrl = ""

        if (storeLower.includes("amazon")) {
          productUrl = `https://www.amazon.com/s?k=${searchTerm.replace(/%20/g, "+")}`
        } else if (storeLower.includes("walmart")) {
          productUrl = `https://www.walmart.com/search?q=${searchTerm}`
        } else if (storeLower.includes("target")) {
          productUrl = `https://www.target.com/s?searchTerm=${searchTerm}`
        } else if (storeLower.includes("nike")) {
          productUrl = `https://www.nike.com/w?q=${searchTerm}`
        } else if (storeLower.includes("adidas")) {
          productUrl = `https://www.adidas.com/us/search?q=${searchTerm}`
        } else if (storeLower.includes("bestbuy") || storeLower.includes("best buy")) {
          productUrl = `https://www.bestbuy.com/site/searchpage.jsp?st=${searchTerm}`
        } else if (storeLower.includes("macy")) {
          productUrl = `https://www.macys.com/shop/featured/${searchTerm.replace(/%20/g, "-")}`
        } else if (storeLower.includes("nordstrom")) {
          productUrl = `https://www.nordstrom.com/sr?keyword=${searchTerm}`
        } else if (storeLower.includes("zappos")) {
          productUrl = `https://www.zappos.com/search?term=${searchTerm}`
        } else if (storeLower.includes("ebay")) {
          productUrl = `https://www.ebay.com/sch/i.html?_nkw=${searchTerm.replace(/%20/g, "+")}`
        } else if (storeLower.includes("etsy")) {
          productUrl = `https://www.etsy.com/search?q=${searchTerm}`
        } else if (storeLower.includes("costco")) {
          productUrl = `https://www.costco.com/CatalogSearch?keyword=${searchTerm}`
        } else if (storeLower.includes("homedepot") || storeLower.includes("home depot")) {
          productUrl = `https://www.homedepot.com/s/${searchTerm}`
        } else if (storeLower.includes("lowes")) {
          productUrl = `https://www.lowes.com/search?searchTerm=${searchTerm}`
        } else if (storeLower.includes("sephora")) {
          productUrl = `https://www.sephora.com/search?keyword=${searchTerm}`
        } else if (storeLower.includes("ulta")) {
          productUrl = `https://www.ulta.com/search?query=${searchTerm}`
        } else {
          productUrl = `https://www.${storeLower.replace(/\s+/g, "")}.com/search?q=${searchTerm}`
        }

        console.log(`[v0] Generated URL for ${product.productName} at ${product.storeName}: ${productUrl}`)

        return {
          ...product,
          productUrl,
          imageUrl: "/placeholder.svg?height=400&width=400",
        }
      })

    console.log("[v0] Generating images for", products.length, "products")

    const productsWithImages = await Promise.all(
      products.map(async (product, index) => {
        try {
          console.log(`[v0] Generating image ${index + 1}/${products.length} for:`, product.productName)

          const colorInfo = product.color ? `, ${product.color} color` : ""

          const prompt = `Create a professional, high-quality product photo of: ${product.productName}${colorInfo}. ${product.description}

IMPORTANT: If the product is described as a specific color (e.g., red, blue, black), the product in the image MUST be that exact color.

Style: Clean, modern product photography with white or neutral background, studio lighting, showing the product clearly and attractively. Photorealistic, commercial quality. The product must match the exact color specified.`

          const falResponse = await fetch("https://fal.run/fal-ai/flux/schnell", {
            method: "POST",
            headers: {
              Authorization: `Key ${process.env.FAL_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt,
              image_size: "square",
              num_inference_steps: 4,
              num_images: 1,
            }),
          })

          if (falResponse.ok) {
            const falData = await falResponse.json()
            if (falData.images && falData.images.length > 0) {
              const imageUrl = falData.images[0].url
              console.log(`[v0] Image generated successfully for ${product.productName}:`, imageUrl)
              return {
                ...product,
                imageUrl,
              }
            }
          }
        } catch (error) {
          console.error("[v0] Image generation error for:", product.productName, error)
        }
        return product
      }),
    )

    console.log("[v0] Found", productsWithImages.length, "products from trusted stores")

    return NextResponse.json({
      query,
      products: productsWithImages,
      trustedStoresCount: productsWithImages.length,
    })
  } catch (error: any) {
    console.error("[v0] Product search error:", error)
    return NextResponse.json({ error: error.message || "Failed to search products" }, { status: 500 })
  }
}
