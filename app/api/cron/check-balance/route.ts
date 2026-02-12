import { NextResponse } from "next/server"
import { getBalance } from "@/lib/reloadly"
import { sendSlackAlert } from "@/lib/slack"
import type { SlackBalanceTier } from "@/lib/slack"

export const dynamic = "force-dynamic"

const THRESHOLD_LOW = 50
const THRESHOLD_CRITICAL = 10

function assertCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false
  const auth = request.headers.get("Authorization")?.trim()
  return auth === `Bearer ${secret}`
}

/**
 * GET /api/cron/check-balance
 * Compares Reloadly balance to thresholds ($50 LOW, $10 CRITICAL) and sends Slack alerts.
 * Protected by Authorization: Bearer CRON_SECRET.
 */
export async function GET(request: Request) {
  if (!assertCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { balance } = await getBalance()
    const amount = Number(balance ?? 0)

    let tier: SlackBalanceTier | null = null
    if (amount < THRESHOLD_CRITICAL) {
      tier = "CRITICAL"
    } else if (amount < THRESHOLD_LOW) {
      tier = "LOW"
    }

    if (tier) {
      await sendSlackAlert(tier, amount)
    }

    return NextResponse.json({
      balance: amount,
      tier: tier ?? "OK",
      thresholds: { low: THRESHOLD_LOW, critical: THRESHOLD_CRITICAL },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to check balance"
    console.error("[cron/check-balance]", e)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
