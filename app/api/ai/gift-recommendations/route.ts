import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(req: Request) {
  try {
    const { query } = await req.json()

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `You are a gift recommendation expert. Based on this search query: "${query}", 
      suggest 3-5 gift categories or specific gift ideas that would be perfect. 
      Keep it concise and friendly. Format as a short paragraph.`,
      maxOutputTokens: 200,
    })

    return Response.json({
      success: true,
      recommendations: text,
    })
  } catch (error) {
    console.error("[v0] Error generating gift recommendations:", error)
    return Response.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}
