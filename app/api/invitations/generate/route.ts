// =============================================================================
// AI INVITATION GENERATION - Main API Route
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import * as fal from '@fal-ai/serverless-client'
import { 
  buildDallePrompt, 
  buildFalPrompt, 
  buildNegativePrompt,
  validateAndSanitizePrompt,
  estimateCost,
  FAL_STYLE_PRESETS,
} from '@/lib/invitation-prompts'
import type { 
  GenerateInvitationRequest, 
  GenerateInvitationResponse,
  InvitationParams,
} from '@/types/invitations'
import { z } from 'zod'

// =============================================================================
// CONFIGURATION
// =============================================================================

// Lazy initialization to avoid build errors when env vars are not set
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured')
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

function initFalClient() {
  if (process.env.FAL_KEY) {
    fal.config({
      credentials: process.env.FAL_KEY,
    })
  }
}

// Validation schema
const InvitationParamsSchema = z.object({
  occasion: z.enum(['birthday', 'wedding', 'baby_shower', 'holiday', 'corporate', 'graduation', 'anniversary', 'housewarming', 'retirement', 'custom']),
  theme: z.enum(['elegant', 'fun', 'modern', 'minimal', 'luxury', 'vintage', 'playful', 'romantic', 'professional']),
  tone: z.enum(['playful', 'formal', 'warm', 'celebratory', 'heartfelt', 'professional']),
  colorPalette: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
    text: z.string(),
  }),
  eventTitle: z.string().min(1).max(100),
  eventDate: z.string().optional(),
  eventTime: z.string().optional(),
  eventLocation: z.string().max(500).optional(),
  hostName: z.string().max(255).optional(),
  customMessage: z.string().max(1000).optional(),
  productReference: z.object({
    id: z.string(),
    name: z.string(),
    imageUrl: z.string().optional(),
  }).optional(),
  variationCount: z.number().min(1).max(6).optional(),
})

const RequestSchema = z.object({
  params: InvitationParamsSchema,
  generateHero: z.boolean().optional().default(true),
  generateVariations: z.boolean().optional().default(true),
  variationCount: z.number().min(1).max(6).optional().default(4),
})

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

async function generateHeroImage(params: InvitationParams): Promise<{ url: string; prompt: string }> {
  const prompt = buildDallePrompt(params)
  
  // Validate prompt
  const validation = validateAndSanitizePrompt(prompt)
  if (!validation.isValid) {
    throw new Error(`Invalid prompt: ${validation.issues.join(', ')}`)
  }

  console.log('[Invitation] Generating hero image with DALL-E 3...')
  
  const response = await getOpenAIClient().images.generate({
    model: 'dall-e-3',
    prompt: validation.sanitizedPrompt || prompt,
    n: 1,
    size: '1024x1792', // Portrait for invitation
    quality: 'hd',
    style: 'vivid',
  })

  const imageUrl = response.data[0]?.url
  if (!imageUrl) {
    throw new Error('No image URL returned from OpenAI')
  }

  return { url: imageUrl, prompt }
}

