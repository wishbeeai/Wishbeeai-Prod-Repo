import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getContributionsForGift } from "@/lib/gift-contributions-store"

export const dynamic = "force-dynamic"

/** Format date as relative time (e.g. "2 days ago") or short date */
function formatContributionTime(iso: string): string {
  const d = new Date(iso)
  const now = Date.now()
  const diffMs = now - d.getTime()
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} wk ago`
  return d.toLocaleDateString()
}

/**
 * GET /api/gifts/[id]
 * Returns a single gift by ID. Includes organizer display name and recent contributions when available.
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

    // Parse evite_settings (may be object or JSON string from DB)
    let evite: Record<string, unknown> = {}
    if (gift.evite_settings != null) {
      if (typeof gift.evite_settings === "string") {
        try {
          evite = JSON.parse(gift.evite_settings) as Record<string, unknown>
        } catch {
          evite = {}
        }
      } else {
        evite = (gift.evite_settings as Record<string, unknown>) || {}
      }
    }
    const token = evite.magicLinkToken as string | undefined
    const expiresAt = evite.magicLinkExpiresAt as string | undefined
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"
    const contributeUrl =
      token && expiresAt && new Date(expiresAt) > new Date()
        ? `${baseUrl}/gifts/contribute/${giftId}?token=${token}`
        : undefined

    let organizerDisplayName = "Gift organizer"
    const admin = createAdminClient()
    if (admin && gift.user_id) {
      try {
        const { data: { user } } = await admin.auth.admin.getUserById(gift.user_id)
        if (user?.user_metadata?.full_name) {
          organizerDisplayName = String(user.user_metadata.full_name)
        } else if (user?.user_metadata?.name) {
          organizerDisplayName = String(user.user_metadata.name)
        } else if (user?.email) {
          organizerDisplayName = user.email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        }
      } catch {
        // keep default
      }
    }

    type ContributionEntry = { name: string; email?: string; amount: number; time: string; sortKey: number }
    const recentContributionsMap = new Map<string, ContributionEntry>()

    // Primary source: contribution list stored on the gift (evite_settings.contributionList) — no separate tables required.
    const contributionList = Array.isArray(evite.contributionList) ? (evite.contributionList as { name?: string; email?: string; amount?: number; time?: string }[]) : []
    for (const c of contributionList) {
      const time = c.time || ""
      const key = `${c.name ?? "Anonymous"}-${c.email ?? ""}-${c.amount ?? 0}-${time}`
      if (!recentContributionsMap.has(key)) {
        recentContributionsMap.set(key, {
          name: c.name || "Anonymous",
          email: c.email || undefined,
          amount: Number(c.amount) || 0,
          time: time ? formatContributionTime(time) : "Recently",
          sortKey: time ? new Date(time).getTime() : 0,
        })
      }
    }

    const adminClient = createAdminClient()
    const dbClient = adminClient || supabase

    // Merge: gift_contributions (if table exists).
    try {
      const { data: contributionRows } = await dbClient
        .from("gift_contributions")
        .select("*")
        .eq("gift_id", giftId)
        .order("created_at", { ascending: false })
        .limit(20)
      if (contributionRows?.length) {
        for (const r of contributionRows as { contributor_name?: string; contributor_email?: string; amount: number; created_at: string }[]) {
          const key = `${r.contributor_name ?? ""}-${r.contributor_email ?? ""}-${r.amount}-${r.created_at}`
          if (!recentContributionsMap.has(key)) {
            recentContributionsMap.set(key, {
              name: r.contributor_name || "Anonymous",
              email: r.contributor_email || undefined,
              amount: Number(r.amount),
              time: formatContributionTime(r.created_at),
              sortKey: new Date(r.created_at).getTime(),
            })
          }
        }
      }
    } catch {
      // table may not exist
    }

    // Merge: gift_contributor_emails (if table exists).
    try {
      const { data: rows } = await dbClient
        .from("gift_contributor_emails")
        .select("*")
        .eq("gift_id", giftId)
        .order("created_at", { ascending: false })
        .limit(20)
      if (rows?.length) {
        for (const r of rows as { contributor_name?: string; email?: string; amount: number; created_at: string }[]) {
          const key = `${r.contributor_name || "Anonymous"}-${r.email ?? ""}-${r.amount}-${r.created_at}`
          if (!recentContributionsMap.has(key)) {
            recentContributionsMap.set(key, {
              name: r.contributor_name || "Anonymous",
              email: r.email || undefined,
              amount: Number(r.amount),
              time: formatContributionTime(r.created_at),
              sortKey: new Date(r.created_at).getTime(),
            })
          }
        }
      }
    } catch {
      // table may not exist
    }
    const memoryContributions = getContributionsForGift(giftId)
    for (const c of memoryContributions) {
      const iso = c.createdAt.toISOString()
      const key = `${c.contributorName}-${c.contributorEmail ?? ""}-${c.amount}-${iso}`
      if (!recentContributionsMap.has(key)) {
        recentContributionsMap.set(key, {
          name: c.contributorName || "Anonymous",
          email: c.contributorEmail || undefined,
          amount: c.amount,
          time: formatContributionTime(iso),
          sortKey: c.createdAt.getTime(),
        })
      }
    }
    const recentContributions = Array.from(recentContributionsMap.values())
      .sort((a, b) => b.sortKey - a.sortKey)
      .slice(0, 15)
      .map(({ name, email, amount, time }) => ({ name, email, amount, time }))

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
        organizerDisplayName,
        recentContributions,
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
