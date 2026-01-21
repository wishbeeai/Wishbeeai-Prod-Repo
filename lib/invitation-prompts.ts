// =============================================================================
// AI INVITATION SYSTEM - Prompt Templates & Safety Validation
// =============================================================================

import type {
  OccasionType,
  ThemeStyle,
  ToneType,
  InvitationParams,
  SafetyValidationResult,
  ColorPalette,
} from '@/types/invitations'

// =============================================================================
// PROMPT TEMPLATES
// =============================================================================

const OCCASION_PROMPTS: Record<OccasionType, string> = {
  birthday: 'A birthday celebration invitation with festive elements like balloons, confetti, cake, and party decorations',
  wedding: 'An elegant wedding invitation with romantic elements like flowers, rings, doves, and ornate borders',
  baby_shower: 'A sweet baby shower invitation with gentle nursery elements like rattles, onesies, stars, and soft toys',
  holiday: 'A festive holiday invitation with seasonal decorations, warm lighting, and celebratory motifs',
  corporate: 'A professional corporate event invitation with clean lines, business-appropriate imagery, and elegant typography space',
  graduation: 'A graduation celebration invitation with academic elements like caps, diplomas, and achievement symbols',
  anniversary: 'A romantic anniversary invitation with elegant hearts, roses, and commemorative design elements',
  housewarming: 'A warm housewarming invitation with home imagery, keys, welcome elements, and cozy decorations',
  retirement: 'A celebratory retirement invitation with relaxation themes, achievements, and new chapter imagery',
  custom: 'A beautiful celebration invitation with elegant decorative elements and professional design',
}

const THEME_MODIFIERS: Record<ThemeStyle, string> = {
  elegant: 'elegant, sophisticated, refined, luxurious textures, gold accents, serif typography space',
  fun: 'fun, vibrant, colorful, playful elements, bold patterns, energetic composition',
  modern: 'modern, clean, minimalist, geometric shapes, contemporary design, sans-serif typography space',
  minimal: 'minimalist, simple, clean lines, ample white space, subtle details, understated elegance',
  luxury: 'luxurious, premium, gold foil effects, marble textures, high-end materials, opulent details',
  vintage: 'vintage, retro, nostalgic, aged paper texture, classic ornaments, timeless design',
  playful: 'playful, whimsical, cartoon-style elements, bright colors, fun illustrations',
  romantic: 'romantic, soft, dreamy, floral elements, pastel colors, delicate details',
  professional: 'professional, corporate, clean, structured layout, business appropriate, polished',
}

const TONE_MODIFIERS: Record<ToneType, string> = {
  playful: 'cheerful mood, happy atmosphere, joyful energy',
  formal: 'formal presentation, dignified style, traditional elegance',
  warm: 'warm and inviting, cozy atmosphere, friendly feeling',
  celebratory: 'celebratory mood, festive energy, exciting atmosphere',
  heartfelt: 'heartfelt and sincere, emotional warmth, meaningful connection',
  professional: 'professional tone, business-like, competent presentation',
}

// =============================================================================
// LAYOUT INSTRUCTIONS (Consistent across all variations)
// =============================================================================

const LAYOUT_INSTRUCTIONS = `
CRITICAL LAYOUT REQUIREMENTS:
- Create a vertical invitation card format (portrait orientation, 4:5 aspect ratio)
- Leave a prominent BLANK SPACE at the top center for the event title text (approximately 20% of height)
- Leave a BLANK SPACE in the middle for event details text (date, time, location)
- Leave a small BLANK SPACE at the bottom for host name/RSVP
- The blank spaces should be subtle, lighter areas that clearly accommodate overlaid text
- Decorative elements should frame these text areas, not overlap them
- Ensure high contrast between text areas and decorative elements
- Background should support white or dark text overlay
- Design should be symmetrical and balanced
`

const DALLE_QUALITY_INSTRUCTIONS = `
QUALITY REQUIREMENTS:
- Ultra high quality, 4K resolution appearance
- Sharp, crisp details
- Professional graphic design quality
- Print-ready appearance
- No text, letters, numbers, or words in the image
- No watermarks or signatures
`

