import { type NextRequest, NextResponse } from "next/server"

const privacySettingsStore = new Map<string, any>()

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId") || "default-user"

    const privacySettings = privacySettingsStore.get(userId) || {
      profileVisibility: "friends",
      showContributions: true,
      showWishlist: true,
      allowFriendRequests: true,
    }

    return NextResponse.json(privacySettings)
  } catch (error) {
    console.error("[v0] Error fetching privacy settings:", error)
    return NextResponse.json({ error: "Failed to fetch privacy settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const userId = request.nextUrl.searchParams.get("userId") || "default-user"

    const validVisibility = ["public", "friends", "private"]
    if (body.profileVisibility && !validVisibility.includes(body.profileVisibility)) {
      return NextResponse.json({ error: "Invalid profile visibility value" }, { status: 400 })
    }

    privacySettingsStore.set(userId, { ...body, updatedAt: new Date().toISOString() })

    console.log("[v0] Updated privacy settings:", body)

    return NextResponse.json({
      success: true,
      message: "Privacy settings updated successfully",
      data: body,
    })
  } catch (error) {
    console.error("[v0] Error updating privacy settings:", error)
    return NextResponse.json({ error: "Failed to update privacy settings" }, { status: 500 })
  }
}
