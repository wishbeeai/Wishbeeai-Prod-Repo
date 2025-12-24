import { generateText } from "ai"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { groupMembers, currentDate } = await req.json()

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `Detect upcoming gift-worthy occasions for group members.

Current Date: ${currentDate}
Group Members: ${JSON.stringify(groupMembers, null, 2)}

Generate a JSON response with:
{
  "upcomingOccasions": [
    {
      "memberName": "string",
      "occasion": "string",
      "date": "YYYY-MM-DD",
      "daysUntil": number,
      "suggestedGiftIdea": "string",
      "recommendedBudget": number,
      "priority": "high" | "medium" | "low"
    }
  ]
}

Consider birthdays, work anniversaries, life milestones, and holidays. Prioritize occasions within the next 60 days.

IMPORTANT: Respond ONLY with valid JSON, no other text.`,
      maxTokens: 1000,
    })

    let cleanedText = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim()

    // Find the first { and last } to extract only the JSON object
    const firstBrace = cleanedText.indexOf("{")
    const lastBrace = cleanedText.lastIndexOf("}")

    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanedText = cleanedText.substring(firstBrace, lastBrace + 1)
    }

    const occasions = JSON.parse(cleanedText)
    return NextResponse.json(occasions)
  } catch (error) {
    console.error("Error detecting occasions:", error)
    return NextResponse.json({ error: "Failed to detect occasions" }, { status: 500 })
  }
}
