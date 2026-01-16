"use client"

/**
 * SharedWishlistView Component
 * 
 * Displays a publicly shared wishlist or product.
 * This component fetches and renders the shared content.
 */

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ShoppingCart,
  ExternalLink,
  AlertTriangle,
  Loader2,
  Gift,
  Heart,
  Clock,
} from "lucide-react"

interface SharedProduct {
  id: string
  name: string
  url: string | null
  price: number | null
  image: string | null
  quantity: number
  priority: number | null
  description: string | null
  category: string | null
  stockStatus: string | null
  addedAt: string
}

interface SharedWishlist {
  id: string
  title: string
  description: string | null
  createdAt: string
}

interface SharedData {
  wishlist: SharedWishlist
  items: SharedProduct[]
  product: SharedProduct | null
  accessLevel: "view" | "contribute"
  sharedBy: string
  disclaimer: string
}

interface SharedWishlistViewProps {
  token: string
}

export function SharedWishlistView({ token }: SharedWishlistViewProps) {
  const [data, setData] = useState<SharedData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSharedData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/share/${token}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to load shared content")
        }

        setData(result)
      } catch (err: any) {
        console.error("Error fetching shared data:", err)
        setError(err.message || "Something went wrong")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSharedData()
  }, [token])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#DAA520] mx-auto mb-4" />
          <p className="text-[#6B4423] font-medium">Loading wishlist...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-white/80 backdrop-blur border-[#DAA520]/20">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#8B4513] mb-2">
            Wishlist Not Found
          </h1>
          <p className="text-[#6B4423] mb-6">
            {error || "This share link is invalid or has expired."}
          </p>
          <Link href="/">
            <Button className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520]">
              Go to Wishbee.ai
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  // Single product view
  if (data.product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <span className="text-2xl">🐝</span>
              <span className="text-xl font-bold text-[#8B4513]">Wishbee.ai</span>
            </Link>
            <p className="text-[#6B4423]">
              <Heart className="w-4 h-4 inline-block text-red-500 mr-1" />
              {data.sharedBy} shared this with you
            </p>
          </div>

          {/* Product Card */}
          <Card className="overflow-hidden bg-white/90 backdrop-blur border-[#DAA520]/20 shadow-lg">
            <div className="aspect-square relative bg-white">
              {data.product.image ? (
                <Image
                  src={data.product.image}
                  alt={data.product.name}
                  fill
                  className="object-contain p-4"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Gift className="w-24 h-24 text-gray-300" />
                </div>
              )}
            </div>

            <div className="p-6">
              <h1 className="text-xl font-bold text-[#8B4513] mb-2">
                {data.product.name}
              </h1>

              {data.product.price && (
                <p className="text-2xl font-bold text-[#DAA520] mb-4">
                  ${data.product.price.toFixed(2)}
                </p>
              )}

              {data.product.description && (
                <p className="text-[#6B4423] text-sm mb-4">
                  {data.product.description}
                </p>
              )}

              {data.product.url && (
                <a
                  href={data.product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full h-12 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520] font-semibold">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    View on Store
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              )}
            </div>
          </Card>

          {/* Disclaimer */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700 text-center">
              <AlertTriangle className="w-3 h-3 inline-block mr-1" />
              {data.disclaimer}
            </p>
          </div>

          {/* CTA */}
          <div className="mt-8 text-center">
            <p className="text-[#6B4423] text-sm mb-3">
              Want to create your own wishlist?
            </p>
            <Link href="/signup">
              <Button
                variant="outline"
                className="border-[#DAA520] text-[#DAA520] hover:bg-[#DAA520] hover:text-white"
              >
                Join Wishbee.ai - It&apos;s Free!
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Full wishlist view
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-2xl">🐝</span>
            <span className="text-xl font-bold text-[#8B4513]">Wishbee.ai</span>
          </Link>
          <h1 className="text-3xl font-bold text-[#8B4513] mb-2">
            {data.wishlist.title}
          </h1>
          <p className="text-[#6B4423]">
            <Heart className="w-4 h-4 inline-block text-red-500 mr-1" />
            Shared by {data.sharedBy}
          </p>
          {data.wishlist.description && (
            <p className="text-[#6B4423] mt-2 max-w-lg mx-auto">
              {data.wishlist.description}
            </p>
          )}
        </div>

        {/* Items Grid */}
        {data.items.length === 0 ? (
          <Card className="p-8 text-center bg-white/80 backdrop-blur border-[#DAA520]/20">
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-[#6B4423]">This wishlist is empty.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.items.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden bg-white/90 backdrop-blur border-[#DAA520]/20 shadow-md hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                <div className="aspect-square relative bg-white">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-contain p-2"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Gift className="w-16 h-16 text-gray-300" />
                    </div>
                  )}

                  {/* Priority Badge */}
                  {item.priority && item.priority <= 3 && (
                    <Badge className="absolute top-2 left-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321]">
                      Top Pick
                    </Badge>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-[#8B4513] text-sm line-clamp-2 mb-2">
                    {item.name}
                  </h3>

                  {item.price && (
                    <p className="text-lg font-bold text-[#DAA520] mb-3">
                      ${item.price.toFixed(2)}
                    </p>
                  )}

                  {item.stockStatus && (
                    <Badge
                      variant="outline"
                      className={`text-xs mb-3 ${
                        item.stockStatus.toLowerCase().includes("in stock")
                          ? "border-green-500 text-green-600"
                          : "border-amber-500 text-amber-600"
                      }`}
                    >
                      {item.stockStatus}
                    </Badge>
                  )}

                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520] font-semibold"
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        View
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg max-w-2xl mx-auto">
          <p className="text-xs text-amber-700 text-center">
            <AlertTriangle className="w-3 h-3 inline-block mr-1" />
            {data.disclaimer}
          </p>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-[#6B4423] text-sm mb-3">
            Want to create your own wishlist?
          </p>
          <Link href="/signup">
            <Button
              variant="outline"
              className="border-[#DAA520] text-[#DAA520] hover:bg-[#DAA520] hover:text-white"
            >
              Join Wishbee.ai - It&apos;s Free!
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
