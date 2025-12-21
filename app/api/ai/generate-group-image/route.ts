import { type NextRequest, NextResponse } from "next/server"
import * as fal from "@fal-ai/serverless-client"

fal.config({
  credentials: process.env.FAL_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Group image generation started")

    if (!process.env.FAL_KEY) {
      console.error("[v0] FAL_KEY environment variable is missing")
      return NextResponse.json(
        {
          error: "Server configuration error",
          details: "FAL_KEY is not configured. Please add it to your environment variables in Vercel.",
        },
        { status: 500 },
      )
    }

    const { groupName, description } = await request.json()

    if (!groupName || typeof groupName !== "string") {
      console.error("[v0] No group name provided in request")
      return NextResponse.json({ error: "Group name is required" }, { status: 400 })
    }

    const prompt = `A warm and welcoming group photo for "${groupName}". ${description}. Professional, friendly atmosphere with diverse people smiling together. High quality, well-lit, suitable for a group profile picture.`

    console.log("[v0] Generating group image with prompt:", prompt)

    const result = (await Promise.race([
      fal.subscribe("fal-ai/flux/schnell", {
        input: {
          prompt: prompt,
          image_size: "square_hd",
          num_inference_steps: 4,
          num_images: 1,
          enable_safety_checker: true,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            console.log("[v0] Image generation progress:", update.logs)
          }
        },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Group image generation timeout after 60 seconds")), 60000),
      ),
    ])) as { images: Array<{ url: string }> }

    console.log("[v0] Group image generation result:", JSON.stringify(result, null, 2))

    const imageUrl = result?.images?.[0]?.url || (result as any)?.data?.images?.[0]?.url

    if (!imageUrl) {
      console.error("[v0] No image URL in result. Full result:", JSON.stringify(result, null, 2))
      throw new Error("No image generated - the API may have returned an unexpected format.")
    }

    console.log("[v0] Group image generated successfully:", imageUrl)

    return NextResponse.json({
      imageUrl,
      success: true,
    })
  } catch (error) {
    console.error("[v0] Error generating group image:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error("[v0] Error details:", {
      message: errorMessage,
      stack: errorStack,
      falKeyExists: !!process.env.FAL_KEY,
    })

    return NextResponse.json(
      {
        error: "Failed to generate image",
        details: errorMessage,
        tip: "Make sure FAL_KEY environment variable is set in Vercel project settings",
      },
      { status: 500 },
    )
  }
}
