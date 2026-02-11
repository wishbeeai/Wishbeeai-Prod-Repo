"use server"

import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/server"
import { calculateFeeFromAmount } from "@/lib/donation-fee"
import { addUserCredit, addCredits } from "@/lib/user-credits"

const STATUS_REFUNDING = "refunding"
const STATUS_SETTLED_REFUND = "settled_refund"
const STATUS_SETTLED_CREDITS = "settled_credits"
const CONTRIBUTION_STATUS_SUCCESS = "completed"

type GiftPaymentContribution = {
  id: string
  gift_id: string
  amount: number
  status: string
  stripe_payment_intent_id: string | null
  contributor_email: string | null
  contributor_name: string | null
  user_id: string | null
}

export type ProcessCashRefundsResult = {
  success: boolean
  error?: string
  /** Number of successful bank (Stripe) refunds */
  bankRefundCount?: number
  /** Number of store credits issued (expired/canceled card fallback) */
  creditsIssuedCount?: number
  /** Count of failures with no user_id (logged to refund_errors only) */
  failedCount?: number
  settlementIds?: string[]
}

function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured")
  }
  return new Stripe(secretKey, {
    apiVersion: "2024-11-20.acacia",
  })
}

type StoreCreditRow = { amount: number; contributor_email: string | null; contributor_name: string | null }

async function processStoreCreditOnly(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  giftId: string,
  giftName: string,
  netPool: number
): Promise<{ error?: string; creditsIssuedCount?: number; failedCount?: number; settlementIds?: string[] }> {
  const { data: giftContribs } = await admin
    .from("gift_contributions")
    .select("amount, contributor_email, contributor_name")
    .eq("gift_id", giftId)

  let rows: StoreCreditRow[] = []
  if (giftContribs && giftContribs.length > 0) {
    rows = giftContribs as StoreCreditRow[]
  } else {
    const { data: gift } = await admin
      .from("gifts")
      .select("evite_settings")
      .eq("id", giftId)
      .single()
    const evite = (gift?.evite_settings as Record<string, unknown>) || {}
    const list = Array.isArray(evite.contributionList)
      ? (evite.contributionList as { name?: string; email?: string; amount?: number }[])
      : []
    const withAmount = list.filter((c) => c != null && Number(c.amount) > 0)
    if (withAmount.length === 0) {
      return { error: "No contributions found for this gift. Add contribution records to issue store credit." }
    }
    rows = withAmount.map((c) => ({
      amount: Number(c.amount),
      contributor_email: (c.email ?? "") || null,
      contributor_name: (c.name ?? "Contributor") || null,
    }))
  }

  const totalGross = rows.reduce((sum, r) => sum + Number(r.amount), 0)
  if (totalGross <= 0) return { error: "Total contributions must be positive." }

  const settlementIds: string[] = []
  let creditsIssuedCount = 0
  let failedCount = 0

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const amountDollars = Math.round((Number(r.amount) / totalGross) * netPool * 100) / 100
    if (amountDollars < 0.01) continue
    const email = r.contributor_email?.trim()
    if (!email) {
      failedCount++
      continue
    }
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle()
    const userId = profile?.id
    if (!userId) {
      failedCount++
      continue
    }
    const creditResult = await addUserCredit(userId, amountDollars, {
      referenceId: giftId,
      referenceType: "gift_refund_store_credit",
    })
    if (!creditResult.success) {
      failedCount++
      continue
    }
    const displayName = r.contributor_name ?? r.contributor_email ?? "Contributor"
    const { data: settlement } = await admin
      .from("gift_settlements")
      .insert({
        gift_id: giftId,
        amount: amountDollars,
        disposition: "credit",
        recipient_name: displayName,
        recipient_email: email,
        gift_name: giftName,
        status: "completed",
      })
      .select("id")
      .single()
    if (settlement?.id) {
      settlementIds.push(settlement.id)
      creditsIssuedCount++
    }
  }

  if (creditsIssuedCount === 0 && failedCount === 0) {
    return { error: "No contributors with a registered account (profiles) found. Store credit can only be issued to signed-up users." }
  }
  if (creditsIssuedCount === 0) {
    return { error: "Could not issue store credit. Contributor emails may not match any registered account." }
  }
  return { creditsIssuedCount, failedCount, settlementIds }
}

export type ProcessStoreCreditsResult = {
  success: boolean
  error?: string
  creditsIssuedCount?: number
  failedCount?: number
}

/**
 * Settlement: distribute leftover balance as Wishbee Credits (profiles.credit_balance + credit_transactions).
 * Proportional share = (IndividualContrib / TotalGross) * NetRefundablePool. Marks gift SETTLED_CREDITS.
 */
