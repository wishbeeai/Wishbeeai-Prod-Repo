import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

const FALLBACK_RECOMMENDATIONS = [
  { title: "Enable Two-Factor Authentication", description: "Add an extra layer of security to your account", priority: "high", category: "security" },
  { title: "Turn on Weekly Digest", description: "Stay updated on group activities with a weekly summary", priority: "medium", category: "notifications" },
  { title: "Set Profile to Friends Only", description: "Balance privacy and connectivity with friends-only visibility", priority: "medium", category: "privacy" },
]

export async function POST(request: NextRequest) {
  let recommendations = FALLBACK_RECOMMENDATIONS
  let fromFallback = true

  try {
    const body = await request.json().catch(() => ({}))
    const accountSettings = body?.accountSettings ?? {}
    const notificationSettings = body?.notificationSettings ?? {}
    const privacySettings = body?.privacySettings ?? {}
    const securitySettings = body?.securitySettings ?? {}
    const aiPreferences = body?.aiPreferences ?? {}

    const hasOpenAIKey = !!process.env.OPENAI_API_KEY?.trim()
    if (!hasOpenAIKey) {
      console.warn("[ai-recommendations] OPENAI_API_KEY not set; returning fallback recommendations")
      return NextResponse.json({ success: true, recommendations, fromFallback: true })
    }

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `You are a settings optimization assistant for Wishbee.ai, a group gifting platform.

Analyze the user's current settings and provide 3-5 personalized recommendations to improve their experience, security, or engagement.

Current Settings:
- Account: ${JSON.stringify(accountSettings)}
- Notifications: ${JSON.stringify(notificationSettings)}
- Privacy: ${JSON.stringify(privacySettings)}
- Security: ${JSON.stringify(securitySettings)}
- AI Preferences: ${JSON.stringify(aiPreferences)}

Respond with only a single JSON object (no markdown, no code fence) in this shape:
{ "recommendations": [ { "title": "...", "description": "...", "priority": "high"|"medium"|"low", "category": "security"|"notifications"|"privacy"|"account" } ] }`,
    })

    const parsed = JSON.parse(text || "{}")
    const list = parsed?.recommendations
    if (Array.isArray(list) && list.length > 0) {
      recommendations = list.map((r: { title?: string; description?: string; priority?: string; category?: string }) => ({
        title: r.title ?? "Recommendation",
        description: r.description ?? "",
        priority: r.priority ?? "medium",
        category: r.category ?? "general",
      }))
      fromFallback = false
    }
  } catch (error) {
    console.error("[ai-recommendations] Error:", error)
    // Return fallback so the UI still works; do not return 500
  }

  return NextResponse.json({ success: true, recommendations, fromFallback })
}
