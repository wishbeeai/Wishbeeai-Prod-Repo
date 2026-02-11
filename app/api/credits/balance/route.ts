import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCreditBalance } from "@/lib/user-credits"

export const dynamic = "force-dynamic"

/**
 * GET /api/credits/balance
 * Returns the logged-in user's Wishbee Credits balance. Returns 401 if not authenticated.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const balance = await getCreditBalance(user.id)
  return NextResponse.json({ balance })
}
