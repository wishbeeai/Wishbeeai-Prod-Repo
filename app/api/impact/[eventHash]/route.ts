import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * GET /api/impact/[eventHash]
 * Resolves eventHash (impact_token) to gift ID.
 * Used by /impact/[eventHash] page to fetch impact data securely.
 * eventHash is non-guessable (64-char hex) to prevent indexing and random access.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventHash: string }> }
) {
  try {
    const { eventHash } = await params
    if (!eventHash?.trim()) {
      return NextResponse.json({ error: "Invalid link" }, { status: 400 })
    }

    const admin = createAdminClient()
    if (!admin) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    }

    const { data: gift, error } = await admin
      .from("gifts")
      .select("id")
      .eq("impact_token", eventHash.trim())
      .single()

    if (error || !gift) {
      return NextResponse.json({ error: "Link not found or expired" }, { status: 404 })
    }

    return NextResponse.json({ success: true, giftId: gift.id })
  } catch (err) {
    console.error("[impact] GET error:", err)
    return NextResponse.json({ error: "Failed to resolve link" }, { status: 500 })
  }
}
