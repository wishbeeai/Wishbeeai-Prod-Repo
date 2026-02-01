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
    const { title, colorTheme, imageStyle, customImageWords, category, useCustomKeywordsOnly, guestAge, eventVibe } = body

    console.log("[v0] Generating banner for title:", title)
    console.log("[v0] Occasion/category:", category)
    console.log("[v0] Event Vibe:", eventVibe)
    console.log("[v0] Custom image words:", customImageWords)
    console.log("[v0] Use custom keywords only:", useCustomKeywordsOnly)

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

    // Step 2: EVENT VIBE – resolved first so we know if Boho (affects category use)
    const vibeDescriptions: Record<string, string> = {
      Minimalist: 'minimalist aesthetic: clean lines, simple composition, neutral tones, uncluttered, elegant simplicity',
      Boho: 'boho aesthetic: natural textures, woven macramé, rattan, terracotta, pampas grass, dried flowers, earthy neutrals, plants, relaxed bohemian vibe',
      Cyberpunk: 'cyberpunk aesthetic: neon lights, futuristic, tech, urban night, high contrast',
      Retro: 'retro aesthetic: vintage, 70s or 80s style, warm nostalgic tones',
      Elegant: 'elegant aesthetic: sophisticated, luxurious, refined, soft lighting',
      Tropical: 'tropical aesthetic: palm leaves, lush greenery, bright florals, vacation vibe',
    }
    const vibeKey = (eventVibe || '').trim()
    const isBohoVibe = vibeKey === 'Boho'

    // Step 1: PRODUCT/EVENT first – what is this celebration for? (always include before vibe and keywords)
    // When Boho: do NOT include long category text (balloons, cake, confetti) – it makes the model add balls/party items
    const safeCategory = isBohoVibe ? '' : (category && category.trim() ? category : '')
    const productDescription = title
      ? `Celebration/event: "${title}". ${safeCategory ? `Occasion: ${safeCategory}.` : ''} The image must reflect this event/occasion first.`
      : safeCategory
        ? `Occasion: ${safeCategory}. The image must reflect this occasion.`
        : 'Celebration banner. The image must reflect the event.'
    contextualTheme = productDescription
    console.log("[v0] Product/event first:", productDescription.substring(0, 100))

    if (vibeKey && vibeDescriptions[vibeKey]) {
      contextualTheme = `${contextualTheme} Style the image in ${vibeDescriptions[vibeKey]}.`
      if (isBohoVibe) {
        contextualTheme = `${contextualTheme} BOHO ONLY: no ball, no balls, no spheres, no sports, no sports equipment, no party balloons, no cakes, no confetti – only natural textures, plants, macramé, rattan, dried flowers, earthy tones.`
      }
      console.log("[v0] Event Vibe applied:", vibeKey)
    }

    // Step 3: CUSTOM IMAGE KEYWORDS (optional) – refine style; never add balls/sports unless user typed a sport
    const customWords = (customImageWords || '').trim()
    const wordsList = customWords ? customWords.split(/[\s,]+/).map((w: string) => w.trim()).filter((w: string) => w.length > 0) : []
    const hasExplicitSport = wordsList.some((w: string) => /^lacrosse$|^baseball$|^soccer$|^football$|^basketball$|^hockey$|^tennis$|^golf$|sport\b/i.test(w))

    if (wordsList.length > 0) {
      const phrase = wordsList.join(' ').toLowerCase()
      const isBoho = phrase.includes('boho')
      const isEyeCatcher = phrase.includes('eye') && (phrase.includes('catcher') || phrase.includes('eye catcher') || phrase.includes('eyecatcher'))
      let styleExtra = wordsList.join(' ')
      if (isBoho) {
        styleExtra = 'boho aesthetic: natural textures, macramé, rattan, plants, earthy tones, relaxed bohemian vibe'
        if (isEyeCatcher) styleExtra += '. Eye-catching, striking, visually compelling composition'
      } else if (isEyeCatcher) {
        styleExtra = 'eye-catching, striking, visually compelling. ' + wordsList.join(' ')
      }
      contextualTheme = `${contextualTheme} Additionally: ${styleExtra}.`
      customElementsPrompt = `
STYLE RULES:
- Reflect the custom style above. Do NOT add balls, spheres, sports equipment, party balloons, cakes, or unrelated objects unless the user's keywords explicitly request a sport or party item.
- If Event Vibe is Boho (or boho in keywords), use ONLY boho/natural/earthy elements – no ball, no balls, no spheres, no sports, no party decor.`
      if (hasExplicitSport) {
        customElementsPrompt += `
- User requested a sport: include only that sport's equipment (e.g. lacrosse stick with net pocket if "lacrosse").`
      }
      console.log("[v0] Custom keywords applied (product → vibe → keywords):", contextualTheme.substring(0, 120))
    } else {
      customElementsPrompt = `
STYLE RULES:
- Style the image according to the Event Vibe and occasion above.
- Do NOT add sports equipment, party balloons, cakes, or generic party objects unless they match the occasion and vibe.`
      if (isBohoVibe) {
        customElementsPrompt = `
STYLE RULES:
- BOHO STYLE ONLY. Use only natural textures, plants, macramé, rattan, dried flowers, earthy tones. Do NOT add any ball, balls, spheres, sports items, party balloons, cakes, or confetti.`
      }
    }

    // When custom-only mode was requested, still keep product → vibe → keywords order (already built above)
    if (useCustomKeywordsOnly && customWords) {
      // Ensure product is still first; we already have product + vibe + custom in contextualTheme
      console.log("[v0] Using product-first then vibe then custom keywords:", contextualTheme.substring(0, 150))
    }

    // Category prompt for non-custom path (invitation category style). When Boho, skip – long category text mentions balloons/cake and causes balls/party items in image
    if (category && category.trim() && !useCustomKeywordsOnly && !isBohoVibe) {
      categoryPrompt = `
INVITATION CATEGORY STYLE:
${category}
`
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
