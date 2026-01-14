import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

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

/**
 * GET /api/extension/get-items
 * Get all wishlist items for the authenticated user (for browser extension)
 */
export async function GET(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req)
  
  try {
    let user: any = null
    let supabase: any = null

    // Try multiple authentication methods
    
    // Method 1: Check for Authorization header with access token
    const authHeader = req.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const accessToken = authHeader.substring(7)
      console.log("[Extension Get Items] Trying Bearer token auth...")
      
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
        console.log("[Extension Get Items] Bearer token auth successful:", user.email)
      }
    }

    // Method 2: Try cookie-based auth
    if (!user) {
      supabase = await createClient()
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser()
      
      if (cookieUser && !authError) {
        user = cookieUser
        console.log("[Extension Get Items] Cookie auth successful:", user.email)
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", details: "Please log in to Wishbee.ai" },
        { status: 401, headers: corsHeaders }
      )
    }

    // Get all wishlists for the user
    const { data: wishlists, error: wishlistsError } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", user.id)

    if (wishlistsError) {
      console.error("[Extension Get Items] Wishlists query error:", JSON.stringify(wishlistsError, null, 2))
      console.error("[Extension Get Items] User ID:", user.id)
      throw wishlistsError
    }

    if (!wishlists || wishlists.length === 0) {
      return NextResponse.json({ items: [] }, { headers: corsHeaders })
    }

    const wishlistIds = wishlists.map((w) => w.id).filter((id) => id)

    if (wishlistIds.length === 0) {
      return NextResponse.json({ items: [] }, { headers: corsHeaders })
    }

    // Get all items from all wishlists
    // Select only columns that exist in the database
    const { data: items, error: itemsError } = await supabase
      .from("wishlist_items")
      .select("id, wishlist_id, product_url, created_at, title, asin, image_url, list_price, currency, review_star, review_count, affiliate_url, source, price_snapshot_at, description")
      .in("wishlist_id", wishlistIds)
      .order("created_at", { ascending: false })

    if (itemsError) {
      console.error("[Extension Get Items] Items query error:", JSON.stringify(itemsError, null, 2))
      console.error("[Extension Get Items] Wishlist IDs:", wishlistIds)
      throw itemsError
    }

    // Transform to extension format
    const formattedItems = (items || []).map((item: any) => {
      // Extract store name from URL
      let storeName = "Unknown Store"
      if (item.product_url) {
        try {
          const urlObj = new URL(item.product_url)
          storeName = urlObj.hostname.replace("www.", "").split(".")[0]
          storeName = storeName.charAt(0).toUpperCase() + storeName.slice(1)
        } catch (e) {
          // Keep default storeName
        }
      }
      
      return {
        id: item.id,
        title: item.title || "Untitled Item",
        url: item.product_url || "#",
        image: item.image_url || null,
        price: item.list_price ? item.list_price / 100 : null, // Convert from cents
        description: item.description || null,
        storeName,
        addedDate: item.created_at,
        synced: true, // Items from backend are always synced
      }
    })

    return NextResponse.json({ items: formattedItems }, { headers: corsHeaders })
  } catch (error) {
    console.error("[Extension Get Items] ===== ERROR =====")
    console.error("[Extension Get Items] Error Type:", error?.constructor?.name || typeof error)
    console.error("[Extension Get Items] Error Message:", error instanceof Error ? error.message : String(error))
    console.error("[Extension Get Items] Full Error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    if (error instanceof Error) {
      console.error("[Extension Get Items] Stack Trace:", error.stack)
    }
    console.error("[Extension Get Items] ===================")
    
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch wishlist items"
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : String(error)) : undefined,
      },
      { status: 500, headers: corsHeaders }
    )
  }
}

