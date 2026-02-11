"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ScrollText, Loader2 } from "lucide-react"
import { SettlementHistory } from "@/components/settlement-history"

type GiftSummary = {
  id: string
  name: string
  currentAmount: number
  targetAmount: number
}

export function HistoryContent() {
  const searchParams = useSearchParams()
  const idFromUrl = searchParams.get("id")

  const [giftId, setGiftId] = useState<string | null>(idFromUrl)
  const [gifts, setGifts] = useState<GiftSummary[]>([])
  const [loadingGifts, setLoadingGifts] = useState(!idFromUrl)
  const [selectedGift, setSelectedGift] = useState<GiftSummary | null>(null)
  const remaining = selectedGift
    ? Math.max(0, Math.round((selectedGift.currentAmount - selectedGift.targetAmount) * 100) / 100)
    : 0

  useEffect(() => {
    setGiftId(idFromUrl)
  }, [idFromUrl])

  useEffect(() => {
    if (idFromUrl) {
      setLoadingGifts(false)
      return
    }
    const fetchCollections = async () => {
      setLoadingGifts(true)
      try {
        const res = await fetch("/api/gifts/collections?status=active")
        if (!res.ok) {
          setGifts([])
          return
        }
        const data = await res.json()
        const list = (data.collections || []).map((g: { id: string; name: string; currentAmount: number; targetAmount: number }) => ({
          id: g.id,
          name: g.name,
          currentAmount: g.currentAmount,
          targetAmount: g.targetAmount,
        }))
        setGifts(list)
        if (list.length > 0 && !giftId) setSelectedGift(list[0])
      } catch {
        setGifts([])
      } finally {
        setLoadingGifts(false)
      }
    }
    fetchCollections()
  }, [idFromUrl])

  useEffect(() => {
    if (!giftId) return
    const fromList = gifts.find((x) => x.id === giftId)
    if (fromList) {
      setSelectedGift(fromList)
      return
    }
    fetch(`/api/gifts/${giftId}`)
      .then((r) => r.json())
      .then((d) => {
        const g = d.gift
        if (g)
          setSelectedGift({
            id: g.id,
            name: g.name || g.collectionTitle || g.giftName,
            currentAmount: Number(g.currentAmount) ?? 0,
            targetAmount: Number(g.targetAmount) ?? 0,
          })
        else setSelectedGift(null)
      })
      .catch(() => setSelectedGift(null))
  }, [giftId, gifts])

  if (loadingGifts && !giftId) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <Loader2 className="w-10 h-10 text-[#DAA520] animate-spin" aria-hidden />
        <p className="text-[#654321] font-medium">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border-2 border-[#DAA520]/25 bg-gradient-to-br from-[#FFFBEB] via-[#FEF7ED] to-[#FFFBEB] p-[14px] shadow-sm">
        <div className="flex flex-row items-center justify-center gap-2">
          <ScrollText className="w-[26px] h-[26px] text-[#DAA520] flex-shrink-0" aria-hidden />
          <h1 className="text-[26px] font-bold text-[#654321] whitespace-nowrap">Settlement History</h1>
        </div>
        <p className="text-xs sm:text-sm text-[#8B5A3C]/90 text-center mt-2">
          View past transactions: gift cards, charity, and Support Wishbee tips.
        </p>
      </div>

      {!giftId && gifts.length === 0 && (
        <div className="rounded-xl border-2 border-[#DAA520]/20 bg-white p-6">
          <p className="text-sm text-[#654321]">
            Sign in and open a gift from <Link href="/gifts/active" className="font-semibold text-[#DAA520] hover:text-[#B8860B]">Active Gifts</Link>, then click &quot;Settle balance&quot; to view settlement history for that gift.
          </p>
        </div>
      )}

      {!giftId && gifts.length > 0 && (
        <div className="rounded-xl border-2 border-[#DAA520]/20 bg-white p-4">
          <label className="block text-xs font-semibold text-[#654321] mb-2">Select a gift</label>
          <select
            value={selectedGift?.id ?? ""}
            onChange={(e) => {
              const id = e.target.value
              setGiftId(id)
              setSelectedGift(gifts.find((g) => g.id === id) ?? null)
            }}
            className="w-full py-2 px-3 rounded-lg border-2 border-[#DAA520]/30 bg-white text-[#654321] text-sm"
          >
            {gifts.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} (${Math.max(0, g.currentAmount - g.targetAmount).toFixed(2)} remaining)
              </option>
            ))}
          </select>
        </div>
      )}

      {giftId && selectedGift && (
        <div className="rounded-xl border-2 border-[#DAA520]/20 bg-white p-6">
          <h2 className="text-sm font-bold text-[#654321] mb-3">{selectedGift.name}</h2>
          <SettlementHistory giftId={giftId} remainingBalance={remaining} />
        </div>
      )}

      {giftId && !selectedGift && !loadingGifts && (
        <div className="rounded-xl border-2 border-[#DAA520]/20 bg-white p-6">
          <p className="text-sm text-[#654321]">Loading gift...</p>
        </div>
      )}
    </div>
  )
}
