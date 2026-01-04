import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/extension/get-items
 * Get all wishlist items for the authenticated user (for browser extension)
 */
export async function GET(req: NextRequest) {
  try {
    // Log request headers for debugging (in development only)
    if (process.env.NODE_ENV === "development") {
      console.log("[Extension Get Items] Request headers:", {
        cookie: req.headers.get("cookie") ? "present" : "missing",
        origin: req.headers.get("origin"),
        referer: req.headers.get("referer"),
      })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error("[Extension Get Items] Auth error:", JSON.stringify(authError, null, 2))
      return NextResponse.json(
        { error: "Authentication failed", details: authError.message },
        { status: 401 }
      )
    }
    
    if (!user) {
      console.error("[Extension Get Items] No user found - cookies may not be set")
      return NextResponse.json(
        { error: "Unauthorized", details: "Please log in to Wishbee.ai in your browser first" },
        { status: 401 }
      )
    }

    console.log("[Extension Get Items] User authenticated:", user.email)

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
      return NextResponse.json({ items: [] })
    }

    const wishlistIds = wishlists.map((w) => w.id).filter((id) => id)

    if (wishlistIds.length === 0) {
      return NextResponse.json({ items: [] })
    }

    // Get all items from all wishlists
    const { data: items, error: itemsError } = await supabase
      .from("wishlist_items")
      .select("*")
      .in("wishlist_id", wishlistIds)
      .order("created_at", { ascending: false })

    if (itemsError) {
      console.error("[Extension Get Items] Items query error:", JSON.stringify(itemsError, null, 2))
      console.error("[Extension Get Items] Wishlist IDs:", wishlistIds)
      throw itemsError
    }

    // Transform to extension format
    // Map from database schema (title, list_price in cents, image_url) to extension format
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
      
      // Convert list_price from cents to dollars
      const price = item.list_price ? item.list_price / 100 : null
      
      return {
        id: item.id,
        title: item.title || "Untitled Item",
        url: item.product_url || "#",
        image: item.image_url || null,
        price: price,
        description: null, // Description column doesn't exist in database
        storeName,
        addedDate: item.created_at,
        synced: true, // Items from backend are always synced
      }
    })

    return NextResponse.json({ items: formattedItems })
  } catch (error) {
    console.error("[Extension Get Items] ===== ERROR =====")
    console.error("[Extension Get Items] Error Type:", error?.constructor?.name || typeof error)
    console.error("[Extension Get Items] Error Message:", error instanceof Error ? error.message : String(error))
    
    // Try to extract more details from the error
    let errorDetails: any = {}
    if (error && typeof error === 'object') {
      try {
        errorDetails = JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)))
      } catch (e) {
        errorDetails = { message: String(error) }
      }
    }
    
    console.error("[Extension Get Items] Full Error:", JSON.stringify(errorDetails, null, 2))
    if (error instanceof Error) {
      console.error("[Extension Get Items] Stack Trace:", error.stack)
    }
    console.error("[Extension Get Items] ===================")
    
    // Get error message - try to extract from PostgrestError or other database errors
    let errorMessage = "Failed to fetch wishlist items"
    if (error instanceof Error) {
      errorMessage = error.message
      // Check for common database errors
      if (error.message.includes('permission denied') || error.message.includes('policy')) {
        errorMessage = "Database access denied. Please check Row Level Security policies."
      } else if (error.message.includes('relation') || error.message.includes('does not exist')) {
        errorMessage = "Database table not found. Please check database schema."
      } else if (error.message.includes('column') || error.message.includes('field')) {
        errorMessage = "Database column not found. Please check database schema."
      }
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : String(error)) : errorMessage,
      },
      { status: 500 }
    )
  }
}

