import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { z } from "zod"
import { isModalPending } from "../save-variants/route"

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

// Schema for extension item data
const extensionItemSchema = z.object({
  title: z.string().min(1).max(500),
  url: z.string().url(),
  image: z.union([
    z.string().url(), 
    z.string().startsWith('/'), 
    z.string().length(0), // Empty string
    z.null()
  ]).optional().nullable(),
  price: z.union([z.number().min(0).max(10000000), z.null()]).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  wishlistId: z.string().optional(), // Optional - will use default wishlist if not provided
})

// Note: Database schema uses: title, list_price (in cents), image_url
// Need to map from extension format to database format

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req)
  
  try {
    // Check if modal is waiting for this data (prevents duplicate adds)
    // When user is using the modal's "Select on Retailer" flow, we only save variants
    // The actual add to wishlist happens when they click "Add to My Wishlist" in the modal
    if (isModalPending()) {
      console.log("[Extension Add Item] Modal is pending - skipping add (modal will handle it)")
      return NextResponse.json(
        {
          success: true,
          skipped: true,
          message: "Item captured for modal selection. Add to wishlist from the modal.",
        },
        { status: 200, headers: corsHeaders }
      )
    }

    // Log request headers for debugging
    console.log("[Extension Add Item] Request headers:", {
      cookie: req.headers.get("cookie") ? "present" : "missing",
      origin: req.headers.get("origin"),
      authorization: req.headers.get("authorization") ? "present" : "missing",
      sessionToken: req.headers.get("x-session-token") ? "present" : "missing",
      userEmail: req.headers.get("x-user-email") ? "present" : "missing",
    })

    let user: any = null
    let supabase: any = null

    // Try multiple authentication methods
    
    // Method 1: Check for Authorization header with access token
    const authHeader = req.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const accessToken = authHeader.substring(7)
      console.log("[Extension Add Item] Trying Bearer token auth...")
      
      // Create a Supabase client with the access token
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      
      const tokenClient = createServiceClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      })
      
      const { data: { user: tokenUser }, error: tokenError } = await tokenClient.auth.getUser()
      if (tokenUser && !tokenError) {
        user = tokenUser
        supabase = tokenClient
        console.log("[Extension Add Item] Bearer token auth successful:", user.email)
      } else {
        console.log("[Extension Add Item] Bearer token auth failed:", tokenError?.message)
      }
    }

    // Method 2: Try cookie-based auth (for requests from the website)
    if (!user) {
      console.log("[Extension Add Item] Trying cookie-based auth...")
      supabase = await createClient()
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser()
      
      if (cookieUser && !authError) {
        user = cookieUser
        console.log("[Extension Add Item] Cookie auth successful:", user.email)
      } else {
        console.log("[Extension Add Item] Cookie auth failed:", authError?.message)
      }
    }

    // If still no user, return unauthorized
    if (!user) {
      console.error("[Extension Add Item] All auth methods failed")
      return NextResponse.json(
        { 
          error: "Unauthorized", 
          details: "Please log in to Wishbee.ai. If using the extension, make sure you're logged in and the extension has your access token." 
        },
        { status: 401, headers: corsHeaders }
      )
    }

    console.log("[Extension Add Item] User authenticated:", user.email)

    const body = await req.json()
    const validated = extensionItemSchema.parse(body)

    // Get or create default wishlist for user
    let wishlistId = validated.wishlistId

    if (!wishlistId) {
      // Get user's default wishlist (first one) or create one
      const { data: existingWishlists, error: fetchError } = await supabase
        .from("wishlists")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)

      if (fetchError) throw fetchError

      if (existingWishlists && existingWishlists.length > 0) {
        wishlistId = existingWishlists[0].id
      } else {
        // Create default wishlist
        const { data: newWishlist, error: createError } = await supabase
          .from("wishlists")
          .insert([
            {
              user_id: user.id,
              title: "My Wishlist",
              description: "Items saved from browser extension",
              is_public: false,
            },
          ])
          .select()
          .single()

        if (createError) throw createError
        wishlistId = newWishlist.id
      }
    }

    // Extract store name from URL
    let storeName = "Unknown Store"
    try {
      const urlObj = new URL(validated.url)
      storeName = urlObj.hostname.replace("www.", "").split(".")[0]
      storeName = storeName.charAt(0).toUpperCase() + storeName.slice(1)
    } catch (e) {
      // Keep default storeName
    }

    // Normalize image URL (handle relative URLs and empty strings)
    let imageUrl = validated.image || null
    if (imageUrl) {
      // Handle empty string
      if (imageUrl === '') {
        imageUrl = null
      } 
      // Handle relative URLs
      else if (imageUrl.startsWith('/')) {
        try {
          const urlObj = new URL(validated.url)
          imageUrl = urlObj.origin + imageUrl
        } catch (e) {
          // If URL parsing fails, set to null
          imageUrl = null
        }
      }
      // Validate absolute URLs
      else if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        imageUrl = null
      }
    }

    // Check for duplicate product URL in the same wishlist before inserting
    const { data: existingItem } = await supabase
      .from('wishlist_items')
      .select('id')
      .eq('wishlist_id', wishlistId)
      .eq('product_url', validated.url)
      .single()
    
    if (existingItem) {
      console.log('[Extension Add Item] Duplicate product detected, skipping')
      return NextResponse.json(
        {
          success: true,
          skipped: true,
          message: 'This product is already in your wishlist',
          existingItemId: existingItem.id,
        },
        { status: 200, headers: corsHeaders }
      )
    }

    // Determine source from URL
    let source = 'other'
    try {
      const urlObj = new URL(validated.url)
      const hostname = urlObj.hostname.toLowerCase()
      if (hostname.includes('amazon')) source = 'amazon'
      else if (hostname.includes('target')) source = 'target'
      else if (hostname.includes('walmart')) source = 'walmart'
      else if (hostname.includes('bestbuy')) source = 'bestbuy'
      else if (hostname.includes('etsy')) source = 'etsy'
      else if (hostname.includes('ebay')) source = 'ebay'
      else source = 'other'
    } catch (e) {
      source = 'other'
    }

    // Insert wishlist item
    // Map to actual database schema: title, list_price (in cents), image_url, product_url
    const insertData: any = {
      wishlist_id: wishlistId,
      title: validated.title,
      product_url: validated.url,
      list_price: validated.price ? Math.round(validated.price * 100) : null, // Convert to cents
      image_url: imageUrl,
      currency: 'USD', // Default currency
      source: source,
      price_snapshot_at: new Date(),
    }
    
    // Only add store_name if the column exists (it might not in production)
    // We'll extract it from URL on the backend if needed

    // Select only columns that exist in the database
    const { data: item, error: insertError } = await supabase
      .from("wishlist_items")
      .insert([insertData])
      .select("id, wishlist_id, product_url, created_at, title, asin, image_url, list_price, currency, review_star, review_count, affiliate_url, source, price_snapshot_at, description")
      .single()

    if (insertError) {
      console.error("[Extension Add Item] Error inserting wishlist item:", JSON.stringify(insertError, null, 2))
      console.error("[Extension Add Item] Insert Data:", JSON.stringify(insertData, null, 2))
      console.error("[Extension Add Item] Wishlist ID:", wishlistId)
      throw insertError
    }

    return NextResponse.json(
      {
        success: true,
        item,
        message: "Item added to wishlist successfully",
      },
      { status: 201, headers: corsHeaders }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400, headers: corsHeaders }
      )
    }

    console.error("[Extension Add Item] ===== ERROR =====")
    console.error("[Extension Add Item] Error Type:", error?.constructor?.name || typeof error)
    console.error("[Extension Add Item] Error Message:", error instanceof Error ? error.message : String(error))
    
    // Try to extract more details from the error
    let errorDetails: any = {}
    if (error && typeof error === 'object') {
      try {
        errorDetails = JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)))
      } catch (e) {
        errorDetails = { message: String(error) }
      }
    }
    
    console.error("[Extension Add Item] Full Error:", JSON.stringify(errorDetails, null, 2))
    if (error instanceof Error) {
      console.error("[Extension Add Item] Stack Trace:", error.stack)
    }
    console.error("[Extension Add Item] ===================")
    
    // Get error message - try to extract from PostgrestError or other database errors
    let errorMessage = "Failed to add item to wishlist"
    if (error instanceof Error) {
      errorMessage = error.message
      // Check for common database errors
      if (error.message.includes('permission denied') || error.message.includes('policy')) {
        errorMessage = "Database access denied. Please check Row Level Security policies."
      } else if (error.message.includes('relation') || error.message.includes('does not exist')) {
        errorMessage = "Database table not found. Please check database schema."
      } else if (error.message.includes('column') || error.message.includes('field')) {
        errorMessage = "Database column not found. Please check database schema."
      } else if (error.message.includes('foreign key') || error.message.includes('constraint')) {
        errorMessage = "Database constraint violation. Please check wishlist_id."
      }
    }
    
    // Extract actual error message - handle Postgres/Supabase errors
    let actualError = errorMessage
    if (error instanceof Error) {
      actualError = error.message
      // Try to extract more details from PostgresError
      if ((error as any).code || (error as any).details || (error as any).hint) {
        actualError = JSON.stringify({
          message: error.message,
          code: (error as any).code,
          details: (error as any).details,
          hint: (error as any).hint,
        }, null, 2)
      }
    } else if (error && typeof error === 'object') {
      try {
        actualError = JSON.stringify(error, null, 2)
      } catch (e) {
        actualError = String(error)
      }
    } else {
      actualError = String(error)
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: actualError, // Include actual error for debugging
        message: error instanceof Error ? error.message : String(error), // Also include simple message
      },
      { status: 500, headers: corsHeaders }
    )
  }
}

