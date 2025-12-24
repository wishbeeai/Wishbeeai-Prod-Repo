"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Tag, DollarSign, TrendingUp, Store, Heart, Check } from "lucide-react"

export function AIClipExtension() {
  const [isClipping, setIsClipping] = useState(false)
  const [clipped, setClipped] = useState(false)

  const handleClip = () => {
    setIsClipping(true)
    setTimeout(() => {
      setIsClipping(false)
      setClipped(true)
    }, 2000)
  }

  // Mock auto-generated tags
  const aiTags = [
    { name: "Electronics", confidence: 98, color: "bg-blue-500" },
    { name: "Kitchen", confidence: 95, color: "bg-green-500" },
    { name: "Premium", confidence: 92, color: "bg-purple-500" },
    { name: "Gift Idea", confidence: 89, color: "bg-pink-500" },
  ]

  return (
    <Card className="w-full max-w-md border-2 border-[#F4C430] shadow-2xl">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-[#F4C430] animate-pulse" />
          <h3 className="text-xl font-bold text-gray-900">AI Clip & Auto-Tag</h3>
        </div>

        {/* Product Preview */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4 border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-20 h-20 bg-gradient-to-br from-[#F4C430] to-[#DAA520] rounded-lg flex items-center justify-center">
              <Store className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 text-sm">Espresso Machine Pro</h4>
              <p className="text-xs text-gray-600">from Amazon</p>
              <div className="flex items-center gap-2 mt-1">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="font-bold text-green-600">$299.99</span>
                <Badge variant="secondary" className="text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Best Price
                </Badge>
              </div>
            </div>
          </div>

          {/* AI Auto-Tags */}
          {clipped && (
            <div className="animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-[#F4C430]" />
                <span className="text-xs font-semibold text-gray-700">AI-Generated Tags:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {aiTags.map((tag, index) => (
                  <Badge
                    key={index}
                    className={`${tag.color} text-white text-xs px-3 py-1 animate-in fade-in-50 zoom-in-95 duration-300`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    {tag.name} ({tag.confidence}%)
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clip Button */}
        <Button
          onClick={handleClip}
          disabled={isClipping || clipped}
          className={`w-full py-3 rounded-xl font-semibold transition-all ${
            clipped
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#8B4513] hover:from-[#F4C430] hover:to-[#DAA520]"
          } shadow-lg hover:shadow-xl`}
        >
          {isClipping ? (
            <>
              <Sparkles className="w-5 h-5 mr-2 animate-spin" />
              AI Processing...
            </>
          ) : clipped ? (
            <>
              <Heart className="w-5 h-5 mr-2 fill-current" />
              Added to Wishlist
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Clip to Wishlist
            </>
          )}
        </Button>

        {clipped && (
          <p className="text-xs text-center text-gray-600 mt-3 animate-in fade-in-50">
            ✨ AI automatically categorized and tagged your item
          </p>
        )}
      </CardContent>
    </Card>
  )
}
