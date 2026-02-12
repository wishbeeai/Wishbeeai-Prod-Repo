import { NextResponse } from "next/server"
import { getCachedReloadlyBalance } from "@/lib/reloadly"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * GET /api/reloadly/balance
 * Returns Reloadly wallet balance (number) for settlement UI.
 * Optionally returns isAdmin for admin-only notices.
 */
export async function GET() {
  try {
    const [balance, supabase] = await Promise.all([
      getCachedReloadlyBalance(),
      createClient(),
    ])
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const isAdmin =
      (user?.user_metadata as { role?: string } | undefined)?.role === "admin"
    return NextResponse.json({
      balance: Number(balance),
      isAdmin: !!isAdmin,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to get Reloadly balance"
    console.error("[reloadly/balance]", e)
    return NextResponse.json(
      { error: message, balance: 0, isAdmin: false },
      { status: 502 }
    )
  }
}
