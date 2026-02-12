import { type NextRequest, NextResponse } from "next/server"
import { getBalance } from "@/lib/reloadly"

export const dynamic = "force-dynamic"

/**
 * GET /api/gifts/[id]/reloadly-balance?amount=25.00
 * Returns Reloadly wallet balance and whether we can fulfill a gift card for the given amount.
 * Use before showing the Gift Card option; if canFulfillGiftCard is false, show Wishbee Credits instead.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params
    const amountParam = request.nextUrl.searchParams.get("amount")
    const amount = amountParam != null ? Number(amountParam) : NaN
    if (isNaN(amount) || amount < 0) {
      return NextResponse.json(
        { error: "Query param 'amount' (number >= 0) is required" },
        { status: 400 }
      )
    }
    const { balance, currencyCode } = await getBalance()
    const canFulfillGiftCard = balance >= amount
    return NextResponse.json({
      balance,
      currencyCode,
      requestedAmount: amount,
      canFulfillGiftCard,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to get Reloadly balance"
    console.error("[reloadly-balance]", e)
    return NextResponse.json(
      { error: message, canFulfillGiftCard: false },
      { status: 502 }
    )
  }
}
