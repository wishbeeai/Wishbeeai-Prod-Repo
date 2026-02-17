import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@/lib/supabase/server"
import { getServerBaseUrl } from "@/lib/base-url"

// In-memory cache for magic links (DB is source of truth; cache avoids DB read on every validate)
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

// POST - Generate a new magic link for a gift (persisted in gift.evite_settings)
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

    const token = generateToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)

    const settings = {
      enableReminders,
      colorTheme,
      invitationMessage,
    }

    // Persist in database so link survives server restarts
    const supabase = await createClient()
    const { data: existingGift, error: fetchError } = await supabase
      .from('gifts')
      .select('id, evite_settings')
      .eq('id', giftId)
      .single()

    if (fetchError || !existingGift) {
      console.error("[Magic Link] Gift not found or error:", fetchError)
      return NextResponse.json({ error: "Gift not found" }, { status: 404 })
    }

    const existingEvite = (existingGift.evite_settings as Record<string, unknown>) || {}
    const updatedEvite = {
      ...existingEvite,
      ...settings,
      magicLinkToken: token,
      magicLinkExpiresAt: expiresAt.toISOString(),
    }

    const { error: updateError } = await supabase
      .from('gifts')
      .update({ evite_settings: updatedEvite, updated_at: new Date().toISOString() })
      .eq('id', giftId)

    if (updateError) {
      console.error("[Magic Link] Failed to save token to DB:", updateError)
      return NextResponse.json({ error: "Failed to generate magic link" }, { status: 500 })
    }

    // Also cache in memory for fast validation in same process
    magicLinkStore.set(token, {
      giftId,
      token,
      expiresAt,
      createdAt: new Date(),
      settings,
    })

    const baseUrl = getServerBaseUrl()
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

// GET - Validate a magic link token (from memory or from gift.evite_settings in DB)
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

    let magicLink = magicLinkStore.get(token)

    // If not in memory, validate from database (link survives server restarts)
    if (!magicLink) {
      const supabase = await createClient()
      const { data: gift, error } = await supabase
        .from('gifts')
        .select('*')
        .eq('id', giftId)
        .single()

      if (error || !gift) {
        return NextResponse.json({
          valid: false,
          error: "Invalid or expired link",
        }, { status: 404 })
      }

      const evite = (gift.evite_settings as Record<string, unknown>) || {}
      const storedToken = evite.magicLinkToken as string | undefined
      const expiresAtStr = evite.magicLinkExpiresAt as string | undefined

      if (!storedToken || storedToken !== token) {
        return NextResponse.json({
          valid: false,
          error: "Invalid or expired link",
        }, { status: 404 })
      }

      const expiresAt = expiresAtStr ? new Date(expiresAtStr) : new Date(0)
      if (new Date() > expiresAt) {
        return NextResponse.json({
          valid: false,
          error: "This link has expired",
        }, { status: 410 })
      }

      magicLink = {
        giftId,
        token,
        expiresAt,
        createdAt: new Date(evite.magicLinkCreatedAt as string || 0),
        settings: {
          enableReminders: (evite.enableReminders as boolean) ?? true,
          colorTheme: (evite.colorTheme as string) || 'gold',
          invitationMessage: (evite.invitationMessage as string) || '',
        },
      }
    }

    // Check if expired (in-memory path)
    if (new Date() > magicLink.expiresAt) {
      magicLinkStore.delete(token)
      return NextResponse.json({
        valid: false,
        error: "This link has expired",
      }, { status: 410 })
    }

    if (magicLink.giftId !== giftId) {
      return NextResponse.json({
        valid: false,
        error: "Link does not match this gift",
      }, { status: 403 })
    }

    // Fetch gift details from database (for both paths so banner/amount etc. are current)
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
          collectionTitle: gift.collection_title || 'Gift Collection',
          giftName: gift.gift_name || 'Special Gift',
          description: gift.description || 'Help make this gift possible!',
          targetAmount: Number(gift.target_amount) || 500,
          currentAmount: Number(gift.current_amount) || 0,
          contributors: gift.contributors ?? 0,
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
