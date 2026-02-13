/**
 * Post-Settlement Email Service — wraps organizer tax receipt, recipient impact card,
 * and contributor notifications for use by Stripe webhook and settlement flows.
 * Each dispatch is wrapped in try-catch; failures are reported to Sentry without crashing.
 */

import { Sentry } from "@/lib/sentry"
import { createAdminClient } from "@/lib/supabase/server"
import { getCharityEin } from "@/lib/charity-data"
import { sendInstantReceipt } from "@/lib/donation-receipt-email"
import { checkAndTriggerRecipientNotification } from "@/lib/recipient-notification-service"
import { notifyContributorsOfCompletion } from "@/lib/contributor-impact-service"
import { Resend } from "resend"
import { getServerBaseUrl } from "@/lib/base-url"

export type PostSettlementEmailOptions = {
  resend: InstanceType<typeof Resend>
  from?: string
}

/**
 * Sends the organizer tax receipt for a settlement (charity or tip).
 */
export async function sendOrganizerTaxReceipt(
  settlementId: string,
  options: PostSettlementEmailOptions
): Promise<{ sent: boolean; error?: string }> {
  const supabase = createAdminClient()
  if (!supabase) return { sent: false, error: "Admin client unavailable" }

  const { data: settlement, error: settlementErr } = await supabase
    .from("gift_settlements")
    .select("id, gift_id, amount, disposition, charity_id, charity_name, dedication, gift_name")
    .eq("id", settlementId)
    .single()

  if (settlementErr || !settlement) {
    return { sent: false, error: "Settlement not found" }
  }

  const { data: gift } = await supabase
    .from("gifts")
    .select("user_id, collection_title, gift_name")
    .eq("id", settlement.gift_id)
    .single()

  if (!gift?.user_id) {
    return { sent: false, error: "Gift organizer not found" }
  }

  let organizerEmail = ""
  let organizerName = "Organizer"
  try {
    const { data } = await supabase.auth.admin.getUserById(gift.user_id)
    const user = data?.user
    if (!user?.email) return { sent: false, error: "Organizer email not found" }
    organizerEmail = user.email
    organizerName =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      user.email.split("@")[0].replace(/[._]/g, " ") ||
      "Organizer"
  } catch {
    return { sent: false, error: "Could not fetch organizer" }
  }

  const charityName = settlement.charity_name ?? (settlement.disposition === "tip" ? "Wishbee" : "Charity")
  const ein =
    settlement.disposition === "charity" && settlement.charity_id
      ? getCharityEin(settlement.charity_id)
      : null
  const eventName = settlement.gift_name ?? gift.collection_title ?? gift.gift_name ?? "Group gift"
  const receiptUrl = `${getServerBaseUrl()}/receipt/${settlementId}`

  try {
  const result = await sendInstantReceipt(
    {
      email: organizerEmail,
      name: organizerName,
      charityName,
      ein,
      amount: Number(settlement.amount),
      transactionId: settlementId,
      eventName,
      receiptUrl,
      dedication: settlement.dedication ?? undefined,
    },
    options
  )

  if (result.failed > 0 && result.sent === 0) {
    return { sent: false, error: result.errors[0] ?? "Failed to send" }
  }
  return { sent: result.sent > 0 }
  } catch (e) {
    Sentry?.captureException(e, { tags: { emailType: "organizerReceipt" }, extra: { settlementId } })
    return { sent: false, error: e instanceof Error ? e.message : "Failed to send" }
  }
}

/**
 * Sends the recipient impact card (when both bonus + charity/tip settlements exist).
 */
export async function sendRecipientImpactCard(
  eventId: string,
  options: PostSettlementEmailOptions
): Promise<{ triggered: boolean; error?: string }> {
  try {
    const result = await checkAndTriggerRecipientNotification(eventId, options)
    return { triggered: result.triggered, error: result.error }
  } catch (e) {
    Sentry?.captureException(e, { tags: { emailType: "recipientImpactCard" }, extra: { eventId } })
    return { triggered: false, error: e instanceof Error ? e.message : "Failed to send" }
  }
}

/**
 * Notifies all contributors of completion (when both bonus + charity/tip exist).
 */
export async function notifyAllContributors(
  eventId: string,
  options: PostSettlementEmailOptions
): Promise<{ triggered: boolean; sent: number; failed: number }> {
  try {
    const result = await notifyContributorsOfCompletion(eventId, options)
    return {
      triggered: result.triggered,
      sent: result.sent,
      failed: result.failed,
    }
  } catch (e) {
    Sentry?.captureException(e, { tags: { emailType: "contributorGratitude" }, extra: { eventId } })
    return { triggered: false, sent: 0, failed: 0 }
  }
}
