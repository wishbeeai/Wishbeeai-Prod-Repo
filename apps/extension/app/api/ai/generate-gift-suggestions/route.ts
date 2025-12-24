import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { recipientName, occasion, giftName, currentDescription, targetAmount } = await req.json()

    if (!recipientName || !occasion) {
      return Response.json({ error: "Recipient name and occasion are required" }, { status: 400 })
    }

    const prompt = `Generate smart suggestions for a group gift collection. Return a JSON object with this exact structure:

{
  "title": "A compelling gift collection title",
  "description": "An engaging description to encourage contributions (2-3 sentences)",
  "targetAmount": 500,
  "amountRange": {
    "minimum": 200,
    "recommended": 500,
    "optimal": 800
  },
  "deadline": "2024-12-31",
  "contributorEstimate": 10,
  "giftIdeas": [
    {
      "name": "Gift name",
      "price": 150,
      "description": "Brief description"
    }
  ]
}

Details:
- Recipient: ${recipientName}
- Occasion: ${occasion}
${giftName ? `- Gift Name: ${giftName}` : ""}
${currentDescription ? `- Current Description: ${currentDescription}` : ""}
${targetAmount ? `- Current Target: $${targetAmount}` : ""}

Provide 3-5 specific gift ideas that match the budget and occasion. Return ONLY the JSON object, no markdown formatting.`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
      temperature: 0.7,
    })

    let cleanedText = text.trim()
    // Remove markdown code fences if present
    cleanedText = cleanedText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/\s*```$/g, "")

    const suggestions = JSON.parse(cleanedText)

    return Response.json(suggestions)
  } catch (error) {
    console.error("[v0] Error generating gift suggestions:", error)
    return Response.json({ error: "Failed to generate gift suggestions" }, { status: 500 })
  }
}
