import { NextResponse } from "next/server"
import * as fal from "@fal-ai/serverless-client"

fal.config({
  credentials: process.env.FAL_KEY,
})

function getContextualImagePrompt(title: string): string {
  const titleLower = title.toLowerCase()

  if (titleLower.includes("house") || titleLower.includes("warming") || titleLower.includes("home")) {
    return "beautiful new house with warm lighting, garden, welcome home atmosphere, housewarming gifts and decorations"
  } else if (titleLower.includes("birthday") || titleLower.includes("bday")) {
    return "birthday celebration with colorful balloons, birthday cake with candles, party decorations, confetti, festive atmosphere"
  } else if (titleLower.includes("wedding") || titleLower.includes("marriage")) {
    return "elegant wedding celebration, wedding rings, beautiful flowers, romantic atmosphere, wedding gifts"
  } else if (titleLower.includes("retirement")) {
    return "retirement celebration, relaxation theme with beach or mountains, travel suitcases, leisure activities, achievement celebration"
  } else if (titleLower.includes("graduation") || titleLower.includes("grad")) {
    return "graduation celebration, cap and gown, diploma scroll, books, academic achievement with gold accents"
  } else if (titleLower.includes("baby") || titleLower.includes("shower")) {
    return "baby shower theme, cute baby items, soft pastel colors, nursery elements, baby gifts and toys"
  } else if (titleLower.includes("anniversary")) {
    return "anniversary celebration, hearts, roses and flowers, romantic candles, milestone celebration"
  } else if (titleLower.includes("christmas") || titleLower.includes("xmas")) {
    return "Christmas celebration, beautifully decorated tree, wrapped presents, festive lights, holiday atmosphere"
  } else if (titleLower.includes("travel") || titleLower.includes("vacation")) {
    return "travel theme, vintage suitcases, world map, airplane, passport, adventure elements, vacation vibes"
  } else {
    return "elegant celebration with beautifully wrapped luxury gifts, golden ribbons and bows, festive atmosphere, premium gift collection"
  }
}

export async function POST(request: Request) {
  try {
    console.log("[v0] Background generation started")

    if (!process.env.FAL_KEY) {
      console.error("[v0] CRITICAL: FAL_KEY is missing!")
      return NextResponse.json({ error: "FAL_KEY not configured" }, { status: 500 })
    }

    const body = await request.json()
    const { title } = body

    console.log("[v0] Generating background for title:", title)

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const contextualTheme = getContextualImagePrompt(title)
    console.log("[v0] Contextual theme detected:", contextualTheme)

    const prompt = `Create a photorealistic banner background in landscape format.

IMPORTANT: DO NOT include any text, letters, or words in this image.

SCENE: ${contextualTheme}

STYLE REQUIREMENTS:
- Photorealistic, ultra high-quality imagery
- 16:9 landscape aspect ratio
- Professional photography style
- Luxurious golden and cream color tones
- Beautiful lighting with subtle bokeh effect in background
- Slightly soft focus to allow text overlay
- Center area should be slightly darker/vignette for text readability
- Premium gift collection aesthetic
- Magazine-quality composition
- Elegant and sophisticated mood

REMEMBER: This is a background only - absolutely NO TEXT or LETTERS should appear in the image.`

    console.log("[v0] Calling fal.ai API for background generation...")
    const result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt: prompt,
        image_size: "landscape_16_9",
        num_inference_steps: 28,
        num_images: 1,
        guidance_scale: 7.5,
      },
      logs: true,
    })

    console.log("[v0] fal.ai response received")

    const imageUrl = result.images?.[0]?.url

    if (!imageUrl) {
      console.error("[v0] No image URL in response:", JSON.stringify(result))
      return NextResponse.json({ error: "Failed to generate background - no URL in response" }, { status: 500 })
    }

    console.log("[v0] Background generated successfully:", imageUrl)

    return NextResponse.json({ backgroundUrl: imageUrl })
  } catch (error) {
    console.error("[v0] Background generation error:", error)
    console.error("[v0] Error details:", error instanceof Error ? error.message : String(error))

    return NextResponse.json(
      {
        error: "Failed to generate background",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