async function generateVariationImage(
  params: InvitationParams, 
  variationIndex: number
): Promise<{ url: string; prompt: string; styleModifiers: string }> {
  const prompt = buildFalPrompt(params, variationIndex)
  const negativePrompt = buildNegativePrompt()
  
  // Get style preset
  const styleKeys = Object.keys(FAL_STYLE_PRESETS) as Array<keyof typeof FAL_STYLE_PRESETS>
  const styleKey = styleKeys[variationIndex % styleKeys.length]
  const stylePreset = FAL_STYLE_PRESETS[styleKey]

  console.log(`[Invitation] Generating variation ${variationIndex + 1} with FAL (${styleKey})...`)

  const result = await fal.subscribe('fal-ai/flux/schnell', {
    input: {
      prompt: `${prompt}, ${stylePreset.prompt_suffix}`,
      image_size: {
        width: 768,
        height: 1024,
      },
      num_inference_steps: stylePreset.steps,
      num_images: 1,
      enable_safety_checker: true,
    },
    logs: true,
  }) as { images: Array<{ url: string }> }

  const imageUrl = result?.images?.[0]?.url
  if (!imageUrl) {
    throw new Error(`No image URL returned from FAL for variation ${variationIndex + 1}`)
  }

  return { 
    url: imageUrl, 
    prompt,
    styleModifiers: stylePreset.prompt_suffix,
  }
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    console.log('[Invitation] Generation request received')

    // Check API keys
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured',
        details: 'Please set OPENAI_API_KEY in environment variables',
      }, { status: 500 })
    }

    if (!process.env.FAL_KEY) {
      return NextResponse.json({
        success: false,
        error: 'FAL API key not configured',
        details: 'Please set FAL_KEY in environment variables',
      }, { status: 500 })
    }

    // Initialize FAL client
    initFalClient()

    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        details: 'Please sign in to generate invitations',
      }, { status: 401 })
    }

    // Parse and validate request
    const body = await request.json()
    const validationResult = RequestSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request parameters',
        details: validationResult.error.errors,
      }, { status: 400 })
    }

    const { params, generateHero, generateVariations, variationCount } = validationResult.data

    // Check user generation limits
    const { data: limitCheck, error: limitError } = await supabase
      .rpc('check_and_increment_generation_limit', { p_user_id: user.id })

    if (limitError) {
      console.error('[Invitation] Limit check error:', limitError)
      // Continue anyway if function doesn't exist yet
    } else if (limitCheck && !limitCheck.allowed) {
      return NextResponse.json({
        success: false,
        error: `Generation limit reached: ${limitCheck.reason}`,
        details: {
          dailyRemaining: limitCheck.daily_remaining,
          monthlyRemaining: limitCheck.monthly_remaining,
        },
      }, { status: 429 })
    }

    // Estimate costs
    const heroCount = generateHero ? 1 : 0
    const varCount = generateVariations ? variationCount : 0
    const costEstimate = estimateCost(heroCount, varCount)

    // Create invitation record
    const { data: invitation, error: insertError } = await supabase
      .from('invitations')
      .insert({
        user_id: user.id,
        event_title: params.eventTitle,
        event_date: params.eventDate || null,
        event_time: params.eventTime || null,
        event_location: params.eventLocation || null,
        host_name: params.hostName || null,
        custom_message: params.customMessage || null,
        occasion: params.occasion,
        theme: params.theme,
        tone: params.tone,
        color_palette: params.colorPalette,
        product_reference: params.productReference || null,
        status: 'generating',
        share_token: generateShareToken(),
      })
      .select()
      .single()

    if (insertError || !invitation) {
      console.error('[Invitation] Insert error:', insertError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create invitation record',
        details: insertError?.message,
      }, { status: 500 })
    }

    console.log('[Invitation] Created invitation record:', invitation.id)

    // Generate images
    const generatedImages: Array<{
      type: 'hero' | 'variation'
      url: string
      prompt: string
      source: 'openai' | 'fal'
      styleModifiers?: string
    }> = []

    let openaiCalls = 0
    let openaiCost = 0
    let falCalls = 0
    let falCost = 0

    // Generate hero image with DALL-E
    if (generateHero) {
      try {
        const heroResult = await generateHeroImage(params)
        generatedImages.push({
          type: 'hero',
          url: heroResult.url,
          prompt: heroResult.prompt,
          source: 'openai',
        })
        openaiCalls = 1
        openaiCost = costEstimate.openaiCost
        console.log('[Invitation] Hero image generated successfully')
      } catch (error) {
        console.error('[Invitation] Hero generation error:', error)
        // Continue with variations even if hero fails
      }
    }

    // Generate variations with FAL
    if (generateVariations) {
      const variationPromises = Array.from({ length: variationCount }, (_, i) =>
        generateVariationImage(params, i)
          .then(result => ({
            type: 'variation' as const,
            url: result.url,
            prompt: result.prompt,
            source: 'fal' as const,
            styleModifiers: result.styleModifiers,
          }))
          .catch(error => {
            console.error(`[Invitation] Variation ${i + 1} error:`, error)
            return null
          })
      )

      const variationResults = await Promise.all(variationPromises)
      const successfulVariations = variationResults.filter(Boolean) as typeof generatedImages
      
      generatedImages.push(...successfulVariations)
      falCalls = successfulVariations.length
      falCost = falCalls * 0.003 // FAL cost per image
      
      console.log(`[Invitation] Generated ${successfulVariations.length}/${variationCount} variations`)
    }

    // Save generated images to database
    if (generatedImages.length > 0) {
      const imageRecords = generatedImages.map((img, index) => ({
        invitation_id: invitation.id,
        image_url: img.url,
        type: img.type,
        source: img.source,
        prompt: img.prompt,
        style_modifiers: img.styleModifiers || null,
        is_selected: index === 0, // Select first image by default
      }))

      const { error: imagesError } = await supabase
        .from('invitation_images')
        .insert(imageRecords)

      if (imagesError) {
        console.error('[Invitation] Images insert error:', imagesError)
      }
    }

    // Update invitation status and costs
    const totalCost = openaiCost + falCost
    const finalStatus = generatedImages.length > 0 ? 'completed' : 'failed'

    const { data: updatedInvitation, error: updateError } = await supabase
      .from('invitations')
      .update({
        status: finalStatus,
        openai_calls: openaiCalls,
        openai_cost: openaiCost,
        fal_calls: falCalls,
        fal_cost: falCost,
        total_cost: totalCost,
        selected_image_id: generatedImages[0] ? null : null, // Will be set after fetching
      })
      .eq('id', invitation.id)
      .select(`
        *,
        invitation_images (*)
      `)
      .single()

    if (updateError) {
      console.error('[Invitation] Update error:', updateError)
    }

    // Log cost
    if (openaiCalls > 0) {
      await supabase.from('generation_cost_log').insert({
        user_id: user.id,
        invitation_id: invitation.id,
        source: 'openai',
        model_name: 'dall-e-3',
        cost: openaiCost,
      }).catch(console.error)
    }

    if (falCalls > 0) {
      await supabase.from('generation_cost_log').insert({
        user_id: user.id,
        invitation_id: invitation.id,
        source: 'fal',
        model_name: 'flux-schnell',
        cost: falCost,
      }).catch(console.error)
    }

    console.log('[Invitation] Generation completed successfully')

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        status: finalStatus,
        shareToken: invitation.share_token,
        heroImage: generatedImages.find(img => img.type === 'hero'),
        variations: generatedImages.filter(img => img.type === 'variation'),
        costTracking: {
          openaiCalls,
          openaiCost,
          falCalls,
          falCost,
          totalCost,
        },
      },
      remainingCredits: limitCheck?.daily_remaining ?? null,
    } as GenerateInvitationResponse)

  } catch (error) {
    console.error('[Invitation] Unexpected error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate invitation',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
