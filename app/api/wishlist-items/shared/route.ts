import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/wishlist-items/shared
 * Get all shared/public wishlist items (for gift collection creation)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get all public wishlists (excluding user's own)
    const { data: wishlists, error: wishlistsError } = await supabase
      .from("wishlists")
      .select("id, title, user_id, profiles(full_name, avatar_url)")
      .eq("is_public", true)
      .neq("user_id", user.id)

    if (wishlistsError) {
      console.error("[Shared Wishlist Items] Wishlists query error:", wishlistsError)
      // If the join fails, try without profiles
      const { data: wishlistsSimple, error: wishlistsSimpleError } = await supabase
        .from("wishlists")
        .select("id, title, user_id")
        .eq("is_public", true)
        .neq("user_id", user.id)
      
      if (wishlistsSimpleError) throw wishlistsSimpleError
      
      if (!wishlistsSimple || wishlistsSimple.length === 0) {
        return NextResponse.json({ items: [], wishlists: [] })
      }

      const wishlistIds = wishlistsSimple.map((w) => w.id)

      const { data: items, error: itemsError } = await supabase
        .from("wishlist_items")
        .select("id, wishlist_id, product_url, created_at, title, asin, image_url, list_price, currency, review_star, review_count, affiliate_url, source, description")
        .in("wishlist_id", wishlistIds)
        .order("created_at", { ascending: false })
        .limit(50)

      if (itemsError) throw itemsError

      return NextResponse.json({ 
        items: items || [], 
        wishlists: wishlistsSimple.map(w => ({ ...w, ownerName: 'Friend' }))
      })
    }

    if (!wishlists || wishlists.length === 0) {
      return NextResponse.json({ items: [], wishlists: [] })
    }

    const wishlistIds = wishlists.map((w) => w.id)

    // Get all items from shared wishlists
    const { data: items, error: itemsError } = await supabase
      .from("wishlist_items")
      .select("id, wishlist_id, product_url, created_at, title, asin, image_url, list_price, currency, review_star, review_count, affiliate_url, source, description")
      .in("wishlist_id", wishlistIds)
      .order("created_at", { ascending: false })
      .limit(50)

    if (itemsError) {
      console.error("[Shared Wishlist Items] Items query error:", itemsError)
      throw itemsError
    }

    // Format wishlists with owner info
    const formattedWishlists = wishlists.map(w => ({
      id: w.id,
      title: w.title,
      user_id: w.user_id,
      ownerName: (w as any).profiles?.full_name || 'Friend'
    }))

    return NextResponse.json({ 
      items: items || [], 
      wishlists: formattedWishlists 
    })
  } catch (error) {
    console.error("[Shared Wishlist Items] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch shared wishlist items" },
      { status: 500 }
    )
  }
}
