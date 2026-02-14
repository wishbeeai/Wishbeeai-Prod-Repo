import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * GET /api/profile/[id]
 * Returns another user's profile when allowed by their profile_visibility setting.
 * - public: anyone can see public fields (name, profile_image; no email/phone).
 * - friends: only the profile owner can see (no friends table yet); others get 404.
 * - private: only the profile owner can see; others get 404.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: profileUserId } = await params
    if (!profileUserId) {
      return NextResponse.json({ error: "Profile ID required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user: viewer }, error: authError } = await supabase.auth.getUser()

    const db = createAdminClient() ?? supabase
    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("id, email, name, phone, location, bio, birthday, profile_image, profile_visibility, created_at")
      .eq("id", profileUserId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const visibility = (profile.profile_visibility as string) || "friends"
    const isOwner = viewer?.id === profileUserId

    if (isOwner) {
      return NextResponse.json({
        id: profile.id,
        email: profile.email ?? null,
        name: profile.name ?? null,
        phone: profile.phone ?? null,
        location: profile.location ?? null,
        bio: profile.bio ?? null,
        birthday: profile.birthday ?? null,
        profile_image: profile.profile_image ?? null,
        profile_visibility: visibility,
        created_at: profile.created_at,
      })
    }

    if (visibility === "private") {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    if (visibility === "friends") {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    if (visibility === "public") {
      return NextResponse.json({
        id: profile.id,
        name: profile.name ?? null,
        profile_image: profile.profile_image ?? null,
        created_at: profile.created_at,
      })
    }

    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error"
    console.error("[profile/[id]]", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
