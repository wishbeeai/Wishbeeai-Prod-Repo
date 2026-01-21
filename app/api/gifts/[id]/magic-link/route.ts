import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@/lib/supabase/server"

// In-memory store for magic links (in production, use database)
const magicLinkStore = new Map<string, {
  giftId: string
  token: string
  expiresAt: Date
  createdAt: Date
  settings: {
    enableReminders: boolean
    colorTheme: string
    invitationMessage: string
  }
}>()

// Generate a secure magic link token
function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

// POST - Generate a new magic link for a gift
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: giftId } = await params
    const body = await request.json()
    const { 
      enableReminders = true, 
      colorTheme = 'gold',
      invitationMessage = '',
      expiresInDays = 30 
    } = body

    if (!giftId) {
      return NextResponse.json({ error: "Gift ID is required" }, { status: 400 })
    }

    // Generate unique token
    const token = generateToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)

    // Store the magic link
    magicLinkStore.set(token, {
      giftId,
      token,
      expiresAt,
      createdAt: new Date(),
      settings: {
        enableReminders,
        colorTheme,
        invitationMessage,
      }
    })

    // Generate the shareable URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"
    const magicLinkUrl = `${baseUrl}/gifts/contribute/${giftId}?token=${token}`

    console.log(`[Magic Link] Generated for gift ${giftId}:`, magicLinkUrl)

    return NextResponse.json({
      success: true,
      magicLink: {
        url: magicLinkUrl,
        token,
        expiresAt: expiresAt.toISOString(),
        giftId,
      }
    })
  } catch (error) {
    console.error("[Magic Link] Error generating:", error)
    return NextResponse.json({ error: "Failed to generate magic link" }, { status: 500 })
  }
}

// GET - Validate a magic link token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: giftId } = await params
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Look up the magic link
    const magicLink = magicLinkStore.get(token)

    if (!magicLink) {
      return NextResponse.json({ 
        valid: false, 
        error: "Invalid or expired link" 
      }, { status: 404 })
    }

    // Check if expired
    if (new Date() > magicLink.expiresAt) {
      magicLinkStore.delete(token)
      return NextResponse.json({ 
        valid: false, 
        error: "This link has expired" 
      }, { status: 410 })
    }

    // Check if gift ID matches
    if (magicLink.giftId !== giftId) {
      return NextResponse.json({ 
        valid: false, 
        error: "Link does not match this gift" 
      }, { status: 403 })
    }

    // Fetch gift details from database
    let giftDetails = null
    try {
      const supabase = await createClient()
      const { data: gift, error } = await supabase
        .from('gifts')
        .select('*')
        .eq('id', giftId)
        .single()
      
      if (!error && gift) {
        giftDetails = {
          id: gift.id,
          collectionTitle: gift.collection_title || gift.title || 'Gift Collection',
          giftName: gift.gift_name || gift.title || 'Special Gift',
          description: gift.description || 'Help make this gift possible!',
          targetAmount: gift.target_amount || 500,
          currentAmount: gift.current_amount || 0,
          contributors: gift.contributors_count || 0,
          deadline: gift.deadline,
          recipientName: gift.recipient_name,
          occasion: gift.occasion,
          bannerImage: gift.banner_image,
        }
      }
    } catch (dbError) {
      console.error("[Magic Link] Error fetching gift details:", dbError)
    }

    return NextResponse.json({
      valid: true,
      giftId: magicLink.giftId,
      settings: magicLink.settings,
      expiresAt: magicLink.expiresAt.toISOString(),
      giftDetails,
    })
  } catch (error) {
    console.error("[Magic Link] Error validating:", error)
    return NextResponse.json({ error: "Failed to validate link" }, { status: 500 })
  }
}
