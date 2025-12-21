import { type NextRequest, NextResponse } from "next/server"

const notificationSettingsStore = new Map<string, any>()

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId") || "default-user"

    const notificationSettings = notificationSettingsStore.get(userId) || {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      giftReminders: true,
      contributionUpdates: true,
      groupInvites: true,
      weeklyDigest: false,
      marketingEmails: false,
    }

    return NextResponse.json(notificationSettings)
  } catch (error) {
    console.error("[v0] Error fetching notification settings:", error)
    return NextResponse.json({ error: "Failed to fetch notification settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const userId = request.nextUrl.searchParams.get("userId") || "default-user"

    notificationSettingsStore.set(userId, { ...body, updatedAt: new Date().toISOString() })

    console.log("[v0] Updated notification settings:", body)

    return NextResponse.json({
      success: true,
      message: "Notification preferences updated successfully",
      data: body,
    })
  } catch (error) {
    console.error("[v0] Error updating notification settings:", error)
    return NextResponse.json({ error: "Failed to update notification settings" }, { status: 500 })
  }
}
