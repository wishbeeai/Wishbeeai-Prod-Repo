import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const { wishlistItems } = await request.json()

    if (!wishlistItems || wishlistItems.length === 0) {
      return NextResponse.json({ error: "No wishlist items provided" }, { status: 400 })
    }

    // Calculate total value
    const totalValue = wishlistItems.reduce((sum: number, item: any) => {
      return sum + item.currentPrice * item.quantity
    }, 0)

    // Prepare wishlist summary for AI
    const wishlistSummary = wishlistItems.map((item: any) => ({
      name: item.giftName,
      price: item.currentPrice,
      quantity: item.quantity,
      store: item.storeName,
      category: item.attributes?.brand || "General",
    }))

    // Generate AI insights
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `You are a shopping and savings advisor. Analyze this wishlist and provide insights.

Wishlist Items:
${JSON.stringify(wishlistSummary, null, 2)}

Total Value: $${totalValue.toFixed(2)}

Provide a JSON response with:
1. priorityRecommendation: Which item to buy first and why (one short sentence)
2. savingsOpportunity: Estimated potential savings in dollars if user waits for sales
3. bestTimeToBuy: Best time period to purchase (e.g., "Holiday sales in 2 weeks", "End of season", "Black Friday")

Return ONLY valid JSON with these exact keys: priorityRecommendation, savingsOpportunity, bestTimeToBuy`,
      maxTokens: 500,
    })

    // Parse AI response
    const cleanText = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim()
    const aiAnalysis = JSON.parse(cleanText)

    const insights = {
      totalValue,
      priorityRecommendation: aiAnalysis.priorityRecommendation || "Consider buying the highest priority item first",
      savingsOpportunity: Number.parseFloat(aiAnalysis.savingsOpportunity) || totalValue * 0.15,
      bestTimeToBy: aiAnalysis.bestTimeToBuy || "Upcoming holiday sales",
    }

    return NextResponse.json({ insights })
  } catch (error) {
    console.error("Error generating wishlist insights:", error)
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 })
  }
}
