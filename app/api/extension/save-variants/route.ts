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
  isModalPending?: boolean // Flag to indicate modal is waiting for this data
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

// Export helper to check if modal is pending (used by add-item route)
export function isModalPending(): boolean {
  const latest = variantStore.get('latest')
  if (!latest) return false
  // Check if recent (within 30 seconds) and not yet retrieved
  const isRecent = Date.now() - latest.timestamp < 30000
  return isRecent && latest.isModalPending === true && !latest.retrieved
}

// Helper to get CORS headers with dynamic origin
function getCorsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin') || '*'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Token, X-User-Email',
    'Access-Control-Allow-Credentials': 'true',
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { headers: getCorsHeaders(req) })
}

// Helper function to check if image is a color swatch or placeholder (not a product image)
// Be VERY conservative - only reject obvious placeholders, not legitimate product images
function isSwatchOrPlaceholderImage(imageUrl: string | undefined): boolean {
  if (!imageUrl) return true
  
  // Must be a valid URL
  if (!imageUrl.startsWith('http')) {
    console.log('[save-variants] Rejected - not a valid URL:', imageUrl.substring(0, 60))
    return true
  }
  
  const url = imageUrl.toLowerCase()
  
  // Only reject OBVIOUS placeholder patterns
  const invalidPatterns = [
    /\+\+/,               // Contains ++ (like 01++SjnuXRL) - placeholder
    /transparent-pixel/i, // Transparent placeholder pixel
    /blank\.gif/i,        // Blank GIF
    /placeholder\./i,     // Placeholder file
    /spacer\./i,          // Spacer image file
    /1x1\./i,             // 1x1 pixel
  ]
  
  // Check if URL matches any invalid pattern
  if (invalidPatterns.some(pattern => pattern.test(url))) {
    console.log('[save-variants] Rejected image - matches invalid pattern:', url.substring(0, 60))
    return true
  }
  
  // Check for very small images by size parameter (swatches are typically < 50px)
  const sizeMatch = url.match(/_(?:ss|sx|sy|us)(\d+)/i)
  if (sizeMatch && sizeMatch[1]) {
    const size = parseInt(sizeMatch[1], 10)
    // Only reject truly tiny images (< 50px) which are definitely swatches
    if (size < 50) {
      console.log('[save-variants] Rejected tiny image (size ' + size + '):', url.substring(0, 60))
      return true
    }
  }
  
  // Accept the image
  console.log('[save-variants] ✅ Image accepted:', url.substring(0, 80))
  return false
}

// POST - Save variants from extension
export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req)
  
  try {
    const body = await req.json()
    const { variants, specifications, url, timestamp, sessionToken, image, imageUrl, title, price } = body

    // Support multiple field names from extension - check ALL possible image fields
    const rawImage = image || imageUrl || body.productImage || body.img || 
                     body.mainImage || body.productImageUrl || body.mainImageUrl ||
                     body.selectedImage || body.clippedImage || body.clipImage

    console.log('[save-variants] ========== NEW VARIANT DATA RECEIVED ==========')
    console.log('[save-variants] URL:', url?.substring(0, 80))
    console.log('[save-variants] Variant count:', Object.keys(variants || {}).length)
    Object.entries(variants || {}).forEach(([key, value]) => {
      console.log(`[save-variants] ✅ ${key}: ${value}`)
    })
    console.log('[save-variants] ALL Body keys:', Object.keys(body).join(', '))
    console.log('[save-variants] 📸 Checking ALL image fields:')
    console.log('[save-variants]   - image:', image?.substring?.(0, 80) || 'undefined')
    console.log('[save-variants]   - imageUrl:', imageUrl?.substring?.(0, 80) || 'undefined')
    console.log('[save-variants]   - productImage:', body.productImage?.substring?.(0, 80) || 'undefined')
    console.log('[save-variants]   - img:', body.img?.substring?.(0, 80) || 'undefined')
    console.log('[save-variants]   - mainImage:', body.mainImage?.substring?.(0, 80) || 'undefined')
    console.log('[save-variants]   - productImageUrl:', body.productImageUrl?.substring?.(0, 80) || 'undefined')
    console.log('[save-variants]   - selectedImage:', body.selectedImage?.substring?.(0, 80) || 'undefined')
    console.log('[save-variants]   - clippedImage:', body.clippedImage?.substring?.(0, 80) || 'undefined')
    console.log('[save-variants] Combined Raw Image:', rawImage?.substring?.(0, 80) || 'NO IMAGE FOUND IN ANY FIELD')
    
    // Filter out swatch/placeholder images
    const validImage = isSwatchOrPlaceholderImage(rawImage) ? undefined : rawImage
    console.log('[save-variants] Valid Image:', validImage ? validImage.substring(0, 80) : 'REJECTED (swatch/placeholder)')
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

    // Don't clear existing data - just overwrite with new data
    // This prevents race conditions where data is cleared before being retrieved
    console.log('[save-variants] Current store keys before save:', Array.from(variantStore.keys()))
    
    // Store variants with fresh timestamp (use validImage, not raw image)
    const now = Date.now()
    const dataToStore: VariantData = {
      variants,
      specifications: specifications || {},
      url: url || '',
      image: validImage, // Use filtered image (undefined if swatch/placeholder)
      title: title || undefined,
      price: price || undefined,
      timestamp: now,
      retrieved: false,
      isModalPending: true // Modal is waiting for this data - prevent add-item from duplicating
    }
    
    variantStore.set(storeKey, dataToStore)

    // Also store in "latest" for easy retrieval
    variantStore.set('latest', { ...dataToStore })

    console.log('[save-variants] ========== POST RECEIVED ==========')
    console.log('[save-variants] POST - Key:', storeKey)
    console.log('[save-variants] POST - Stored image:', validImage ? validImage.substring(0, 80) : 'NONE (filtered out)')
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
  const corsHeaders = getCorsHeaders(req)
  
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

    // Allow data to be retrieved multiple times within 60 seconds
    // Be more lenient to ensure the Alternative clip feature works
    const timeSinceStore = Date.now() - stored.timestamp
    if (stored.retrieved && timeSinceStore > 60000) {
      console.log('[save-variants] GET - Data already retrieved and expired (>60s), returning null')
      console.log('[save-variants] GET - Stored timestamp:', stored.timestamp, 'Age:', timeSinceStore, 'ms')
      return NextResponse.json({ variants: null }, { headers: corsHeaders })
    }
    
    // Log retrieval details
    console.log('[save-variants] GET - Data still valid, age:', timeSinceStore, 'ms, retrieved before:', stored.retrieved)
    
    console.log('[save-variants] GET - Fresh data found, returning...')
    console.log('[save-variants] GET - Image URL:', stored.image?.substring(0, 100))
    console.log('[save-variants] GET - Already retrieved before?', stored.retrieved, 'Age:', timeSinceStore, 'ms')

    // Mark as retrieved but allow re-retrieval for 30 seconds
    stored.retrieved = true
    variantStore.set(storeKey, stored)
    
    // Also mark latest as retrieved
    const latestStored = variantStore.get('latest')
    if (latestStored) {
      latestStored.retrieved = true
      variantStore.set('latest', latestStored)
    }
    
    // Delete after 2 minutes (give more time for retries)
    setTimeout(() => {
      variantStore.delete(storeKey)
      variantStore.delete('latest')
      console.log('[save-variants] Auto-deleted stored data after 2 minutes')
    }, 2 * 60 * 1000)

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
