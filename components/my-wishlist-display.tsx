"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Share2, Trash2, ShoppingCart, AlertCircle, Plus } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface WishlistItem {
  id: string
  webLink: string
  quantity: number
  productImageUrl: string
  giftName: string
  currentPrice: number
  storeName: string
  description: string
  category?: string
  attributes: {
    [key: string]: string | null
  }
  stockStatus: string
  addedDate: string
}

interface AIInsight {
  totalValue: number
  priorityRecommendation: string
  savingsOpportunity: number
  bestTimeToBy: string
}

export function MyWishlistDisplay() {
  const { toast } = useToast()
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [aiInsights, setAiInsights] = useState<AIInsight | null>(null)
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch wishlist items from database
  useEffect(() => {
    const fetchWishlistItems = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/wishlist-items/all")
        
        if (!response.ok) {
          if (response.status === 401) {
            // User not authenticated - show empty state
            setWishlistItems([])
            return
          }
          
          // Try to get error details from response
          let errorMessage = "Failed to fetch wishlist items"
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
            console.error("[My Wishlist] API error:", errorData)
          } catch (e) {
            console.error("[My Wishlist] API error status:", response.status)
          }
          
          throw new Error(errorMessage)
        }

        const data = await response.json()
        const dbItems = data.items || []

        // Transform database items to component format
        const transformedItems: WishlistItem[] = dbItems.map((item: any) => {
          // Extract store name from URL
          let storeName = "Unknown Store"
          try {
            if (item.product_url) {
              const urlObj = new URL(item.product_url)
              storeName = urlObj.hostname.replace("www.", "").split(".")[0]
              storeName = storeName.charAt(0).toUpperCase() + storeName.slice(1)
            }
          } catch (e) {
            // Keep default storeName
          }

          return {
            id: item.id,
            webLink: item.product_url || "#",
            quantity: item.quantity || 1,
            productImageUrl: item.product_image || "/placeholder.svg",
            giftName: item.product_name || "Untitled Item",
            currentPrice: item.product_price || 0,
            storeName,
            description: item.description || "",
            category: item.category || undefined,
            attributes: {}, // Can be extended later
            stockStatus: item.stock_status || "Unknown",
            addedDate: item.created_at ? new Date(item.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          }
        })

        setWishlistItems(transformedItems)
      } catch (error) {
        console.error("Error fetching wishlist items:", error)
        toast({
          title: "Error",
          description: "Failed to load wishlist items",
          variant: "destructive",
        })
        setWishlistItems([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchWishlistItems()
  }, [toast])

  useEffect(() => {
    if (wishlistItems.length > 0) {
      handleGenerateInsights()
    } else {
      setAiInsights(null)
    }
  }, [wishlistItems])

  const handleGenerateInsights = async () => {
    setIsLoadingInsights(true)
    try {
      const response = await fetch("/api/ai/wishlist-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wishlistItems }),
      })

      const data = await response.json()
      if (data.insights) {
        setAiInsights(data.insights)
      }
    } catch (error) {
      console.error("Failed to generate AI insights:", error)
    } finally {
      setIsLoadingInsights(false)
    }
  }

  const handleShare = async (item: WishlistItem) => {
    try {
      const shareData = {
        title: item.giftName,
        text: `Check out this item on my wishlist: ${item.giftName}`,
        url: item.webLink,
      }

      if (navigator.share) {
        await navigator.share(shareData)
        toast({
          title: "Shared Successfully!",
          description: "Item shared via your device",
        })
      } else {
        await navigator.clipboard.writeText(item.webLink)
        toast({
          title: "Link Copied!",
          description: "Product link copied to clipboard",
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
      toast({
        title: "Share Failed",
        description: "Could not share this item",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/wishlist-items/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setWishlistItems((prev) => prev.filter((item) => item.id !== id))
        toast({
          title: "Item Removed",
          description: "Item removed from your wishlist",
        })
        // Insights will be updated automatically via useEffect when wishlistItems changes
      } else {
        throw new Error("Failed to delete")
      }
    } catch (error) {
      console.error("Error deleting item:", error)
      toast({
        title: "Delete Failed",
        description: "Could not remove item from wishlist",
        variant: "destructive",
      })
    }
  }

  const handleBuyNow = async (item: WishlistItem) => {
    try {
      await fetch("/api/wishlist/track-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, action: "buy_now" }),
      })
      window.open(item.webLink, "_blank")
    } catch (error) {
      console.error("Error tracking purchase:", error)
      window.open(item.webLink, "_blank")
    }
  }

  return (
    <div className="space-y-6">
      {/* AI Insights Panel */}
      {aiInsights && (
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-[#DAA520]/30 p-6">
          <div className="flex flex-col items-center mb-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">AI Wishlist Insights</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">Smart recommendations based on your wishlist</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mb-1">Total Wishlist Value</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                ${aiInsights.totalValue.toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mb-1">Priority Recommendation</p>
              <p className="text-xs sm:text-sm font-semibold text-[#DAA520]">{aiInsights.priorityRecommendation}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mb-1">Potential Savings</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
                ${aiInsights.savingsOpportunity.toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mb-1">Best Time to Buy</p>
              <p className="text-xs sm:text-sm font-semibold text-blue-600">{aiInsights.bestTimeToBy}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="flex justify-center">
        <Link href="/wishlist/add">
          <Button className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white hover:opacity-90 text-xs sm:text-sm">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Add New Item
          </Button>
        </Link>
      </div>

      {/* Wishlist Items Grid */}
      {wishlistItems.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-sm sm:text-base md:text-lg text-gray-500 mb-4">Your wishlist is empty</p>
          <Button className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white hover:opacity-90 text-xs sm:text-sm">
            Add Your First Item
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-xl transition-shadow flex flex-col h-full">
              <div className="relative h-64 bg-gray-100">
                <Image
                  src={item.productImageUrl || "/placeholder.svg"}
                  alt={item.giftName}
                  fill
                  className="object-contain p-2"
                />
                {item.stockStatus === "Low Stock" && (
                  <Badge className="absolute top-3 right-3 bg-orange-500 text-white text-[9px] sm:text-xs">
                    <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                    Low Stock
                  </Badge>
                )}
              </div>

              {/* Product Details */}
              <div className="p-5 flex flex-col h-full">
                <div className="h-16 mb-3">
                  <h3 className="font-bold text-sm sm:text-base md:text-lg text-gray-900 line-clamp-2 leading-tight">
                    {item.giftName}
                  </h3>
                </div>

                {/* Store name and quantity on same line */}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{item.storeName}</p>
                  <Badge className="bg-green-100 text-green-800 border-green-200 text-[9px] sm:text-xs">
                    Qty: {item.quantity}
                  </Badge>
                </div>

                {/* Price */}
                <div className="mb-3">
                  <span className="text-lg sm:text-xl md:text-2xl font-bold text-black">
                    ${item.currentPrice.toFixed(2)}
                  </span>
                </div>

                {/* Description - Fixed height */}
                <div className="h-12 mb-3">
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{item.description}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-3 min-h-[180px]">
                  <h4 className="text-[9px] sm:text-xs font-semibold text-gray-700 uppercase mb-2">
                    Product Details {item.category && `(${item.category})`}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[9px] sm:text-xs">
                    {Object.entries(item.attributes)
                      .filter(([_, value]) => value !== null && value !== "")
                      .map(([key, value]) => (
                        <div
                          key={key}
                          className={key === "Care Instructions" || key === "Compatibility" ? "col-span-2" : ""}
                        >
                          <span className="font-semibold text-gray-700">{key}:</span>{" "}
                          <span className="text-gray-600">{value}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="space-y-4 mt-auto pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleBuyNow(item)}
                      className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white hover:opacity-90 text-xs sm:text-sm"
                    >
                      <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Buy Now
                    </Button>
                    <Button
                      onClick={() => handleShare(item)}
                      className="bg-gradient-to-r from-orange-400 via-rose-400 to-pink-500 text-white hover:from-orange-500 hover:via-rose-500 hover:to-pink-600 transition-all text-xs sm:text-sm"
                    >
                      <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Share
                    </Button>
                  </div>

                  <Button
                    onClick={() => handleDelete(item.id)}
                    variant="ghost"
                    className="w-full text-red-600 hover:bg-red-50 text-xs sm:text-sm"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Remove from Wishlist
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
