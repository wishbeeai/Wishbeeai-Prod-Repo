"use client"

import { useEffect, useState } from "react"

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
  Copy,
  Mail,
  MessageCircle,
  Check,
  ExternalLink,
  Loader2,
  User,
  Gift as GiftIcon,
  PartyPopper,
  MapPin,
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
  const [magicLink, setMagicLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [fetchedGift, setFetchedGift] = useState<{
    name: string
    description: string
    image: string
    targetAmount: number
    currentAmount: number
    contributors: number
    daysLeft: number
    createdDate: string
    endDate: string
    organizer: string
    recentContributions: { name: string; email?: string; amount: number; time: string }[]
    contributeUrl?: string
    recipientName?: string | null
    recipientEmail?: string | null
    recipientAddress?: {
      line1?: string | null
      line2?: string | null
      city?: string | null
      state?: string | null
      zip?: string | null
      country?: string | null
    } | null
  } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailNotFound, setDetailNotFound] = useState(false)
  const [contributing, setContributing] = useState(false)
  const [backfillLoading, setBackfillLoading] = useState(false)

  useEffect(() => {
    console.log("[v0] Gift detail page - giftId:", giftId)
    console.log("[v0] Is browse page?", giftId === "browse")

    if (giftId === "create") {
      router.replace("/gifts/create")
      return
    }
    
    // Check for magic link in session storage
    if (giftId && giftId !== "browse" && giftId !== "create") {
      const storedMagicLink = sessionStorage.getItem(`gift_${giftId}_magicLink`)
      if (storedMagicLink) {
        setMagicLink(storedMagicLink)
        // Show share modal automatically for newly created gifts
        setShowShareModal(true)
        // Clear from session storage after retrieving
        sessionStorage.removeItem(`gift_${giftId}_magicLink`)
      }
    }
  }, [giftId, router])

  useEffect(() => {
    if (giftId === "browse") {
      fetchBrowseGifts()
    }
  }, [giftId])

  const mockIds = ["1", "2"]
  const isRealGiftId =
    giftId &&
    giftId !== "browse" &&
    giftId !== "create" &&
    !mockIds.includes(giftId as string)

  const refetchGift = () => {
    if (!isRealGiftId || typeof giftId !== "string") return
    fetch(`/api/gifts/${giftId}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok || res.status === 404) return null
        return res.json()
      })
      .then((data) => {
        if (!data?.gift) return
        const g = data.gift
        setFetchedGift({
          name: g.name || g.collectionTitle || g.giftName,
          description: g.description || "Help make this gift possible!",
          image: g.image || "/placeholder.svg",
          targetAmount: g.targetAmount ?? 0,
          currentAmount: g.currentAmount ?? 0,
          contributors: g.contributors ?? 0,
          daysLeft: g.daysLeft ?? 0,
          createdDate: g.created_at ? new Date(g.created_at).toLocaleDateString() : "",
          endDate: g.deadline ? new Date(g.deadline).toLocaleDateString() : "",
          organizer: g.organizerDisplayName ?? "Gift organizer",
          recentContributions: g.recentContributions ?? [],
          contributeUrl: g.contributeUrl,
          recipientName: g.recipientName ?? null,
          recipientEmail: g.recipientEmail ?? null,
          recipientAddress: g.recipientAddress ?? null,
        })
      })
      .catch(() => {})
  }

  // Fetch single gift by ID when coming from Active (real UUID, not mock "1" or "2")
  useEffect(() => {
    if (!isRealGiftId) return
    let cancelled = false
    setDetailNotFound(false)
    setDetailLoading(true)
    fetch(`/api/gifts/${giftId}`, { cache: "no-store" })
      .then((res) => {
        if (cancelled) return
        if (res.ok) return res.json()
        if (res.status === 404) {
          setDetailNotFound(true)
          setFetchedGift(null)
          return
        }
        throw new Error("Failed to load gift")
      })
      .then((data) => {
        if (cancelled || !data?.gift) return
        const g = data.gift
        setFetchedGift({
          name: g.name || g.collectionTitle || g.giftName,
          description: g.description || "Help make this gift possible!",
          image: g.image || "/placeholder.svg",
          targetAmount: g.targetAmount ?? 0,
          currentAmount: g.currentAmount ?? 0,
          contributors: g.contributors ?? 0,
          daysLeft: g.daysLeft ?? 0,
          createdDate: g.created_at ? new Date(g.created_at).toLocaleDateString() : "",
          endDate: g.deadline ? new Date(g.deadline).toLocaleDateString() : "",
          organizer: g.organizerDisplayName ?? "Gift organizer",
          recentContributions: g.recentContributions ?? [],
          contributeUrl: g.contributeUrl,
          recipientName: g.recipientName ?? null,
          recipientEmail: g.recipientEmail ?? null,
          recipientAddress: g.recipientAddress ?? null,
        })
      })
      .catch(() => {
        if (!cancelled) setDetailNotFound(true)
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [giftId])

  // Refetch gift when tab becomes visible (e.g. after contributing in another tab) so amounts stay in sync
  useEffect(() => {
    if (!isRealGiftId) return
    const onVisibility = () => {
      if (document.visibilityState === "visible") refetchGift()
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
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
        toast.success("🐝 Gift link copied!", {
          style: { background: 'linear-gradient(to right, #FEF3C7, #FDE68A, #F4C430)', color: '#654321', border: '2px solid #DAA520' }
        })
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
                className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white font-medium border border-amber-400/30 shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-md px-3 py-1.5 text-[10px] w-full sm:w-auto"
              >
                <Sparkles className="w-3 h-3 mr-1" />
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
              <div className="flex flex-wrap gap-1">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all border ${
                      selectedCategory === category
                        ? "bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-400 text-white border-transparent shadow-sm"
                        : "bg-white text-amber-700 border-amber-200 hover:border-amber-400 hover:bg-amber-50"
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

                    <div className="flex gap-1 pt-2 border-t border-amber-100">
                      <Button
                        onClick={(e) => {
                          e.preventDefault()
                          toggleFavorite(gift.id)
                        }}
                        variant="outline"
                        size="sm"
                        className={`flex-1 text-[10px] px-1.5 py-1 transition-all rounded-md ${
                          favorites.has(gift.id)
                            ? "bg-gradient-to-r from-red-500 to-rose-500 text-white border-transparent shadow-sm"
                            : "border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400"
                        }`}
                      >
                        <Heart
                          className={`w-3 h-3 mr-0.5 ${favorites.has(gift.id) ? "fill-white" : ""}`}
                        />
                        Save
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.preventDefault()
                          shareGift(gift)
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 transition-all text-[10px] px-1.5 py-1 rounded-md"
                      >
                        <Share2 className="w-3 h-3 mr-0.5" />
                        Share
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.preventDefault()
                          getAiInsight(gift.id, gift.name, gift.category)
                        }}
                        className="flex-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white font-medium border border-amber-400/30 shadow-sm hover:shadow-md transition-all rounded-md text-[10px] px-1.5 py-1"
                      >
                        <Sparkles className="w-3 h-3 mr-0.5" />
                        AI
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-amber-700 mb-3 text-[10px]">Can't find what you're looking for?</p>
            <Link href="/gifts/create">
              <Button className="group relative w-auto px-3 py-1.5 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#8B4513] rounded-md font-semibold overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 hover:from-[#F4C430] hover:to-[#DAA520] active:scale-95 text-[10px] border border-[#DAA520]/30">
                <span className="relative z-10 flex items-center justify-center gap-1">
                  Create Your Own Gift Collection
                  <ArrowRight className="w-3 h-3" />
                </span>
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

  // Use fetched gift (from API) when coming from Active, else mock giftDetails for ids "1" and "2"
  const gift = fetchedGift ?? giftDetails[giftId as keyof typeof giftDetails]

  // Loading state when fetching a real gift by ID
  if (detailLoading && !gift && giftId !== "browse" && giftId !== "create") {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#DAA520] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#654321] font-medium">Loading gift...</p>
        </div>
      </div>
    )
  }

  if (!gift && giftId !== "create" && !detailLoading) {
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

  const progressPercentage = gift.targetAmount > 0 ? (gift.currentAmount / gift.targetAmount) * 100 : 0
  const goalReached = progressPercentage >= 100

  const handleContribute = async () => {
    if (!isRealGiftId || typeof giftId !== "string") {
      toast.success("Opening contribution form...")
      return
    }
    if (goalReached) {
      toast.info("The main gift is fully funded! Your contribution will be added to an Amazon eGift Card bonus for the recipient.", {
        duration: 6000,
        style: { background: "linear-gradient(to right, #FEF3C7, #FDE68A)", color: "#654321", border: "2px solid #DAA520" },
      })
    }
    if (fetchedGift?.contributeUrl) {
      window.location.href = fetchedGift.contributeUrl
      return
    }
    setContributing(true)
    try {
      const res = await fetch(`/api/gifts/${giftId}/magic-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enableReminders: true, colorTheme: "gold", invitationMessage: "", expiresInDays: 30 }),
      })
      const data = await res.json()
      const url = data?.magicLink?.url
      if (url) {
        setFetchedGift((prev) => (prev ? { ...prev, contributeUrl: url } : null))
        window.location.href = url
      } else {
        toast.error("Could not open contribution form. Please try again.")
      }
    } catch {
      toast.error("Could not open contribution form. Please try again.")
    } finally {
      setContributing(false)
    }
  }

  const copyMagicLink = async () => {
    if (magicLink) {
      await navigator.clipboard.writeText(magicLink)
      setCopied(true)
      toast.success("🐝 Link copied!", {
        style: { background: 'linear-gradient(to right, #FEF3C7, #FDE68A, #F4C430)', color: '#654321', border: '2px solid #DAA520' }
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareViaEmail = () => {
    if (magicLink) {
      const subject = encodeURIComponent(`You're invited to contribute to ${gift.name}`)
      const body = encodeURIComponent(`Hi!\n\nYou're invited to contribute to a special gift:\n\n${gift.name}\n\n${gift.description}\n\nClick here to contribute: ${magicLink}\n\nThank you!`)
      window.open(`mailto:?subject=${subject}&body=${body}`)
    }
  }

  const shareViaWhatsApp = () => {
    if (magicLink) {
      const text = encodeURIComponent(`🎁 You're invited to contribute to ${gift.name}!\n\n${magicLink}`)
      window.open(`https://wa.me/?text=${text}`)
    }
  }

  return (
    <>
      {/* Share Modal */}
      {showShareModal && magicLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#DAA520] to-[#F4C430] flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Share Your Gift</h2>
                    <p className="text-xs text-white/70">Invite friends to contribute</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-center mb-4">
                <p className="text-[#654321] font-semibold">🎉 Your gift is now live!</p>
                <p className="text-sm text-[#8B4513]/70">Share this link with friends and family</p>
              </div>
              
              {/* Magic Link */}
              <div className="bg-[#F5F1E8] rounded-xl p-4">
                <p className="text-xs text-[#8B4513]/70 mb-2">Share Link</p>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={magicLink} 
                    readOnly 
                    className="flex-1 bg-white border-2 border-[#DAA520]/30 rounded-lg px-3 py-2 text-sm text-[#654321] truncate"
                  />
                  <button
                    onClick={copyMagicLink}
                    className="px-4 py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] rounded-lg font-semibold text-sm hover:scale-105 transition-all flex items-center gap-1"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              
              {/* Share Options */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={copyMagicLink}
                  className="flex flex-col items-center gap-2 p-4 bg-[#F5F1E8] rounded-xl hover:bg-[#DAA520]/10 transition-colors"
                >
                  <Copy className="w-6 h-6 text-[#DAA520]" />
                  <span className="text-xs text-[#654321] font-medium">Copy Link</span>
                </button>
                <button
                  onClick={shareViaEmail}
                  className="flex flex-col items-center gap-2 p-4 bg-[#F5F1E8] rounded-xl hover:bg-[#DAA520]/10 transition-colors"
                >
                  <Mail className="w-6 h-6 text-[#DAA520]" />
                  <span className="text-xs text-[#654321] font-medium">Email</span>
                </button>
                <button
                  onClick={shareViaWhatsApp}
                  className="flex flex-col items-center gap-2 p-4 bg-[#F5F1E8] rounded-xl hover:bg-[#DAA520]/10 transition-colors"
                >
                  <MessageCircle className="w-6 h-6 text-[#DAA520]" />
                  <span className="text-xs text-[#654321] font-medium">WhatsApp</span>
                </button>
              </div>
              
              {/* Preview Link */}
              <a
                href={magicLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] font-bold rounded-xl hover:scale-[1.02] transition-all shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                Preview Contribution Page
              </a>
            </div>
          </div>
        </div>
      )}
      
    
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
              <div className="mt-4 p-4 bg-gradient-to-br from-[#F5DEB3] to-[#EDD9A3] rounded-xl border border-[#DAA520]/30 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8B6914] mb-3">Organized by</h3>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#DAA520]/40 text-[#654321] font-bold text-lg">
                    {gift.organizer?.charAt(0)?.toUpperCase() || <User className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-semibold text-[#654321]">{gift.organizer}</p>
                    <p className="text-xs text-[#8B4513]/80">Organizing this collection</p>
                  </div>
                </div>
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
                {gift.recipientName?.trim() && (
                  <div className="flex items-center gap-3 text-[#8B4513]">
                    <User className="w-5 h-5 text-[#DAA520]" />
                    <span>
                      <span className="font-medium text-[#654321]">Recipient Name:</span>{" "}
                      {gift.recipientName}
                    </span>
                  </div>
                )}
                {gift.recipientEmail?.trim() && (
                  <div className="flex items-center gap-3 text-[#8B4513]">
                    <Mail className="w-5 h-5 text-[#DAA520]" />
                    <span>
                      <span className="font-medium text-[#654321]">Recipient Email:</span>{" "}
                      <a href={`mailto:${gift.recipientEmail}`} className="text-[#B8860B] hover:underline">
                        {gift.recipientEmail}
                      </a>
                    </span>
                  </div>
                )}
                {gift.recipientAddress &&
                  (gift.recipientAddress.line1 ||
                    gift.recipientAddress.line2 ||
                    gift.recipientAddress.city ||
                    gift.recipientAddress.state ||
                    gift.recipientAddress.zip ||
                    gift.recipientAddress.country) && (
                  <div className="flex items-start gap-3 text-[#8B4513]">
                    <MapPin className="w-5 h-5 text-[#DAA520] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-[#654321]">Recipient Address:</span>
                      <address className="not-italic text-sm mt-1 space-y-0.5">
                        {gift.recipientAddress.line1 && <span className="block">{gift.recipientAddress.line1}</span>}
                        {gift.recipientAddress.line2 && <span className="block">{gift.recipientAddress.line2}</span>}
                        {(gift.recipientAddress.city ||
                          gift.recipientAddress.state ||
                          gift.recipientAddress.zip ||
                          gift.recipientAddress.country) && (
                          <span className="block">
                            {[gift.recipientAddress.city, gift.recipientAddress.state, gift.recipientAddress.zip]
                              .filter(Boolean)
                              .join(", ")}
                            {gift.recipientAddress.country && (
                              <span>
                                {gift.recipientAddress.city || gift.recipientAddress.state || gift.recipientAddress.zip ? " " : ""}
                                {gift.recipientAddress.country}
                              </span>
                            )}
                          </span>
                        )}
                      </address>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-[#8B4513]/70">Progress</span>
                  <span className="flex items-center gap-2">
                    {goalReached && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#DAA520]/20 text-[#654321] font-semibold text-xs">
                        <PartyPopper className="w-3.5 h-3.5 text-[#DAA520]" />
                        Goal Reached!
                      </span>
                    )}
                    <span className="font-bold text-[#654321]">{Math.round(progressPercentage)}%</span>
                  </span>
                </div>
                <div className="w-full bg-[#F5DEB3] rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, progressPercentage)}%` }}
                  />
                </div>
              </div>

              <button
                onClick={handleContribute}
                disabled={contributing}
                className="w-full px-3 py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-md font-semibold text-sm hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {contributing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Opening...
                  </>
                ) : goalReached ? (
                  "Add to the Bonus"
                ) : (
                  "Contribute Now"
                )}
              </button>
              {goalReached && (
                <p className="text-xs text-[#8B4513]/80 mt-2 text-center">
                  Extra contributions go to an Amazon eGift Card bonus for the recipient. The organizer can settle the balance from Active Gifts.
                </p>
              )}
            </div>
          </div>

          <div className="border-t-2 border-[#DAA520]/20 p-6 md:p-8 bg-gradient-to-b from-white/50 to-transparent">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#654321]">Recent Contributions</h2>
                {(gift.contributors ?? 0) > 0 || gift.recentContributions.length > 0 ? (
                  <p className="text-sm text-[#8B4513]/80 mt-0.5">
                    {(gift.contributors ?? 0) > 0
                      ? `${gift.contributors} ${gift.contributors === 1 ? "person has" : "people have"} contributed — thank you!`
                      : `${gift.recentContributions.length} ${gift.recentContributions.length === 1 ? "person has" : "people have"} contributed — thank you!`}
                  </p>
                ) : (
                  <p className="text-sm text-[#8B4513]/70 mt-0.5">Thank you to everyone who contributes</p>
                )}
              </div>
              {((gift.contributors ?? 0) > 0 || gift.recentContributions.length > 0) && (
                <p className="text-xs text-[#8B4513]/60">
                  ${((gift.currentAmount ?? 0) > 0 ? Number(gift.currentAmount).toFixed(2) : gift.recentContributions.reduce((sum, c) => sum + Number(c.amount), 0).toFixed(2))} from donors
                </p>
              )}
            </div>
            <div className="space-y-3">
              {gift.recentContributions.length === 0 ? (
                (gift.contributors ?? 0) > 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-6 bg-[#F5F1E8]/70 rounded-xl border-2 border-dashed border-[#DAA520]/30">
                    <p className="font-semibold text-[#654321]">{gift.contributors} {gift.contributors === 1 ? "person" : "people"} contributed — thank you!</p>
                    <p className="text-sm text-[#8B4513]/80 mt-1 text-center max-w-sm">
                      Past contributions weren’t stored by name/email. From now on, every new contribution will show name, email, and amount here.
                    </p>
                    {isRealGiftId && giftId && (
                      <button
                        type="button"
                        onClick={async () => {
                          setBackfillLoading(true)
                          try {
                            const res = await fetch(`/api/gifts/${giftId}/backfill-contributions`, { method: "POST" })
                            const data = await res.json().catch(() => ({}))
                            if (res.ok && data?.success && data?.count > 0) {
                              refetchGift()
                              toast.success(`Loaded ${data.count} contribution details.`)
                            } else if (res.ok && data?.success) {
                              toast.info("No stored details to load. New contributions will appear here.")
                            } else {
                              toast.error(data?.error || "Could not load contribution details.")
                            }
                          } finally {
                            setBackfillLoading(false)
                          }
                        }}
                        disabled={backfillLoading}
                        className="mt-4 px-4 py-2 rounded-lg bg-[#DAA520]/20 text-[#654321] font-medium hover:bg-[#DAA520]/30 disabled:opacity-60 transition-colors text-sm"
                      >
                        {backfillLoading ? "Loading…" : "Try loading stored details"}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 px-6 bg-[#F5F1E8]/70 rounded-xl border-2 border-dashed border-[#DAA520]/30">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#DAA520]/20 mb-3">
                      <GiftIcon className="h-7 w-7 text-[#DAA520]" />
                    </div>
                    <p className="font-semibold text-[#654321]">No contributions yet</p>
                    <p className="text-sm text-[#8B4513]/80 mt-1">Be the first to contribute and help reach the goal!</p>
                  </div>
                )
              ) : (
                gift.recentContributions.map((contribution, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-[#F5F1E8] rounded-xl border border-[#DAA520]/20 hover:border-[#DAA520]/40 hover:bg-[#F0EBE0] transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DAA520]/30 text-[#654321] font-bold text-sm ring-2 ring-[#DAA520]/20">
                        {contribution.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[#654321] truncate">{contribution.name}</p>
                        {contribution.email && (
                          <p className="text-xs text-[#8B4513]/70 truncate" title={contribution.email}>{contribution.email}</p>
                        )}
                        <p className="text-xs text-[#8B4513]/60">{contribution.time}</p>
                      </div>
                    </div>
                    <span className="font-bold text-[#B8860B] text-base shrink-0 ml-2">${Number(contribution.amount).toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
