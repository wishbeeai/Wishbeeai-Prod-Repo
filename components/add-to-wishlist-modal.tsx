'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { Plus, Check, Loader2, Heart, ListPlus } from 'lucide-react'

interface Wishlist {
  id: string
  title: string
  description?: string
  is_public?: boolean
  created_at?: string
}

interface ProductData {
  name: string
  price: number
  image?: string
  productUrl?: string
  source?: string
  rating?: number
  reviewCount?: number
  description?: string
}

interface AddToWishlistModalProps {
  isOpen: boolean
  onClose: () => void
  product: ProductData
  onSuccess?: () => void
}

export function AddToWishlistModal({ isOpen, onClose, product, onSuccess }: AddToWishlistModalProps) {
  const { user } = useAuth()
  const [wishlists, setWishlists] = useState<Wishlist[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const [showCreateNew, setShowCreateNew] = useState(false)
  const [newWishlistTitle, setNewWishlistTitle] = useState('')
  const [creatingWishlist, setCreatingWishlist] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      fetchWishlists()
    }
  }, [isOpen, user])

  const fetchWishlists = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/wishlists')
      if (!response.ok) throw new Error('Failed to fetch wishlists')
      const data = await response.json()
      setWishlists(data.wishlists || [])
    } catch (error) {
      console.error('Error fetching wishlists:', error)
      toast.error('Failed to load wishlists')
    } finally {
      setLoading(false)
    }
  }

  const createNewWishlist = async () => {
    if (!newWishlistTitle.trim()) {
      toast.error('Please enter a wishlist name')
      return
    }

    setCreatingWishlist(true)
    try {
      const response = await fetch('/api/wishlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newWishlistTitle.trim(),
          description: '',
          isPublic: false
        })
      })

      if (!response.ok) throw new Error('Failed to create wishlist')
      
      const data = await response.json()
      setWishlists([data.wishlist, ...wishlists])
      setNewWishlistTitle('')
      setShowCreateNew(false)
      toast.success('Wishlist created!')
      
      // Automatically add the product to the new wishlist
      await addToWishlist(data.wishlist.id)
    } catch (error) {
      console.error('Error creating wishlist:', error)
      toast.error('Failed to create wishlist')
    } finally {
      setCreatingWishlist(false)
    }
  }

  const addToWishlist = async (wishlistId: string) => {
    setAdding(wishlistId)
    try {
      const response = await fetch('/api/wishlists/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wishlistId,
          title: product.name,
          product_url: product.productUrl,
          image_url: product.image,
          list_price: Math.round(product.price * 100), // Convert to cents
          currency: 'USD',
          review_star: product.rating,
          review_count: product.reviewCount,
          affiliate_url: product.productUrl,
          source: product.source || 'trending'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add to wishlist')
      }
      
      toast.success(`Added "${product.name}" to wishlist!`)
      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('Error adding to wishlist:', error)
      toast.error(error.message || 'Failed to add to wishlist')
    } finally {
      setAdding(null)
    }
  }

  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#654321]">
              <Heart className="w-5 h-5 text-red-500" />
              Add to Wishlist
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Please sign in to add items to your wishlist</p>
            <Button
              className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] font-semibold"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#654321]">
            <Heart className="w-5 h-5 text-red-500" />
            Add to Wishlist
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Adding: {product.name.length > 50 ? product.name.substring(0, 50) + '...' : product.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#DAA520]" />
            </div>
          ) : (
            <>
              {/* Existing Wishlists */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {wishlists.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No wishlists yet. Create one below!</p>
                ) : (
                  wishlists.map((wishlist) => (
                    <button
                      key={wishlist.id}
                      onClick={() => addToWishlist(wishlist.id)}
                      disabled={adding !== null}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-amber-200 hover:bg-amber-50 hover:border-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3">
                        <ListPlus className="w-5 h-5 text-[#DAA520]" />
                        <span className="font-medium text-[#654321]">{wishlist.title}</span>
                      </div>
                      {adding === wishlist.id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-[#DAA520]" />
                      ) : (
                        <Plus className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Create New Wishlist */}
              {showCreateNew ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="wishlist-name" className="text-sm text-[#654321]">
                      New Wishlist Name
                    </Label>
                    <Input
                      id="wishlist-name"
                      value={newWishlistTitle}
                      onChange={(e) => setNewWishlistTitle(e.target.value)}
                      placeholder="e.g., Birthday Gifts, Holiday Shopping"
                      className="mt-1 border-amber-300 focus:border-amber-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          createNewWishlist()
                        }
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={createNewWishlist}
                      disabled={creatingWishlist || !newWishlistTitle.trim()}
                      className="flex-1 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] font-semibold hover:from-[#F4C430] hover:to-[#DAA520]"
                    >
                      {creatingWishlist ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Create & Add
                    </Button>
                    <Button
                      onClick={() => {
                        setShowCreateNew(false)
                        setNewWishlistTitle('')
                      }}
                      variant="outline"
                      className="border-gray-300"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setShowCreateNew(true)}
                  variant="outline"
                  className="w-full border-dashed border-amber-400 text-[#654321] hover:bg-amber-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Wishlist
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
