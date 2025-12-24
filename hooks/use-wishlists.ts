"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { Wishlist, WishlistInsert, WishlistUpdate } from "@/types/supabase"

export function useWishlists() {
  const [wishlists, setWishlists] = useState<Wishlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const fetchWishlists = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("User not authenticated")
      }

      const { data, error: fetchError } = await supabase
        .from("wishlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError
      setWishlists(data || [])
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch wishlists")
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

  const createWishlist = async (wishlist: WishlistInsert) => {
    try {
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("User not authenticated")
      }

      const { data, error: insertError } = await supabase
        .from("wishlists")
        .insert([{ ...wishlist, user_id: user.id }])
        .select()
        .single()

      if (insertError) throw insertError

      setWishlists((prev) => [data, ...prev])
      toast({
        title: "Success",
        description: "Wishlist created successfully",
      })

      return data
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to create wishlist")
      setError(error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  const updateWishlist = async (id: string, updates: WishlistUpdate) => {
    try {
      setError(null)

      const { data, error: updateError } = await supabase
        .from("wishlists")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (updateError) throw updateError

      setWishlists((prev) =>
        prev.map((w) => (w.id === id ? data : w))
      )

      toast({
        title: "Success",
        description: "Wishlist updated successfully",
      })

      return data
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to update wishlist")
      setError(error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  const deleteWishlist = async (id: string) => {
    try {
      setError(null)

      const { error: deleteError } = await supabase
        .from("wishlists")
        .delete()
        .eq("id", id)

      if (deleteError) throw deleteError

      setWishlists((prev) => prev.filter((w) => w.id !== id))
      toast({
        title: "Success",
        description: "Wishlist deleted successfully",
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to delete wishlist")
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
    fetchWishlists()
  }, [])

  return {
    wishlists,
    loading,
    error,
    refetch: fetchWishlists,
    createWishlist,
    updateWishlist,
    deleteWishlist,
  }
}

