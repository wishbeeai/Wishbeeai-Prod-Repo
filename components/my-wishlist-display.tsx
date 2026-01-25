"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Share2, Trash2, ShoppingCart, AlertCircle, Plus, Pencil, X, Check, ExternalLink, Heart, Info, ChevronDown, ChevronUp, Loader2, Scissors } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { ShareModal } from "@/components/share-modal"
import { useAuth } from "@/lib/auth-context"

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
  const { user, loading: authLoading } = useAuth()
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [aiInsights, setAiInsights] = useState<AIInsight | null>(null)
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // State for editing I Wish - comprehensive edit
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editedItem, setEditedItem] = useState<{
    giftName: string
    storeName: string
    rating: number | null
    reviewCount: number | null
    amazonChoice: boolean
    bestSeller: boolean
    originalPrice: number | null
    currentPrice: number
    specifications: Array<{ key: string; value: string }>
    selectedOptions: Array<{ key: string; value: string }>
  }>({
    giftName: '',
    storeName: '',
    rating: null,
    reviewCount: null,
    amazonChoice: false,
    bestSeller: false,
    originalPrice: null,
    currentPrice: 0,
    specifications: [],
    selectedOptions: []
  })

  // State for editing Alternative preferences - comprehensive edit
  const [editingAltItemId, setEditingAltItemId] = useState<string | null>(null)
  const [editedAltItem, setEditedAltItem] = useState<{
    title: string
    storeName: string
    selectedOptions: Array<{ key: string; value: string }>
    specifications: Array<{ key: string; value: string }>
  }>({
    title: '',
    storeName: '',
    selectedOptions: [],
    specifications: []
  })

  // State for Share Modal
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareItem, setShareItem] = useState<WishlistItem | null>(null)

  // State for Specifications Modal
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false)
  const [selectedItemForSpecs, setSelectedItemForSpecs] = useState<WishlistItem | null>(null)

  // State for collapsed Alternative and Ok to Buy sections (collapsed by default)
  const [collapsedAlt, setCollapsedAlt] = useState<Record<string, boolean>>({})
  const [collapsedOkToBuy, setCollapsedOkToBuy] = useState<Record<string, boolean>>({})
  
  // State for expanded Selected Options (default: collapsed, show only 3)
  const [expandedSelectedOptions, setExpandedSelectedOptions] = useState<Record<string, boolean>>({})

  // State for "Change Options" popup (I Wish)
  const [showIWishChangePopup, setShowIWishChangePopup] = useState<string | null>(null)
  const [iWishChangeUrl, setIWishChangeUrl] = useState("")
  const [isExtractingIWish, setIsExtractingIWish] = useState(false)

  // State for "Change Options" popup (Alternative)
  const [showAltChangePopup, setShowAltChangePopup] = useState<string | null>(null)
  const [altChangeUrl, setAltChangeUrl] = useState("")
  const [isExtractingAlt, setIsExtractingAlt] = useState(false)

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
        // Add cache-busting and credentials to ensure auth cookies are sent
        const response = await fetch("/api/wishlist-items/all", {
          cache: 'no-store',
          credentials: 'include', // Include cookies for authentication
          headers: {
            'Cache-Control': 'no-cache',
          },
        })
        
        if (!response.ok) {
          if (response.status === 401) {
            // User not authenticated - show message and empty state
            console.error("[My Wishlist] Authentication failed - user not logged in")
            toast({
              title: "Please Log In",
              description: "You need to be logged in to view your wishlist. Please log in and try again.",
              variant: "destructive",
            })
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

        console.log("[My Wishlist] Received items from API:", dbItems.length)

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

        console.log("[My Wishlist] Transformed items:", transformedItems.length)
        setWishlistItems(transformedItems)
      } catch (error) {
        console.error("Error fetching wishlist items:", error)
        toast({
          title: "Error",
          description: "Failed to load wishlist items. Check browser console for details.",
          variant: "destructive",
        })
        setWishlistItems([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchWishlistItems()
  }, [toast, user, authLoading])

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

  // Start editing I Wish - comprehensive edit for an item
  const startEditingPreferences = (item: WishlistItem) => {
    setEditingItemId(item.id)
    const iLike = item.preferenceOptions?.iLike
    
    // Convert specifications object to array
    const specsArray: Array<{ key: string; value: string }> = []
    if (item.specifications) {
      Object.entries(item.specifications).forEach(([key, value]) => {
        if (value && !['color', 'size', 'style', 'configuration', 'set'].includes(key.toLowerCase())) {
          specsArray.push({ key, value: String(value) })
        }
      })
    }
    
    // Convert iLike options to array (excluding metadata)
    const optionsArray: Array<{ key: string; value: string }> = []
    if (iLike) {
      const excludeKeys = ['image', 'title', 'customFields', 'notes']
      Object.entries(iLike).forEach(([key, value]) => {
        if (value && typeof value === 'string' && !excludeKeys.includes(key)) {
          optionsArray.push({ key, value })
        }
      })
    }
    
    setEditedItem({
      giftName: item.giftName || '',
      storeName: item.storeName || '',
      rating: item.rating || null,
      reviewCount: item.reviewCount || null,
      amazonChoice: item.badges?.amazonChoice || false,
      bestSeller: item.badges?.bestSeller || false,
      originalPrice: item.originalPrice || null,
      currentPrice: item.currentPrice || 0,
      specifications: specsArray,
      selectedOptions: optionsArray.length > 0 ? optionsArray : [{ key: '', value: '' }]
    })
  }

  // Cancel editing
  const cancelEditingPreferences = () => {
    setEditingItemId(null)
    setEditedItem({
      giftName: '',
      storeName: '',
      rating: null,
      reviewCount: null,
      amazonChoice: false,
      bestSeller: false,
      originalPrice: null,
      currentPrice: 0,
      specifications: [],
      selectedOptions: []
    })
  }

  // Save edited item - comprehensive save
  const saveEditedPreferences = async (itemId: string) => {
    try {
      const item = wishlistItems.find(i => i.id === itemId)
      if (!item) return

      // Convert selectedOptions array back to object
      const iLikeOptions: Record<string, string | null> = {}
      editedItem.selectedOptions.forEach(opt => {
        if (opt.key && opt.value) {
          iLikeOptions[opt.key] = opt.value
        }
      })

      // Convert specifications array back to object
      const specsObject: Record<string, string> = {}
      editedItem.specifications.forEach(spec => {
        if (spec.key && spec.value) {
          specsObject[spec.key] = spec.value
        }
      })

      const updatedPreferenceOptions = {
        ...item.preferenceOptions,
        iLike: {
          ...item.preferenceOptions?.iLike,
          ...iLikeOptions,
        }
      }

      const updatedItem = {
        ...item,
        giftName: editedItem.giftName,
        storeName: editedItem.storeName,
        rating: editedItem.rating,
        reviewCount: editedItem.reviewCount,
        badges: {
          amazonChoice: editedItem.amazonChoice,
          bestSeller: editedItem.bestSeller,
        },
        originalPrice: editedItem.originalPrice || undefined,
        currentPrice: editedItem.currentPrice,
        specifications: specsObject,
        preferenceOptions: updatedPreferenceOptions,
      }

      // Update via API
      const response = await fetch(`/api/wishlist-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftName: updatedItem.giftName,
          storeName: updatedItem.storeName,
          rating: updatedItem.rating,
          reviewCount: updatedItem.reviewCount,
          badges: updatedItem.badges,
          originalPrice: updatedItem.originalPrice,
          currentPrice: updatedItem.currentPrice,
          specifications: updatedItem.specifications,
          preferenceOptions: updatedItem.preferenceOptions,
        }),
      })

      if (response.ok) {
        setWishlistItems(prev => prev.map(i => i.id === itemId ? updatedItem : i))
        setEditingItemId(null)
        toast({
          title: "🐝 Item Updated!",
          description: "All changes have been saved",
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

  // Add a new specification field
  const addSpecification = () => {
    setEditedItem(prev => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }]
    }))
  }

  // Remove a specification field
  const removeSpecification = (index: number) => {
    setEditedItem(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }))
  }

  // Update a specification field
  const updateSpecification = (index: number, field: 'key' | 'value', value: string) => {
    setEditedItem(prev => ({
      ...prev,
      specifications: prev.specifications.map((spec, i) => 
        i === index ? { ...spec, [field]: value } : spec
      )
    }))
  }

  // Add a new selected option field
  const addSelectedOption = () => {
    setEditedItem(prev => ({
      ...prev,
      selectedOptions: [...prev.selectedOptions, { key: '', value: '' }]
    }))
  }

  // Remove a selected option field
  const removeSelectedOption = (index: number) => {
    setEditedItem(prev => ({
      ...prev,
      selectedOptions: prev.selectedOptions.filter((_, i) => i !== index)
    }))
  }

  // Update a selected option field
  const updateSelectedOption = (index: number, field: 'key' | 'value', value: string) => {
    setEditedItem(prev => ({
      ...prev,
      selectedOptions: prev.selectedOptions.map((opt, i) => 
        i === index ? { ...opt, [field]: value } : opt
      )
    }))
  }

  // Start editing Alternative preferences for an item
  const startEditingAltPreferences = (item: WishlistItem) => {
    setEditingAltItemId(item.id)
    const alt = item.preferenceOptions?.alternative
    
    // Convert alternative specifications to array
    const specsArray: Array<{ key: string; value: string }> = []
    if (alt?.specifications && typeof alt.specifications === 'object') {
      Object.entries(alt.specifications).forEach(([key, value]) => {
        if (value && !['color', 'size', 'style', 'configuration', 'set'].includes(key.toLowerCase())) {
          specsArray.push({ key, value: String(value) })
        }
      })
    }
    
    // Convert alternative options to array (excluding metadata)
    const optionsArray: Array<{ key: string; value: string }> = []
    if (alt) {
      const excludeKeys = ['image', 'title', 'customFields', 'notes', 'specifications']
      Object.entries(alt).forEach(([key, value]) => {
        if (value && typeof value === 'string' && !excludeKeys.includes(key)) {
          optionsArray.push({ key, value })
        }
      })
    }
    
    setEditedAltItem({
      title: (alt?.title as string) || '',
      storeName: item.storeName || '',
      selectedOptions: optionsArray.length > 0 ? optionsArray : [{ key: '', value: '' }],
      specifications: specsArray.length > 0 ? specsArray : []
    })
  }

  // Cancel editing Alternative
  const cancelEditingAltPreferences = () => {
    setEditingAltItemId(null)
    setEditedAltItem({
      title: '',
      storeName: '',
      selectedOptions: [],
      specifications: []
    })
  }

  // Add a new alternative selected option field
  const addAltSelectedOption = () => {
    setEditedAltItem(prev => ({
      ...prev,
      selectedOptions: [...prev.selectedOptions, { key: '', value: '' }]
    }))
  }

  // Remove an alternative selected option field
  const removeAltSelectedOption = (index: number) => {
    setEditedAltItem(prev => ({
      ...prev,
      selectedOptions: prev.selectedOptions.filter((_, i) => i !== index)
    }))
  }

  // Update an alternative selected option field
  const updateAltSelectedOption = (index: number, field: 'key' | 'value', value: string) => {
    setEditedAltItem(prev => ({
      ...prev,
      selectedOptions: prev.selectedOptions.map((opt, i) => 
        i === index ? { ...opt, [field]: value } : opt
      )
    }))
  }

  // Add a new alternative specification field
  const addAltSpecification = () => {
    setEditedAltItem(prev => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }]
    }))
  }

  // Remove an alternative specification field
  const removeAltSpecification = (index: number) => {
    setEditedAltItem(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }))
  }

  // Update an alternative specification field
  const updateAltSpecification = (index: number, field: 'key' | 'value', value: string) => {
    setEditedAltItem(prev => ({
      ...prev,
      specifications: prev.specifications.map((spec, i) => 
        i === index ? { ...spec, [field]: value } : spec
      )
    }))
  }

  // Save edited Alternative preferences
  const saveEditedAltPreferences = async (itemId: string) => {
    try {
      const item = wishlistItems.find(i => i.id === itemId)
      if (!item) return

      // Convert selectedOptions array back to object
      const altOptions: Record<string, string | null> = {}
      editedAltItem.selectedOptions.forEach(opt => {
        if (opt.key && opt.value) {
          altOptions[opt.key] = opt.value
        }
      })

      // Convert specifications array back to object
      const altSpecsObject: Record<string, string> = {}
      editedAltItem.specifications.forEach(spec => {
        if (spec.key && spec.value) {
          altSpecsObject[spec.key] = spec.value
        }
      })

      const updatedPreferenceOptions = {
        ...item.preferenceOptions,
        alternative: {
          ...item.preferenceOptions?.alternative,
          title: editedAltItem.title || null,
          ...altOptions,
          specifications: Object.keys(altSpecsObject).length > 0 ? altSpecsObject : null,
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
          title: "🐝 Alternative Updated!",
          description: "Your alternative options have been saved",
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

  const handleBuyNow = async (item: WishlistItem) => {
    // Add Amazon affiliate tag only for Amazon URLs
    const getAffiliateUrl = (url: string): string => {
      if (!url) return url
      
      try {
        const urlObj = new URL(url)
        const isAmazon = urlObj.hostname.includes('amazon.com') || 
                         urlObj.hostname.includes('amazon.co.') ||
                         urlObj.hostname.includes('amzn.to') ||
                         urlObj.hostname.includes('amzn.com')
        
        if (isAmazon) {
          // Remove any existing affiliate tag and add ours
          urlObj.searchParams.delete('tag')
          urlObj.searchParams.set('tag', 'wishbeeai-20')
          return urlObj.toString()
        }
        
        return url
      } catch {
        // If URL parsing fails, return original
        return url
      }
    }
    
    const affiliateUrl = getAffiliateUrl(item.webLink)
    
    try {
      await fetch("/api/wishlist/track-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, action: "buy_now" }),
      })
      window.open(affiliateUrl, "_blank")
    } catch (error) {
      console.error("Error tracking purchase:", error)
      window.open(affiliateUrl, "_blank")
    }
  }

  return (
    <div className="space-y-6 min-h-screen">
      {/* Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex flex-row items-center justify-center gap-2">
          <Heart className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#DAA520] flex-shrink-0" />
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
            Add Wishlist
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
              <p className="text-sm text-[#8B6914]">Start adding products you love!</p>
            </div>
            <Link href="/wishlist/add">
              <Button className="h-10 px-5 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520] transition-all hover:scale-105 shadow-md font-semibold text-sm">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Your First Wishlist
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
                      'feedback', 'out of 5', 'customer', 'items in cart',
                      '|'
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
                    .filter(([k]) => k.toLowerCase() !== 'size') // Size not used in Alternative Selected Options
                  const okToBuyEntries = getValidEntries(item.preferenceOptions.okToBuy)
                  
                  return (
                    <div className="space-y-3 mb-3">
                      {/* I Wish Section - Full Product Details */}
                        <div className="rounded-xl border-2 border-[#B8860B] bg-gradient-to-br from-[#DAA520]/25 via-[#F4C430]/20 to-[#FFD700]/15 shadow-lg p-3 relative overflow-hidden">
                          <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#FFD700]/10 rounded-full blur-xl pointer-events-none"></div>
                          
                          {/* I Wish Header */}
                          <div className="flex items-center justify-between mb-3 relative z-10">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#F4C430] text-white flex items-center gap-1 shadow-sm">
                              <Heart className="w-3 h-3 text-red-500" fill="#EF4444" />
                              I Wish
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowIWishChangePopup(item.id)
                                  setIWishChangeUrl("")
                                }}
                                className="text-[10px] text-[#4A2F1A] font-medium hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                Change Options
                              </button>
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
                          
                          {/* Change Product Popup for I Wish */}
                          {showIWishChangePopup === item.id && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={(e) => { e.stopPropagation(); setShowIWishChangePopup(null) }}>
                              <div className="bg-white rounded-2xl p-6 w-[400px] max-w-[90vw] shadow-2xl border-2 border-[#DAA520]/30" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-4">
                                  <h3 className="text-lg font-bold text-[#4A2F1A]">Change Product</h3>
                                  <button type="button" onClick={() => setShowIWishChangePopup(null)} className="p-1 hover:bg-gray-100 rounded-full">
                                    <X className="w-5 h-5 text-gray-500" />
                                  </button>
                                </div>
                                
                                <div className="space-y-4">
                                  {/* Select on Retailer Button */}
                                  {item.webLink && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        window.open(item.webLink, '_blank')
                                      }}
                                      className="w-full h-11 bg-gradient-to-r from-[#8B4513] to-[#A0522D] text-white font-semibold rounded-xl hover:from-[#A0522D] hover:to-[#8B4513] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                      Select on Retailer
                                    </button>
                                  )}
                                  
                                  {/* Divider */}
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1 h-px bg-[#DAA520]/30"></div>
                                    <span className="text-xs font-medium text-[#8B6914]">OR</span>
                                    <div className="flex-1 h-px bg-[#DAA520]/30"></div>
                                  </div>
                                  
                                  {/* URL Input */}
                                  <input
                                    type="text"
                                    value={iWishChangeUrl}
                                    onChange={(e) => setIWishChangeUrl(e.target.value)}
                                    placeholder="Paste product link to extract product details"
                                    className="w-full px-3 py-2.5 text-sm border-2 border-[#DAA520]/30 rounded-lg focus:outline-none focus:border-[#DAA520] bg-[#FFF8DC]/30"
                                  />
                                  
                                  {/* AI Extract Button */}
                                  <button
                                    type="button"
                                    disabled={!iWishChangeUrl || isExtractingIWish}
                                    onClick={async () => {
                                      if (!iWishChangeUrl) return
                                      setIsExtractingIWish(true)
                                      try {
                                        const response = await fetch('/api/ai/extract-product', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ url: iWishChangeUrl }),
                                        })
                                        if (response.ok) {
                                          const data = await response.json()
                                          console.log('[Wishlist] Extracted product data:', data)
                                          
                                          const updatedItem = {
                                            ...item,
                                            webLink: iWishChangeUrl,
                                            giftName: data.name || data.title || data.productName || item.giftName,
                                            productImageUrl: data.image || data.imageUrl || item.productImageUrl,
                                            storeName: data.store || data.source || data.storeName || item.storeName,
                                            currentPrice: data.price || item.currentPrice,
                                            originalPrice: data.originalPrice || data.listPrice || item.originalPrice,
                                            rating: data.rating || item.rating,
                                            reviewCount: data.reviewCount || item.reviewCount,
                                            badges: {
                                              amazonChoice: data.amazonChoice || data.badges?.amazonChoice || item.badges?.amazonChoice,
                                              bestSeller: data.bestSeller || data.badges?.bestSeller || item.badges?.bestSeller,
                                            },
                                            specifications: data.attributes || item.specifications,
                                            preferenceOptions: {
                                              ...item.preferenceOptions,
                                              iLike: {
                                                ...item.preferenceOptions?.iLike,
                                                image: data.image || data.imageUrl,
                                                title: data.name || data.title || data.productName,
                                                color: data.color || data.attributes?.color || '',
                                                size: data.size || data.attributes?.size || data.screenSize || data.attributes?.screenSize || data.attributes?.memoryStorageCapacity || '',
                                                style: data.style || data.attributes?.style || '',
                                                configuration: data.configuration || data.attributes?.configuration || data.attributes?.appleCarePlus || '',
                                              }
                                            }
                                          }
                                          
                                          setWishlistItems(prev => prev.map(i => i.id === item.id ? updatedItem : i))
                                          
                                          await fetch(`/api/wishlist-items/${item.id}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                              giftName: updatedItem.giftName,
                                              storeName: updatedItem.storeName,
                                              currentPrice: updatedItem.currentPrice,
                                              originalPrice: updatedItem.originalPrice,
                                              rating: updatedItem.rating,
                                              reviewCount: updatedItem.reviewCount,
                                              badges: updatedItem.badges,
                                              specifications: updatedItem.specifications,
                                              preferenceOptions: updatedItem.preferenceOptions,
                                            }),
                                          })
                                          
                                          setShowIWishChangePopup(null)
                                          toast({
                                            title: "🐝 Product Updated!",
                                            description: "I Wish product details synced successfully",
                                            variant: "warm",
                                          })
                                        }
                                      } catch (err) {
                                        console.error('[Wishlist] Extract error:', err)
                                        toast({
                                          title: "Extraction Failed",
                                          description: "Could not extract product details.",
                                          variant: "destructive",
                                        })
                                      } finally {
                                        setIsExtractingIWish(false)
                                      }
                                    }}
                                    className="w-full h-10 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#4A2F1A] font-semibold rounded-lg hover:from-[#F4C430] hover:to-[#DAA520] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                  >
                                    {isExtractingIWish ? (
                                      <><Loader2 className="w-4 h-4 animate-spin" /> Extracting...</>
                                    ) : (
                                      <><Sparkles className="w-4 h-4" /> AI Extract</>
                                    )}
                                  </button>
                                  
                                  {/* OR Divider */}
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1 h-px bg-[#DAA520]/30"></div>
                                    <span className="text-sm font-medium text-[#8B6914]">OR</span>
                                    <div className="flex-1 h-px bg-[#DAA520]/30"></div>
                                  </div>
                                  
                                  {/* Clip via Extension */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      window.open(item.webLink, '_blank')
                                      setShowIWishChangePopup(null)
                                      toast({
                                        title: "🐝 Extension Mode",
                                        description: "Select options on the retailer page, then click the extension.",
                                      })
                                    }}
                                    className="w-full h-10 bg-gradient-to-r from-[#8B4513] to-[#A0522D] text-white font-semibold rounded-lg hover:from-[#A0522D] hover:to-[#8B4513] transition-all flex items-center justify-center gap-2"
                                  >
                                    <Scissors className="w-4 h-4" /> Clip via Extension
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Edit Mode - Comprehensive Edit Form */}
                          {editingItemId === item.id ? (
                            <div className="space-y-3">
                              {/* Product Title */}
                              <div>
                                <label className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider mb-1 block">Product Title</label>
                                <input 
                                  type="text" 
                                  value={editedItem.giftName} 
                                  onChange={(e) => setEditedItem(prev => ({ ...prev, giftName: e.target.value }))} 
                                  className="w-full px-2 py-1.5 text-[10px] border border-[#DAA520]/30 rounded-lg bg-white focus:outline-none focus:border-[#DAA520]" 
                                  placeholder="Enter product title..."
                                />
                              </div>

                              {/* Store Name */}
                              <div>
                                <label className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider mb-1 block">Store Name</label>
                                <input 
                                  type="text" 
                                  value={editedItem.storeName} 
                                  onChange={(e) => setEditedItem(prev => ({ ...prev, storeName: e.target.value }))} 
                                  className="w-full px-2 py-1.5 text-[10px] border border-[#DAA520]/30 rounded-lg bg-white focus:outline-none focus:border-[#DAA520]" 
                                  placeholder="Enter store name..."
                                />
                              </div>

                              {/* Rating & Reviews */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider mb-1 block">Rating (0-5)</label>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    max="5" 
                                    step="0.1"
                                    value={editedItem.rating || ''} 
                                    onChange={(e) => setEditedItem(prev => ({ ...prev, rating: e.target.value ? parseFloat(e.target.value) : null }))} 
                                    className="w-full px-2 py-1.5 text-[10px] border border-[#DAA520]/30 rounded-lg bg-white focus:outline-none focus:border-[#DAA520]" 
                                    placeholder="4.5"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider mb-1 block">Review Count</label>
                                  <input 
                                    type="number" 
                                    min="0"
                                    value={editedItem.reviewCount || ''} 
                                    onChange={(e) => setEditedItem(prev => ({ ...prev, reviewCount: e.target.value ? parseInt(e.target.value) : null }))} 
                                    className="w-full px-2 py-1.5 text-[10px] border border-[#DAA520]/30 rounded-lg bg-white focus:outline-none focus:border-[#DAA520]" 
                                    placeholder="1234"
                                  />
                                </div>
                              </div>

                              {/* Badges */}
                              <div>
                                <label className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider mb-1 block">Badges</label>
                                <div className="flex flex-wrap gap-2">
                                  <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={editedItem.amazonChoice} 
                                      onChange={(e) => setEditedItem(prev => ({ ...prev, amazonChoice: e.target.checked }))} 
                                      className="w-3 h-3 accent-[#DAA520]"
                                    />
                                    <span className="text-[9px] text-[#654321]">Amazon&apos;s Choice</span>
                                  </label>
                                  <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={editedItem.bestSeller} 
                                      onChange={(e) => setEditedItem(prev => ({ ...prev, bestSeller: e.target.checked }))} 
                                      className="w-3 h-3 accent-[#DAA520]"
                                    />
                                    <span className="text-[9px] text-[#654321]">#1 Best Seller</span>
                                  </label>
                                </div>
                              </div>

                              {/* Prices */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider mb-1 block">List Price ($)</label>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    step="0.01"
                                    value={editedItem.originalPrice || ''} 
                                    onChange={(e) => setEditedItem(prev => ({ ...prev, originalPrice: e.target.value ? parseFloat(e.target.value) : null }))} 
                                    className="w-full px-2 py-1.5 text-[10px] border border-[#DAA520]/30 rounded-lg bg-white focus:outline-none focus:border-[#DAA520]" 
                                    placeholder="99.99"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider mb-1 block">Sale Price ($)</label>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    step="0.01"
                                    value={editedItem.currentPrice || ''} 
                                    onChange={(e) => setEditedItem(prev => ({ ...prev, currentPrice: parseFloat(e.target.value) || 0 }))} 
                                    className="w-full px-2 py-1.5 text-[10px] border border-[#DAA520]/30 rounded-lg bg-white focus:outline-none focus:border-[#DAA520]" 
                                    placeholder="79.99"
                                  />
                                </div>
                              </div>

                              {/* Specifications */}
                              <div className="bg-white/60 rounded-lg p-2.5 border border-[#DAA520]/20">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#DAA520] rounded-full"></span>Specifications</p>
                                  <button type="button" onClick={addSpecification} className="text-[9px] text-[#DAA520] font-semibold hover:underline flex items-center gap-0.5">
                                    <Plus className="w-3 h-3" /> Add
                                  </button>
                                </div>
                                <div className="space-y-1.5">
                                  {editedItem.specifications.map((spec, idx) => (
                                    <div key={idx} className="flex items-center gap-1">
                                      <input 
                                        type="text" 
                                        value={spec.key} 
                                        onChange={(e) => updateSpecification(idx, 'key', e.target.value)} 
                                        className="w-[80px] px-2 py-1 text-[9px] border border-[#DAA520]/30 rounded bg-white focus:outline-none focus:border-[#DAA520]" 
                                        placeholder="Field"
                                      />
                                      <span className="text-[9px] text-[#6B4423]">:</span>
                                      <input 
                                        type="text" 
                                        value={spec.value} 
                                        onChange={(e) => updateSpecification(idx, 'value', e.target.value)} 
                                        className="flex-1 px-2 py-1 text-[9px] border border-[#DAA520]/30 rounded bg-white focus:outline-none focus:border-[#DAA520]" 
                                        placeholder="Value"
                                      />
                                      <button type="button" onClick={() => removeSpecification(idx)} className="p-0.5 hover:bg-red-100 rounded">
                                        <Trash2 className="w-3 h-3 text-red-500" />
                                      </button>
                                    </div>
                                  ))}
                                  {editedItem.specifications.length === 0 && (
                                    <p className="text-[9px] text-[#8B6914] italic">No specifications. Click Add to create one.</p>
                                  )}
                                </div>
                              </div>

                              {/* Selected Options */}
                              <div className="bg-white/60 rounded-lg p-2.5 border border-[#DAA520]/20">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#DAA520] rounded-full"></span>Selected Options</p>
                                  <button type="button" onClick={addSelectedOption} className="text-[9px] text-[#DAA520] font-semibold hover:underline flex items-center gap-0.5">
                                    <Plus className="w-3 h-3" /> Add
                                  </button>
                                </div>
                                <div className="space-y-1.5">
                                  {editedItem.selectedOptions.map((opt, idx) => (
                                    <div key={idx} className="flex items-center gap-1">
                                      <input 
                                        type="text" 
                                        value={opt.key} 
                                        onChange={(e) => updateSelectedOption(idx, 'key', e.target.value)} 
                                        className="w-[80px] px-2 py-1 text-[9px] border border-[#DAA520]/30 rounded bg-white focus:outline-none focus:border-[#DAA520]" 
                                        placeholder="Field"
                                      />
                                      <span className="text-[9px] text-[#6B4423]">:</span>
                                      <input 
                                        type="text" 
                                        value={opt.value} 
                                        onChange={(e) => updateSelectedOption(idx, 'value', e.target.value)} 
                                        className="flex-1 px-2 py-1 text-[9px] border border-[#DAA520]/30 rounded bg-white focus:outline-none focus:border-[#DAA520]" 
                                        placeholder="Value"
                                      />
                                      <button type="button" onClick={() => removeSelectedOption(idx)} className="p-0.5 hover:bg-red-100 rounded">
                                        <Trash2 className="w-3 h-3 text-red-500" />
                                      </button>
                                    </div>
                                  ))}
                                  {editedItem.selectedOptions.length === 0 && (
                                    <p className="text-[9px] text-[#8B6914] italic">No options. Click Add to create one.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Product Image - Display Mode (Large, Centered) */}
                              <div className="flex justify-center mb-4">
                                <div className="w-40 h-40 sm:w-48 sm:h-48 bg-white rounded-2xl border-2 border-[#DAA520]/30 p-3 shadow-md">
                                  <Image src={item.productImageUrl || "/placeholder.svg"} alt={item.giftName} width={180} height={180} className="w-full h-full object-contain" />
                                </div>
                              </div>
                              
                              {/* Product Details - Below Image */}
                              <div className="bg-white/70 rounded-xl p-3 border border-[#DAA520]/20 mb-3">
                                <h5 className="text-sm font-bold text-[#4A2F1A] line-clamp-2 leading-snug mb-2">{item.giftName}</h5>
                                <p className="text-[11px] text-[#8B6914] mb-2 font-medium">
                                  {item.storeName}
                                </p>
                                {item.rating && (
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <div className="flex items-center gap-0.5">
                                      {[1,2,3,4,5].map((s) => (<svg key={s} className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={s <= Math.round(item.rating || 0) ? "#F4C430" : "#E5E7EB"} stroke="#F4C430" strokeWidth="1"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>))}
                                    </div>
                                    <span className="text-[11px] font-bold text-[#654321]">{item.rating?.toFixed(1)}</span>
                                    {item.reviewCount && <span className="text-[10px] text-gray-500">({item.reviewCount.toLocaleString()})</span>}
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {item.badges?.amazonChoice && <span className="text-[9px] bg-gradient-to-r from-gray-900 to-black text-white px-2 py-0.5 rounded-full font-bold">Amazon&apos;s Choice</span>}
                                  {item.badges?.bestSeller && <span className="text-[9px] text-white px-2 py-0.5 rounded-full font-bold" style={{backgroundColor:'#D14900'}}>#1 Best Seller</span>}
                                </div>
                                <div className="flex items-baseline gap-2">
                                  {item.originalPrice && item.originalPrice > item.currentPrice && <span className="text-xs text-gray-400 line-through">${item.originalPrice.toFixed(2)}</span>}
                                  <span className="text-lg font-extrabold text-[#654321]">${item.currentPrice.toFixed(2)}</span>
                                </div>
                              </div>

                              {/* Specifications - Display Mode */}
                              {item.specifications && Object.keys(item.specifications).length > 0 && (() => {
                                const allSpecs = Object.entries(item.specifications).filter(([k,v]) => v && !['color','size','style','configuration','set'].includes(k.toLowerCase()))
                                const visibleSpecs = allSpecs.slice(0, 5)
                                const hasMore = allSpecs.length > 5
                                
                                return (
                                  <div className="bg-white/60 rounded-lg p-2.5 border border-[#DAA520]/20 mb-2">
                                    <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider mb-2 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#DAA520] rounded-full"></span>Specifications</p>
                                    <div className="space-y-1">
                                      {visibleSpecs.map(([k,v]) => (
                                        <div key={k} className="flex items-start gap-2">
                                          <span className="text-[9px] font-semibold text-[#6B4423] capitalize whitespace-nowrap flex-shrink-0">{k}:</span>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <span className="text-[9px] text-[#654321] truncate cursor-help flex-1 min-w-0">{String(v)}</span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="max-w-[300px] bg-[#4A2F1A] text-white text-[10px] p-2 rounded-lg shadow-lg z-[200]">
                                              <p className="break-words">{String(v)}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </div>
                                      ))}
                                    </div>
                                    {hasMore && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedItemForSpecs(item)
                                          setIsSpecsModalOpen(true)
                                        }}
                                        className="text-[9px] text-[#DAA520] font-semibold mt-1.5 hover:underline flex items-center gap-1"
                                      >
                                        +{allSpecs.length - 5} more...
                                      </button>
                                    )}
                                  </div>
                                )
                              })()}

                              {/* Selected Options - Display Mode */}
                              <div className="bg-white/60 rounded-lg p-2.5 border border-[#DAA520]/20">
                                <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider mb-2 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#DAA520] rounded-full"></span>Selected Options</p>
                                <div className="min-h-[72px]">
                                  {iLikeEntries.length > 0 ? (
                                    <>
                                      <table className="w-full">
                                        <tbody>
                                          {(expandedSelectedOptions[item.id] ? iLikeEntries : iLikeEntries.slice(0, 3)).map(([key, value]) => {
                                            // Map "configuration" key to "Set" for display
                                            const displayKey = key.toLowerCase() === 'configuration' ? 'Set' : key
                                            return (
                                              <tr key={key}>
                                                <td className="text-[9px] font-semibold text-[#6B4423] capitalize whitespace-nowrap pr-3 py-0.5 align-top w-[60px]">{displayKey}:</td>
                                                <td className="text-[9px] text-[#654321] font-medium py-0.5 break-words">{value}</td>
                                              </tr>
                                            )
                                          })}
                                          {/* Empty rows to maintain consistent height when less than 3 options */}
                                          {!expandedSelectedOptions[item.id] && iLikeEntries.length < 3 && Array.from({ length: 3 - iLikeEntries.length }).map((_, i) => (
                                            <tr key={`empty-${i}`}>
                                              <td className="text-[9px] py-0.5">&nbsp;</td>
                                              <td className="text-[9px] py-0.5">&nbsp;</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                      {/* Always reserve space for "more..." link */}
                                      <div className="h-[18px] mt-1">
                                        {iLikeEntries.length > 3 && (
                                        <button
                                          type="button"
                                          onClick={() => setExpandedSelectedOptions(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                          className="text-[9px] text-[#DAA520] font-semibold hover:underline"
                                        >
                                          {expandedSelectedOptions[item.id] ? 'Show less' : `+${iLikeEntries.length - 3} more...`}
                                        </button>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <p className="text-[9px] text-[#8B6914] italic">Click edit to add preferences</p>
                                )}
                              </div>

                              {/* I Wish Notes — from Choose Your Preferred Options */}
                              {item.preferenceOptions?.iLike?.notes && (
                                <div className="bg-white/60 rounded-lg p-2.5 border border-[#DAA520]/20 mt-2">
                                  <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <span className="w-1 h-1 bg-[#DAA520] rounded-full"></span>Notes
                                  </p>
                                  <p className="text-[10px] text-[#654321] font-medium whitespace-pre-wrap break-words">
                                    {item.preferenceOptions.iLike.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                            </>
                          )}
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
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAltChangePopup(item.id)
                                    setAltChangeUrl("")
                                  }}
                                  className="text-[10px] text-[#4A2F1A] font-medium hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink className="w-2.5 h-2.5" />
                                  Change Options
                                </button>
                                
                                {/* Change Product Popup for Alternative */}
                                {showAltChangePopup === item.id && (
                                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={(e) => { e.stopPropagation(); setShowAltChangePopup(null) }}>
                                    <div className="bg-white rounded-2xl p-6 w-[400px] max-w-[90vw] shadow-2xl border-2 border-[#DAA520]/30" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-[#4A2F1A]">Change Product</h3>
                                        <button type="button" onClick={() => setShowAltChangePopup(null)} className="p-1 hover:bg-gray-100 rounded-full">
                                          <X className="w-5 h-5 text-gray-500" />
                                        </button>
                                      </div>
                                      
                                      <div className="space-y-4">
                                        {/* Select on Retailer Button */}
                                        {item.webLink && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              window.open(item.webLink, '_blank')
                                            }}
                                            className="w-full h-11 bg-gradient-to-r from-[#8B4513] to-[#A0522D] text-white font-semibold rounded-xl hover:from-[#A0522D] hover:to-[#8B4513] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                                          >
                                            <ExternalLink className="w-4 h-4" />
                                            Select on Retailer
                                          </button>
                                        )}
                                        
                                        {/* Divider */}
                                        <div className="flex items-center gap-3">
                                          <div className="flex-1 h-px bg-[#DAA520]/30"></div>
                                          <span className="text-xs font-medium text-[#8B6914]">OR</span>
                                          <div className="flex-1 h-px bg-[#DAA520]/30"></div>
                                        </div>
                                        
                                        {/* URL Input */}
                                        <input
                                          type="text"
                                          value={altChangeUrl}
                                          onChange={(e) => setAltChangeUrl(e.target.value)}
                                          placeholder="Paste product link to extract product details"
                                          className="w-full px-3 py-2.5 text-sm border-2 border-[#DAA520]/30 rounded-lg focus:outline-none focus:border-[#DAA520] bg-[#FFF8DC]/30"
                                        />
                                        
                                        {/* AI Extract Button */}
                                        <button
                                          type="button"
                                          disabled={!altChangeUrl || isExtractingAlt}
                                          onClick={async () => {
                                            if (!altChangeUrl) return
                                            setIsExtractingAlt(true)
                                            try {
                                              const response = await fetch('/api/ai/extract-product', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ url: altChangeUrl }),
                                              })
                                              if (response.ok) {
                                                const data = await response.json()
                                                console.log('[Wishlist] Extracted alt product data:', data)
                                                
                                                const updatedItem = {
                                                  ...item,
                                                  preferenceOptions: {
                                                    ...item.preferenceOptions,
                                                    alternative: {
                                                      image: data.image || data.imageUrl || '',
                                                      title: data.name || data.title || data.productName || '',
                                                      color: data.color || data.attributes?.color || '',
                                                      size: data.size || data.attributes?.size || data.screenSize || data.attributes?.screenSize || data.attributes?.memoryStorageCapacity || '',
                                                      style: data.style || data.attributes?.style || '',
                                                      configuration: data.configuration || data.attributes?.configuration || data.attributes?.appleCarePlus || '',
                                                      specifications: data.specifications || data.attributes || {},
                                                      storeName: data.storeName || data.store || 'Amazon',
                                                      rating: data.rating || data.stars || null,
                                                      reviewCount: data.reviewCount || data.reviews || null,
                                                      badges: {
                                                        amazonChoice: data.amazonChoice || data.badges?.amazonChoice || false,
                                                        bestSeller: data.bestSeller || data.badges?.bestSeller || false,
                                                      },
                                                      originalPrice: data.originalPrice || data.listPrice || null,
                                                      currentPrice: data.currentPrice || data.price || data.salePrice || null,
                                                    }
                                                  }
                                                }
                                                
                                                setWishlistItems(prev => prev.map(i => i.id === item.id ? updatedItem : i))
                                                
                                                await fetch(`/api/wishlist-items/${item.id}`, {
                                                  method: 'PATCH',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify({
                                                    preferenceOptions: updatedItem.preferenceOptions,
                                                  }),
                                                })
                                                
                                                setShowAltChangePopup(null)
                                                toast({
                                                  title: "🐝 Alternative Updated!",
                                                  description: "Alternative product has been replaced.",
                                                })
                                              }
                                            } catch (err) {
                                              console.error('[Wishlist] Extract alt error:', err)
                                              toast({
                                                title: "Extraction Failed",
                                                description: "Could not extract product details.",
                                                variant: "destructive",
                                              })
                                            } finally {
                                              setIsExtractingAlt(false)
                                            }
                                          }}
                                          className="w-full h-10 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#4A2F1A] font-semibold rounded-lg hover:from-[#F4C430] hover:to-[#DAA520] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                          {isExtractingAlt ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Extracting...</>
                                          ) : (
                                            <><Sparkles className="w-4 h-4" /> AI Extract</>
                                          )}
                                        </button>
                                        
                                        {/* OR Divider */}
                                        <div className="flex items-center gap-3">
                                          <div className="flex-1 h-px bg-[#DAA520]/30"></div>
                                          <span className="text-sm font-medium text-[#8B6914]">OR</span>
                                          <div className="flex-1 h-px bg-[#DAA520]/30"></div>
                                        </div>
                                        
                                        {/* Clip via Extension */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            window.open(item.webLink, '_blank')
                                            setShowAltChangePopup(null)
                                            toast({
                                              title: "🐝 Extension Mode",
                                              description: "Select options on the retailer page, then click the extension.",
                                            })
                                          }}
                                          className="w-full h-10 bg-gradient-to-r from-[#8B4513] to-[#A0522D] text-white font-semibold rounded-lg hover:from-[#A0522D] hover:to-[#8B4513] transition-all flex items-center justify-center gap-2"
                                        >
                                          <Scissors className="w-4 h-4" /> Clip via Extension
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
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

                              {/* Edit Mode for Alternative */}
                              {editingAltItemId === item.id ? (
                                <div className="space-y-3">
                                  {/* Alternative Title */}
                                  <div>
                                    <label className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider mb-1 block">Product Title</label>
                                    <input 
                                      type="text" 
                                      value={editedAltItem.title} 
                                      onChange={(e) => setEditedAltItem(prev => ({ ...prev, title: e.target.value }))} 
                                      className="w-full px-2 py-1.5 text-[10px] border border-[#D97706]/30 rounded-lg bg-white focus:outline-none focus:border-[#D97706]" 
                                      placeholder="Enter alternative product title..."
                                    />
                                  </div>

                                  {/* Specifications */}
                                  <div className="bg-white/60 rounded-lg p-2.5 border border-[#D97706]/20">
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#D97706] rounded-full"></span>Specifications</p>
                                      <button type="button" onClick={addAltSpecification} className="text-[9px] text-[#D97706] font-semibold hover:underline flex items-center gap-0.5">
                                        <Plus className="w-3 h-3" /> Add
                                      </button>
                                    </div>
                                    <div className="space-y-1.5">
                                      {editedAltItem.specifications.map((spec, idx) => (
                                        <div key={idx} className="flex items-center gap-1">
                                          <input 
                                            type="text" 
                                            value={spec.key} 
                                            onChange={(e) => updateAltSpecification(idx, 'key', e.target.value)} 
                                            className="w-[80px] px-2 py-1 text-[9px] border border-[#D97706]/30 rounded bg-white focus:outline-none focus:border-[#D97706]" 
                                            placeholder="Field"
                                          />
                                          <span className="text-[9px] text-[#6B4423]">:</span>
                                          <input 
                                            type="text" 
                                            value={spec.value} 
                                            onChange={(e) => updateAltSpecification(idx, 'value', e.target.value)} 
                                            className="flex-1 px-2 py-1 text-[9px] border border-[#D97706]/30 rounded bg-white focus:outline-none focus:border-[#D97706]" 
                                            placeholder="Value"
                                          />
                                          <button type="button" onClick={() => removeAltSpecification(idx)} className="p-0.5 hover:bg-red-100 rounded">
                                            <Trash2 className="w-3 h-3 text-red-500" />
                                          </button>
                                        </div>
                                      ))}
                                      {editedAltItem.specifications.length === 0 && (
                                        <p className="text-[9px] text-[#92400E] italic">No specifications. Click Add to create one.</p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Selected Options */}
                                  <div className="bg-white/60 rounded-lg p-2.5 border border-[#D97706]/20">
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#D97706] rounded-full"></span>Selected Options</p>
                                      <button type="button" onClick={addAltSelectedOption} className="text-[9px] text-[#D97706] font-semibold hover:underline flex items-center gap-0.5">
                                        <Plus className="w-3 h-3" /> Add
                                      </button>
                                    </div>
                                    <div className="space-y-1.5">
                                      {editedAltItem.selectedOptions.map((opt, idx) => (
                                        <div key={idx} className="flex items-center gap-1">
                                          <input 
                                            type="text" 
                                            value={opt.key} 
                                            onChange={(e) => updateAltSelectedOption(idx, 'key', e.target.value)} 
                                            className="w-[80px] px-2 py-1 text-[9px] border border-[#D97706]/30 rounded bg-white focus:outline-none focus:border-[#D97706]" 
                                            placeholder="Field"
                                          />
                                          <span className="text-[9px] text-[#6B4423]">:</span>
                                          <input 
                                            type="text" 
                                            value={opt.value} 
                                            onChange={(e) => updateAltSelectedOption(idx, 'value', e.target.value)} 
                                            className="flex-1 px-2 py-1 text-[9px] border border-[#D97706]/30 rounded bg-white focus:outline-none focus:border-[#D97706]" 
                                            placeholder="Value"
                                          />
                                          <button type="button" onClick={() => removeAltSelectedOption(idx)} className="p-0.5 hover:bg-red-100 rounded">
                                            <Trash2 className="w-3 h-3 text-red-500" />
                                          </button>
                                        </div>
                                      ))}
                                      {editedAltItem.selectedOptions.length === 0 && (
                                        <p className="text-[9px] text-[#92400E] italic">No options. Click Add to create one.</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {/* Alternative Product Details - Display Mode */}
                                  {/* Alternative Product Image - Large, Centered */}
                                  {item.preferenceOptions?.alternative?.image && (
                                    <div className="flex justify-center mb-4">
                                      <div className="w-40 h-40 sm:w-48 sm:h-48 bg-white rounded-2xl border-2 border-[#D97706]/30 p-3 shadow-md">
                                        <Image src={item.preferenceOptions.alternative.image as string || "/placeholder.svg"} alt="Alternative" width={180} height={180} className="w-full h-full object-contain" />
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Alternative Product Details - Below Image */}
                                  {item.preferenceOptions?.alternative && (
                                    <div className="bg-white/70 rounded-xl p-3 border border-[#D97706]/20 mb-3">
                                      {item.preferenceOptions.alternative.title && (
                                        <h5 className="text-sm font-bold text-[#4A2F1A] line-clamp-2 leading-snug mb-2">{item.preferenceOptions.alternative.title as string}</h5>
                                      )}
                                      <p className="text-[11px] text-[#92400E] font-medium mb-2">
                                        {(item.preferenceOptions.alternative as any).storeName || item.storeName}
                                      </p>
                                      {/* Rating and Review Count */}
                                      {(item.preferenceOptions.alternative as any).rating && (
                                        <div className="flex items-center gap-1.5 mb-2">
                                          <div className="flex items-center gap-0.5">
                                            {[1,2,3,4,5].map((s) => (<svg key={s} className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={s <= Math.round((item.preferenceOptions.alternative as any).rating || 0) ? "#F4C430" : "#E5E7EB"} stroke="#F4C430" strokeWidth="1"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>))}
                                          </div>
                                          <span className="text-[11px] font-bold text-[#654321]">{((item.preferenceOptions.alternative as any).rating as number)?.toFixed(1)}</span>
                                          {(item.preferenceOptions.alternative as any).reviewCount && <span className="text-[10px] text-gray-500">({((item.preferenceOptions.alternative as any).reviewCount as number).toLocaleString()})</span>}
                                        </div>
                                      )}
                                      {/* Badges */}
                                      <div className="flex flex-wrap gap-1.5 mb-2">
                                        {(item.preferenceOptions.alternative as any).badges?.amazonChoice && <span className="text-[9px] bg-gradient-to-r from-gray-900 to-black text-white px-2 py-0.5 rounded-full font-bold">Amazon&apos;s Choice</span>}
                                        {(item.preferenceOptions.alternative as any).badges?.bestSeller && <span className="text-[9px] text-white px-2 py-0.5 rounded-full font-bold" style={{backgroundColor:'#D14900'}}>#1 Best Seller</span>}
                                      </div>
                                      {/* Price */}
                                      {((item.preferenceOptions.alternative as any).currentPrice || (item.preferenceOptions.alternative as any).price) && (
                                        <div className="flex items-baseline gap-2">
                                          {(item.preferenceOptions.alternative as any).originalPrice && (item.preferenceOptions.alternative as any).originalPrice > ((item.preferenceOptions.alternative as any).currentPrice || (item.preferenceOptions.alternative as any).price) && (
                                            <span className="text-xs text-gray-400 line-through">${((item.preferenceOptions.alternative as any).originalPrice as number).toFixed(2)}</span>
                                          )}
                                          <span className="text-lg font-extrabold text-[#654321]">${(((item.preferenceOptions.alternative as any).currentPrice || (item.preferenceOptions.alternative as any).price) as number).toFixed(2)}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Specifications - Display Mode for Alternative */}
                                  {item.preferenceOptions?.alternative?.specifications && Object.keys(item.preferenceOptions.alternative.specifications).length > 0 && (() => {
                                    const altSpecs = item.preferenceOptions.alternative.specifications as Record<string, any>
                                    const allAltSpecs = Object.entries(altSpecs).filter(([k,v]) => v && !['color','size','style','configuration','set'].includes(k.toLowerCase()))
                                    const visibleAltSpecs = allAltSpecs.slice(0, 5)
                                    const hasMoreAltSpecs = allAltSpecs.length > 5
                                    
                                    return (
                                      <div className="bg-white/60 rounded-lg p-2.5 border border-[#D97706]/20 mb-2">
                                        <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider mb-2 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#D97706] rounded-full"></span>Specifications</p>
                                        <div className="space-y-1">
                                          {visibleAltSpecs.map(([k,v]) => (
                                            <div key={k} className="flex items-start gap-2">
                                              <span className="text-[9px] font-semibold text-[#6B4423] capitalize whitespace-nowrap flex-shrink-0">{k}:</span>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <span className="text-[9px] text-[#654321] truncate cursor-help flex-1 min-w-0">{String(v)}</span>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="max-w-[300px] bg-[#4A2F1A] text-white text-[10px] p-2 rounded-lg shadow-lg z-[200]">
                                                  <p className="break-words">{String(v)}</p>
                                                </TooltipContent>
                                              </Tooltip>
                                            </div>
                                          ))}
                                        </div>
                                        {hasMoreAltSpecs && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedItemForSpecs({...item, specifications: altSpecs})
                                              setIsSpecsModalOpen(true)
                                            }}
                                            className="mt-2 text-[9px] text-[#D97706] font-semibold hover:underline flex items-center gap-0.5"
                                          >
                                            View all {allAltSpecs.length} specs <ChevronDown className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    )
                                  })()}

                                  {/* Selected Options - Display Mode */}
                                  <div className="bg-white/60 rounded-lg p-2.5 border border-[#D97706]/20">
                                    <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider mb-2 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#D97706] rounded-full"></span>Selected Options</p>
                                    {altEntries.length > 0 ? (
                                      <table className="w-full">
                                        <tbody>
                                          {altEntries.map(([key, value]) => {
                                            // Map "configuration" key to "Set" for display
                                            const displayKey = key.toLowerCase() === 'configuration' ? 'Set' : key
                                            return (
                                              <tr key={key}>
                                                <td className="text-[9px] font-semibold text-[#6B4423] capitalize whitespace-nowrap pr-3 py-0.5 align-top w-[60px]">{displayKey}:</td>
                                                <td className="text-[9px] text-[#654321] font-medium py-0.5 break-words">{value}</td>
                                              </tr>
                                            )
                                          })}
                                        </tbody>
                                      </table>
                                    ) : (
                                      <p className="text-[9px] text-[#92400E] italic">No alternative options yet. Click edit to add.</p>
                                    )}
                                  </div>

                                  {/* Alternative Notes — from Choose Your Preferred Options */}
                                  {item.preferenceOptions?.alternative?.notes && (
                                    <div className="bg-white/60 rounded-lg p-2.5 border border-[#D97706]/20 mt-2">
                                      <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <span className="w-1 h-1 bg-[#D97706] rounded-full"></span>Notes
                                      </p>
                                      <p className="text-[10px] text-[#654321] font-medium whitespace-pre-wrap break-words">
                                        {item.preferenceOptions.alternative.notes}
                                      </p>
                                    </div>
                                  )}
                                </>
                              )}
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
                                      {okToBuyEntries.map(([key, value]) => {
                                        // Map "configuration" key to "Set" for display
                                        const displayKey = key.toLowerCase() === 'configuration' ? 'Set' : key
                                        return (
                                          <tr key={key}>
                                            <td className="text-[9px] font-semibold text-[#6B4423] capitalize whitespace-nowrap pr-3 py-0.5 align-top w-[60px]">{displayKey}:</td>
                                            <td className="text-[9px] text-[#654321] font-medium py-0.5 break-words">{value}</td>
                                          </tr>
                                        )
                                      })}
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
                <p className="text-sm text-[#DAA520] mt-1 font-semibold">All Specifications</p>
              </div>
            </div>

            {/* Specifications List - Show ALL specs */}
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
                    // Exclude variant options (shown in Selected Options)
                    if (['color', 'size', 'style', 'configuration', 'set'].includes(lowerKey)) return false
                    const garbageKeys = ['asin', 'item model number', 'date first available', 'department', 'manufacturer']
                    if (garbageKeys.some(g => lowerKey.includes(g))) return false
                    return true
                  })
                  
                  if (validSpecs.length === 0) {
                    return (
                      <div className="text-center py-8 text-[#8B5A3C]">
                        No specifications available.
                      </div>
                    )
                  }
                  
                  return validSpecs.map(([key, value]) => (
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
