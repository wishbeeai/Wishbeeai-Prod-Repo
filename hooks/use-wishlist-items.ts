"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { WishlistItem, WishlistItemInsert, WishlistItemUpdate } from "@/types/supabase"

export function useWishlistItems(wishlistId?: string) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const fetchItems = async () => {
    if (!wishlistId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("wishlist_items")
        .select("*")
        .eq("wishlist_id", wishlistId)
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError
      setItems(data || [])
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch wishlist items")
      setError(error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createItem = async (item: WishlistItemInsert) => {
    try {
      setError(null)

      if (!wishlistId && !item.wishlist_id) {
        throw new Error("Wishlist ID is required")
      }

      const itemData = {
        ...item,
        wishlist_id: item.wishlist_id || wishlistId!,
      }

      const { data, error: insertError } = await supabase
        .from("wishlist_items")
        .insert([itemData])
        .select()
        .single()

      if (insertError) throw insertError

      setItems((prev) => [data, ...prev])
      toast({
        title: "Success",
        description: "Item added to wishlist successfully",
      })

      return data
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to add item")
      setError(error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  const updateItem = async (id: string, updates: WishlistItemUpdate) => {
    try {
      setError(null)

      const { data, error: updateError } = await supabase
        .from("wishlist_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (updateError) throw updateError

      setItems((prev) =>
        prev.map((item) => (item.id === id ? data : item))
      )

      toast({
        title: "Success",
        description: "Item updated successfully",
      })

      return data
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to update item")
      setError(error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  const deleteItem = async (id: string) => {
    try {
      setError(null)

      const { error: deleteError } = await supabase
        .from("wishlist_items")
        .delete()
        .eq("id", id)

      if (deleteError) throw deleteError

      setItems((prev) => prev.filter((item) => item.id !== id))
      toast({
        title: "Success",
        description: "Item removed successfully",
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to delete item")
      setError(error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  useEffect(() => {
    fetchItems()
  }, [wishlistId])

  return {
    items,
    loading,
    error,
    refetch: fetchItems,
    createItem,
    updateItem,
    deleteItem,
  }
}

