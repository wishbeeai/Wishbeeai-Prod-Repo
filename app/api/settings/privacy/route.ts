import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

const DEFAULT_PRIVACY = {
  profileVisibility: "friends",
  showContributions: true,
  showWishlist: true,
  allowFriendRequests: true,
}

async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user.id
}

export async function GET(_request: NextRequest) {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const db = createAdminClient() ?? await createClient()
    const { data: row, error } = await db
      .from("profiles")
      .select("profile_visibility, show_contributions, show_wishlist, allow_friend_requests")
      .eq("id", userId)
      .single()
    if (error && error.code !== "PGRST116") {
      console.error("[settings/privacy] GET error:", error.message)
      return NextResponse.json(DEFAULT_PRIVACY, { status: 200 })
    }
    const p = row ?? {}
    return NextResponse.json({
      profileVisibility: p.profile_visibility ?? DEFAULT_PRIVACY.profileVisibility,
      showContributions: p.show_contributions ?? DEFAULT_PRIVACY.showContributions,
      showWishlist: p.show_wishlist ?? DEFAULT_PRIVACY.showWishlist,
      allowFriendRequests: p.allow_friend_requests ?? DEFAULT_PRIVACY.allowFriendRequests,
    })
  } catch (error) {
    console.error("[settings/privacy] Error:", error)
    return NextResponse.json({ error: "Failed to fetch privacy settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await request.json().catch(() => ({}))
    const validVisibility = ["public", "friends", "private"]
    if (body.profileVisibility && !validVisibility.includes(body.profileVisibility)) {
      return NextResponse.json({ error: "Invalid profile visibility value" }, { status: 400 })
    }
    const db = createAdminClient() ?? await createClient()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.profileVisibility !== undefined) updates.profile_visibility = body.profileVisibility
    if (body.showContributions !== undefined) updates.show_contributions = body.showContributions
    if (body.showWishlist !== undefined) updates.show_wishlist = body.showWishlist
    if (body.allowFriendRequests !== undefined) updates.allow_friend_requests = body.allowFriendRequests
    const { error } = await db.from("profiles").upsert(
      { id: userId, ...updates },
      { onConflict: "id" }
    )
    if (error) {
      console.error("[settings/privacy] PUT error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({
      success: true,
      message: "Privacy settings updated successfully",
      data: {
        profileVisibility: body.profileVisibility,
        showContributions: body.showContributions,
        showWishlist: body.showWishlist,
        allowFriendRequests: body.allowFriendRequests,
      },
    })
  } catch (error) {
    console.error("[settings/privacy] Error:", error)
    return NextResponse.json({ error: "Failed to update privacy settings" }, { status: 500 })
  }
}
