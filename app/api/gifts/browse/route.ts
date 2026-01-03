export async function GET(req: Request) {
  try {
    // Return empty array - no products displayed
    return Response.json({
      success: true,
      gifts: [],
      total: 0,
    })
  } catch (error) {
    console.error("[v0] Error fetching browse gifts:", error)
    return Response.json({ error: "Failed to fetch gifts" }, { status: 500 })
  }
}
