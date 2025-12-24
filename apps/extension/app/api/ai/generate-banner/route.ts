import { NextResponse } from "next/server"
import * as fal from "@fal-ai/serverless-client"

fal.config({
  credentials: process.env.FAL_KEY,
})

function getContextualImagePrompt(title: string): string {
  const titleLower = title.toLowerCase()

  if (titleLower.includes("house") || titleLower.includes("warming") || titleLower.includes("home")) {
    return "beautiful modern house exterior with warm glowing windows, welcoming front door with wreath, blooming garden, sunset golden hour lighting, cozy home atmosphere, housewarming celebration vibe, elegant suburban setting with decorative elements"
  } else if (titleLower.includes("birthday") || titleLower.includes("bday")) {
    return "vibrant birthday celebration scene with colorful balloons floating, multi-tier birthday cake with lit candles, festive party decorations, confetti in the air, presents wrapped in shiny paper, joyful celebratory atmosphere with bokeh lights"
  } else if (
    titleLower.includes("wedding") ||
    titleLower.includes("marriage") ||
    titleLower.includes("bride") ||
    titleLower.includes("groom")
  ) {
    return "elegant wedding scene with beautiful floral arrangements, white roses and peonies, golden rings on silk cushion, romantic candlelight, luxurious wedding gifts, soft romantic lighting, sophisticated celebration atmosphere"
  } else if (titleLower.includes("retirement")) {
    return "retirement celebration with travel elements, open passport and tickets, beach sunset scene, relaxation theme, leisure items like golf clubs or books, achievement trophy, elegant sophisticated setting"
  } else if (titleLower.includes("graduation") || titleLower.includes("grad")) {
    return "graduation celebration with black graduation cap and tassel, diploma with ribbon, stack of textbooks, academic achievement symbols, festive balloons, proud accomplishment atmosphere, scholarly elements"
  } else if (titleLower.includes("baby") || titleLower.includes("shower")) {
    return "adorable baby shower scene with soft pastel colors, cute baby clothes and toys, gentle nursery elements, wrapped baby gifts, soft teddy bears, dreamy soft-focus atmosphere, delicate and sweet mood"
  } else if (titleLower.includes("anniversary")) {
    return "romantic anniversary celebration with red roses bouquet, champagne glasses, heart-shaped decorations, candlelit setting, elegant gifts with satin ribbons, intimate romantic atmosphere, milestone celebration"
  } else if (titleLower.includes("christmas") || titleLower.includes("xmas") || titleLower.includes("holiday")) {
    return "magical Christmas scene with decorated evergreen tree with twinkling lights, wrapped presents with bows, festive ornaments, cozy fireplace, holiday decorations, winter wonderland atmosphere, warm festive glow"
  } else if (titleLower.includes("travel") || titleLower.includes("vacation") || titleLower.includes("trip")) {
    return "exciting travel adventure scene with vintage suitcases with travel stickers, world map, airplane model, exotic destination postcards, passport and tickets, wanderlust atmosphere, adventure spirit"
  } else if (titleLower.includes("camera") || titleLower.includes("photo")) {
    return "professional photography setup with luxury camera equipment, lenses, artistic photography scene, creative workspace, premium tech gifts, modern sophisticated atmosphere"
  } else if (titleLower.includes("kitchen") || titleLower.includes("cooking") || titleLower.includes("chef")) {
    return "elegant kitchen scene with premium cookware, fresh ingredients beautifully arranged, culinary tools, gourmet cooking atmosphere, modern kitchen setting, foodie paradise"
  } else {
    return "elegant celebration scene with beautifully wrapped luxury gifts in golden and cream tones, silk ribbons and bows, festive atmosphere with soft bokeh lights, premium quality presents, sophisticated party setting"
  }
}

export async function POST(request: Request) {
  try {
    console.log("[v0] === PRODUCTION ENVIRONMENT DEBUG ===")
    console.log("[v0] NODE_ENV:", process.env.NODE_ENV)
    console.log("[v0] VERCEL_ENV:", process.env.VERCEL_ENV)
    console.log("[v0] FAL_KEY exists:", !!process.env.FAL_KEY)
    console.log("[v0] FAL_KEY length:", process.env.FAL_KEY?.length || 0)
    console.log("[v0] FAL_KEY prefix:", process.env.FAL_KEY?.substring(0, 10) || "NOT_FOUND")
    console.log("[v0] === END DEBUG ===")

    if (!process.env.FAL_KEY) {
      console.error("[v0] CRITICAL: FAL_KEY is missing in production!")
      return NextResponse.json(
        {
          error: "FAL_KEY not configured",
          env: process.env.VERCEL_ENV,
          nodeEnv: process.env.NODE_ENV,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Banner generation started")
    console.log("[v0] FAL_KEY configured:", !!process.env.FAL_KEY)

    const body = await request.json()
    const { title } = body

    console.log("[v0] Generating banner for title:", title)

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const contextualTheme = getContextualImagePrompt(title)
    console.log("[v0] Contextual theme detected:", contextualTheme)

    const prompt = `Create a stunning photorealistic gift collection banner background in landscape format.

CRITICAL: This is a BACKGROUND IMAGE - DO NOT add any text, typography, or letters to the image itself.

SCENE DESCRIPTION:
${contextualTheme}

VISUAL SPECIFICATIONS:
- Ultra-realistic, professional magazine-quality photography
- 16:9 landscape aspect ratio (1920x1080 ideal)
- Beautiful depth of field with soft bokeh effects
- Luxurious golden hour lighting with warm amber and honey tones
- Rich cream and golden color palette (#F5F1E8, #DAA520, #F4C430 color inspiration)
- Professional studio lighting with subtle rim lights and soft shadows
- Center composition with generous space for large text overlay
- Slightly darker vignette effect around center for text readability
- Premium, high-end, celebratory mood
- Sharp foreground elements with beautifully blurred background
- No text, no words, no typography, no letters - pure scenic background only
- Image should evoke the emotion and theme of: "${title}"

COMPOSITION:
- Rule of thirds composition
- Visual elements positioned to leave center-top area open for title text
- Balanced left-right symmetry
- Professional color grading with warm tones

MOOD & ATMOSPHERE:
Celebratory, joyful, elegant, premium, luxurious, warm, inviting, sophisticated, memorable

OUTPUT:
High-resolution background perfect for overlaying text, specifically the title "${title}" in large elegant typography.`

    console.log("[v0] Calling fal.ai API for background generation...")
    const result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt: prompt,
        image_size: "landscape_16_9",
        num_inference_steps: 35,
        num_images: 1,
        guidance_scale: 4.0,
      },
      logs: true,
    })

    console.log("[v0] fal.ai response received")

    const imageUrl = result.images?.[0]?.url

    if (!imageUrl) {
      console.error("[v0] No image URL in response:", JSON.stringify(result))
      return NextResponse.json({ error: "Failed to generate image - no URL in response" }, { status: 500 })
    }

    console.log("[v0] Background generated successfully:", imageUrl)

    return NextResponse.json({
      bannerUrl: imageUrl,
      title: title,
      theme: contextualTheme,
    })
  } catch (error) {
    console.error("[v0] Banner generation error:", error)
    console.error("[v0] Error details:", error instanceof Error ? error.message : String(error))
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return NextResponse.json(
      {
        error: "Failed to generate banner",
        details: error instanceof Error ? error.message : "Unknown error",
        env: process.env.VERCEL_ENV,
      },
      { status: 500 },
    )
  }
}
