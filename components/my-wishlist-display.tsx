"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Share2, Trash2, ShoppingCart, AlertCircle, Plus, Pencil, X, Check, ExternalLink, Heart, Info } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

interface PreferenceOption {
  [key: string]: string | null | undefined | Array<{ key: string; value: string }>  // Dynamic variant keys
  image?: string | null
  title?: string | null
  customFields?: Array<{ key: string; value: string }>
  notes?: string | null
}

interface PreferenceOptions {
  iLike?: PreferenceOption | null
  alternative?: PreferenceOption | null
  okToBuy?: PreferenceOption | null
}

interface Badges {
  amazonChoice?: boolean
  bestSeller?: boolean
  overallPick?: boolean
}

interface WishlistItem {
  id: string
  webLink: string
  quantity: number
  productImageUrl: string
  giftName: string
  currentPrice: number      // Sale price (what you pay)
  originalPrice?: number    // List price (original/strikethrough price)
  storeName: string
  description: string
  category?: string
  attributes: {
    [key: string]: string | null
  }
  stockStatus: string
  addedDate: string
  preferenceType?: string   // "Ideal", "Alternative", "Nice to have"
  preferenceOptions?: PreferenceOptions
  rating?: number           // Star rating (0-5)
  reviewCount?: number      // Number of reviews
  badges?: Badges           // Amazon badges
  specifications?: Record<string, any>  // Product specifications
}

interface AIInsight {
  totalValue: number
  priorityRecommendation: string
  savingsOpportunity: number
  bestTimeToBy: string
}

