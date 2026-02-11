"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

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

  const giftCardClamped = Math.max(0, Math.min(netToDistribute, Math.round(giftCardAmount * 100) / 100))

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
      // Tremendous only: gift card amount + delivery. Charity is handled separately.
      const body = {
        amount: giftCardClamped,
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

  const canSend = recipientEmail.trim().length > 0 && giftCardClamped >= 1

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

      {/* Recipient email (required for Tremendous delivery) */}
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
            <span>Sending gift card via Tremendous...</span>
          </>
        ) : (
          "Send Wishbee"
        )}
      </button>
    </div>
  )
}