const FAL_QUALITY_INSTRUCTIONS = `
QUALITY: masterpiece, best quality, highly detailed, professional design, sharp focus, 8k uhd
NEGATIVE: text, letters, words, numbers, watermark, signature, blurry, low quality, distorted, ugly, deformed
`

// =============================================================================
// SAFETY VALIDATION
// =============================================================================

const BLOCKED_TERMS = [
  // Violence
  'violence', 'violent', 'blood', 'gore', 'weapon', 'gun', 'knife', 'death', 'kill', 'murder',
  // Adult content
  'nude', 'naked', 'sexual', 'erotic', 'nsfw', 'porn', 'xxx',
  // Hate speech
  'hate', 'racist', 'nazi', 'terrorism', 'terrorist',
  // Copyrighted characters
  'mickey mouse', 'disney', 'marvel', 'pokemon', 'pikachu', 'batman', 'superman',
  'spiderman', 'hello kitty', 'barbie', 'frozen', 'elsa', 'minions',
  // Brand names
  'coca cola', 'nike', 'adidas', 'apple logo', 'google', 'facebook', 'instagram',
  // Political
  'political', 'election', 'vote for', 'campaign',
  // Other inappropriate
  'drugs', 'alcohol abuse', 'gambling', 'cigarette', 'vape',
]

const SENSITIVE_REPLACEMENTS: Record<string, string> = {
  'wine': 'elegant beverages',
  'champagne': 'celebration drinks',
  'beer': 'refreshments',
  'cocktail': 'festive drinks',
}

