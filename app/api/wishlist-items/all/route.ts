import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/wishlist-items/all
 * Get all wishlist items for the authenticated user (across all wishlists)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error("[Wishlist Items All] Auth error:", authError)
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
      console.error("[Wishlist Items All] Wishlists query error:", wishlistsError)
      throw wishlistsError
    }

    if (!wishlists || wishlists.length === 0) {
      return NextResponse.json({ items: [] })
    }

    const wishlistIds = wishlists.map((w) => w.id).filter((id) => id) // Filter out any null/undefined IDs

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
      console.error("[Wishlist Items All] Items query error:", itemsError)
      throw itemsError
    }

    return NextResponse.json({ items: items || [] })
  } catch (error) {
    console.error("[Wishlist Items All] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch wishlist items"
    const errorDetails = error instanceof Error ? error.stack : String(error)
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? errorDetails : undefined,
      },
      { status: 500 }
    )
  }
}

