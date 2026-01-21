import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: Request) {
  try {
    const { productName, description, category } = await request.json()

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `You are a product classification and attribute expert. Analyze this product and determine the most important attributes a buyer needs to make an informed purchase decision.

Product Name: ${productName}
Description: ${description}
Category Hint: ${category || "Unknown"}

Based on the product type, identify the category and list ONLY the most critical attributes needed to buy the correct item:

For ELECTRONICS (headphones, phones, laptops, cameras, etc.):
- Color, Brand, Battery Life, Connectivity (Bluetooth/Wireless), Warranty, Compatibility, Memory/Storage

For CLOTHING/SHOES (shirts, pants, dresses, shoes, etc.):
- Color, Size, Material, Brand, Fit Type, Care Instructions, Style

For HOME GOODS (furniture, kitchenware, decor):
- Dimensions, Material, Color, Brand, Weight Capacity, Assembly Required

For BEAUTY/COSMETICS:
- Shade/Color, Size/Volume, Brand, Skin Type, Ingredients, Expiration

Return a JSON object with:
{
  "category": "Electronics|Clothing|Home|Beauty|Other",
  "importantAttributes": ["attribute1", "attribute2", ...],
  "reasoning": "Brief explanation of why these attributes matter"
}

Be specific and focused - only include attributes that would prevent buying the wrong item.`,
    })

    const result = JSON.parse(text)

    return NextResponse.json({
      category: result.category,
      importantAttributes: result.importantAttributes,
      reasoning: result.reasoning,
    })
  } catch (error) {
    console.error("Error extracting product attributes:", error)
    return NextResponse.json({ error: "Failed to extract product attributes" }, { status: 500 })
  }
}
