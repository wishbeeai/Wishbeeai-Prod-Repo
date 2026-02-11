import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { calculateFeeFromAmount } from "@/lib/donation-fee"

export const dynamic = "force-dynamic"

type ContributionRow = {
  id?: string
  amount: number
  contributor_name: string | null
  contributor_email: string | null
}

/** Ensure estimated refunds sum exactly to refundablePool (fix rounding). */
function adjustRefundRowsToSum(
  rows: { contributorName: string; originalAmount: number; estimatedRefund: number }[],
  refundablePool: number
): { contributorName: string; originalAmount: number; estimatedRefund: number }[] {
  if (rows.length === 0) return rows
  const sum = rows.reduce((s, r) => s + r.estimatedRefund, 0)
  const diff = Math.round((refundablePool - sum) * 100) / 100
  if (diff === 0) return rows
  const out = [...rows]
  const lastIdx = out.length - 1
  out[lastIdx] = {
    ...out[lastIdx],
    estimatedRefund: Math.round((out[lastIdx].estimatedRefund + diff) * 100) / 100,
  }
  return out
}

/**
 * GET /api/gifts/[id]/refund-preview
 * Returns fee breakdown and per-contributor estimated refund for Cash Refund confirmation UI.
 * Refundable pool = gift's leftover balance (current_amount - target_amount), not total minus fees.
 * Proportional refund per contributor = (their contribution / totalGross) * refundablePool.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: giftId } = await params
    if (!giftId) {
      return NextResponse.json({ error: "Gift ID is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const admin = createAdminClient()
    const db = admin || supabase

    const { data: gift, error: giftError } = await db
      .from("gifts")
      .select("id, collection_title, gift_name, evite_settings, current_amount, target_amount")
      .eq("id", giftId)
      .single()

    if (giftError || !gift) {
      return NextResponse.json({ error: "Gift not found" }, { status: 404 })
    }

    const giftName = (gift as { gift_name?: string }).gift_name ?? gift.collection_title ?? "Gift"
    const currentAmount = Number((gift as { current_amount?: number }).current_amount) ?? 0
    const targetAmount = Number((gift as { target_amount?: number }).target_amount) ?? 0
    const leftover = Math.max(0, Math.round((currentAmount - targetAmount) * 100) / 100)

    // 1) Prefer Stripe-backed contributions (refund to card possible)
    const { data: paymentContributions, error: paymentError } = await db
      .from("gift_payment_contributions")
      .select("id, amount, contributor_name, contributor_email")
      .eq("gift_id", giftId)
      .eq("status", "completed")
      .not("stripe_payment_intent_id", "is", null)

    if (!paymentError && paymentContributions && paymentContributions.length > 0) {
      const list = paymentContributions as ContributionRow[]
      const totalGross = list.reduce((sum, c) => sum + Number(c.amount), 0)
      const totalFees = list.reduce((sum, c) => sum + calculateFeeFromAmount(Number(c.amount)), 0)
      const refundablePool = leftover
      const rawRows = list.map((c) => {
        const amt = Number(c.amount)
        const estimatedRefund = totalGross > 0 ? (amt / totalGross) * refundablePool : 0
        return {
          contributorName: c.contributor_name ?? c.contributor_email ?? "Contributor",
          originalAmount: amt,
          estimatedRefund: Math.round(estimatedRefund * 100) / 100,
        }
      })
      const rows = adjustRefundRowsToSum(rawRows, refundablePool)
      return NextResponse.json({
        giftId,
        giftName,
        totalGross: Math.round(totalGross * 100) / 100,
        totalFees: Math.round(totalFees * 100) / 100,
        netRefundablePool: refundablePool,
        rows,
        canProcessRefund: true,
      })
    }

    // 2) Fallback: gift_contributions (shows real amounts; refund to card requires payment records)
    const { data: giftContribs } = await db
      .from("gift_contributions")
      .select("id, amount, contributor_name, contributor_email")
      .eq("gift_id", giftId)

    if (giftContribs && giftContribs.length > 0) {
      const list = giftContribs as ContributionRow[]
      const totalGross = list.reduce((sum, c) => sum + Number(c.amount), 0)
      const totalFees = list.reduce((sum, c) => sum + calculateFeeFromAmount(Number(c.amount)), 0)
      const refundablePool = leftover
      const rawRows = list.map((c) => {
        const amt = Number(c.amount)
        const estimatedRefund = totalGross > 0 ? (amt / totalGross) * refundablePool : 0
        return {
          contributorName: c.contributor_name ?? c.contributor_email ?? "Contributor",
          originalAmount: amt,
          estimatedRefund: Math.round(estimatedRefund * 100) / 100,
        }
      })
      const rows = adjustRefundRowsToSum(rawRows, refundablePool)
      return NextResponse.json({
        giftId,
        giftName,
        totalGross: Math.round(totalGross * 100) / 100,
        totalFees: Math.round(totalFees * 100) / 100,
        netRefundablePool: refundablePool,
        rows,
        canProcessRefund: false,
      })
    }

    // 3) Fallback: evite_settings.contributionList on the gift
    const evite = (gift.evite_settings as Record<string, unknown>) || {}
    const contributionList = Array.isArray(evite.contributionList)
      ? (evite.contributionList as { name?: string; email?: string; amount?: number }[])
      : []
    const withAmount = contributionList.filter((c) => c != null && Number(c.amount) > 0)
    if (withAmount.length > 0) {
      const list = withAmount.map((c) => ({
        contributorName: (c.name || c.email || "Contributor").toString(),
        originalAmount: Number(c.amount),
      }))
      const totalGross = list.reduce((sum, c) => sum + c.originalAmount, 0)
      const totalFees = list.reduce((sum, c) => sum + calculateFeeFromAmount(c.originalAmount), 0)
      const refundablePool = leftover
      const rawRows = list.map((c) => {
        const estimatedRefund =
          totalGross > 0 ? (c.originalAmount / totalGross) * refundablePool : 0
        return {
          contributorName: c.contributorName,
          originalAmount: c.originalAmount,
          estimatedRefund: Math.round(estimatedRefund * 100) / 100,
        }
      })
      const rows = adjustRefundRowsToSum(rawRows, refundablePool)
      return NextResponse.json({
        giftId,
        giftName,
        totalGross: Math.round(totalGross * 100) / 100,
        totalFees: Math.round(totalFees * 100) / 100,
        netRefundablePool: refundablePool,
        rows,
        canProcessRefund: false,
      })
    }

    return NextResponse.json({
      giftId,
      giftName,
      totalGross: 0,
      totalFees: 0,
      netRefundablePool: 0,
      rows: [],
      canProcessRefund: false,
    })
  } catch (err) {
    console.error("[refund-preview] error:", err)
    return NextResponse.json({ error: "Failed to load refund preview" }, { status: 500 })
  }
}
