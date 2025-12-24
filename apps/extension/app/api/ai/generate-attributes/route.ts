import { NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { productName, category, description } = await req.json()

    if (!productName) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 })
    }

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `You are a product attribute expert. Generate relevant product attributes for the following product.

Product Name: ${productName}
Category: ${category || "General"}
Description: ${description || "No description provided"}

Based on the category, generate appropriate attributes. For example:
- Electronics: Color, Brand, Battery Life, Connectivity, Warranty, Compatibility
- Clothing: Color, Size, Material, Brand, Fit Type, Style, Care Instructions
- Home & Kitchen: Color, Material, Dimensions, Brand, Warranty, Care Instructions
- Beauty: Brand, Volume/Weight, Ingredients, Skin Type, Scent, SPF

Return ONLY a valid JSON object with attribute key-value pairs. Example format:
{
  "Color": "Black",
  "Brand": "TechPro",
  "Battery Life": "30 hours",
  "Connectivity": "Bluetooth 5.0"
}

Generate 5-8 relevant attributes for this product. Be specific and realistic.`,
      temperature: 0.7,
    })

    // Parse the AI response
    const cleanedText = text.trim().replace(/```json\n?|\n?```/g, "")
    const attributes = JSON.parse(cleanedText)

    return NextResponse.json({ attributes })
  } catch (error) {
    console.error("Error generating attributes:", error)
    return NextResponse.json(
      {
        error: "Failed to generate attributes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
