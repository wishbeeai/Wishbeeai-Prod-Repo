import { generateText } from "ai"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { groupData, giftDetails } = await req.json()

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `Predict contribution patterns for a group gift.

Group Data: ${JSON.stringify(groupData, null, 2)}
Gift Details: ${JSON.stringify(giftDetails, null, 2)}

Generate a JSON response with:
{
  "participationRate": number (0-100),
  "averageContribution": number,
  "timeToGoal": number (days),
  "memberPredictions": [
    {
      "memberName": "string",
      "likelihood": number (0-100),
      "estimatedAmount": number,
      "responseTime": "fast" | "medium" | "slow"
    }
  ],
  "successProbability": number (0-100),
  "recommendations": ["recommendation1", "recommendation2"]
}

Base predictions on historical patterns, group size, and gift type.`,
      maxTokens: 1000,
    })

    const predictions = JSON.parse(text)
    return NextResponse.json(predictions)
  } catch (error) {
    console.error("Error predicting contributions:", error)
    return NextResponse.json({ error: "Failed to predict contributions" }, { status: 500 })
  }
}
