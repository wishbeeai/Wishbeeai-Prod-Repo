"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Info } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
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

// Unique color per category label - adjusts based on label name (exact, partial, or hash)
function getCategoryColor(category: string): { bg: string; text: string; border: string } {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    Electronics: { bg: "from-blue-100 to-sky-100", text: "text-blue-700", border: "border-blue-200" },
    "Home & Kitchen": { bg: "from-amber-100 to-yellow-100", text: "text-amber-700", border: "border-amber-200" },
    Clothing: { bg: "from-violet-100 to-purple-100", text: "text-violet-700", border: "border-violet-200" },
    Beauty: { bg: "from-pink-100 to-fuchsia-100", text: "text-pink-700", border: "border-pink-200" },
    Sports: { bg: "from-emerald-100 to-teal-100", text: "text-emerald-700", border: "border-emerald-200" },
    Toys: { bg: "from-orange-100 to-amber-100", text: "text-orange-700", border: "border-orange-200" },
    Books: { bg: "from-indigo-100 to-blue-100", text: "text-indigo-700", border: "border-indigo-200" },
    Food: { bg: "from-yellow-100 to-lime-100", text: "text-yellow-800", border: "border-yellow-200" },
    Jewelry: { bg: "from-rose-100 to-pink-100", text: "text-rose-700", border: "border-rose-200" },
    "Pet Supplies": { bg: "from-teal-100 to-cyan-100", text: "text-teal-700", border: "border-teal-200" },
    Garden: { bg: "from-green-100 to-emerald-100", text: "text-green-700", border: "border-green-200" },
    Automotive: { bg: "from-slate-100 to-gray-100", text: "text-slate-700", border: "border-slate-200" },
    Health: { bg: "from-cyan-100 to-sky-100", text: "text-cyan-700", border: "border-cyan-200" },
    Baby: { bg: "from-sky-100 to-blue-100", text: "text-sky-700", border: "border-sky-200" },
    Office: { bg: "from-stone-100 to-neutral-100", text: "text-stone-700", border: "border-stone-200" },
    Fashion: { bg: "from-fuchsia-100 to-purple-100", text: "text-fuchsia-700", border: "border-fuchsia-200" },
    Photography: { bg: "from-purple-100 to-indigo-100", text: "text-purple-700", border: "border-purple-200" },
    Tech: { bg: "from-slate-100 to-blue-100", text: "text-slate-800", border: "border-slate-200" },
    General: { bg: "from-amber-100 to-orange-100", text: "text-amber-800", border: "border-amber-200" },
    Gifts: { bg: "from-rose-100 to-red-100", text: "text-rose-800", border: "border-rose-200" },
  }
  const lower = category.toLowerCase()
  if (map[category]) return map[category]
  for (const [key, val] of Object.entries(map)) {
    const k = key.toLowerCase()
    if (lower.includes(k) || k.includes(lower)) return val
  }
  // Word-based match for compound labels (e.g. "Electronic Components & Home Audio", "Patio, Lawn and Garden")
  for (const [key, val] of Object.entries(map)) {
    const parts = key.toLowerCase().replace(/[&,]/g, " ").split(/\s+/).filter(Boolean)
    for (const part of parts) {
      const stem = part.length > 4 ? part.replace(/s$/, "") : part
      if (lower.includes(part) || lower.includes(stem)) return val
    }
  }
  const hash = category.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const fallbacks = [
    { bg: "from-rose-100 to-pink-100", text: "text-rose-700", border: "border-rose-200" },
    { bg: "from-amber-100 to-yellow-100", text: "text-amber-700", border: "border-amber-200" },
    { bg: "from-blue-100 to-sky-100", text: "text-blue-700", border: "border-blue-200" },
    { bg: "from-violet-100 to-purple-100", text: "text-violet-700", border: "border-violet-200" },
    { bg: "from-emerald-100 to-teal-100", text: "text-emerald-700", border: "border-emerald-200" },
    { bg: "from-orange-100 to-amber-100", text: "text-orange-700", border: "border-orange-200" },
    { bg: "from-indigo-100 to-blue-100", text: "text-indigo-700", border: "border-indigo-200" },
    { bg: "from-teal-100 to-cyan-100", text: "text-teal-700", border: "border-teal-200" },
    { bg: "from-fuchsia-100 to-purple-100", text: "text-fuchsia-700", border: "border-fuchsia-200" },
  ]
  return fallbacks[hash % fallbacks.length]
}

