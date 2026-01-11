// Helper functions for wishlist operations with Amazon PA-API data

import { createClient } from '@/lib/supabase/server'

/**
 * Insert a wishlist item from normalized Amazon PA-API data
 */
export async function insertAmazonWishlistItem(
  wishlistId: string,
  productUrl: string,
  asin: string,
  normalizedData: {
    title: string
    image_url: string | null
    list_price: number | null
    currency: string
    review_star: any | null
    review_count: number | null
    affiliate_url: string | null
  },
  userId?: string
) {
  const supabase = await createClient()
  
  // If userId not provided, get from auth
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }
    userId = user.id
  }

  // Explicitly select columns to avoid schema cache issues with missing 'description' column
  const { data: item, error } = await supabase
    .from('wishlist_items')
    .insert({
      wishlist_id: wishlistId,
      product_url: productUrl,
      asin: asin,
      title: normalizedData.title,
      image_url: normalizedData.image_url,
      list_price: normalizedData.list_price,
      currency: normalizedData.currency,
      review_star: normalizedData.review_star,
      review_count: normalizedData.review_count,
      price_snapshot_at: new Date(),
      affiliate_url: normalizedData.affiliate_url,
      source: 'amazon',
    })
    .select("id, wishlist_id, product_name, product_url, product_price, product_image, quantity, priority, category, stock_status, created_at, updated_at, title, asin, image_url, list_price, currency, review_star, review_count, affiliate_url, source, price_snapshot_at, store_name")
    .single()

  if (error) {
    console.error('Error inserting Amazon wishlist item:', error)
    throw error
  }

  return item
}