export function validateAndSanitizePrompt(prompt: string): SafetyValidationResult {
  const lowerPrompt = prompt.toLowerCase()
  const issues: string[] = []
  let sanitizedPrompt = prompt

  // Check for blocked terms
  for (const term of BLOCKED_TERMS) {
    if (lowerPrompt.includes(term)) {
      issues.push(`Blocked term detected: "${term}"`)
    }
  }

  // Apply sensitive replacements
  for (const [term, replacement] of Object.entries(SENSITIVE_REPLACEMENTS)) {
    if (lowerPrompt.includes(term)) {
      sanitizedPrompt = sanitizedPrompt.replace(new RegExp(term, 'gi'), replacement)
    }
  }

  // Check for potential prompt injection
  const injectionPatterns = [
    /ignore previous/i,
    /disregard instructions/i,
    /forget everything/i,
    /new instructions/i,
    /system prompt/i,
  ]

  for (const pattern of injectionPatterns) {
    if (pattern.test(prompt)) {
      issues.push('Potential prompt injection detected')
      break
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    sanitizedPrompt: issues.length === 0 ? sanitizedPrompt : undefined,
  }
}

// =============================================================================
// PROMPT BUILDERS
// =============================================================================

function colorPaletteToPrompt(palette: ColorPalette): string {
  return `Color scheme: primary ${palette.primary}, secondary ${palette.secondary}, accent ${palette.accent}, background ${palette.background}`
}

export function buildDallePrompt(params: InvitationParams): string {
  const occasionPrompt = OCCASION_PROMPTS[params.occasion]
  const themeModifier = THEME_MODIFIERS[params.theme]
  const toneModifier = TONE_MODIFIERS[params.tone]
  const colorPrompt = colorPaletteToPrompt(params.colorPalette)

  const prompt = `
Create a beautiful invitation card design:

${occasionPrompt}

Style: ${themeModifier}
Mood: ${toneModifier}
${colorPrompt}

${LAYOUT_INSTRUCTIONS}

${DALLE_QUALITY_INSTRUCTIONS}

Event context: "${params.eventTitle}" ${params.customMessage ? `- ${params.customMessage}` : ''}
`.trim()

  return prompt
}

export function buildFalPrompt(params: InvitationParams, variationIndex: number): string {
  const occasionPrompt = OCCASION_PROMPTS[params.occasion]
  const themeModifier = THEME_MODIFIERS[params.theme]
  const toneModifier = TONE_MODIFIERS[params.tone]
  const colorPrompt = colorPaletteToPrompt(params.colorPalette)

  // Add variation-specific modifiers
  const variationStyles = [
    'watercolor style, soft edges, artistic brushstrokes',
    'flat design, vector illustration style, clean shapes',
    'paper craft style, 3D paper elements, layered effect',
    'art deco style, geometric patterns, gold lines',
    'botanical illustration, hand-drawn flowers, nature elements',
    'abstract modern, bold shapes, contemporary art',
  ]

  const variationStyle = variationStyles[variationIndex % variationStyles.length]

  const prompt = `
${occasionPrompt}, ${themeModifier}, ${toneModifier}, ${variationStyle}, ${colorPrompt}, 
invitation card design, vertical format, text space at top and center, decorative border,
${FAL_QUALITY_INSTRUCTIONS}
`.trim()

  return prompt
}

export function buildNegativePrompt(): string {
  return `
text, words, letters, numbers, signature, watermark, logo, brand name,
low quality, blurry, pixelated, distorted, deformed, ugly,
realistic human faces, photographs of people,
violent, gore, blood, weapons,
nsfw, nude, sexual content,
copyrighted characters, trademarked logos
`.trim()
}

// =============================================================================
// STYLE VARIATIONS FOR FAL
// =============================================================================

export const FAL_STYLE_PRESETS = {
  watercolor: {
    prompt_suffix: 'watercolor painting style, soft washes, artistic brushstrokes, delicate colors',
    steps: 25,
    cfg_scale: 7,
  },
  vector: {
    prompt_suffix: 'flat vector illustration, clean shapes, minimal gradients, modern design',
    steps: 20,
    cfg_scale: 8,
  },
  papercraft: {
    prompt_suffix: 'paper craft style, 3D paper layers, cut paper effect, dimensional',
    steps: 28,
    cfg_scale: 7.5,
  },
  artdeco: {
    prompt_suffix: 'art deco style, geometric patterns, gold accents, 1920s elegance',
    steps: 25,
    cfg_scale: 7,
  },
  botanical: {
    prompt_suffix: 'botanical illustration, hand-drawn flowers, vintage nature prints',
    steps: 30,
    cfg_scale: 6.5,
  },
  abstract: {
    prompt_suffix: 'abstract modern art, bold geometric shapes, contemporary design',
    steps: 22,
    cfg_scale: 8,
  },
}

// =============================================================================
// COST ESTIMATION
// =============================================================================

export const GENERATION_COSTS = {
  openai: {
    'dall-e-3': {
      '1024x1024': 0.04,
      '1024x1792': 0.08,
      '1792x1024': 0.08,
    },
    'dall-e-2': {
      '1024x1024': 0.02,
      '512x512': 0.018,
      '256x256': 0.016,
    },
  },
  fal: {
    'stable-diffusion-xl': 0.003,
    'flux-schnell': 0.003,
    'flux-dev': 0.025,
  },
}

export function estimateCost(
  heroCount: number,
  variationCount: number,
  dalleSize: '1024x1024' | '1024x1792' = '1024x1792'
): { openaiCost: number; falCost: number; totalCost: number } {
  const openaiCost = heroCount * GENERATION_COSTS.openai['dall-e-3'][dalleSize]
  const falCost = variationCount * GENERATION_COSTS.fal['flux-schnell']
  
  return {
    openaiCost,
    falCost,
    totalCost: openaiCost + falCost,
  }
}

// =============================================================================
// DISCLAIMER TEXT
// =============================================================================

export const AI_DISCLAIMER = {
  short: 'AI-generated design',
  medium: 'This invitation design was created using AI image generation.',
  full: 'This invitation design was created using artificial intelligence (AI) image generation technology. The design is unique and was generated specifically for your event. While we strive for quality, AI-generated images may occasionally contain minor imperfections.',
  compliance: 'AI-generated content. No real persons depicted. Design created by Wishbee.ai using DALL-E and Stable Diffusion.',
}
