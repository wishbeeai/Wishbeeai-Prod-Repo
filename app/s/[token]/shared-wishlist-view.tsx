"use client"

/**
 * SharedWishlistView Component
 * 
 * Displays a publicly shared wishlist or product.
 * Enhanced UI with empty state onboarding experience.
 * Includes standard Wishbee Header and Footer.
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

// Import standard Wishbee Header and Footer
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

// Import components for empty state and shared wishlist
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

  // Loading state - Enhanced skeleton loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8DC] via-[#FFEFD5] to-[#FFE4B5] flex flex-col">
        <Header />
        <main className="flex-1 py-8 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Skeleton Header */}
            <div className="text-center py-6 sm:py-8 animate-pulse">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#DAA520]/30"></div>
                <div className="h-8 w-48 bg-[#DAA520]/30 rounded-lg"></div>
              </div>
              <div className="h-4 w-32 bg-[#DAA520]/20 rounded mx-auto"></div>
            </div>

            {/* Loading Animation */}
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] flex items-center justify-center shadow-lg animate-bounce">
                  <Gift className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#FF6B6B] flex items-center justify-center animate-ping">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#DAA520]" />
                <p className="text-[#8B4513] font-semibold text-base">Loading wishlist...</p>
              </div>
              <p className="text-[#A0522D] text-sm mt-2">Preparing something special for you</p>
            </div>

            {/* Skeleton Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mt-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-[#DAA520]/20 p-4 animate-pulse">
                  <div className="aspect-square bg-[#DAA520]/10 rounded-xl mb-4"></div>
                  <div className="h-4 bg-[#DAA520]/20 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-[#DAA520]/10 rounded w-1/2 mb-3"></div>
                  <div className="h-6 bg-[#DAA520]/20 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Error state (Invalid or expired link)
  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center bg-gradient-to-br from-[#FFF8DC] to-[#FFEFD5] border-2 border-[#DAA520]/30 shadow-lg rounded-xl">
            <div className="w-16 h-16 rounded-full bg-[#FDEDEC] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-[#E74C3C]" />
            </div>
            <h1 className="text-2xl font-bold text-[#8B4513] mb-2">
              Wishlist Not Found
            </h1>
            <p className="text-[#A0522D] mb-6 text-sm">
              {error || "This share link is invalid or has expired."}
            </p>
            <Link href="/">
              <Button className="h-12 px-6 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] hover:from-[#F4C430] hover:to-[#DAA520] text-[#654321] font-semibold transition-all shadow-md hover:shadow-lg">
                Go to Wishbee.ai
              </Button>
            </Link>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  // Single product view (unchanged from original)
  if (data.product) {
    return <SingleProductView data={data} />
  }

  // EMPTY WISHLIST STATE - Enhanced experience with warm colors
  if (data.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8DC] via-[#FFEFD5] to-[#FFE4B5] flex flex-col">
        <Header />
        <main className="flex-1 pb-24 sm:pb-8">
          {/* Decorative elements */}
          <div className="absolute top-32 left-4 w-16 h-16 bg-[#DAA520]/10 rounded-full blur-2xl"></div>
          <div className="absolute top-48 right-8 w-24 h-24 bg-[#F4C430]/10 rounded-full blur-3xl"></div>
          
          <div className="max-w-3xl mx-auto px-4 relative">
            {/* Wishlist Title Section */}
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
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#FFF8DC] via-[#FFF8DC] to-transparent pt-8 sm:hidden z-50">
            <Link href={isLoggedIn ? "/wishlist/add" : "/signup"} className="block">
              <Button className="w-full h-14 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] hover:from-[#F4C430] hover:to-[#DAA520] text-[#654321] font-bold text-base shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                <Gift className="w-5 h-5 mr-2" />
                Create My Wishlist
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // WISHLIST WITH ITEMS - Enhanced with warm colors and modern design
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8DC] via-[#FFEFD5] to-[#FFE4B5] flex flex-col">
      <Header />
      <main className="flex-1 pb-20 sm:pb-8">
        {/* Decorative background elements */}
        <div className="absolute top-32 left-4 w-32 h-32 bg-[#DAA520]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-64 right-8 w-48 h-48 bg-[#F4C430]/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto px-4 relative">
          {/* Wishlist Title Section */}
          <SharedWishlistHeader
            wishlistTitle={data.wishlist.title}
            sharedBy={data.sharedBy}
            description={data.wishlist.description}
          />

          {/* Item Count Badge */}
          <div className="flex items-center justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border-2 border-[#DAA520]/30 shadow-sm">
              <Gift className="w-4 h-4 text-[#DAA520]" />
              <span className="text-sm font-semibold text-[#8B4513]">
                {data.items.length} {data.items.length === 1 ? 'item' : 'items'} on this wishlist
              </span>
            </div>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {data.items.map((item, index) => (
              <ProductCard key={item.id} item={item} index={index} />
            ))}
          </div>

          {/* Footer Disclaimer */}
          <div className="mt-10">
            <FooterDisclaimer />
          </div>

          {/* CTA Section */}
          <WishlistCTA isLoggedIn={isLoggedIn} />
        </div>
      </main>
      <Footer />
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
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Shared By Info */}
          <div className="text-center mb-6">
            <p className="text-sm text-[#A0522D]">
              Shared by <span className="font-semibold text-[#8B4513]">{data.sharedBy}</span>
            </p>
          </div>

          {/* Product Card */}
          <Card className="overflow-hidden bg-white border-2 border-[#DAA520]/30 shadow-lg rounded-xl">
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
                    {data.product.reviewCount.toLocaleString()} reviews
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
                <Button className="w-full h-12 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] hover:from-[#F4C430] hover:to-[#DAA520] text-[#654321] font-semibold shadow-md hover:shadow-lg transition-all">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  View on Store
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </a>
            )}
          </div>
        </Card>

          {/* Disclaimer */}
          <p className="text-xs text-[#A0522D] text-center mt-6">
            {data.disclaimer}
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}

