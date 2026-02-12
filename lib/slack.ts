/**
 * Slack alerts via Incoming Webhook.
 * Set process.env.SLACK_WEBHOOK_URL to enable.
 */

export type SlackBalanceTier = "LOW" | "CRITICAL"

const TIER_MESSAGES: Record<
  SlackBalanceTier,
  (balance: number) => string
> = {
  LOW: (balance) =>
    `⚠️ Reloadly Balance Low: Your current float is $${balance.toFixed(2)}. Consider topping up soon.`,
  CRITICAL: (balance) =>
    `🚨 URGENT: Balance at $${balance.toFixed(2)}. Gift cards are now hidden from users!`,
}

/**
 * Send a balance alert to Slack.
 * Uses SLACK_WEBHOOK_URL; no-op if not set.
 */
export async function sendSlackAlert(
  tier: SlackBalanceTier,
  balance: number
): Promise<boolean> {
  const url = process.env.SLACK_WEBHOOK_URL?.trim()
  if (!url) {
    return false
  }
  const text = TIER_MESSAGES[tier](balance)
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })
    return res.ok
  } catch (e) {
    console.error("[slack] sendSlackAlert failed:", e)
    return false
  }
}
