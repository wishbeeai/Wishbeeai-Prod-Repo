import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * GET /api/gifts/[id]/settlement/[settlementId]
 * Returns a gift settlement record for donation receipt display.
 * Public read - anyone with the link can view the receipt.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; settlementId: string }> }
) {
  try {
    const { id: giftId, settlementId } = await params
    if (!giftId || !settlementId) {
      return NextResponse.json({ error: "Gift ID and settlement ID are required" }, { status: 400 })
    }

    const admin = createAdminClient()
    const supabase = admin || (await createClient())

    const { data: settlement, error } = await supabase
      .from("gift_settlements")
      .select("*")
      .eq("id", settlementId)
      .eq("gift_id", giftId)
      .single()

    if (error || !settlement) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      receipt: {
        id: settlement.id,
        giftId: settlement.gift_id,
        amount: Number(settlement.amount),
        disposition: settlement.disposition,
        charityName: settlement.charity_name,
        charityId: settlement.charity_id ?? null,
        dedication: settlement.dedication,
        recipientName: settlement.recipient_name,
        giftName: settlement.gift_name,
        totalFundsCollected: settlement.total_funds_collected != null ? Number(settlement.total_funds_collected) : null,
        finalGiftPrice: settlement.final_gift_price != null ? Number(settlement.final_gift_price) : null,
        createdAt: settlement.created_at,
      },
    })
  } catch (err) {
    console.error("[settlement] GET error:", err)
    return NextResponse.json(
      { error: "Failed to load receipt" },
      { status: 500 }
    )
  }
}
