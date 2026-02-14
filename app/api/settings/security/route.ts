import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    const { data: factors } = await supabase.auth.mfa.listFactors()
    const twoFactorAuth = !!(factors?.totp && factors.totp.length > 0)
    return NextResponse.json({
      twoFactorAuth,
      currentLevel: aal?.currentLevel,
      nextLevel: aal?.nextLevel,
    })
  } catch (error) {
    console.error("[settings/security] GET error:", error)
    return NextResponse.json({ error: "Failed to fetch security settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await request.json().catch(() => ({}))
    const { currentPassword, newPassword, confirmPassword } = body

    if (newPassword) {
      if (!currentPassword || typeof currentPassword !== "string" || !currentPassword.trim()) {
        return NextResponse.json({ error: "Current password is required to change your password." }, { status: 400 })
      }
      if (newPassword !== confirmPassword) {
        return NextResponse.json({ error: "New passwords do not match" }, { status: 400 })
      }
      if (newPassword.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
      }
      const email = user.email
      if (!email) {
        return NextResponse.json({ error: "Cannot verify password: no email on account." }, { status: 400 })
      }
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: currentPassword.trim(),
      })
      if (reauthError) {
        const msg = (reauthError.message ?? "").toLowerCase()
        if (msg.includes("invalid") || msg.includes("credentials") || msg.includes("password")) {
          return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 })
        }
        return NextResponse.json({ error: reauthError.message }, { status: 400 })
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) {
        console.error("[settings/security] updateUser error:", updateError.message)
        return NextResponse.json({ error: updateError.message }, { status: 400 })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Security settings updated successfully",
    })
  } catch (error) {
    console.error("[settings/security] PUT error:", error)
    return NextResponse.json({ error: "Failed to update security settings" }, { status: 500 })
  }
}
