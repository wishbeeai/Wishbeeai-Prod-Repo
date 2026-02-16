"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Search, Filter, Star, TrendingUp, SlidersHorizontal, Grid3x3, List, X, Heart, Trash2, Loader2, ExternalLink, Info } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AddToWishlistModal } from "@/components/add-to-wishlist-modal"
import { useAuth } from "@/lib/auth-context"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

const ADMIN_EMAIL = "wishbeeai@gmail.com"

interface Gift {
  id: string
  collectionTitle: string
  recipientName?: string
  occasion?: string
  giftName: string
  description?: string
  targetAmount: number
  currentAmount: number
  contributors: number
  deadline: string
  bannerImage?: string | null
  createdDate: string
  status: string
  image?: string
  category?: string
  rating?: number
  reviewCount?: number
  productLink?: string
  source?: string
  originalPrice?: number
  amazonChoice?: boolean
  bestSeller?: boolean
  overallPick?: boolean
  attributes?: Record<string, any>
}

type SortOption = "popularity" | "rating" | "price-low" | "price-high" | "name" | "newest"
type ViewMode = "grid" | "list"

export default function TrendingGiftsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [gifts, setGifts] = useState<Gift[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedSource, setSelectedSource] = useState("all")
  const [selectedRating, setSelectedRating] = useState("all")
  const [selectedBadge, setSelectedBadge] = useState("all")
  const [priceRange, setPriceRange] = useState({ min: "", max: "" })
  const [sortBy, setSortBy] = useState<SortOption>("popularity")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedGiftForWishlist, setSelectedGiftForWishlist] = useState<Gift | null>(null)
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false)
  const [removingGiftId, setRemovingGiftId] = useState<string | null>(null)
  const [selectedGiftForAttributes, setSelectedGiftForAttributes] = useState<Gift | null>(null)
  const [isAttributesModalOpen, setIsAttributesModalOpen] = useState(false)
  const [expandedSpecs, setExpandedSpecs] = useState<Record<string, boolean>>({})
  
  // Check if current user is admin
  const isAdmin = user?.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase()

  // Get filtered attributes for a gift (excluding variant-related keys)
  const getFilteredAttributes = (gift: Gift) => {
    if (!gift.attributes) return []
    const excludedKeys = ['color', 'size', 'style', 'brand', 'sizeOptions', 'colorVariants', 'combinedVariants', 'styleOptions', 'styleName', 'patternName']
    return Object.entries(gift.attributes).filter(([key, value]) => 
      !excludedKeys.includes(key) && value !== null && value !== undefined && value !== ''
    )
  }

  // Get unique warm color for each category
  const getCategoryColor = (category: string): { bg: string; text: string; border: string } => {
    const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
      'Electronics': { bg: 'from-rose-100 to-pink-100', text: 'text-rose-700', border: 'border-rose-200' },
      'Home & Kitchen': { bg: 'from-amber-100 to-yellow-100', text: 'text-amber-700', border: 'border-amber-200' },
      'Clothing': { bg: 'from-violet-100 to-purple-100', text: 'text-violet-700', border: 'border-violet-200' },
      'Beauty': { bg: 'from-pink-100 to-rose-100', text: 'text-pink-700', border: 'border-pink-200' },
      'Sports': { bg: 'from-emerald-100 to-teal-100', text: 'text-emerald-700', border: 'border-emerald-200' },
      'Toys': { bg: 'from-orange-100 to-amber-100', text: 'text-orange-700', border: 'border-orange-200' },
      'Books': { bg: 'from-indigo-100 to-blue-100', text: 'text-indigo-700', border: 'border-indigo-200' },
      'Food': { bg: 'from-lime-100 to-green-100', text: 'text-lime-700', border: 'border-lime-200' },
      'Jewelry': { bg: 'from-fuchsia-100 to-pink-100', text: 'text-fuchsia-700', border: 'border-fuchsia-200' },
      'Pet Supplies': { bg: 'from-cyan-100 to-sky-100', text: 'text-cyan-700', border: 'border-cyan-200' },
      'Garden': { bg: 'from-green-100 to-emerald-100', text: 'text-green-700', border: 'border-green-200' },
      'Automotive': { bg: 'from-slate-100 to-gray-100', text: 'text-slate-700', border: 'border-slate-200' },
      'Health': { bg: 'from-teal-100 to-cyan-100', text: 'text-teal-700', border: 'border-teal-200' },
      'Baby': { bg: 'from-sky-100 to-blue-100', text: 'text-sky-700', border: 'border-sky-200' },
      'Office': { bg: 'from-stone-100 to-neutral-100', text: 'text-stone-700', border: 'border-stone-200' },
    }
    
    // Check for exact match first
    if (categoryColors[category]) {
      return categoryColors[category]
    }
    
    // Check for partial matches
    const lowerCategory = category.toLowerCase()
    for (const [key, value] of Object.entries(categoryColors)) {
      if (lowerCategory.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerCategory)) {
        return value
      }
    }
    
    // Generate a consistent color based on the category name hash
    const hash = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const colorOptions = [
      { bg: 'from-coral-100 to-red-100', text: 'text-red-700', border: 'border-red-200' },
      { bg: 'from-amber-100 to-orange-100', text: 'text-amber-700', border: 'border-amber-200' },
      { bg: 'from-yellow-100 to-lime-100', text: 'text-yellow-700', border: 'border-yellow-200' },
      { bg: 'from-rose-100 to-pink-100', text: 'text-rose-700', border: 'border-rose-200' },
      { bg: 'from-orange-100 to-red-100', text: 'text-orange-700', border: 'border-orange-200' },
      { bg: 'from-fuchsia-100 to-purple-100', text: 'text-fuchsia-700', border: 'border-fuchsia-200' },
    ]
    
    return colorOptions[hash % colorOptions.length]
  }

  // Add affiliate tag to Amazon URLs
  const addAffiliateTag = (url: string): string => {
    if (!url) return url
    try {
      const urlObj = new URL(url)
      // Check if it's an Amazon URL
      if (urlObj.hostname.includes('amazon.')) {
        // Remove existing tag if present and add our affiliate tag
        urlObj.searchParams.delete('tag')
        urlObj.searchParams.set('tag', 'wishbeeai-20')
        return urlObj.toString()
      }
      return url
    } catch {
      return url
    }
  }

  // Handle remove gift from trending
  const handleRemoveGift = async (e: React.MouseEvent, gift: Gift) => {
    e.stopPropagation() // Prevent card click navigation
    
    if (removingGiftId) return // Prevent double clicks
    
    setRemovingGiftId(gift.id)
    try {
      const response = await fetch(`/api/trending-gifts?id=${gift.id}`, {
        method: "DELETE",
      })
      
      if (response.ok) {
        // Remove from local state
        setGifts(prev => prev.filter(g => g.id !== gift.id))
        toast.success("Product Removed", {
          description: `"${gift.giftName.length > 40 ? gift.giftName.substring(0, 40) + '...' : gift.giftName}" has been removed from trending gifts.`,
          duration: 4000,
        })
      } else {
        const error = await response.json().catch(() => ({ error: "Failed to remove" }))
        toast.error("Failed to remove product", {
          description: error.error || "Something went wrong. Please try again.",
          duration: 4000,
        })
      }
    } catch (error) {
      console.error("Error removing gift:", error)
      toast.error("Failed to remove product", {
        description: "Unable to connect to the server. Please try again.",
        duration: 4000,
      })
    } finally {
      setRemovingGiftId(null)
    }
  }

  // Check if product has variant options (multiple OR single values)
  // Show modal if product has variant attributes (color, size, capacity, style, configuration)
  // This allows users to specify preferences even for products with single variant values
  const hasVariantOptions = (gift: Gift): boolean => {
    // Check 1: Amazon URL with variant indicator (th=1 means variant selection page)
    // This is the most reliable indicator that a product has selectable variants
    if (gift.productLink?.includes('amazon.') && gift.productLink?.includes('th=1')) {
      console.log('[hasVariantOptions] Amazon product with th=1 (variant page) - showing modal')
      return true
    }
    
    // Check 2: Product name patterns that typically have variants
    const productName = gift.giftName?.toLowerCase() || ''
    const variantProductPatterns = [
      'apple watch',
      'airpods',
      'iphone',
      'ipad',
      'macbook',
      'galaxy watch',
      'galaxy buds',
      'echo dot',
      'kindle',
      'fire tv',
    ]
    if (gift.productLink?.includes('amazon.') && variantProductPatterns.some(p => productName.includes(p))) {
      console.log('[hasVariantOptions] Known variant product pattern - showing modal')
      return true
    }
    
    // Check 3: Stored variant arrays (multiple options)
    if (gift.attributes) {
      // Check for colorVariants array with MULTIPLE options
      const colorVariants = gift.attributes?.colorVariants
      if (Array.isArray(colorVariants) && colorVariants.length > 1) {
        console.log('[hasVariantOptions] Multiple color variants found - showing modal')
        return true
      }
      
      // Check for sizeOptions array with MULTIPLE options
      const sizeOptions = gift.attributes?.sizeOptions
      if (Array.isArray(sizeOptions) && sizeOptions.length > 1) {
        console.log('[hasVariantOptions] Multiple size options found - showing modal')
        return true
      }
      
      // Check for styleOptions array with MULTIPLE options
      const styleOptions = gift.attributes?.styleOptions
      if (Array.isArray(styleOptions) && styleOptions.length > 1) {
        console.log('[hasVariantOptions] Multiple style options found - showing modal')
        return true
      }
      
      // Check for combinedVariants array with MULTIPLE options
      const combinedVariants = gift.attributes?.combinedVariants
      if (Array.isArray(combinedVariants) && combinedVariants.length > 1) {
        console.log('[hasVariantOptions] Multiple combined variants found - showing modal')
        return true
      }
      
      // Check 4: Single variant values (color, size, capacity, style, configuration)
      // These indicate the product has variant options that users should be able to specify
      const hasColor = gift.attributes?.color || gift.color
      const hasSize = gift.attributes?.size || gift.size
      const hasCapacity = gift.attributes?.capacity || gift.capacity
      const hasStyle = gift.attributes?.style || gift.style
      const hasConfiguration = gift.attributes?.configuration || gift.attributes?.set || gift.configuration
      
      if (hasColor || hasSize || hasCapacity || hasStyle || hasConfiguration) {
        console.log('[hasVariantOptions] Product has variant attributes (color, size, capacity, style, or configuration) - showing modal', {
          hasColor: !!hasColor,
          hasSize: !!hasSize,
          hasCapacity: !!hasCapacity,
          hasStyle: !!hasStyle,
          hasConfiguration: !!hasConfiguration
        })
        return true
      }
    }
    
    // Also check top-level variant properties (from gift object directly)
    if (gift.color || gift.size || gift.capacity || gift.style || gift.configuration) {
      console.log('[hasVariantOptions] Product has top-level variant properties - showing modal')
      return true
    }
    
    // No variant indicators found - add directly without modal
    console.log('[hasVariantOptions] No variant indicators - adding directly')
    return false
  }

  // Add product directly to wishlist (for products without variant options)
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false)
  
  const handleAddToWishlistDirect = async (gift: Gift) => {
    if (isAddingToWishlist) return
    
    setIsAddingToWishlist(true)
    try {
      // Get or create a default wishlist
      let wishlistId: string | null = null

      const wishlistsResponse = await fetch("/api/wishlists")
      if (wishlistsResponse.ok) {
        const { wishlists } = await wishlistsResponse.json()
        if (wishlists && wishlists.length > 0) {
          wishlistId = wishlists[0].id
        } else {
          const createResponse = await fetch("/api/wishlists", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "My Wishlist",
              description: "Default wishlist",
              isPublic: false,
            }),
          })
          if (createResponse.ok) {
            const { wishlist } = await createResponse.json()
            wishlistId = wishlist.id
          }
        }
      }

      if (!wishlistId) {
        throw new Error("Failed to get or create wishlist")
      }

      // Prepare wishlist item data (no preferences needed for products without variants)
      const wishlistItemData = {
        wishlistId,
        productName: gift.giftName,
        productUrl: gift.productLink,
        productPrice: gift.targetAmount,
        productImage: gift.image,
        title: gift.giftName,
        product_url: gift.productLink,
        image_url: gift.image,
        list_price: Math.round(gift.targetAmount * 100),
        currency: "USD",
        source: gift.source?.toLowerCase() || "amazon",
        category: gift.category || null,
        quantity: 1,
        // No variant preferences needed
        preferenceOptions: JSON.stringify({
          iLike: null,
          alternative: null,
          okToBuy: null,
        }),
        variantPreference: "Ideal",
      }

      const response = await fetch("/api/wishlists/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wishlistItemData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle duplicate product case (409 Conflict)
        if (response.status === 409) {
          toast("🐝 Already in Wishlist", {
            description: "This product is already in your wishlist",
            action: {
              label: "View Wishlist",
              onClick: () => router.push('/wishlist'),
            },
            style: {
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 50%, #FCD34D 100%)',
              border: '2px solid #F59E0B',
              color: '#92400E',
            },
            actionButtonStyle: {
              backgroundColor: '#D97706',
              color: 'white',
            },
            duration: 4000,
          })
          return
        }
        
        throw new Error(errorData.error || "Failed to add to wishlist")
      }

      toast.success("Added to My Wishlist! 🐝", {
        description: `${gift.giftName.length > 50 ? gift.giftName.substring(0, 50) + '...' : gift.giftName}`,
        action: {
          label: "View Wishlist",
          onClick: () => router.push('/wishlist'),
        },
        actionButtonStyle: {
          backgroundColor: 'black',
          color: 'white',
        },
        duration: 5000,
      })
    } catch (error) {
      console.error("[TrendingGifts] Add to wishlist error:", error)
      toast.error("Failed to add to wishlist", {
        description: error instanceof Error ? error.message : "Something went wrong",
        duration: 4000,
      })
    } finally {
      setIsAddingToWishlist(false)
    }
  }

  // Handle "Add to Wishlist" button click - checks for variants
  const handleAddToWishlistClick = (e: React.MouseEvent, gift: Gift) => {
    e.stopPropagation()
    
    if (hasVariantOptions(gift)) {
      // Product has variant options - open modal
      setSelectedGiftForWishlist(gift)
      setIsWishlistModalOpen(true)
    } else {
      // No variant options - add directly to wishlist
      handleAddToWishlistDirect(gift)
    }
  }

  // Fetch gifts from API
  useEffect(() => {
    async function fetchGifts() {
      try {
        console.log("[v0] Fetching trending gifts from API...")
        const response = await fetch("/api/gifts")
        const data = await response.json()

        console.log("[v0] API response:", data)
        
        // Debug: Log attributes for each gift
        if (data.gifts) {
          data.gifts.forEach((gift: any, index: number) => {
            console.log(`[v0] Gift ${index} - ${gift.giftName}:`, {
              hasAttributes: !!gift.attributes,
              attributes: gift.attributes,
              attributeKeys: gift.attributes ? Object.keys(gift.attributes) : []
            })
          })
        }

        if (data.success && data.gifts) {
          setGifts(data.gifts)
        } else {
          setGifts([])
        }
      } catch (error) {
        console.error("[v0] Error fetching gifts:", error)
        toast.error("Failed to load trending gifts")
      } finally {
        setLoading(false)
      }
    }

    fetchGifts()
  }, [])

  // Extract unique values for filters
  const categories = useMemo(() => {
    return ["all", ...Array.from(new Set(gifts.map((g) => g.category).filter(Boolean)))]
  }, [gifts])

  const sources = useMemo(() => {
    return ["all", ...Array.from(new Set(gifts.map((g) => g.source).filter(Boolean)))]
  }, [gifts])

  // Filter and sort gifts
  const filteredAndSortedGifts = useMemo(() => {
    let filtered = gifts.filter((gift) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        gift.giftName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gift.collectionTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gift.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gift.category?.toLowerCase().includes(searchQuery.toLowerCase())

      // Category filter
      const matchesCategory = selectedCategory === "all" || gift.category === selectedCategory

      // Source filter
      const matchesSource = selectedSource === "all" || gift.source === selectedSource

      // Rating filter
      const matchesRating =
        selectedRating === "all" ||
        (gift.rating !== undefined &&
          ((selectedRating === "4+" && gift.rating >= 4) ||
            (selectedRating === "3+" && gift.rating >= 3) ||
            (selectedRating === "2+" && gift.rating >= 2) ||
            (selectedRating === "1+" && gift.rating >= 1)))

      // Badge filter
      const matchesBadge =
        selectedBadge === "all" ||
        (selectedBadge === "amazon-choice" && gift.amazonChoice) ||
        (selectedBadge === "best-seller" && gift.bestSeller) ||
        (selectedBadge === "overall-pick" && gift.overallPick) ||
        (selectedBadge === "on-sale" && gift.originalPrice && gift.originalPrice > gift.targetAmount)

      // Price range filter
      const matchesPriceRange =
        (!priceRange.min || gift.targetAmount >= parseFloat(priceRange.min)) &&
        (!priceRange.max || gift.targetAmount <= parseFloat(priceRange.max))

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSource &&
        matchesRating &&
        matchesBadge &&
        matchesPriceRange
      )
    })

    // Sort filtered results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.rating || 0) - (a.rating || 0)
        case "price-low":
          return a.targetAmount - b.targetAmount
        case "price-high":
          return b.targetAmount - a.targetAmount
        case "name":
          return a.giftName.localeCompare(b.giftName)
        case "newest":
          return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
        case "popularity":
        default:
          return (b.reviewCount || 0) - (a.reviewCount || 0)
      }
    })

    return filtered
  }, [gifts, searchQuery, selectedCategory, selectedSource, selectedRating, selectedBadge, priceRange, sortBy])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (selectedCategory !== "all") count++
    if (selectedSource !== "all") count++
    if (selectedRating !== "all") count++
    if (selectedBadge !== "all") count++
    if (priceRange.min || priceRange.max) count++
    return count
  }, [selectedCategory, selectedSource, selectedRating, selectedBadge, priceRange])

  const clearAllFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSelectedSource("all")
    setSelectedRating("all")
    setSelectedBadge("all")
    setPriceRange({ min: "", max: "" })
    setSortBy("popularity")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#DAA520] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#654321] font-semibold">Loading trending gifts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 relative">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNEQUE1MjAiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE2YzAtOC44MzctNy4xNjMtMTYtMTYtMTZTNCAxNS4xNjMgNCAxNnM3LjE2MyAxNiAxNiAxNiAxNi03LjE2MyAxNi0xNnptMC0xNmMwLTguODM3LTcuMTYzLTE2LTE2LTE2UzQtOC44MzcgNC0xNnM3LjE2My0xNiAxNi0xNiAxNiA3LjE2MyAxNiAxNnptMCA0OGMwLTguODM3LTcuMTYzLTE2LTE2LTE2cy0xNiA3LjE2My0xNiAxNiA3LjE2MyAxNiAxNiAxNiAxNi03LjE2MyAxNi0xNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header Card */}
        <div className="mb-8">
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <div className="flex flex-row items-center justify-center gap-2">
              <TrendingUp className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#DAA520] flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-foreground whitespace-nowrap">
                Trending Gifts
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2">
              Discover the most popular and trending gifts from top retailers
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border-2 border-[#DAA520]/20">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#DAA520] to-[#F4C430] flex items-center justify-center">
                <TrendingUp className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-[#8B4513]/70">Trending Gifts</p>
                <p className="text-base sm:text-2xl font-bold text-[#654321]">{filteredAndSortedGifts.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-orange-500/20">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-300 via-coral-400 to-rose-300 flex items-center justify-center">
                <Filter className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-[#8B4513]/70">Categories</p>
                <p className="text-base sm:text-2xl font-bold text-[#654321]">{categories.length - 1}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 flex items-center justify-center">
                <Star className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-[#8B4513]/70">Avg Rating</p>
                <p className="text-base sm:text-2xl font-bold text-[#654321]">
                  {filteredAndSortedGifts.length > 0
                    ? (
                        filteredAndSortedGifts.reduce((sum, g) => sum + (g.rating || 0), 0) /
                        filteredAndSortedGifts.length
                      ).toFixed(1)
                    : "0.0"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Main Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#DAA520] w-5 h-5" />
            <input
              type="text"
              placeholder="Search trending gifts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-[#DAA520]/20 focus:border-[#DAA520] focus:outline-none bg-white text-[#654321]"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-12 px-4 rounded-lg border-2 transition-all ${
                showFilters || activeFiltersCount > 0
                  ? "bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] border-[#DAA520]"
                  : "bg-white text-[#654321] border-[#DAA520]/20 hover:border-[#DAA520]"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-2 bg-[#654321] text-white rounded-full px-2 py-0.5 text-xs font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </Button>

            <div className="flex gap-2 border-2 border-[#DAA520]/20 rounded-lg bg-white p-1">
              <Button
                onClick={() => setViewMode("grid")}
                variant="ghost"
                size="sm"
                className={`h-10 px-3 ${viewMode === "grid" ? "bg-[#DAA520] text-white" : ""}`}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setViewMode("list")}
                variant="ghost"
                size="sm"
                className={`h-10 px-3 ${viewMode === "list" ? "bg-[#DAA520] text-white" : ""}`}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-12 px-4 pr-8 rounded-lg border-2 border-[#DAA520]/20 focus:border-[#DAA520] focus:outline-none bg-white appearance-none cursor-pointer text-[#654321] text-sm font-semibold"
              >
                <option value="popularity">Sort: Popularity</option>
                <option value="rating">Sort: Rating</option>
                <option value="price-low">Sort: Price Low to High</option>
                <option value="price-high">Sort: Price High to Low</option>
                <option value="name">Sort: Name A-Z</option>
                <option value="newest">Sort: Newest</option>
              </select>
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="mb-6 bg-white rounded-xl p-6 border-2 border-[#DAA520]/20 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#654321]">Filter Options</h3>
              <div className="flex gap-2">
                {activeFiltersCount > 0 && (
                  <Button
                    onClick={clearAllFilters}
                    variant="outline"
                    size="sm"
                    className="text-xs border-[#DAA520] text-[#654321] hover:bg-[#DAA520] hover:text-white"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear All
                  </Button>
                )}
                <Button
                  onClick={() => setShowFilters(false)}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-semibold text-[#654321] mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-[#DAA520]/20 focus:border-[#DAA520] focus:outline-none bg-white text-[#654321] text-sm"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Filter */}
              <div>
                <label className="block text-sm font-semibold text-[#654321] mb-2">Store</label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-[#DAA520]/20 focus:border-[#DAA520] focus:outline-none bg-white text-[#654321] text-sm"
                >
                  {sources.map((source) => (
                    <option key={source} value={source}>
                      {source === "all" ? "All Stores" : source}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-semibold text-[#654321] mb-2">Minimum Rating</label>
                <select
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-[#DAA520]/20 focus:border-[#DAA520] focus:outline-none bg-white text-[#654321] text-sm"
                >
                  <option value="all">All Ratings</option>
                  <option value="4+">4+ Stars</option>
                  <option value="3+">3+ Stars</option>
                  <option value="2+">2+ Stars</option>
                  <option value="1+">1+ Stars</option>
                </select>
              </div>

              {/* Badge Filter */}
              <div>
                <label className="block text-sm font-semibold text-[#654321] mb-2">Special Badges</label>
                <select
                  value={selectedBadge}
                  onChange={(e) => setSelectedBadge(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-[#DAA520]/20 focus:border-[#DAA520] focus:outline-none bg-white text-[#654321] text-sm"
                >
                  <option value="all">All Products</option>
                  <option value="amazon-choice">Amazon's Choice</option>
                  <option value="best-seller">Best Seller</option>
                  <option value="overall-pick">Overall Pick</option>
                  <option value="on-sale">On Sale</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-[#654321] mb-2">Price Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min Price"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-lg border-2 border-[#DAA520]/20 focus:border-[#DAA520] focus:outline-none bg-white text-[#654321] text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max Price"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-lg border-2 border-[#DAA520]/20 focus:border-[#DAA520] focus:outline-none bg-white text-[#654321] text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-[#8B4513] font-semibold">
            {filteredAndSortedGifts.length} {filteredAndSortedGifts.length === 1 ? "gift" : "gifts"} found
          </p>
          {activeFiltersCount > 0 && (
            <Button
              onClick={clearAllFilters}
              variant="outline"
              size="sm"
              className="text-xs border-[#DAA520] text-[#654321] hover:bg-[#DAA520] hover:text-white"
            >
              <X className="w-3 h-3 mr-1" />
              Clear Filters ({activeFiltersCount})
            </Button>
          )}
        </div>

        {/* Gifts Grid/List */}
        {filteredAndSortedGifts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎁</div>
            <h3 className="text-2xl font-bold text-[#654321] mb-2">No gifts found</h3>
            <p className="text-[#8B4513] mb-6">Try adjusting your search or filters</p>
            <Button
              onClick={clearAllFilters}
              className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] hover:from-[#B8860B] hover:to-[#DAA520] text-[#3B2F0F]"
            >
              Clear All Filters
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedGifts.map((gift) => (
              <div
                key={gift.id}
                className="bg-gradient-to-br from-white to-amber-50/30 rounded-2xl shadow-lg border border-[#DAA520]/30 overflow-hidden hover:shadow-2xl hover:border-[#DAA520]/60 transition-all duration-300 group flex flex-col h-full"
              >
                {/* Image Section */}
                <div className="relative overflow-hidden">
                  <img
                    src={gift.image || gift.bannerImage || "/placeholder.svg"}
                    alt={gift.giftName}
                    className="w-full h-52 object-contain bg-white group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {gift.category && (() => {
                    const colors = getCategoryColor(gift.category)
                    return (
                      <div className={`absolute top-3 left-3 bg-gradient-to-r ${colors.bg} backdrop-blur-sm ${colors.text} px-3 py-1 rounded-full text-xs font-bold shadow-md border ${colors.border}`}>
                        {gift.category}
                      </div>
                    )
                  })()}
                  {gift.originalPrice && gift.originalPrice > gift.targetAmount && (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg animate-pulse">
                      SALE
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-4 flex-grow flex flex-col">
                  {/* Title - Fixed 2 lines with ellipsis, tooltip on hover */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h3 className="text-sm font-semibold text-[#654321] mb-1 line-clamp-2 min-h-[2.5rem] group-hover:text-[#8B4513] transition-colors cursor-pointer">{gift.giftName}</h3>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px] bg-[#4A2F1A] text-white text-xs p-2 rounded-lg shadow-lg">
                      <p>{gift.giftName}</p>
                    </TooltipContent>
                  </Tooltip>
                  {gift.source && (
                    <p className="text-xs text-[#8B4513]/60 mb-1.5 flex items-center gap-1">
                      <span className="w-1 h-1 bg-[#DAA520] rounded-full"></span>
                      From {String(gift.source).replace(/\)+$/, '').trim()}
                    </p>
                  )}
                  {/* Rating - Partial star fill */}
                  {gift.rating && gift.rating > 0 && (
                    <div className="flex items-center gap-2 mb-1.5 bg-amber-50/50 rounded-lg px-2 py-1 w-fit">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((starPosition) => {
                          const rating = gift.rating || 0
                          const fillAmount = Math.max(0, Math.min(1, rating - (starPosition - 1)))
                          const fillPercent = Math.round(fillAmount * 100)
                          const gradientId = `star-grid-${gift.id}-${starPosition}`
                          
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
                      <span className="text-sm font-bold text-[#654321]">{gift.rating.toFixed(1)}</span>
                      {gift.reviewCount && gift.reviewCount > 0 && (
                        <span className="text-xs text-gray-500"> {gift.reviewCount.toLocaleString()}</span>
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

                  {/* Badges - Fixed height container for alignment */}
                  <div className="min-h-[28px] mb-1.5">
                    {(gift.amazonChoice || gift.bestSeller || gift.overallPick) && (
                      <div className="flex flex-wrap gap-1">
                        {gift.amazonChoice && (
                          <span className="bg-gradient-to-r from-gray-900 to-black text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                            Amazon's Choice
                          </span>
                        )}
                        {gift.bestSeller && (
                          <span className="text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm" style={{ backgroundColor: '#D14900' }}>
                            #1 Best Seller
                          </span>
                        )}
                        {gift.overallPick && (
                          <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                            ⭐ Overall Pick
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-1">
                    <div className="flex items-baseline gap-1.5">
                      {gift.originalPrice && gift.originalPrice > gift.targetAmount ? (
                        <>
                          <span className="font-bold text-base text-[#654321]">${gift.targetAmount.toFixed(2)}</span>
                          <span className="text-gray-400 line-through text-xs">${gift.originalPrice.toFixed(2)}</span>
                          <span className="bg-red-100 text-red-600 font-semibold text-[10px] px-1.5 py-0.5 rounded-full">
                            -{Math.round(((gift.originalPrice - gift.targetAmount) / gift.originalPrice) * 100)}%
                          </span>
                        </>
                      ) : (
                        <span className="font-bold text-base text-[#654321]">${gift.targetAmount.toFixed(2)}</span>
                      )}
                    </div>
                  </div>

                {/* Spacer to push content to bottom */}
                <div className="flex-grow"></div>

                {/* Product Specifications */}
                <div className="bg-gradient-to-r from-[#6B4423]/5 to-[#8B5A3C]/5 rounded-lg p-3 border border-[#8B5A3C]/10 mt-auto min-h-[175px] flex flex-col">
                  <p className="text-[10px] font-bold text-[#6B4423] uppercase tracking-wider mb-2 flex items-center gap-1 flex-shrink-0">
                    <span className="w-1.5 h-1.5 bg-[#DAA520] rounded-full"></span>
                    Specifications
                  </p>
                  <div className="flex-1 flex flex-col justify-start overflow-hidden">
                    {gift.attributes && Object.keys(gift.attributes).filter(key => 
                      !['color', 'size', 'style', 'brand', 'sizeOptions', 'colorVariants', 'combinedVariants', 'styleOptions', 'styleName', 'patternName'].includes(key) &&
                      gift.attributes![key] !== null && 
                      gift.attributes![key] !== undefined && 
                      gift.attributes![key] !== ''
                    ).length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {Object.entries(gift.attributes)
                          .filter(([key, value]) => 
                            !['color', 'size', 'style', 'brand', 'sizeOptions', 'colorVariants', 'combinedVariants', 'styleOptions', 'styleName', 'patternName'].includes(key) &&
                            value !== null && value !== undefined && value !== ''
                          )
                          .slice(0, expandedSpecs[gift.id] ? undefined : 5)
                          .map(([key, value]) => (
                            <div key={key} className="flex items-center text-[10px] h-[16px]">
                              <span className="font-semibold text-[#6B4423] capitalize w-[85px] flex-shrink-0 truncate">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                              <span className="text-[#654321] truncate flex-1" title={String(value)}>{String(value)}</span>
                            </div>
                          ))
                        }
                        {getFilteredAttributes(gift).length > 5 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedSpecs(prev => ({ ...prev, [gift.id]: !prev[gift.id] }))
                            }}
                            className="text-left text-[8px] font-bold text-[#DAA520] mt-1 hover:text-[#B8860B] hover:underline cursor-pointer transition-colors"
                          >
                            {expandedSpecs[gift.id] ? 'Show less' : `+${getFilteredAttributes(gift).length - 5} more specs`}
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#8B5A3C]/50 italic">No specifications available</p>
                    )}
                  </div>
                </div>
                </div>

                {/* Action Buttons */}
                <div className="px-4 pb-4 pt-2 flex flex-col gap-1.5 border-t border-[#DAA520]/10">
                  <button
                    type="button"
                    className="w-full px-4 py-2 bg-gradient-to-r from-[#EA580C] to-[#FB923C] hover:from-[#FB923C] hover:to-[#EA580C] text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (gift.productLink) {
                        window.open(addAffiliateTag(gift.productLink), '_blank')
                      } else {
                        router.push(`/gifts/${gift.id}`)
                      }
                    }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buy now on {gift.source || 'Store'}</span>
                  </button>
                  <button
                    type="button"
                    className="w-full px-4 py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] hover:from-[#F4C430] hover:to-[#DAA520] text-[#8B4513] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md disabled:opacity-50"
                    onClick={(e) => handleAddToWishlistClick(e, gift)}
                    disabled={isAddingToWishlist}
                  >
                    {isAddingToWishlist ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Heart className="w-3.5 h-3.5" />
                    )}
                    <span>Add to My Wishlist</span>
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-red-600 hover:bg-red-50 bg-transparent border border-red-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={(e) => handleRemoveGift(e, gift)}
                      disabled={removingGiftId === gift.id}
                      title="Remove"
                    >
                      {removingGiftId === gift.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedGifts.map((gift) => (
              <div
                key={gift.id}
                className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 p-6 hover:shadow-xl transition-all group"
              >
                <div className="flex gap-6">
                  <div className="relative flex-shrink-0">
                    <img
                      src={gift.image || gift.bannerImage || "/placeholder.svg"}
                      alt={gift.giftName}
                      className="w-32 h-32 object-contain bg-white rounded-lg border-2 border-[#DAA520] group-hover:scale-105 transition-transform duration-300"
                    />
                    {gift.originalPrice && gift.originalPrice > gift.targetAmount && (
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                        SALE
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        {/* Title - Fixed 2 lines with ellipsis, tooltip on hover */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <h3 className="text-lg font-bold text-[#654321] mb-1 line-clamp-2 min-h-[3.5rem] cursor-pointer">{gift.giftName}</h3>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[400px] bg-[#4A2F1A] text-white text-sm p-3 rounded-lg shadow-lg">
                            <p>{gift.giftName}</p>
                          </TooltipContent>
                        </Tooltip>
                        {gift.source && <p className="text-sm text-[#8B4513]/70 mb-2">From {String(gift.source).replace(/\)+$/, '').trim()}</p>}
                        {/* Product Specifications - List View */}
                        <div className="mb-2 min-h-[140px] bg-gradient-to-r from-[#6B4423]/5 to-[#8B5A3C]/5 rounded-lg p-2 border border-[#8B5A3C]/10">
                          <p className="text-xs font-semibold text-[#6B4423] uppercase tracking-wide mb-1">Specifications</p>
                          {gift.attributes && Object.keys(gift.attributes).filter(key => 
                            !['color', 'size', 'style', 'brand', 'sizeOptions', 'colorVariants', 'combinedVariants', 'styleOptions', 'styleName', 'patternName'].includes(key) &&
                            gift.attributes![key] !== null && gift.attributes![key] !== undefined && gift.attributes![key] !== ''
                          ).length > 0 ? (
                            <div className="flex flex-col gap-0.5">
                              {Object.entries(gift.attributes)
                                .filter(([key, value]) => 
                                  !['color', 'size', 'style', 'brand', 'sizeOptions', 'colorVariants', 'combinedVariants', 'styleOptions', 'styleName', 'patternName'].includes(key) &&
                                  value !== null && value !== undefined && value !== ''
                                )
                                .slice(0, expandedSpecs[gift.id] ? undefined : 5)
                                .map(([key, value]) => (
                                  <div key={key} className="flex items-center text-[11px] h-[16px]">
                                    <span className="font-semibold text-[#6B4423] capitalize w-[120px] flex-shrink-0 truncate">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                    <span className="text-[#654321] truncate" title={String(value)}>{String(value)}</span>
                                  </div>
                                ))
                              }
                              {getFilteredAttributes(gift).length > 5 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setExpandedSpecs(prev => ({ ...prev, [gift.id]: !prev[gift.id] }))
                                  }}
                                  className="text-left text-[8px] font-bold text-[#DAA520] mt-1 hover:text-[#B8860B] hover:underline cursor-pointer transition-colors"
                                >
                                  {expandedSpecs[gift.id] ? 'Show less' : `+${getFilteredAttributes(gift).length - 5} more specs`}
                                </button>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-[#8B5A3C]/50 italic">No specifications available</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      {gift.category && (() => {
                        const colors = getCategoryColor(gift.category)
                        return (
                          <span className={`bg-gradient-to-r ${colors.bg} ${colors.text} px-3 py-1 rounded-full text-xs font-bold border ${colors.border}`}>
                            {gift.category}
                          </span>
                        )
                      })()}
                      {gift.rating && gift.rating > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((starPosition) => {
                              const rating = gift.rating || 0
                              const fillAmount = Math.max(0, Math.min(1, rating - (starPosition - 1)))
                              const fillPercent = Math.round(fillAmount * 100)
                              const gradientId = `star-list-${gift.id}-${starPosition}`
                              
                              return (
                                <svg
                                  key={starPosition}
                                  className="w-4 h-4"
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
                          <span className="text-sm font-bold text-[#654321]">{gift.rating.toFixed(1)}</span>
                          {gift.reviewCount && gift.reviewCount > 0 && (
                            <span className="text-sm text-gray-500"> {gift.reviewCount.toLocaleString()} reviews</span>
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
                      {(gift.amazonChoice || gift.bestSeller || gift.overallPick) && (
                        <div className="flex gap-1.5">
                          {gift.amazonChoice && (
                            <span className="bg-gradient-to-r from-gray-900 to-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Amazon's Choice
                            </span>
                          )}
                          {gift.bestSeller && (
                            <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#D14900' }}>
                              #1 Best Seller
                            </span>
                          )}
                          {gift.overallPick && (
                            <span className="!bg-[#161D26] !text-white text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#161D26', color: '#FFFFFF' }}>
                              Overall Pick
                            </span>
                          )}
                        </div>
                      )}
                      {/* Price - below badges */}
                      <div className="flex items-center gap-2">
                        {gift.originalPrice && gift.originalPrice > gift.targetAmount ? (
                          <>
                            <span className="font-bold text-xl text-[#654321]">${gift.targetAmount.toFixed(2)}</span>
                            <span className="text-gray-400 line-through text-sm">${gift.originalPrice.toFixed(2)}</span>
                            <span className="text-red-600 font-semibold text-xs">
                              Save ${(gift.originalPrice - gift.targetAmount).toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-xl text-[#654321]">${gift.targetAmount.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 min-w-[180px]">
                    <Button
                      className="w-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-lg font-semibold hover:shadow-lg transition-all"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (gift.productLink) {
                          window.open(addAffiliateTag(gift.productLink), '_blank')
                        } else {
                          router.push(`/gifts/${gift.id}`)
                        }
                      }}
                    >
                      Buy now on {gift.source || 'Store'}
                    </Button>
                    <button
                      type="button"
                      className="w-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-1.5 px-4 py-2 border-0 hover:opacity-90 disabled:opacity-50"
                      onClick={(e) => handleAddToWishlistClick(e, gift)}
                      disabled={isAddingToWishlist}
                    >
                      {isAddingToWishlist ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Heart className="w-4 h-4" />
                      )}
                      <span>Add to My Wishlist</span>
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        className="w-full px-4 py-2 text-red-600 hover:bg-red-50 bg-transparent border border-red-200 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={(e) => handleRemoveGift(e, gift)}
                        disabled={removingGiftId === gift.id}
                        title="Remove"
                      >
                        {removingGiftId === gift.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add to Wishlist Modal */}
        <AddToWishlistModal
          gift={selectedGiftForWishlist}
          isOpen={isWishlistModalOpen}
          onClose={() => {
            setIsWishlistModalOpen(false)
            setSelectedGiftForWishlist(null)
          }}
        />

        {/* Product Attributes Modal */}
        {isAttributesModalOpen && selectedGiftForAttributes && (
          <div 
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setIsAttributesModalOpen(false)
              setSelectedGiftForAttributes(null)
            }}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - Same style as Home Page header */}
              <div className="bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] p-4 border-b-2 border-[#4A2F1A] relative">
                <button
                  onClick={() => {
                    setIsAttributesModalOpen(false)
                    setSelectedGiftForAttributes(null)
                  }}
                  className="absolute right-3 top-3 p-1 hover:bg-[#4A2F1A] rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-[#F5DEB3]" />
                </button>
                <div className="text-center px-8">
                  <h3 className="text-lg font-bold text-[#F5DEB3] line-clamp-2">
                    {selectedGiftForAttributes.giftName}
                  </h3>
                  <p className="text-sm text-[#DAA520] mt-1 font-semibold">Additional Specifications</p>
                </div>
              </div>

              {/* Attributes List - Only show specs not displayed in card (after first 5) */}
              <div className="p-4 overflow-y-auto max-h-[60vh] bg-gradient-to-b from-[#F5F1E8] to-white">
                <div className="grid grid-cols-1 gap-3">
                  {getFilteredAttributes(selectedGiftForAttributes).slice(5).map(([key, value]) => (
                    <div 
                      key={key} 
                      className="bg-gradient-to-r from-[#6B4423]/10 via-[#8B5A3C]/10 to-[#6B4423]/10 rounded-lg p-3 border border-[#8B5A3C]/20"
                    >
                      <div className="text-xs font-semibold text-[#6B4423] uppercase tracking-wide mb-1">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="text-sm text-[#4A2F1A] font-medium">
                        {String(value)}
                      </div>
                    </div>
                  ))}
                </div>

                {getFilteredAttributes(selectedGiftForAttributes).slice(5).length === 0 && (
                  <div className="text-center py-8 text-[#8B5A3C]">
                    No additional specifications available.
                  </div>
                )}
              </div>

              {/* Footer - 512 x 50 */}
              <div className="w-[512px] h-[50px] bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] border-t-2 border-[#4A2F1A]">
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
