import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { groupData } = await req.json()

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `Analyze this gifting group and provide comprehensive insights.

Group Data:
${JSON.stringify(groupData, null, 2)}

Generate a JSON response with:
{
  "healthScore": number (0-100),
  "activityLevel": "high" | "medium" | "low",
  "insights": ["insight1", "insight2", "insight3"],
  "recommendations": ["recommendation1", "recommendation2"],
  "topContributors": [{"name": "string", "amount": number}],
  "engagementTrend": "increasing" | "stable" | "decreasing",
  "predictedSuccess": number (0-100)
}

Provide actionable insights based on member activity, contribution patterns, and gift success rates.
IMPORTANT: Return ONLY the JSON object, no additional text or explanation.`,
      maxTokens: 800,
    })

    let cleanedText = text.trim()

    // Remove markdown code fences if present
    cleanedText = cleanedText.replace(/```json\s*/g, "").replace(/```\s*/g, "")

    // Extract JSON object by finding the first { and last }
    const firstBrace = cleanedText.indexOf("{")
    const lastBrace = cleanedText.lastIndexOf("}")

    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanedText = cleanedText.substring(firstBrace, lastBrace + 1)
    }

    const insights = JSON.parse(cleanedText)
    return NextResponse.json(insights)
  } catch (error) {
    console.error("Error generating group insights:", error)
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 })
  }
}