export async function processStoreCredits(
  giftId: string,
  netRefundablePool: number
): Promise<ProcessStoreCreditsResult> {
  const admin = createAdminClient()
  if (!admin) {
    return { success: false, error: "Server configuration error (admin client unavailable)." }
  }
  if (netRefundablePool < 0.01) {
    return { success: false, error: "Net refundable pool must be at least $0.01." }
  }
  const netPool = Math.round(netRefundablePool * 100) / 100

  const { data: gift, error: giftErr } = await admin
    .from("gifts")
    .select("id, collection_title, gift_name")
    .eq("id", giftId)
    .single()
  if (giftErr || !gift) {
    return { success: false, error: "Gift not found." }
  }
  const giftName = (gift as { gift_name?: string }).gift_name ?? gift.collection_title ?? "Gift"

  const { data: giftContribs } = await admin
    .from("gift_contributions")
    .select("amount, contributor_email, contributor_name")
    .eq("gift_id", giftId)
  let rows: StoreCreditRow[] = []
  if (giftContribs && giftContribs.length > 0) {
    rows = giftContribs as StoreCreditRow[]
  } else {
    const { data: g } = await admin.from("gifts").select("evite_settings").eq("id", giftId).single()
    const evite = (g?.evite_settings as Record<string, unknown>) || {}
    const list = Array.isArray(evite.contributionList)
      ? (evite.contributionList as { name?: string; email?: string; amount?: number }[])
      : []
    const withAmount = list.filter((c) => c != null && Number(c.amount) > 0)
    if (withAmount.length === 0) {
      return { success: false, error: "No contributions found for this gift." }
    }
    rows = withAmount.map((c) => ({
      amount: Number(c.amount),
      contributor_email: (c.email ?? "") || null,
      contributor_name: (c.name ?? "Contributor") || null,
    }))
  }

  const totalGross = rows.reduce((sum, r) => sum + Number(r.amount), 0)
  if (totalGross <= 0) return { success: false, error: "Total contributions must be positive." }

  let creditsIssuedCount = 0
  let failedCount = 0

  for (const r of rows) {
    const amountDollars = Math.round((Number(r.amount) / totalGross) * netPool * 100) / 100
    if (amountDollars < 0.01) continue
    const email = r.contributor_email?.trim()
    if (!email) {
      failedCount++
      continue
    }
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle()
    const userId = profile?.id
    if (!userId) {
      failedCount++
      continue
    }
    const result = await addCredits(userId, amountDollars, "REFUND", giftId, {
      pool_total: netPool,
    })
    if (!result.success) {
      failedCount++
      continue
    }
    creditsIssuedCount++
    const displayName = r.contributor_name ?? r.contributor_email ?? "Contributor"
    await admin.from("gift_settlements").insert({
      gift_id: giftId,
      amount: amountDollars,
      disposition: "credit",
      recipient_name: displayName,
      recipient_email: email,
      gift_name: giftName,
      status: "completed",
    })
  }

  if (creditsIssuedCount === 0) {
    return {
      success: false,
      error:
        failedCount > 0
          ? "Could not issue credits. Contributor emails may not match any registered account."
          : "No contributors with valid email found.",
    }
  }

  await admin.from("gifts").update({ status: STATUS_SETTLED_CREDITS }).eq("id", giftId)
  return { success: true, creditsIssuedCount, failedCount }
}

/**
 * Process proportional cash refunds for a gift (Wishbee).
 * Fee safeguard: NetRefundablePool = TotalGross - TotalFees; per-contributor refund = (contribution/TotalGross)*NetRefundablePool.
 * Idempotency: refund_${wishbeeId}_${contributionId}. On Stripe failure (e.g. expired card), issues Wishbee Store Credit when user_id is present.
 */
