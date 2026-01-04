import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * DELETE /api/wishlist-items/[id]
 * Delete a wishlist item by ID
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = params

    // First, get the item to find its wishlist_id
    const { data: item, error: fetchError } = await supabase
      .from("wishlist_items")
      .select("wishlist_id")
      .eq("id", id)
      .single()

    if (fetchError || !item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      )
    }

    // Verify the wishlist belongs to the user
    const { data: wishlist, error: wishlistError } = await supabase
      .from("wishlists")
      .select("user_id")
      .eq("id", item.wishlist_id)
      .single()

    if (wishlistError || !wishlist || wishlist.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Delete the item
    const { error: deleteError } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("id", id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Delete Wishlist Item] Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete item",
      },
      { status: 500 }
    )
  }
}

