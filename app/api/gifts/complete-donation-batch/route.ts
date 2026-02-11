import { type NextRequest, NextResponse } from "next/server"
import {
  completeBatchAndSendImpactEmails,
  selectPendingBatchByCharity,
} from "@/lib/monthly-donation-service"
import { getCharityById } from "@/lib/charity-data"

export const dynamic = "force-dynamic"

/**
 * POST /api/gifts/complete-donation-batch
 * Completes a pooled donation batch for a charity and sends impact emails.
 *
 * Body: { charityId: string, collectiveReceiptUrl?: string }
 */
export async function POST(request: NextRequest) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const b = body as { charityId?: string; collectiveReceiptUrl?: string }
    const charityId = b?.charityId

    if (!charityId || typeof charityId !== "string") {
      return NextResponse.json(
        { error: "charityId is required" },
        { status: 400 }
      )
    }

    const charityName = getCharityById(charityId)?.name ?? charityId

    const result = await completeBatchAndSendImpactEmails(
      charityId,
      charityName,
      b.collectiveReceiptUrl
    )

    return NextResponse.json({
      success: true,
      batchId: result.batchId,
      updated: result.updated,
      emailsSent: result.emailsSent,
      errors: result.errors.length > 0 ? result.errors : undefined,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to complete batch"
    console.error("[complete-donation-batch]", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * GET /api/gifts/complete-donation-batch?charityId=feeding-america
 * Returns pending batch summary for a charity (for admin/preview).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const charityId = searchParams.get("charityId")

    if (!charityId) {
      return NextResponse.json(
        { error: "charityId query param is required" },
        { status: 400 }
      )
    }

    const records = await selectPendingBatchByCharity(charityId)

    return NextResponse.json({
      success: true,
      charityId,
      pendingCount: records.length,
      totalAmount: records.reduce((sum, r) => sum + Number(r.amount), 0),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch pending batch"
    console.error("[complete-donation-batch GET]", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
