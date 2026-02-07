import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

/**
 * POST /api/gifts/[id]/backfill-contributions
 * Copies contribution data from gift_contributor_emails and gift_contributions
 * into the gift's evite_settings.contributionList so Recent Contributions displays them.
 * Call once per gift when you have contributors but no list (e.g. data was in DB tables only).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: giftId } = await params
    if (!giftId) {
      return NextResponse.json({ error: "Gift ID is required" }, { status: 400 })
    }

    const admin = createAdminClient()
    if (!admin) {
      return NextResponse.json(
        { error: "Server configuration error. Set SUPABASE_SERVICE_ROLE_KEY." },
        { status: 503 }
      )
    }

    const { data: gift, error: giftErr } = await admin
      .from("gifts")
      .select("id, evite_settings")
      .eq("id", giftId)
      .single()

    if (giftErr || !gift) {
      return NextResponse.json({ error: "Gift not found" }, { status: 404 })
    }

    type ListEntry = { name?: string; email?: string; amount?: number; time?: string }
    const seen = new Set<string>()
    const list: ListEntry[] = []

    // Existing list on gift
    const evite = (gift.evite_settings as Record<string, unknown>) || {}
    const existing = Array.isArray(evite.contributionList) ? (evite.contributionList as ListEntry[]) : []
    for (const c of existing) {
      const key = `${c.name ?? ""}-${c.email ?? ""}-${c.amount ?? 0}-${c.time ?? ""}`
      if (!seen.has(key)) {
        seen.add(key)
        list.push({ name: c.name || "Anonymous", email: c.email, amount: c.amount ?? 0, time: c.time })
      }
    }

    // From gift_contributor_emails
    try {
      const { data: rows } = await admin
        .from("gift_contributor_emails")
        .select("contributor_name, email, amount, created_at")
        .eq("gift_id", giftId)
        .order("created_at", { ascending: false })
        .limit(50)
      if (rows?.length) {
        for (const r of rows as { contributor_name?: string; email?: string; amount: number; created_at: string }[]) {
          const key = `${r.contributor_name ?? "Anonymous"}-${r.email ?? ""}-${r.amount}-${r.created_at}`
          if (!seen.has(key)) {
            seen.add(key)
            list.push({
              name: r.contributor_name || "Anonymous",
              email: r.email,
              amount: Number(r.amount),
              time: r.created_at,
            })
          }
        }
      }
    } catch {
      // table may not exist
    }

    // From gift_contributions
    try {
      const { data: rows } = await admin
        .from("gift_contributions")
        .select("contributor_name, contributor_email, amount, created_at")
        .eq("gift_id", giftId)
        .order("created_at", { ascending: false })
        .limit(50)
      if (rows?.length) {
        for (const r of rows as { contributor_name?: string; contributor_email?: string; amount: number; created_at: string }[]) {
          const key = `${r.contributor_name ?? "Anonymous"}-${r.contributor_email ?? ""}-${r.amount}-${r.created_at}`
          if (!seen.has(key)) {
            seen.add(key)
            list.push({
              name: r.contributor_name || "Anonymous",
              email: r.contributor_email,
              amount: Number(r.amount),
              time: r.created_at,
            })
          }
        }
      }
    } catch {
      // table may not exist
    }

    // Sort by time desc and take 50
    const sorted = list
      .sort((a, b) => (b.time ? new Date(b.time).getTime() : 0) - (a.time ? new Date(a.time).getTime() : 0))
      .slice(0, 50)

    const eviteUpdated = { ...evite, contributionList: sorted }

    const { error: updateErr } = await admin
      .from("gifts")
      .update({ evite_settings: eviteUpdated, updated_at: new Date().toISOString() })
      .eq("id", giftId)

    if (updateErr) {
      console.error("[backfill-contributions] update error:", updateErr)
      return NextResponse.json({ error: "Failed to save contribution list" }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: sorted.length })
  } catch (err) {
    console.error("[backfill-contributions] error:", err)
    return NextResponse.json({ error: "Backfill failed" }, { status: 500 })
  }
}
