import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/** Base columns that exist on most Supabase profiles tables (no schema cache error). */
function basePayload(userId: string, body: Record<string, unknown>) {
  return {
    id: userId,
    email: (body.email as string) ?? "",
    name: (body.name as string) ?? null,
    updated_at: new Date().toISOString(),
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as Record<string, unknown>

    const base = basePayload(user.id, body)
    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(base, { onConflict: "id" })

    if (upsertError) {
      const msg = upsertError.message || "Database error"
      const code = upsertError.code || ""
      console.error("[profile] Save failed:", { message: msg, code, details: upsertError.details })
      return NextResponse.json(
        { error: msg, code },
        { status: code === "42501" ? 403 : 400 }
      )
    }

    const extended = {
      phone: body.phone ?? null,
      location: body.location ?? null,
      bio: body.bio ?? null,
      birthday: body.birthday ?? null,
      profile_image: body.profile_image ?? null,
      updated_at: new Date().toISOString(),
    }
    const { error: updateError } = await supabase
      .from("profiles")
      .update(extended)
      .eq("id", user.id)

    if (updateError) {
      const msg = updateError.message || ""
      const schemaCacheOrMissing = /schema cache|could not find|does not exist/i.test(msg)
      if (schemaCacheOrMissing) {
        return NextResponse.json({
          success: true,
          warning: "Name and email saved. To save phone, location, and bio, run migration 017_profiles_phone_location_bio.sql in Supabase (SQL Editor).",
        })
      }
      console.error("[profile] Extended update failed:", { message: msg, code: updateError.code })
      return NextResponse.json({ error: msg, code: updateError.code }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[profile] Error:", message, err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
