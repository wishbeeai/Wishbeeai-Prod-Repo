/**
 * MonthlyDonationService — Handles pooled charity donations and post-donation notifications.
 *
 * - Batch Selection: Selects pending_pool settlements by charity_id
 * - Update Status: Marks batch as completed with batch_id after donation is confirmed
 * - Email Trigger: Sends impact emails to organizers for each completed record
 *
 * Support Wishbee (tips): Tips are NOT pooled; send receipt immediately when confirmed.
 */

import { createAdminClient } from "@/lib/supabase/server"
import { sendImpactEmail } from "@/lib/impact-email"
import { Resend } from "resend"

export type SettlementRecord = {
  id: string
  gift_id: string
  amount: number
  disposition: string
  charity_id: string | null
  charity_name: string | null
  dedication: string | null
  recipient_name: string | null
  gift_name: string | null
  status: string | null
  batch_id: string | null
  created_at: string
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"
const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim()
const DEFAULT_FROM = "Wishbee <onboarding@resend.dev>"

/**
 * Select all gift_settlements where status = 'pending_pool' and charity_id = [charityId].
 */
export async function selectPendingBatchByCharity(
  charityId: string
): Promise<SettlementRecord[]> {
  const supabase = createAdminClient()
  if (!supabase) {
    throw new Error("Database client unavailable")
  }

  const { data, error } = await supabase
    .from("gift_settlements")
    .select("*")
    .eq("status", "pending_pool")
    .eq("disposition", "charity")
    .eq("charity_id", charityId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[MonthlyDonationService] selectPendingBatchByCharity error:", error)
    throw error
  }

  return (data || []) as SettlementRecord[]
}

/**
 * After the batch donation is manually or via API confirmed:
 * 1. Update records to status = 'completed' and store batch_id
 * 2. For each record, trigger sendImpactEmail to the gift organizer
 */
export async function completeBatchAndSendImpactEmails(
  charityId: string,
  charityName: string,
  collectiveReceiptUrl?: string
): Promise<{ batchId: string; updated: number; emailsSent: number; errors: string[] }> {
  const supabase = createAdminClient()
  if (!supabase) {
    throw new Error("Database client unavailable")
  }

  const records = await selectPendingBatchByCharity(charityId)
  if (records.length === 0) {
    return { batchId: "", updated: 0, emailsSent: 0, errors: [] }
  }

  const batchId = crypto.randomUUID()
  const receiptUrl =
    collectiveReceiptUrl ||
    `${BASE_URL}/receipts/collective/${charityId}/${batchId}`

  const ids = records.map((r) => r.id)
  const { error: updateError } = await supabase
    .from("gift_settlements")
    .update({ status: "completed", batch_id: batchId })
    .in("id", ids)

  if (updateError) {
    console.error("[MonthlyDonationService] Update error:", updateError)
    throw updateError
  }

  const errors: string[] = []
  let emailsSent = 0

  if (RESEND_API_KEY) {
    const resend = new Resend(RESEND_API_KEY)
    const from = process.env.TRANSPARENCY_EMAIL_FROM?.trim() || DEFAULT_FROM

    for (const record of records) {
      try {
        const organizer = await getOrganizerForGift(record.gift_id)
        if (!organizer?.email) {
          errors.push(`Gift ${record.gift_id}: No organizer email found`)
          continue
        }

        const result = await sendImpactEmail(
          {
            organizerName: organizer.name || "Organizer",
            organizerEmail: organizer.email,
            amount: Number(record.amount),
            charityName: charityName,
            eventName: record.gift_name || "Group gift",
            collectiveReceiptUrl: receiptUrl,
          },
          {
            to: [{ email: organizer.email, name: organizer.name }],
            from,
            resend,
          }
        )

        if (result.failed > 0) {
          errors.push(...result.errors)
        } else {
          emailsSent += result.sent
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        errors.push(`Settlement ${record.id}: ${msg}`)
      }
    }
  } else {
    errors.push("RESEND_API_KEY not configured; impact emails skipped")
  }

  return {
    batchId,
    updated: records.length,
    emailsSent,
    errors,
  }
}

async function getOrganizerForGift(
  giftId: string
): Promise<{ email: string; name?: string } | null> {
  const supabase = createAdminClient()
  if (!supabase) return null

  const { data: gift, error: giftError } = await supabase
    .from("gifts")
    .select("user_id")
    .eq("id", giftId)
    .single()

  if (giftError || !gift?.user_id) return null

  try {
    const { data } = await supabase.auth.admin.getUserById(gift.user_id)
    const user = data?.user
    if (!user?.email) return null
    return {
      email: user.email,
      name:
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        user.email.split("@")[0],
    }
  } catch {
    return null
  }
}
