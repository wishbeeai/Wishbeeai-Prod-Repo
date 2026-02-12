"use client"

import { useState, useEffect } from "react"
import { getGiftCardsForGalleryAction } from "@/lib/actions/reloadly"
import type { ReloadlyProduct } from "@/lib/reloadly"
import { Gift } from "lucide-react"
import Image from "next/image"

const EMPTY_MESSAGE =
  "We're restocking our gift card catalog. In the meantime, you can instantly claim your balance as Wishbee Credits for your next gift! 🐝"

export type ReloadlyGiftCardGalleryProps = {
  /** Called when user selects a product (e.g. to prefill productId for order). */
  onSelectProduct?: (product: ReloadlyProduct | null) => void
  /** Optional: limit number of cards shown (default all). */
  maxCards?: number
  /** Called when user clicks "Use Wishbee Credits Instead" in the empty state. */
  onUseWishbeeCredits?: () => void
}

export function ReloadlyGiftCardGallery({
  onSelectProduct,
  maxCards,
  onUseWishbeeCredits,
}: ReloadlyGiftCardGalleryProps) {
  const [products, setProducts] = useState<ReloadlyProduct[]>([])
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getGiftCardsForGalleryAction()
      .then((result) => {
        if (cancelled) return
        if (result.success) {
          setProducts(result.products)
          setBalance(result.balance)
        } else {
          setProducts([])
          setBalance(0)
          setError(result.error)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setProducts([])
          setBalance(0)
          setError(e instanceof Error ? e.message : "Failed to load gift cards")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleCardClick = (product: ReloadlyProduct) => {
    const nextId = selectedProductId === product.productId ? null : product.productId
    setSelectedProductId(nextId)
    onSelectProduct?.(nextId === null ? null : product)
  }

  const reloadlyProductsEmpty = products.length === 0
  const reloadlyBalanceInsufficient = balance <= 0
  const showEmptyState =
    !loading && (reloadlyProductsEmpty || reloadlyBalanceInsufficient)
  const displayProducts = maxCards != null ? products.slice(0, maxCards) : products

  const emptyStateContent = (
    <>
      <p className="text-[#654321] font-medium leading-relaxed">{EMPTY_MESSAGE}</p>
      <button
        type="button"
        onClick={() => onUseWishbeeCredits?.()}
        className="mt-4 w-full max-w-xs mx-auto py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#654321] hover:bg-[#4A2F1A] shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[#DAA520] focus:ring-offset-2"
      >
        Use Wishbee Credits Instead
      </button>
    </>
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[#8B5A3C]/80">
        <div className="w-10 h-10 border-2 border-[#DAA520]/40 border-t-[#DAA520] rounded-full animate-spin mb-3" />
        <p className="text-sm font-medium">Loading gift cards...</p>
      </div>
    )
  }

  if (showEmptyState) {
    return (
      <div className="rounded-xl border-2 border-[#DAA520]/25 bg-[#FFFBEB]/80 shadow-sm p-6 sm:p-8 text-center">
        <div className="rounded-lg bg-[#F5F1E8]/90 border border-[#DAA520]/20 p-4 sm:p-5 text-left">
          {emptyStateContent}
        </div>
      </div>
    )
  }

  if (error && reloadlyProductsEmpty) {
    return (
      <div className="rounded-xl border-2 border-[#DAA520]/25 bg-[#FFFBEB]/80 shadow-sm p-6 text-center">
        <div className="rounded-lg bg-[#F5F1E8]/90 border border-[#DAA520]/20 p-4 sm:p-5 text-left">
          <p className="text-amber-800 text-sm font-medium">{error}</p>
          <p className="text-[#654321] mt-2 text-sm leading-relaxed">{EMPTY_MESSAGE}</p>
          <button
            type="button"
            onClick={() => onUseWishbeeCredits?.()}
            className="mt-4 w-full max-w-xs mx-auto py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#654321] hover:bg-[#4A2F1A] shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[#DAA520] focus:ring-offset-2"
          >
            Use Wishbee Credits Instead
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
      {displayProducts.map((product) => {
        const isSelected = selectedProductId === product.productId
        const logoUrl = (product.logoUrls as string[] | undefined)?.[0]
        return (
          <button
            key={product.productId}
            type="button"
            onClick={() => handleCardClick(product)}
            className={`
              flex flex-col items-center justify-center p-4 rounded-xl border-2 bg-white
              transition-all hover:-translate-y-1
              text-left w-full min-h-[120px]
              ${isSelected ? "border-[#DAA520] shadow-md shadow-[#DAA520]/20" : "border-[#DAA520]/30 hover:border-[#DAA520]/60"}
            `}
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-[#F5F1E8] flex items-center justify-center mb-2 flex-shrink-0">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt=""
                  width={56}
                  height={56}
                  className="object-contain w-full h-full"
                  unoptimized
                />
              ) : (
                <Gift className="w-6 h-6 sm:w-7 sm:h-7 text-[#DAA520]" aria-hidden />
              )}
            </div>
            <span className="text-xs sm:text-sm font-medium text-[#654321] line-clamp-2 text-center">
              {product.productName ?? `Product ${product.productId}`}
            </span>
            {isSelected && (
              <span className="mt-1.5 text-[10px] font-semibold text-[#B8860B]">Selected</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
