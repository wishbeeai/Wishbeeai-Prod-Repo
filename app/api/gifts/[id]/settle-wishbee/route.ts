import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { checkAndTriggerRecipientNotification } from "@/lib/recipient-notification-service"
import { notifyContributorsOfCompletion } from "@/lib/contributor-impact-service"
import { getReloadlyClient } from "@/lib/reloadly"
import { processStoreCredits } from "@/lib/actions/settle"
import { Resend } from "resend"

const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim()
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
const RELOADLY_DEFAULT_PRODUCT_ID = process.env.RELOADLY_DEFAULT_PRODUCT_ID?.trim()

export const dynamic = "force-dynamic"

/**
 * POST /api/gifts/[id]/settle-wishbee
 * 1. Call Reloadly placeOrder for the gift amount → save bonus settlement with redeemCode/claimUrl.
 * 2. On Reloadly failure (e.g. balance too low), issue Wishbee Credits to contributors instead.
 * 3. If leftover balance > 0, call existing charity logic (separate).
 * 4. Mark gift status as 'settled' (or 'settled_credits' when fallback) only after succeed.
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
      productId?: number
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
        { error: "recipientEmail is required for gift card delivery" },
        { status: 400 }
      )
    }

    let productId: number | null =
      typeof b.productId === "number" && !isNaN(b.productId) ? b.productId : null
    if (productId == null && RELOADLY_DEFAULT_PRODUCT_ID) {
      productId = parseInt(RELOADLY_DEFAULT_PRODUCT_ID, 10)
    }
    if (productId == null || isNaN(productId)) {
      try {
        const products = await getReloadlyClient().getProducts()
        const first = products[0] as { productId?: number } | undefined
        productId = first?.productId ?? null
      } catch {
        // ignore
      }
    }
    if (productId == null || isNaN(productId)) {
      return NextResponse.json(
        { error: "Reloadly product not configured. Send productId, set RELOADLY_DEFAULT_PRODUCT_ID, or ensure products are available." },
        { status: 502 }
      )
    }

    // ——— Step 1: Reloadly placeOrder for the gift amount ———
    const orderResult = await getReloadlyClient().createOrder({
      productId,
      amount,
      recipientEmail,
      recipientName,
    })

    if (!orderResult.success) {
      console.error("[settle-wishbee] Reloadly order failed:", orderResult.error)
      // Fallback: issue Wishbee Credits to contributors so the user isn't stuck
      try {
        const creditResult = await processStoreCredits(giftId, Math.round(amount * 100) / 100)
        if (creditResult.success) {
          return NextResponse.json({
            success: true,
            fallbackToCredits: true,
            message: "Gift card was unavailable; Wishbee Credits have been issued to contributors instead.",
            creditsIssuedCount: creditResult.creditsIssuedCount,
            failedCount: creditResult.failedCount,
            status: "settled_credits",
          })
        }
      } catch (fallbackErr) {
        console.error("[settle-wishbee] Fallback to credits failed:", fallbackErr)
      }
      return NextResponse.json(
        {
          error: orderResult.error || "Gift card creation failed. Please try again or use Store Credit instead.",
        },
        { status: 502 }
      )
    }

    const redeemCodeOrInfo = orderResult.redeemCode ?? orderResult.infoText ?? null
    const claimUrl = orderResult.claimUrl ?? null

    // ——— Step 2: Save bonus settlement with redeemCode/claimUrl and orderId ———
    const insertPayload = {
      gift_id: giftId,
      amount: Math.round(amount * 100) / 100,
      disposition: "bonus" as const,
      claim_url: claimUrl,
      order_id: orderResult.orderId,
      gc_claim_code: redeemCodeOrInfo,
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
            claimUrl: claimUrl ?? (settlement as { claim_url?: string }).claim_url,
          },
          { status: 502 }
        )
      }
    }

    // ——— Step 4: Mark as SETTLED only after BOTH (Reloadly + charity when applicable) succeed ———
    const { error: updateError } = await supabase
      .from("gifts")
      .update({ status: "settled" })
      .eq("id", giftId)

    if (updateError) {
      console.error("[settle-wishbee] Failed to mark gift as settled:", updateError)
      return NextResponse.json(
        { error: "Settlement saved but status update failed", claimUrl: claimUrl ?? (settlement as { claim_url?: string }).claim_url, settlementId: settlement.id },
        { status: 500 }
      )
    }

    if (RESEND_API_KEY && admin) {
      const resend = new Resend(RESEND_API_KEY)
      const from = process.env.TRANSPARENCY_EMAIL_FROM?.trim() || "Wishbee <onboarding@resend.dev>"
      // Send gift card delivery email to recipient (claim link) immediately
      try {
        const claimLink = claimUrl ?? (settlement as { claim_url?: string }).claim_url
        const redeemCode = (settlement as { gc_claim_code?: string }).gc_claim_code ?? orderResult.redeemCode ?? orderResult.infoText
        if (recipientEmail && (claimLink || redeemCode)) {
          const claimHtml = claimLink
            ? `<p style="margin: 0 0 20px; font-size: 15px; color: #654321;">Your gift card is ready. Click the button below to claim it.</p>
  <p style="margin: 0 0 24px; text-align: center;"><a href="${claimLink}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #DAA520 0%, #F4C430 100%); color: #654321; font-weight: 700; font-size: 15px; text-decoration: none; border-radius: 12px;">Claim your gift card</a></p>`
            : redeemCode
              ? `<p style="margin: 0 0 20px; font-size: 15px; color: #654321;">Your gift card code:</p><p style="margin: 0 0 24px; font-size: 18px; font-weight: 700; letter-spacing: 2px;">${redeemCode}</p>`
              : ""
          if (claimHtml) {
            const html = `<!DOCTYPE html><html><body style="margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F5F1E8;"><div style="max-width:560px; margin:0 auto; padding:24px;"><table role="presentation" width="100%" style="background:#fff; border-radius:16px; box-shadow:0 10px 40px rgba(101,67,33,0.12);"><tr><td style="padding:28px 24px; background: linear-gradient(135deg, #DAA520 0%, #F4C430 100%); text-align:center;"><h1 style="margin:0; font-size:22px; font-weight:700; color:#fff;">Your gift card is ready</h1></td></tr><tr><td style="padding:28px 24px;"><p style="margin:0 0 20px; font-size:15px; color:#8B4513;">Hi ${recipientName},</p>${claimHtml}<p style="margin:0; font-size:12px; color:#8B4513;">— Wishbee</p></td></tr></table></div></body></html>`
            await resend.emails.send({
              from,
              to: recipientEmail,
              subject: `Your gift card is ready, ${recipientName}!`,
              html,
            })
          }
        }
      } catch (e) {
        console.error("[settle-wishbee] Gift card delivery email error:", e)
      }
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

    const settlementRow = settlement as { claim_url?: string; order_id?: string; gc_claim_code?: string }
    return NextResponse.json({
      success: true,
      claimUrl: claimUrl ?? settlementRow.claim_url,
      orderId: orderResult.orderId ?? settlementRow.order_id,
      redeemCode: orderResult.redeemCode ?? settlementRow.gc_claim_code,
      infoText: orderResult.infoText ?? settlementRow.gc_claim_code,
      status: "settled",
      settlement: {
        id: settlement.id,
        giftId: settlement.gift_id,
        amount: Number(settlement.amount),
        disposition: settlement.disposition,
        claimUrl: settlementRow.claim_url ?? claimUrl,
        orderId: settlementRow.order_id ?? orderResult.orderId,
        redeemCode: settlementRow.gc_claim_code ?? orderResult.redeemCode ?? orderResult.infoText,
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
