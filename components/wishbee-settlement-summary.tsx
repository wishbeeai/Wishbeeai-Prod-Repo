"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

export type ReloadlyProductOption = { productId: number; productName: string }

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
  const [products, setProducts] = useState<ReloadlyProductOption[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [balanceOk, setBalanceOk] = useState<boolean | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)

  const giftCardClamped = Math.max(0, Math.min(netToDistribute, Math.round(giftCardAmount * 100) / 100))

  // Fetch top 5 gift card brands (Reloadly)
  useEffect(() => {
    let cancelled = false
    setProductsLoading(true)
    fetch("/api/reloadly/products")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        const list = Array.isArray(data?.products) ? data.products : []
        setProducts(
          list.map((p: { productId: number; productName?: string }) => ({
            productId: p.productId,
            productName: p.productName ?? "Gift Card",
          }))
        )
        if (list.length > 0 && selectedProductId == null) {
          setSelectedProductId(list[0].productId)
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
      onSuccess?.({ claimUrl: data.claimUrl, settlement: data.settlement })
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Something went wrong.")
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

  return (
    <div className="space-y-5">
      {/* Confirmation table */}
      <div className="rounded-2xl border-2 border-[#DAA520]/20 bg-[#FFFBEB]/50 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-[#DAA520]/20">
              <td className="py-2.5 px-3 text-[#654321] font-medium">Gross Wishbee Funds</td>
              <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-[#654321]">
                ${grossWishbeeFunds.toFixed(2)}
              </td>
            </tr>
            <tr className="border-b border-[#DAA520]/20">
              <td className="py-2.5 px-3 text-[#654321]">Processing Fees (Stripe/Platform)</td>
              <td className="py-2.5 px-3 text-right tabular-nums text-[#8B5A3C]">
                -${fee.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 text-[#654321] font-semibold">Net to Distribute</td>
              <td className="py-2.5 px-3 text-right font-bold tabular-nums text-[#654321]">
                ${netToDistribute.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Control: Gift Card Amount (cannot exceed Net Funds) */}
      <div>
        <label className="block text-xs font-medium text-[#654321] mb-1.5">Gift Card Amount</label>
        <input
          type="range"
          min={0}
          max={Math.max(0.01, netToDistribute)}
          step={0.01}
          value={giftCardClamped}
          onChange={(e) => setGiftCardAmount(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-[#DAA520]/20 accent-[#DAA520]"
        />
        <input
          type="number"
          min={0}
          max={netToDistribute}
          step={0.01}
          value={giftCardAmount}
          onChange={(e) => {
            const v = Number(e.target.value)
            if (isNaN(v)) setGiftCardAmount(0)
            else setGiftCardAmount(Math.min(netToDistribute, Math.max(0, v)))
          }}
          className="w-full py-2 px-3 rounded-lg border-2 border-[#DAA520]/30 bg-white text-[#654321] tabular-nums focus:border-[#B8860B] focus:ring-1 focus:ring-[#DAA520]/40 outline-none mt-1"
        />
      </div>

      {/* Gift card brand (top 5 from Reloadly) */}
      {products.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-[#654321] mb-1.5">Gift card brand</label>
          <select
            value={selectedProductId ?? ""}
            onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : null)}
            className="w-full py-2 px-3 rounded-lg border-2 border-[#DAA520]/30 bg-white text-[#654321] focus:border-[#B8860B] outline-none"
          >
            {products.map((p) => (
              <option key={p.productId} value={p.productId}>
                {p.productName}
              </option>
            ))}
          </select>
        </div>
      )}
      {productsLoading && products.length === 0 && (
        <p className="text-sm text-[#8B5A3C]">Loading gift card options...</p>
      )}

      {/* Recipient email (required for gift card delivery) */}
      <div>
        <label className="block text-xs font-medium text-[#654321] mb-1.5">Recipient email (required)</label>
        <input
          type="email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          placeholder="recipient@example.com"
          className="w-full py-2 px-3 rounded-lg border-2 border-[#DAA520]/30 bg-white text-[#654321] placeholder:text-[#8B5A3C]/50 focus:border-[#B8860B] outline-none"
        />
      </div>

      {/* Balance status: show when we can't fulfill (low/zero Reloadly balance) */}
      {refillingStock && !loading && (
        <p className="text-sm text-amber-800 bg-amber-50/90 border border-amber-200 rounded-lg py-2.5 px-3">
          {balanceLoading ? "Checking balance…" : "Gift cards are temporarily resting. Try Wishbee Credits instead! 🐝"}
        </p>
      )}

      {/* Send Wishbee button */}
      <button
        type="button"
        disabled={!canSend || loading}
        onClick={handleSendWishbee}
        className="w-full max-w-xs mx-auto py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#B8860B] shadow-md hover:shadow-lg hover:brightness-105 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 border border-[#654321]/20 transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            <span>Sending gift card...</span>
          </>
        ) : (
          "Send Wishbee"
        )}
      </button>
    </div>
  )
}
