"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Gift, Award, Loader2, Check } from "lucide-react"
import { toast } from "sonner"
import { WishbeeSettlementSummary } from "@/components/wishbee-settlement-summary"
import { CHARITY_DATA } from "@/lib/charity-data"

const DONATION_CHARITIES = CHARITY_DATA.filter((c) => c.id !== "support-wishbee")

type GiftData = {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  recipientName?: string | null
}

export function RewardsContent() {
  const searchParams = useSearchParams()
  const giftId = searchParams.get("id")

  const [gift, setGift] = useState<GiftData | null>(null)
  const [loading, setLoading] = useState(!!giftId)
  const [successClaimUrl, setSuccessClaimUrl] = useState<string | null>(null)
  const [selectedCharityId, setSelectedCharityId] = useState("feeding-america")

  const remaining = gift ? Math.max(0, Math.round((gift.currentAmount - gift.targetAmount) * 100) / 100) : 0
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
    try {
      const res = await fetch(`/api/gifts/${giftId}`)
      if (!res.ok) {
        setGift(null)
        return
      }
      const data = await res.json()
      const g = data.gift
      if (!g) {
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
      setGift(null)
    } finally {
      setLoading(false)
    }
  }, [giftId])

  useEffect(() => {
    fetchGift()
  }, [fetchGift])

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <Loader2 className="w-10 h-10 text-[#DAA520] animate-spin" aria-hidden />
        <p className="text-[#654321] font-medium">Loading...</p>
      </div>
    )
  }

  if (successClaimUrl) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border-2 border-[#DAA520]/20 bg-white p-8 max-w-lg mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#DAA520]/20 mb-4">
            <Check className="w-7 h-7 text-[#B8860B]" aria-hidden />
          </div>
          <h2 className="text-xl font-bold text-[#654321]">Wishbee sent!</h2>
          <p className="text-sm text-[#8B5A3C]/90 mt-2">
            A ${remaining.toFixed(2)} gift card is ready for {recipientName}. Share the link below or open it to claim.
          </p>
          <a
            href={successClaimUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#B8860B] hover:brightness-105 transition-all"
          >
            <Gift className="w-5 h-5" aria-hidden />
            Claim gift card
          </a>
          <p className="text-[10px] text-[#8B5A3C]/80 mt-3">Powered by Tremendous</p>
          <Link href="/gifts/active" className="mt-6 inline-block text-sm font-medium text-[#DAA520] hover:text-[#B8860B]">
            Back to Active Gifts
          </Link>
        </div>
      </div>
    )
  }

  if (!giftId || !gift) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#DAA520]/20" aria-hidden>
            <Gift className="w-6 h-6 text-[#B8860B]" aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-bold text-[#654321]">Gift Rewards</h1>
            <p className="text-sm text-[#8B5A3C]/90">
              Convert your group gift pool into store gift cards (Target, Amazon) via Tremendous.
            </p>
          </div>
        </div>
        <div className="rounded-xl border-2 border-[#DAA520]/20 bg-white p-6">
          <p className="text-sm text-[#654321]">
            Select a gift from <Link href="/gifts/active" className="font-semibold text-[#DAA520] hover:text-[#B8860B]">Active Gifts</Link> and click &quot;Settle balance&quot; to send the remaining balance as a Tremendous gift card.
          </p>
        </div>
      </div>
    )
  }

  if (remaining < 0.01) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#DAA520]/20" aria-hidden>
            <Gift className="w-6 h-6 text-[#B8860B]" aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-bold text-[#654321]">Gift Rewards</h1>
            <p className="text-sm text-[#8B5A3C]/90">
              This gift has no remaining balance. Choose a gift with leftover funds from <Link href="/gifts/active" className="font-semibold text-[#DAA520] hover:text-[#B8860B]">Active Gifts</Link>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border-2 border-[#DAA520]/25 bg-gradient-to-br from-[#FFFBEB] via-[#FEF7ED] to-[#FFFBEB] p-[14px] shadow-sm">
        <div className="flex flex-row items-center justify-center gap-2">
          <Award className="w-[26px] h-[26px] text-[#DAA520] flex-shrink-0" aria-hidden />
          <h1 className="text-[26px] font-bold text-[#654321] whitespace-nowrap">
            Gift Rewards
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#8B5A3C]/90 text-center mt-2">
          Send your remaining balance as a gift card via Tremendous.
        </p>
      </div>
      <div className="rounded-xl border-2 border-[#DAA520]/20 bg-white p-6">
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
          giftCardBrand="Tremendous (multi-brand)"
          onSuccess={({ claimUrl }) => setSuccessClaimUrl(claimUrl)}
          onError={(err) => toast.error(err)}
        />
      </div>
    </div>
  )
}
