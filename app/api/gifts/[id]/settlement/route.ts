import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { sendInstantDonationEmail } from "@/lib/email-service"
import { checkAndTriggerRecipientNotification } from "@/lib/recipient-notification-service"
import { notifyContributorsOfCompletion } from "@/lib/contributor-impact-service"
import { Resend } from "resend"

const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim()
import { getServerBaseUrl } from "@/lib/base-url"

export const dynamic = "force-dynamic"

type SettlementDisposition = "charity" | "tip" | "bonus"

/**
 * POST /api/gifts/[id]/settlement
 * Creates a gift settlement record (donation, tip, or bonus) for receipt display.
 * Body: { amount, disposition, charityName?, dedication?, recipientName, giftName, totalFundsCollected, finalGiftPrice }
 * Returns: { id, ... } with the created settlement record.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: giftId } = await params
    if (!giftId) {
      return NextResponse.json({ error: "Gift ID is required" }, { status: 400 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Body must be a JSON object" }, { status: 400 })
    }

    const b = body as {
      amount?: number
      disposition?: string
      charityId?: string
      charityName?: string
      dedication?: string
      recipientName?: string
      recipientEmail?: string
      giftName?: string
      totalFundsCollected?: number
      finalGiftPrice?: number
      claimUrl?: string
      orderId?: string
    }

    const amount = Number(b.amount)
    const disposition = (b.disposition || "charity") as SettlementDisposition

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 })
    }

    if (!["charity", "tip", "bonus"].includes(disposition)) {
      return NextResponse.json({ error: "Invalid disposition (charity, tip, or bonus)" }, { status: 400 })
    }

    const supabase = await createClient()
    const admin = createAdminClient()
    const dbForRead = admin || supabase

    // Verify gift exists
    const { data: gift, error: giftError } = await dbForRead
      .from("gifts")
      .select("id, user_id, collection_title, gift_name")
      .eq("id", giftId)
      .single()

    if (giftError || !gift) {
      return NextResponse.json({ error: "Gift not found" }, { status: 404 })
    }

    const dedicationText = b.dedication || (disposition === "charity" && b.giftName
      ? `On behalf of the ${b.giftName} group via Wishbee.ai`
      : null)

    // Use supabase (RLS) for insert - only gift owner can create settlements
    // status column (when present via migration 020) defaults to 'pending_pool' for charity
    const insertPayload: Record<string, unknown> = {
      gift_id: giftId,
      amount: Math.round(amount * 100) / 100,
      disposition,
      charity_id: disposition === "charity" ? (b.charityId || null) : null,
      charity_name: disposition === "charity" ? (b.charityName || null) : null,
      dedication: dedicationText,
      recipient_name: b.recipientName || null,
      recipient_email: disposition === "bonus" ? (b.recipientEmail || null) : null,
      gift_name: b.giftName || gift.collection_title || gift.gift_name || null,
      total_funds_collected: b.totalFundsCollected != null ? Number(b.totalFundsCollected) : null,
      final_gift_price: b.finalGiftPrice != null ? Number(b.finalGiftPrice) : null,
    }
    if (disposition === "tip") {
      insertPayload.status = "completed"
    }
    if (disposition === "bonus") {
      if (b.claimUrl) insertPayload.claim_url = b.claimUrl
      if (b.orderId) insertPayload.order_id = b.orderId
      insertPayload.status = "completed"
    }
    const { data: settlement, error: insertError } = await supabase
      .from("gift_settlements")
      .insert(insertPayload)
      .select()
      .single()

    if (insertError) {
      console.error("[settlement] Insert error:", insertError)
      return NextResponse.json(
        { error: insertError.message || "Failed to save settlement" },
        { status: 500 }
      )
    }

    if (RESEND_API_KEY && admin) {
      const resend = new Resend(RESEND_API_KEY)
      const from = process.env.TRANSPARENCY_EMAIL_FROM?.trim() || "Wishbee <onboarding@resend.dev>"
      try {
        await checkAndTriggerRecipientNotification(giftId, { resend, from })
      } catch (e) {
        console.error("[settlement] Recipient notification check error:", e)
      }
      try {
        await notifyContributorsOfCompletion(giftId, { resend, from })
      } catch (e) {
        console.error("[settlement] Contributor impact notification error:", e)
      }
    }

    if (disposition === "tip" && RESEND_API_KEY && admin && gift.user_id) {
      try {
        const { data } = await admin.auth.admin.getUserById(gift.user_id)
        const user = data?.user
        if (user?.email) {
          const resend = new Resend(RESEND_API_KEY)
          const from = process.env.TRANSPARENCY_EMAIL_FROM?.trim() || "Wishbee <onboarding@resend.dev>"
          const donorName =
            (user.user_metadata?.full_name as string) ||
            (user.user_metadata?.name as string) ||
            user.email.split("@")[0]
          const receiptUrl = `${getServerBaseUrl()}/gifts/${giftId}/receipt/${settlement.id}`
          await sendInstantDonationEmail(
            {
              donorName,
              donorEmail: user.email,
              charityName: "Wishbee",
              netAmount: Number(settlement.amount),
              feeAmount: 0,
              totalCharged: Number(settlement.amount),
              transactionId: settlement.id,
              charityEIN: null,
              coverFees: true,
              disposition: "tip",
              receiptUrl,
              eventName: b.giftName || gift.collection_title || gift.gift_name || "Group gift",
            },
            { resend, from }
          )
        }
      } catch (e) {
        console.error("[settlement] Tip receipt email error:", e)
      }
    }

    return NextResponse.json({
      success: true,
      settlement: {
        id: settlement.id,
        giftId: settlement.gift_id,
        amount: Number(settlement.amount),
        disposition: settlement.disposition,
        charityName: settlement.charity_name,
        dedication: settlement.dedication,
        recipientName: settlement.recipient_name,
        claimUrl: (settlement as { claim_url?: string }).claim_url ?? null,
        orderId: (settlement as { order_id?: string }).order_id ?? null,
        giftName: settlement.gift_name,
        totalFundsCollected: settlement.total_funds_collected != null ? Number(settlement.total_funds_collected) : null,
        finalGiftPrice: settlement.final_gift_price != null ? Number(settlement.final_gift_price) : null,
        createdAt: settlement.created_at,
      },
    })
  } catch (err) {
    console.error("[settlement] POST error:", err)
    return NextResponse.json(
      { error: "Failed to save settlement" },
      { status: 500 }
    )
  }
}
