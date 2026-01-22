"use client"

/**
 * SharedWishlistView Component
 * 
 * Displays a publicly shared wishlist or product.
 * Enhanced UI with empty state onboarding experience.
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
  Star,
  TrendingUp,
  CheckCircle,
  Tag,
  Sparkles,
} from "lucide-react"

// Import new components for empty state
import {
  SharedWishlistHeader,
  EmptyWishlistState,
  HowWishbeeWorks,
  SocialProof,
  WishlistCTA,
  FooterDisclaimer,
} from "./components"

interface SharedProduct {
  id: string
  name: string
  url: string | null
  price: number | null
  originalPrice?: number | null
  image: string | null
  quantity: number
  priority: number | null
  description: string | null
  category: string | null
  stockStatus: string | null
  addedAt: string
  rating?: number | null
  reviewCount?: number | null
  storeName?: string | null
  amazonChoice?: boolean
  bestSeller?: boolean
  overallPick?: boolean
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
  const [isLoggedIn, setIsLoggedIn] = useState(false)

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

  // Check if user is logged in (for CTA button text)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Simple check - you may want to use your auth context here
        const response = await fetch("/api/auth/session")
        if (response.ok) {
          const session = await response.json()
          setIsLoggedIn(!!session?.user)
        }
      } catch {
        setIsLoggedIn(false)
      }
    }
    checkAuth()
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#EBF5FB] flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Gift className="w-8 h-8 text-[#3498DB]" />
          </div>
          <Loader2 className="w-8 h-8 animate-spin text-[#3498DB] mx-auto mb-3" />
          <p className="text-[#7F8C8D] font-medium text-sm">Loading wishlist...</p>
        </div>
      </div>
    )
  }

  // Error state (Invalid or expired link)
  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-white border border-[#ECF0F1] shadow-lg rounded-xl">
          <div className="w-16 h-16 rounded-full bg-[#FDEDEC] flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-[#E74C3C]" />
          </div>
          <h1 className="text-2xl font-bold text-[#2C3E50] mb-2">
            Wishlist Not Found
          </h1>
          <p className="text-[#7F8C8D] mb-6 text-sm">
            {error || "This share link is invalid or has expired."}
          </p>
          <Link href="/">
            <Button className="h-12 px-6 rounded-lg bg-[#3498DB] hover:bg-[#2980B9] text-white font-semibold transition-all">
              Go to Wishbee.ai
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  // Single product view (unchanged from original)
  if (data.product) {
    return <SingleProductView data={data} />
  }

  // EMPTY WISHLIST STATE - New enhanced experience
  if (data.items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4">
          {/* Header */}
          <SharedWishlistHeader
            wishlistTitle={data.wishlist.title}
            sharedBy={data.sharedBy}
            description={data.wishlist.description}
          />

          {/* Empty State Hero */}
          <EmptyWishlistState
            shareId={token}
            wishlistTitle={data.wishlist.title}
          />

          {/* How Wishbee Works */}
          <HowWishbeeWorks />

          {/* Social Proof */}
          <SocialProof />

          {/* CTA Section */}
          <WishlistCTA isLoggedIn={isLoggedIn} />

          {/* Footer Disclaimer */}
          <FooterDisclaimer />
        </div>

        {/* Mobile Sticky CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#ECF0F1] sm:hidden z-50">
          <Link href={isLoggedIn ? "/wishlist/add" : "/signup"} className="block">
            <Button className="w-full h-12 rounded-lg bg-[#3498DB] hover:bg-[#2980B9] text-white font-semibold">
              Create My Wishlist
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // WISHLIST WITH ITEMS - Enhanced version of original
  return (
    <div className="min-h-screen bg-white pb-20 sm:pb-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <SharedWishlistHeader
          wishlistTitle={data.wishlist.title}
          sharedBy={data.sharedBy}
          description={data.wishlist.description}
        />

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {data.items.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>

        {/* Footer Disclaimer */}
        <div className="mt-8">
          <FooterDisclaimer />
        </div>

        {/* CTA Section */}
        <WishlistCTA isLoggedIn={isLoggedIn} />
      </div>
    </div>
  )
}

