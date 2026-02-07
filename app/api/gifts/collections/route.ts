import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/gifts/collections
 * Returns the current user's gift collections.
 * Query: ?status=active|completed|all (default: active)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Sign in to view your gift collections" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get("status") || "active"

    let query = supabase
      .from("gifts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (statusFilter === "past") {
      // Past = completed OR (active with deadline passed)
      query = query.or("status.eq.completed,status.eq.active")
    } else if (statusFilter !== "all") {
      query = query.eq("status", statusFilter)
    }

    const { data: rows, error } = await query

    if (error) {
      console.error("[gifts/collections] Error fetching:", error)
      const err = error as { message?: string; code?: string }
      const details = err?.message || (error as Error)?.message
      return NextResponse.json(
        { error: "Failed to load gift collections", details: details || undefined, ...(err?.code && { code: err.code }) },
        { status: 500 }
      )
    }

    let list = rows || []
    const now = new Date().toISOString()
    if (statusFilter === "past") {
      list = list.filter(
        (g: { status?: string; deadline?: string }) =>
          g.status === "completed" || (g.deadline && g.deadline <= now)
      )
    } else if (statusFilter === "active") {
      // Active = status active AND deadline still in the future (so they appear on /gifts/active, not /gifts/past)
      list = list.filter(
        (g: { status?: string; deadline?: string | null }) =>
          g.status === "active" && (!g.deadline || g.deadline > now)
      )
    }

    const collections = list.map((g: Record<string, unknown>) => ({
      id: g.id,
      name: g.collection_title || g.gift_name,
      image: g.banner_image || g.product_image || "/placeholder.svg",
      targetAmount: Number(g.target_amount),
      currentAmount: Number(g.current_amount),
      contributors: g.contributors ?? 0,
      deadline: g.deadline,
      status: g.status,
      giftName: g.gift_name,
      collectionTitle: g.collection_title,
      created_at: g.created_at,
    }))

    return NextResponse.json({ success: true, collections })
  } catch (err) {
    console.error("[gifts/collections] Error:", err)
    const details = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: "Failed to load gift collections", details },
      { status: 500 }
    )
  }
}
