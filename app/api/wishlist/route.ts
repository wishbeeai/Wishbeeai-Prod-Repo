export async function POST(req: Request) {
  try {
    const wishlistItem = await req.json()

    console.log("[v0] Saving wishlist item:", wishlistItem)

    // Validate required fields
    if (!wishlistItem.giftName || !wishlistItem.currentPrice) {
      return Response.json({ error: "Product name and price are required" }, { status: 400 })
    }

    // In production, this would save to a database
    // For now, we'll simulate a successful save
    const savedItem = {
      id: Date.now().toString(),
      ...wishlistItem,
      addedDate: wishlistItem.addedDate || new Date().toISOString(),
      fundingStatus: "Ready to Fund",
      stockStatus: wishlistItem.stockStatus || "In Stock",
    }

    console.log("[v0] Wishlist item saved successfully:", savedItem.id)

    return Response.json({
      success: true,
      item: savedItem,
    })
  } catch (error) {
    console.error("[v0] Error saving wishlist item:", error)
    return Response.json({ error: "Failed to save wishlist item" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    // In production, fetch from database
    // For now, return mock data
    const mockWishlist = [
      {
        id: "1",
        giftName: "Sample Product",
        currentPrice: 99.99,
        storeName: "Sample Store",
        description: "A sample wishlist item",
        productImageUrl: "/diverse-products-still-life.png",
        quantity: 1,
        addedDate: new Date().toISOString(),
        fundingStatus: "Ready to Fund",
        stockStatus: "In Stock",
      },
    ]

    return Response.json({
      success: true,
      items: mockWishlist,
    })
  } catch (error) {
    console.error("[v0] Error fetching wishlist:", error)
    return Response.json({ error: "Failed to fetch wishlist" }, { status: 500 })
  }
}
