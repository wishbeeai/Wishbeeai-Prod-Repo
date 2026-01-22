"use client"

import {
  ArrowLeft,
  CheckCircle,
  Calendar,
  Share2,
  RotateCcw,
  Users,
  DollarSign,
  TrendingUp,
  Sparkles,
  Download,
  Award,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useState } from "react"

export default function PastGiftsPage() {
  const [loadingAI, setLoadingAI] = useState<number | null>(null)
  const [aiInsights, setAiInsights] = useState<{ [key: number]: any }>({})
  const [sharingGift, setSharingGift] = useState<number | null>(null)

  const pastGifts = [
    {
      id: 1,
      name: "Mom's Anniversary Gift",
      image: "/assorted-jewelry-display.png",
      totalAmount: 800,
      contributors: 15,
      completedDate: "2024-11-15",
      description: "Beautiful jewelry set to celebrate Mom's 25th anniversary",
      category: "Jewelry",
      successRate: 100,
    },
    {
      id: 2,
      name: "John's Graduation Gift",
      image: "/modern-laptop-workspace.png",
      totalAmount: 1200,
      contributors: 20,
      completedDate: "2024-10-20",
      description: "High-performance laptop for John's college graduation",
      category: "Electronics",
      successRate: 100,
    },
    {
      id: 3,
      name: "Sarah's Wedding Gift",
      image: "/images/wedding-gift.jpg",
      totalAmount: 950,
      contributors: 25,
      completedDate: "2024-09-15",
      description: "Complete kitchen appliance set for newlyweds",
      category: "Home & Kitchen",
      successRate: 100,
    },
    {
      id: 4,
      name: "Dad's Retirement Celebration",
      image: "/golf-club-set.jpg",
      totalAmount: 1500,
      contributors: 30,
      completedDate: "2024-08-10",
      description: "Premium golf club set for retirement hobby",
      category: "Sports",
      successRate: 100,
    },
  ]

  const handleShare = async (gift: (typeof pastGifts)[0]) => {
    setSharingGift(gift.id)
    const shareUrl = `${window.location.origin}/gifts/past/${gift.id}`
    const shareText = `Check out the ${gift.name} we completed together! Total: $${gift.totalAmount} from ${gift.contributors} contributors.`

    try {
      if (navigator.share) {
        await navigator.share({
          title: gift.name,
          text: shareText,
          url: shareUrl,
        })
        toast.success("Shared successfully!")
      } else {
        await navigator.clipboard.writeText(shareUrl)
        toast.success("🐝 Link copied!", {
          style: { background: 'linear-gradient(to right, #FEF3C7, #FDE68A, #F4C430)', color: '#654321', border: '2px solid #DAA520' }
        })
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        toast.error("Failed to share")
      }
    } finally {
      setSharingGift(null)
    }
  }

  const handleGiftAgain = (gift: (typeof pastGifts)[0]) => {
    toast.success(`Creating new collection similar to ${gift.name}...`)
    setTimeout(() => {
      window.location.href = `/gifts/create?template=${gift.id}`
    }, 1000)
  }

  const getAIInsights = async (giftId: number, gift: any) => {
    setLoadingAI(giftId)

    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const insights = {
      pattern: `This gift collection reached its goal quickly with high engagement from ${gift.contributors} contributors`,
      recommendation: "Great success pattern! Consider similar approach for future ${gift.category} gifts",
      avgContribution: Math.round(gift.totalAmount / gift.contributors),
      completionTime: "Completed 2 days ahead of schedule",
    }

    setAiInsights((prev) => ({ ...prev, [giftId]: insights }))
    setLoadingAI(null)
    toast.success("AI insights generated!")
  }

  const handleDownloadReceipt = (gift: any) => {
    toast.success("Generating receipt...")

    // Create receipt content
    const receiptContent = `
WISHBEE.AI - GIFT COLLECTION RECEIPT
=====================================

Gift Collection: ${gift.name}
Category: ${gift.category}
Completed Date: ${new Date(gift.completedDate).toLocaleDateString()}

SUMMARY:
- Total Amount Raised: $${gift.totalAmount}
- Number of Contributors: ${gift.contributors}
- Average Contribution: $${Math.round(gift.totalAmount / gift.contributors)}
- Success Rate: ${gift.successRate}%

Description:
${gift.description}

Thank you for using Wishbee.ai!
Your group gifting made this moment special.

Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
    `

    // Create and download the file
    const blob = new Blob([receiptContent], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `wishbee-receipt-${gift.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    toast.success("Receipt downloaded!")
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <div className="flex flex-row items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#DAA520] flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-foreground whitespace-nowrap">
                Past Gift Collections
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2">
              Browse your gift history and celebrate memorable moments
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border-2 border-[#DAA520]/20">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#DAA520] to-[#F4C430] flex items-center justify-center">
                <Award className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-[#8B4513]/70">Total Completed</p>
                <p className="text-base sm:text-2xl font-bold text-[#654321]">{pastGifts.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-orange-500/20">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-300 via-coral-400 to-rose-300 flex items-center justify-center">
                <DollarSign className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-[#8B4513]/70">Total Raised</p>
                <p className="text-base sm:text-2xl font-bold text-[#654321]">
                  ${pastGifts.reduce((sum, g) => sum + g.totalAmount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 flex items-center justify-center">
                <Users className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-[#8B4513]/70">Total Contributors</p>
                <p className="text-base sm:text-2xl font-bold text-[#654321]">
                  {pastGifts.reduce((sum, g) => sum + g.contributors, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-orange-500/20">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center">
                <TrendingUp className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-[#8B4513]/70">Success Rate</p>
                <p className="text-base sm:text-2xl font-bold text-[#654321]">100%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gift Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pastGifts.map((gift) => (
            <div
              key={gift.id}
              className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 p-6 hover:shadow-xl transition-shadow"
            >
              <div className="relative mb-4">
                <img
                  src={gift.image || "/placeholder.svg"}
                  alt={gift.name}
                  className="w-full h-48 object-cover rounded-lg border-2 border-[#DAA520]"
                />
                <div className="absolute top-2 right-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                  <CheckCircle className="w-3 h-3" />
                  Completed
                </div>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-[#654321] mb-2">{gift.name}</h3>
              <p className="text-xs text-[#8B4513]/70 mb-3 line-clamp-2">{gift.description}</p>

              <div className="space-y-2 text-xs sm:text-sm text-[#8B4513]/70 mb-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-[#DAA520]" />
                    Total Amount
                  </span>
                  <span className="font-bold text-[#654321]">${gift.totalAmount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 text-[#DAA520]" />
                    Contributors
                  </span>
                  <span className="font-bold text-[#654321]">{gift.contributors}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-[#F4C430]" />
                  <span>{new Date(gift.completedDate).toLocaleDateString()}</span>
                </div>
              </div>

              {aiInsights[gift.id] && (
                <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 rounded-lg p-3 mb-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
                    <span className="text-[10px] sm:text-xs font-semibold text-[#654321]">AI Insights</span>
                  </div>
                  <div className="space-y-1 text-[10px] sm:text-xs text-[#8B4513]">
                    <p>
                      <span className="font-semibold">Pattern:</span> {aiInsights[gift.id].pattern}
                    </p>
                    <p>
                      <span className="font-semibold">Avg Contribution:</span> ${aiInsights[gift.id].avgContribution}
                    </p>
                    <p>
                      <span className="font-semibold">Timeline:</span> {aiInsights[gift.id].completionTime}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Link
                  href={`/gifts/past/${gift.id}`}
                  className="block w-full px-3 py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-lg text-xs sm:text-sm font-semibold hover:shadow-lg transition-all text-center"
                >
                  View Details
                </Link>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleShare(gift)}
                    disabled={sharingGift === gift.id}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-orange-400 via-rose-400 to-pink-500 text-white rounded-lg text-xs sm:text-sm font-semibold hover:shadow-lg hover:from-orange-500 hover:via-rose-500 hover:to-pink-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{sharingGift === gift.id ? "..." : "Share"}</span>
                  </button>

                  <button
                    onClick={() => handleGiftAgain(gift)}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 text-white rounded-lg text-xs sm:text-sm font-semibold hover:shadow-lg hover:from-amber-500 hover:via-yellow-500 hover:to-orange-500 transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                    Gift Again
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => getAIInsights(gift.id, gift)}
                    disabled={loadingAI === gift.id}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white rounded-lg text-xs sm:text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                    {loadingAI === gift.id ? "Analyzing..." : aiInsights[gift.id] ? "Refresh AI" : "AI Insights"}
                  </button>
                  <button
                    onClick={() => handleDownloadReceipt(gift)}
                    className="w-16 sm:w-20 md:w-24 px-2 sm:px-3 py-2 border-2 border-transparent bg-clip-padding rounded-lg text-xs sm:text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center"
                    style={{
                      background: "white",
                      backgroundClip: "padding-box",
                      border: "2px solid transparent",
                      backgroundImage: "linear-gradient(white, white), linear-gradient(to right, #DAA520, #F4C430)",
                      backgroundOrigin: "border-box",
                      backgroundClip: "padding-box, border-box",
                    }}
                  >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4 text-[#DAA520]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
