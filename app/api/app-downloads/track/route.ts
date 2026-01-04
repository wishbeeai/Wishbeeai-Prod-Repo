import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const trackDownloadSchema = z.object({
  platform: z.enum(["ios", "android", "unknown"]),
  source: z.string().optional(), // e.g., "footer", "hero", "banner"
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = trackDownloadSchema.parse(body)

    // Log the download click for analytics
    console.log("[App Downloads] Download click tracked:", {
      platform: validated.platform,
      source: validated.source || "unknown",
      timestamp: new Date().toISOString(),
      userAgent: validated.userAgent?.substring(0, 100), // Truncate for privacy
      referrer: validated.referrer,
    })

    // TODO: In production, you would:
    // 1. Store in database for analytics
    // 2. Send to analytics service (Google Analytics, Mixpanel, etc.)
    // 3. Track conversion funnel
    // 4. A/B test different CTAs

    // Example database storage (commented out):
    // const supabase = await createClient()
    // await supabase.from('app_download_clicks').insert({
    //   platform: validated.platform,
    //   source: validated.source,
    //   user_agent: validated.userAgent,
    //   referrer: validated.referrer,
    //   created_at: new Date().toISOString(),
    // })

    return NextResponse.json(
      {
        success: true,
        message: "Download click tracked",
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      )
    }

    console.error("[App Downloads] Error tracking download:", error)
    return NextResponse.json(
      {
        error: "Failed to track download",
      },
      { status: 500 }
    )
  }
}