export async function processCashRefunds(
  giftId: string,
  netRefundablePool: number
): Promise<ProcessCashRefundsResult> {
  const admin = createAdminClient()
  if (!admin) {
    return { success: false, error: "Server configuration error (admin client unavailable)." }
  }

  if (netRefundablePool < 0.01) {
    return { success: false, error: "Net refundable pool must be at least $0.01." }
  }

  const { data: gift, error: giftFetchError } = await admin
    .from("gifts")
    .select("id, collection_title, gift_name")
    .eq("id", giftId)
    .single()

  if (giftFetchError || !gift) {
    return { success: false, error: "Gift not found." }
  }

  const { error: statusUpdateError } = await admin
    .from("gifts")
    .update({ status: STATUS_REFUNDING })
    .eq("id", giftId)

  if (statusUpdateError) {
    return {
      success: false,
      error: statusUpdateError.message || "Failed to mark gift as refunding. It may already be in progress.",
    }
  }

  const { data: contributions, error: contribError } = await admin
    .from("gift_payment_contributions")
    .select("id, gift_id, amount, status, stripe_payment_intent_id, contributor_email, contributor_name, user_id")
    .eq("gift_id", giftId)
    .eq("status", CONTRIBUTION_STATUS_SUCCESS)

  if (contribError) {
    await admin.from("gifts").update({ status: "active" }).eq("id", giftId)
    return { success: false, error: "Failed to load contributions." }
  }

  const list = (contributions ?? []) as GiftPaymentContribution[]
  const withStripe = list.filter((c) => c.stripe_payment_intent_id?.trim())
  const giftName = (gift as { gift_name?: string }).gift_name ?? gift.collection_title ?? "Gift"
  const netPool = Math.round(netRefundablePool * 100) / 100

  if (withStripe.length === 0) {
    const creditResult = await processStoreCreditOnly(admin, giftId, giftName, netPool)
    if (creditResult.error) {
      await admin.from("gifts").update({ status: "active" }).eq("id", giftId)
      return { success: false, error: creditResult.error }
    }
    const { error: finalErr } = await admin
      .from("gifts")
      .update({ status: STATUS_SETTLED_REFUND })
      .eq("id", giftId)
    if (finalErr) console.error("[processCashRefunds] Failed to set status to settled_refund:", finalErr)
    return {
      success: true,
      bankRefundCount: 0,
      creditsIssuedCount: creditResult.creditsIssuedCount ?? 0,
      failedCount: creditResult.failedCount ?? 0,
      settlementIds: creditResult.settlementIds ?? [],
    }
  }

  const totalGross = withStripe.reduce((sum, c) => sum + Number(c.amount), 0)
  if (totalGross <= 0) {
    await admin.from("gifts").update({ status: "active" }).eq("id", giftId)
    return { success: false, error: "Total contribution pool must be positive." }
  }

  const stripe = getStripe()
  const refundsToProcess = withStripe.map((c) => {
    const amt = Number(c.amount)
    const estimatedRefund = (amt / totalGross) * netPool
    const amountCents = Math.max(1, Math.round(estimatedRefund * 100))
    return {
      contribution: c,
      amountCents,
      amountDollars: amountCents / 100,
    }
  })

  const results = await Promise.allSettled(
    refundsToProcess.map(async ({ contribution, amountCents, amountDollars }) => {
      const idempotencyKey = `refund_${giftId}_${contribution.id}`
      try {
        const refund = await stripe.refunds.create(
          {
            payment_intent: contribution.stripe_payment_intent_id!,
            amount: amountCents,
            reason: "requested_by_customer",
            metadata: {
              wishbeeId: giftId,
              type: "proportional_distribution",
            },
          },
          { idempotencyKey }
        )
        return { kind: "refund" as const, contribution, amountDollars, refundId: refund.id }
      } catch (err) {
        const userId = contribution.user_id?.trim() || null
        if (userId) {
          const creditResult = await addUserCredit(userId, amountDollars, {
            referenceId: contribution.id,
            referenceType: "gift_payment_contribution",
          })
          if (creditResult.success) {
            return { kind: "credit" as const, contribution, amountDollars }
          }
        }
        throw err
      }
    })
  )

  const settlementIds: string[] = []
  let bankRefundCount = 0
  let creditsIssuedCount = 0
  let failedCount = 0

  for (let i = 0; i < results.length; i++) {
    const settled = results[i]
    const { contribution, amountDollars } = refundsToProcess[i]
    const displayName = contribution.contributor_name ?? contribution.contributor_email ?? "Contributor"

    if (settled.status === "fulfilled") {
      const value = settled.value
      if (value.kind === "refund") {
        await admin
          .from("gift_payment_contributions")
          .update({ stripe_refund_id: value.refundId, updated_at: new Date().toISOString() })
          .eq("id", contribution.id)
        const { data: settlement } = await admin
          .from("gift_settlements")
          .insert({
            gift_id: giftId,
            amount: amountDollars,
            disposition: "refund",
            recipient_name: displayName,
            recipient_email: contribution.contributor_email,
            gift_name: giftName,
            status: "completed",
          })
          .select("id")
          .single()
        if (settlement?.id) {
          settlementIds.push(settlement.id)
          bankRefundCount++
        }
      } else {
        const { data: settlement } = await admin
          .from("gift_settlements")
          .insert({
            gift_id: giftId,
            amount: amountDollars,
            disposition: "credit",
            recipient_name: displayName,
            recipient_email: contribution.contributor_email,
            gift_name: giftName,
            status: "completed",
          })
          .select("id")
          .single()
        if (settlement?.id) {
          settlementIds.push(settlement.id)
          creditsIssuedCount++
        }
      }
    } else {
      failedCount++
      const err = settled.reason
      const message = err instanceof Error ? err.message : String(err)
      const stripeCode =
        err && typeof err === "object" && "code" in err ? String((err as { code: string }).code) : null
      await admin.from("refund_errors").insert({
        gift_id: giftId,
        contribution_id: contribution.id,
        amount: amountDollars,
        error_message: message,
        stripe_error_code: stripeCode,
      })
    }
  }

  const { error: finalUpdateError } = await admin
    .from("gifts")
    .update({ status: STATUS_SETTLED_REFUND })
    .eq("id", giftId)

  if (finalUpdateError) {
    console.error("[processCashRefunds] Failed to set status to settled_refund:", finalUpdateError)
  }

  return {
    success: true,
    bankRefundCount,
    creditsIssuedCount,
    failedCount,
    settlementIds,
  }
}
