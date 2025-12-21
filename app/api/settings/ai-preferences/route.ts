import { type NextRequest, NextResponse } from "next/server"

const userAIPreferences: Record<string, any> = {
  default: {
    aiSuggestions: true,
    autoExtract: true,
    smartRecommendations: true,
    personalizedInsights: true,
  },
}

export async function GET(request: NextRequest) {
  try {
    const userId = "default"

    const aiPreferences = userAIPreferences[userId] || {
      aiSuggestions: true,
      autoExtract: true,
      smartRecommendations: true,
      personalizedInsights: true,
    }

    console.log("[v0] Fetching AI preferences for user:", userId, aiPreferences)

    return NextResponse.json(aiPreferences)
  } catch (error) {
    console.error("[v0] Error fetching AI preferences:", error)
    return NextResponse.json({ error: "Failed to fetch AI preferences" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    const requiredFields = ["aiSuggestions", "autoExtract", "smartRecommendations", "personalizedInsights"]
    for (const field of requiredFields) {
      if (typeof body[field] !== "boolean") {
        return NextResponse.json({ error: `Invalid value for ${field}. Must be a boolean.` }, { status: 400 })
      }
    }

    const userId = "default"

    userAIPreferences[userId] = {
      aiSuggestions: body.aiSuggestions,
      autoExtract: body.autoExtract,
      smartRecommendations: body.smartRecommendations,
      personalizedInsights: body.personalizedInsights,
    }

    console.log("[v0] AI preferences updated for user:", userId, userAIPreferences[userId])

    return NextResponse.json({
      success: true,
      message: "AI preferences updated successfully",
      data: userAIPreferences[userId],
    })
  } catch (error) {
    console.error("[v0] Error updating AI preferences:", error)
    return NextResponse.json({ error: "Failed to update AI preferences" }, { status: 500 })
  }
}
