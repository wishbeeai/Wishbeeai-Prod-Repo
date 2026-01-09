"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Search, Filter, Star, TrendingUp, SlidersHorizontal, Grid3x3, List, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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
}

type SortOption = "popularity" | "rating" | "price-low" | "price-high" | "name" | "newest"
type ViewMode = "grid" | "list"

export default function TrendingGiftsPage() {
  const router = useRouter()
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
                  <option value="amazon-choice">Amazon Choice</option>
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
                className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 p-6 hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => router.push(`/gifts/${gift.id}`)}
              >
                <div className="relative mb-4">
                  <img
                    src={gift.image || gift.bannerImage || "/placeholder.svg"}
                    alt={gift.giftName}
                    className="w-full h-48 object-cover rounded-lg border-2 border-[#DAA520] group-hover:scale-105 transition-transform duration-300"
                  />
                  {gift.category && (
                    <div className="absolute top-2 left-2 bg-white/90 text-[#654321] px-2 py-1 rounded-full text-xs font-semibold">
                      {gift.category}
                    </div>
                  )}
                  {gift.originalPrice && gift.originalPrice > gift.targetAmount && (
                    <div className="absolute bottom-2 left-2 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                      SALE
                    </div>
                  )}
                </div>

                <div className="mb-2">
                  <h3 className="text-base sm:text-lg font-bold text-[#654321] mb-1 line-clamp-2">{gift.giftName}</h3>
                  {gift.source && (
                    <p className="text-xs text-[#8B4513]/70 mb-2">From {gift.source}</p>
                  )}
                  {(gift.amazonChoice || gift.bestSeller) && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {gift.amazonChoice && (
                        <span className="bg-gradient-to-r from-[#FF9900] to-[#FFB84D] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Amazon Choice
                        </span>
                      )}
                      {gift.bestSeller && (
                        <span className="bg-gradient-to-r from-gray-800 to-gray-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Best Seller
                        </span>
                      )}
                    </div>
                  )}
                  {gift.rating && gift.rating > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const starValue = (gift.rating || 0) - star
                          let fillPercent = 0

                          if (starValue >= 1) {
                            fillPercent = 100
                          } else if (starValue <= 0) {
                            fillPercent = 0
                          } else {
                            fillPercent = Math.round(starValue * 100)
                          }

                          const isFilled = fillPercent >= 50

                          return (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                isFilled ? "fill-[#F4C430] text-[#F4C430]" : "fill-gray-200 text-gray-300"
                              }`}
                            />
                          )
                        })}
                      </div>
                      <span className="text-xs font-bold text-[#654321]">{gift.rating.toFixed(1)}</span>
                      {gift.reviewCount && gift.reviewCount > 0 && (
                        <span className="text-xs text-gray-500">({gift.reviewCount.toLocaleString()} reviews)</span>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-[#8B4513]/70 mb-3 line-clamp-2">{gift.description}</p>

                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8B4513]/70">Price</span>
                    <div className="flex items-center gap-2">
                      {gift.originalPrice && gift.originalPrice > gift.targetAmount ? (
                        <>
                          <span className="font-bold text-[#654321]">${gift.targetAmount.toFixed(2)}</span>
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

                <Button
                  className="w-full px-3 py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-lg text-xs sm:text-sm font-semibold hover:shadow-lg transition-all"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/gifts/${gift.id}`)
                  }}
                >
                  View Details
                </Button>
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
                    <div className="flex items-center gap-4 flex-wrap">
                      {gift.category && (
                        <span className="bg-gradient-to-r from-amber-100 to-orange-100 text-[#8B4513] px-2 py-1 rounded-full text-xs font-semibold">
                          {gift.category}
                        </span>
                      )}
                      {(gift.amazonChoice || gift.bestSeller) && (
                        <div className="flex gap-1.5">
                          {gift.amazonChoice && (
                            <span className="bg-gradient-to-r from-[#FF9900] to-[#FFB84D] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Amazon Choice
                            </span>
                          )}
                          {gift.bestSeller && (
                            <span className="bg-gradient-to-r from-gray-800 to-gray-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Best Seller
                            </span>
                          )}
                        </div>
                      )}
                      {gift.rating && gift.rating > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => {
                              const starValue = (gift.rating || 0) - star
                              const isFilled = starValue >= 1 || (starValue > 0 && starValue >= 0.5)
                              return (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    isFilled ? "fill-[#F4C430] text-[#F4C430]" : "fill-gray-200 text-gray-300"
                                  }`}
                                />
                              )
                            })}
                          </div>
                          <span className="text-sm font-bold text-[#654321]">{gift.rating.toFixed(1)}</span>
                          {gift.reviewCount && gift.reviewCount > 0 && (
                            <span className="text-sm text-gray-500">({gift.reviewCount.toLocaleString()} reviews)</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-lg font-semibold hover:shadow-lg transition-all"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/gifts/${gift.id}`)
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
