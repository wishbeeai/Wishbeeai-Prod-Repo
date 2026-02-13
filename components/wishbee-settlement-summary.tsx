"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { Loader2, Gift, Search, ChevronLeft, ChevronRight, Check } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
export type ReloadlyProductOption = {
  productId: number
  productName: string
  logoUrls?: string[]
}

export type WishbeeSettlementSummaryProps = {
  giftId: string
  giftName: string
  /** Total pool (Gross Wishbee Funds) */
  grossWishbeeFunds: number
  /** Platform/Stripe fee deducted from pool (optional; default 0) */
  processingFeeAmount?: number
  /** Ignored; kept for backward compatibility with callers */
  mainGiftAmount?: number
  recipientName: string
  /** Pre-filled or empty; user can edit if needed */
  recipientEmail: string
  /** Total funds collected for the gift (for API) */
  totalFundsCollected: number
  /** Final gift price (primary gift cost) for API */
  finalGiftPrice: number
  /** Gift card brand label (e.g. "Amazon") */
  giftCardBrand?: string
  /** Ignored; charity is handled separately */
  charities?: unknown[]
  /** Ignored; charity is handled separately */
  selectedCharityId?: string
  /** Ignored; charity is handled separately */
  onSelectedCharityChange?: (charityId: string) => void
  onSuccess?: (data: { claimUrl: string; settlement: unknown }) => void
  onError?: (error: string) => void
}

