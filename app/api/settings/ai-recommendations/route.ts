import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accountSettings, notificationSettings, privacySettings, securitySettings, aiPreferences } = body

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `You are a settings optimization assistant for Wishbee.ai, a group gifting platform.

Analyze the user's current settings and provide 3-5 personalized recommendations to improve their experience, security, or engagement.

Current Settings:
- Account: ${JSON.stringify(accountSettings)}
- Notifications: ${JSON.stringify(notificationSettings)}
- Privacy: ${JSON.stringify(privacySettings)}
- Security: ${JSON.stringify(securitySettings)}
- AI Preferences: ${JSON.stringify(aiPreferences)}

Provide recommendations in JSON format:
{
  "recommendations": [
    {
      "title": "Enable Two-Factor Authentication",
      "description": "Add an extra layer of security to your account",
      "priority": "high",
      "category": "security"
    }
  ]
}`,
    })

    console.log("[v0] Generated AI recommendations:", text)

    // Parse AI response
    let recommendations
    try {
      const parsed = JSON.parse(text)
      recommendations = parsed.recommendations || []
    } catch {
      // Fallback recommendations if AI parsing fails
      recommendations = [
        {
          title: "Enable Two-Factor Authentication",
          description: "Add an extra layer of security to your account",
          priority: "high",
          category: "security",
        },
        {
          title: "Turn on Weekly Digest",
          description: "Stay updated on group activities with a weekly summary",
          priority: "medium",
          category: "notifications",
        },
        {
          title: "Set Profile to Friends Only",
          description: "Balance privacy and connectivity with friends-only visibility",
          priority: "medium",
          category: "privacy",
        },
      ]
    }

    return NextResponse.json({
      success: true,
      recommendations,
    })
  } catch (error) {
    console.error("[v0] Error generating AI recommendations:", error)
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}
