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

// Note: Database schema uses: title, list_price (in cents), image_url
// Need to map from extension format to database format

export async function POST(req: NextRequest) {
  try {
    // Log request headers for debugging (in development only)
    if (process.env.NODE_ENV === "development") {
      console.log("[Extension Add Item] Request headers:", {
        cookie: req.headers.get("cookie") ? "present" : "missing",
        origin: req.headers.get("origin"),
        referer: req.headers.get("referer"),
      })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error("[Extension Add Item] Auth error:", JSON.stringify(authError, null, 2))
      return NextResponse.json(
        { error: "Authentication failed", details: authError.message },
        { status: 401 }
      )
    }
    
    if (!user) {
      console.error("[Extension Add Item] No user found - cookies may not be set")
      return NextResponse.json(
        { error: "Unauthorized", details: "Please log in to Wishbee.ai in your browser first" },
        { status: 401 }
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

    // Insert wishlist item
    // Note: description column may not exist in database, so we don't include it
    const insertData: any = {
      wishlist_id: wishlistId,
      product_name: validated.title,
      product_url: validated.url,
      product_price: validated.price || null,
      product_image: imageUrl,
      // description column doesn't exist in database - removed
      quantity: 1,
    }
    
    // Only add store_name if the column exists (it might not in production)
    // We'll extract it from URL on the backend if needed

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
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : String(error)) : errorMessage,
      },
      { status: 500 }
    )
  }
}

