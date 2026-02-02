import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * GET /api/gifts/[id]
 * Returns a single gift by ID. Only the gift owner can read (RLS).
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

    const supabase = await createClient()
    const { data: gift, error } = await supabase
      .from("gifts")
      .select("*")
      .eq("id", giftId)
      .single()

    if (error || !gift) {
      return NextResponse.json(
        { error: "Gift not found" },
        { status: 404 }
      )
    }

    const deadline = gift.deadline ? new Date(gift.deadline).getTime() : 0
    const daysLeft = Math.max(
      0,
      Math.ceil((deadline - Date.now()) / (24 * 60 * 60 * 1000))
    )

    const evite = (gift.evite_settings as Record<string, unknown>) || {}
    const token = evite.magicLinkToken as string | undefined
    const expiresAt = evite.magicLinkExpiresAt as string | undefined
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"
    const contributeUrl =
      token && expiresAt && new Date(expiresAt) > new Date()
        ? `${baseUrl}/gifts/contribute/${giftId}?token=${token}`
        : undefined

    return NextResponse.json({
      success: true,
      gift: {
        id: gift.id,
        name: gift.collection_title || gift.gift_name,
        giftName: gift.gift_name,
        collectionTitle: gift.collection_title,
        description: gift.description,
        image: gift.banner_image || gift.product_image || "/placeholder.svg",
        targetAmount: Number(gift.target_amount),
        currentAmount: Number(gift.current_amount),
        contributors: gift.contributors ?? 0,
        daysLeft,
        deadline: gift.deadline,
        created_at: gift.created_at,
        status: gift.status,
        recipientName: gift.recipient_name,
        occasion: gift.occasion,
        contributeUrl,
      },
    })
  } catch (err) {
    console.error("[gifts/[id]] GET error:", err)
    return NextResponse.json(
      { error: "Failed to load gift" },
      { status: 500 }
    )
  }
}
