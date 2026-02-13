"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Heart, Check, Loader2, Globe, Leaf, Cross } from "lucide-react"
import { toast } from "sonner"
import { CHARITY_DATA } from "@/lib/charity-data"
import { computeDonationAmounts } from "@/lib/donation-fee"

const DONATION_CHARITIES = CHARITY_DATA.filter((c) => c.id !== "support-wishbee")

type GiftData = {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  recipientName?: string | null
}

async function processImmediateDonation(payload: {
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
}): Promise<{ receiptUrl: string | null; error?: string }> {
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
}

export function CharityContent() {
  const searchParams = useSearchParams()
  const giftId = searchParams.get("id")

  const [gift, setGift] = useState<GiftData | null>(null)
  const [loading, setLoading] = useState(!!giftId)
  const [selectedCharityId, setSelectedCharityId] = useState("feeding-america")
  const [coverFees, setCoverFees] = useState(true)
  const [donating, setDonating] = useState(false)
  const [success, setSuccess] = useState<{ amount: number; charityName: string; receiptUrl?: string } | null>(null)

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

  if (success) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border-2 border-[#DAA520]/20 bg-white p-8 text-center max-w-md mx-auto">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#DAA520]/20 mb-4">
            <Heart className="w-7 h-7 text-[#B8860B]" aria-hidden />
          </div>
          <h2 className="text-xl font-bold text-[#654321]">Thank you for your donation!</h2>
          <p className="text-sm text-[#8B5A3C]/90 mt-2">
            ${success.amount.toFixed(2)} was donated to {success.charityName}.
          </p>
          {success.receiptUrl && (
            <a
              href={success.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm font-medium text-[#DAA520] hover:text-[#B8860B]"
            >
              View receipt
            </a>
          )}
        </div>
      </div>
    )
  }

  if (!giftId || !gift) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border-2 border-[#DAA520]/20 bg-white p-6 shadow-lg space-y-4">
          <p className="text-sm text-[#654321]">
            Select a gift from <Link href="/gifts/active" className="font-semibold text-[#DAA520] hover:text-[#B8860B]">Active Gifts</Link> and click &quot;Settle balance&quot; to donate the remaining balance to one of these charities.
          </p>
          <p className="text-xs font-semibold text-[#8B5A3C]/90">Our charity partners</p>
          <div className="space-y-1.5">
            {DONATION_CHARITIES.map((c) => {
              const CharityIcon = c.icon === "heart" ? Heart : c.icon === "globe" ? Globe : c.icon === "leaf" ? Leaf : Cross
              const iconColor = c.icon === "heart" ? "text-red-500 fill-red-500" : c.icon === "globe" ? "text-blue-600" : c.icon === "leaf" ? "text-emerald-600" : "text-red-600"
              return (
                <div
                  key={c.id}
                  className="w-full flex items-center gap-1.5 py-2 px-2.5 rounded-lg border-2 border-[#DAA520]/20 bg-white"
                >
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0 ring-1 ring-[#DAA520]/25 overflow-hidden">
                    {c.logo ? <Image src={c.logo} alt="" width={24} height={24} className="object-contain" /> : <CharityIcon className={`w-3.5 h-3.5 ${iconColor}`} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#654321]">{c.name}</p>
                    <p className="text-[10px] text-[#8B4513]/80">{c.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (remaining < 0.01) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border-2 border-[#DAA520]/20 bg-white p-6 shadow-lg space-y-4">
          <p className="text-sm text-[#654321]">
            Choose a gift with leftover funds from <Link href="/gifts/active" className="font-semibold text-[#DAA520] hover:text-[#B8860B]">Active Gifts</Link>. You can donate to any of these partners:
          </p>
          <p className="text-xs font-semibold text-[#8B5A3C]/90">Our charity partners</p>
          <div className="space-y-1.5">
            {DONATION_CHARITIES.map((c) => {
              const CharityIcon = c.icon === "heart" ? Heart : c.icon === "globe" ? Globe : c.icon === "leaf" ? Leaf : Cross
              const iconColor = c.icon === "heart" ? "text-red-500 fill-red-500" : c.icon === "globe" ? "text-blue-600" : c.icon === "leaf" ? "text-emerald-600" : "text-red-600"
              return (
                <div
                  key={c.id}
                  className="w-full flex items-center gap-1.5 py-2 px-2.5 rounded-lg border-2 border-[#DAA520]/20 bg-white"
                >
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0 ring-1 ring-[#DAA520]/25 overflow-hidden">
                    {c.logo ? <Image src={c.logo} alt="" width={24} height={24} className="object-contain" /> : <CharityIcon className={`w-3.5 h-3.5 ${iconColor}`} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#654321]">{c.name}</p>
                    <p className="text-[10px] text-[#8B4513]/80">{c.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const charity = DONATION_CHARITIES.find((ch) => ch.id === selectedCharityId)
  const { netToCharity, totalCharged, fee } = computeDonationAmounts(remaining, coverFees)

  return (
    <div className="space-y-6">
      <div className="rounded-xl border-2 border-[#DAA520]/25 bg-gradient-to-br from-[#FFFBEB] via-[#FEF7ED] to-[#FFFBEB] p-[14px] shadow-sm">
        <div className="flex flex-row items-center justify-center gap-2">
          <Heart className="w-[26px] h-[26px] text-[#DAA520] flex-shrink-0" aria-hidden />
          <h1 className="text-[26px] font-bold text-[#654321] whitespace-nowrap">
            Social Impact
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#8B5A3C]/90 text-center mt-2">
          Donate your remaining balance to a 501(c)(3) charity.
        </p>
      </div>
      <div className="rounded-2xl border-2 border-[#DAA520]/20 bg-white p-6 shadow-lg space-y-4">
        <p className="text-sm text-[#8B5A3C]/90">Select a charity. Donations are processed via our secure partner network.</p>
        <div className="space-y-1.5">
          {DONATION_CHARITIES.map((c) => {
            const CharityIcon = c.icon === "heart" ? Heart : c.icon === "globe" ? Globe : c.icon === "leaf" ? Leaf : Cross
            const iconColor = c.icon === "heart" ? "text-red-500 fill-red-500" : c.icon === "globe" ? "text-blue-600" : c.icon === "leaf" ? "text-emerald-600" : "text-red-600"
            const isSelected = selectedCharityId === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCharityId(c.id)}
                className={`w-full flex items-center gap-1.5 py-2 px-2.5 rounded-lg text-left transition-all border-2 ${isSelected ? "border-[#B8860B] bg-[#FFFBEB]" : "border-[#DAA520]/20 bg-white hover:border-[#DAA520]/50"}`}
              >
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0 ring-1 ring-[#DAA520]/25 overflow-hidden">
                  {c.logo ? <Image src={c.logo} alt="" width={24} height={24} className="object-contain" /> : <CharityIcon className={`w-3.5 h-3.5 ${iconColor}`} />}
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
        <label className="flex items-center gap-2 text-xs text-[#654321] cursor-pointer">
          <input type="checkbox" checked={coverFees} onChange={(e) => setCoverFees(e.target.checked)} className="rounded border-[#DAA520] text-[#EAB308]" />
          Cover transaction fees (${fee.toFixed(2)})
        </label>
        <p className="text-xs text-[#654321] tabular-nums">
          The {charity?.name ?? "charity"} will receive exactly ${netToCharity.toFixed(2)}.
        </p>
        <button
          type="button"
          disabled={donating}
          onClick={async () => {
            if (!charity) return
            setDonating(true)
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
            setDonating(false)
            if (err) {
              toast.error(err)
              return
            }
            setSuccess({ amount: remaining, charityName: charity.name, receiptUrl: receiptUrl ?? undefined })
            toast.success("Thank you for your donation!")
          }}
          className="w-full max-w-xs mx-auto py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#B8860B] shadow-md hover:shadow-lg hover:brightness-105 disabled:opacity-60 flex items-center justify-center gap-2 border border-[#654321]/20 transition-all"
        >
          {donating ? "Processing…" : `Donate $${totalCharged.toFixed(2)}`}
        </button>
      </div>
    </div>
  )
}