export function WishbeeSettlementSummary({
  giftId,
  giftName,
  grossWishbeeFunds,
  processingFeeAmount = 0,
  recipientName,
  recipientEmail: initialRecipientEmail,
  totalFundsCollected,
  finalGiftPrice,
  giftCardBrand = "Gift Card",
  onSuccess,
  onError,
  // charity-related props accepted but unused; charity is handled separately
}: WishbeeSettlementSummaryProps) {
  const fee = processingFeeAmount ?? 0
  const netToDistribute = Math.round((grossWishbeeFunds - fee) * 100) / 100

  const [giftCardAmount, setGiftCardAmount] = useState(() => netToDistribute)
  const [recipientEmail, setRecipientEmail] = useState(initialRecipientEmail)
  const [loading, setLoading] = useState(false)
  const [settlementSuccess, setSettlementSuccess] = useState(false)
  const [products, setProducts] = useState<ReloadlyProductOption[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [balanceOk, setBalanceOk] = useState<boolean | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<"popularity" | "name-asc" | "name-desc">("popularity")
  const catalogScrollRef = useRef<HTMLDivElement>(null)
  const CARD_WIDTH = 160
  const CARD_GAP = 6
  const CARD_STEP = CARD_WIDTH + CARD_GAP

  const giftCardClamped = Math.max(0, Math.min(netToDistribute, Math.round(giftCardAmount * 100) / 100))

  const filteredAndSortedProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let list = products.filter((p) => {
      const name = (p.productName ?? "").toLowerCase()
      if (name.includes("pubg")) return false
      return q ? name.includes(q) : true
    })
    // Deduplicate by productId (keep first occurrence)
    const seen = new Set<number>()
    list = list.filter((p) => {
      if (seen.has(p.productId)) return false
      seen.add(p.productId)
      return true
    })
    if (sortOrder === "popularity") {
      return list
    }
    list = [...list].sort((a, b) => {
      const nameA = (a.productName ?? "").toLowerCase()
      const nameB = (b.productName ?? "").toLowerCase()
      return sortOrder === "name-asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })
    return list
  }, [products, searchQuery, sortOrder])

  // Fetch US gift card products (Reloadly)
  useEffect(() => {
    let cancelled = false
    setProductsLoading(true)
    fetch("/api/reloadly/products?country=US")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        const raw = Array.isArray(data?.products) ? data.products : []
        const seenIds = new Set<number>()
        const unique = raw
          .filter((p: { productId: number }) => {
            if (seenIds.has(p.productId)) return false
            seenIds.add(p.productId)
            return true
          })
          .map((p: { productId: number; productName?: string; logoUrls?: string[] }) => ({
            productId: p.productId,
            productName: p.productName ?? "Gift Card",
            logoUrls: p.logoUrls ?? [],
          }))
        setProducts(unique)
        if (unique.length > 0 && selectedProductId == null) {
          setSelectedProductId(unique[0].productId)
        }
      })
      .catch(() => {
        if (!cancelled) setProducts([])
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Check Reloadly balance when amount or gift changes
  useEffect(() => {
    if (giftCardClamped < 1) {
      setBalanceOk(null)
      return
    }
    let cancelled = false
    setBalanceLoading(true)
    setBalanceOk(null)
    fetch(`/api/gifts/${giftId}/reloadly-balance?amount=${encodeURIComponent(giftCardClamped)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        setBalanceOk(data?.canFulfillGiftCard === true)
      })
      .catch(() => {
        if (!cancelled) setBalanceOk(false)
      })
      .finally(() => {
        if (!cancelled) setBalanceLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [giftId, giftCardClamped])

  const handleSendWishbee = async () => {
    const email = recipientEmail.trim()
    if (!email) {
      onError?.("Please enter recipient email for the gift card.")
      return
    }
    if (giftCardClamped < 1) {
      onError?.("Gift card amount must be at least $1.00.")
      return
    }

    setLoading(true)
    try {
      const productIdToSend = selectedProductId ?? products[0]?.productId
      const body = {
        amount: giftCardClamped,
        ...(productIdToSend != null && { productId: productIdToSend }),
        recipientEmail: email,
        recipientName,
        giftName,
        totalFundsCollected,
        finalGiftPrice,
      }

      const res = await fetch(`/api/gifts/${giftId}/settle-wishbee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        onError?.(data?.error ?? "Settlement failed. Please try again.")
        return
      }
      setSettlementSuccess(true)
      onSuccess?.({ claimUrl: data.claimUrl, settlement: data.settlement })
    } catch (e) {
      const msg =
        typeof e === "string"
          ? e
          : e instanceof Error
            ? e.message
            : e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string"
              ? (e as { message: string }).message
              : "Something went wrong."
      onError?.(msg)
    } finally {
      setLoading(false)
    }
  }

  const canFulfill = balanceOk === true
  const refillingStock = giftCardClamped >= 1 && (balanceLoading || balanceOk === false)
  const canSend =
    recipientEmail.trim().length > 0 &&
    giftCardClamped >= 1 &&
    canFulfill &&
    (selectedProductId != null || products[0]?.productId != null)

  const selectedProduct = useMemo(
    () => products.find((p) => p.productId === selectedProductId) ?? products[0] ?? null,
    [products, selectedProductId]
  )

  // When selection changes (e.g. from list), scroll carousel to that card
  useEffect(() => {
    if (!catalogScrollRef.current || selectedProductId == null) return
    const idx = filteredAndSortedProducts.findIndex((p) => p.productId === selectedProductId)
    if (idx < 0) return
    const scrollLeft = idx * CARD_STEP
    catalogScrollRef.current.scrollTo({ left: scrollLeft, behavior: "smooth" })
  }, [selectedProductId, filteredAndSortedProducts])

  return (
    <div className="space-y-6">
      {/* Single card: balance summary + gift card amount + browse + send */}
      <div className="rounded-2xl border border-[#DAA520]/20 bg-white overflow-hidden shadow-sm shadow-[#DAA520]/10">
        <div className="px-5 py-3 border-b border-[#DAA520]/15 bg-gradient-to-r from-[#FFFBEB] to-[#FEF7ED]/90">
          <p className="text-xs font-semibold text-[#654321] uppercase tracking-wider">Balance summary</p>
        </div>

        <div className="px-5 py-4 border-b border-[#DAA520]/10">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-[#DAA520]/10">
                <td className="py-3 px-0 text-[#654321]">Gross Wishbee Funds</td>
                <td className="py-3 px-0 text-right font-semibold tabular-nums text-[#654321]">
                  ${grossWishbeeFunds.toFixed(2)}
                </td>
              </tr>
              <tr className="border-b border-[#DAA520]/10">
                <td className="py-3 px-0 text-[#8B5A3C]">Processing Fees</td>
                <td className="py-3 px-0 text-right tabular-nums text-[#8B5A3C]">
                  −${fee.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-0 text-[#654321] font-semibold">Net to Distribute</td>
                <td className="py-3 px-0 text-right font-bold tabular-nums text-[#B8860B]">
                  ${netToDistribute.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="pt-4">
            <label className="block text-[14px] font-medium text-[#654321] mb-3">Gift card amount</label>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <input
                type="range"
                min={0}
                max={Math.max(0.01, netToDistribute)}
                step={0.01}
                value={giftCardClamped}
                onChange={(e) => setGiftCardAmount(Number(e.target.value))}
                className="flex-1 w-full h-3 rounded-full appearance-none bg-[#DAA520]/20 accent-[#DAA520]"
                aria-label="Gift card amount"
              />
              <div className="flex items-center shrink-0 sm:w-28">
                <span className="flex items-center rounded-l-lg border border-r-0 border-[#DAA520]/25 bg-[#FFFBEB]/50 px-3 py-2.5 text-sm font-semibold text-[#654321] tabular-nums">
                  $
                </span>
                <input
                  type="number"
                  min={0}
                  max={netToDistribute}
                  step={0.01}
                  value={giftCardAmount === 0 ? "" : giftCardAmount}
                  placeholder="0.00"
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    if (e.target.value === "" || isNaN(v)) setGiftCardAmount(0)
                    else setGiftCardAmount(Math.min(netToDistribute, Math.max(0, v)))
                  }}
                  className="flex-1 w-full rounded-r-lg border border-[#DAA520]/25 bg-[#FFFBEB]/30 py-2.5 px-3 text-sm font-semibold text-[#654321] tabular-nums focus:border-[#B8860B] focus:ring-2 focus:ring-[#DAA520]/25 outline-none min-w-0"
                  aria-label="Gift card amount in dollars"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Browse gift cards */}
        <div className="px-5 py-4 border-b border-[#DAA520]/10">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#DAA520]/15">
              <Gift className="w-4 h-4 text-[#B8860B]" aria-hidden />
            </span>
            <p className="text-sm font-semibold text-[#654321]">Browse gift cards</p>
          </div>
            {!productsLoading && products.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-3 rounded-xl bg-[#FFFBEB] border border-[#DAA520]/20 mb-4">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B5A3C]/70 pointer-events-none" aria-hidden />
                  <input
                    type="search"
                    placeholder="Search gift cards..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#DAA520]/25 bg-white text-[#654321] placeholder:text-[#8B5A3C]/60 focus:border-[#B8860B] focus:ring-2 focus:ring-[#DAA520]/20 outline-none text-sm"
                    aria-label="Search gift cards"
                  />
                </div>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "popularity" | "name-asc" | "name-desc")}
                  className="sm:w-44 py-2.5 px-3 rounded-lg border border-[#DAA520]/25 bg-white text-[#654321] text-sm font-medium focus:border-[#B8860B] focus:ring-2 focus:ring-[#DAA520]/20 outline-none"
                  aria-label="Sort order"
                >
                  <option value="popularity">Popularity</option>
                  <option value="name-asc">Name A → Z</option>
                  <option value="name-desc">Name Z → A</option>
                </select>
              </div>
            )}
            {productsLoading ? (
              <div className="rounded-xl bg-[#FEF7ED]/80 border border-[#DAA520]/15 p-14 flex flex-col items-center justify-center gap-4 min-h-[180px]">
                <Loader2 className="w-10 h-10 text-[#DAA520] animate-spin" aria-hidden />
                <p className="text-sm text-[#8B5A3C]">Loading gift cards...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-xl bg-[#FEF7ED]/80 border border-[#DAA520]/15 p-8 text-center space-y-5">
                <p className="text-[#654321] font-medium leading-relaxed">
                  We're restocking our gift card catalog. You can claim your balance as Wishbee Credits in the meantime.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href={`/settle/refund-credits?id=${giftId}`}
                    className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold text-white bg-[#654321] hover:bg-[#4A2F1A] transition-colors shadow-sm"
                  >
                    Use Wishbee Credits instead
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setProducts([])
                      setProductsLoading(true)
                      fetch("/api/reloadly/products?country=US")
                        .then((res) => res.json())
                        .then((data) => {
                          const list = Array.isArray(data?.products) ? data.products : []
                          setProducts(
                            list.map((p: { productId: number; productName?: string; logoUrls?: string[] }) => ({
                              productId: p.productId,
                              productName: p.productName ?? "Gift Card",
                              logoUrls: p.logoUrls ?? [],
                            }))
                          )
                          if (list.length > 0) setSelectedProductId(list[0].productId)
                        })
                        .catch(() => setProducts([]))
                        .finally(() => setProductsLoading(false))
                    }}
                    className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-medium text-[#654321] border-2 border-[#DAA520]/40 hover:bg-[#FFFBEB] transition-colors"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 w-full min-w-0 max-w-full">
                <button
                  type="button"
                  onClick={() => {
                    const el = catalogScrollRef.current
                    if (el) el.scrollBy({ left: -CARD_STEP, behavior: "smooth" })
                  }}
                  className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#FFFBEB] border border-[#DAA520]/25 text-[#654321] hover:bg-[#FEF7ED] hover:border-[#DAA520]/50 hover:shadow-sm flex items-center justify-center transition-all"
                  aria-label="Previous gift cards"
                >
                  <ChevronLeft className="w-5 h-5" aria-hidden />
                </button>
                <div
                  ref={catalogScrollRef}
                  className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden scrollbar-thin scroll-smooth py-1"
                >
                  <div className="flex flex-nowrap gap-[6px] min-w-0">
                    {filteredAndSortedProducts.length === 0 ? (
                      <div className="w-full px-6 py-12 text-center text-sm text-[#8B5A3C] rounded-xl bg-[#FEF7ED]/60">
                        No gift cards match your search.
                      </div>
                    ) : (
                      filteredAndSortedProducts.map((p, idx) => {
                        const isSelected = selectedProductId === p.productId
                        const logoUrl = p.logoUrls?.[0]
                        return (
                          <button
                            key={`${p.productId}-${idx}`}
                            type="button"
                            onClick={() => setSelectedProductId(p.productId)}
                            aria-label={p.productName}
                            className={`
                              flex flex-col items-center justify-start flex-shrink-0 cursor-pointer rounded-xl overflow-hidden
                              transition-all duration-200 border-2
                              hover:-translate-y-0.5
                              ${isSelected
                                ? "border-[#DAA520] shadow-lg shadow-[#DAA520]/25 ring-2 ring-[#DAA520]/30 ring-offset-2 ring-offset-white"
                                : "border-[#DAA520]/10 hover:border-[#DAA520]/40 hover:shadow-md"}
                            `}
                            style={{ width: CARD_WIDTH, minWidth: CARD_WIDTH }}
                          >
                            <div className="w-full aspect-square flex items-center justify-center bg-[#FAFAFA] overflow-hidden">
                              {logoUrl ? (
                                <Image
                                  src={logoUrl}
                                  alt=""
                                  width={128}
                                  height={128}
                                  className="object-contain w-full h-full p-1"
                                  unoptimized
                                />
                              ) : (
                                <Gift className="w-16 h-16 text-[#DAA520]/70" aria-hidden />
                              )}
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const el = catalogScrollRef.current
                    if (el) el.scrollBy({ left: CARD_STEP, behavior: "smooth" })
                  }}
                  className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#FFFBEB] border border-[#DAA520]/25 text-[#654321] hover:bg-[#FEF7ED] hover:border-[#DAA520]/50 hover:shadow-sm flex items-center justify-center transition-all"
                  aria-label="Next gift cards"
                >
                  <ChevronRight className="w-5 h-5" aria-hidden />
                </button>
              </div>
            )}
        </div>

        {/* Send your gift card */}
        <div className="px-5 py-4 space-y-4">
          <p className="text-sm font-semibold text-[#654321]">Send your gift card</p>
          <div>
            <label htmlFor="gift-recipient-email" className="block text-sm font-medium text-[#654321] mb-2">
              Recipient Email <span className="text-[#8B5A3C] font-normal">(required)</span>
            </label>
            <input
              id="gift-recipient-email"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="e.g. friend@email.com"
              className="w-full py-3.5 px-4 rounded-xl border border-[#DAA520]/25 bg-[#FFFBEB]/30 text-[#654321] placeholder:text-[#8B5A3C]/50 focus:border-[#B8860B] focus:ring-2 focus:ring-[#DAA520]/25 outline-none text-sm"
              aria-required
            />
          </div>
          <button
            type="button"
            disabled={!canSend || loading || settlementSuccess}
            onClick={handleSendWishbee}
            className="w-full py-2.5 px-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#B8860B] shadow-md hover:shadow-lg hover:brightness-105 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 border border-[#654321]/20 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                <span>Sending...</span>
              </>
            ) : settlementSuccess ? (
              <>
                <Check className="w-4 h-4" aria-hidden />
                <span>Sent!</span>
              </>
            ) : (
              "Confirm Settlement"
            )}
          </button>
        </div>
      </div>

      {/* Balance status */}
      {refillingStock && !loading && (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3.5 shadow-sm">
          <p className="text-sm text-amber-800">
            {balanceLoading ? "Checking balance…" : "Gift cards are temporarily unavailable. Try Wishbee Credits instead."}
          </p>
        </div>
      )}
    </div>
  )
}
