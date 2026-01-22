import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * PATCH /api/wishlist-items/[id]
 * Update a wishlist item's preference options
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
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

    // Handle params - can be a Promise in Next.js 15+
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams

    const body = await req.json()
    const { preferenceOptions } = body

    // First, get the item to find its wishlist_id and current description
    const { data: item, error: fetchError } = await supabase
      .from("wishlist_items")
      .select("wishlist_id, description")
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

    // Parse existing description and merge with new data
    let descriptionData: any = {}
    try {
      if (item.description) {
        descriptionData = JSON.parse(item.description)
      }
    } catch (e) {
      console.error("Error parsing description:", e)
    }

    // Update preference options
    if (preferenceOptions) {
      descriptionData.preferenceOptions = preferenceOptions
    }

    // Update other fields stored in description JSON
    const { giftName, storeName, rating, reviewCount, badges, originalPrice, currentPrice, specifications } = body
    
    if (storeName !== undefined) descriptionData.storeName = storeName
    if (rating !== undefined) descriptionData.rating = rating
    if (reviewCount !== undefined) descriptionData.reviewCount = reviewCount
    if (badges !== undefined) descriptionData.badges = badges
    if (originalPrice !== undefined) descriptionData.originalPrice = originalPrice
    if (specifications !== undefined) descriptionData.specifications = specifications

    // Build update object
    const updateFields: any = { description: JSON.stringify(descriptionData) }
    
    // Update title field directly if giftName is provided
    if (giftName !== undefined) {
      updateFields.title = giftName
    }
    
    // Update list_price if currentPrice is provided (convert to cents)
    if (currentPrice !== undefined) {
      updateFields.list_price = Math.round(currentPrice * 100)
    }

    // Update the item
    const { data: updatedItem, error: updateError } = await supabase
      .from("wishlist_items")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ item: updatedItem })
  } catch (error) {
    console.error("[Update Wishlist Item] Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update item",
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/wishlist-items/[id]
 * Delete a wishlist item by ID
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
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

    // Handle params - can be a Promise in Next.js 15+
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams

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

