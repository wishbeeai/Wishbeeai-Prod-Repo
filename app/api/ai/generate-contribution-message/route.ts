import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: Request) {
  try {
    const { giftName, recipientName, contributorName, contributionAmount, occasion } = await request.json()

    // Validate required fields
    if (!giftName || !recipientName || !contributorName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `Generate a warm, heartfelt contribution message for a group gift. 

Context:
- Contributor Name: ${contributorName}
- Recipient Name: ${recipientName}
- Gift Item: ${giftName}
- Contribution Amount: $${contributionAmount}
- Occasion: ${occasion}

Requirements:
- Keep it personal and genuine (2-3 sentences max)
- Express excitement about the gift
- Show care for the recipient
- Mention the contributor's name naturally
- Don't be too formal or cheesy
- Make it feel authentic and warm

Generate only the message text, no quotes or extra formatting.`,
      maxTokens: 150,
    })

    return NextResponse.json({ message: text.trim() })
  } catch (error) {
    console.error("Error generating contribution message:", error)
    return NextResponse.json({ error: "Failed to generate message" }, { status: 500 })
  }
}
