import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user.id
}

/**
 * GET: Returns account info from the user's profile (same data as Profile page).
 */
export async function GET(_request: NextRequest) {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = createAdminClient() ?? await createClient()
    const { data: row, error } = await db
      .from("profiles")
      .select("name, email, phone")
      .eq("id", userId)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("[settings/account] GET error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const name = row?.name ?? ""
    const email = row?.email ?? ""
    const phone = row?.phone ?? ""
    const username = name || (email ? email.split("@")[0] : "") || ""

    return NextResponse.json({
      username,
      displayName: name,
      email,
      phone,
    })
  } catch (error) {
    console.error("[settings/account] Error:", error)
    return NextResponse.json({ error: "Failed to fetch account settings" }, { status: 500 })
  }
}

/**
 * PUT: Updates the user's profile (name, email, phone) — same as saving on Profile page.
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : null
    const email = typeof body.email === "string" ? body.email.trim() : null
    const phone = typeof body.phone === "string" ? body.phone.trim() : null

    const db = createAdminClient() ?? await createClient()
    const updates: Record<string, unknown> = {
      id: userId,
      updated_at: new Date().toISOString(),
    }
    if (displayName !== null) updates.name = displayName || null
    if (email !== null) updates.email = email || null
    if (phone !== null) updates.phone = phone || null

    const { error } = await db.from("profiles").upsert(updates, { onConflict: "id" })

    if (error) {
      console.error("[settings/account] PUT error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Account settings updated successfully",
      data: {
        username: updates.name ?? (updates.email ? String(updates.email).split("@")[0] : ""),
        displayName: updates.name ?? "",
        email: updates.email ?? "",
        phone: updates.phone ?? "",
      },
    })
  } catch (error) {
    console.error("[settings/account] Error:", error)
    return NextResponse.json({ error: "Failed to update account settings" }, { status: 500 })
  }
}
