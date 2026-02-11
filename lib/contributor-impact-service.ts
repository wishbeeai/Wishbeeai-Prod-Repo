/**
 * Contributor Impact Service — notifies all contributors when the gift is complete.
 *
 * Trigger: After BOTH bonus (Amazon GC) and charity/tip settlements exist for the same gift.
 * Prevention: contributor_impact_emails_sent on gifts prevents duplicate sends.
 * Link: Button points to /impact/[eventHash] (impact_token) for the celebratory screen.
 */

import { createAdminClient } from "@/lib/supabase/server"
import {
  buildContributorImpactEmailHtml,
  getContributorImpactSubject,
  type ContributorImpactEmailData,
} from "@/lib/contributor-impact-email"
import { ensureImpactToken } from "@/lib/recipient-notification-service"
import { Resend } from "resend"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"

export type NotifyContributorsOptions = {
  resend: InstanceType<typeof Resend>
  from?: string
}

type ContributorRecipient = {
  email: string
  name?: string
}

/**
 * Fetches all contributor records for the gift (from gift_contributor_emails, gift_contributions, organizer).
 */
async function getContributorsForGift(giftId: string): Promise<ContributorRecipient[]> {
  const supabase = createAdminClient()
  if (!supabase) return []

  const seen = new Map<string, ContributorRecipient>()

  // 1. gift_contributor_emails
  try {
    const { data } = await supabase
      .from("gift_contributor_emails")
      .select("email, contributor_name")
      .eq("gift_id", giftId)
    for (const r of data || []) {
      const email = (r.email || "").trim().toLowerCase()
      if (email && !seen.has(email)) {
        seen.set(email, {
          email: r.email?.trim() ?? "",
          name: r.contributor_name?.trim() || undefined,
        })
      }
    }
  } catch {
    /* table may not exist */
  }

  // 2. gift_contributions (contributor_email)
  try {
    const { data } = await supabase
      .from("gift_contributions")
      .select("contributor_email, contributor_name")
      .eq("gift_id", giftId)
    for (const r of data || []) {
      const email = (r.contributor_email || "").trim().toLowerCase()
      if (email && !seen.has(email)) {
        seen.set(email, {
          email: r.contributor_email?.trim() ?? "",
          name: r.contributor_name?.trim() || undefined,
        })
      }
    }
  } catch {
    /* table may not exist */
  }

  // 3. Organizer (gift creator) — may have contributed
  try {
    const { data: gift } = await supabase
      .from("gifts")
      .select("user_id")
      .eq("id", giftId)
      .single()
    if (gift?.user_id) {
      const { data } = await supabase.auth.admin.getUserById(gift.user_id)
      const user = data?.user
      if (user?.email) {
        const email = user.email.trim().toLowerCase()
        if (email && !seen.has(email)) {
          seen.set(email, {
            email: user.email,
            name:
              (user.user_metadata?.full_name as string) ||
              (user.user_metadata?.name as string) ||
              user.email.split("@")[0].replace(/[._]/g, " "),
          })
        }
      }
    }
  } catch {
    /* non-blocking */
  }

  return Array.from(seen.values()).filter((r) => r.email)
}

/**
 * Checks if both bonus (Amazon GC) and charity/tip settlements exist, and we haven't already sent.
 */
async function canSendContributorImpact(giftId: string): Promise<{
  ok: boolean
  amazonAmount?: number
  donationAmount?: number
  charityName?: string
}> {
  const supabase = createAdminClient()
  if (!supabase) return { ok: false }

  const { data: gift, error: giftErr } = await supabase
    .from("gifts")
    .select("contributor_impact_emails_sent")
    .eq("id", giftId)
    .single()
  if (giftErr || gift?.contributor_impact_emails_sent) return { ok: false }

  const { data: settlements, error } = await supabase
    .from("gift_settlements")
    .select("amount, disposition, status, charity_name")
    .eq("gift_id", giftId)

  if (error || !settlements?.length) return { ok: false }

  const bonusSettlement = settlements.find(
    (s) => s.disposition === "bonus" && s.status !== "failed"
  )
  const charityOrTipSettlement = settlements.find(
    (s) =>
      (s.disposition === "charity" || s.disposition === "tip") && s.status !== "failed"
  )

  if (!bonusSettlement || !charityOrTipSettlement) return { ok: false }

  const amazonAmount = Number(bonusSettlement.amount)
  const donationAmount = Number(charityOrTipSettlement.amount)
  const charityName =
    charityOrTipSettlement.charity_name ||
    (charityOrTipSettlement.disposition === "tip" ? "Wishbee" : "Charity")

  return {
    ok: true,
    amazonAmount,
    donationAmount,
    charityName,
  }
}

/**
 * notifyContributorsOfCompletion — triggers after a successful settlement when both
 * Amazon GC and charity/tip settlements exist. Sends the Impact email to each contributor.
 * Only sends once per event (contributor_impact_emails_sent prevents duplicates).
 */
export async function notifyContributorsOfCompletion(
  giftId: string,
  options: NotifyContributorsOptions
): Promise<{ triggered: boolean; sent: number; failed: number; error?: string }> {
  const check = await canSendContributorImpact(giftId)
  if (!check.ok || check.amazonAmount == null) {
    return { triggered: false, sent: 0, failed: 0 }
  }

  const supabase = createAdminClient()
  if (!supabase) return { triggered: false, sent: 0, failed: 0 }

  const contributors = await getContributorsForGift(giftId)
  if (contributors.length === 0) {
    return { triggered: false, sent: 0, failed: 0 }
  }

  const { data: gift } = await supabase
    .from("gifts")
    .select("recipient_name, collection_title, gift_name")
    .eq("id", giftId)
    .single()

  if (!gift) return { triggered: false, sent: 0, failed: 0 }

  const token = await ensureImpactToken(giftId)
  const impactCardUrl = `${BASE_URL}/impact/${token}`
  const eventName = gift.collection_title || gift.gift_name || "Group gift"
  const recipientName = gift.recipient_name ?? "the recipient"
  const amazonAmount = check.amazonAmount
  const donationAmount = check.donationAmount ?? 0
  const charityName = check.charityName ?? "Wishbee"

  const { resend, from = "Wishbee <onboarding@resend.dev>" } = options
  const fromEmail = process.env.TRANSPARENCY_EMAIL_FROM?.trim() || from
  const subject = getContributorImpactSubject()

  let sent = 0
  let failed = 0

  for (const contributor of contributors) {
    if (!contributor.email?.trim()) continue

    const contributorName =
      contributor.name || contributor.email.split("@")[0].replace(/[._]/g, " ") || "Friend"

    const data: ContributorImpactEmailData = {
      contributorName,
      eventName,
      recipientName,
      amazonAmount,
      donationAmount,
      charityName,
      impactCardUrl,
    }

    const html = buildContributorImpactEmailHtml(data)

    try {
      const result = await resend.emails.send({
        from: fromEmail,
        to: contributor.email,
        subject,
        html,
      })
      if (result.error) {
        failed++
        console.error("[contributor-impact] Failed to send to", contributor.email, result.error)
      } else {
        sent++
      }
    } catch (e) {
      failed++
      console.error("[contributor-impact] Error sending to", contributor.email, e)
    }
  }

  // Mark as sent even if some failed — prevents retry storms
  await supabase
    .from("gifts")
    .update({ contributor_impact_emails_sent: true })
    .eq("id", giftId)

  return {
    triggered: true,
    sent,
    failed,
  }
}
