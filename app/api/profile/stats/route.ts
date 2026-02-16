import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getGiftingStatsForUser } from "@/lib/profile-stats"

export const dynamic = "force-dynamic"

/** GET current user's gifting stats (real data only). */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stats = await getGiftingStatsForUser(user.id)
    return NextResponse.json(stats)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[profile/stats] Error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
