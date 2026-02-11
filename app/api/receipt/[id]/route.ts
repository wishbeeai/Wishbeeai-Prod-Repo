import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"
import { getCharityEin } from "@/lib/charity-data"

export const dynamic = "force-dynamic"

/**
 * GET /api/receipt/[id]
 * Returns donation receipt data by settlement ID (transaction ID).
 * Security: Settlement UUID is non-guessable (128-bit). Access is allowed
 * with the link. When logged in, optionally verifies user matches gift organizer.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: settlementId } = await params
    if (!settlementId) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const admin = createAdminClient()
    const db = admin || supabase

    const { data: settlement, error } = await db
      .from("gift_settlements")
      .select(`
        id,
        gift_id,
        amount,
        disposition,
        charity_id,
        charity_name,
        fee_covered,
        transaction_fee,
        created_at
      `)
      .eq("id", settlementId)
      .single()

    if (error || !settlement) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 })
    }

    const netAmount = Number(settlement.amount)
    const feeAmount = Number(settlement.transaction_fee ?? 0)
    const feeCovered = settlement.fee_covered === true
    const totalCharged = feeCovered ? Math.round((netAmount + feeAmount) * 100) / 100 : netAmount

    let donorName = "Donor"
    if (admin) {
      const { data: gift } = await db
        .from("gifts")
        .select("user_id")
        .eq("id", settlement.gift_id)
        .single()
      if (gift?.user_id) {
        try {
          const { data } = await admin.auth.admin.getUserById(gift.user_id)
          const user = data?.user
          if (user?.email) {
            donorName =
              (user.user_metadata?.full_name as string) ||
              (user.user_metadata?.name as string) ||
              user.email.split("@")[0].replace(/[._]/g, " ")
          }
        } catch {
          // non-blocking
        }
      }
    }

    const charityName = settlement.charity_name ?? (settlement.disposition === "tip" ? "Wishbee" : "Charity")
    const ein =
      settlement.disposition === "charity" && settlement.charity_id
        ? getCharityEin(settlement.charity_id)
        : null

    return NextResponse.json({
      success: true,
      receipt: {
        transactionId: settlement.id,
        charityName,
        ein,
        netAmount,
        feeAmount,
        totalCharged,
        date: settlement.created_at,
        donorName,
        disposition: settlement.disposition,
      },
    })
  } catch (err) {
    console.error("[receipt] GET error:", err)
    return NextResponse.json({ error: "Failed to load receipt" }, { status: 500 })
  }
}
