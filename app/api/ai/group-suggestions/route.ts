import { generateText } from "ai"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { groupType, relationships, purpose } = await req.json()

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `Generate creative group name suggestions for a gifting group.
      
Context:
- Group Type: ${groupType || "general"}
- Relationships: ${relationships || "friends and family"}
- Purpose: ${purpose || "collective gift giving"}

Generate a JSON response with the following structure:
{
  "groupNames": ["name1", "name2", "name3", "name4", "name5"],
  "description": "An engaging 2-3 sentence description for this group",
  "suggestedMembers": ["Person type 1", "Person type 2", "Person type 3"]
}

Make the names creative, memorable, and appropriate for the context.`,
      maxTokens: 500,
    })

    const suggestions = JSON.parse(text)
    return NextResponse.json(suggestions)
  } catch (error) {
    console.error("Error generating group suggestions:", error)
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 })
  }
}
