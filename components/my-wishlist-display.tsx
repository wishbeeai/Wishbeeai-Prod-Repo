"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Share2, Trash2, ShoppingCart, AlertCircle, Plus, Pencil, X, Check, ExternalLink, Heart, Info, ChevronDown, ChevronUp } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { ShareModal } from "@/components/share-modal"

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
  wishlistId: string        // ID of the wishlist this item belongs to
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

  // State for Share Modal
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareItem, setShareItem] = useState<WishlistItem | null>(null)

  // State for Specifications Modal
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false)
  const [selectedItemForSpecs, setSelectedItemForSpecs] = useState<WishlistItem | null>(null)

  // State for collapsed Alternative and Ok to Buy sections (collapsed by default)
  const [collapsedAlt, setCollapsedAlt] = useState<Record<string, boolean>>({})
  const [collapsedOkToBuy, setCollapsedOkToBuy] = useState<Record<string, boolean>>({})

  // Toggle collapse for Alternative section
  const toggleAltCollapse = (itemId: string) => {
    setCollapsedAlt(prev => ({ ...prev, [itemId]: !prev[itemId] }))
  }

  // Toggle collapse for Ok to Buy section
  const toggleOkToBuyCollapse = (itemId: string) => {
    setCollapsedOkToBuy(prev => ({ ...prev, [itemId]: !prev[itemId] }))
  }

  // Check if Alternative is collapsed (default: true = collapsed)
  const isAltCollapsed = (itemId: string) => collapsedAlt[itemId] !== false

  // Check if Ok to Buy is collapsed (default: true = collapsed)
  const isOkToBuyCollapsed = (itemId: string) => collapsedOkToBuy[itemId] !== false

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
              // Debug logging for preferences
              console.log('[Wishlist] Item:', item.title?.substring(0, 30))
              console.log('[Wishlist] Has preferenceOptions:', !!descriptionData.preferenceOptions)
              if (descriptionData.preferenceOptions) {
                console.log('[Wishlist] Has iLike:', !!descriptionData.preferenceOptions.iLike)
                console.log('[Wishlist] Has alternative:', !!descriptionData.preferenceOptions.alternative)
                if (descriptionData.preferenceOptions.alternative) {
                  console.log('[Wishlist] Alternative image:', descriptionData.preferenceOptions.alternative.image?.substring(0, 60))
                  console.log('[Wishlist] Alternative color:', descriptionData.preferenceOptions.alternative.color)
                }
              }
            }
          } catch (e) {
            // Not JSON, keep as string
            descriptionData = { text: item.description }
            console.error('[Wishlist] Error parsing description:', e)
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
            wishlistId: item.wishlist_id, // Preserve wishlist ID for sharing
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

  /**
   * Open the share modal for a specific item
   * The modal allows sharing via multiple channels (WhatsApp, SMS, Email, etc.)
   */
  const handleShare = (item: WishlistItem) => {
    setShareItem(item)
    setShareModalOpen(true)
  }

  /**
   * Close the share modal and reset state
   */
  const closeShareModal = () => {
    setShareModalOpen(false)
    setShareItem(null)
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
    <div className="space-y-6 min-h-screen">
      {/* Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex flex-row items-center justify-center gap-2">
          <Heart className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#DAA520] fill-[#DAA520] flex-shrink-0" />
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-foreground whitespace-nowrap">
            My Wishlist
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2">
          Track, share, and manage all your wishes in one place
        </p>
      </div>

      <div className="flex justify-center">
        <Link href="/wishlist/add">
          <Button className="h-11 px-6 rounded-full bg-gradient-to-r from-[#DAA520] via-[#F4C430] to-[#FFD700] text-[#654321] hover:from-[#FFD700] hover:via-[#F4C430] hover:to-[#DAA520] transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl text-sm font-bold border-2 border-[#B8860B]/30">
            <Plus className="h-5 w-5 mr-2" />
            Add New Item
          </Button>
        </Link>
      </div>

      {/* Wishlist Items Grid */}
      {wishlistItems.length === 0 ? (
        <Card className="p-12 text-center bg-gradient-to-br from-[#FFF8DC] via-[#FFEFD5] to-[#FFE4B5] border-2 border-[#DAA520]/30 rounded-2xl shadow-lg">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#DAA520]/20 to-[#F4C430]/20 flex items-center justify-center">
              <Heart className="w-10 h-10 text-[#DAA520]" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#8B4513] mb-1">Your wishlist is empty</p>
              <p className="text-sm text-[#8B6914]">Start adding items you love!</p>
            </div>
            <Link href="/wishlist/add">
              <Button className="h-10 px-5 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520] transition-all hover:scale-105 shadow-md font-semibold text-sm">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Your First Item
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 p-6 hover:shadow-xl transition-shadow flex flex-col h-full"
            >
              {/* Product Details */}
              <div className="flex flex-col h-full">
                {/* Product Preferences Section */}
                {item.preferenceOptions && (() => {
                  // Keys to exclude from display (these are metadata, not variant options)
                  const excludeKeys = ['image', 'title', 'customFields', 'notes']
                  
                  // Helper to check if a value is valid (not garbage data)
                  const isValidValue = (value: any): boolean => {
                    if (!value) return false
                    const str = value.toString().trim()
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
                    if (typeof opt === 'string') return []
                    if (Array.isArray(opt)) return []
                    return Object.entries(opt)
                      .filter(([key, value]) => !excludeKeys.includes(key) && isValidValue(value) && typeof value === 'string')
                  }
                  
                  const iLikeEntries = getValidEntries(item.preferenceOptions.iLike)
                  const altEntries = getValidEntries(item.preferenceOptions.alternative)
                  const okToBuyEntries = getValidEntries(item.preferenceOptions.okToBuy)
                  
                  return (
                    <div className="space-y-3 mb-3">
                      {/* I Wish Section - Full Product Details */}
                        <div className="rounded-xl border-2 border-[#B8860B] bg-gradient-to-br from-[#DAA520]/25 via-[#F4C430]/20 to-[#FFD700]/15 shadow-lg p-3 relative overflow-hidden">
                          <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#FFD700]/10 rounded-full blur-xl pointer-events-none"></div>
                          <div className="flex items-center justify-between mb-3 relative z-10">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#F4C430] text-white flex items-center gap-1 shadow-sm">
                                ❤️ I Wish
                              </span>
                              <span className="text-[9px] text-red-500 font-medium">* Required</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={item.webLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-[#4A2F1A] font-medium hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                Select on Retailer
                              </a>
                              {editingItemId === item.id ? (
                                <div className="flex items-center gap-1">
                                  <button type="button" onClick={(e) => { e.stopPropagation(); saveEditedPreferences(item.id); }} className="p-1 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors cursor-pointer" title="Save"><Check className="w-3 h-3" /></button>
                                  <button type="button" onClick={(e) => { e.stopPropagation(); cancelEditingPreferences(); }} className="p-1 bg-gray-400 hover:bg-gray-500 text-white rounded-full transition-colors cursor-pointer" title="Cancel"><X className="w-3 h-3" /></button>
                                </div>
                              ) : (
                                <button type="button" onClick={(e) => { e.stopPropagation(); startEditingPreferences(item); }} className="p-1 bg-[#DAA520] hover:bg-[#B8860B] text-white rounded-full transition-colors cursor-pointer" title="Edit preferences"><Pencil className="w-3 h-3" /></button>
                              )}
                            </div>
                          </div>
                          
                          {/* Product Image & Details Row */}
                          <div className="flex gap-3 mb-3">
                            <div className="w-16 h-16 flex-shrink-0 bg-white rounded-lg border border-[#DAA520]/20 p-1">
                              <Image src={item.productImageUrl || "/placeholder.svg"} alt={item.giftName} width={56} height={56} className="w-full h-full object-contain" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-bold text-[#4A2F1A] line-clamp-2 leading-tight mb-1">{item.giftName}</h5>
                              <p className="text-[10px] text-[#8B6914] mb-1 flex items-center gap-1"><span className="w-1 h-1 bg-[#DAA520] rounded-full"></span>{item.storeName}</p>
                              {item.rating && (
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="flex items-center gap-0.5">
                                    {[1,2,3,4,5].map((s) => (<svg key={s} className="w-2.5 h-2.5" viewBox="0 0 24 24" fill={s <= Math.round(item.rating || 0) ? "#F4C430" : "#E5E7EB"} stroke="#F4C430" strokeWidth="1"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>))}
                                  </div>
                                  <span className="text-[9px] font-bold text-[#654321]">{item.rating?.toFixed(1)}</span>
                                  {item.reviewCount && <span className="text-[8px] text-gray-500">({item.reviewCount.toLocaleString()})</span>}
                                </div>
                              )}
                              <div className="flex flex-wrap gap-1 mb-1">
                                {item.badges?.amazonChoice && <span className="text-[8px] bg-gradient-to-r from-gray-900 to-black text-white px-1.5 py-0.5 rounded-full font-bold">Amazon&apos;s Choice</span>}
                                {item.badges?.bestSeller && <span className="text-[8px] text-white px-1.5 py-0.5 rounded-full font-bold" style={{backgroundColor:'#D14900'}}>#1 Best Seller</span>}
                              </div>
                              <div className="flex items-baseline gap-1">
                                {item.originalPrice && item.originalPrice > item.currentPrice && <span className="text-[9px] text-gray-400 line-through">${item.originalPrice.toFixed(2)}</span>}
                                <span className="text-sm font-bold text-[#654321]">${item.currentPrice.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Specifications */}
                          {item.specifications && Object.keys(item.specifications).length > 0 && (
                            <div className="bg-white/60 rounded-lg p-2.5 border border-[#DAA520]/20 mb-2">
                              <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider mb-2 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#DAA520] rounded-full"></span>Specifications</p>
                              <table className="w-full">
                                <tbody>
                                  {Object.entries(item.specifications).filter(([k,v]) => v && !['color','size','style','configuration'].includes(k.toLowerCase())).slice(0,4).map(([k,v]) => (
                                    <tr key={k}>
                                      <td className="text-[9px] font-semibold text-[#6B4423] capitalize whitespace-nowrap pr-3 py-0.5 align-top w-[80px]">{k}:</td>
                                      <td className="text-[9px] text-[#654321] py-0.5 break-words">{String(v)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* Selected Options */}
                          <div className="bg-white/60 rounded-lg p-2.5 border border-[#DAA520]/20">
                            <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider mb-2 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#DAA520] rounded-full"></span>Selected Options</p>
                            {editingItemId === item.id ? (
                              <table className="w-full">
                                <tbody>
                                  {['style','color','size','configuration'].map((field) => (
                                    <tr key={field}>
                                      <td className="text-[9px] font-semibold text-[#6B4423] capitalize whitespace-nowrap pr-2 py-1 align-middle w-[60px]">{field === 'configuration' ? 'Config:' : `${field}:`}</td>
                                      <td className="py-1">
                                        <input type="text" value={(editedPreferences as any)[field] || ''} onChange={(e) => setEditedPreferences(prev => ({...prev, [field]: e.target.value}))} className="w-full px-2 py-1 text-[9px] border border-[#DAA520]/30 rounded bg-white focus:outline-none focus:border-[#DAA520]" placeholder={`Enter ${field}...`} />
                                      </td>
                                      <td className="py-1 pl-1 w-[24px]">
                                        {(editedPreferences as any)[field] && <button type="button" onClick={() => removePreferenceOption(field)} className="p-0.5 hover:bg-red-100 rounded"><X className="w-3 h-3 text-red-500" /></button>}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : iLikeEntries.length > 0 ? (
                              <table className="w-full">
                                <tbody>
                                  {iLikeEntries.map(([key, value]) => (
                                    <tr key={key}>
                                      <td className="text-[9px] font-semibold text-[#6B4423] capitalize whitespace-nowrap pr-3 py-0.5 align-top w-[60px]">{key}:</td>
                                      <td className="text-[9px] text-[#654321] font-medium py-0.5 break-words">{value}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <p className="text-[9px] text-[#8B6914] italic">Click edit to add preferences</p>
                            )}
                          </div>
                        </div>

                        {/* Alternative Section - Collapsible */}
                        <div className="rounded-xl border-2 border-[#D97706] bg-gradient-to-br from-[#D97706]/15 via-[#F59E0B]/12 to-[#FBBF24]/10 p-3 relative overflow-hidden shadow-md">
                          <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-[#F59E0B]/10 rounded-full blur-xl pointer-events-none"></div>
                          {/* Collapsible Header */}
                          <button
                            type="button"
                            onClick={() => toggleAltCollapse(item.id)}
                            className="w-full flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-white shadow-sm">✓ Alternative</span>
                              <span className="text-[9px] text-gray-500 font-medium">Optional</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {isAltCollapsed(item.id) ? (
                                <ChevronDown className="w-4 h-4 text-[#D97706]" />
                              ) : (
                                <ChevronUp className="w-4 h-4 text-[#D97706]" />
                              )}
                            </div>
                          </button>
                          
                          {/* Collapsible Content */}
                          {!isAltCollapsed(item.id) && (
                            <div className="mt-3">
                              <div className="flex items-center justify-end gap-2 mb-3">
                                <a href={item.webLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#4A2F1A] font-medium hover:underline flex items-center gap-1"><ExternalLink className="w-2.5 h-2.5" />Select on Retailer</a>
                                {editingAltItemId === item.id ? (
                                  <div className="flex items-center gap-1">
                                    <button type="button" onClick={() => saveEditedAltPreferences(item.id)} className="p-1 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors" title="Save"><Check className="w-3 h-3" /></button>
                                    <button type="button" onClick={cancelEditingAltPreferences} className="p-1 bg-gray-400 hover:bg-gray-500 text-white rounded-full transition-colors" title="Cancel"><X className="w-3 h-3" /></button>
                                  </div>
                                ) : (
                                  <button type="button" onClick={() => startEditingAltPreferences(item)} className="p-1 bg-[#D97706] hover:bg-[#B45309] text-white rounded-full transition-colors" title="Edit alternative"><Pencil className="w-3 h-3" /></button>
                                )}
                              </div>
                              
                              <p className="text-[9px] text-[#92400E] bg-[#D97706]/10 px-2 py-1 rounded-md border border-[#D97706]/20 italic mb-3">💡 Choose a backup option priced equal to or lower than your "I Wish" selection.</p>

                              {/* Alternative Product Details - if available */}
                              {item.preferenceOptions?.alternative?.image && (
                                <div className="flex gap-3 mb-3">
                                  <div className="w-16 h-16 flex-shrink-0 bg-white rounded-lg border border-[#D97706]/20 p-1">
                                    <Image src={item.preferenceOptions.alternative.image as string || "/placeholder.svg"} alt="Alternative" width={56} height={56} className="w-full h-full object-contain" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    {item.preferenceOptions.alternative.title && <h5 className="text-xs font-bold text-[#4A2F1A] line-clamp-2 leading-tight mb-1">{item.preferenceOptions.alternative.title as string}</h5>}
                                    <p className="text-[10px] text-[#92400E] mb-1 flex items-center gap-1"><span className="w-1 h-1 bg-[#D97706] rounded-full"></span>{item.storeName}</p>
                                  </div>
                                </div>
                              )}

                              {/* Selected Options */}
                              <div className="bg-white/60 rounded-lg p-2.5 border border-[#D97706]/20">
                                <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider mb-2 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#D97706] rounded-full"></span>Selected Options</p>
                                {editingAltItemId === item.id ? (
                                  <table className="w-full">
                                    <tbody>
                                      {['style','color','size','configuration'].map((field) => (
                                        <tr key={field}>
                                          <td className="text-[9px] font-semibold text-[#6B4423] capitalize whitespace-nowrap pr-2 py-1 align-middle w-[60px]">{field === 'configuration' ? 'Config:' : `${field}:`}</td>
                                          <td className="py-1">
                                            <input type="text" value={(editedAltPreferences as any)[field] || ''} onChange={(e) => setEditedAltPreferences(prev => ({...prev, [field]: e.target.value}))} className="w-full px-2 py-1 text-[9px] border border-[#D97706]/30 rounded bg-white focus:outline-none focus:border-[#D97706]" placeholder={`Enter ${field}...`} />
                                          </td>
                                          <td className="py-1 pl-1 w-[24px]">
                                            {(editedAltPreferences as any)[field] && <button type="button" onClick={() => removeAltPreferenceOption(field)} className="p-0.5 hover:bg-red-100 rounded"><X className="w-3 h-3 text-red-500" /></button>}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ) : altEntries.length > 0 ? (
                                  <table className="w-full">
                                    <tbody>
                                      {altEntries.map(([key, value]) => (
                                        <tr key={key}>
                                          <td className="text-[9px] font-semibold text-[#6B4423] capitalize whitespace-nowrap pr-3 py-0.5 align-top w-[60px]">{key}:</td>
                                          <td className="text-[9px] text-[#654321] font-medium py-0.5 break-words">{value}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ) : (
                                  <p className="text-[9px] text-[#92400E] italic">No alternative options yet. Click edit to add.</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Ok to Buy Section - Collapsible */}
                        <div className="rounded-xl border-2 border-[#C2410C]/30 bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5] p-3 relative overflow-hidden shadow-md">
                          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-[#EA580C]/10 rounded-full blur-xl"></div>
                          {/* Collapsible Header */}
                          <button
                            type="button"
                            onClick={() => toggleOkToBuyCollapse(item.id)}
                            className="w-full flex items-center justify-between cursor-pointer relative z-10"
                          >
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-[#C2410C] via-[#EA580C] to-[#F97316] text-white shadow-md">
                                💫 Ok to Buy
                              </span>
                              <span className="text-[9px] text-[#9A3412] font-medium">Optional</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {isOkToBuyCollapsed(item.id) ? (
                                <ChevronDown className="w-4 h-4 text-[#C2410C]" />
                              ) : (
                                <ChevronUp className="w-4 h-4 text-[#C2410C]" />
                              )}
                            </div>
                          </button>
                          
                          {/* Collapsible Content */}
                          {!isOkToBuyCollapsed(item.id) && (
                            <div className="mt-3">
                              <p className="text-[9px] text-[#9A3412] bg-white/60 backdrop-blur-sm px-2.5 py-2 rounded-lg border border-[#C2410C]/20 relative z-10 mb-3">
                                💡 You may purchase this product from another retailer, as long as it aligns with the "I Wish" or "Alternative" preferences.
                              </p>
                              {okToBuyEntries.length > 0 && (
                                <div className="bg-white/60 rounded-lg p-2.5 border border-[#C2410C]/20 relative z-10">
                                  <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider mb-2 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#C2410C] rounded-full"></span>Selected Options</p>
                                  <table className="w-full">
                                    <tbody>
                                      {okToBuyEntries.map(([key, value]) => (
                                        <tr key={key}>
                                          <td className="text-[9px] font-semibold text-[#6B4423] capitalize whitespace-nowrap pr-3 py-0.5 align-top w-[60px]">{key}:</td>
                                          <td className="text-[9px] text-[#654321] font-medium py-0.5 break-words">{value}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                    </div>
                  )
                })()}

                <div className="space-y-2 mt-auto pt-3 border-t border-[#DAA520]/20">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleBuyNow(item)}
                      className="h-8 bg-gradient-to-r from-[#DAA520] via-[#F4C430] to-[#FFD700] text-[#654321] hover:from-[#FFD700] hover:via-[#F4C430] hover:to-[#DAA520] transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] text-[10px] font-semibold rounded-lg border border-[#B8860B]/30"
                    >
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      Buy Now
                    </Button>
                    <Button
                      onClick={() => handleShare(item)}
                      className="h-8 bg-gradient-to-r from-[#FF6B6B] via-[#FF8E53] to-[#FFA500] text-white hover:from-[#FFA500] hover:via-[#FF8E53] hover:to-[#FF6B6B] transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] text-[10px] font-semibold rounded-lg"
                    >
                      <Share2 className="w-3 h-3 mr-1" />
                      Share
                    </Button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="w-full px-3 py-1.5 text-[#DC2626] hover:bg-gradient-to-r hover:from-[#DC2626] hover:to-[#EF4444] hover:text-white bg-white/80 backdrop-blur-sm border border-[#DC2626]/30 hover:border-transparent rounded-lg text-[10px] font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Specifications Modal */}
      {isSpecsModalOpen && selectedItemForSpecs && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setIsSpecsModalOpen(false)
            setSelectedItemForSpecs(null)
          }}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border-2 border-[#DAA520]/30"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] p-4 border-b-2 border-[#4A2F1A] relative">
              <button
                onClick={() => {
                  setIsSpecsModalOpen(false)
                  setSelectedItemForSpecs(null)
                }}
                className="absolute right-3 top-3 p-1 hover:bg-[#4A2F1A] rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <div className="text-center px-8">
                <h3 className="text-lg font-bold text-[#F5DEB3] line-clamp-2">
                  {selectedItemForSpecs.giftName}
                </h3>
                <p className="text-sm text-[#DAA520] mt-1 font-semibold">Additional Specifications</p>
              </div>
            </div>

            {/* Specifications List - Only show specs not displayed in card (after first 5) */}
            <div className="p-4 overflow-y-auto max-h-[60vh] bg-gradient-to-b from-[#F5F1E8] to-white">
              <div className="grid grid-cols-1 gap-3">
                {(() => {
                  // Get all valid specifications
                  const allSpecs = selectedItemForSpecs.specifications || selectedItemForSpecs.attributes || {}
                  const validSpecs = Object.entries(allSpecs).filter(([key, value]) => {
                    if (!value || value === 'null' || value === 'undefined') return false
                    const strValue = String(value).trim()
                    if (strValue.length === 0 || strValue.length > 200) return false
                    const lowerKey = key.toLowerCase()
                    const garbageKeys = ['asin', 'item model number', 'date first available', 'department', 'manufacturer']
                    if (garbageKeys.some(g => lowerKey.includes(g))) return false
                    return true
                  })
                  
                  // Show only specs after the first 5 (those not shown in the card)
                  const additionalSpecs = validSpecs.slice(5)
                  
                  if (additionalSpecs.length === 0) {
                    return (
                      <div className="text-center py-8 text-[#8B5A3C]">
                        No additional specifications available.
                      </div>
                    )
                  }
                  
                  return additionalSpecs.map(([key, value]) => (
                    <div 
                      key={key} 
                      className="bg-gradient-to-r from-[#6B4423]/10 via-[#8B5A3C]/10 to-[#6B4423]/10 rounded-lg p-3 border border-[#8B5A3C]/20"
                    >
                      <p className="text-xs font-bold text-[#6B4423] capitalize mb-1">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-sm text-[#654321]">{String(value)}</p>
                    </div>
                  ))
                })()}
              </div>
            </div>

            {/* Modal Footer - Same as header color */}
            <div className="bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] w-full h-[50px] border-t-2 border-[#4A2F1A]">
            </div>
          </div>
        </div>
      )}

      {/* Share Modal - for sharing wishlist items via multiple channels */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={closeShareModal}
        wishlistId={shareItem?.wishlistId || ""}
        wishlistTitle="My Wishlist"
        productId={shareItem?.id}
        productName={shareItem?.giftName}
      />
    </div>
  )
}