// Single Product View Component
function SingleProductView({ data }: { data: SharedData }) {
  if (!data.product) return null
  
  const hasDiscount = data.product.originalPrice && data.product.price && data.product.originalPrice > data.product.price
  const discountPercent = hasDiscount 
    ? Math.round(((data.product.originalPrice! - data.product.price!) / data.product.originalPrice!) * 100)
    : 0

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="text-2xl">🐝</span>
          <span className="text-xl font-bold text-[#8B4513]">Wishbee</span>
        </div>

        {/* Product Card */}
        <Card className="overflow-hidden bg-white border border-[#ECF0F1] shadow-lg rounded-xl">
          <div className="aspect-square relative bg-[#F8F9FA]">
            {data.product.image ? (
              <Image
                src={data.product.image}
                alt={data.product.name}
                fill
                className="object-contain p-4"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Gift className="w-24 h-24 text-[#BDC3C7]" />
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {data.product.amazonChoice && (
                <Badge className="bg-[#232F3E] text-white text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Amazon&apos;s Choice
                </Badge>
              )}
              {data.product.bestSeller && (
                <Badge className="bg-[#FF9900] text-[#232F3E] text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Best Seller
                </Badge>
              )}
              {hasDiscount && (
                <Badge className="bg-[#E74C3C] text-white text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  {discountPercent}% OFF
                </Badge>
              )}
            </div>
          </div>

          <div className="p-6">
            {data.product.storeName && (
              <p className="text-xs text-[#95A5A6] mb-1 uppercase tracking-wide">
                {data.product.storeName}
              </p>
            )}

            <h2 className="text-lg sm:text-xl font-bold text-[#2C3E50] mb-3">
              {data.product.name}
            </h2>

            {/* Rating */}
            {data.product.rating && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(data.product!.rating!)
                          ? "fill-[#F39C12] text-[#F39C12]"
                          : "text-[#BDC3C7]"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-[#2C3E50]">
                  {data.product.rating.toFixed(1)}
                </span>
                {data.product.reviewCount && (
                  <span className="text-xs text-[#95A5A6]">
                    ({data.product.reviewCount.toLocaleString()} reviews)
                  </span>
                )}
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-4">
              {data.product.price && (
                <p className="text-2xl sm:text-3xl font-bold text-[#27AE60]">
                  ${data.product.price.toFixed(2)}
                </p>
              )}
              {hasDiscount && (
                <p className="text-base text-[#95A5A6] line-through">
                  ${data.product.originalPrice!.toFixed(2)}
                </p>
              )}
            </div>

            {data.product.url && (
              <a
                href={data.product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="w-full h-12 rounded-lg bg-[#3498DB] hover:bg-[#2980B9] text-white font-semibold">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  View on Store
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </a>
            )}
          </div>
        </Card>

        {/* Disclaimer */}
        <p className="text-xs text-[#95A5A6] text-center mt-6">
          {data.disclaimer}
        </p>
      </div>
    </div>
  )
}

// Product Card Component for grid
function ProductCard({ item }: { item: SharedProduct }) {
  const hasDiscount = item.originalPrice && item.price && item.originalPrice > item.price
  const discountPercent = hasDiscount 
    ? Math.round(((item.originalPrice! - item.price!) / item.originalPrice!) * 100)
    : 0

  return (
    <Card className="overflow-hidden bg-white border border-[#ECF0F1] shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 rounded-xl">
      {/* Image */}
      <div className="aspect-square relative bg-[#F8F9FA]">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-contain p-3"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Gift className="w-16 h-16 text-[#BDC3C7]" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {item.priority && item.priority <= 3 && (
            <Badge className="bg-[#F39C12] text-white text-[9px]">
              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
              Top Pick
            </Badge>
          )}
          {item.amazonChoice && (
            <Badge className="bg-[#232F3E] text-white text-[9px]">
              Choice
            </Badge>
          )}
          {item.bestSeller && (
            <Badge className="bg-[#FF9900] text-[#232F3E] text-[9px]">
              Best Seller
            </Badge>
          )}
        </div>

        {hasDiscount && (
          <Badge className="absolute top-2 right-2 bg-[#E74C3C] text-white text-[9px]">
            -{discountPercent}%
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {item.storeName && (
          <p className="text-[9px] text-[#95A5A6] mb-1 uppercase tracking-wide">
            {item.storeName}
          </p>
        )}

        <h3 className="font-semibold text-[#2C3E50] text-sm line-clamp-2 mb-2 min-h-[40px]">
          {item.name}
        </h3>

        {/* Rating */}
        {item.rating && (
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(item.rating!)
                      ? "fill-[#F39C12] text-[#F39C12]"
                      : "text-[#BDC3C7]"
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-[#7F8C8D]">
              {item.rating.toFixed(1)}
              {item.reviewCount && ` (${item.reviewCount.toLocaleString()})`}
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          {item.price && (
            <p className="text-lg font-bold text-[#27AE60]">
              ${item.price.toFixed(2)}
            </p>
          )}
          {hasDiscount && (
            <p className="text-xs text-[#95A5A6] line-through">
              ${item.originalPrice!.toFixed(2)}
            </p>
          )}
        </div>

        {/* Stock Status */}
        {item.stockStatus && (
          <Badge
            variant="outline"
            className={`text-[9px] mb-3 ${
              item.stockStatus.toLowerCase().includes("in stock")
                ? "border-[#27AE60] text-[#27AE60] bg-[#E8F8F5]"
                : "border-[#F39C12] text-[#F39C12] bg-[#FEF5E7]"
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
              className="w-full h-10 rounded-lg bg-[#3498DB] hover:bg-[#2980B9] text-white font-medium text-xs transition-all hover:scale-[1.02]"
            >
              <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
              View Product
              <ExternalLink className="w-3 h-3 ml-1.5" />
            </Button>
          </a>
        )}
      </div>
    </Card>
  )
}
