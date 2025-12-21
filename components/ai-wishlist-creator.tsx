"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  LinkIcon,
  Star,
  Check,
  Loader2,
  TrendingUp,
  AlertCircle,
  Tag,
  DollarSign,
  Package,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface WishlistItem {
  // User Input Fields
  webLink: string
  quantity: number
  userRanking: number

  // AI-Generated Fields
  productImageUrl: string
  giftName: string
  currentPrice: number
  storeName: string
  description: string
  categoryTags: string[]
  stockStatus: "In Stock" | "Low Stock" | "Out of Stock"
  lastChecked: Date
  fundingStatus: "Ready to Fund" | "Funding In Progress" | "Purchased"
}

export default function AIWishlistCreator() {
  const { toast } = useToast()
  const [webLink, setWebLink] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [userRanking, setUserRanking] = useState(3)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedItem, setExtractedItem] = useState<WishlistItem | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleExtractProduct = async () => {
    if (!webLink.trim()) {
      toast({
        title: "Link Required",
        description: "Please enter a product URL or gift name",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    // Simulate AI extraction (replace with actual AI SDK call)
    setTimeout(() => {
      const mockExtractedData: WishlistItem = {
        webLink,
        quantity,
        userRanking,
        // AI-Generated Data
        productImageUrl: "/images/espresso-machine.webp",
        giftName: "Premium Espresso Coffee Machine",
        currentPrice: 299.99,
        storeName: "Amazon",
        description:
          "Professional-grade espresso machine with built-in grinder, milk frother, and programmable settings. Perfect for coffee enthusiasts.",
        categoryTags: ["Electronics", "Kitchen", "Coffee", "Premium", "Gift Idea"],
        stockStatus: "In Stock",
        lastChecked: new Date(),
        fundingStatus: "Ready to Fund",
      }

      setExtractedItem(mockExtractedData)
      setIsProcessing(false)

      toast({
        title: "Product Extracted!",
        description: "AI has automatically filled all details",
      })
    }, 2500)
  }

  const handleSaveToWishlist = async () => {
    if (!extractedItem) return

    setIsSaving(true)

    // Simulate saving (replace with actual API call)
    setTimeout(() => {
      setIsSaving(false)
      toast({
        title: "Added to Wishlist!",
        description: `${extractedItem.giftName} is now ready for funding`,
      })

      // Reset form
      setWebLink("")
      setQuantity(1)
      setUserRanking(3)
      setExtractedItem(null)
    }, 1500)
  }

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case "In Stock":
        return "bg-green-500"
      case "Low Stock":
        return "bg-orange-500"
      case "Out of Stock":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-2 border-[#F4C430] shadow-2xl">
        <CardContent className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-[#F4C430] animate-pulse" />
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">AI-Powered Wishlist Creator</h2>
          </div>

          {/* Step 1: Minimal User Input */}
          {!extractedItem && (
            <div className="space-y-6">
              {/* Web Link Input */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <LinkIcon className="w-3 h-3 md:w-4 md:h-4 text-[#F4C430]" />
                  Product Link or Gift Idea <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={webLink}
                  onChange={(e) => setWebLink(e.target.value)}
                  placeholder="https://amazon.com/product... or just type 'espresso machine'"
                  className="w-full border-2 border-gray-200 focus:border-[#F4C430] rounded-xl p-3 md:p-4 text-xs md:text-sm placeholder:text-xs md:placeholder:text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Paste any product URL or type what you want - AI will find it
                </p>
              </div>

              {/* Optional Fields */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Quantity */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity (Optional)</label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                    className="w-full border-2 border-gray-200 focus:border-[#F4C430] rounded-xl p-4"
                  />
                </div>

                {/* Ranking */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Priority (Optional)</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setUserRanking(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= userRanking ? "fill-[#F4C430] text-[#F4C430]" : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">AI suggests: 3 stars for this item</p>
                </div>
              </div>

              <Button
                onClick={handleExtractProduct}
                disabled={isProcessing}
                className="w-full py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#8B4513] hover:from-[#F4C430] hover:to-[#DAA520] shadow-lg hover:shadow-xl transition-all relative overflow-hidden"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    AI Processing Product...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Add to Wishlist
                    <span className="ml-2 px-2 py-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-xs rounded-full font-bold shadow-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                    </span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 2: AI-Extracted Product Preview */}
          {extractedItem && (
            <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
              {/* Success Message */}
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3">
                <Check className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-bold text-green-800">AI Extraction Complete!</h3>
                  <p className="text-sm text-green-700">All product details have been automatically populated</p>
                </div>
              </div>

              {/* Product Card */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border-2 border-[#F4C430]/30 shadow-lg">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Product Image */}
                  <div className="relative">
                    <Image
                      src={extractedItem.productImageUrl || "/placeholder.svg"}
                      alt={extractedItem.giftName}
                      width={400}
                      height={400}
                      className="w-full h-64 object-cover rounded-xl shadow-md"
                    />
                    <Badge className={`absolute top-3 right-3 ${getStockStatusColor(extractedItem.stockStatus)}`}>
                      {extractedItem.stockStatus}
                    </Badge>
                  </div>

                  {/* Product Details */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{extractedItem.giftName}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary" className="text-xs">
                          {extractedItem.storeName}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {[...Array(extractedItem.userRanking)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-[#F4C430] text-[#F4C430]" />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <DollarSign className="w-6 h-6 text-green-600" />
                      <span className="text-3xl font-bold text-green-600">${extractedItem.currentPrice}</span>
                      <Badge className="bg-[#F4C430] text-[#8B4513]">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Best Price
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed">{extractedItem.description}</p>

                    {/* AI Tags */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-4 h-4 text-[#F4C430]" />
                        <span className="text-sm font-semibold text-gray-700">AI-Generated Categories:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {extractedItem.categoryTags.map((tag, index) => (
                          <Badge key={index} className="bg-blue-100 text-blue-800 text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Package className="w-4 h-4" />
                      <span>Quantity: {extractedItem.quantity}</span>
                    </div>

                    {/* Funding Status */}
                    <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                      <span className="text-sm font-semibold text-blue-800">Status: {extractedItem.fundingStatus}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={() => setExtractedItem(null)}
                  variant="outline"
                  className="flex-1 py-3 border-2 border-gray-300 hover:bg-gray-50"
                >
                  Try Different Item
                </Button>
                <Button
                  onClick={handleSaveToWishlist}
                  disabled={isSaving}
                  className="flex-1 py-3 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#8B4513] hover:from-[#F4C430] hover:to-[#DAA520] font-semibold"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Save to Wishlist
                    </>
                  )}
                </Button>
              </div>

              {/* AI Insight */}
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-sm font-bold flex items-center justify-center shadow-md">
                    AI
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#8B4513] mb-1">AI Smart Insights</h4>
                    <ul className="text-sm text-[#8B4513] space-y-1">
                      <li>• Price tracking enabled - we'll notify you of drops</li>
                      <li>• Stock monitoring active - alerts for availability changes</li>
                      <li>• Optimal funding goal: ${Math.round(extractedItem.currentPrice * 1.1)}</li>
                      <li>• Estimated 8-12 contributors needed</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Help Text */}
          {!isProcessing && !extractedItem && (
            <div className="mt-6 p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-[#F4C430]/50 rounded-xl shadow-sm">
              <div className="flex flex-col md:flex-row items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#DAA520] flex-shrink-0 mt-0.5" />
                <div className="text-xs md:text-sm text-[#8B4513] w-full">
                  <p className="font-semibold mb-3 text-[#8B4513] text-center md:text-left">How it works:</p>
                  <ol className="list-none space-y-3">
                    <li className="flex flex-col md:flex-row items-center md:items-start gap-2 text-center md:text-left">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white text-xs font-bold flex items-center justify-center">
                        1
                      </span>
                      <span className="text-xs md:text-sm">Paste any product link or type what you want</span>
                    </li>
                    <li className="flex flex-col md:flex-row items-center md:items-start gap-2 text-center md:text-left">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white flex items-center justify-center shadow-sm">
                        <Sparkles className="w-3 h-3" />
                      </span>
                      <span className="text-xs md:text-sm">
                        AI extracts all details automatically (image, price, description, store, tags, stock)
                      </span>
                    </li>
                    <li className="flex flex-col md:flex-row items-center md:items-start gap-2 text-center md:text-left">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white text-xs font-bold flex items-center justify-center">
                        3
                      </span>
                      <span className="text-xs md:text-sm">
                        Review and save - your item is ready for funding with price tracking!
                      </span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
