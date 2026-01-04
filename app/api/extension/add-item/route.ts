import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

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

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to add items to your wishlist." },
        { status: 401 }
      )
    }

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

    // Insert wishlist item
    const insertData = {
      wishlist_id: wishlistId,
      product_name: validated.title,
      product_url: validated.url,
      product_price: validated.price || null,
      product_image: imageUrl,
      description: validated.description || null,
      quantity: 1,
    }

    const { data: item, error: insertError } = await supabase
      .from("wishlist_items")
      .insert([insertData])
      .select()
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
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      )
    }

    console.error("[Extension Add Item] ===== ERROR =====")
    console.error("[Extension Add Item] Error Type:", error?.constructor?.name || typeof error)
    console.error("[Extension Add Item] Error Message:", error instanceof Error ? error.message : String(error))
    console.error("[Extension Add Item] Full Error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    if (error instanceof Error) {
      console.error("[Extension Add Item] Stack Trace:", error.stack)
    }
    console.error("[Extension Add Item] ===================")
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to add item to wishlist",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : String(error)) : undefined,
      },
      { status: 500 }
    )
  }
}

