export async function POST(req: Request) {
  try {
    const giftData = await req.json()

    console.log("[v0] Creating gift collection:", giftData)

    // Validate required fields
    if (!giftData.collectionTitle || !giftData.giftName || !giftData.targetAmount || !giftData.deadline) {
      return Response.json(
        { error: "Collection title, gift name, target amount, and deadline are required" },
        { status: 400 },
      )
    }

    // In production, this would save to a database
    // For now, we'll simulate a successful save
    const savedGift = {
      id: Date.now().toString(),
      ...giftData,
      createdDate: new Date().toISOString(),
      currentAmount: 0,
      contributors: 0,
      status: "active",
    }

    console.log("[v0] Gift collection created successfully:", savedGift.id)

    return Response.json({
      success: true,
      id: savedGift.id,
      gift: savedGift,
    })
  } catch (error) {
    console.error("[v0] Error creating gift collection:", error)
    return Response.json({ error: "Failed to create gift collection" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    // Return empty array - no products displayed
    return Response.json({
      success: true,
      gifts: [],
    })
  } catch (error) {
    console.error("[v0] Error fetching gifts:", error)
    return Response.json({ error: "Failed to fetch gifts" }, { status: 500 })
  }
}
