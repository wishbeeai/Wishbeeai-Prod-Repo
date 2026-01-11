"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { WishlistInsert, WishlistUpdate, WishlistItemInsert, WishlistItemUpdate } from "@/types/supabase"

export async function createWishlistAction(data: WishlistInsert) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Unauthorized" }
    }

    const { data: wishlist, error } = await supabase
      .from("wishlists")
      .insert([{ ...data, user_id: user.id }])
      .select()
      .single()

    if (error) throw error

    revalidatePath("/wishlists")
    return { data: wishlist, error: null }
  } catch (error: any) {
    return { error: error.message, data: null }
  }
}

export async function updateWishlistAction(id: string, data: WishlistUpdate) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Unauthorized" }
    }

    const { data: wishlist, error } = await supabase
      .from("wishlists")
      .update(data)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/wishlists")
    return { data: wishlist, error: null }
  } catch (error: any) {
    return { error: error.message, data: null }
  }
}

export async function deleteWishlistAction(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Unauthorized" }
    }

    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) throw error

    revalidatePath("/wishlists")
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function createWishlistItemAction(data: WishlistItemInsert) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Unauthorized" }
    }

    // Filter out 'description' field temporarily until migration is run
    // TODO: Remove this filter after running migration 002_add_description_to_wishlist_items.sql
    const { description, ...insertData } = data as any

    // Explicitly select columns to avoid schema cache issues with missing 'description' column
    const { data: item, error } = await supabase
      .from("wishlist_items")
      .insert([insertData])
      .select("id, wishlist_id, product_name, product_url, product_price, product_image, quantity, priority, category, stock_status, created_at, updated_at, title, asin, image_url, list_price, currency, review_star, review_count, affiliate_url, source, price_snapshot_at, store_name")
      .single()

    if (error) throw error

    revalidatePath("/wishlists")
    return { data: item, error: null }
  } catch (error: any) {
    return { error: error.message, data: null }
  }
}

export async function updateWishlistItemAction(id: string, data: WishlistItemUpdate) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Unauthorized" }
    }

    // Filter out 'description' field temporarily until migration is run
    // TODO: Remove this filter after running migration 002_add_description_to_wishlist_items.sql
    const { description, ...updateData } = data as any

    // Explicitly select columns to avoid schema cache issues with missing 'description' column
    const { data: item, error } = await supabase
      .from("wishlist_items")
      .update(updateData)
      .eq("id", id)
      .select("id, wishlist_id, product_name, product_url, product_price, product_image, quantity, priority, category, stock_status, created_at, updated_at, title, asin, image_url, list_price, currency, review_star, review_count, affiliate_url, source, price_snapshot_at, store_name")
      .single()

    if (error) throw error

    revalidatePath("/wishlists")
    return { data: item, error: null }
  } catch (error: any) {
    return { error: error.message, data: null }
  }
}

export async function deleteWishlistItemAction(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Unauthorized" }
    }

    const { error } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("id", id)

    if (error) throw error

    revalidatePath("/wishlists")
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

