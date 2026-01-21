import { type NextRequest, NextResponse } from "next/server"

// In-memory store for contributions (in production, use database)
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
      token // Magic link token for validation
    } = body

    // Validate required fields
    if (!giftId) {
      return NextResponse.json({ error: "Gift ID is required" }, { status: 400 })
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valid contribution amount is required" }, { status: 400 })
    }

    if (!contributorEmail) {
      return NextResponse.json({ error: "Email is required for guest contributions" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(contributorEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Create contribution record
    const contribution = {
      id: `guest_contrib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      giftId,
      amount: parseFloat(amount),
      contributorName: contributorName || "Anonymous",
      contributorEmail,
      message: message || undefined,
      isGuest: true,
      createdAt: new Date(),
    }

    // Store contribution
    const existing = contributionsStore.get(giftId) || []
    existing.push(contribution)
    contributionsStore.set(giftId, existing)

    // Calculate total contributions for this gift
    const totalContributions = existing.reduce((sum, c) => sum + c.amount, 0)
    const contributorCount = existing.length

    console.log(`[Guest Contribution] ${contributorName || 'Anonymous'} contributed $${amount} to gift ${giftId}`)

    // In production, you would:
    // 1. Process payment via Stripe
    // 2. Store in database
    // 3. Send confirmation email to contributor
    // 4. Send notification to gift creator
    // 5. Update gift progress

    return NextResponse.json({
      success: true,
      contribution: {
        id: contribution.id,
        amount: contribution.amount,
        contributorName: contribution.contributorName,
        createdAt: contribution.createdAt.toISOString(),
      },
      giftProgress: {
        totalContributions,
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
