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
    const { title, colorTheme, imageStyle, customImageWords, category, useCustomKeywordsOnly, guestAge } = body

    console.log("[v0] Generating banner for title:", title)
    console.log("[v0] Color theme:", colorTheme)
    console.log("[v0] Image style:", imageStyle)
    console.log("[v0] Custom image words:", customImageWords)
    console.log("[v0] Category:", category)
    console.log("[v0] Use custom keywords only:", useCustomKeywordsOnly)
    console.log("[v0] Guest age:", guestAge)

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Determine age-appropriate imagery
    let ageAppropriatePrompt = ''
    if (guestAge) {
      if (guestAge >= 18 && guestAge <= 25) {
        ageAppropriatePrompt = 'young adult celebration, trendy modern aesthetic, vibrant youthful energy, college-age party vibes, stylish contemporary design'
      } else if (guestAge >= 13 && guestAge < 18) {
        ageAppropriatePrompt = 'teenager celebration, cool trendy aesthetic, teen party vibes, modern youthful style'
      } else if (guestAge >= 6 && guestAge < 13) {
        ageAppropriatePrompt = 'kids celebration, fun playful elements, colorful cheerful atmosphere'
      } else if (guestAge < 6) {
        ageAppropriatePrompt = 'baby or toddler celebration, soft cute elements, adorable gentle atmosphere'
      } else if (guestAge >= 30 && guestAge < 50) {
        ageAppropriatePrompt = 'adult celebration, elegant sophisticated style, refined party atmosphere'
      } else if (guestAge >= 50) {
        ageAppropriatePrompt = 'milestone celebration, elegant classic style, dignified celebratory atmosphere'
      }
    }

    let contextualTheme = ''
    let customElementsPrompt = ''
    let categoryPrompt = ''
    
    // If using custom keywords only, prioritize them as the main image content
    if (useCustomKeywordsOnly && customImageWords && customImageWords.trim()) {
      const customWords = customImageWords.trim()
      const wordsList = customWords.split(',').map((w: string) => w.trim()).filter((w: string) => w)
      
      // Build the theme entirely around custom keywords with explicit descriptions
      contextualTheme = `beautiful celebration scene featuring EXACTLY these specific items: ${wordsList.join(', ')}`
      customElementsPrompt = `
ABSOLUTELY CRITICAL - USE THESE EXACT SPECIFIC ITEMS (NOT SUBSTITUTES):
${wordsList.map((word: string) => {
  // Add explicit descriptions for commonly confused items
  const lowerWord = word.toLowerCase()
  if (lowerWord.includes('lacrosse')) {
    if (lowerWord.includes('bat') || lowerWord.includes('stick')) {
      return `- LACROSSE STICK (NOT baseball bat): a long stick with a netted pocket/head at the end used for catching and throwing the lacrosse ball, must show the distinctive net/mesh pocket`
    } else if (lowerWord.includes('ball')) {
      return `- LACROSSE BALL (NOT baseball): small solid rubber ball, typically white or yellow, about 2.5 inches diameter, smooth surface`
    }
    return `- ${word}: LACROSSE equipment specifically (sport with sticks that have net pockets), NOT baseball or other sports`
  }
  return `- ${word}: prominently visible, detailed, EXACTLY as specified (not a similar substitute)`
}).join('\n')}

STRICT REQUIREMENTS:
- Use the EXACT items listed above - DO NOT substitute with similar items
- If "lacrosse" is mentioned, show LACROSSE equipment (sticks with net pockets, rubber balls) - NOT baseball
- If a specific sport is named, show ONLY that sport's equipment
- The image should feature ONLY these specific elements as the main focus
- DO NOT add generic party elements like baby toys, balloons, or cakes unless specifically requested above
- Be accurate to the specific sport/activity mentioned`
      
      console.log("[v0] Using ONLY custom keywords for image:", contextualTheme)
    } else {
      // Use category/image style as base, with optional custom words enhancement
      contextualTheme = imageStyle || getContextualImagePrompt(title)
      
      // Incorporate category into the theme if provided
      if (category && category.trim()) {
        categoryPrompt = `
INVITATION CATEGORY STYLE:
${category}
This category style should strongly influence the overall aesthetic, elements, and mood of the image.
`
        contextualTheme = `${category}, ${contextualTheme}`
        console.log("[v0] Enhanced theme with category:", contextualTheme)
      }
      
      // Incorporate custom words into the theme if provided
      if (customImageWords && customImageWords.trim()) {
        const customWords = customImageWords.trim()
        const wordsList = customWords.split(',').map((w: string) => w.trim()).filter((w: string) => w)
        customElementsPrompt = `

IMPORTANT - MUST INCLUDE THESE EXACT SPECIFIC ELEMENTS (NOT SUBSTITUTES):
${wordsList.map((word: string) => {
  const lowerWord = word.toLowerCase()
  if (lowerWord.includes('lacrosse')) {
    if (lowerWord.includes('bat') || lowerWord.includes('stick')) {
      return `- LACROSSE STICK: long stick with netted pocket/mesh head (NOT a baseball bat)`
    } else if (lowerWord.includes('ball')) {
      return `- LACROSSE BALL: small solid rubber ball, white or yellow (NOT a baseball)`
    }
    return `- ${word}: LACROSSE equipment with net pockets (NOT baseball)`
  }
  return `- ${word}: prominently visible, exactly as specified (not a substitute)`
}).join('\n')}

Use the EXACT items specified - do not substitute with similar items from other sports/activities.`
        
        contextualTheme = `${contextualTheme}, prominently featuring EXACTLY: ${wordsList.join(', ')}`
        console.log("[v0] Enhanced theme with custom words:", contextualTheme)
        console.log("[v0] Custom elements prompt:", customElementsPrompt)
      }
    }
    
    // Add age-appropriate styling to the theme
    if (ageAppropriatePrompt) {
      contextualTheme = `${contextualTheme}, ${ageAppropriatePrompt}`
      console.log("[v0] Enhanced theme with age-appropriate styling:", ageAppropriatePrompt)
    }
    
    console.log("[v0] Theme for generation:", contextualTheme)
    
    // Map color theme hex to color descriptions (warm and cool colors)
    const colorDescriptions: Record<string, string> = {
      // Warm colors
      '#DAA520': 'golden, honey, amber tones',
      '#FF6B6B': 'coral, warm pink, peach tones',
      '#EA580C': 'sunset orange, warm tangerine tones',
      '#DC2626': 'crimson red, warm ruby tones',
      '#D97706': 'amber, warm honey, mustard tones',
      '#BE185D': 'rose, warm magenta, pink tones',
      // Cool colors
      '#0EA5E9': 'ocean blue, sky blue, aqua tones',
      '#14B8A6': 'teal, turquoise, seafoam tones',
      '#9333EA': 'royal purple, violet, lavender tones',
      '#6366F1': 'indigo, deep blue, periwinkle tones',
      '#10B981': 'emerald green, jade, mint tones',
      '#475569': 'slate gray, charcoal, sophisticated neutral tones',
    }
    const colorDescription = colorDescriptions[colorTheme] || 'golden, honey, amber tones'

    // Determine if color is warm or cool for mood description
    const isWarmColor = ['#DAA520', '#FF6B6B', '#EA580C', '#DC2626', '#D97706', '#BE185D'].includes(colorTheme)
    const moodDescription = isWarmColor 
      ? 'warm, inviting, cozy, celebratory, joyful'
      : 'cool, elegant, sophisticated, serene, refined'

    const prompt = `Create a stunning photorealistic celebration banner background in landscape format.

CRITICAL: This is a BACKGROUND IMAGE - DO NOT add any text, typography, or letters to the image itself.
${categoryPrompt}
SCENE DESCRIPTION:
${contextualTheme}
${customElementsPrompt}

COLOR PALETTE:
- Primary color theme: ${colorDescription}
- Rich, ${isWarmColor ? 'warm' : 'cool'}, inviting color scheme
- Complementary colors that enhance the main theme

VISUAL SPECIFICATIONS:
- Ultra-realistic, professional magazine-quality photography
- 16:9 landscape aspect ratio (1920x1080 ideal)
- Beautiful depth of field with soft bokeh effects
- Professional studio lighting with subtle rim lights and soft shadows
- Center composition with generous space for large text overlay
- Premium, high-end, celebratory mood
- Sharp foreground elements with beautifully blurred background
- No text, no words, no typography, no letters - pure scenic background only
- Image should evoke the emotion and theme of: "${title}"

COMPOSITION:
- Rule of thirds composition
- Visual elements positioned to leave center-top area open for title text
- Balanced left-right symmetry
- Professional color grading with ${colorDescription}

MOOD & ATMOSPHERE:
${moodDescription}, elegant, premium, luxurious, sophisticated, memorable

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
