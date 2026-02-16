"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

type DisplayGift = {
  id: string | number
  name: string
  category: string
  price: number
  image: string
  rating?: number
  reviewCount?: number
  originalPrice?: number
  amazonChoice?: boolean
  bestSeller?: boolean
  overallPick?: boolean
}

// Fallback data when API returns no gifts (name, category, price, image only)
const FALLBACK_GIFTS: DisplayGift[] = [
  { id: 1, name: "Premium Espresso Machine", category: "Home & Kitchen", price: 899, image: "/professional-espresso-setup.png" },
  { id: 2, name: "Designer Handbag", category: "Fashion", price: 1250, image: "/luxury-quilted-handbag.png" },
  { id: 3, name: "Smart Home Hub Package", category: "Tech", price: 650, image: "/smart-home-devices.jpg" },
  { id: 4, name: "Professional Camera Kit", category: "Photography", price: 1899, image: "/camera-kit-professional.jpg" },
]

function getDailyRotatedGifts(allGifts: DisplayGift[], count = 4) {
  const total = allGifts.length
  if (total === 0) return []
  const windows = Math.max(1, Math.floor(total / count))
  const dayOffset = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % windows
  const start = dayOffset * count
  return allGifts.slice(start, start + count)
}

export function TrendingGifts() {
  const [allGifts, setAllGifts] = useState<DisplayGift[]>([])

  useEffect(() => {
    async function fetchTrending() {
      try {
        const res = await fetch("/api/trending-gifts")
        const data = await res.json()
        if (data.success && Array.isArray(data.gifts) && data.gifts.length > 0) {
          const mapped: DisplayGift[] = data.gifts.map((g: { id: string; productName?: string; image?: string; category?: string; price?: number; originalPrice?: number; reviewCount?: number; rating?: number; amazonChoice?: boolean; bestSeller?: boolean; overallPick?: boolean }) => ({
            id: g.id,
            name: g.productName ?? "Gift",
            category: g.category ?? "Gifts",
            price: typeof g.price === "number" ? g.price : 0,
            image: g.image ?? "/placeholder.svg",
            ...(typeof g.rating === "number" && { rating: g.rating }),
            ...(typeof g.reviewCount === "number" && { reviewCount: g.reviewCount }),
            ...(typeof g.originalPrice === "number" && { originalPrice: g.originalPrice }),
            ...(g.amazonChoice === true && { amazonChoice: true }),
            ...(g.bestSeller === true && { bestSeller: true }),
            ...(g.overallPick === true && { overallPick: true }),
          }))
          setAllGifts(mapped)
        } else {
          setAllGifts(FALLBACK_GIFTS)
        }
      } catch {
        setAllGifts(FALLBACK_GIFTS)
      }
    }
    fetchTrending()
  }, [])

  const trendingGifts = useMemo(() => getDailyRotatedGifts(allGifts.length > 0 ? allGifts : FALLBACK_GIFTS, 4), [allGifts])
  return (
    <section className="relative py-12 px-4 bg-gradient-to-b from-[#FFFDF7] via-[#FFF8EE] to-[#FFF5E6] overflow-hidden">
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-6">
          <h2 className="text-[30px] font-bold text-[#8B4513] mb-1">
            Trending Picks
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-[#8B4513]/80 font-light mb-3 leading-relaxed">Our most popular and highly-rated gifts.</p>

          <Link href="/gifts/trending" className="inline-block">
            <Button className="bg-gradient-to-r from-[#DAA520] to-[#FFD700] hover:from-[#B8860B] hover:to-[#DAA520] text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 border-2 border-amber-400 hover:border-amber-400 hover:-translate-y-2">
              Explore All Gifts
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingGifts.map((gift, index) => (
            <div
              key={gift.id}
              className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group border-2 border-amber-200 hover:border-amber-400 hover:-translate-y-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative h-52 sm:h-56 flex items-center justify-center">
                <div className="relative w-full max-w-[150px] sm:max-w-[170px] aspect-square mx-auto">
                  <Image
                    src={gift.image || "/placeholder.svg"}
                    alt={gift.name}
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {gift.originalPrice != null && gift.originalPrice > gift.price && (
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg animate-pulse">
                    SALE
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="text-xs text-[#8B4513] uppercase tracking-wider font-bold mb-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B4513]" />
                  {gift.category}
                </div>
                <h3
                  className="font-bold text-[#8B4513] mb-2 text-[16px] line-clamp-3 group-hover:text-[#8B4513]/90 transition-colors"
                  title={gift.name}
                >
                  {gift.name}
                </h3>

                {/* Stars & Review count - same as Trending */}
                {gift.rating != null && gift.rating > 0 && (
                  <div className="flex items-center gap-2 mb-2 bg-amber-50/50 rounded-lg px-2 py-1 w-fit">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((starPosition) => {
                        const rating = gift.rating ?? 0
                        const fillAmount = Math.max(0, Math.min(1, rating - (starPosition - 1)))
                        const fillPercent = Math.round(fillAmount * 100)
                        const gradientId = `star-popular-${gift.id}-${starPosition}`
                        return (
                          <svg key={starPosition} className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset={`${fillPercent}%`} stopColor="#F4C430" />
                                <stop offset={`${fillPercent}%`} stopColor="#E5E7EB" />
                              </linearGradient>
                            </defs>
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={`url(#${gradientId})`} stroke="#F4C430" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )
                      })}
                    </div>
                    <span className="text-sm font-bold text-[#8B4513]">{gift.rating.toFixed(1)}</span>
                    {gift.reviewCount != null && gift.reviewCount > 0 && (
                      <span className="text-xs text-[#8B4513]/80"> {gift.reviewCount.toLocaleString()}</span>
                    )}
                  </div>
                )}

                {/* Badges - same as Trending */}
                {(gift.amazonChoice || gift.bestSeller || gift.overallPick) && (
                  <div className="flex flex-wrap gap-1 mb-2 min-h-[24px]">
                    {gift.amazonChoice && (
                      <span className="bg-gradient-to-r from-gray-900 to-black text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">Amazon&apos;s Choice</span>
                    )}
                    {gift.bestSeller && (
                      <span className="text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm" style={{ backgroundColor: "#D14900" }}>#1 Best Seller</span>
                    )}
                    {gift.overallPick && (
                      <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">⭐ Overall Pick</span>
                    )}
                  </div>
                )}

                {/* List price & Sale price - same as Trending */}
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  {gift.originalPrice != null && gift.originalPrice > gift.price ? (
                    <>
                      <span className="font-bold text-base text-[#8B4513]">${gift.price.toFixed(2)}</span>
                      <span className="text-[#8B4513]/60 line-through text-xs">${gift.originalPrice.toFixed(2)}</span>
                      <span className="bg-red-100 text-red-600 font-semibold text-[10px] px-1.5 py-0.5 rounded-full">
                        -{Math.round(((gift.originalPrice - gift.price) / gift.originalPrice) * 100)}%
                      </span>
                    </>
                  ) : (
                    <span className="font-bold text-base text-[#8B4513]">${gift.price.toFixed(2)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
