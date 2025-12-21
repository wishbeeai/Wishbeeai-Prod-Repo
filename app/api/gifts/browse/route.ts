export async function GET(req: Request) {
  try {
    // In production, this would fetch from database with pagination, filters, etc.
    // For now, return enhanced mock data combining trending and user-created gifts
    const mockGifts = [
      {
        id: "1",
        collectionTitle: "Premium Espresso Machine",
        recipientName: "Coffee Lover",
        occasion: "birthday",
        giftName: "Premium Espresso Machine",
        description: "A professional-grade espresso machine for coffee lovers",
        targetAmount: 899,
        currentAmount: 764,
        contributors: 24,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        image: "/professional-espresso-setup.png",
        category: "Home & Kitchen",
        bannerImage: null,
        createdDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
      },
      {
        id: "2",
        collectionTitle: "Designer Handbag",
        recipientName: "Fashion Enthusiast",
        occasion: "anniversary",
        giftName: "Designer Handbag",
        description: "Luxury designer handbag for fashion enthusiasts",
        targetAmount: 1250,
        currentAmount: 900,
        contributors: 18,
        deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        image: "/luxury-quilted-handbag.png",
        category: "Fashion",
        bannerImage: null,
        createdDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
      },
      {
        id: "3",
        collectionTitle: "Smart Home Hub Package",
        recipientName: "Tech Lover",
        occasion: "housewarming",
        giftName: "Smart Home Hub Package",
        description: "Complete smart home automation system",
        targetAmount: 650,
        currentAmount: 617,
        contributors: 31,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        image: "/smart-home-devices.jpg",
        category: "Tech",
        bannerImage: null,
        createdDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
      },
      {
        id: "4",
        collectionTitle: "Professional Camera Kit",
        recipientName: "Photography Enthusiast",
        occasion: "graduation",
        giftName: "Professional Camera Kit",
        description: "High-end photography equipment for professionals",
        targetAmount: 1899,
        currentAmount: 1139,
        contributors: 15,
        deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        image: "/camera-kit-professional.jpg",
        category: "Photography",
        bannerImage: null,
        createdDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
      },
    ]

    console.log("[v0] Fetching browse gifts, found:", mockGifts.length)

    return Response.json({
      success: true,
      gifts: mockGifts,
      total: mockGifts.length,
    })
  } catch (error) {
    console.error("[v0] Error fetching browse gifts:", error)
    return Response.json({ error: "Failed to fetch gifts" }, { status: 500 })
  }
}
