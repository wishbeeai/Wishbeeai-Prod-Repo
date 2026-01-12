import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// In-memory store for variants (use Redis in production)
// Using both user ID and a simple "latest" key for fallback
interface VariantData {
  variants: Record<string, string>
  specifications?: Record<string, string>
  url: string
  image?: string
  title?: string
  price?: number
  timestamp: number
  retrieved: boolean
}

// Use global object to survive hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var variantStore: Map<string, VariantData> | undefined
}

// Initialize the global store if it doesn't exist
if (!global.variantStore) {
  global.variantStore = new Map<string, VariantData>()
  console.log('[save-variants] Initialized NEW global variantStore')
}

const variantStore = global.variantStore

// CORS headers for extension
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Token',
  'Access-Control-Allow-Credentials': 'true',
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

// POST - Save variants from extension
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { variants, specifications, url, timestamp, sessionToken, image, title, price } = body

    console.log('[save-variants] ========== NEW VARIANT DATA RECEIVED ==========')
    console.log('[save-variants] URL:', url?.substring(0, 80))
    console.log('[save-variants] Variant count:', Object.keys(variants || {}).length)
    Object.entries(variants || {}).forEach(([key, value]) => {
      console.log(`[save-variants] ✅ ${key}: ${value}`)
    })
    console.log('[save-variants] Image:', image?.substring(0, 50))
    console.log('[save-variants] ================================================')

    if (!variants || typeof variants !== 'object') {
      return NextResponse.json({ error: 'Invalid variants data' }, { status: 400, headers: corsHeaders })
    }

    // Try to get user ID for authenticated storage
    let storeKey = 'latest' // Fallback key
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        storeKey = user.id
      }
    } catch (e) {
      console.log('[save-variants] Auth check failed, using fallback key')
    }

    // Also use session token if provided
    if (sessionToken) {
      storeKey = sessionToken
    }

    // Clear any old data first to ensure fresh data
    variantStore.clear()
    
    // Store variants with fresh timestamp
    const now = Date.now()
    const dataToStore: VariantData = {
      variants,
      specifications: specifications || {},
      url: url || '',
      image: image || undefined,
      title: title || undefined,
      price: price || undefined,
      timestamp: now,
      retrieved: false
    }
    
    variantStore.set(storeKey, dataToStore)

    // Also store in "latest" for easy retrieval
    variantStore.set('latest', { ...dataToStore })

    console.log('[save-variants] ========== POST RECEIVED ==========')
    console.log('[save-variants] POST - Key:', storeKey)
    console.log('[save-variants] POST - Received image:', image ? image.substring(0, 80) : 'NONE')
    console.log('[save-variants] POST - Variants:', JSON.stringify(variants))
    console.log('[save-variants] POST - Specifications:', JSON.stringify(specifications || {}))
    console.log('[save-variants] POST - Store size after save:', variantStore.size)
    console.log('[save-variants] POST - Stored with timestamp:', now)
    console.log('[save-variants] ==================================')

    // Auto-expire after 5 minutes
    setTimeout(() => {
      variantStore.delete(storeKey)
      variantStore.delete('latest')
    }, 5 * 60 * 1000)

    return NextResponse.json({ success: true, key: storeKey }, { headers: corsHeaders })
  } catch (error) {
    console.error('[save-variants] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders })
  }
}

// GET - Retrieve variants for the modal
export async function GET(req: NextRequest) {
  try {
    // Try multiple keys: user ID first, then session token, then "latest"
    let storeKey = 'latest'
    
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        storeKey = user.id
      }
    } catch (e) {
      console.log('[save-variants] GET auth check failed, using latest key')
    }

    // Check session token from query param
    const sessionToken = req.nextUrl.searchParams.get('sessionToken')
    if (sessionToken) {
      storeKey = sessionToken
    }

    // Try user-specific key first
    let stored = variantStore.get(storeKey)
    
    // Fallback to "latest" if not found
    if (!stored && storeKey !== 'latest') {
      stored = variantStore.get('latest')
      console.log('[save-variants] Falling back to latest key')
    }
    
    console.log('[save-variants] GET - Key:', storeKey, 'Found:', !!stored, 'Store size:', variantStore.size)
    
    if (!stored) {
      console.log('[save-variants] GET - No data found, returning null')
      return NextResponse.json({ variants: null }, { headers: corsHeaders })
    }

    // Check if data is still fresh (within 5 minutes)
    if (Date.now() - stored.timestamp > 5 * 60 * 1000) {
      variantStore.delete(storeKey)
      variantStore.delete('latest')
      return NextResponse.json({ variants: null }, { headers: corsHeaders })
    }

    // Only return if not already retrieved (prevent duplicate processing)
    if (stored.retrieved) {
      console.log('[save-variants] GET - Data already retrieved, returning null')
      console.log('[save-variants] GET - Stored timestamp:', stored.timestamp)
      return NextResponse.json({ variants: null }, { headers: corsHeaders })
    }
    
    console.log('[save-variants] GET - Fresh data found, returning...')
    console.log('[save-variants] GET - Image URL:', stored.image?.substring(0, 100))

    // Mark as retrieved
    stored.retrieved = true
    variantStore.set(storeKey, stored)
    
    // Also mark latest as retrieved
    const latestStored = variantStore.get('latest')
    if (latestStored) {
      latestStored.retrieved = true
      variantStore.set('latest', latestStored)
    }
    
    // Delete after 10 seconds
    setTimeout(() => {
      variantStore.delete(storeKey)
      variantStore.delete('latest')
    }, 10 * 1000)

    console.log('[save-variants] GET - Returning data:')
    console.log('[save-variants] GET - Has image:', !!stored.image, stored.image?.substring(0, 80))
    console.log('[save-variants] GET - Variants:', JSON.stringify(stored.variants))
    console.log('[save-variants] GET - Specifications:', JSON.stringify(stored.specifications || {}))
    console.log('[save-variants] GET - Color:', stored.variants.color || 'none')

    return NextResponse.json({
      variants: stored.variants,
      specifications: stored.specifications || {},
      url: stored.url,
      image: stored.image,
      title: stored.title,
      price: stored.price,
      timestamp: stored.timestamp
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('[save-variants] GET Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders })
  }
}
