import { type NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let body: { giftId?: string; giftName?: string; sharedBy?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: "Invalid request body", details: "Expected JSON" },
        { status: 400 }
      )
    }
    const { giftId, giftName, sharedBy } = body ?? {}

    if (!giftId || !giftName) {
      return NextResponse.json({ error: "Gift ID and name are required" }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"
    const slug = String(giftName).toLowerCase().replace(/[^a-z0-9]+/g, "-")
    const shareUrl = `${baseUrl}/gifts/share/${slug}-${giftId}`

    console.log(`[Share] Gift shared: ${giftName} by ${sharedBy || "Anonymous"}`)

    return NextResponse.json({
      success: true,
      shareUrl,
      message: `Share link generated for "${giftName}"`,
      shareData: {
        giftId,
        giftName,
        shareUrl,
        sharedAt: new Date().toISOString(),
        sharedBy: sharedBy || "Anonymous",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const details = error instanceof Error ? (error.stack ?? undefined) : undefined
    console.error("[Share] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate share link",
        details: process.env.NODE_ENV === "development" ? message : undefined,
        ...(details && process.env.NODE_ENV === "development" ? { stack: details } : {}),
      },
      { status: 500 }
    )
  }
}