export function MyWishlistDisplay() {
  const { toast } = useToast()
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [aiInsights, setAiInsights] = useState<AIInsight | null>(null)
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // State for editing I Wish preferences
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editedPreferences, setEditedPreferences] = useState<{
    color: string
    size: string
    style: string
    configuration: string
  }>({ color: '', size: '', style: '', configuration: '' })

  // State for editing Alternative preferences
  const [editingAltItemId, setEditingAltItemId] = useState<string | null>(null)
  const [editedAltPreferences, setEditedAltPreferences] = useState<{
    color: string
    size: string
    style: string
    configuration: string
  }>({ color: '', size: '', style: '', configuration: '' })

  // Fetch wishlist items from database
  useEffect(() => {
    const fetchWishlistItems = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/wishlist-items/all")
        
        if (!response.ok) {
          if (response.status === 401) {
            // User not authenticated - show empty state
            setWishlistItems([])
            return
          }
          
          // Try to get error details from response
          let errorMessage = "Failed to fetch wishlist items"
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
            console.error("[My Wishlist] API error:", errorData)
          } catch (e) {
            console.error("[My Wishlist] API error status:", response.status)
          }
          
          throw new Error(errorMessage)
        }

        const data = await response.json()
        const dbItems = data.items || []

        // Transform database items to component format
        const transformedItems: WishlistItem[] = dbItems.map((item: any) => {
          // Parse description field for stored metadata
          let descriptionData: any = {}
          try {
            if (item.description) {
              descriptionData = JSON.parse(item.description)
            }
          } catch (e) {
            // Not JSON, keep as string
            descriptionData = { text: item.description }
          }

          // Extract store name from description data or URL
          let storeName = descriptionData.storeName || "Unknown Store"
          if (storeName === "Unknown Store" && item.product_url) {
            try {
              const urlObj = new URL(item.product_url)
              storeName = urlObj.hostname.replace("www.", "").split(".")[0]
              storeName = storeName.charAt(0).toUpperCase() + storeName.slice(1)
            } catch (e) {
              // Keep default storeName
            }
          } else {
            // Capitalize store name
            storeName = storeName.charAt(0).toUpperCase() + storeName.slice(1)
          }

          // Get prices - list_price is the current/sale price, originalPrice from description is the list price
          const currentPrice = item.list_price ? item.list_price / 100 : 0
          const originalPrice = descriptionData.originalPrice ? descriptionData.originalPrice : undefined
          
          // Get rating and review count from API response
          const rating = item.review_star || null
          const reviewCount = item.review_count || null
          
          // Get badges from description data
          const badges = descriptionData.badges || undefined

          return {
            id: item.id,
            webLink: item.product_url || "#",
            quantity: 1,
            productImageUrl: item.image_url || "/placeholder.svg",
            giftName: item.title || "Untitled Item",
            currentPrice,
            originalPrice,
            storeName,
            description: descriptionData.text || "",
            category: undefined,
            attributes: {},
            stockStatus: "In Stock",
            addedDate: item.created_at ? new Date(item.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            preferenceType: descriptionData.preferenceType,
            preferenceOptions: descriptionData.preferenceOptions,
            rating,
            reviewCount,
            badges,
            specifications: descriptionData.specifications || undefined,
          }
        })

        setWishlistItems(transformedItems)
      } catch (error) {
        console.error("Error fetching wishlist items:", error)
        toast({
          title: "Error",
          description: "Failed to load wishlist items",
          variant: "destructive",
        })
        setWishlistItems([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchWishlistItems()
  }, [toast])

  useEffect(() => {
    if (wishlistItems.length > 0) {
      handleGenerateInsights()
    } else {
      setAiInsights(null)
    }
  }, [wishlistItems])

  const handleGenerateInsights = async () => {
    setIsLoadingInsights(true)
    try {
      const response = await fetch("/api/ai/wishlist-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wishlistItems }),
      })

      const data = await response.json()
      if (data.insights) {
        setAiInsights(data.insights)
      }
    } catch (error) {
      console.error("Failed to generate AI insights:", error)
    } finally {
      setIsLoadingInsights(false)
    }
  }

  const handleShare = async (item: WishlistItem) => {
    try {
      const shareData = {
        title: item.giftName,
        text: `Check out this item on my wishlist: ${item.giftName}`,
        url: item.webLink,
      }

      if (navigator.share) {
        await navigator.share(shareData)
        toast({
          title: "Shared Successfully!",
          description: "Item shared via your device",
        })
      } else {
        await navigator.clipboard.writeText(item.webLink)
        toast({
          title: "Link Copied!",
          description: "Product link copied to clipboard",
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
      toast({
        title: "Share Failed",
        description: "Could not share this item",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/wishlist-items/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setWishlistItems((prev) => prev.filter((item) => item.id !== id))
        toast({
          title: "🗑️ Item Removed Successfully",
          description: "The item has been removed from your wishlist. You can always add it back later!",
          className: "bg-gradient-to-r from-gray-800 to-gray-900 text-white border-none shadow-xl",
        })
        // Insights will be updated automatically via useEffect when wishlistItems changes
      } else {
        throw new Error("Failed to delete")
      }
    } catch (error) {
      console.error("Error deleting item:", error)
      toast({
        title: "❌ Delete Failed",
        description: "Could not remove item from wishlist. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Start editing I Wish preferences for an item
  const startEditingPreferences = (item: WishlistItem) => {
    setEditingItemId(item.id)
    const iLike = item.preferenceOptions?.iLike
    setEditedPreferences({
      color: iLike?.color || '',
      size: iLike?.size || '',
      style: iLike?.style || '',
      configuration: iLike?.configuration || '',
    })
  }

  // Cancel editing
  const cancelEditingPreferences = () => {
    setEditingItemId(null)
    setEditedPreferences({ color: '', size: '', style: '', configuration: '' })
  }

  // Save edited preferences
  const saveEditedPreferences = async (itemId: string) => {
    try {
      // Find the item
      const item = wishlistItems.find(i => i.id === itemId)
      if (!item) return

      // Build updated preference options
      const updatedPreferenceOptions = {
        ...item.preferenceOptions,
        iLike: {
          ...item.preferenceOptions?.iLike,
          color: editedPreferences.color || null,
          size: editedPreferences.size || null,
          style: editedPreferences.style || null,
          configuration: editedPreferences.configuration || null,
        }
      }

      // Update via API
      const response = await fetch(`/api/wishlist-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferenceOptions: updatedPreferenceOptions }),
      })

      if (response.ok) {
        // Update local state
        setWishlistItems(prev => prev.map(i => 
          i.id === itemId 
            ? { ...i, preferenceOptions: updatedPreferenceOptions }
            : i
        ))
        setEditingItemId(null)
        toast({
          title: "✅ Preferences Updated!",
          description: "Your I Wish options have been saved.",
          variant: "warm",
        })
      } else {
        throw new Error("Failed to update")
      }
    } catch (error) {
      console.error("Error updating preferences:", error)
      toast({
        title: "Error",
        description: "Could not update preferences. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Remove a single preference option
  const removePreferenceOption = (key: string) => {
    setEditedPreferences(prev => ({ ...prev, [key]: '' }))
  }

  // Start editing Alternative preferences for an item
  const startEditingAltPreferences = (item: WishlistItem) => {
    setEditingAltItemId(item.id)
    const alt = item.preferenceOptions?.alternative
    setEditedAltPreferences({
      color: (alt?.color as string) || '',
      size: (alt?.size as string) || '',
      style: (alt?.style as string) || '',
      configuration: (alt?.configuration as string) || '',
    })
  }

  // Cancel editing Alternative
  const cancelEditingAltPreferences = () => {
    setEditingAltItemId(null)
    setEditedAltPreferences({ color: '', size: '', style: '', configuration: '' })
  }

  // Save edited Alternative preferences
  const saveEditedAltPreferences = async (itemId: string) => {
    try {
      const item = wishlistItems.find(i => i.id === itemId)
      if (!item) return

      const updatedPreferenceOptions = {
        ...item.preferenceOptions,
        alternative: {
          ...item.preferenceOptions?.alternative,
          color: editedAltPreferences.color || null,
          size: editedAltPreferences.size || null,
          style: editedAltPreferences.style || null,
          configuration: editedAltPreferences.configuration || null,
        }
      }

      const response = await fetch(`/api/wishlist-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferenceOptions: updatedPreferenceOptions }),
      })

      if (response.ok) {
        setWishlistItems(prev => prev.map(i => 
          i.id === itemId 
            ? { ...i, preferenceOptions: updatedPreferenceOptions }
            : i
        ))
        setEditingAltItemId(null)
        toast({
          title: "✅ Alternative Updated!",
          description: "Your alternative options have been saved.",
          variant: "warm",
        })
      } else {
        throw new Error("Failed to update")
      }
    } catch (error) {
      console.error("Error updating alternative preferences:", error)
      toast({
        title: "Error",
        description: "Could not update alternative preferences. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Remove a single Alternative preference option
  const removeAltPreferenceOption = (key: string) => {
    setEditedAltPreferences(prev => ({ ...prev, [key]: '' }))
  }

  const handleBuyNow = async (item: WishlistItem) => {
    try {
      await fetch("/api/wishlist/track-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, action: "buy_now" }),
      })
      window.open(item.webLink, "_blank")
    } catch (error) {
      console.error("Error tracking purchase:", error)
      window.open(item.webLink, "_blank")
    }
  }

  return (
    <div className="space-y-6">
      {/* AI Insights Panel */}
      {aiInsights && (
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-[#DAA520]/30 p-6">
          <div className="flex flex-col items-center mb-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">AI Wishlist Insights</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">Smart recommendations based on your wishlist</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mb-1">Total Wishlist Value</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                ${aiInsights.totalValue.toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mb-1">Priority Recommendation</p>
              <p className="text-xs sm:text-sm font-semibold text-[#DAA520]">{aiInsights.priorityRecommendation}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mb-1">Potential Savings</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
                ${aiInsights.savingsOpportunity.toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mb-1">Best Time to Buy</p>
              <p className="text-xs sm:text-sm font-semibold text-blue-600">{aiInsights.bestTimeToBy}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="flex justify-center">
        <Link href="/wishlist/add">
          <Button className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white hover:opacity-90 text-xs sm:text-sm">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Add New Item
          </Button>
        </Link>
      </div>

      {/* Wishlist Items Grid */}
      {wishlistItems.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-sm sm:text-base md:text-lg text-gray-500">Your wishlist is empty</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col h-full bg-gradient-to-br from-orange-50/80 via-amber-50/60 to-yellow-50/80 border border-[#DAA520]/20 hover:border-[#DAA520]/40">
              {/* Product Details - Image moved to I Wish and Alternative sections */}
              <div className="p-4 flex flex-col h-full">
                {/* Product Title - 2 lines max */}
                <div className="h-11 mb-1.5">
                  <h3 className="font-bold text-sm text-[#5D4037] line-clamp-2 leading-tight">
                    {item.giftName}
                  </h3>
                </div>

                {/* Store name */}
                <div className="mb-1.5">
                  <span className="text-xs text-[#8B6914] font-medium">{item.storeName}</span>
                </div>

                {/* Stars and Review Count - Same styling as Trending Gifts */}
                {(item.rating || item.reviewCount) && (
                  <div className="flex items-center gap-2 mb-1.5 bg-amber-50/50 rounded-lg px-2 py-1 w-fit">
                    {item.rating && (
                      <>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((starPosition) => {
                            const rating = item.rating || 0
                            const fillAmount = Math.max(0, Math.min(1, rating - (starPosition - 1)))
                            const fillPercent = Math.round(fillAmount * 100)
                            const gradientId = `star-wishlist-${item.id}-${starPosition}`
                            
                            return (
                              <svg
                                key={starPosition}
                                className="w-3.5 h-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <defs>
                                  <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset={`${fillPercent}%`} stopColor="#F4C430" />
                                    <stop offset={`${fillPercent}%`} stopColor="#E5E7EB" />
                                  </linearGradient>
                                </defs>
                                <path
                                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                                  fill={`url(#${gradientId})`}
                                  stroke="#F4C430"
                                  strokeWidth="1"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )
                          })}
                        </div>
                        <span className="text-sm font-bold text-[#654321]">{item.rating.toFixed(1)}</span>
                      </>
                    )}
                    {item.reviewCount && (
                      <span className="text-xs text-[#8B6914]">({item.reviewCount.toLocaleString()})</span>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help ml-1" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[220px] bg-[#4A2F1A] text-white text-xs p-2 rounded-lg shadow-lg">
                        <p>Ratings, reviews, and prices are shown as captured when the item was added and may change on the retailer's website.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}

                {/* Badges */}
                {item.badges && (item.badges.amazonChoice || item.badges.bestSeller || item.badges.overallPick) && (
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {item.badges.amazonChoice && (
                      <span className="text-[10px] bg-gradient-to-r from-gray-900 to-black text-white px-2.5 py-1 rounded-full font-bold shadow-sm">
                        Amazon's Choice
                      </span>
                    )}
                    {item.badges.bestSeller && (
                      <span className="text-[10px] text-white px-2.5 py-1 rounded-full font-bold shadow-sm" style={{ backgroundColor: '#D14900' }}>
                        #1 Best Seller
                      </span>
                    )}
                    {item.badges.overallPick && (
                      <span className="text-[10px] bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-2.5 py-1 rounded-full font-bold shadow-sm">
                        ⭐ Overall Pick
                      </span>
                    )}
                  </div>
                )}

                {/* Price - List Price and Sale Price */}
                <div className="mb-2 bg-gradient-to-r from-[#FEF3C7]/50 to-[#FDE68A]/30 rounded-lg px-2 py-1.5">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    {item.originalPrice && item.originalPrice > item.currentPrice ? (
                      <>
                        <span className="text-xs text-[#92400E]/60 line-through">
                          ${item.originalPrice.toFixed(2)}
                        </span>
                        <span className="text-lg font-bold bg-gradient-to-r from-[#B45309] to-[#D97706] bg-clip-text text-transparent">
                          ${item.currentPrice.toFixed(2)}
                        </span>
                        <span className="bg-gradient-to-r from-[#DC2626] to-[#EF4444] text-white font-semibold text-[9px] px-1.5 py-0.5 rounded-full shadow-sm">
                          -{Math.round(((item.originalPrice - item.currentPrice) / item.originalPrice) * 100)}% OFF
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-[#8B4513]">
                        ${item.currentPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Specifications - Matches Trending Gifts UI */}
                {item.specifications && (() => {
                  // Keys to exclude from specifications (variant keys, arrays, garbage, model)
                  const excludeKeys = ['color', 'size', 'style', 'configuration', 'pattern', 'colorVariants', 'sizeOptions', 'styleOptions', 'combinedVariants', 'customFields', 'customBadges', 'model', 'modelnumber', 'modelname', 'brand']
                  
                  // Helper to check if a spec value is valid (not garbage)
                  const isValidSpec = (key: string, value: any): boolean => {
                    if (!value) return false
                    const lowerKey = key.toLowerCase()
                    if (excludeKeys.includes(lowerKey)) return false
                    if (lowerKey.includes('model')) return false // Exclude any key containing "model"
                    const str = value.toString().trim()
                    if (str.length === 0 || str.length > 150) return false
                    // Filter garbage patterns
                    const garbagePatterns = [
                      'div:', 'linear-gradient', 'background:', '#000', 'transparent',
                      'stars', 'rating', 'review', 'cart', 'slide', 'percent',
                      'protection plan', 'about this', 'add to', 'widget',
                      'out of 5', 'customer', 'first-child', ':after', ':before'
                    ]
                    const lowerStr = str.toLowerCase()
                    if (garbagePatterns.some(p => lowerStr.includes(p))) return false
                    return true
                  }
                  
                  const validSpecs = Object.entries(item.specifications)
                    .filter(([key, value]) => isValidSpec(key, value))
                  
                  if (validSpecs.length === 0) return null
                  
                  const displaySpecs = validSpecs.slice(0, 5)
                  const moreCount = validSpecs.length - 5
                  
                  return (
                    <div className="bg-gradient-to-r from-[#6B4423]/5 to-[#8B5A3C]/5 rounded-lg p-3 border border-[#8B5A3C]/10 mb-3">
                      <p className="text-[10px] font-bold text-[#6B4423] uppercase tracking-wider mb-2 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-[#DAA520] rounded-full"></span>
                        Specifications
                      </p>
                      <div className="flex flex-col gap-1">
                        {displaySpecs.map(([key, value]) => (
                          <div key={key} className="flex items-center text-[10px]">
                            <span className="font-semibold text-[#6B4423] capitalize w-[100px] flex-shrink-0 truncate">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                            <span className="text-[#654321] truncate flex-1" title={String(value)}>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                      {moreCount > 0 && (
                        <p className="text-[10px] font-bold text-[#DAA520] mt-2">+{moreCount} more specs →</p>
                      )}
                    </div>
                  )
                })()}

                {/* Choose Your Preferred Options - Matches /wishlist/add page UI */}
                {item.preferenceOptions && (() => {
                  // Keys to exclude from display (these are metadata, not variant options)
                  const excludeKeys = ['image', 'title', 'customFields', 'notes']
                  
                  // Helper to check if a value is valid (not garbage data)
                  const isValidValue = (value: any): boolean => {
                    if (!value) return false
                    const str = value.toString().trim()
                    // Filter out garbage: too long, contains "stars", "ratings", "reviews", etc.
                    if (str.length > 100) return false
                    if (str.length === 0) return false
                    const garbagePatterns = [
                      'stars', 'rating', 'review', 'cart', 'slide', 'percent', 
                      'protection plan', 'about this', 'add to', 'widget', 
                      'feedback', 'out of 5', 'customer'
                    ]
                    const lowerStr = str.toLowerCase()
                    if (garbagePatterns.some(p => lowerStr.includes(p))) return false
                    return true
                  }
                  
                  // Helper to get valid entries only (exclude metadata, keep variant options)
                  const getValidEntries = (opt: Record<string, any> | null | undefined) => {
                    if (!opt) return []
                    return Object.entries(opt)
                      .filter(([key, value]) => !excludeKeys.includes(key) && isValidValue(value) && typeof value === 'string')
                  }
                  
                  // Filter out 'size' from I Wish entries as requested
                  const iLikeEntries = getValidEntries(item.preferenceOptions.iLike).filter(([key]) => key.toLowerCase() !== 'size')
                  const altEntries = getValidEntries(item.preferenceOptions.alternative)
                  const okToBuyEntries = getValidEntries(item.preferenceOptions.okToBuy)
                  
                  // Always show this section (Ok to Buy always displays with its description)
                  
                  return (
                    <div className="bg-gradient-to-br from-[#FEF7ED] via-[#FFF7ED] to-[#FFFBEB] border-2 border-[#DAA520]/30 rounded-xl p-3 mb-3 shadow-sm">
                      {/* Header - matches /gifts/trending modal */}
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#DAA520]/20">
                        <Heart className="w-4 h-4 text-[#DC2626] fill-[#DC2626]" />
                        <h4 className="text-xs font-bold text-[#8B4513]">Choose Your Preferred Options</h4>
                      </div>

                      <div className="space-y-2">
                        {/* I Wish Section - With image on left */}
                        <div className="rounded-lg border-2 border-[#B8860B] bg-gradient-to-r from-[#DAA520]/30 to-[#F4C430]/25 shadow-md p-2.5">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#F4C430] text-white flex items-center gap-1 shadow-sm">
                                ❤️ I Wish
                              </span>
                              <span className="text-[9px] text-red-500 font-medium">* Required</span>
                            </div>
                            {/* Edit/Save/Cancel buttons */}
                            {editingItemId === item.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => saveEditedPreferences(item.id)}
                                  className="p-1 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                                  title="Save"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditingPreferences}
                                  className="p-1 bg-gray-400 hover:bg-gray-500 text-white rounded-full transition-colors"
                                  title="Cancel"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEditingPreferences(item)}
                                className="p-1 bg-[#DAA520] hover:bg-[#B8860B] text-white rounded-full transition-colors"
                                title="Edit preferences"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          
                          {/* Image + Options Row */}
                          <div className="flex gap-3">
                            {/* Product Image - Left Panel */}
                            {(item.preferenceOptions?.iLike?.image || item.productImageUrl) && (
                              <div className="flex-shrink-0">
                                <Image
                                  src={item.preferenceOptions?.iLike?.image || item.productImageUrl || "/placeholder.svg"}
                                  alt={item.preferenceOptions?.iLike?.title || item.giftName}
                                  width={80}
                                  height={80}
                                  className="object-contain rounded-lg bg-white border border-[#DAA520]/20"
                                />
                              </div>
                            )}
                            
                            {/* Options - Right Panel */}
                            <div className="flex-1 min-w-0">
                              {/* Edit Mode */}
                          {editingItemId === item.id ? (
                            <div className="space-y-2">
                              {/* Color */}
                              <div className="flex items-center gap-2">
                                <label className="text-[10px] font-semibold text-[#6B4423] w-20">Color:</label>
                                <input
                                  type="text"
                                  value={editedPreferences.color}
                                  onChange={(e) => setEditedPreferences(prev => ({ ...prev, color: e.target.value }))}
                                  className="flex-1 text-[10px] px-2 py-1 border border-[#DAA520]/30 rounded bg-white focus:outline-none focus:border-[#DAA520]"
                                  placeholder="e.g., Silver Aluminum Case"
                                />
                                {editedPreferences.color && (
                                  <button
                                    type="button"
                                    onClick={() => removePreferenceOption('color')}
                                    className="p-0.5 text-red-500 hover:text-red-700 transition-colors"
                                    title="Remove"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              {/* Size */}
                              <div className="flex items-center gap-2">
                                <label className="text-[10px] font-semibold text-[#6B4423] w-20">Size:</label>
                                <input
                                  type="text"
                                  value={editedPreferences.size}
                                  onChange={(e) => setEditedPreferences(prev => ({ ...prev, size: e.target.value }))}
                                  className="flex-1 text-[10px] px-2 py-1 border border-[#DAA520]/30 rounded bg-white focus:outline-none focus:border-[#DAA520]"
                                  placeholder="e.g., 42mm + S/M"
                                />
                                {editedPreferences.size && (
                                  <button
                                    type="button"
                                    onClick={() => removePreferenceOption('size')}
                                    className="p-0.5 text-red-500 hover:text-red-700 transition-colors"
                                    title="Remove"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              {/* Style */}
                              <div className="flex items-center gap-2">
                                <label className="text-[10px] font-semibold text-[#6B4423] w-20">Style:</label>
                                <input
                                  type="text"
                                  value={editedPreferences.style}
                                  onChange={(e) => setEditedPreferences(prev => ({ ...prev, style: e.target.value }))}
                                  className="flex-1 text-[10px] px-2 py-1 border border-[#DAA520]/30 rounded bg-white focus:outline-none focus:border-[#DAA520]"
                                  placeholder="e.g., Sport Band"
                                />
                                {editedPreferences.style && (
                                  <button
                                    type="button"
                                    onClick={() => removePreferenceOption('style')}
                                    className="p-0.5 text-red-500 hover:text-red-700 transition-colors"
                                    title="Remove"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              {/* Configuration */}
                              <div className="flex items-center gap-2">
                                <label className="text-[10px] font-semibold text-[#6B4423] w-20">Config:</label>
                                <input
                                  type="text"
                                  value={editedPreferences.configuration}
                                  onChange={(e) => setEditedPreferences(prev => ({ ...prev, configuration: e.target.value }))}
                                  className="flex-1 text-[10px] px-2 py-1 border border-[#DAA520]/30 rounded bg-white focus:outline-none focus:border-[#DAA520]"
                                  placeholder="e.g., GPS + Cellular"
                                />
                                {editedPreferences.configuration && (
                                  <button
                                    type="button"
                                    onClick={() => removePreferenceOption('configuration')}
                                    className="p-0.5 text-red-500 hover:text-red-700 transition-colors"
                                    title="Remove"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            /* Display Mode */
                            iLikeEntries.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {iLikeEntries.map(([key, value]) => (
                                  <span key={key} className="text-[10px] bg-white text-[#4A2F1A] px-2 py-1 rounded-lg border border-[#DAA520]/30 shadow-sm">
                                    <span className="font-semibold capitalize text-[#6B4423]">{key}:</span> {value}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-[#8B6914] bg-[#DAA520]/10 px-2 py-1 rounded-md border border-[#DAA520]/20 italic">
                                💡 Click the edit icon to add your preferences.
                              </p>
                            )
                          )}
                            </div>
                          </div>
                        </div>

                        {/* Alternative Section - With image on left */}
                        <div className="rounded-lg border-2 border-[#D97706] bg-gradient-to-r from-[#D97706]/15 to-[#F59E0B]/15 p-2.5">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-white shadow-sm">
                                ✓ Alternative
                              </span>
                              <span className="text-[9px] text-gray-500 font-medium">Optional</span>
                            </div>
                            {/* Edit/Save/Cancel and Select on Retailer buttons */}
                            <div className="flex items-center gap-2">
                              {editingAltItemId === item.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => saveEditedAltPreferences(item.id)}
                                    className="p-1 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                                    title="Save"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditingAltPreferences}
                                    className="p-1 bg-gray-400 hover:bg-gray-500 text-white rounded-full transition-colors"
                                    title="Cancel"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startEditingAltPreferences(item)}
                                  className="p-1 bg-[#D97706] hover:bg-[#B45309] text-white rounded-full transition-colors"
                                  title="Edit alternative preferences"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              )}
                              <a
                                href={item.webLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-[#4A2F1A] font-medium hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                Select on Retailer
                              </a>
                            </div>
                          </div>
                          
                          {/* Instructions */}
                          <p className="text-[9px] text-[#92400E] bg-[#D97706]/10 px-2 py-1.5 rounded-md border border-[#D97706]/20 italic mb-2">
                            To select different options, click <ExternalLink className="w-2.5 h-2.5 inline-block align-middle mx-0.5" /> Select on Retailer, choose your preferred options, and clip them using the Wishbee extension.
                          </p>
                          
                          {/* Image + Options Row */}
                          <div className="flex gap-3">
                            {/* Product Image - Left Panel */}
                            <div className="flex-shrink-0">
                              {item.preferenceOptions?.alternative?.image ? (
                                <Image
                                  src={item.preferenceOptions.alternative.image}
                                  alt={item.preferenceOptions.alternative.title || "Alternative option"}
                                  width={80}
                                  height={80}
                                  className="object-contain rounded-lg bg-white border border-[#D97706]/20"
                                />
                              ) : (
                                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-[#D97706]/20 flex items-center justify-center">
                                  <span className="text-[#D97706] text-[9px] text-center px-1">Clip variant image</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Options - Right Panel */}
                            <div className="flex-1 min-w-0">
                              {/* Edit Mode */}
                              {editingAltItemId === item.id ? (
                                <div className="space-y-2">
                                  {/* Color */}
                                  <div className="flex items-center gap-2">
                                    <label className="text-[10px] font-semibold text-[#6B4423] w-16">Color:</label>
                                    <input
                                      type="text"
                                      value={editedAltPreferences.color}
                                      onChange={(e) => setEditedAltPreferences(prev => ({ ...prev, color: e.target.value }))}
                                      className="flex-1 text-[10px] px-2 py-1 border border-[#D97706]/30 rounded bg-white focus:outline-none focus:border-[#D97706]"
                                      placeholder="e.g., Midnight"
                                    />
                                    {editedAltPreferences.color && (
                                      <button
                                        type="button"
                                        onClick={() => removeAltPreferenceOption('color')}
                                        className="p-0.5 text-red-500 hover:text-red-700 transition-colors"
                                        title="Remove"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                  {/* Style */}
                                  <div className="flex items-center gap-2">
                                    <label className="text-[10px] font-semibold text-[#6B4423] w-16">Style:</label>
                                    <input
                                      type="text"
                                      value={editedAltPreferences.style}
                                      onChange={(e) => setEditedAltPreferences(prev => ({ ...prev, style: e.target.value }))}
                                      className="flex-1 text-[10px] px-2 py-1 border border-[#D97706]/30 rounded bg-white focus:outline-none focus:border-[#D97706]"
                                      placeholder="e.g., USB-C"
                                    />
                                    {editedAltPreferences.style && (
                                      <button
                                        type="button"
                                        onClick={() => removeAltPreferenceOption('style')}
                                        className="p-0.5 text-red-500 hover:text-red-700 transition-colors"
                                        title="Remove"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                  {/* Configuration/Set */}
                                  <div className="flex items-center gap-2">
                                    <label className="text-[10px] font-semibold text-[#6B4423] w-16">Set:</label>
                                    <input
                                      type="text"
                                      value={editedAltPreferences.configuration}
                                      onChange={(e) => setEditedAltPreferences(prev => ({ ...prev, configuration: e.target.value }))}
                                      className="flex-1 text-[10px] px-2 py-1 border border-[#D97706]/30 rounded bg-white focus:outline-none focus:border-[#D97706]"
                                      placeholder="e.g., Without AppleCare+"
                                    />
                                    {editedAltPreferences.configuration && (
                                      <button
                                        type="button"
                                        onClick={() => removeAltPreferenceOption('configuration')}
                                        className="p-0.5 text-red-500 hover:text-red-700 transition-colors"
                                        title="Remove"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                /* Display Mode */
                                <>
                                  {altEntries.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                      {altEntries.map(([key, value]) => (
                                        <span key={key} className="text-[10px] bg-white text-[#4A2F1A] px-2 py-1 rounded-lg border border-[#D97706]/30 shadow-sm">
                                          <span className="font-semibold capitalize text-[#6B4423]">{key}:</span> {value}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-[#92400E] italic mb-2">
                                      No alternative options selected yet. Click edit to add.
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Ok to Buy Section - Matches modal/add page styling */}
                        <div className="rounded-lg border-2 border-[#8B5A3C]/20 bg-white/50 p-2.5">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-[#C2410C] to-[#EA580C] text-white shadow-sm">
                              💫 Ok to Buy
                            </span>
                          </div>
                          <p className="text-[9px] text-[#9A3412] bg-[#C2410C]/10 px-2 py-1.5 rounded-md border border-[#C2410C]/20 italic">
                            💡 You may purchase this product from another retailer, as long as it aligns with the "I Wish" or "Alternative" preferences.
                          </p>
                          {okToBuyEntries.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {okToBuyEntries.map(([key, value]) => (
                                <span key={key} className="text-[10px] bg-white text-[#4A2F1A] px-2 py-1 rounded-lg border border-[#C2410C]/20 shadow-sm">
                                  <span className="font-semibold capitalize text-[#6B4423]">{key}:</span> {value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                <div className="space-y-3 mt-auto pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleBuyNow(item)}
                      className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520] transition-all shadow-md hover:shadow-lg text-xs sm:text-sm font-semibold"
                    >
                      <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Buy Now
                    </Button>
                    <Button
                      onClick={() => handleShare(item)}
                      className="bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#FB923C] text-white hover:from-[#C2410C] hover:via-[#EA580C] hover:to-[#F97316] transition-all shadow-md hover:shadow-lg text-xs sm:text-sm font-semibold"
                    >
                      <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Share
                    </Button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="w-full px-4 py-2 text-red-600 hover:bg-red-50 bg-transparent border border-red-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove from Wishlist</span>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
