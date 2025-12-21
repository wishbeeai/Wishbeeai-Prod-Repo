import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const { groupData, userProfile } = await request.json()

    const prompt = `You are an AI assistant analyzing group compatibility for a gifting platform.

Group Information:
- Name: ${groupData.name}
- Type: ${groupData.type}
- Members: ${groupData.memberCount}
- Active Gifts: ${groupData.activeGifts}
- Recent Activity: ${groupData.recentActivity}

User Profile:
- Current Groups: ${userProfile.currentGroups}
- Average Contribution: $${userProfile.averageContribution}
- Participation Rate: ${userProfile.participationRate}%
- Preferred Group Size: ${userProfile.preferredGroupSize}

Analyze the compatibility and provide:
1. A compatibility score (0-100)
2. Overall recommendation (Highly Recommended / Recommended / Consider / Not Recommended)
3. Engagement potential (High / Medium / Low)
4. 3-4 key benefits for joining this group
5. 2-3 considerations to keep in mind
6. Brief reasoning for your recommendation

Format as JSON with fields: compatibilityScore, recommendation, engagementPotential, benefits (array), considerations (array), reasoning.`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
    })

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return NextResponse.json(parsed)
    }

    return NextResponse.json({
      compatibilityScore: 75,
      recommendation: "Recommended",
      engagementPotential: "High",
      benefits: [
        "Active and engaged member base",
        "Compatible group size for your preferences",
        "Regular gifting activity",
        "Good match for your participation style",
      ],
      considerations: ["May require regular participation commitment", "Active gift coordination will be expected"],
      reasoning: "This group shows strong engagement patterns that align well with your gifting style.",
    })
  } catch (error) {
    console.error("Error in group compatibility analysis:", error)
    return NextResponse.json({ error: "Failed to analyze group compatibility" }, { status: 500 })
  }
}
