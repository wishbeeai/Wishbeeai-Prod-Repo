export async function POST(req: Request) {
  try {
    const groupData = await req.json()

    console.log("[v0] Creating group:", groupData)

    // Validate required fields
    if (!groupData.groupName || !groupData.memberEmails || groupData.memberEmails.length === 0) {
      return Response.json({ error: "Group name and at least one member email are required" }, { status: 400 })
    }

    // In production, this would save to a database
    // For now, we'll simulate a successful save
    const savedGroup = {
      id: Date.now().toString(),
      ...groupData,
      createdDate: new Date().toISOString(),
      memberCount: groupData.memberEmails.length,
      status: "active",
      invitationsSent: true,
    }

    console.log("[v0] Group created successfully:", savedGroup.id)

    return Response.json({
      success: true,
      id: savedGroup.id,
      group: savedGroup,
    })
  } catch (error) {
    console.error("[v0] Error creating group:", error)
    return Response.json({ error: "Failed to create group" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    // In production, fetch from database
    // For now, return mock data
    const mockGroups = [
      {
        id: "1",
        groupName: "Family Circle",
        description: "Our close family group for special occasions",
        groupPhoto: "/images/group-gifting-mainimage.png",
        memberCount: 8,
        memberEmails: ["john@example.com", "jane@example.com"],
        createdDate: new Date().toISOString(),
        status: "active",
      },
      {
        id: "2",
        groupName: "Work Friends",
        description: "Colleagues who celebrate together",
        groupPhoto: "/images/groups.png",
        memberCount: 12,
        memberEmails: ["alice@example.com", "bob@example.com"],
        createdDate: new Date().toISOString(),
        status: "active",
      },
    ]

    return Response.json({
      success: true,
      groups: mockGroups,
    })
  } catch (error) {
    console.error("[v0] Error fetching groups:", error)
    return Response.json({ error: "Failed to fetch groups" }, { status: 500 })
  }
}
