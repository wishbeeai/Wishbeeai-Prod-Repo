import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/extension/get-items
 * Get all wishlist items for the authenticated user (for browser extension)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error("[Extension Get Items] Auth error:", authError)
      return NextResponse.json(
        { error: "Authentication failed", details: authError.message },
        { status: 401 }
      )
    }
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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
    const formattedItems = (items || []).map((item: any) => {
      // Extract store name from URL if store_name doesn't exist
      let storeName = item.store_name || "Unknown Store"
      if (storeName === "Unknown Store" && item.product_url) {
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
        title: item.product_name || "Untitled Item",
        url: item.product_url || "#",
        image: item.product_image || null,
        price: item.product_price || null,
        description: item.description || null,
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
      { status: 500 }
    )
  }
}

