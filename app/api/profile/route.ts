import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const now = () => new Date().toISOString()

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

/** Safe string or null for DB. */
function str(v: unknown): string | null {
  if (v == null) return null
  if (typeof v === "string") return v
  return String(v)
}

/** Full profile payload for tables that have phone, location, bio, birthday, profile_image (migration 017). */
function fullPayload(userId: string, body: Record<string, unknown>) {
  return {
    id: userId,
    email: str(body.email) ?? "",
    name: str(body.name) ?? null,
    phone: str(body.phone) ?? null,
    location: str(body.location) ?? null,
    bio: str(body.bio) ?? null,
    birthday: str(body.birthday) ?? null,
    profile_image: str(body.profile_image) ?? null,
    updated_at: now(),
  }
}

/** Minimal payload when extended columns are missing (id, email, name only). */
function basePayload(userId: string, body: Record<string, unknown>) {
  return {
    id: userId,
    email: str(body.email) ?? "",
    name: str(body.name) ?? null,
    updated_at: now(),
  }
}

/** GET current user's profile (for settings and profile page). */
export async function GET() {
  try {
    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const db = createAdminClient() ?? authClient
    const { data: profile, error } = await db
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
    if (error && error.code !== "PGRST116") {
      console.error("[profile] GET error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    const row = profile ?? {}
    return NextResponse.json({
      id: user.id,
      email: row.email ?? user.email ?? "",
      name: row.name ?? user.user_metadata?.name ?? null,
      phone: row.phone ?? null,
      location: row.location ?? null,
      bio: row.bio ?? null,
      birthday: row.birthday ?? null,
      profile_image: row.profile_image ?? null,
      created_at: row.created_at ?? user.created_at,
      profile_visibility: row.profile_visibility ?? "friends",
      weekly_digest: row.weekly_digest ?? false,
      email_notifications: row.email_notifications ?? true,
      push_notifications: row.push_notifications ?? true,
      sms_notifications: row.sms_notifications ?? false,
      gift_reminders: row.gift_reminders ?? true,
      contribution_updates: row.contribution_updates ?? true,
      group_invites: row.group_invites ?? true,
      marketing_emails: row.marketing_emails ?? false,
      show_contributions: row.show_contributions ?? true,
      show_wishlist: row.show_wishlist ?? true,
      allow_friend_requests: row.allow_friend_requests ?? true,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[profile] GET Error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  let body: Record<string, unknown>
  try {
    const raw = await request.json()
    body = raw != null && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  try {
    let authClient: Awaited<ReturnType<typeof createClient>>
    try {
      authClient = await createClient()
    } catch (clientErr) {
      const msg = clientErr instanceof Error ? clientErr.message : String(clientErr)
      console.error("[profile] createClient failed:", msg)
      return NextResponse.json(
        { error: "Server configuration error. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY." },
        { status: 503 }
      )
    }

    let user: { id: string }
    try {
      const { data: { user: u }, error: authError } = await authClient.auth.getUser()
      if (authError || !u) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      user = u
    } catch (authErr) {
      const msg = authErr instanceof Error ? authErr.message : String(authErr)
      console.error("[profile] getUser failed:", msg)
      return NextResponse.json({ error: "Authentication failed. Try signing in again." }, { status: 401 })
    }

    const db = createAdminClient() ?? authClient

    const full = fullPayload(user.id, body)
    const { error: upsertError } = await db
      .from("profiles")
      .upsert(full, { onConflict: "id" })

    if (upsertError) {
      const msg = upsertError.message || "Database error"
      const code = upsertError.code || ""
      const relationMissing = /relation .* does not exist|profiles.*does not exist/i.test(msg)
      if (relationMissing) {
        console.error("[profile] profiles table missing:", msg)
        return NextResponse.json(
          { error: "Profile table is not set up. Create a profiles table in Supabase (see docs/FIX-PROFILE-PHONE-LOCATION-BIO.md)." },
          { status: 400 }
        )
      }
      const missingColumn = /schema cache|could not find|does not exist|column .* does not exist/i.test(msg)
      if (missingColumn) {
        const base = basePayload(user.id, body)
        const { error: baseError } = await db
          .from("profiles")
          .upsert(base, { onConflict: "id" })
        if (baseError) {
          console.error("[profile] Base save failed:", baseError.message)
          return NextResponse.json({ error: baseError.message, code: baseError.code }, { status: 400 })
        }
        return NextResponse.json({
          success: true,
          warning: "Name and email saved. Phone, location, and bio require running migration 017_profiles_phone_location_bio.sql in Supabase.",
        })
      }
      if (code === "42501") {
        return NextResponse.json({ error: "You don't have permission to update this profile. Run migration 018_profiles_rls_policies.sql.", code }, { status: 403 })
      }
      console.error("[profile] Save failed:", { message: msg, code, details: upsertError.details })
      return NextResponse.json({ error: msg, code }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[profile] Error:", message, err)
    return jsonError(message, 500)
  }
}
