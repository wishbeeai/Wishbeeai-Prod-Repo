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

    const { data: item, error } = await supabase
      .from("wishlist_items")
      .insert([data])
      .select()
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

    const { data: item, error } = await supabase
      .from("wishlist_items")
      .update(data)
      .eq("id", id)
      .select()
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

