import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient, createPublicClient } from "@/lib/supabase/server"
import { getContributionsForGift, addContribution } from "@/lib/gift-contributions-store"
import { getCreditBalance, spendCredits } from "@/lib/user-credits"

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
      useCredits, // Use Wishbee Credits when logged in and balance >= amount
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

    if (useCredits === true) {
      const authClient = await createClient()
      const { data: { user } } = await authClient.auth.getUser()
      if (!user?.id) {
        return NextResponse.json({ error: "You must be signed in to use Wishbee Credits." }, { status: 401 })
      }
      const balance = await getCreditBalance(user.id)
      if (balance < contributionAmount) {
        return NextResponse.json({
          error: `Insufficient Wishbee Credits. Balance: $${balance.toFixed(2)}. Need: $${contributionAmount.toFixed(2)}.`,
        }, { status: 400 })
      }
      const spendResult = await spendCredits(user.id, contributionAmount, giftId)
      if (!spendResult.success) {
        return NextResponse.json({ error: spendResult.error ?? "Failed to spend credits." }, { status: 400 })
      }
    }

    // Update gift progress in database. Prefer admin client so unauthenticated guests can update (RLS blocks anon).
    let supabase = createAdminClient()
    const usingAdmin = !!supabase
    if (!supabase) {
      supabase = await createPublicClient()
    }
    console.log(`[Guest Contribution] gift ${giftId} using ${usingAdmin ? "admin" : "public"} client`)
    const { data: gift, error: fetchError } = await supabase
      .from("gifts")
      .select("id, current_amount, contributors, evite_settings")
      .eq("id", giftId)
      .single()

    if (fetchError || !gift) {
      console.error("[Guest Contribution] Gift not found:", fetchError)
      return NextResponse.json({ error: "Gift not found" }, { status: 404 })
    }

    const currentAmount = Number(gift.current_amount) || 0
    const contributorCount = (gift.contributors ?? 0) + 1
    const newTotal = currentAmount + contributionAmount

    // Append to contribution list stored on the gift (no separate tables required).
    const evite = (gift.evite_settings as Record<string, unknown>) || {}
    const list = Array.isArray(evite.contributionList) ? [...(evite.contributionList as { name?: string; email?: string; amount?: number; time?: string }[])] : []
    list.unshift({
      name: contributorName || "Anonymous",
      email: contributorEmail.trim(),
      amount: contributionAmount,
      time: new Date().toISOString(),
    })
    const eviteUpdated = { ...evite, contributionList: list.slice(0, 50) }

    const { error: updateError } = await supabase
      .from("gifts")
      .update({
        current_amount: newTotal,
        contributors: contributorCount,
        evite_settings: eviteUpdated,
        updated_at: new Date().toISOString(),
      })
      .eq("id", giftId)

    if (updateError) {
      console.error("[Guest Contribution] Failed to update gift progress:", updateError?.message ?? updateError, "code:", (updateError as { code?: string })?.code)
      const msg =
        (updateError as { code?: string }).code === "PGRST301" || String(updateError).includes("policy")
          ? "Contributions are not available. The server needs SUPABASE_SERVICE_ROLE_KEY set for guest contributions."
          : "Failed to record contribution"
      return NextResponse.json({ error: msg }, { status: 500 })
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

    addContribution(giftId, contribution)

    const dbForWrites = createAdminClient() || supabase

    // Store each contribution for "Recent Contributions" display. Base columns (014); run 015 to add contributor_email.
    try {
      const { error: insertErr } = await dbForWrites.from("gift_contributions").insert({
        gift_id: giftId,
        contributor_name: contributorName || null,
        contributor_email: contributorEmail.trim() || null,
        amount: contributionAmount,
      })
      if (insertErr) console.warn("[Guest Contribution] gift_contributions insert error:", insertErr.message)
    } catch (tableErr) {
      console.warn("[Guest Contribution] Could not save to gift_contributions (table may not exist):", tableErr)
    }

    // Persist contributor email for reminder emails (gift_contributor_emails).
    try {
      const { error: upsertErr } = await dbForWrites.from("gift_contributor_emails").upsert(
        {
          gift_id: giftId,
          email: contributorEmail.trim().toLowerCase(),
          contributor_name: contributorName || null,
          amount: contributionAmount,
        },
        { onConflict: "gift_id,email" }
      )
      if (upsertErr) console.warn("[Guest Contribution] gift_contributor_emails upsert error:", upsertErr.message)
    } catch (tableErr) {
      console.warn("[Guest Contribution] Could not save contributor email (table may not exist):", tableErr)
    }

    console.log(`[Guest Contribution] ${contributorName || "Anonymous"} contributed $${contributionAmount} to gift ${giftId} → new total $${newTotal}, ${contributorCount} contributors`)

    return NextResponse.json({
      success: true,
      paidWithCredits: useCredits === true,
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
      message: useCredits === true
        ? "Thank you! Your contribution was applied using Wishbee Credits."
        : "Thank you for your contribution! A confirmation has been sent to your email.",
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

    const contributions = getContributionsForGift(giftId)
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
