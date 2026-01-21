import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { collectionTitle, occasion, recipientName, deadline, customText } = await req.json()

    if (!collectionTitle) {
      return Response.json({ error: "Collection title is required" }, { status: 400 })
    }

    const customTextInstruction = customText 
      ? `- Incorporate this phrase or sentiment: "${customText}"`
      : ''

    const prompt = `Generate a warm, inviting message for a group gift contribution page.

Details:
- Gift/Event: "${collectionTitle}"
- Occasion: ${occasion || 'Special celebration'}
- Recipient: ${recipientName || 'the recipient'}
${customTextInstruction}

Requirements:
- Keep it short (2-3 sentences max)
- Use warm, friendly tone
- Include 1-2 relevant emojis
- Make it feel personal and heartfelt
- End with an encouraging call to contribute
- Do NOT include any placeholders or brackets
- Do NOT include greeting like "Dear friends"
- Do NOT mention specific dates or deadlines (the deadline will be shown separately)
- Start directly with the invitation

Return ONLY the message text, nothing else.`

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    })

    const text = message.content[0].type === "text" ? message.content[0].text : ""

    return Response.json({ 
      success: true,
      message: text.trim() 
    })
  } catch (error) {
    console.error("[AI Generate Invitation] Error:", error)
    
    // Return fallback message without deadline (shown separately)
    const fallbackMessage = `You're warmly invited to celebrate this special occasion! 🎉 Join us in making this gift unforgettable. Your contribution means the world! ❤️`
    
    return Response.json({ 
      success: true,
      message: fallbackMessage
    })
  }
}
