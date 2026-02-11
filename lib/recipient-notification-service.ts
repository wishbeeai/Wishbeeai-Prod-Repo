/**
 * RecipientNotificationService — Final gift delivery email to the recipient.
 *
 * Trigger: Only after BOTH AMAZON_GC (bonus) and CHARITY (or WISHBEE_TIP) settlements
 * are marked as succeeded for the same event (gift).
 *
 * Email includes "Open Your Impact Card" button linking to /impact/[eventHash].
 * eventHash is a secure, unique string (impact_token) to prevent indexing and random access.
 */

import { createAdminClient } from "@/lib/supabase/server"
import { randomBytes } from "crypto"
import { Resend } from "resend"

const COLORS = {
  gold: "#DAA520",
  honey: "#F4C430",
  brown: "#654321",
  brownMuted: "#8B4513",
  cream: "#F5F1E8",
} as const

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"

export type RecipientNotificationData = {
  recipientName: string
  recipientEmail: string
  eventName: string
  contributorCount: number
  impactCardUrl: string
}

/**
 * Generates a secure, unique impact_token (eventHash) for a gift.
 * Uses 32 bytes of cryptographically secure random data, encoded as hex.
 */
export function generateImpactToken(): string {
  return randomBytes(32).toString("hex")
}

/**
 * Ensures a gift has an impact_token. Creates one if missing.
 */
export async function ensureImpactToken(giftId: string): Promise<string> {
  const supabase = createAdminClient()
  if (!supabase) throw new Error("Admin client required")

  const { data: gift, error } = await supabase
    .from("gifts")
    .select("impact_token")
    .eq("id", giftId)
    .single()

  if (error) throw new Error("Gift not found")
  if (gift?.impact_token) return gift.impact_token

  const token = generateImpactToken()
  const { error: updateErr } = await supabase
    .from("gifts")
    .update({ impact_token: token })
    .eq("id", giftId)

  if (updateErr) throw new Error("Failed to set impact token")
  return token
}

/**
 * Checks if both AMAZON_GC (bonus) and CHARITY or WISHBEE_TIP settlements
 * have succeeded for the given gift, and we haven't already sent.
 */
export async function canSendRecipientNotification(giftId: string): Promise<{
  ok: boolean
  amazonGc?: { id: string; recipientEmail?: string | null }
  charityOrTip?: { id: string; charityName: string | null }
}> {
  const supabase = createAdminClient()
  if (!supabase) return { ok: false }

  const { data: gift, error: giftErr } = await supabase
    .from("gifts")
    .select("recipient_notification_sent")
    .eq("id", giftId)
    .single()
  if (giftErr || gift?.recipient_notification_sent) return { ok: false }

  const { data: settlements, error } = await supabase
    .from("gift_settlements")
    .select("id, disposition, status, charity_name, recipient_email")
    .eq("gift_id", giftId)

  if (error || !settlements?.length) return { ok: false }

  const amazonGc = settlements.find(
    (s) => s.disposition === "bonus" && s.status !== "failed"
  )
  const charityOrTip = settlements.find(
    (s) =>
      (s.disposition === "charity" || s.disposition === "tip") && s.status !== "failed"
  )

  if (!amazonGc || !charityOrTip) return { ok: false }

  return {
    ok: true,
    amazonGc: {
      id: amazonGc.id,
      recipientEmail: amazonGc.recipient_email ?? null,
    },
    charityOrTip: {
      id: charityOrTip.id,
      charityName: charityOrTip.charity_name ?? null,
    },
  }
}

/**
 * Counts unique contributors linked to the event (gift).
 */
export async function getContributorCount(giftId: string): Promise<number> {
  const supabase = createAdminClient()
  if (!supabase) return 0

  const seen = new Set<string>()

  // gift_contributions
  try {
    const { data } = await supabase
      .from("gift_contributions")
      .select("contributor_email, contributor_name")
      .eq("gift_id", giftId)
    for (const r of data || []) {
      const key = (r.contributor_email || r.contributor_name || "").toLowerCase().trim()
      if (key) seen.add(key)
    }
  } catch {
    /* table may not exist */
  }

  // gift_contributor_emails
  try {
    const { data } = await supabase
      .from("gift_contributor_emails")
      .select("email, contributor_name")
      .eq("gift_id", giftId)
    for (const r of data || []) {
      const key = (r.email || r.contributor_name || "").toLowerCase().trim()
      if (key) seen.add(key)
    }
  } catch {
    /* table may not exist */
  }

  // evite_settings.contributionList
  const { data: gift } = await supabase
    .from("gifts")
    .select("evite_settings")
    .eq("id", giftId)
    .single()

  if (gift?.evite_settings) {
    const evite = typeof gift.evite_settings === "string"
      ? (JSON.parse(gift.evite_settings) as Record<string, unknown>)
      : (gift.evite_settings as Record<string, unknown>)
    const list = Array.isArray(evite?.contributionList) ? evite.contributionList as { email?: string; name?: string }[] : []
    for (const c of list) {
      const key = (c.email || c.name || "").toLowerCase().trim()
      if (key) seen.add(key)
    }
  }

  return seen.size || 0
}