// Product Card Component for grid - Enhanced with warm colors
function ProductCard({ item, index }: { item: SharedProduct; index: number }) {
  const hasDiscount = item.originalPrice && item.price && item.originalPrice > item.price
  const discountPercent = hasDiscount 
    ? Math.round(((item.originalPrice! - item.price!) / item.originalPrice!) * 100)
    : 0

  return (
    <Card 
      className="group overflow-hidden bg-white/90 backdrop-blur-sm border-2 border-[#DAA520]/20 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 rounded-2xl hover:border-[#DAA520]/40"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Image */}
      <div className="aspect-square relative bg-gradient-to-br from-[#FFF8DC] to-white overflow-hidden">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="w-20 h-20 rounded-full bg-[#DAA520]/10 flex items-center justify-center">
              <Gift className="w-10 h-10 text-[#DAA520]" />
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {item.priority && item.priority <= 3 && (
            <Badge className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] text-[9px] font-bold shadow-sm">
              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
              Top Pick
            </Badge>
          )}
          {item.amazonChoice && (
            <Badge className="bg-[#232F3E] text-white text-[9px] shadow-sm">
              <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
              Choice
            </Badge>
          )}
          {item.bestSeller && (
            <Badge className="bg-[#FF9900] text-[#232F3E] text-[9px] font-bold shadow-sm">
              <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
              Best Seller
            </Badge>
          )}
        </div>

        {hasDiscount && (
          <Badge className="absolute top-3 right-3 bg-gradient-to-r from-[#E74C3C] to-[#C0392B] text-white text-[10px] font-bold shadow-md px-2 py-1">
            -{discountPercent}% OFF
          </Badge>
        )}

        {/* Wishlist heart indicator */}
        <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center border border-[#DAA520]/30">
          <svg className="w-4 h-4 text-[#E74C3C] fill-current" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 bg-gradient-to-b from-white to-[#FFF8DC]/30">
        {item.storeName && (
          <div className="flex items-center gap-1 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#DAA520]"></div>
            <p className="text-[10px] text-[#8B6914] font-medium uppercase tracking-wide">
              {item.storeName}
            </p>
          </div>
        )}

        <h3 className="font-bold text-[#8B4513] text-sm line-clamp-2 mb-2 min-h-[40px] group-hover:text-[#654321] transition-colors">
          {item.name}
        </h3>

        {/* Rating */}
        {item.rating && (
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.floor(item.rating!)
                      ? "fill-[#F4C430] text-[#F4C430]"
                      : "text-[#DAA520]/30"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] text-[#8B6914] font-medium">
              {item.rating.toFixed(1)}
              {item.reviewCount && (
                <span className="text-[#A0522D]/70"> {item.reviewCount.toLocaleString()}</span>
              )}
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          {item.price && (
            <p className="text-xl font-extrabold text-[#27AE60]">
              ${item.price.toFixed(2)}
            </p>
          )}
          {hasDiscount && (
            <p className="text-sm text-[#A0522D]/60 line-through">
              ${item.originalPrice!.toFixed(2)}
            </p>
          )}
        </div>

        {/* Stock Status */}
        {item.stockStatus && (
          <div className="mb-3">
            <Badge
              variant="outline"
              className={`text-[10px] font-medium ${
                item.stockStatus.toLowerCase().includes("in stock")
                  ? "border-[#27AE60] text-[#27AE60] bg-[#27AE60]/10"
                  : "border-[#F39C12] text-[#F39C12] bg-[#F39C12]/10"
              }`}
            >
              {item.stockStatus}
            </Badge>
          </div>
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
              className="w-full h-11 rounded-xl bg-gradient-to-r from-[#DAA520] to-[#F4C430] hover:from-[#F4C430] hover:to-[#DAA520] text-[#654321] font-bold text-sm transition-all duration-300 hover:scale-[1.02] shadow-md hover:shadow-lg group-hover:shadow-lg"
            >
              <ShoppingCart className="w-4 h-4 mr-1.5" />
              View Product
              <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-70" />
            </Button>
          </a>
        )}
      </div>
    </Card>
  )
}
