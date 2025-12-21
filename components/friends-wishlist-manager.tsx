"use client"

import { useState, useEffect, useRef } from "react"
import {
  Gift,
  TrendingUp,
  Heart,
  Sparkles,
  Brain,
  RefreshCw,
  Search,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Palette,
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface WishlistItem {
  id: string
  productName: string
  productImage: string
  price: number
  storeName: string
  url: string
  priority: "high" | "medium" | "low"
  addedDate: string
  contributionProgress: number
  contributionGoal: number
  contributors: number
}

interface FriendWishlist {
  id: string
  friendName: string
  friendImage: string
  upcomingOccasion?: {
    type: string
    date: string
    daysLeft: number
  }
  totalItems: number
  items: WishlistItem[]
  relationshipScore: number
  giftingHistory: number
}

export default function FriendsWishlistManager() {
  const [friends, setFriends] = useState<FriendWishlist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFriend, setSelectedFriend] = useState<FriendWishlist | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiInsights, setAiInsights] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"occasion" | "recent" | "priority">("occasion")
  const [filterPriority, setFilterPriority] = useState<"all" | "high" | "medium" | "low">("all")
  const [showContributionModal, setShowContributionModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null)
  const [selectedFriendForContribution, setSelectedFriendForContribution] = useState<FriendWishlist | null>(null)
  const [contributionAmount, setContributionAmount] = useState("")
  const [contributionMessage, setContributionMessage] = useState("")
  const [contributorName, setContributorName] = useState("")
  const [contributorEmail, setContributorEmail] = useState("")
  const [isContributing, setIsContributing] = useState(false)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const messageEditorRef = useRef<HTMLDivElement>(null)
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false)
  const [contributionOccasion, setContributionOccasion] = useState("birthday")

  useEffect(() => {
    loadFriendsWishlists()
  }, [])

  const loadFriendsWishlists = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const mockFriends: FriendWishlist[] = [
      {
        id: "1",
        friendName: "Sarah Johnson",
        friendImage: "/diverse-woman-portrait.png",
        upcomingOccasion: {
          type: "Birthday",
          date: "2024-02-15",
          daysLeft: 12,
        },
        totalItems: 8,
        relationshipScore: 95,
        giftingHistory: 5,
        items: [
          {
            id: "item1",
            productName: "Wireless Noise-Canceling Headphones",
            productImage: "/diverse-people-listening-headphones.png",
            price: 299.99,
            storeName: "Best Buy",
            url: "https://example.com/headphones",
            priority: "high",
            addedDate: "2024-01-28",
            contributionProgress: 180,
            contributionGoal: 300,
            contributors: 3,
          },
          {
            id: "item2",
            productName: "Yoga Mat & Block Set",
            productImage: "/rolled-yoga-mat.png",
            price: 79.99,
            storeName: "Amazon",
            url: "https://example.com/yoga",
            priority: "medium",
            addedDate: "2024-01-25",
            contributionProgress: 40,
            contributionGoal: 80,
            contributors: 2,
          },
        ],
      },
      {
        id: "2",
        friendName: "Michael Chen",
        friendImage: "/man.jpg",
        upcomingOccasion: {
          type: "Graduation",
          date: "2024-03-20",
          daysLeft: 45,
        },
        totalItems: 5,
        relationshipScore: 88,
        giftingHistory: 3,
        items: [
          {
            id: "item3",
            productName: "Professional Camera Kit",
            productImage: "/vintage-camera-still-life.png",
            price: 1299.0,
            storeName: "B&H Photo",
            url: "https://example.com/camera",
            priority: "high",
            addedDate: "2024-01-20",
            contributionProgress: 650,
            contributionGoal: 1300,
            contributors: 5,
          },
        ],
      },
      {
        id: "3",
        friendName: "Emily Rodriguez",
        friendImage: "/professional-woman.png",
        upcomingOccasion: {
          type: "Anniversary",
          date: "2024-02-28",
          daysLeft: 25,
        },
        totalItems: 12,
        relationshipScore: 92,
        giftingHistory: 7,
        items: [
          {
            id: "item4",
            productName: "Designer Handbag",
            productImage: "/stylish-leather-handbag.png",
            price: 549.99,
            storeName: "Nordstrom",
            url: "https://example.com/handbag",
            priority: "high",
            addedDate: "2024-01-15",
            contributionProgress: 350,
            contributionGoal: 550,
            contributors: 4,
          },
        ],
      },
    ]

    setFriends(mockFriends)
    setIsLoading(false)
    toast.success("Loaded friends' wishlists successfully!")
  }

  const getAIInsights = async (friend: FriendWishlist) => {
    setIsAnalyzing(true)
    setSelectedFriend(friend)

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const insights = {
        recommendedItem: friend.items[0],
        reasoning: `Based on the upcoming ${friend.upcomingOccasion?.type} in ${friend.upcomingOccasion?.daysLeft} days, this item has the highest priority and is closest to funding goal completion.`,
        suggestedContribution: Math.round(
          (friend.items[0].contributionGoal - friend.items[0].contributionProgress) / 3,
        ),
        personalizedMessage: `"Hey! I noticed ${friend.friendName}'s ${friend.upcomingOccasion?.type} is coming up. Would you like to contribute to their ${friend.items[0].productName}? We're almost there!"`,
        budgetAnalysis: {
          totalNeeded: friend.items.reduce((sum, item) => sum + (item.contributionGoal - item.contributionProgress), 0),
          averagePerPerson: Math.round(
            friend.items.reduce((sum, item) => sum + (item.contributionGoal - item.contributionProgress), 0) / 5,
          ),
        },
      }

      setAiInsights(insights)
      toast.success("AI analysis complete!")
    } catch (error) {
      toast.error("Failed to analyze wishlist")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleContribute = (item: WishlistItem, friend: FriendWishlist) => {
    setSelectedItem(item)
    setSelectedFriendForContribution(friend)
    const remainingAmount = item.contributionGoal - item.contributionProgress
    const suggestedAmount = Math.min(Math.round(remainingAmount / 3), remainingAmount)
    setContributionAmount(suggestedAmount.toString())
    setShowContributionModal(true)
  }

  const handleViewWishlist = (friend: FriendWishlist) => {
    // Placeholder for view wishlist logic
    console.log("Viewing wishlist for", friend.friendName)
  }

  const submitContribution = async () => {
    if (
      !selectedItem ||
      !selectedFriendForContribution ||
      !contributionAmount ||
      !contributorName ||
      !contributorEmail
    ) {
      toast.error("Please fill in all required fields")
      return
    }

    const amount = Number.parseFloat(contributionAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (amount > selectedItem.contributionGoal - selectedItem.contributionProgress) {
      toast.error("Amount exceeds remaining goal")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(contributorEmail)) {
      toast.error("Please enter a valid email address")
      return
    }

    setIsContributing(true)

    try {
      const response = await fetch("/api/contributions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          friendId: selectedFriendForContribution.id,
          itemId: selectedItem.id,
          amount,
          message: contributionMessage,
          contributorName: contributorName || "Anonymous",
          contributorEmail,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process contribution")
      }

      setFriends((prevFriends) =>
        prevFriends.map((friend) =>
          friend.id === selectedFriendForContribution.id
            ? {
                ...friend,
                items: friend.items.map((item) =>
                  item.id === selectedItem.id
                    ? {
                        ...item,
                        contributionProgress: item.contributionProgress + amount,
                        contributors: item.contributors + 1,
                      }
                    : item,
                ),
              }
            : friend,
        ),
      )

      toast.success("Contribution successful!", {
        description: `You contributed $${amount.toFixed(2)} to ${selectedItem.productName}`,
      })

      setShowContributionModal(false)
      setContributionAmount("")
      setContributionMessage("")
      setContributorName("")
      setContributorEmail("")
    } catch (error: any) {
      toast.error(error.message || "Failed to process contribution")
    } finally {
      setIsContributing(false)
    }
  }

  const generateAIMessage = async () => {
    if (!selectedItem || !selectedFriendForContribution || !contributorName) {
      toast.error("Please enter your name first to generate a personalized message")
      return
    }

    setIsGeneratingMessage(true)

    try {
      const response = await fetch("/api/ai/generate-contribution-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftName: selectedItem.productName,
          recipientName: selectedFriendForContribution.friendName,
          contributorName,
          contributionAmount: contributionAmount || "0",
          occasion: contributionOccasion,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate message")

      const data = await response.json()
      setContributionMessage(data.message)
      toast.success("AI message generated!")
    } catch (error) {
      console.error("Error generating message:", error)
      toast.error("Failed to generate message. Please try again.")
    } finally {
      setIsGeneratingMessage(false)
    }
  }

  const applyMessageFormatting = (command: string) => {
    document.execCommand(command, false)
    if (messageEditorRef.current) {
      setContributionMessage(messageEditorRef.current.innerText)
    }
  }

  const applyMessageAlignment = (alignment: string) => {
    document.execCommand(alignment, false)
  }

  const applyMessageList = (type: string) => {
    if (type === "bullet") {
      document.execCommand("insertUnorderedList", false)
    } else {
      document.execCommand("insertOrderedList", false)
    }
  }

  const applyMessageColor = (color: string) => {
    document.execCommand("foreColor", false, color)
    setShowColorPicker(false)
  }

  const insertMessageEmoji = (emoji: string) => {
    document.execCommand("insertText", false, emoji)
    if (messageEditorRef.current) {
      setContributionMessage(messageEditorRef.current.innerText)
    }
  }

  const applyMessageFontSize = (size: string) => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const span = document.createElement("span")
      span.style.fontSize = size

      try {
        range.surroundContents(span)
      } catch (e) {
        console.log("Could not apply font size")
      }
    }
  }

  const filteredFriends = friends
    .filter((friend) => friend.friendName.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "occasion") {
        return (a.upcomingOccasion?.daysLeft || 999) - (b.upcomingOccasion?.daysLeft || 999)
      } else if (sortBy === "recent") {
        return new Date(b.items[0]?.addedDate || "").getTime() - new Date(a.items[0]?.addedDate || "").getTime()
      }
      return b.relationshipScore - a.relationshipScore
    })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-[#DAA520] animate-spin mx-auto mb-4" />
          <p className="text-[#654321] text-sm sm:text-base md:text-lg font-medium">Loading friends' wishlists...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl border-2 sm:border-3 md:border-4 border-[#DAA520] p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3 md:gap-4">
            <div className="p-1.5 sm:p-2 md:p-3 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-lg sm:rounded-xl shadow-lg">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-[#654321] mb-2">
                AI-Powered Gift Intelligence
              </h3>
              <ul className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs md:text-sm text-[#8B4513]">
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-amber-600 flex-shrink-0" />
                  <span>Smart occasion tracking with urgency alerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-amber-600 flex-shrink-0" />
                  <span>Contribution recommendations based on budget and timeline</span>
                </li>
                <li className="flex items-center gap-2">
                  <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-amber-600 flex-shrink-0" />
                  <span>Personalized gift suggestions based on relationship strength</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl border-2 sm:border-3 md:border-4 border-[#DAA520] p-3 sm:p-4 md:p-6 lg:p-8 mt-4 sm:mt-6 md:mt-8">
          <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-[#8B5A3C]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search friends..."
                className="w-full pl-8 sm:pl-9 md:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base border-2 border-[#DAA520]/30 rounded-lg focus:outline-none focus:border-[#DAA520] transition-colors text-[#654321]"
              />
            </div>
            <div className="w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base border-2 border-[#DAA520]/30 rounded-lg focus:outline-none focus:border-[#DAA520] transition-colors text-[#654321]"
              >
                <option value="occasion">Sort by Occasion</option>
                <option value="recent">Sort by Recent</option>
                <option value="priority">Sort by Priority</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:gap-4 md:gap-6">
            {filteredFriends.map((friend) => (
              <div
                key={friend.id}
                className="border border-[#DAA520]/20 sm:border-2 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 lg:p-6 hover:border-[#DAA520] hover:shadow-lg transition-all"
              >
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                  <Image
                    src={friend.friendImage || "/placeholder.svg"}
                    alt={friend.friendName}
                    width={60}
                    height={60}
                    className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full border-2 sm:border-3 md:border-4 border-[#DAA520]"
                  />
                  <div className="flex-1 text-center sm:text-left w-full">
                    <div className="flex flex-col sm:flex-row items-center sm:items-center sm:justify-between gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-[#654321]">
                        {friend.friendName}
                      </h3>
                      {friend.upcomingOccasion && (
                        <div
                          className={`px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full text-[10px] sm:text-xs md:text-sm font-bold whitespace-nowrap ${"bg-gradient-to-r from-amber-400 to-orange-400 text-[#654321]"}`}
                        >
                          {friend.upcomingOccasion.type} in {friend.upcomingOccasion.daysLeft} days
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 md:gap-4 text-[10px] sm:text-xs md:text-sm text-[#8B4513]">
                      <span className="flex items-center gap-1">
                        <Gift className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                        {friend.totalItems} items
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                        {friend.giftingHistory} gifts
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                  {friend.items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#F5F1E8] rounded-lg p-2.5 sm:p-3 md:p-4 border border-[#DAA520]/20"
                    >
                      <div className="flex gap-2 sm:gap-3 md:gap-4">
                        <Image
                          src={item.productImage || "/placeholder.svg"}
                          alt={item.productName}
                          width={60}
                          height={60}
                          className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm md:text-base text-[#654321] mb-1.5 sm:mb-2 md:mb-3 line-clamp-2 h-9 sm:h-10 md:h-12">
                            {item.productName}
                          </h4>
                          <p className="text-[10px] sm:text-xs md:text-sm text-[#8B4513] mb-1.5 sm:mb-2">
                            ${item.price.toFixed(2)}
                          </p>
                          <div className="mb-1.5 sm:mb-2">
                            <div className="flex justify-between text-[9px] sm:text-[10px] md:text-xs text-[#8B4513] mb-1">
                              <span>
                                ${item.contributionProgress} / ${item.contributionGoal}
                              </span>
                              <span>{Math.round((item.contributionProgress / item.contributionGoal) * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                              <div
                                className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] h-1.5 sm:h-2 rounded-full transition-all"
                                style={{
                                  width: `${Math.min((item.contributionProgress / item.contributionGoal) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex justify-center">
                            <Button
                              onClick={() => handleContribute(item, friend)}
                              className="w-full px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-gradient-to-r from-orange-400 via-coral-400 to-rose-400 text-white rounded-lg font-bold text-[9px] sm:text-[10px] md:text-xs hover:from-orange-500 hover:via-coral-500 hover:to-rose-500 hover:shadow-lg hover:scale-105 transition-all"
                            >
                              Contribute
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 sm:mt-4 flex justify-center">
                  <Button
                    onClick={() => getAIInsights(friend)}
                    disabled={isAnalyzing}
                    className="w-full sm:w-auto sm:max-w-xs md:max-w-sm px-2 sm:px-4 md:px-6 py-1.5 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-base bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white rounded-full font-bold hover:shadow-xl hover:scale-105 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 animate-spin" />
                        <span className="hidden sm:inline">Analyzing with AI...</span>
                        <span className="sm:hidden">Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Brain className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                        <span className="hidden sm:inline">Get AI Gift Insights</span>
                        <span className="sm:hidden">AI Insights</span>
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex justify-center mt-3 sm:mt-4">
                  <Button
                    onClick={() => handleViewWishlist(friend)}
                    className="w-full sm:w-auto sm:max-w-xs md:max-w-sm px-2 sm:px-4 md:px-6 py-1.5 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-base bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#8B4513] rounded-full font-bold hover:shadow-xl hover:scale-105 hover:from-[#F4C430] hover:to-[#DAA520] transition-all flex items-center justify-center gap-1 sm:gap-2"
                  >
                    View Birthday Wishlist
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {aiInsights && selectedFriend && (
            <div className="mt-6 sm:mt-8 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 border-2 border-amber-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg">
              <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-[#654321] mb-3 sm:mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-amber-600" />
                <span className="text-sm sm:text-base md:text-xl lg:text-2xl">
                  AI Insights for {selectedFriend.friendName}
                </span>
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-white rounded-lg p-3 sm:p-4 border-2 border-amber-200">
                  <h4 className="font-bold text-xs sm:text-sm md:text-base text-[#654321] mb-2">
                    Recommended Contribution
                  </h4>
                  <p className="text-[10px] sm:text-xs md:text-sm text-[#8B4513] mb-3">{aiInsights.reasoning}</p>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-lg sm:text-xl md:text-2xl font-bold text-[#DAA520]">
                      ${aiInsights.suggestedContribution}
                    </span>
                    <span className="text-[10px] sm:text-xs md:text-sm text-[#8B4513]">suggested contribution</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 sm:p-4 border-2 border-amber-200">
                  <h4 className="font-bold text-xs sm:text-sm md:text-base text-[#654321] mb-2">
                    Personalized Message
                  </h4>
                  <p className="text-[10px] sm:text-xs md:text-sm text-[#8B4513] italic">
                    {aiInsights.personalizedMessage}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contribution Modal */}
        <Dialog open={showContributionModal} onOpenChange={setShowContributionModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Contribute to {selectedFriendForContribution?.friendName}&apos;s Gift</DialogTitle>
              <DialogDescription>Help fund {selectedItem?.productName}</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Contribution Amount */}
              <div>
                <Label className="block text-sm font-bold text-[#654321] mb-2">Contribution Amount *</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#654321] font-bold">$</span>
                  <input
                    type="number"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    min="1"
                    max={selectedItem?.contributionGoal - selectedItem?.contributionProgress}
                    step="0.01"
                    className="w-full pl-8 pr-4 py-3 border-2 border-[#DAA520]/30 rounded-lg focus:outline-none focus:border-[#DAA520] transition-colors text-[#654321] font-bold"
                    required
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[10, 25, 50].map((preset) => {
                    const remaining = selectedItem?.contributionGoal - selectedItem?.contributionProgress
                    if (preset <= remaining) {
                      return (
                        <Button
                          key={preset}
                          onClick={() => setContributionAmount(preset.toString())}
                          className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs md:text-sm bg-[#F5F1E8] border border-[#DAA520]/30 rounded-lg hover:bg-[#DAA520]/10 transition-colors text-[#654321]"
                        >
                          ${preset}
                        </Button>
                      )
                    }
                    return null
                  })}
                  <Button
                    onClick={() =>
                      setContributionAmount(
                        (selectedItem?.contributionGoal - selectedItem?.contributionProgress).toFixed(2),
                      )
                    }
                    className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs md:text-sm bg-[#F5F1E8] border border-[#DAA520]/30 rounded-lg hover:bg-[#DAA520]/10 transition-colors text-[#654321]"
                  >
                    Full Amount
                  </Button>
                </div>
              </div>

              {/* Contributor Name */}
              <div>
                <Label className="block text-sm font-bold text-[#654321] mb-2">Your Name *</Label>
                <input
                  type="text"
                  value={contributorName}
                  onChange={(e) => setContributorName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border-2 border-[#DAA520]/30 rounded-lg focus:outline-none focus:border-[#DAA520] transition-colors text-[#654321]"
                  required
                />
              </div>

              {/* Contributor Email */}
              <div>
                <Label className="block text-sm font-bold text-[#654321] mb-2">Email *</Label>
                <input
                  type="email"
                  value={contributorEmail}
                  onChange={(e) => setContributorEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border-2 border-[#DAA520]/30 rounded-lg focus:outline-none focus:border-[#DAA520] transition-colors text-[#654321]"
                  required
                />
              </div>

              {/* Occasion selector */}
              <div className="space-y-2">
                <Label htmlFor="contributionOccasion" className="flex items-center gap-1">
                  Occasion <span className="text-red-500">*</span>
                </Label>
                <Select value={contributionOccasion} onValueChange={setContributionOccasion} required>
                  <SelectTrigger id="contributionOccasion">
                    <SelectValue placeholder="Select an occasion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="wedding">Wedding</SelectItem>
                    <SelectItem value="anniversary">Anniversary</SelectItem>
                    <SelectItem value="graduation">Graduation</SelectItem>
                    <SelectItem value="baby shower">Baby Shower</SelectItem>
                    <SelectItem value="retirement">Retirement</SelectItem>
                    <SelectItem value="housewarming">Housewarming</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="thank you">Thank You</SelectItem>
                    <SelectItem value="celebration">General Celebration</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Message with Editor */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="block text-sm font-bold text-[#654321]">Message *</Label>
                  <Button
                    type="button"
                    onClick={generateAIMessage}
                    disabled={isGeneratingMessage || !contributorName}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-[9px] sm:text-xs rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-1.5"
                  >
                    {isGeneratingMessage ? (
                      <>
                        <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        AI Generate
                      </>
                    )}
                  </Button>
                </div>

                {/* Formatting Toolbar */}
                <div className="bg-gray-200 border-b-2 border-gray-300 px-2 sm:px-4 py-2 sm:py-3 flex items-center gap-1 sm:gap-2 flex-wrap">
                  {/* Bold, Italic, Underline */}
                  <div className="flex items-center gap-0.5 sm:gap-1 border-r-2 border-gray-400 pr-1.5 sm:pr-3">
                    <Button
                      type="button"
                      onClick={() => {
                        applyMessageFormatting("bold")
                        setIsBold(!isBold)
                      }}
                      className={`p-1 sm:p-1.5 md:p-2.5 rounded-lg transition-all ${
                        isBold
                          ? "bg-gray-400 text-gray-600 shadow-md"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-600 shadow-sm"
                      }`}
                      title="Bold (Ctrl+B)"
                    >
                      <Bold className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        applyMessageFormatting("italic")
                        setIsItalic(!isItalic)
                      }}
                      className={`p-1 sm:p-1.5 md:p-2.5 rounded-lg transition-all ${
                        isItalic
                          ? "bg-gray-400 text-gray-600 shadow-md"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-600 shadow-sm"
                      }`}
                      title="Italic (Ctrl+I)"
                    >
                      <Italic className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        applyMessageFormatting("underline")
                        setIsUnderline(!isUnderline)
                      }}
                      className={`p-1 sm:p-1.5 md:p-2.5 rounded-lg transition-all ${
                        isUnderline
                          ? "bg-gray-400 text-gray-600 shadow-md"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-600 shadow-sm"
                      }`}
                      title="Underline (Ctrl+U)"
                    >
                      <Underline className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                    </Button>
                  </div>

                  {/* Alignment */}
                  <div className="flex items-center gap-0.5 sm:gap-1 border-r-2 border-gray-400 pr-1.5 sm:pr-3">
                    <Button
                      type="button"
                      onClick={() => applyMessageAlignment("justifyLeft")}
                      className="p-1.5 sm:p-2.5 rounded-lg bg-white text-slate-600 hover:bg-slate-500 hover:text-white transition-all shadow-sm"
                      title="Align Left"
                    >
                      <AlignLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => applyMessageAlignment("justifyCenter")}
                      className="p-1.5 sm:p-2.5 rounded-lg bg-white text-slate-600 hover:bg-slate-500 hover:text-white transition-all shadow-sm"
                      title="Align Center"
                    >
                      <AlignCenter className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => applyMessageAlignment("justifyRight")}
                      className="p-1.5 sm:p-2.5 rounded-lg bg-white text-slate-600 hover:bg-slate-500 hover:text-white transition-all shadow-sm"
                      title="Align Right"
                    >
                      <AlignRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>

                  {/* Lists */}
                  <div className="flex items-center gap-0.5 sm:gap-1 border-r-2 border-gray-400 pr-1.5 sm:pr-3">
                    <Button
                      type="button"
                      onClick={() => applyMessageList("bullet")}
                      className="p-1.5 sm:p-2.5 rounded-lg bg-white text-slate-600 hover:bg-slate-500 hover:text-white transition-all shadow-sm"
                      title="Bullet List"
                    >
                      <List className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => applyMessageList("numbered")}
                      className="p-1.5 sm:p-2.5 rounded-lg bg-white text-slate-600 hover:bg-slate-500 hover:text-white transition-all shadow-sm"
                      title="Numbered List"
                    >
                      <ListOrdered className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>

                  {/* Color Picker */}
                  <div className="flex items-center gap-0.5 sm:gap-1 border-r-2 border-gray-400 pr-1.5 sm:pr-3 relative">
                    <Button
                      type="button"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="p-1.5 sm:p-2.5 rounded-lg bg-white text-slate-600 hover:bg-slate-500 hover:text-white transition-all shadow-sm"
                      title="Text Color"
                    >
                      <Palette className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    {showColorPicker && (
                      <div className="absolute top-full left-0 mt-1 bg-white border-2 border-gray-400 rounded-lg shadow-xl p-3 z-10 grid grid-cols-5 gap-2">
                        {["#000000", "#DC2626", "#EA580C", "#CA8A04", "#16A34A", "#2563EB", "#9333EA", "#DB2777"].map(
                          (color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => applyMessageColor(color)}
                              className="w-8 h-8 rounded-md border-2 border-gray-300 hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ),
                        )}
                      </div>
                    )}
                  </div>

                  {/* Font Size Selector */}
                  <div className="flex items-center gap-0.5 sm:gap-1 border-r-2 border-gray-400 pr-1.5 sm:pr-3">
                    <select
                      onChange={(e) => applyMessageFontSize(e.target.value)}
                      className="px-1.5 py-1 sm:px-2 sm:py-1.5 text-xs sm:text-sm border-2 border-gray-300 rounded-lg bg-white text-slate-600 hover:bg-slate-100 transition-colors"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Size
                      </option>
                      <option value="12px">Small</option>
                      <option value="16px">Normal</option>
                      <option value="20px">Large</option>
                      <option value="24px">X-Large</option>
                    </select>
                  </div>

                  {/* Emoji buttons */}
                  <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
                    {["🎉", "🎁", "🎂", "❤️", "⭐", "🎊"].map((emoji) => (
                      <Button
                        key={emoji}
                        type="button"
                        onClick={() => insertMessageEmoji(emoji)}
                        className="p-1 sm:p-2 rounded-lg bg-white hover:bg-gray-100 transition-colors text-base sm:text-lg"
                        title={`Insert ${emoji}`}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Rich Text Editor */}
                <div
                  ref={messageEditorRef}
                  contentEditable
                  onInput={(e) => setContributionMessage(e.currentTarget.innerText)}
                  className="w-full min-h-[100px] px-4 py-3 border-2 border-gray-300 border-t-0 rounded-b-lg focus:outline-none focus:border-gray-400 transition-colors text-slate-700 resize-none overflow-y-auto bg-white"
                  data-placeholder="Add a personal message to accompany your contribution..."
                  style={{
                    emptyContent: "attr(data-placeholder)",
                  }}
                />
              </div>
            </div>

            <div className="p-6 border-t border-[#DAA520]/20 flex gap-3">
              <Button
                onClick={() => setShowContributionModal(false)}
                disabled={isContributing}
                className="flex-1 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-lg font-bold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
              >
                Cancel
              </Button>
              <Button
                onClick={submitContribution}
                disabled={
                  isContributing || !contributionAmount || !contributorName || !contributorEmail || !contributionMessage
                }
                className="flex-1 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-lg font-bold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2"
              >
                {isContributing ? (
                  <>
                    <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                    Contribute ${contributionAmount || "0"}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
