import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { giftName, category } = await req.json()

    const { text } = await generateText({
      model: "openai/gpt-5-mini",
      prompt: `You are a gift shopping expert. For this gift: "${giftName}" in the ${category} category, 
      provide one quick insight about why it's a great gift, best time to buy, or a helpful tip. 
      Keep it to 1-2 sentences, friendly and conversational.`,
      maxOutputTokens: 100,
    })

    return Response.json({
      success: true,
      insight: text,
    })
  } catch (error) {
    console.error("[v0] Error generating gift insight:", error)
    return Response.json({ error: "Failed to generate insight" }, { status: 500 })
  }
}
