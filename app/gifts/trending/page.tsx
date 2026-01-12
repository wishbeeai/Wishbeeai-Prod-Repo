"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Search, Filter, Star, TrendingUp, SlidersHorizontal, Grid3x3, List, X, Heart, Trash2, Loader2, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AddToWishlistModal } from "@/components/add-to-wishlist-modal"
import { useAuth } from "@/lib/auth-context"

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
                    className="w-full h-52 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {gift.category && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-100 to-orange-100 backdrop-blur-sm text-[#8B4513] px-3 py-1 rounded-full text-xs font-bold shadow-md border border-amber-200">
                      {gift.category}
                    </div>
                  )}
                  {gift.originalPrice && gift.originalPrice > gift.targetAmount && (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg animate-pulse">
                      SALE
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-4 flex-grow flex flex-col">
                  {/* Title - Fixed 2 lines with ellipsis */}
                  <h3 className="text-sm font-semibold text-[#654321] mb-1 line-clamp-2 min-h-[2.5rem] group-hover:text-[#8B4513] transition-colors" title={gift.giftName}>{gift.giftName}</h3>
                  {gift.source && (
                    <p className="text-xs text-[#8B4513]/60 mb-1.5 flex items-center gap-1">
                      <span className="w-1 h-1 bg-[#DAA520] rounded-full"></span>
                      From {gift.source}
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
                        <span className="text-xs text-gray-500">({gift.reviewCount.toLocaleString()})</span>
                      )}
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
                          <span className="bg-gradient-to-r from-amber-600 to-orange-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                            🔥 Best Seller
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

                {/* Product Specifications - Fixed height for alignment */}
                <div className="bg-gradient-to-r from-[#6B4423]/5 to-[#8B5A3C]/5 rounded-lg p-3 border border-[#8B5A3C]/10 mt-auto h-[175px] flex flex-col">
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
                          .slice(0, 5)
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
                              setSelectedGiftForAttributes(gift)
                              setIsAttributesModalOpen(true)
                            }}
                            className="text-left text-[10px] font-bold text-[#DAA520] hover:text-[#B8860B] cursor-pointer transition-colors h-[16px]"
                          >
                            +{getFilteredAttributes(gift).length - 5} more specs →
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
                    className="w-full px-4 py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] hover:from-[#F4C430] hover:to-[#DAA520] text-[#8B4513] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedGiftForWishlist(gift)
                      setIsWishlistModalOpen(true)
                    }}
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>Add to My Wishlist</span>
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-red-600 hover:bg-red-50 bg-transparent border border-red-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={(e) => handleRemoveGift(e, gift)}
                      disabled={removingGiftId === gift.id}
                      title="Remove from Trending Gifts"
                    >
                      {removingGiftId === gift.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span>Remove from Trending Gifts</span>
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
                      className="w-32 h-32 object-cover rounded-lg border-2 border-[#DAA520] group-hover:scale-105 transition-transform duration-300"
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
                        {/* Title - Fixed 2 lines with ellipsis */}
                        <h3 className="text-lg font-bold text-[#654321] mb-1 line-clamp-2 min-h-[3.5rem]" title={gift.giftName}>{gift.giftName}</h3>
                        {gift.source && <p className="text-sm text-[#8B4513]/70 mb-2">From {gift.source}</p>}
                        {/* Product Specifications - List View - Fixed height */}
                        <div className="mb-2 h-[140px] bg-gradient-to-r from-[#6B4423]/5 to-[#8B5A3C]/5 rounded-lg p-2 border border-[#8B5A3C]/10 overflow-hidden">
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
                                .slice(0, 5)
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
                                    setSelectedGiftForAttributes(gift)
                                    setIsAttributesModalOpen(true)
                                  }}
                                  className="text-left text-[11px] font-semibold text-[#DAA520] hover:text-[#B8860B] cursor-pointer transition-colors h-[16px]"
                                >
                                  +{getFilteredAttributes(gift).length - 5} more specs →
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
                      {gift.category && (
                        <span className="bg-gradient-to-r from-amber-100 to-orange-100 text-[#8B4513] px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
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
                            <span className="text-sm text-gray-500">({gift.reviewCount.toLocaleString()} reviews)</span>
                          )}
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
                            <span className="bg-gradient-to-r from-gray-800 to-gray-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Best Seller
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
                      className="w-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-1.5 px-4 py-2 border-0 hover:opacity-90"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedGiftForWishlist(gift)
                        setIsWishlistModalOpen(true)
                      }}
                    >
                      <Heart className="w-4 h-4" />
                      <span>Add to My Wishlist</span>
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        className="w-full px-4 py-2 text-red-600 hover:bg-red-50 bg-transparent border border-red-200 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={(e) => handleRemoveGift(e, gift)}
                        disabled={removingGiftId === gift.id}
                        title="Remove from Trending Gifts"
                      >
                        {removingGiftId === gift.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        <span>Remove from Trending Gifts</span>
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
