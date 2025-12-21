"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, Clock, Search, Filter } from "lucide-react"
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
}

export default function BrowseGiftsPage() {
  const router = useRouter()
  const [gifts, setGifts] = useState<Gift[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  useEffect(() => {
    console.log("[v0] Browse gifts page is rendering - route is working!")
  }, [])

  // Fetch gifts from API
  useEffect(() => {
    async function fetchGifts() {
      try {
        console.log("[v0] Fetching gifts from API...")
        const response = await fetch("/api/gifts")
        const data = await response.json()

        console.log("[v0] API response:", data)

        if (data.success && data.gifts) {
          // Add mock trending gifts for display
          const trendingGifts: Gift[] = [
            {
              id: "trending-1",
              collectionTitle: "Premium Espresso Machine",
              giftName: "Premium Espresso Machine",
              description: "A professional-grade espresso machine for coffee lovers",
              targetAmount: 899,
              currentAmount: 764,
              contributors: 24,
              deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
              image: "/professional-espresso-setup.png",
              category: "Home & Kitchen",
              createdDate: new Date().toISOString(),
              status: "active",
            },
            {
              id: "trending-2",
              collectionTitle: "Designer Handbag",
              giftName: "Designer Handbag",
              description: "Luxury designer handbag for fashion enthusiasts",
              targetAmount: 1250,
              currentAmount: 900,
              contributors: 18,
              deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
              image: "/luxury-quilted-handbag.png",
              category: "Fashion",
              createdDate: new Date().toISOString(),
              status: "active",
            },
            {
              id: "trending-3",
              collectionTitle: "Smart Home Hub Package",
              giftName: "Smart Home Hub Package",
              description: "Complete smart home automation system",
              targetAmount: 650,
              currentAmount: 617,
              contributors: 31,
              deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              image: "/smart-home-devices.jpg",
              category: "Tech",
              createdDate: new Date().toISOString(),
              status: "active",
            },
            {
              id: "trending-4",
              collectionTitle: "Professional Camera Kit",
              giftName: "Professional Camera Kit",
              description: "High-end photography equipment for professionals",
              targetAmount: 1899,
              currentAmount: 1139,
              contributors: 15,
              deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
              image: "/camera-kit-professional.jpg",
              category: "Photography",
              createdDate: new Date().toISOString(),
              status: "active",
            },
          ]

          // Combine API gifts with trending gifts
          setGifts([...trendingGifts, ...data.gifts])
        }
      } catch (error) {
        console.error("[v0] Error fetching gifts:", error)
        toast.error("Failed to load gifts")
      } finally {
        setLoading(false)
      }
    }

    fetchGifts()
  }, [])

  // Filter gifts based on search and category
  const filteredGifts = gifts.filter((gift) => {
    const matchesSearch =
      gift.giftName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gift.collectionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gift.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === "all" || gift.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const categories = ["all", ...Array.from(new Set(gifts.map((g) => g.category).filter(Boolean)))]

  const calculateProgress = (current: number, target: number) => {
    return Math.round((current / target) * 100)
  }

  const calculateDaysLeft = (deadline: string) => {
    const daysLeft = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return Math.max(0, daysLeft)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#DAA520] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#654321] font-semibold">Loading gifts...</p>
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
              <Search className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#DAA520] flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-foreground whitespace-nowrap">
                Browse All Gifts
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2">
              Discover amazing gifts and join group collections
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border-2 border-[#DAA520]/20">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#DAA520] to-[#F4C430] flex items-center justify-center">
                <Search className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-[#8B4513]/70">Available Gifts</p>
                <p className="text-base sm:text-2xl font-bold text-[#654321]">{filteredGifts.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-orange-500/20">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-300 via-coral-400 to-rose-300 flex items-center justify-center">
                <Users className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-[#8B4513]/70">Active Contributors</p>
                <p className="text-base sm:text-2xl font-bold text-[#654321]">
                  {filteredGifts.reduce((sum, g) => sum + g.contributors, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 flex items-center justify-center">
                <Clock className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-[#8B4513]/70">Avg Days Left</p>
                <p className="text-base sm:text-2xl font-bold text-[#654321]">
                  {filteredGifts.length > 0
                    ? Math.round(
                        filteredGifts.reduce((sum, g) => sum + calculateDaysLeft(g.deadline), 0) / filteredGifts.length,
                      )
                    : 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-orange-500/20">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center">
                <Filter className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-[#8B4513]/70">Categories</p>
                <p className="text-base sm:text-2xl font-bold text-[#654321]">{categories.length - 1}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#DAA520] w-5 h-5" />
            <input
              type="text"
              placeholder="Search gifts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-[#DAA520]/20 focus:border-[#DAA520] focus:outline-none bg-white text-[#654321]"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#DAA520] w-5 h-5" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-3 rounded-lg border-2 border-[#DAA520]/20 focus:border-[#DAA520] focus:outline-none bg-white appearance-none cursor-pointer text-[#654321]"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-[#8B4513] font-semibold">
            {filteredGifts.length} {filteredGifts.length === 1 ? "gift" : "gifts"} found
          </p>
        </div>

        {/* Gifts Grid */}
        {filteredGifts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎁</div>
            <h3 className="text-2xl font-bold text-[#654321] mb-2">No gifts found</h3>
            <p className="text-[#8B4513] mb-6">Try adjusting your search or filters</p>
            <Button
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory("all")
              }}
              className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] hover:from-[#B8860B] hover:to-[#DAA520] text-[#3B2F0F]"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGifts.map((gift) => {
              const progress = calculateProgress(gift.currentAmount, gift.targetAmount)
              const daysLeft = calculateDaysLeft(gift.deadline)

              return (
                <div
                  key={gift.id}
                  className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 p-6 hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => router.push(`/gifts/${gift.id}`)}
                >
                  <div className="relative mb-4">
                    <img
                      src={gift.image || gift.bannerImage || "/placeholder.svg"}
                      alt={gift.giftName}
                      className="w-full h-48 object-cover rounded-lg border-2 border-[#DAA520]"
                    />
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                      {progress}%
                    </div>
                    {gift.category && (
                      <div className="absolute top-2 left-2 bg-white/90 text-[#654321] px-2 py-1 rounded-full text-xs font-semibold">
                        {gift.category}
                      </div>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-[#654321] mb-2">{gift.giftName}</h3>
                  <p className="text-xs text-[#8B4513]/70 mb-3 line-clamp-2">{gift.description}</p>

                  <div className="space-y-2 text-xs sm:text-sm text-[#8B4513]/70 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <span className="text-[#DAA520]">💰</span>
                        Target Amount
                      </span>
                      <span className="font-bold text-[#654321]">${gift.targetAmount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4 text-[#DAA520]" />
                        Contributors
                      </span>
                      <span className="font-bold text-[#654321]">{gift.contributors}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-[#F4C430]" />
                        Days Left
                      </span>
                      <span className="font-bold text-[#654321]">{daysLeft} days</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-[#8B4513] mb-2">
                      <span className="font-semibold">${gift.currentAmount} raised</span>
                      <span className="font-semibold">{progress}%</span>
                    </div>
                    <div className="w-full bg-amber-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
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
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
