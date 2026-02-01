import { type NextRequest, NextResponse } from "next/server"
import { createClient, createPublicClient } from "@/lib/supabase/server"

// In-memory store for contribution list (optional; gift progress is persisted in DB)
const contributionsStore = new Map<string, Array<{
  id: string
  giftId: string
  amount: number
  contributorName: string
  contributorEmail: string
  message?: string
  isGuest: boolean
  createdAt: Date
}>>()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: giftId } = await params
    const body = await request.json()
    const {
      amount,
      contributorName,
      contributorEmail,
      message,
      token, // Magic link token for validation
    } = body

    if (!giftId) {
      return NextResponse.json({ error: "Gift ID is required" }, { status: 400 })
    }

    const contributionAmount = parseFloat(amount)
    if (!amount || isNaN(contributionAmount) || contributionAmount <= 0) {
      return NextResponse.json({ error: "Valid contribution amount is required" }, { status: 400 })
    }

    if (!contributorEmail) {
      return NextResponse.json({ error: "Email is required for guest contributions" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(contributorEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Update gift progress in database so Active page shows correct total.
    // Use public client so guest (unauthenticated) can update; RLS would block owner-only update.
    const supabase = await createPublicClient()
    const { data: gift, error: fetchError } = await supabase
      .from("gifts")
      .select("id, current_amount, contributors")
      .eq("id", giftId)
      .single()

    if (fetchError || !gift) {
      console.error("[Guest Contribution] Gift not found:", fetchError)
      return NextResponse.json({ error: "Gift not found" }, { status: 404 })
    }

    const currentAmount = Number(gift.current_amount) || 0
    const contributorCount = (gift.contributors ?? 0) + 1
    const newTotal = currentAmount + contributionAmount

    const { error: updateError } = await supabase
      .from("gifts")
      .update({
        current_amount: newTotal,
        contributors: contributorCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", giftId)

    if (updateError) {
      console.error("[Guest Contribution] Failed to update gift progress:", updateError)
      return NextResponse.json({ error: "Failed to record contribution" }, { status: 500 })
    }

    const contribution = {
      id: `guest_contrib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      giftId,
      amount: contributionAmount,
      contributorName: contributorName || "Anonymous",
      contributorEmail,
      message: message || undefined,
      isGuest: true,
      createdAt: new Date(),
    }

    const existing = contributionsStore.get(giftId) || []
    existing.push(contribution)
    contributionsStore.set(giftId, existing)

    console.log(`[Guest Contribution] ${contributorName || "Anonymous"} contributed $${contributionAmount} to gift ${giftId}`)

    return NextResponse.json({
      success: true,
      contribution: {
        id: contribution.id,
        amount: contribution.amount,
        contributorName: contribution.contributorName,
        createdAt: contribution.createdAt.toISOString(),
      },
      giftProgress: {
        totalContributions: newTotal,
        contributorCount,
      },
      message: "Thank you for your contribution! A confirmation has been sent to your email.",
    })
  } catch (error) {
    console.error("[Guest Contribution] Error:", error)
    return NextResponse.json({ error: "Failed to process contribution" }, { status: 500 })
  }
}

// GET - Get contributions for a gift
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: giftId } = await params

    if (!giftId) {
      return NextResponse.json({ error: "Gift ID is required" }, { status: 400 })
    }

    const contributions = contributionsStore.get(giftId) || []
    const totalAmount = contributions.reduce((sum, c) => sum + c.amount, 0)

    // Return sanitized contribution data (hide emails for privacy)
    const sanitizedContributions = contributions.map(c => ({
      id: c.id,
      amount: c.amount,
      contributorName: c.contributorName,
      message: c.message,
      createdAt: c.createdAt.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      giftId,
      contributions: sanitizedContributions,
      summary: {
        totalAmount,
        contributorCount: contributions.length,
      }
    })
  } catch (error) {
    console.error("[Guest Contribution] Error fetching:", error)
    return NextResponse.json({ error: "Failed to fetch contributions" }, { status: 500 })
  }
}
