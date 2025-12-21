import { generateObject } from "ai"
import { z } from "zod"

export async function POST(req: Request) {
  try {
    const { analyticsData, contributionTrend, timeRange } = await req.json()

    const { object } = await generateObject({
      model: "openai/gpt-4o-mini",
      schema: z.object({
        keyFindings: z.array(z.string()).describe("3-5 key insights from the analytics data"),
        recommendations: z.array(z.string()).describe("3-5 actionable recommendations"),
        predictedTrend: z.string().describe("Prediction about future gifting patterns"),
        strengthsAndWeaknesses: z.object({
          strengths: z.array(z.string()),
          weaknesses: z.array(z.string()),
        }),
      }),
      prompt: `Analyze these gifting analytics and provide insights:
      
      Analytics Data:
      - Total Gifts: ${analyticsData.totalGifts}
      - Total Contributed: $${analyticsData.totalContributed}
      - Total Received: $${analyticsData.totalReceived}
      - Active Groups: ${analyticsData.activeGroups}
      - Average Contribution: $${analyticsData.averageContribution}
      - Success Rate: ${analyticsData.successRate}%
      - Time Range: ${timeRange}
      
      Contribution Trend: ${JSON.stringify(contributionTrend)}
      
      Provide:
      1. Key findings about gifting patterns and behaviors
      2. Actionable recommendations to improve gifting experience
      3. Predicted trend for the next period
      4. Strengths and areas for improvement`,
    })

    return Response.json(object)
  } catch (error) {
    console.error("Error generating analytics insights:", error)
    return Response.json({ error: "Failed to generate insights" }, { status: 500 })
  }
}