/**
 * Picks diverse gifts from every category, rotating daily.
 * - Groups gifts by category (normalized)
 * - Picks 1 from each category first for variety
 * - Uses day seed to rotate which items show each day
 */
function getDailyRotatedGifts(allGifts: DisplayGift[], count = 4): DisplayGift[] {
  if (allGifts.length === 0) return []

  const daySeed = Math.floor(Date.now() / (1000 * 60 * 60 * 24))

  // Group by normalized category
  const byCategory = new Map<string, DisplayGift[]>()
  for (const g of allGifts) {
    const cat = (g.category || "General").trim().toLowerCase() || "general"
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat)!.push(g)
  }

  const categories = Array.from(byCategory.keys())
  if (categories.length === 0) return allGifts.slice(0, count)

  // Shuffle category order by day for rotation
  const shuffledCats = [...categories].sort((a, b) => {
    const hash = (s: string) => s.split("").reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0)
    return (hash(a) + daySeed) % 1000 - (hash(b) + daySeed) % 1000
  })

  const result: DisplayGift[] = []
  const usedIds = new Set<string | number>()

  // Round 1: pick one from each category (diverse)
  for (const cat of shuffledCats) {
    if (result.length >= count) break
    const gifts = byCategory.get(cat) ?? []
    if (gifts.length === 0) continue
    const idx = (daySeed + result.length) % gifts.length
    const pick = gifts[idx]
    if (!usedIds.has(pick.id)) {
      result.push(pick)
      usedIds.add(pick.id)
    }
  }

  // Round 2+: fill remaining slots from any category, rotating by day
  if (result.length < count) {
    const flat = allGifts.filter((g) => !usedIds.has(g.id))
    const start = (daySeed * count) % Math.max(1, flat.length)
    for (let i = 0; i < count - result.length && i < flat.length; i++) {
      const idx = (start + i) % flat.length
      const pick = flat[idx]
      if (!usedIds.has(pick.id)) {
        result.push(pick)
        usedIds.add(pick.id)
      }
    }
  }

  return result.slice(0, count)
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
          setAllGifts([])
        }
      } catch {
        setAllGifts([])
      }
    }
    fetchTrending()
  }, [])

  const trendingGifts = useMemo(() => getDailyRotatedGifts(allGifts, 4), [allGifts])
  return (
    <section className="relative pt-12 pb-16 sm:pb-20 md:pb-24 lg:pb-28 px-4 bg-gradient-to-b from-[#FFFDF7] via-[#FFF8EE] to-[#FFF5E6] overflow-hidden">
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-6">
          <h2 className="text-[30px] font-bold text-[#8B4513] mb-1">
            Trending Picks
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-[#8B4513]/80 font-light mb-3 leading-relaxed">Our most popular and highly-rated gifts from every category.</p>

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
                <div className="absolute top-3 left-3 right-3 flex flex-col gap-1.5">
                  {gift.category ? (() => {
                    const colors = getCategoryColor(gift.category)
                    const isLong = gift.category.length > 28
                    return (
                      <div className={`w-fit max-w-[220px] truncate bg-gradient-to-r ${colors.bg} backdrop-blur-sm ${colors.text} rounded-full font-bold shadow-md border ${colors.border} ${isLong ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"}`} title={gift.category}>
                        {gift.category}
                      </div>
                    )
                  })() : null}
                  {gift.originalPrice != null && gift.originalPrice > gift.price && (
                    <div className="self-end bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg animate-pulse">
                      SALE
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
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
                      <span className="text-xs text-[#8B4513]/80"> ({gift.reviewCount.toLocaleString()})</span>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-[#8B4513]/60 hover:text-[#8B4513] cursor-help ml-1 flex-shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[220px] bg-[#FFFBF5] text-[#654321] border border-[#DAA520]/30 text-xs p-2 rounded-lg shadow-lg">
                        <p>Ratings, reviews, and prices are shown as captured when the item was added and may change on the retailer&apos;s website.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}

                {/* Badges - always reserve one line so layout stays consistent */}
                <div className="flex flex-wrap gap-1 mb-2 min-h-[24px] items-center">
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
