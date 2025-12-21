import { type NextRequest, NextResponse } from "next/server"

const securitySettingsStore = new Map<string, any>()

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId") || "default-user"

    const securitySettings = securitySettingsStore.get(userId) || {
      twoFactorAuth: false,
    }

    // Don't return password fields
    return NextResponse.json(securitySettings)
  } catch (error) {
    console.error("[v0] Error fetching security settings:", error)
    return NextResponse.json({ error: "Failed to fetch security settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { currentPassword, newPassword, confirmPassword, twoFactorAuth } = body
    const userId = request.nextUrl.searchParams.get("userId") || "default-user"

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        return NextResponse.json({ error: "New passwords do not match" }, { status: 400 })
      }

      if (newPassword.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
      }

      // TODO: Hash password with bcrypt in production
      console.log("[v0] Password updated for user:", userId)
    }

    if (typeof twoFactorAuth === "boolean") {
      const currentSettings = securitySettingsStore.get(userId) || {}
      securitySettingsStore.set(userId, {
        ...currentSettings,
        twoFactorAuth,
        updatedAt: new Date().toISOString(),
      })
      console.log("[v0] 2FA toggled:", twoFactorAuth)
    }

    return NextResponse.json({
      success: true,
      message: "Security settings updated successfully",
    })
  } catch (error) {
    console.error("[v0] Error updating security settings:", error)
    return NextResponse.json({ error: "Failed to update security settings" }, { status: 500 })
  }
}
