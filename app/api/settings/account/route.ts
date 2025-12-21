import { type NextRequest, NextResponse } from "next/server"

const accountSettingsStore = new Map<string, any>()

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId") || "default-user"

    const accountSettings = accountSettingsStore.get(userId) || {
      username: "john_doe",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
      displayName: "John Doe",
    }

    return NextResponse.json(accountSettings)
  } catch (error) {
    console.error("[v0] Error fetching account settings:", error)
    return NextResponse.json({ error: "Failed to fetch account settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, phone, displayName } = body

    if (!username || !email) {
      return NextResponse.json({ error: "Username and email are required" }, { status: 400 })
    }

    const userId = request.nextUrl.searchParams.get("userId") || "default-user"

    const updatedSettings = { username, email, phone, displayName, updatedAt: new Date().toISOString() }
    accountSettingsStore.set(userId, updatedSettings)

    console.log("[v0] Updated account settings:", updatedSettings)

    return NextResponse.json({
      success: true,
      message: "Account settings updated successfully",
      data: updatedSettings,
    })
  } catch (error) {
    console.error("[v0] Error updating account settings:", error)
    return NextResponse.json({ error: "Failed to update account settings" }, { status: 500 })
  }
}
