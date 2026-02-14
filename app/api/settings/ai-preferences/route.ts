import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

const DEFAULT_AI_PREFERENCES = {
  aiSuggestions: true,
  autoExtract: true,
  smartRecommendations: true,
  personalizedInsights: true,
}

async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user.id
}

export async function GET(_request: NextRequest) {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = createAdminClient() ?? await createClient()
    const { data: row, error } = await db
      .from("profiles")
      .select("ai_suggestions, auto_extract, smart_recommendations, personalized_insights")
      .eq("id", userId)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("[settings/ai-preferences] GET error:", error.message)
      return NextResponse.json(DEFAULT_AI_PREFERENCES, { status: 200 })
    }

    const p = row ?? {}
    return NextResponse.json({
      aiSuggestions: p.ai_suggestions ?? DEFAULT_AI_PREFERENCES.aiSuggestions,
      autoExtract: p.auto_extract ?? DEFAULT_AI_PREFERENCES.autoExtract,
      smartRecommendations: p.smart_recommendations ?? DEFAULT_AI_PREFERENCES.smartRecommendations,
      personalizedInsights: p.personalized_insights ?? DEFAULT_AI_PREFERENCES.personalizedInsights,
    })
  } catch (error) {
    console.error("[settings/ai-preferences] Error:", error)
    return NextResponse.json({ error: "Failed to fetch AI preferences" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const db = createAdminClient() ?? await createClient()
    const updates: Record<string, unknown> = { id: userId, updated_at: new Date().toISOString() }

    if (typeof body.aiSuggestions === "boolean") updates.ai_suggestions = body.aiSuggestions
    if (typeof body.autoExtract === "boolean") updates.auto_extract = body.autoExtract
    if (typeof body.smartRecommendations === "boolean") updates.smart_recommendations = body.smartRecommendations
    if (typeof body.personalizedInsights === "boolean") updates.personalized_insights = body.personalizedInsights

    const { error } = await db.from("profiles").upsert(updates, { onConflict: "id" })

    if (error) {
      console.error("[settings/ai-preferences] PUT error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "AI preferences updated successfully",
      data: {
        aiSuggestions: updates.ai_suggestions ?? body.aiSuggestions,
        autoExtract: updates.auto_extract ?? body.autoExtract,
        smartRecommendations: updates.smart_recommendations ?? body.smartRecommendations,
        personalizedInsights: updates.personalized_insights ?? body.personalizedInsights,
      },
    })
  } catch (error) {
    console.error("[settings/ai-preferences] Error:", error)
    return NextResponse.json({ error: "Failed to update AI preferences" }, { status: 500 })
  }
}
