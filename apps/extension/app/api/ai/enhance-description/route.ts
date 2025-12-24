import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const {
      description,
      productName,
      currentDescription,
      price,
      recipientName,
      occasion,
      tone = "helpful",
    } = await req.json()

    // For wishlist product description enhancement
    if (productName && currentDescription !== undefined) {
      const prompt = `Enhance this product description for a wishlist item to make it more appealing and informative:

Product: ${productName}
Current Description: "${currentDescription || "No description provided"}"
Price: $${price || "N/A"}

Create a compelling, concise product description (100-150 words) that:
- Highlights key features and benefits
- Makes the product sound appealing
- Is helpful for potential gift-givers
- Uses engaging, friendly language

Enhanced Description:`

      const { text } = await generateText({
        model: "openai/gpt-4o-mini",
        prompt,
        maxTokens: 250,
        temperature: 0.7,
      })

      return Response.json({ enhancedDescription: text.trim() })
    }

    // For gift collection description enhancement (existing functionality)
    if (!description) {
      return Response.json({ error: "Description or product details required" }, { status: 400 })
    }

    const toneInstructions = {
      heartfelt: "warm, emotional, and sentimental",
      casual: "friendly, relaxed, and conversational",
      professional: "polished, formal, and respectful",
      funny: "humorous, lighthearted, and playful",
      helpful: "informative, clear, and friendly",
    }

    const prompt = `Enhance this gift description to be more ${toneInstructions[tone as keyof typeof toneInstructions]}:

Original: "${description}"

Context:
- Recipient: ${recipientName || "Gift recipient"}
- Occasion: ${occasion || "Special occasion"}

Requirements:
- Return ONLY the HTML content, no code fences or markdown formatting
- Use the following formatting techniques:
  * <p style="text-align: center; font-size: 18px; color: #DAA520; font-weight: bold;">Opening greeting or title</p> for centered, golden, bold headers
  * <p style="text-align: left; color: #333; line-height: 1.6;">Main content</p> for body paragraphs
  * <strong style="color: #DAA520;">text</strong> for golden bold emphasis
  * <em style="color: #8B5A3C;">text</em> for warm brown italics
  * <span style="color: #e11d48;">celebration text</span> for rose-colored highlights
  * Use appropriate text-align (center for greetings/closings, left for main content)
- Structure with 2-3 paragraphs separated by proper HTML paragraph tags
- Keep the total length between 150-250 words
- Include celebratory emojis where appropriate from this set: 🎉🎁😀❤️🎂🎈🎊✨🌟💝🏡🎓
- Use emojis naturally to add warmth and excitement
- Start with an engaging, centered opening with larger text
- Follow with left-aligned details about the gift or occasion
- End with a warm, possibly centered call-to-action
- DO NOT include placeholder text for dates, locations, or links
- DO NOT wrap the HTML in code fences or markdown formatting
- Return raw HTML only

Enhanced description:`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
      maxTokens: 300,
      temperature: 0.8,
    })

    return Response.json({ enhancedDescription: text })
  } catch (error) {
    console.error("[v0] Error enhancing description:", error)
    return Response.json({ error: "Failed to enhance description" }, { status: 500 })
  }
}
