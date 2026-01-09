"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Search, Filter, Star, TrendingUp, SlidersHorizontal, Grid3x3, List, X, ExternalLink, Heart, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { WishlistOptionsModal } from "@/components/wishlist-options-modal"

interface ProductAttributes {
  brand?: string
  capacity?: string
  material?: string
  finishType?: string
  productDimensions?: string
  wattage?: string
  itemWeight?: string
  controlMethod?: string
  operationMode?: string
  specialFeature?: string
  color?: string
  size?: string
  sizeOptions?: Array<{size: string, price?: string}>
  customFields?: Array<{name: string, value: string}>
  // Color Variants (for watches, electronics)
  colorVariants?: Array<{color: string}>
  // Style and Configuration Options
  styleOptions?: string[]
  configurationOptions?: string[]
  // Style/Pattern attributes
  styleName?: string
  patternName?: string
  model?: string
  // Electronics-specific attributes
  operatingSystem?: string
  storageCapacity?: string
  ram?: string
  connectivityTechnology?: string
  wirelessStandard?: string
  batteryType?: string
  gpsType?: string
  shape?: string
  screenSize?: string
  resolution?: string
  processor?: string
  compatibleDevices?: string
  waterResistance?: string
  style?: string
  configuration?: string
  // Audio/Headphone-specific attributes
  earPlacement?: string
  formFactor?: string
  noiseControl?: string
  modelName?: string
  wirelessTechnology?: string
  controlType?: string
  bluetoothVersion?: string
  earpieceShape?: string
  includedComponents?: string
  specificUses?: string
  recommendedUses?: string
  // Custom badges
  customBadges?: Array<{name: string, enabled: boolean}>
}

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
  attributes?: ProductAttributes
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
  
  // Wishlist modal state
  const [wishlistModalOpen, setWishlistModalOpen] = useState(false)
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null)
  const [addingToWishlist, setAddingToWishlist] = useState(false)
  const [deletingGiftId, setDeletingGiftId] = useState<string | null>(null)

  // Admin check
  const isAdmin = user?.email === 'wishbeeai@gmail.com'

  // Handle delete product (admin only)
  const handleDeleteProduct = async (giftId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!isAdmin) {
      toast.error('Only admins can delete products')
      return
    }

    // Find the product name for the toast message
    const giftToDelete = gifts.find(g => g.id === giftId)
    const productName = giftToDelete?.giftName 
      ? (giftToDelete.giftName.length > 40 
          ? giftToDelete.giftName.substring(0, 40) + '...' 
          : giftToDelete.giftName)
      : 'Product'

    if (!confirm(`Are you sure you want to remove "${productName}" from trending gifts?`)) {
      return
    }

    setDeletingGiftId(giftId)
    
    try {
      const response = await fetch(`/api/trending-gifts/${giftId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete product')
      }
      
      // Remove from local state
      setGifts(prev => prev.filter(g => g.id !== giftId))
      
      // Show success toast
      toast.success(`"${productName}" removed from trending gifts`)
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error(`Failed to remove "${productName}"`)
    } finally {
      setDeletingGiftId(null)
    }
  }

  const handleAddToWishlist = (gift: Gift) => {
    // Check if user is logged in
    if (!user) {
      toast.error('Please sign in to add items to your wishlist')
      return
    }
    
    // Open the options modal
    setSelectedGift(gift)
    setWishlistModalOpen(true)
  }

  const handleConfirmAddToWishlist = async (selectedOptions: {
    size?: string
    color?: string
    style?: string
    configuration?: string
    note?: string
    isFlexible: boolean
  }) => {
    if (!selectedGift || !user) return

    setAddingToWishlist(true)
    
    try {
      // Fetch user's wishlists
      const wishlistsResponse = await fetch('/api/wishlists')
      if (!wishlistsResponse.ok) throw new Error('Failed to fetch wishlists')
      const wishlistsData = await wishlistsResponse.json()
      
      let wishlistId: string
      
      if (wishlistsData.wishlists && wishlistsData.wishlists.length > 0) {
        // Use the first/default wishlist
        wishlistId = wishlistsData.wishlists[0].id
      } else {
        // Create a default wishlist if none exists
        const createResponse = await fetch('/api/wishlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'My Wishlist',
            description: '',
            isPublic: false
          })
        })
        
        if (!createResponse.ok) throw new Error('Failed to create wishlist')
        const createData = await createResponse.json()
        wishlistId = createData.wishlist.id
      }
      
      // Build note with selected options
      let fullNote = ''
      const optionParts: string[] = []
      if (selectedOptions.size) optionParts.push(`Size: ${selectedOptions.size}`)
      if (selectedOptions.color) optionParts.push(`Color: ${selectedOptions.color}`)
      if (selectedOptions.style) optionParts.push(`Style: ${selectedOptions.style}`)
      if (selectedOptions.configuration) optionParts.push(`Config: ${selectedOptions.configuration}`)
      if (optionParts.length > 0) fullNote = optionParts.join(' | ')
      if (selectedOptions.note) fullNote = fullNote ? `${fullNote}\n${selectedOptions.note}` : selectedOptions.note
      if (selectedOptions.isFlexible) fullNote = fullNote ? `${fullNote}\n[Flexible with options]` : '[Flexible with options]'
      
      // Add the item to the wishlist
      const addResponse = await fetch('/api/wishlists/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wishlistId,
          title: selectedGift.giftName,
          product_url: selectedGift.productLink,
          image_url: selectedGift.image || selectedGift.bannerImage,
          list_price: Math.round(selectedGift.targetAmount * 100), // Convert to cents
          currency: 'USD',
          review_star: selectedGift.rating,
          review_count: selectedGift.reviewCount,
          affiliate_url: selectedGift.productLink,
          source: selectedGift.source || 'trending',
          notes: fullNote || undefined
        })
      })
      
      if (!addResponse.ok) {
        const errorData = await addResponse.json()
        throw new Error(errorData.error || 'Failed to add to wishlist')
      }
      
      toast.success(`Added "${selectedGift.giftName.length > 30 ? selectedGift.giftName.substring(0, 30) + '...' : selectedGift.giftName}" to your wishlist!`)
      
      // Close modal and reset
      setWishlistModalOpen(false)
      setSelectedGift(null)
      
      // Navigate to wishlist page
      router.push('/wishlist')
    } catch (error: any) {
      console.error('Error adding to wishlist:', error)
      toast.error(error.message || 'Failed to add to wishlist')
    } finally {
      setAddingToWishlist(false)
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
                  <option value="amazon-choice">Overall Pick</option>
                  <option value="best-seller">Best Seller</option>
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
                className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 p-6 hover:shadow-xl transition-all cursor-pointer group flex flex-col h-full"
                onClick={() => router.push(`/gifts/${gift.id}`)}
              >
                <div className="relative mb-4">
                  <div className="w-full h-56 bg-white rounded-lg border-2 border-[#DAA520] overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <img
                    src={gift.image || gift.bannerImage || "/placeholder.svg"}
                    alt={gift.giftName}
                      className="max-w-full max-h-full object-contain p-2"
                  />
                  </div>
                  {gift.category && (
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-md">
                      {gift.category}
                    </div>
                  )}
                  {gift.originalPrice && gift.originalPrice > gift.targetAmount && (
                    <div className="absolute bottom-2 left-2 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                      SALE
                    </div>
                  )}
                </div>

                <div className="flex-grow flex flex-col">
                <div className="mb-2">
                  <h3 className="text-base sm:text-lg font-bold text-[#654321] mb-1 line-clamp-2">{gift.giftName}</h3>
                  {gift.source && (
                    <p className="text-xs text-[#8B4513]/70 mb-2">From {gift.source}</p>
                  )}
                  {gift.rating && gift.rating > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((starPosition) => {
                          const rating = gift.rating || 0
                          const fillAmount = Math.max(0, Math.min(1, rating - (starPosition - 1)))
                          const fillPercent = Math.round(fillAmount * 100)
                          const gradientId = `star-gradient-grid-${gift.id}-${starPosition}`

                          return (
                            <svg
                              key={starPosition}
                              className="w-3 h-3"
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
                      <span className="text-xs font-bold text-[#654321]">{gift.rating.toFixed(1)}</span>
                      {gift.reviewCount && gift.reviewCount > 0 && (
                        <span className="text-xs text-gray-500">({gift.reviewCount.toLocaleString()} reviews)</span>
                      )}
                    </div>
                  )}
                  {/* Badge container - always rendered for consistent layout alignment */}
                  <div className="flex flex-wrap gap-1.5 mb-2 min-h-[20px]">
                    {gift.amazonChoice && (
                      <span className="bg-[#FFFFFF] text-[#232F3E] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#232F3E] shadow-sm">
                        Overall Pick
                      </span>
                    )}
                    {gift.bestSeller && (
                      <span className="bg-[#D14900] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        #1 Best Seller
                      </span>
                    )}
                    {gift.attributes?.customBadges && gift.attributes.customBadges.filter(b => b.enabled).map((badge, idx) => (
                      <span key={idx} className="bg-[#059669] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {badge.name}
                      </span>
                    ))}
                </div>
                  {/* Price - moved below badges */}
                  <div className="mb-2">
                    <div className="flex items-center gap-2">
                      {gift.originalPrice && gift.originalPrice > gift.targetAmount ? (
                        <>
                          <span className="font-bold text-lg text-[#654321]">${gift.targetAmount.toFixed(2)}</span>
                          <span className="text-gray-400 line-through text-xs">${gift.originalPrice.toFixed(2)}</span>
                          <span className="text-red-600 font-semibold text-xs">
                            Save ${(gift.originalPrice - gift.targetAmount).toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="font-bold text-lg text-[#654321]">${gift.targetAmount.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-[#8B4513]/70 mb-3 line-clamp-2">{gift.description}</p>

                {/* Product Specifications */}
                {gift.attributes && (
                  <div className="mb-3 p-2.5 bg-amber-50 rounded-lg border border-amber-200 min-h-[180px]">
                    <p className="text-[11px] font-semibold text-[#654321] mb-2">Specifications</p>
                    {/* Determine if this is an audio product to hide irrelevant attributes */}
                    {(() => {
                      const isAudioProduct = !!(gift.attributes?.earPlacement || gift.attributes?.formFactor || gift.attributes?.noiseControl || gift.attributes?.earpieceShape);
                      const isWatchProduct = !!(gift.attributes?.style || gift.attributes?.configuration || (gift.giftName && gift.giftName.toLowerCase().includes('apple watch')));
                      const hideApplianceAttrs = isAudioProduct || isWatchProduct;
                      return (
                    <div className="space-y-1.5 text-[11px]">
                      {gift.attributes?.styleName && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Style:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.styleName}</span></div>
                      )}
                      {gift.attributes?.model && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Model:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.model}</span></div>
                      )}
                      {gift.attributes?.patternName && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Pattern:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.patternName}</span></div>
                      )}
                      {/* Color - show single color if only 1, otherwise handled by Color Variants below */}
                      {gift.attributes?.color && (!gift.attributes?.colorVariants || gift.attributes.colorVariants.length <= 1) && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Color:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.color}</span></div>
                      )}
                      {/* Audio/Headphone-specific attributes */}
                      {gift.attributes?.earPlacement && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Ear:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.earPlacement}</span></div>
                      )}
                      {gift.attributes?.formFactor && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Form:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.formFactor}</span></div>
                      )}
                      {gift.attributes?.noiseControl && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Noise:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.noiseControl}</span></div>
                      )}
                      {gift.attributes?.modelName && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Model:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.modelName}</span></div>
                      )}
                      {gift.attributes?.bluetoothVersion && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Bluetooth:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.bluetoothVersion}</span></div>
                      )}
                      {gift.attributes?.wirelessTechnology && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Wireless:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.wirelessTechnology}</span></div>
                      )}
                      {gift.attributes?.controlType && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Control:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.controlType}</span></div>
                      )}
                      {gift.attributes?.earpieceShape && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Earpiece:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.earpieceShape}</span></div>
                      )}
                      {gift.attributes?.compatibleDevices && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Compatible:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.compatibleDevices}</span></div>
                      )}
                      {gift.attributes?.waterResistance && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Water:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.waterResistance}</span></div>
                      )}
                      {gift.attributes?.specificUses && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Uses:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.specificUses}</span></div>
                      )}
                      {gift.attributes?.recommendedUses && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">For:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.recommendedUses}</span></div>
                      )}
                      {gift.attributes?.includedComponents && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Includes:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.includedComponents}</span></div>
                      )}
                      {/* Non-audio/watch product attributes */}
                      {!hideApplianceAttrs && gift.attributes?.material && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Material:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.material}</span></div>
                      )}
                      {!hideApplianceAttrs && gift.attributes?.capacity && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Capacity:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.capacity}</span></div>
                      )}
                      {!hideApplianceAttrs && gift.attributes?.wattage && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Wattage:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.wattage}</span></div>
                      )}
                      {!hideApplianceAttrs && gift.attributes?.productDimensions && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Dimensions:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.productDimensions}</span></div>
                      )}
                      {gift.attributes?.size && typeof gift.attributes.size === 'string' && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Size:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.size}</span></div>
                      )}
                      {!hideApplianceAttrs && gift.attributes?.finishType && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Finish:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.finishType}</span></div>
                      )}
                      {!hideApplianceAttrs && gift.attributes?.controlMethod && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Control:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.controlMethod}</span></div>
                      )}
                      {!hideApplianceAttrs && gift.attributes?.operationMode && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Mode:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.operationMode}</span></div>
                      )}
                      {!hideApplianceAttrs && gift.attributes?.specialFeature && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Features:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.specialFeature}</span></div>
                      )}
                      {/* Electronics-specific attributes */}
                      {gift.attributes?.operatingSystem && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">OS:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.operatingSystem}</span></div>
                      )}
                      {gift.attributes?.storageCapacity && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Storage:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.storageCapacity}</span></div>
                      )}
                      {gift.attributes?.screenSize && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Screen:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.screenSize}</span></div>
                      )}
                      {gift.attributes?.resolution && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Resolution:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.resolution}</span></div>
                      )}
                      {gift.attributes?.processor && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Processor:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.processor}</span></div>
                      )}
                      {gift.attributes?.ram && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">RAM:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.ram}</span></div>
                      )}
                      {gift.attributes?.connectivityTechnology && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Connect:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.connectivityTechnology}</span></div>
                      )}
                      {gift.attributes?.wirelessStandard && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Wireless:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.wirelessStandard}</span></div>
                      )}
                      {gift.attributes?.gpsType && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">GPS:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.gpsType}</span></div>
                      )}
                      {gift.attributes?.batteryType && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Battery:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.batteryType}</span></div>
                      )}
                      {gift.attributes?.shape && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Shape:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.shape}</span></div>
                      )}
                      {gift.attributes?.style && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Style:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.style}</span></div>
                      )}
                      {gift.attributes?.configuration && (
                        <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Config:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.configuration}</span></div>
                      )}
                    </div>
                      );
                    })()}
                    {/* Color Variants - Only show when multiple colors */}
                    {gift.attributes?.colorVariants && gift.attributes.colorVariants.length > 1 && (
                      <div className="mt-2 pt-2 border-t border-amber-200">
                        <span className="text-gray-500 text-[11px]">Color Variants ({gift.attributes.colorVariants.length}): </span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {gift.attributes.colorVariants.map((variant, idx) => (
                            <span key={idx} className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-medium">
                              {variant.color}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Style Options */}
                    {gift.attributes?.styleOptions && gift.attributes.styleOptions.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-amber-200">
                        <span className="text-gray-500 text-[11px]">Style Options: </span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {gift.attributes.styleOptions.map((style, idx) => (
                            <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-medium">
                              {style}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Configuration Options */}
                    {gift.attributes?.configurationOptions && gift.attributes.configurationOptions.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-amber-200">
                        <span className="text-gray-500 text-[11px]">Configuration: </span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {gift.attributes.configurationOptions.map((config, idx) => (
                            <span key={idx} className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-[10px] font-medium">
                              {config}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Size Options */}
                    {gift.attributes?.sizeOptions && gift.attributes.sizeOptions.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-amber-200">
                        <span className="text-gray-500 text-[11px]">Available Sizes: </span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {gift.attributes.sizeOptions.map((opt, idx) => (
                            <span key={idx} className="bg-amber-100 text-[#654321] px-2 py-0.5 rounded text-[10px] font-medium">
                              {opt.size}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Custom Fields */}
                    {gift.attributes?.customFields && gift.attributes.customFields.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-amber-200 space-y-1.5">
                        {gift.attributes.customFields.map((field, idx) => (
                          <div key={idx} className="flex items-start text-[11px]">
                            <span className="text-gray-500 w-[72px] flex-shrink-0">{field.name}:</span> <span className="text-[#654321] font-medium flex-1">{field.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                </div>

                <div className="flex flex-col gap-2 mt-auto">
                <Button
                    className="w-full px-3 py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-lg text-xs sm:text-sm font-semibold hover:shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddToWishlist(gift)
                  }}
                >
                    <Heart className="w-4 h-4" />
                    Add to My Wishlist
                </Button>
                  {gift.productLink && (
                    <Button
                      className="w-full px-3 py-2 bg-gradient-to-r from-[#EA580C] to-[#FB923C] text-white rounded-lg text-xs sm:text-sm font-semibold hover:shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(gift.productLink, '_blank')
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Buy now on {gift.source || 'Amazon'}
                    </Button>
                  )}
                  {/* Admin Delete Button */}
                  {isAdmin && (
                    <Button
                      className="w-full px-3 py-2 bg-gradient-to-r from-[#DC2626] to-[#EF4444] text-white rounded-lg text-xs sm:text-sm font-semibold hover:shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50"
                      onClick={(e) => handleDeleteProduct(gift.id, e)}
                      disabled={deletingGiftId === gift.id}
                    >
                      <Trash2 className="w-4 h-4" />
                      {deletingGiftId === gift.id ? 'Removing...' : 'Remove'}
                    </Button>
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
                className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 p-6 hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => router.push(`/gifts/${gift.id}`)}
              >
                <div className="flex gap-6">
                  <div className="relative flex-shrink-0">
                    <div className="w-36 h-36 bg-white rounded-lg border-2 border-[#DAA520] overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <img
                      src={gift.image || gift.bannerImage || "/placeholder.svg"}
                      alt={gift.giftName}
                        className="max-w-full max-h-full object-contain p-2"
                    />
                    </div>
                    {gift.originalPrice && gift.originalPrice > gift.targetAmount && (
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                        SALE
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-[#654321] mb-1">{gift.giftName}</h3>
                        {gift.source && <p className="text-sm text-[#8B4513]/70 mb-2">From {gift.source}</p>}
                        <p className="text-sm text-[#8B4513]/70 mb-3 line-clamp-2">{gift.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        {gift.originalPrice && gift.originalPrice > gift.targetAmount ? (
                          <>
                            <div className="font-bold text-xl text-[#654321]">${gift.targetAmount.toFixed(2)}</div>
                            <div className="text-gray-400 line-through text-sm">${gift.originalPrice.toFixed(2)}</div>
                            <div className="text-red-600 font-semibold text-xs">
                              Save ${(gift.originalPrice - gift.targetAmount).toFixed(2)}
                            </div>
                          </>
                        ) : (
                          <div className="font-bold text-xl text-[#654321]">${gift.targetAmount.toFixed(2)}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap mb-3">
                      {gift.category && (
                        <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-sm">
                          {gift.category}
                        </span>
                      )}
                      {gift.rating && gift.rating > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((starPosition) => {
                              const rating = gift.rating || 0
                              const fillAmount = Math.max(0, Math.min(1, rating - (starPosition - 1)))
                              const fillPercent = Math.round(fillAmount * 100)
                              const gradientId = `star-gradient-list-${gift.id}-${starPosition}`
                              
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
                            <span className="text-sm text-gray-500">({gift.reviewCount.toLocaleString()} reviews)</span>
                          )}
                        </div>
                      )}
                      {/* Badge container - always rendered for consistent layout alignment */}
                      <div className="flex gap-1.5 min-h-[20px]">
                        {gift.amazonChoice && (
                          <span className="bg-[#FFFFFF] text-[#232F3E] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#232F3E] shadow-sm">
                            Overall Pick
                          </span>
                        )}
                        {gift.bestSeller && (
                          <span className="bg-[#D14900] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            #1 Best Seller
                          </span>
                        )}
                        {gift.attributes?.customBadges && gift.attributes.customBadges.filter(b => b.enabled).map((badge, idx) => (
                          <span key={idx} className="bg-[#059669] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {badge.name}
                          </span>
                        ))}
                    </div>
                  </div>
                    
                    {/* Product Specifications - List View */}
                    {gift.attributes && (
                      <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                        {(() => {
                          const isAudioProduct = !!(gift.attributes?.earPlacement || gift.attributes?.formFactor || gift.attributes?.noiseControl || gift.attributes?.earpieceShape);
                          const isWatchProduct = !!(gift.attributes?.style || gift.attributes?.configuration || (gift.giftName && gift.giftName.toLowerCase().includes('apple watch')));
                          const hideApplianceAttrs = isAudioProduct || isWatchProduct;
                              return (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1.5 text-[11px]">
                          {gift.attributes?.styleName && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Style:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.styleName}</span></div>
                          )}
                          {gift.attributes?.model && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Model:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.model}</span></div>
                          )}
                          {gift.attributes?.patternName && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Pattern:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.patternName}</span></div>
                          )}
                          {/* Color - show single color if only 1, otherwise handled by Color Variants below */}
                          {gift.attributes?.color && (!gift.attributes?.colorVariants || gift.attributes.colorVariants.length <= 1) && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Color:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.color}</span></div>
                          )}
                          {/* Audio/Headphone-specific attributes */}
                          {gift.attributes?.earPlacement && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Ear:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.earPlacement}</span></div>
                          )}
                          {gift.attributes?.formFactor && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Form:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.formFactor}</span></div>
                          )}
                          {gift.attributes?.noiseControl && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Noise:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.noiseControl}</span></div>
                          )}
                          {gift.attributes?.modelName && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Model:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.modelName}</span></div>
                          )}
                          {gift.attributes?.bluetoothVersion && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Bluetooth:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.bluetoothVersion}</span></div>
                          )}
                          {gift.attributes?.wirelessTechnology && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Wireless:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.wirelessTechnology}</span></div>
                          )}
                          {gift.attributes?.controlType && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Control:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.controlType}</span></div>
                          )}
                          {gift.attributes?.earpieceShape && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Earpiece:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.earpieceShape}</span></div>
                          )}
                          {gift.attributes?.compatibleDevices && (
                            <div className="flex items-start col-span-2"><span className="text-gray-500 w-[72px] flex-shrink-0">Compatible:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.compatibleDevices}</span></div>
                          )}
                          {gift.attributes?.waterResistance && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Water:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.waterResistance}</span></div>
                          )}
                          {gift.attributes?.specificUses && (
                            <div className="flex items-start col-span-2"><span className="text-gray-500 w-[72px] flex-shrink-0">Uses:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.specificUses}</span></div>
                          )}
                          {gift.attributes?.recommendedUses && (
                            <div className="flex items-start col-span-2"><span className="text-gray-500 w-[72px] flex-shrink-0">For:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.recommendedUses}</span></div>
                          )}
                          {gift.attributes?.includedComponents && (
                            <div className="flex items-start col-span-2"><span className="text-gray-500 w-[72px] flex-shrink-0">Includes:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.includedComponents}</span></div>
                          )}
                          {/* Non-audio/watch product attributes */}
                          {!hideApplianceAttrs && gift.attributes?.material && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Material:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.material}</span></div>
                          )}
                          {!hideApplianceAttrs && gift.attributes?.capacity && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Capacity:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.capacity}</span></div>
                          )}
                          {!hideApplianceAttrs && gift.attributes?.wattage && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Wattage:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.wattage}</span></div>
                          )}
                          {!hideApplianceAttrs && gift.attributes?.productDimensions && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Dimensions:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.productDimensions}</span></div>
                          )}
                          {gift.attributes?.size && typeof gift.attributes.size === 'string' && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Size:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.size}</span></div>
                          )}
                          {!hideApplianceAttrs && gift.attributes?.finishType && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Finish:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.finishType}</span></div>
                          )}
                          {!hideApplianceAttrs && gift.attributes?.controlMethod && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Control:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.controlMethod}</span></div>
                          )}
                          {!hideApplianceAttrs && gift.attributes?.operationMode && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Mode:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.operationMode}</span></div>
                          )}
                          {!hideApplianceAttrs && gift.attributes?.specialFeature && (
                            <div className="flex items-start col-span-2"><span className="text-gray-500 w-[72px] flex-shrink-0">Features:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.specialFeature}</span></div>
                          )}
                          {/* Electronics-specific attributes */}
                          {gift.attributes?.operatingSystem && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">OS:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.operatingSystem}</span></div>
                          )}
                          {gift.attributes?.storageCapacity && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Storage:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.storageCapacity}</span></div>
                          )}
                          {gift.attributes?.screenSize && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Screen:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.screenSize}</span></div>
                          )}
                          {gift.attributes?.resolution && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Resolution:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.resolution}</span></div>
                          )}
                          {gift.attributes?.processor && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Processor:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.processor}</span></div>
                          )}
                          {gift.attributes?.ram && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">RAM:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.ram}</span></div>
                          )}
                          {gift.attributes?.connectivityTechnology && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Connect:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.connectivityTechnology}</span></div>
                          )}
                          {gift.attributes?.wirelessStandard && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Wireless:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.wirelessStandard}</span></div>
                          )}
                          {gift.attributes?.gpsType && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">GPS:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.gpsType}</span></div>
                          )}
                          {gift.attributes?.batteryType && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Battery:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.batteryType}</span></div>
                          )}
                          {gift.attributes?.shape && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Shape:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.shape}</span></div>
                          )}
                          {gift.attributes?.style && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Style:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.style}</span></div>
                          )}
                          {gift.attributes?.configuration && (
                            <div className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">Config:</span> <span className="text-[#654321] font-medium flex-1">{gift.attributes.configuration}</span></div>
                          )}
                          {/* Color Variants - Only show when multiple colors */}
                          {gift.attributes?.colorVariants && gift.attributes.colorVariants.length > 1 && (
                            <div className="flex items-start gap-1.5 flex-wrap col-span-2">
                              <span className="text-gray-500 w-[72px] flex-shrink-0">Colors ({gift.attributes.colorVariants.length}):</span>
                              <div className="flex flex-wrap gap-1.5 flex-1">
                                {gift.attributes.colorVariants.map((variant, idx) => (
                                  <span key={idx} className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-medium">
                                    {variant.color}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Style Options */}
                          {gift.attributes?.styleOptions && gift.attributes.styleOptions.length > 0 && (
                            <div className="flex items-start gap-1.5 flex-wrap col-span-2">
                              <span className="text-gray-500 w-[72px] flex-shrink-0">Styles:</span>
                              <div className="flex flex-wrap gap-1.5 flex-1">
                                {gift.attributes.styleOptions.map((style, idx) => (
                                  <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-medium">
                                    {style}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Configuration Options */}
                          {gift.attributes?.configurationOptions && gift.attributes.configurationOptions.length > 0 && (
                            <div className="flex items-start gap-1.5 flex-wrap col-span-2">
                              <span className="text-gray-500 w-[72px] flex-shrink-0">Configs:</span>
                              <div className="flex flex-wrap gap-1.5 flex-1">
                                {gift.attributes.configurationOptions.map((config, idx) => (
                                  <span key={idx} className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-[10px] font-medium">
                                    {config}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Size Options */}
                          {gift.attributes?.sizeOptions && gift.attributes.sizeOptions.length > 0 && (
                            <div className="flex items-start gap-1.5 flex-wrap col-span-2">
                              <span className="text-gray-500 w-[72px] flex-shrink-0">Sizes:</span>
                              <div className="flex flex-wrap gap-1.5 flex-1">
                                {gift.attributes.sizeOptions.map((opt, idx) => (
                                  <span key={idx} className="bg-amber-100 text-[#654321] px-2 py-0.5 rounded text-[10px] font-medium">
                                    {opt.size}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Custom Fields */}
                          {gift.attributes?.customFields && gift.attributes.customFields.map((field, idx) => (
                            <div key={idx} className="flex items-start"><span className="text-gray-500 w-[72px] flex-shrink-0">{field.name}:</span> <span className="text-[#654321] font-medium flex-1">{field.value}</span></div>
                          ))}
                        </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                  <Button
                      className="px-4 py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-lg text-sm font-semibold hover:shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddToWishlist(gift)
                    }}
                  >
                      <Heart className="w-4 h-4" />
                      Add to My Wishlist
                  </Button>
                    {gift.productLink && (
                      <Button
                        className="px-4 py-2 bg-gradient-to-r from-[#EA580C] to-[#FB923C] text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(gift.productLink, '_blank')
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Buy now on {gift.source || 'Amazon'}
                      </Button>
                    )}
                    {/* Admin Delete Button */}
                    {isAdmin && (
                      <Button
                        className="px-4 py-2 bg-gradient-to-r from-[#DC2626] to-[#EF4444] text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50"
                        onClick={(e) => handleDeleteProduct(gift.id, e)}
                        disabled={deletingGiftId === gift.id}
                      >
                        <Trash2 className="w-4 h-4" />
                        {deletingGiftId === gift.id ? 'Removing...' : 'Remove'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wishlist Options Modal */}
      {selectedGift && (
        <WishlistOptionsModal
          isOpen={wishlistModalOpen}
          onClose={() => {
            setWishlistModalOpen(false)
            setSelectedGift(null)
          }}
          onConfirm={handleConfirmAddToWishlist}
          product={{
            name: selectedGift.giftName,
            price: selectedGift.targetAmount,
            image: selectedGift.image || selectedGift.bannerImage || undefined,
            source: selectedGift.source,
            attributes: selectedGift.attributes
          }}
          isLoading={addingToWishlist}
        />
      )}
    </div>
  )
}
