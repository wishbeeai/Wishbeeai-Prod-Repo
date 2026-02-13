import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { processImmediateDonation } from "@/lib/donation-service"
import { sendInstantDonationEmail } from "@/lib/email-service"
import { computeDonationAmounts } from "@/lib/donation-fee"
import { getCharityEin } from "@/lib/charity-data"
import { checkAndTriggerRecipientNotification } from "@/lib/recipient-notification-service"
import { Resend } from "resend"

export const dynamic = "force-dynamic"

const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim()
const DEFAULT_FROM = "Wishbee <onboarding@resend.dev>"
import { getServerBaseUrl } from "@/lib/base-url"

/**
 * POST /api/donations/process-instant
 * Processes an immediate charity donation. On 200 OK, creates completed record and sends receipt email.
 */
export async function POST(request: NextRequest) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const b = body as {
      giftId?: string
      amount?: number
      charityId?: string
      charityName?: string
      feeCovered?: boolean
      recipientName?: string
      giftName?: string
      totalFundsCollected?: number
      finalGiftPrice?: number
    }

    const giftId = b.giftId
    const amount = Number(b.amount)
    const feeCovered = b.feeCovered === true

    if (!giftId || isNaN(amount) || amount <= 0 || !b.charityId || !b.charityName) {
      return NextResponse.json(
        { error: "giftId, amount, charityId, and charityName are required" },
        { status: 400 }
      )
    }

    const { netToCharity, totalCharged, fee } = computeDonationAmounts(amount, feeCovered)
    const dedication = `On behalf of the ${b.giftName || "Group gift"} group via Wishbee.ai`

    const supabase = await createClient()
    const admin = createAdminClient()

    const { data: gift, error: giftError } = await (admin || supabase)
      .from("gifts")
      .select("id, user_id, collection_title, gift_name")
      .eq("id", giftId)
      .single()

    if (giftError || !gift) {
      return NextResponse.json({ error: "Gift not found" }, { status: 404 })
    }

    const insertPayload = {
      gift_id: giftId,
      amount: netToCharity,
      disposition: "charity",
      charity_id: b.charityId,
      charity_name: b.charityName,
      dedication,
      recipient_name: b.recipientName || null,
      gift_name: b.giftName || gift.collection_title || gift.gift_name || null,
      total_funds_collected: b.totalFundsCollected ?? null,
      final_gift_price: b.finalGiftPrice ?? null,
      status: "failed" as const,
      fee_covered: feeCovered,
      transaction_fee: fee,
    }

    const { data: settlement, error: insertError } = await supabase
      .from("gift_settlements")
      .insert(insertPayload)
      .select("id")
      .single()

    if (insertError || !settlement) {
      console.error("[process-instant] Insert error:", insertError)
      return NextResponse.json(
        { error: insertError?.message || "Failed to create settlement" },
        { status: 500 }
      )
    }

    const receiptUrl = `${getServerBaseUrl()}/gifts/${giftId}/receipt/${settlement.id}`

    let organizerEmail = ""
    let organizerName = "Organizer"
    if (admin && gift.user_id) {
      try {
        const { data } = await admin.auth.admin.getUserById(gift.user_id)
        const user = data?.user
        if (user?.email) {
          organizerEmail = user.email
          organizerName =
            (user.user_metadata?.full_name as string) ||
            (user.user_metadata?.name as string) ||
            user.email.split("@")[0]
        }
      } catch {
        // non-blocking
      }
    }

    const result = await processImmediateDonation({
      giftId,
      amount,
      netToCharity,
      fee,
      feeCovered,
      charityId: b.charityId,
      charityName: b.charityName,
      dedication,
      recipientEmail: organizerEmail,
      recipientName: b.recipientName || "",
      giftName: b.giftName || gift.collection_title || gift.gift_name || "Group gift",
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Donation processing failed. Please try again." },
        { status: 502 }
      )
    }

    await supabase
      .from("gift_settlements")
      .update({ status: "completed" })
      .eq("id", settlement.id)

    if (RESEND_API_KEY && organizerEmail) {
      try {
        const resend = new Resend(RESEND_API_KEY)
        const from = process.env.TRANSPARENCY_EMAIL_FROM?.trim() || DEFAULT_FROM
        await sendInstantDonationEmail(
          {
            donorName: organizerName,
            donorEmail: organizerEmail,
            charityName: b.charityName,
            netAmount: netToCharity,
            feeAmount: fee,
            totalCharged: totalCharged,
            transactionId: settlement.id,
            charityEIN: b.charityId ? getCharityEin(b.charityId) : null,
            coverFees: feeCovered,
            disposition: "charity",
            receiptUrl,
            eventName: b.giftName || gift.collection_title || gift.gift_name || "Group gift",
          },
          { resend, from }
        )
      } catch (e) {
        console.error("[process-instant] Email error:", e)
      }
    }

    if (RESEND_API_KEY) {
      try {
        await checkAndTriggerRecipientNotification(giftId, {
          resend: new Resend(RESEND_API_KEY),
          from: process.env.TRANSPARENCY_EMAIL_FROM?.trim() || DEFAULT_FROM,
        })
      } catch (e) {
        console.error("[process-instant] Recipient notification check error:", e)
      }
    }

    return NextResponse.json({
      success: true,
      transactionId: settlement.id,
      settlementId: settlement.id,
      receiptUrl,
      amount: netToCharity,
      fee,
      feeCovered,
    })
  } catch (err) {
    console.error("[process-instant]", err)
    return NextResponse.json(
      { error: "Failed to process donation" },
      { status: 500 }
    )
  }
}
