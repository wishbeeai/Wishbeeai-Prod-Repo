import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { giftIdea } = await request.json()

    if (!giftIdea) {
      return NextResponse.json({ error: "Gift idea is required" }, { status: 400 })
    }

    console.log("[v0] Extracting product from gift idea:", giftIdea)

    // Use AI to convert gift idea into product details
    const prompt = `You are a product research assistant. A user wants: "${giftIdea}"

Based on this gift idea, research and provide detailed product information. Return ONLY a JSON object:

{
  "productName": "specific best-selling product name that matches (e.g., 'Nike Air Max 270 Running Shoes' for 'nike shoe')",
  "price": competitive market price in USD (numeric value),
  "description": "Detailed product description with key features and specifications (4-6 sentences)",
  "storeName": "popular retailer (Amazon, Nike.com, Target, Best Buy, etc.)",
  "imageUrl": null,
  "productLink": null,
  "stockStatus": "In Stock",
  "attributes": {
    "color": "popular color option",
    "size": "common size range if applicable",
    "material": "material composition if applicable",
    "brand": "specific brand name",
    "weight": "typical weight if applicable",
    "dimensions": "typical dimensions if applicable",
    "other": "key differentiating features"
  }
}

Research the best-selling, highest-rated product in this category at competitive pricing.
Return ONLY valid JSON, no markdown, no explanation.`

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      maxTokens: 1500,
    })

    console.log("[v0] AI gift idea response:", text)

    // Clean and parse JSON
    let cleanedText = text.trim()
    cleanedText = cleanedText.replace(/```json\n?/g, "").replace(/```\n?/g, "")

    const jsonStart = cleanedText.indexOf("{")
    const jsonEnd = cleanedText.lastIndexOf("}")

    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanedText = cleanedText.slice(jsonStart, jsonEnd + 1)
    }

    const productData = JSON.parse(cleanedText)

    // Add notice that this is AI-generated from gift idea
    productData.notice =
      "Product details generated from your gift idea. You can refine by pasting a specific product URL."
    productData.isFromGiftIdea = true

    console.log("[v0] Generated product from gift idea:", productData)

    return NextResponse.json(productData)
  } catch (error) {
    console.error("[v0] Error extracting gift idea:", error)
    return NextResponse.json(
      {
        error: "Failed to generate product from gift idea",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
