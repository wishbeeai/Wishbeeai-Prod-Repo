import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * GET /api/gifts/[id]/settlements
 * Returns all gift_settlements for the given gift (event), sorted by created_at descending.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: giftId } = await params
    if (!giftId) {
      return NextResponse.json({ error: "Gift ID is required" }, { status: 400 })
    }

    const admin = createAdminClient()
    let db = admin
    if (!db) {
      try {
        db = await createClient()
      } catch (e) {
        console.error("[settlements] createClient failed:", e)
        return NextResponse.json(
          { error: "Unable to load settlements. Please sign in and try again." },
          { status: 500 }
        )
      }
    }

    const fullSelect =
      "id, amount, disposition, status, charity_id, charity_name, recipient_name, recipient_email, gc_claim_code, claim_url, order_id, created_at"
    let result = await db
      .from("gift_settlements")
      .select(fullSelect)
      .eq("gift_id", giftId)
      .order("created_at", { ascending: false })

    if (result.error) {
      console.error("[settlements] GET error (full select):", result.error.message, result.error.code)
      const code = (result.error as { code?: string }).code
      if (code === "42703" || (result.error.message && result.error.message.includes("column"))) {
        result = await db
          .from("gift_settlements")
          .select("id, amount, disposition, status, charity_name, recipient_name, created_at")
          .eq("gift_id", giftId)
          .order("created_at", { ascending: false })
      }
    }

    const { data: settlements, error } = result
    if (error) {
      console.error("[settlements] GET error:", error.message, error.code, error.details)
      const message = error?.message ?? "Failed to load settlements"
      return NextResponse.json({ error: message }, { status: 500 })
    }

    const list = (settlements || []).map((s: Record<string, unknown>) => ({
      id: s.id,
      amount: Number(s.amount),
      disposition: s.disposition,
      status: s.status ?? "completed",
      charityId: s.charity_id ?? null,
      charityName: s.charity_name ?? null,
      recipientName: s.recipient_name ?? null,
      recipientEmail: s.recipient_email ?? null,
      gcClaimCode: s.gc_claim_code ?? null,
      claimUrl: s.claim_url ?? null,
      orderId: s.order_id ?? null,
      createdAt: s.created_at,
    }))

    return NextResponse.json({ success: true, settlements: list })
  } catch (err) {
    console.error("[settlements] GET error:", err)
    const message = err instanceof Error ? err.message : "Failed to load settlements"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
