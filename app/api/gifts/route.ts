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
    // In production, fetch from database
    // For now, return mock data
    const mockGifts = [
      {
        id: "1",
        collectionTitle: "Sample Birthday Gift",
        recipientName: "John Doe",
        occasion: "birthday",
        giftName: "Professional Camera",
        description: "A high-quality camera for photography enthusiasts",
        targetAmount: 500,
        currentAmount: 250,
        contributors: 5,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        bannerImage: null,
        createdDate: new Date().toISOString(),
        status: "active",
      },
    ]

    return Response.json({
      success: true,
      gifts: mockGifts,
    })
  } catch (error) {
    console.error("[v0] Error fetching gifts:", error)
    return Response.json({ error: "Failed to fetch gifts" }, { status: 500 })
  }
}
