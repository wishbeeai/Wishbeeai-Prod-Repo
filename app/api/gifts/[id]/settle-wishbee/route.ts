import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { checkAndTriggerRecipientNotification } from "@/lib/recipient-notification-service"
import { notifyContributorsOfCompletion } from "@/lib/contributor-impact-service"
import { createTremendousReward } from "@/lib/tremendous"
import { Resend } from "resend"

const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim()
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

export const dynamic = "force-dynamic"

/**
 * POST /api/gifts/[id]/settle-wishbee
 * SettleWishbee server action:
 * 1. Call Tremendous for the gift amount first → save bonus settlement with claimUrl.
 * 2. If leftover balance > 0, call existing charity logic (separate; do NOT combine).
 * 3. Mark gift status as 'settled' only after BOTH calls succeed.
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
      recipientEmail?: string
      recipientName?: string
      giftName?: string
      totalFundsCollected?: number
      finalGiftPrice?: number
      leftoverAmount?: number
      charityId?: string
      charityName?: string
      coverFees?: boolean
    }

    const amount = Number(b.amount)
    if (isNaN(amount) || amount < 1) {
      return NextResponse.json(
        { error: "Valid gift amount of at least $1.00 is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const admin = createAdminClient()
    const dbForRead = admin || supabase

    const { data: gift, error: giftError } = await dbForRead
      .from("gifts")
      .select("id, user_id, collection_title, gift_name")
      .eq("id", giftId)
      .single()

    if (giftError || !gift) {
      return NextResponse.json({ error: "Gift not found" }, { status: 404 })
    }

    const recipientEmail = (b.recipientEmail ?? "").trim() || undefined
    const recipientName = (b.recipientName ?? "").trim() || "Recipient"
    if (!recipientEmail) {
      return NextResponse.json(
        { error: "recipientEmail is required for Tremendous link delivery" },
        { status: 400 }
      )
    }

    // ——— Step 1: Tremendous for the gift amount first ———
    const tremendousResult = await createTremendousReward({
      amount,
      recipientEmail,
      recipientName,
      externalId: `gift-${giftId}-bonus-${Date.now()}`,
    })

    if (!tremendousResult.success) {
      console.error("[settle-wishbee] Tremendous failed:", tremendousResult.error)
      return NextResponse.json(
        {
          error: tremendousResult.error || "Gift card creation failed. Please try again or contact support.",
        },
        { status: 502 }
      )
    }

    // ——— Step 2: Save bonus settlement with claimUrl (delivery.link) and orderId ———
    const insertPayload = {
      gift_id: giftId,
      amount: Math.round(amount * 100) / 100,
      disposition: "bonus" as const,
      claim_url: tremendousResult.claimUrl,
      order_id: tremendousResult.orderId,
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      gift_name: b.giftName ?? gift.collection_title ?? gift.gift_name ?? null,
      total_funds_collected: b.totalFundsCollected != null ? Number(b.totalFundsCollected) : null,
      final_gift_price: b.finalGiftPrice != null ? Number(b.finalGiftPrice) : null,
      status: "completed" as const,
    }

    const { data: settlement, error: insertError } = await supabase
      .from("gift_settlements")
      .insert(insertPayload)
      .select()
      .single()

    if (insertError) {
      console.error("[settle-wishbee] Insert error:", insertError)
      return NextResponse.json(
        { error: insertError.message || "Failed to save settlement" },
        { status: 500 }
      )
    }

    const leftoverAmount = Number(b.leftoverAmount)
    const hasLeftover = !isNaN(leftoverAmount) && leftoverAmount > 0
    const hasCharity = hasLeftover && b.charityId && b.charityName

    // ——— Step 3: If leftover, call existing charity logic (separate; do NOT combine) ———
    if (hasCharity) {
      const cookie = request.headers.get("cookie") ?? ""
      const charityRes = await fetch(`${BASE_URL}/api/donations/process-instant`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify({
          giftId,
          amount: leftoverAmount,
          charityId: b.charityId,
          charityName: b.charityName,
          feeCovered: b.coverFees === true,
          recipientName,
          giftName: b.giftName ?? gift.collection_title ?? gift.gift_name,
          totalFundsCollected: b.totalFundsCollected ?? null,
          finalGiftPrice: b.finalGiftPrice ?? null,
        }),
      })
      const charityData = await charityRes.json().catch(() => ({}))
      if (!charityRes.ok) {
        console.error("[settle-wishbee] Charity donation failed:", charityData?.error)
        return NextResponse.json(
          {
            error: charityData?.error ?? "Gift card was sent, but charity donation failed. Please retry the charity step.",
            bonusSettlementId: settlement.id,
            claimUrl: tremendousResult.claimUrl,
          },
          { status: 502 }
        )
      }
    }

    // ——— Step 4: Mark as SETTLED only after BOTH (Tremendous + charity when applicable) succeed ———
    const { error: updateError } = await supabase
      .from("gifts")
      .update({ status: "settled" })
      .eq("id", giftId)

    if (updateError) {
      console.error("[settle-wishbee] Failed to mark gift as settled:", updateError)
      return NextResponse.json(
        { error: "Settlement saved but status update failed", claimUrl: tremendousResult.claimUrl, settlementId: settlement.id },
        { status: 500 }
      )
    }

    if (RESEND_API_KEY && admin) {
      const resend = new Resend(RESEND_API_KEY)
      const from = process.env.TRANSPARENCY_EMAIL_FROM?.trim() || "Wishbee <onboarding@resend.dev>"
      try {
        await checkAndTriggerRecipientNotification(giftId, { resend, from })
      } catch (e) {
        console.error("[settle-wishbee] Recipient notification check error:", e)
      }
      try {
        await notifyContributorsOfCompletion(giftId, { resend, from })
      } catch (e) {
        console.error("[settle-wishbee] Contributor impact notification error:", e)
      }
    }

    return NextResponse.json({
      success: true,
      claimUrl: tremendousResult.claimUrl,
      orderId: tremendousResult.orderId,
      status: "settled",
      settlement: {
        id: settlement.id,
        giftId: settlement.gift_id,
        amount: Number(settlement.amount),
        disposition: settlement.disposition,
        claimUrl: (settlement as { claim_url?: string }).claim_url ?? tremendousResult.claimUrl,
        orderId: (settlement as { order_id?: string }).order_id ?? tremendousResult.orderId,
        recipientName: settlement.recipient_name,
        recipientEmail: settlement.recipient_email,
        createdAt: settlement.created_at,
      },
    })
  } catch (err) {
    console.error("[settle-wishbee] POST error:", err)
    return NextResponse.json(
      { error: "Failed to complete settle Wishbee" },
      { status: 500 }
    )
  }
}
