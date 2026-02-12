"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Gift, Loader2, Wallet, Check, Heart, Sparkles, ScrollText, ChevronRight, Globe, Leaf, Cross } from "lucide-react"
import { toast } from "sonner"
import { WishbeeSettlementSummary } from "@/components/wishbee-settlement-summary"
import { SettlementHistory } from "@/components/settlement-history"
import { CHARITY_DATA } from "@/lib/charity-data"
import { computeDonationAmounts } from "@/lib/donation-fee"

const DONATION_CHARITIES = CHARITY_DATA.filter((c) => c.id !== "support-wishbee")

type NavId = "send-wishbee" | "gift-card" | "charity" | "support-wishbee" | "settlement-history"

type GiftData = {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  recipientName?: string | null
}

export function SettleBalanceContent() {
  const searchParams = useSearchParams()
  const giftId = searchParams.get("id")

  const [gift, setGift] = useState<GiftData | null>(null)
  const [loading, setLoading] = useState(!!giftId)
  const [error, setError] = useState<string | null>(null)
  const [successClaimUrl, setSuccessClaimUrl] = useState<string | null>(null)
  const [successRedeemCode, setSuccessRedeemCode] = useState<string | null>(null)
  const [remainingBalanceView, setRemainingBalanceView] = useState<NavId>("send-wishbee")
  const [bonusRecipientEmail, setBonusRecipientEmail] = useState("")
  const [settleWishbeeLoading, setSettleWishbeeLoading] = useState(false)
  const [selectedCharityId, setSelectedCharityId] = useState("feeding-america")
  const [coverFees, setCoverFees] = useState(true)
  const [donationConfirmed, setDonationConfirmed] = useState<{ amount: number; charityName: string; receiptUrl?: string } | null>(null)
  const [tipThankYou, setTipThankYou] = useState<{ amount: number; receiptUrl?: string } | null>(null)

  const remaining = gift
    ? Math.max(0, Math.round((gift.currentAmount - gift.targetAmount) * 100) / 100)
    : 0
  const recipientName =
    gift?.recipientName?.trim() ||
    (gift?.name ? gift.name.replace(/'s.*| for .*/i, "").trim() : "") ||
    "the recipient"

  const fetchGift = useCallback(async () => {
    if (!giftId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/gifts/${giftId}`)
      if (!res.ok) {
        if (res.status === 404) setError("Gift not found")
        else setError("Failed to load gift")
        setGift(null)
        return
      }
      const data = await res.json()
      const g = data.gift
      if (!g) {
        setError("Gift not found")
        setGift(null)
        return
      }
      setGift({
        id: g.id,
        name: g.name || g.collectionTitle || g.giftName || "Gift",
        targetAmount: Number(g.targetAmount) ?? 0,
        currentAmount: Number(g.currentAmount) ?? 0,
        recipientName: g.recipientName ?? null,
      })
    } catch {
      setError("Failed to load gift")
      setGift(null)
    } finally {
      setLoading(false)
    }
  }, [giftId])

  useEffect(() => {
    fetchGift()
  }, [fetchGift])

  useEffect(() => {
    if (!gift) return
    const rem = Math.max(0, Math.round((gift.currentAmount - gift.targetAmount) * 100) / 100)
    setRemainingBalanceView(rem < 1 ? "support-wishbee" : "send-wishbee")
  }, [gift?.id])

  const processImmediateDonation = async (payload: {
    giftId: string
    amount: number
    netAmount: number
    totalToCharge: number
    charityId: string
    charityName: string
    coverFees: boolean
    recipientName: string
    giftName: string
    totalFundsCollected: number
    finalGiftPrice: number
  }): Promise<{ receiptUrl: string | null; error?: string }> => {
    try {
      const res = await fetch("/api/donations/process-instant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftId: payload.giftId,
          amount: payload.amount,
          netAmount: payload.netAmount,
          totalToCharge: payload.totalToCharge,
          charityId: payload.charityId,
          charityName: payload.charityName,
          feeCovered: payload.coverFees,
          recipientName: payload.recipientName,
          giftName: payload.giftName,
          totalFundsCollected: payload.totalFundsCollected,
          finalGiftPrice: payload.finalGiftPrice,
        }),
      })
      const data = await res.json()
      if (!res.ok) return { receiptUrl: null, error: data?.error || "Donation failed. Please try again." }
      return { receiptUrl: data?.receiptUrl ?? null }
    } catch {
      return { receiptUrl: null, error: "Donation failed. Please try again." }
    }
  }

  const saveTipSettlement = async (payload: {
    giftId: string
    amount: number
    recipientName: string
    giftName: string
    totalFundsCollected: number
    finalGiftPrice: number
  }): Promise<string | null> => {
    try {
      const res = await fetch(`/api/gifts/${payload.giftId}/settlement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: payload.amount,
          disposition: "tip",
          recipientName: payload.recipientName,
          giftName: payload.giftName,
          totalFundsCollected: payload.totalFundsCollected,
          finalGiftPrice: payload.finalGiftPrice,
        }),
      })
      if (!res.ok) return null
      const data = await res.json()
      const settlementId = data?.settlement?.id
      if (!settlementId) return null
      const base = typeof window !== "undefined" ? window.location.origin : ""
      return `${base}/gifts/${payload.giftId}/receipt/${settlementId}`
    } catch {
      return null
    }
  }

  if (!giftId) {
    return (
      <div className="min-h-screen bg-[#F5F1E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/gifts/active"
            className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors text-xs sm:text-sm md:text-base"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            Back to Active Gifts
          </Link>
          <div className="bg-white rounded-2xl shadow-lg border border-[#DAA520]/20 p-8 text-center">
            <p className="text-[#654321] font-medium">No gift specified.</p>
            <p className="text-sm text-[#8B5A3C]/80 mt-2">Open settle balance from an active gift.</p>
            <Link
              href="/gifts/active"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-[#DAA520] text-white font-semibold hover:bg-[#B8860B] transition-colors"
            >
              Go to Active Gifts
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#DAA520] animate-spin" />
          <p className="text-[#654321] font-medium">Loading gift...</p>
        </div>
      </div>
    )
  }

  if (error || !gift) {
    return (
      <div className="min-h-screen bg-[#F5F1E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/gifts/active"
            className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors text-xs sm:text-sm md:text-base"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            Back to Active Gifts
          </Link>
          <div className="bg-white rounded-2xl shadow-lg border border-[#DAA520]/20 p-8 text-center">
            <p className="text-[#654321] font-medium">{error ?? "Gift not found"}</p>
            <Link
              href="/gifts/active"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-[#DAA520] text-white font-semibold hover:bg-[#B8860B] transition-colors"
            >
              Go to Active Gifts
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Success state: donation thank you
  if (donationConfirmed) {
    return (
      <div className="min-h-screen bg-[#F5F1E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/gifts/active" className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors text-xs sm:text-sm md:text-base">
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            Back to Active Gifts
          </Link>
          <div className="bg-white rounded-2xl shadow-lg border border-[#DAA520]/20 p-8 max-w-lg mx-auto text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#DAA520]/20 mb-4">
              <Heart className="w-7 h-7 text-[#B8860B]" />
            </div>
            <h2 className="text-xl font-bold text-[#654321]">Thank you for your donation!</h2>
            <p className="text-sm text-[#8B5A3C]/90 mt-2">
              ${donationConfirmed.amount.toFixed(2)} was donated to {donationConfirmed.charityName}.
            </p>
            {donationConfirmed.receiptUrl && (
              <a href={donationConfirmed.receiptUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-medium text-[#DAA520] hover:text-[#B8860B]">
                View receipt
              </a>
            )}
            <Link href="/gifts/active" className="mt-6 inline-block text-sm font-medium text-[#DAA520] hover:text-[#B8860B]">
              Back to Active Gifts
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Success state: tip thank you
  if (tipThankYou) {
    return (
      <div className="min-h-screen bg-[#F5F1E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/gifts/active" className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors text-xs sm:text-sm md:text-base">
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            Back to Active Gifts
          </Link>
          <div className="bg-white rounded-2xl shadow-lg border border-[#DAA520]/20 p-8 max-w-lg mx-auto text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#DAA520]/20 mb-4">
              <Sparkles className="w-7 h-7 text-[#B8860B]" />
            </div>
            <h2 className="text-xl font-bold text-[#654321]">Thanks for supporting Wishbee!</h2>
            <p className="text-sm text-[#8B5A3C]/90 mt-2">
              Your ${tipThankYou.amount.toFixed(2)} tip helps us keep the platform free and ad-free.
            </p>
            {tipThankYou.receiptUrl && (
              <a href={tipThankYou.receiptUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-medium text-[#DAA520] hover:text-[#B8860B]">
                View receipt
              </a>
            )}
            <Link href="/gifts/active" className="mt-6 inline-block text-sm font-medium text-[#DAA520] hover:text-[#B8860B]">
              Back to Active Gifts
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Success state: show claim link and/or digital code (Gift Card via Reloadly)
  if (successClaimUrl) {
    return (
      <div className="min-h-screen bg-[#F5F1E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/gifts/active"
            className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors text-xs sm:text-sm md:text-base"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            Back to Active Gifts
          </Link>
          <div className="bg-white rounded-2xl shadow-lg border border-[#DAA520]/20 p-8 max-w-lg mx-auto text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#DAA520]/20 mb-4">
              <Check className="w-7 h-7 text-[#B8860B]" />
            </div>
            <h2 className="text-xl font-bold text-[#654321]">Wishbee sent!</h2>
            <p className="text-sm text-[#8B5A3C]/90 mt-2">
              A ${remaining.toFixed(2)} gift card is ready for {recipientName}. Share the link or code below to claim.
            </p>
            {successRedeemCode && (
              <div className="mt-4 p-4 rounded-xl bg-[#FFFBEB] border-2 border-[#DAA520]/30">
                <p className="text-xs font-medium text-[#654321] mb-1">Gift card code</p>
                <p className="text-base font-mono font-bold text-[#654321] break-all select-all">{successRedeemCode}</p>
              </div>
            )}
            <a
              href={successClaimUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#B8860B] hover:brightness-105 transition-all"
            >
              <Gift className="w-5 h-5" />
              Claim gift card
            </a>
            <p className="text-[10px] text-[#8B5A3C]/80 mt-3">Gift Card (via Reloadly)</p>
            <Link
              href="/gifts/active"
              className="mt-6 inline-block text-sm font-medium text-[#DAA520] hover:text-[#B8860B]"
            >
              Back to Active Gifts
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Main: same layout as /gifts/create — Back link, header card, two-column (left nav + content)
  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/gifts/active"
          className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors text-xs sm:text-sm md:text-base"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          Back to Active Gifts
        </Link>

        <div className="mb-8">
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <div className="flex flex-row items-center justify-center gap-2">
              <Gift className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#DAA520] flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-foreground whitespace-nowrap">
                Settle Balance
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2">
              Use the remaining balance for {gift.name}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-[#DAA520]/20 overflow-hidden">
          {/* Card header — same style as create */}
          <div className="bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#F4C430] px-6 py-4">
            <div className="flex items-center justify-center gap-3">
              <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-sm" />
              <div className="text-center">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white drop-shadow-sm">
                  Remaining Balance
                </h2>
                <p className="text-xs text-white/80 mt-0.5">
                  ${remaining.toFixed(2)} — Send as gift card
                </p>
              </div>
            </div>
          </div>

          {/* Two columns: left nav (all 5 options) + content — same as old modal */}
          <div className="flex flex-col md:flex-row">
            <div className="flex-shrink-0 md:w-56 lg:w-60 bg-[#F5F1E8] border-b md:border-b-0 md:border-r border-[#DAA520]/20 p-3 md:p-4 flex flex-col">
              <div className="flex flex-row md:flex-col gap-2 md:gap-3 overflow-x-auto md:overflow-x-visible md:flex-1">
                {(() => {
                  const micro = remaining < 1
                  const navItems: { id: NavId; label: string; icon: typeof Gift; desc: string; disabled: boolean }[] = [
                    { id: "send-wishbee", label: "Send Wishbee", icon: Gift, desc: "Close pool & send", disabled: micro },
                    { id: "gift-card", label: "Send Bonus Gift Card", icon: Gift, desc: "Gift Card (via Reloadly)", disabled: micro },
                    { id: "charity", label: "Donate to Charity", icon: Heart, desc: "Choose a cause", disabled: micro },
                    { id: "support-wishbee", label: "Support Wishbee", icon: Sparkles, desc: "Tip the platform", disabled: false },
                    { id: "settlement-history", label: "Settlement History", icon: ScrollText, desc: "View past transactions", disabled: false },
                  ]
                  return navItems.map((item) => {
                    const isCurrent = remainingBalanceView === item.id
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={item.disabled}
                        onClick={() => !item.disabled && setRemainingBalanceView(item.id)}
                        className={`flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all w-full min-w-[140px] md:min-w-0 text-left ${
                          item.disabled
                            ? "opacity-50 cursor-not-allowed bg-gray-100/80 text-gray-500"
                            : isCurrent
                            ? "bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white shadow-md"
                            : "bg-white text-[#654321] border-2 border-[#DAA520]/30 hover:border-[#DAA520] hover:bg-[#FFFBEB]/80"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                          item.disabled ? "bg-gray-200" : isCurrent ? "bg-white/20" : "bg-[#DAA520]/10"
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-xs font-bold leading-tight">{item.label}</p>
                          <p className={`text-[10px] leading-tight mt-0.5 ${isCurrent ? "text-white/90" : "text-[#8B5A3C]/80"}`}>{item.desc}</p>
                        </div>
                        {isCurrent && <ChevronRight className="w-4 h-4 shrink-0 hidden md:block" />}
                      </button>
                    )
                  })
                })()}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-5 bg-gradient-to-br from-[#FEF7ED] via-[#FFF7ED] to-[#FFFBEB]">
              {remainingBalanceView === "send-wishbee" && (
                <div className="max-w-lg mx-auto">
                  <WishbeeSettlementSummary
                    giftId={gift.id}
                    giftName={gift.name}
                    grossWishbeeFunds={remaining}
                    mainGiftAmount={remaining}
                    recipientName={recipientName}
                    recipientEmail=""
                    charities={DONATION_CHARITIES}
                    selectedCharityId={selectedCharityId}
                    onSelectedCharityChange={setSelectedCharityId}
                    totalFundsCollected={gift.currentAmount}
                    finalGiftPrice={Math.round((gift.currentAmount - remaining) * 100) / 100}
                    giftCardBrand="Gift Card (via Reloadly)"
                    onSuccess={({ claimUrl, redeemCode }) => {
                      setSuccessClaimUrl(claimUrl)
                      setSuccessRedeemCode(redeemCode ?? null)
                    }}
                    onError={(err) => toast.error(err)}
                  />
                </div>
              )}

              {remainingBalanceView === "settlement-history" && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-[#654321]">Settlement History</h3>
                  <SettlementHistory giftId={gift.id} remainingBalance={remaining} />
                </div>
              )}

              {remainingBalanceView === "gift-card" && (
                <div className="max-w-md mx-auto space-y-3">
                  <h3 className="text-sm font-bold text-[#654321]">Send as Bonus Gift Card</h3>
                  <p className="text-xs text-[#8B5A3C]/90">
                    Send ${remaining.toFixed(2)} as a gift card so {recipientName} can pick one more treat.
                  </p>
                  <label className="block text-xs font-medium text-[#654321]">Recipient email (required for delivery)</label>
                  <input
                    type="email"
                    placeholder="recipient@example.com"
                    value={bonusRecipientEmail}
                    onChange={(e) => setBonusRecipientEmail(e.target.value)}
                    className="w-full py-2 px-3 rounded-lg text-xs border-2 border-[#DAA520]/30 bg-white text-[#654321] placeholder:text-[#8B5A3C]/50 focus:border-[#B8860B] focus:ring-1 focus:ring-[#DAA520]/40 outline-none"
                  />
                  <button
                    type="button"
                    disabled={settleWishbeeLoading || !bonusRecipientEmail.trim()}
                    onClick={async () => {
                      const email = bonusRecipientEmail.trim()
                      if (!email) {
                        toast.error("Please enter recipient email")
                        return
                      }
                      setSettleWishbeeLoading(true)
                      try {
                        const res = await fetch(`/api/gifts/${gift.id}/settle-wishbee`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            amount: remaining,
                            recipientEmail: email,
                            recipientName,
                            giftName: gift.name,
                            totalFundsCollected: gift.currentAmount,
                            finalGiftPrice: Math.round((gift.currentAmount - remaining) * 100) / 100,
                          }),
                        })
                        const data = await res.json()
                        if (!res.ok) {
                          toast.error(data?.error ?? "Gift card failed. Please try again.")
                          return
                        }
                        if (data.fallbackToCredits) {
                          toast.success(data.message ?? "Wishbee Credits have been issued to contributors instead.")
                          setBonusRecipientEmail("")
                          return
                        }
                        setSuccessClaimUrl(data.claimUrl ?? null)
                        setSuccessRedeemCode(data.redeemCode ?? data.settlement?.redeemCode ?? data.infoText ?? null)
                        setBonusRecipientEmail("")
                        toast.success("Gift card created! Share the claim link or code with the recipient.")
                      } catch {
                        toast.error("Something went wrong. Please try again.")
                      } finally {
                        setSettleWishbeeLoading(false)
                      }
                    }}
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-[#422006] bg-gradient-to-r from-[#DAA520] to-[#F4C430] shadow-sm hover:brightness-105 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-1.5"
                  >
                    <Gift className="w-4 h-4" />
                    {settleWishbeeLoading ? "Sending…" : `Send $${remaining.toFixed(2)} gift card`}
                  </button>
                  <p className="text-[10px] text-[#8B5A3C]/80">Gift Card (via Reloadly)</p>
                </div>
              )}

              {remainingBalanceView === "charity" && (
                <div className="max-w-md mx-auto space-y-3">
                  <h3 className="text-sm font-bold text-[#654321]">Donate to a cause</h3>
                  <p className="text-xs text-[#8B5A3C]/90">
                    Select a charity. Donations are processed instantly via our secure partner network.
                  </p>
                  <div className="space-y-1.5">
                    {DONATION_CHARITIES.map((c) => {
                      const CharityIcon = c.icon === "heart" ? Heart : c.icon === "globe" ? Globe : c.icon === "leaf" ? Leaf : Cross
                      const iconColor = c.icon === "heart" ? "text-red-500 fill-red-500" : c.icon === "globe" ? "text-blue-600" : c.icon === "leaf" ? "text-emerald-600" : "text-red-600"
                      const isSelected = selectedCharityId === c.id
                      const logo = c.logo
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedCharityId(c.id)}
                          className={`w-full flex items-center gap-1.5 py-2 px-2.5 rounded-lg text-left transition-all border-2 ${isSelected ? "border-[#B8860B] bg-[#FFFBEB]" : "border-[#DAA520]/20 bg-white hover:border-[#DAA520]/50"}`}
                        >
                          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0 ring-1 ring-[#DAA520]/25 overflow-hidden">
                            {logo ? <Image src={logo} alt="" width={24} height={24} className="object-contain" /> : <CharityIcon className={`w-3.5 h-3.5 ${iconColor}`} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-[#654321]">{c.name}</p>
                            <p className="text-[10px] text-[#8B4513]/80">{c.description}</p>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#B8860B] shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                  {(() => {
                    const charity = DONATION_CHARITIES.find((ch) => ch.id === selectedCharityId)
                    const { netToCharity, totalCharged, fee } = computeDonationAmounts(remaining, coverFees)
                    return (
                      <>
                        <label className="flex items-center gap-2 text-xs text-[#654321] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={coverFees}
                            onChange={(e) => setCoverFees(e.target.checked)}
                            className="rounded border-[#DAA520] text-[#EAB308]"
                          />
                          Cover transaction fees (${fee.toFixed(2)})
                        </label>
                        <p className="text-xs text-[#654321] tabular-nums">
                          The {charity?.name ?? "charity"} will receive exactly ${netToCharity.toFixed(2)}.
                        </p>
                      </>
                    )
                  })()}
                  <button
                    type="button"
                    onClick={async () => {
                      const charity = DONATION_CHARITIES.find((ch) => ch.id === selectedCharityId)
                      if (!charity) return
                      const { netToCharity, totalCharged } = computeDonationAmounts(remaining, coverFees)
                      const { receiptUrl, error: err } = await processImmediateDonation({
                        giftId: gift.id,
                        amount: remaining,
                        netAmount: netToCharity,
                        totalToCharge: totalCharged,
                        charityId: charity.id,
                        charityName: charity.name,
                        coverFees,
                        recipientName,
                        giftName: gift.name,
                        totalFundsCollected: gift.currentAmount,
                        finalGiftPrice: Math.round((gift.currentAmount - remaining) * 100) / 100,
                      })
                      if (err) {
                        toast.error(err)
                        return
                      }
                      setDonationConfirmed({ amount: remaining, charityName: charity.name, receiptUrl: receiptUrl ?? undefined })
                      toast.success("Thank you for your donation!")
                    }}
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#EAB308] to-[#F4C430] text-[#3B2F0F] shadow-sm hover:brightness-105 transition-all"
                  >
                    {(() => {
                      const { totalCharged } = computeDonationAmounts(remaining, coverFees)
                      return `Donate $${totalCharged.toFixed(2)}`
                    })()}
                  </button>
                </div>
              )}

              {remainingBalanceView === "support-wishbee" && (
                <div className="max-w-md mx-auto space-y-3">
                  <h3 className="text-sm font-bold text-[#654321]">Support Wishbee</h3>
                  <p className="text-xs text-[#8B5A3C]/90">
                    Did we do a good job? Tip Wishbee to help us keep our AI tools free and the platform ad-free for everyone.
                  </p>
                  <p className="text-xs text-[#654321]">
                    Your ${remaining.toFixed(2)} will be added as a platform tip.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      const receiptUrl = await saveTipSettlement({
                        giftId: gift.id,
                        amount: remaining,
                        recipientName,
                        giftName: gift.name,
                        totalFundsCollected: gift.currentAmount,
                        finalGiftPrice: Math.round((gift.currentAmount - remaining) * 100) / 100,
                      })
                      setTipThankYou({ amount: remaining, receiptUrl: receiptUrl ?? undefined })
                      toast.success("Thank you for supporting Wishbee!")
                      if (receiptUrl) {
                        try {
                          const sessionRes = await fetch("/api/auth/session").catch(() => null)
                          const session = sessionRes?.ok ? await sessionRes.json() : null
                          const to = session?.user?.email ? [{ email: session.user.email, name: session.user.name }] : []
                          if (to.length > 0) {
                            const res = await fetch("/api/gifts/transparency-email", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                eventData: {
                                  recipientName,
                                  totalFundsCollected: gift.currentAmount,
                                  finalGiftPrice: Math.round((gift.currentAmount - remaining) * 100) / 100,
                                  remainingBalance: remaining,
                                  disposition: "tip" as const,
                                  viewGiftDetailsUrl: typeof window !== "undefined" ? `${window.location.origin}/gifts/${gift.id}` : `/gifts/${gift.id}`,
                                },
                                to,
                              }),
                            })
                            if (res.ok) toast.success("Tip receipt sent to your email")
                          }
                        } catch {
                          // non-blocking
                        }
                      }
                    }}
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#EAB308] to-[#F4C430] text-[#3B2F0F] shadow-sm hover:brightness-105 flex items-center justify-center gap-1.5"
                  >
                    <span className="text-base" aria-hidden>🐝</span>
                    Tip Wishbee ${remaining.toFixed(2)}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer bar — same as old modal */}
          <div className="flex-shrink-0 w-full h-10 bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] border-t-2 border-[#4A2F1A]" />
        </div>
      </div>
    </div>
  )
}