/**
 * Builds the recipient notification email HTML.
 */
export function buildRecipientNotificationHtml(data: RecipientNotificationData): string {
  const url = data.impactCardUrl
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your gift is ready!</title>
</head>
<body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${COLORS.cream};">
  <div style="max-width: 560px; margin: 0 auto; padding: 24px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(101, 67, 33, 0.12); overflow: hidden;">
      <tr>
        <td style="padding: 28px 24px; background: linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.honey} 100%); text-align: center;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff;">
            🎁 Wishbee has a special surprise for you!
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding: 28px 24px;">
          <p style="margin: 0 0 20px; font-size: 15px; color: ${COLORS.brownMuted};">
            Hi ${data.recipientName},
          </p>
          <p style="margin: 0 0 24px; font-size: 15px; color: ${COLORS.brown}; line-height: 1.6;">
            Your friends went above and beyond for the <strong>${data.eventName}</strong> group gift! By pooling their resources, your <strong>${data.contributorCount}</strong> friends made something special possible.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="text-align: center; padding: 8px 0 20px;">
                <a href="${url}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.honey} 100%); color: ${COLORS.brown}; font-weight: 700; font-size: 15px; text-decoration: none; border-radius: 12px;">
                  Open Your Impact Card
                </a>
              </td>
            </tr>
          </table>
          <p style="margin: 0; font-size: 12px; color: ${COLORS.brownMuted};">
            Thanks for celebrating with Wishbee — your Operating System for Celebrations. 🐝
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`.trim()
}

export type SendRecipientNotificationOptions = {
  resend: InstanceType<typeof Resend>
  from?: string
}

/**
 * Sends the recipient notification email.
 */
export async function sendRecipientNotification(
  data: RecipientNotificationData,
  options: SendRecipientNotificationOptions
): Promise<{ sent: boolean; error?: string }> {
  const { resend, from = "Wishbee <onboarding@resend.dev>" } = options
  if (!data.recipientEmail?.trim()) {
    return { sent: false, error: "No recipient email" }
  }

  const result = await resend.emails.send({
    from: process.env.TRANSPARENCY_EMAIL_FROM?.trim() || from,
    to: data.recipientEmail,
    subject: `🎁 Wishbee has a special surprise for you, ${data.recipientName}!`,
    html: buildRecipientNotificationHtml(data),
  })

  if (result.error) {
    const msg = typeof result.error === "object" && result.error !== null && "message" in result.error
      ? String((result.error as { message?: string }).message)
      : String(result.error)
    return { sent: false, error: msg }
  }
  return { sent: true }
}

/**
 * Checks if both AMAZON_GC and CHARITY/WISHBEE_TIP have succeeded, then sends
 * the recipient notification. Call after creating or updating settlements.
 */
export async function checkAndTriggerRecipientNotification(
  giftId: string,
  options: SendRecipientNotificationOptions
): Promise<{ triggered: boolean; error?: string }> {
  const check = await canSendRecipientNotification(giftId)
  if (!check.ok || !check.amazonGc?.recipientEmail) {
    return { triggered: false }
  }

  const supabase = createAdminClient()
  if (!supabase) return { triggered: false }

  const { data: gift } = await supabase
    .from("gifts")
    .select("recipient_name, collection_title, gift_name")
    .eq("id", giftId)
    .single()

  if (!gift) return { triggered: false }

  const token = await ensureImpactToken(giftId)
  const impactCardUrl = `${BASE_URL}/impact/${token}`
  const contributorCount = await getContributorCount(giftId)

  const result = await sendRecipientNotification(
    {
      recipientName: gift.recipient_name ?? "Friend",
      recipientEmail: check.amazonGc.recipientEmail,
      eventName: gift.collection_title || gift.gift_name || "Group gift",
      contributorCount: contributorCount || 1,
      impactCardUrl,
    },
    options
  )

  if (!result.sent) return { triggered: false, error: result.error }

  await supabase
    .from("gifts")
    .update({ recipient_notification_sent: true })
    .eq("id", giftId)

  return { triggered: true }
}
