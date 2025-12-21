"use client"

import { useEffect } from "react"

import { useState } from "react"

import {
  ArrowLeft,
  ArrowRight,
  Users,
  DollarSign,
  Clock,
  Calendar,
  Sparkles,
  Search,
  Heart,
  Share2,
  ShoppingBag,
  Gift,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const browseGifts = [
  {
    id: 1,
    name: "Premium Espresso Machine",
    category: "Home & Kitchen",
    price: 899,
    contributors: 24,
    progress: 85,
    image: "/professional-espresso-setup.png",
    daysLeft: 5,
    store: "Amazon",
  },
  {
    id: 2,
    name: "Designer Handbag",
    category: "Fashion",
    price: 1250,
    contributors: 18,
    progress: 72,
    image: "/luxury-quilted-handbag.png",
    daysLeft: 8,
    store: "Nordstrom",
  },
  {
    id: 3,
    name: "Smart Home Hub Package",
    category: "Tech",
    price: 650,
    contributors: 31,
    progress: 95,
    image: "/smart-home-devices.jpg",
    daysLeft: 3,
    store: "Best Buy",
  },
  {
    id: 4,
    name: "Professional Camera Kit",
    category: "Photography",
    price: 1899,
    contributors: 15,
    progress: 60,
    image: "/camera-kit-professional.jpg",
    daysLeft: 12,
    store: "B&H Photo",
  },
  {
    id: 5,
    name: "Luxury Watch Collection",
    category: "Accessories",
    price: 2500,
    contributors: 22,
    progress: 78,
    image: "/luxury-watch.jpg",
    daysLeft: 7,
    store: "Watches.com",
  },
  {
    id: 6,
    name: "Gaming Console Bundle",
    category: "Gaming",
    price: 799,
    contributors: 35,
    progress: 92,
    image: "/modern-gaming-console.png",
    daysLeft: 4,
    store: "GameStop",
  },
  {
    id: 7,
    name: "Fitness Equipment Set",
    category: "Sports & Fitness",
    price: 1200,
    contributors: 19,
    progress: 65,
    image: "/diverse-fitness-equipment.png",
    daysLeft: 10,
    store: "Dick's Sporting Goods",
  },
  {
    id: 8,
    name: "Professional Drone",
    category: "Tech",
    price: 1599,
    contributors: 12,
    progress: 55,
    image: "/professional-drone.jpg",
    daysLeft: 15,
    store: "DJI Store",
  },
]

export default function GiftDetailPage() {
  const params = useParams()
  const router = useRouter()
  const giftId = params.id

  const [selectedCategory, setSelectedCategory] = useState("All")
  const [sortBy, setSortBy] = useState("popular")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [gifts, setGifts] = useState(browseGifts)
  const [aiInsights, setAiInsights] = useState<Record<string, string>>({})
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [showAiRecommendations, setShowAiRecommendations] = useState(false)

  useEffect(() => {
    console.log("[v0] Gift detail page - giftId:", giftId)
    console.log("[v0] Is browse page?", giftId === "browse")

    if (giftId === "create") {
      router.replace("/gifts/create")
      return
    }
    // Removed browse redirect - let Next.js handle it naturally
  }, [giftId, router])

  useEffect(() => {
    if (giftId === "browse") {
      fetchBrowseGifts()
    }
  }, [giftId])

  const fetchBrowseGifts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/gifts/browse")
      const data = await response.json()

      if (data.success && data.gifts) {
        setGifts(
          data.gifts.map((gift: any) => ({
            id: gift.id,
            name: gift.giftName || gift.collectionTitle,
            price: gift.targetAmount,
            currentAmount: gift.currentAmount,
            contributors: gift.contributors,
            daysLeft: Math.ceil((new Date(gift.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            image: gift.image,
            category: gift.category || "Other",
            store:
              gift.category === "Home & Kitchen"
                ? "Amazon"
                : gift.category === "Fashion"
                  ? "Nordstrom"
                  : gift.category === "Tech"
                    ? "Best Buy"
                    : "Target",
          })),
        )
      }
    } catch (error) {
      console.error("[v0] Error fetching browse gifts:", error)
      toast.error("Failed to load gifts")
    } finally {
      setLoading(false)
    }
  }

  const handleAiSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      setLoading(true)
      const response = await fetch("/api/ai/gift-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      })

      const data = await response.json()

      if (data.recommendations) {
        setShowAiRecommendations(true)
        toast.success("AI found personalized recommendations for you!")
      }
    } catch (error) {
      console.error("[v0] Error getting AI recommendations:", error)
    } finally {
      setLoading(false)
    }
  }

  const getAiInsight = async (giftId: string, giftName: string, category: string) => {
    if (aiInsights[giftId]) {
      toast.info(aiInsights[giftId])
      return
    }

    try {
      const response = await fetch("/api/ai/gift-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftName, category }),
      })

      const data = await response.json()

      if (data.insight) {
        setAiInsights((prev) => ({ ...prev, [giftId]: data.insight }))
        toast.success(data.insight, { duration: 5000 })
      }
    } catch (error) {
      console.error("[v0] Error getting AI insight:", error)
      toast.error("Failed to get AI insight")
    }
  }

  const toggleFavorite = (giftId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(giftId)) {
        newFavorites.delete(giftId)
        toast.success("Removed from favorites")
      } else {
        newFavorites.add(giftId)
        toast.success("Added to favorites")
      }
      return newFavorites
    })
  }

  const shareGift = async (gift: any) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: gift.name,
          text: `Check out this gift: ${gift.name}`,
          url: `${window.location.origin}/gifts/${gift.id}`,
        })
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}/gifts/${gift.id}`)
        toast.success("Gift link copied to clipboard!")
      }
    } catch (error) {
      console.error("[v0] Error sharing gift:", error)
    }
  }

  if (giftId === "browse") {
    const categories = ["All", ...Array.from(new Set(gifts.map((g) => g.category)))]

    const filteredGifts = gifts
      .filter((gift) => {
        const matchesCategory = selectedCategory === "All" || gift.category === selectedCategory
        const matchesSearch =
          searchQuery === "" ||
          gift.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          gift.category.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "ending-soon":
            return a.daysLeft - b.daysLeft
          case "price-low":
            return a.price - b.price
          case "price-high":
            return b.price - a.price
          case "progress":
            return (b.currentAmount / b.price) * 100 - (a.currentAmount / a.price) * 100
          default:
            return b.contributors - a.contributors
        }
      })

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(251,191,36,0.1)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(249,115,22,0.1)_0%,transparent_50%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12 relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-4 sm:mb-6 transition-colors text-xs sm:text-sm"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            Back to Home
          </Link>

          <div className="mb-6 sm:mb-8">
            <div className="bg-card border border-border rounded-lg p-6 mb-6 sm:mb-8">
              <div className="flex flex-row items-center justify-center gap-2">
                <Gift className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#DAA520] flex-shrink-0" />
                <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-foreground whitespace-nowrap">
                  Browse All Gifts
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2">
                Discover amazing gifts from affiliated stores and contribute to make dreams come true
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border-2 border-amber-200 p-3 sm:p-6 md:p-8 mb-4 sm:mb-8">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              <Search className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-600" />
              <h3 className="font-bold text-amber-900 text-[11px] sm:text-sm md:text-base">Search Gifts</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Search gifts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAiSearch()}
                className="flex-1 px-2.5 sm:px-4 py-2 sm:py-3 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-amber-400 text-xs sm:text-sm md:text-base"
              />
              <Button
                onClick={handleAiSearch}
                disabled={loading || !searchQuery.trim()}
                className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white font-semibold border-2 border-amber-400/30 shadow-[0_8px_30px_rgba(251,146,60,0.4)] hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-full px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm md:text-base w-full sm:w-auto"
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                AI Search
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border-2 border-amber-200 p-3 sm:p-6 md:p-8 mb-4 sm:mb-8">
            {/* Category Filters */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <ShoppingBag className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-600" />
                <h3 className="font-bold text-amber-900 text-[11px] sm:text-sm md:text-base">Categories</h3>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-[10px] sm:text-sm font-semibold transition-all border-2 ${
                      selectedCategory === category
                        ? "bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-400 text-white border-transparent shadow-lg shadow-amber-300/50 scale-105"
                        : "bg-white text-amber-700 border-amber-200 hover:border-amber-400 hover:bg-gradient-to-r hover:from-amber-50 hover:to-yellow-50"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <ArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-600" />
                <h3 className="font-bold text-amber-900 text-[11px] sm:text-sm md:text-base">Sort By</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 sm:gap-2">
                {[
                  { value: "popular", label: "Most Popular" },
                  { value: "ending-soon", label: "Ending Soon" },
                  { value: "price-low", label: "Price: Low-High" },
                  { value: "price-high", label: "Price: High-Low" },
                  { value: "progress", label: "Most Funded" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-[10px] sm:text-sm font-semibold transition-all border-2 ${
                      sortBy === option.value
                        ? "bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-400 text-white border-transparent shadow-md shadow-amber-300/40"
                        : "bg-gradient-to-br from-amber-50 to-yellow-50 text-amber-700 border-amber-200 hover:border-amber-400 hover:from-amber-100 hover:to-yellow-100"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-amber-200">
              <p className="text-[10px] sm:text-sm text-amber-700 font-medium">
                Showing <span className="font-bold text-amber-900">{filteredGifts.length}</span> gift
                {filteredGifts.length !== 1 ? "s" : ""}
                {selectedCategory !== "All" && (
                  <span>
                    {" "}
                    in <span className="font-bold">{selectedCategory}</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          {filteredGifts.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-amber-900 font-bold mb-2 text-sm sm:text-base md:text-lg">No gifts found</p>
              <p className="text-amber-700 mb-4 text-sm sm:text-base">Try adjusting your filters or search terms</p>
              <button
                onClick={() => {
                  setSelectedCategory("All")
                  setSearchQuery("")
                }}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-[#DAA520] to-[#FFD700] text-white rounded-lg font-semibold hover:shadow-lg transition-all text-xs sm:text-sm"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredGifts.map((gift, index) => (
                <div
                  key={gift.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group border-2 border-amber-200 hover:border-amber-400 hover:-translate-y-2"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Link href={`/gifts/${gift.id}`}>
                    <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                      <Image
                        src={gift.image || "/placeholder.svg"}
                        alt={gift.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full text-xs sm:text-sm font-bold shadow-lg">
                        {Math.round((gift.currentAmount / gift.price) * 100)}%
                      </div>
                      <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-amber-900 shadow-md">
                        {gift.store}
                      </div>
                    </div>
                  </Link>

                  <div className="p-3 sm:p-4">
                    <Link href={`/gifts/${gift.id}`}>
                      <h3 className="font-bold text-amber-900 mb-2 group-hover:text-amber-600 transition-colors text-sm sm:text-base md:text-lg line-clamp-2">
                        {gift.name}
                      </h3>
                    </Link>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-amber-700/70">Goal</span>
                        <span className="font-bold text-amber-900 text-base sm:text-lg md:text-xl">${gift.price}</span>
                      </div>
                      <div className="w-full bg-amber-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#DAA520] to-[#FFD700] h-full rounded-full transition-all duration-500"
                          style={{ width: `${(gift.currentAmount / gift.price) * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs sm:text-sm text-amber-700/70">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="text-xs sm:text-sm">{gift.contributors}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="text-xs sm:text-sm">{gift.daysLeft} days</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1 sm:gap-2 pt-3 border-t border-amber-100">
                      <Button
                        onClick={(e) => {
                          e.preventDefault()
                          toggleFavorite(gift.id)
                        }}
                        variant="outline"
                        size="sm"
                        className={`flex-1 text-[9px] sm:text-xs md:text-sm px-1 sm:px-3 py-1 sm:py-2 transition-all ${
                          favorites.has(gift.id)
                            ? "bg-gradient-to-r from-red-500 via-red-600 to-rose-500 text-white border-transparent shadow-lg shadow-red-500/50"
                            : "border-amber-300 text-amber-700 hover:bg-gradient-to-r hover:from-amber-50 hover:to-yellow-50 hover:border-amber-400"
                        }`}
                      >
                        <Heart
                          className={`w-2.5 h-2.5 sm:w-4 sm:h-4 mr-0.5 sm:mr-1 ${favorites.has(gift.id) ? "fill-white" : ""}`}
                        />
                        <span className="hidden xs:inline">Save</span>
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.preventDefault()
                          shareGift(gift)
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-orange-300 text-orange-700 hover:bg-gradient-to-r hover:from-orange-400 hover:via-rose-400 hover:to-pink-500 hover:text-white hover:border-transparent transition-all text-[9px] sm:text-xs md:text-sm px-1 sm:px-3 py-1 sm:py-2"
                      >
                        <Share2 className="w-2.5 h-2.5 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                        <span className="hidden xs:inline">Share</span>
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.preventDefault()
                          getAiInsight(gift.id, gift.name, gift.category)
                        }}
                        className="flex-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white font-semibold border-2 border-amber-400/30 shadow-[0_8px_30px_rgba(251,146,60,0.4)] hover:shadow-xl transition-all rounded-full text-[9px] sm:text-xs md:text-sm px-1 sm:px-3 py-1 sm:py-2"
                      >
                        <Sparkles className="w-2.5 h-2.5 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                        <span className="hidden xs:inline">AI Insight</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 sm:mt-12 text-center">
            <p className="text-amber-700 mb-4 text-xs sm:text-sm md:text-base">Can't find what you're looking for?</p>
            <Link href="/gifts/create">
              <Button className="group relative w-auto px-4 py-1.5 sm:px-6 sm:py-3 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#8B4513] rounded-full font-bold overflow-hidden transition-all duration-300 shadow-[0_8px_30px_rgba(218,165,32,0.4)] hover:shadow-[0_12px_40px_rgba(218,165,32,0.6)] hover:scale-105 hover:from-[#F4C430] hover:to-[#DAA520] active:scale-95 text-xs sm:text-sm md:text-base border-2 border-[#DAA520]/30">
                <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
                  Create Your Own Gift Collection
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </span>
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Mock gift details (in a real app, this would fetch from an API)
  const giftDetails = {
    1: {
      name: "Sarah's Birthday Gift",
      description:
        "Let's surprise Sarah with an amazing birthday gift! She's been eyeing this espresso machine for months.",
      image: "/images/espresso-machine.webp",
      targetAmount: 500,
      currentAmount: 350,
      contributors: 8,
      daysLeft: 5,
      createdDate: "March 15, 2024",
      endDate: "April 5, 2024",
      organizer: "John Smith",
      recentContributions: [
        { name: "Mike Johnson", amount: 50, time: "2 hours ago" },
        { name: "Emily Davis", amount: 75, time: "5 hours ago" },
        { name: "Alex Chen", amount: 25, time: "1 day ago" },
      ],
    },
    2: {
      name: "Team Appreciation Gift",
      description: "Celebrating our team's hard work and dedication. Let's get them something special!",
      image: "/colorful-gift-box.png",
      targetAmount: 300,
      currentAmount: 180,
      contributors: 12,
      daysLeft: 10,
      createdDate: "March 20, 2024",
      endDate: "April 10, 2024",
      organizer: "Lisa Anderson",
      recentContributions: [
        { name: "David Brown", amount: 30, time: "1 hour ago" },
        { name: "Rachel Green", amount: 40, time: "3 hours ago" },
        { name: "Tom Wilson", amount: 20, time: "6 hours ago" },
      ],
    },
  }

  const gift = giftDetails[giftId as keyof typeof giftDetails]

  if (!gift && giftId !== "create") {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#DAA520]/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-[#DAA520]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#654321] mb-3">Gift Not Found</h1>
            <p className="text-[#8B4513]/80 mb-6">
              The gift collection you're looking for doesn't exist or may have been removed.
            </p>
          </div>
          <Link
            href="/gifts/active"
            className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Active Gifts
          </Link>
        </div>
      </div>
    )
  }

  if (giftId === "create") {
    return null
  }

  const progressPercentage = (gift.currentAmount / gift.targetAmount) * 100

  const handleContribute = () => {
    toast.success("Opening contribution form...")
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/gifts/active"
          className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Active Gifts
        </Link>

        <div className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-6 md:p-8">
            <div>
              <img
                src={gift.image || "/placeholder.svg"}
                alt={gift.name}
                className="w-full h-64 md:h-80 object-cover rounded-lg border-2 border-[#DAA520]"
              />
              <div className="mt-4 p-4 bg-[#F5DEB3] rounded-lg">
                <h3 className="font-bold text-[#654321] mb-2">Organized by</h3>
                <p className="text-[#8B4513]">{gift.organizer}</p>
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-bold text-[#654321] mb-3">{gift.name}</h1>
              <p className="text-[#8B4513]/80 mb-6">{gift.description}</p>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-[#8B4513]">
                  <DollarSign className="w-5 h-5 text-[#DAA520]" />
                  <span>
                    <span className="font-bold text-[#654321]">${gift.currentAmount}</span> raised of{" "}
                    <span className="font-bold">${gift.targetAmount}</span> goal
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[#8B4513]">
                  <Users className="w-5 h-5 text-[#DAA520]" />
                  <span>{gift.contributors} contributors</span>
                </div>
                <div className="flex items-center gap-3 text-[#8B4513]">
                  <Clock className="w-5 h-5 text-[#DAA520]" />
                  <span>{gift.daysLeft} days left</span>
                </div>
                <div className="flex items-center gap-3 text-[#8B4513]">
                  <Calendar className="w-5 h-5 text-[#DAA520]" />
                  <span>Ends on {gift.endDate}</span>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#8B4513]/70">Progress</span>
                  <span className="font-bold text-[#654321]">{progressPercentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-[#F5DEB3] rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              <button
                onClick={handleContribute}
                className="w-full px-6 py-3 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-lg font-bold text-lg hover:shadow-lg transition-all"
              >
                Contribute Now
              </button>
            </div>
          </div>

          <div className="border-t-2 border-[#DAA520]/20 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-[#654321] mb-4">Recent Contributions</h2>
            <div className="space-y-3">
              {gift.recentContributions.map((contribution, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-[#F5F1E8] rounded-lg">
                  <div>
                    <p className="font-semibold text-[#654321]">{contribution.name}</p>
                    <p className="text-sm text-[#8B4513]/70">{contribution.time}</p>
                  </div>
                  <span className="font-bold text-[#DAA520] text-lg">${contribution.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
