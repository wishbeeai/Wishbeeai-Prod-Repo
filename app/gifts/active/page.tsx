"use client"

import {
  ArrowLeft,
  Clock,
  Users,
  Share2,
  Sparkles,
  TrendingUp,
  Target,
  ShoppingCart,
  Package,
  Gift,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState } from "react"

export default function ActiveGiftsPage() {
  const router = useRouter()
  const [loadingAI, setLoadingAI] = useState<number | null>(null)
  const [aiInsights, setAiInsights] = useState<{ [key: number]: any }>({})
  const [sharingGift, setSharingGift] = useState<number | null>(null)
  const [remindingGift, setRemindingGift] = useState<number | null>(null)

  const activeGifts = [
    {
      id: 1,
      name: "Sarah's Birthday Gift",
      image: "/images/espresso-machine.webp",
      targetAmount: 500,
      currentAmount: 350,
      contributors: 8,
      daysLeft: 5,
      urgency: "high",
    },
    {
      id: 2,
      name: "Team Appreciation Gift",
      image: "/colorful-gift-box.png",
      targetAmount: 300,
      currentAmount: 180,
      contributors: 12,
      daysLeft: 10,
      urgency: "medium",
    },
    {
      id: 3,
      name: "Dad's Retirement Celebration",
      image: "/images/retirement-celebration.jpg",
      targetAmount: 800,
      currentAmount: 620,
      contributors: 15,
      daysLeft: 3,
      urgency: "high",
    },
    {
      id: 4,
      name: "Baby Shower for Emma",
      image: "/colorful-gift-box.png",
      targetAmount: 400,
      currentAmount: 250,
      contributors: 10,
      daysLeft: 12,
      urgency: "low",
    },
    {
      id: 5,
      name: "Office Holiday Party Fund",
      image: "/images/espresso-machine.webp",
      targetAmount: 1000,
      currentAmount: 450,
      contributors: 25,
      daysLeft: 7,
      urgency: "medium",
    },
    {
      id: 6,
      name: "Wedding Gift for Alex & Jamie",
      image: "/images/wedding-gift.jpg",
      targetAmount: 600,
      currentAmount: 540,
      contributors: 18,
      daysLeft: 4,
      urgency: "high",
    },
  ]

  const giftProducts = [
    {
      id: 1,
      name: "De'Longhi Espresso Machine",
      image: "/images/espresso-machine.webp",
      price: 499.99,
      store: "Williams Sonoma",
      category: "Kitchen Appliances",
      description:
        "Professional-grade espresso machine with built-in grinder and milk frother. Perfect for coffee lovers.",
      attributes: {
        Color: "Stainless Steel",
        Brand: "De'Longhi",
        Capacity: "2L Water Tank",
        Features: "Built-in Grinder, Milk Frother",
        Warranty: "2 years",
      },
      link: "https://www.williams-sonoma.com/products/delonghi-espresso",
      stockStatus: "In Stock",
      forGift: "Sarah's Birthday Gift",
    },
    {
      id: 2,
      name: "Luxury Spa Gift Set",
      image: "/luxury-spa-gift-set.jpg",
      price: 129.99,
      store: "Nordstrom",
      category: "Beauty & Wellness",
      description: "Premium spa gift set with organic bath products, aromatherapy candles, and plush bathrobe.",
      attributes: {
        Brand: "L'Occitane",
        Items: "6-piece set",
        Scent: "Lavender & Vanilla",
        Material: "100% Organic",
      },
      link: "https://www.nordstrom.com/spa-gift-set",
      stockStatus: "In Stock",
      forGift: "Team Appreciation Gift",
    },
    {
      id: 3,
      name: "Premium Golf Club Set",
      image: "/golf-club-set.jpg",
      price: 749.0,
      store: "Golf Galaxy",
      category: "Sports Equipment",
      description: "Complete golf club set with driver, irons, wedges, putter, and premium carry bag.",
      attributes: {
        Brand: "Callaway",
        Hand: "Right-handed",
        Clubs: "11-piece complete set",
        Material: "Graphite Shaft",
        "Skill Level": "Intermediate to Advanced",
      },
      link: "https://www.golfgalaxy.com/callaway-set",
      stockStatus: "Low Stock",
      forGift: "Dad's Retirement Celebration",
    },
    {
      id: 4,
      name: "Smart Baby Monitor System",
      image: "/smart-baby-monitor.jpg",
      price: 199.99,
      store: "Buy Buy Baby",
      category: "Baby Products",
      description: "HD video baby monitor with night vision, two-way audio, and smartphone connectivity.",
      attributes: {
        Brand: "Nanit",
        Features: "HD Video, Night Vision, Two-way Audio",
        Connectivity: "WiFi, Smartphone App",
        Display: "5-inch HD Screen",
        Range: "1000 ft",
      },
      link: "https://www.buybuybaby.com/nanit-monitor",
      stockStatus: "In Stock",
      forGift: "Baby Shower for Emma",
    },
  ]

  const handleViewDetails = (giftId: number, giftName: string) => {
    toast.success(`Opening details for "${giftName}"`)
    router.push(`/gifts/${giftId}`)
  }

  const handleShare = async (giftId: number, giftName: string) => {
    setSharingGift(giftId)

    try {
      const response = await fetch(`/api/gifts/${giftId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftId,
          giftName,
          sharedBy: "Current User",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate share link")
      }

      const shareUrl = data.shareUrl

      if (navigator.share) {
        try {
          await navigator.share({
            title: `Contribute to ${giftName}`,
            text: `Join us in contributing to ${giftName}! Every contribution counts.`,
            url: shareUrl,
          })
          toast.success("Share successful!")
        } catch (error) {
          if ((error as Error).name !== "AbortError") {
            await copyToClipboard(shareUrl, giftName)
          }
        }
      } else {
        await copyToClipboard(shareUrl, giftName)
      }
    } catch (error) {
      console.error("[v0] Share error:", error)
      toast.error("Failed to share gift. Please try again.")
    } finally {
      setSharingGift(null)
    }
  }

  const copyToClipboard = async (url: string, giftName: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success(`Link for "${giftName}" copied to clipboard!`)
    } catch (error) {
      toast.error("Failed to copy link. Please try again.")
    }
  }

  const getAIInsights = async (giftId: number, gift: any) => {
    setLoadingAI(giftId)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    const percentageReached = (gift.currentAmount / gift.targetAmount) * 100
    const avgContribution = gift.currentAmount / gift.contributors
    const neededPerDay = (gift.targetAmount - gift.currentAmount) / gift.daysLeft

    const insights = {
      likelihood: percentageReached > 70 ? "High" : percentageReached > 40 ? "Medium" : "Low",
      recommendation:
        gift.daysLeft < 5
          ? "Send urgent reminders to contributors"
          : percentageReached < 50
            ? "Consider reaching out to potential new contributors"
            : "On track! Keep the momentum going",
      predictedCompletion:
        (gift.targetAmount - gift.currentAmount) / (gift.currentAmount / gift.contributors) <= gift.contributors
          ? `${Math.ceil((gift.targetAmount - gift.currentAmount) / avgContribution)} more contributions needed`
          : `May need ${Math.ceil((neededPerDay * gift.daysLeft) / avgContribution)} more contributors`,
      optimalAction:
        gift.urgency === "high"
          ? "Send personalized messages to inactive contributors today"
          : "Schedule automated reminders for the next 2 days",
    }

    setAiInsights((prev) => ({ ...prev, [giftId]: insights }))
    setLoadingAI(null)
    toast.success("AI insights generated!")
  }

  const sendReminder = async (giftId: number, giftName: string, contributors: number) => {
    setRemindingGift(giftId)

    try {
      const response = await fetch(`/api/gifts/${giftId}/remind`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftId,
          giftName,
          contributors,
          message: `Don't forget to contribute to ${giftName}! We're almost there.`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reminders")
      }

      toast.success(data.message)
    } catch (error) {
      console.error("[v0] Reminder error:", error)
      toast.error("Failed to send reminders. Please try again.")
    } finally {
      setRemindingGift(null)
    }
  }

  const handleBuyGift = (product: any) => {
    toast.success(`Opening store page for "${product.name}"`)
    window.open(product.link, "_blank")
  }

  const handleAddToCart = (product: any) => {
    toast.success(`"${product.name}" added to your cart for ${product.forGift}`)
  }

  const getUrgencyBadge = (urgency: string) => {
    const styles = {
      high: "bg-gradient-to-r from-rose-500 to-red-500 text-white",
      medium: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
      low: "bg-gradient-to-r from-emerald-500 to-green-500 text-white",
    }
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs sm:text-sm font-semibold ${styles[urgency as keyof typeof styles]}`}
      >
        {urgency === "high" ? "🔥 Urgent" : urgency === "medium" ? "⚡ Active" : "✅ On Track"}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors text-xs sm:text-sm md:text-base"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          Back to Home
        </Link>

        <div className="mb-8">
          {/* Header */}
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <div className="flex flex-row items-center justify-center gap-2">
              <Gift className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#DAA520] flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-foreground whitespace-nowrap">
                Active Gift Collections
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2">
              Manage your ongoing group gift collections with AI-powered insights
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border-2 border-[#DAA520]/20">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#DAA520] to-[#F4C430] flex items-center justify-center">
                <Target className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-[#8B4513]/70">Total Goal</p>
                <p className="text-base sm:text-2xl font-bold text-[#654321]">
                  ${activeGifts.reduce((sum, g) => sum + g.targetAmount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <TrendingUp className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-[#8B4513]/70">Total Raised</p>
                <p className="text-base sm:text-2xl font-bold text-[#654321]">
                  ${activeGifts.reduce((sum, g) => sum + g.currentAmount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-orange-500/20">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Users className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-[#8B4513]/70">Total Contributors</p>
                <p className="text-base sm:text-2xl font-bold text-[#654321]">
                  {activeGifts.reduce((sum, g) => sum + g.contributors, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeGifts.map((gift) => (
            <div
              key={gift.id}
              className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <img
                  src={gift.image || "/placeholder.svg"}
                  alt={gift.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border-2 border-[#DAA520]"
                />
                {getUrgencyBadge(gift.urgency)}
              </div>

              <h3 className="text-base sm:text-lg font-bold text-black mb-3">{gift.name}</h3>

              <div className="flex items-center gap-4 text-xs sm:text-sm text-[#8B4513]/70 mb-4">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                  {gift.contributors}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600" />
                  {gift.daysLeft}d left
                </span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-xs sm:text-sm mb-2">
                  <span className="text-[#8B4513]/70">Progress</span>
                  <span className="font-bold text-[#654321]">
                    ${gift.currentAmount} / ${gift.targetAmount}
                  </span>
                </div>
                <div className="w-full bg-[#F5DEB3] rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] h-full rounded-full transition-all duration-500"
                    style={{ width: `${(gift.currentAmount / gift.targetAmount) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] sm:text-xs text-[#8B4513]/60 mt-1">
                  {Math.round((gift.currentAmount / gift.targetAmount) * 100)}% funded
                </p>
              </div>

              {aiInsights[gift.id] && (
                <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 rounded-lg p-3 mb-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
                    <span className="text-[10px] sm:text-xs font-semibold text-[#654321]">AI Insights</span>
                  </div>
                  <div className="space-y-1 text-[10px] sm:text-xs text-[#8B4513]">
                    <p>
                      <span className="font-semibold">Success Likelihood:</span> {aiInsights[gift.id].likelihood}
                    </p>
                    <p>
                      <span className="font-semibold">Recommendation:</span> {aiInsights[gift.id].recommendation}
                    </p>
                    <p>
                      <span className="font-semibold">Prediction:</span> {aiInsights[gift.id].predictedCompletion}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex gap-2 md:gap-4">
                  <button
                    onClick={() => handleViewDetails(gift.id, gift.name)}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-lg text-xs sm:text-sm font-semibold hover:shadow-lg transition-all hover:scale-105"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleShare(gift.id, gift.name)}
                    disabled={sharingGift === gift.id}
                    className="w-16 sm:w-20 md:w-24 px-2 sm:px-3 py-2 border-2 border-[#DAA520] text-[#8B5A3C] rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#DAA520]/10 transition-all flex items-center justify-center gap-1 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Share2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                    {sharingGift === gift.id ? "..." : "Share"}
                  </button>
                </div>

                <div className="flex gap-2 md:gap-4">
                  <button
                    onClick={() => getAIInsights(gift.id, gift)}
                    disabled={loadingAI === gift.id}
                    className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white rounded-lg text-xs sm:text-sm font-semibold hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">
                      {loadingAI === gift.id ? "Analyzing..." : aiInsights[gift.id] ? "Refresh AI" : "Get AI Insights"}
                    </span>
                    <span className="xs:hidden">
                      {loadingAI === gift.id ? "Analyzing..." : aiInsights[gift.id] ? "Refresh" : "AI Insights"}
                    </span>
                  </button>
                  <button
                    onClick={() => sendReminder(gift.id, gift.name, gift.contributors)}
                    disabled={remindingGift === gift.id}
                    className="w-16 sm:w-20 md:w-24 px-2 sm:px-3 py-2 border-2 border-amber-500 text-[#8B5A3C] rounded-lg text-xs sm:text-sm font-semibold hover:bg-amber-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {remindingGift === gift.id ? "Sending..." : "Remind"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12">
          {/* Recommended Gifts to Purchase */}
          <div className="mb-6 flex flex-row items-center justify-center gap-2">
            <Package className="w-4 h-4 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#DAA520] flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-black whitespace-nowrap">
              Recommended Gifts to Purchase
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#8B4513]/70 text-center mb-6">
            Browse and buy gifts for your active collections
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {giftProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 overflow-hidden hover:shadow-xl transition-all hover:scale-[1.02] flex flex-col"
              >
                {/* Product Image */}
                <div className="relative h-48 bg-gray-100 flex-shrink-0">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-contain p-4"
                  />
                  {product.stockStatus === "Low Stock" && (
                    <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                      Low Stock
                    </span>
                  )}
                </div>

                {/* For Gift Badge */}
                <div className="p-4 flex flex-col flex-grow">
                  <div className="mb-2 flex-shrink-0">
                    <span className="text-xs bg-gradient-to-r from-amber-100 to-yellow-100 text-black px-2 py-1 rounded-full font-semibold truncate block max-w-full">
                      For: {product.forGift}
                    </span>
                  </div>

                  {/* Product Title */}
                  <div className="h-12 mb-2 flex-shrink-0">
                    <h3 className="font-bold text-base sm:text-lg text-black line-clamp-2 leading-tight">
                      {product.name}
                    </h3>
                  </div>

                  {/* Store and Category */}
                  <div className="mb-2 h-10 flex-shrink-0 flex flex-col gap-1">
                    <p className="text-xs text-gray-700 font-semibold truncate">
                      <span className="text-gray-500">Brand:</span> {product.attributes.Brand || product.store}
                    </p>
                    <span className="text-xs text-gray-500">Category: {product.category}</span>
                  </div>

                  {/* Price */}
                  <div className="mb-3 h-7 flex-shrink-0">
                    <span className="text-sm sm:text-lg md:text-xl font-bold text-[#DAA520]">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="h-10 mb-3 flex-shrink-0">
                    <p className="text-xs text-gray-600 line-clamp-2">{product.description}</p>
                  </div>

                  {/* Product Attributes */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4 min-h-[140px] flex-grow">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">Product Details</h4>
                    <div className="space-y-1 text-xs">
                      {Object.entries(product.attributes).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-semibold text-gray-700">{key}:</span>{" "}
                          <span className="text-gray-600">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 flex-shrink-0">
                    <button
                      onClick={() => handleBuyGift(product)}
                      className="w-full px-3 py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-black rounded-lg text-xs sm:text-sm font-semibold hover:shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Buy Now
                    </button>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="w-full px-3 py-2 border-2 border-[#DAA520] text-[#8B5A3C] rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#DAA520]/10 transition-all"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
