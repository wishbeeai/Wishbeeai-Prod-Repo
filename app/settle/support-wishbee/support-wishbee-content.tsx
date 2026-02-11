"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FoundersNoteModal } from "@/components/founders-note-modal"

type GiftSummary = {
  id: string
  name: string
  currentAmount: number
  targetAmount: number
}

type GiftData = {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  recipientName?: string | null
}

async function saveTipSettlement(payload: {
  giftId: string
  amount: number
  recipientName: string
  giftName: string
  totalFundsCollected: number
  finalGiftPrice: number
}): Promise<string | null> {
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
}

export function SupportWishbeeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const giftId = searchParams.get("id")

  const [gift, setGift] = useState<GiftData | null>(null)
  const [loading, setLoading] = useState(!!giftId)
  const [activeGifts, setActiveGifts] = useState<GiftSummary[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [tipping, setTipping] = useState(false)
  const [success, setSuccess] = useState<{ amount: number; receiptUrl?: string } | null>(null)
  const [showFoundersNote, setShowFoundersNote] = useState(false)

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

  const fetchActiveGifts = useCallback(async () => {
    if (giftId) return
    setLoadingList(true)
    try {
      const res = await fetch("/api/gifts/collections?status=active")
      if (!res.ok) {
        setActiveGifts([])
        return
      }
      const data = await res.json()
      const list = (data.collections || []).map((g: { id: string; name: string; currentAmount: number; targetAmount: number }) => ({
        id: g.id,
        name: g.name || "Gift",
        currentAmount: Number(g.currentAmount) ?? 0,
        targetAmount: Number(g.targetAmount) ?? 0,
      }))
      setActiveGifts(list)
    } catch {
      setActiveGifts([])
    } finally {
      setLoadingList(false)
    }
  }, [giftId])

  useEffect(() => {
    fetchActiveGifts()
  }, [fetchActiveGifts])

  useEffect(() => {
    if (success && !showFoundersNote) {
      const query = giftId ? `?id=${encodeURIComponent(giftId)}` : ""
      router.replace(`/settle/balance${query}`)
    }
  }, [success, showFoundersNote, router, giftId])

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <Loader2 className="w-10 h-10 text-[#DAA520] animate-spin" aria-hidden />
        <p className="text-[#654321] font-medium">Loading...</p>
      </div>
    )
  }

  if (success && showFoundersNote) {
    return (
      <FoundersNoteModal
        open={true}
        onClose={() => setShowFoundersNote(false)}
        giftId={giftId}
      />
    )
  }

  if (!giftId || !gift) {
    const withBalance = activeGifts.filter(
      (g) => Math.max(0, Math.round((g.currentAmount - g.targetAmount) * 100) / 100) >= 0.01
    )
    return (
      <div className="space-y-6">
        <div className="rounded-xl border-2 border-[#DAA520]/25 bg-gradient-to-br from-[#FFFBEB] via-[#FEF7ED] to-[#FFFBEB] p-[14px] shadow-sm">
          <div className="flex flex-row items-center justify-center gap-2">
            <Sparkles className="w-[26px] h-[26px] text-[#DAA520] flex-shrink-0" aria-hidden />
            <h1 className="text-[26px] font-bold text-[#654321] whitespace-nowrap">Support Wishbee</h1>
          </div>
          <p className="text-sm italic font-normal text-[#8B5A3C]/80 text-center mt-1">
            Built for connection. Supported by you.
          </p>
        </div>
        {loadingList ? (
          <div className="rounded-xl border-2 border-[#DAA520]/20 bg-white p-8 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-[#DAA520] animate-spin" aria-hidden />
            <p className="text-sm text-[#654321]">Loading your active gifts…</p>
          </div>
        ) : withBalance.length > 0 ? (
          <div className="rounded-xl border-2 border-[#DAA520]/20 bg-white p-6 space-y-4">
            <p className="text-sm font-semibold text-[#654321]">Choose a gift to tip from its remaining balance</p>
            <ul className="space-y-2">
              {withBalance.map((g) => {
                const rem = Math.max(0, Math.round((g.currentAmount - g.targetAmount) * 100) / 100)
                return (
                  <li key={g.id}>
                    <button
                      type="button"
                      onClick={() => router.replace(`${pathname}?id=${encodeURIComponent(g.id)}`)}
                      className="w-full text-left rounded-xl border-2 border-[#DAA520]/20 bg-[#FFFBEB]/50 hover:border-[#DAA520]/40 hover:bg-[#FEF7ED] p-4 transition-colors"
                    >
                      <span className="block font-medium text-[#654321]">{g.name}</span>
                      <span className="block text-sm text-[#8B5A3C]/90 mt-0.5">
                        ${rem.toFixed(2)} remaining — tap to use for Support Wishbee
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <p className="text-xs text-[#8B5A3C]/80">
              Or select a gift from <Link href="/gifts/active" className="font-semibold text-[#DAA520] hover:text-[#B8860B]">Active Gifts</Link> and click &quot;Settle balance&quot; to open this flow with a gift already chosen.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-[#DAA520]/20 bg-white p-6">
            <p className="text-sm text-[#654321]">
              Select a gift from <Link href="/gifts/active" className="font-semibold text-[#DAA520] hover:text-[#B8860B]">Active Gifts</Link> and click &quot;Settle balance&quot; to tip Wishbee from the remaining balance.
            </p>
          </div>
        )}
      </div>
    )
  }

  if (remaining < 0.01) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border-2 border-[#DAA520]/25 bg-gradient-to-br from-[#FFFBEB] via-[#FEF7ED] to-[#FFFBEB] p-[14px] shadow-sm">
          <div className="flex flex-row items-center justify-center gap-2">
            <Sparkles className="w-[26px] h-[26px] text-[#DAA520] flex-shrink-0" aria-hidden />
            <h1 className="text-[26px] font-bold text-[#654321] whitespace-nowrap">Support Wishbee</h1>
          </div>
          <p className="text-sm italic font-normal text-[#8B5A3C]/80 text-center mt-1">
            Built for connection. Supported by you.
          </p>
        </div>
        <div className="rounded-xl border-2 border-[#DAA520]/20 bg-white p-6">
          <p className="text-sm text-[#654321]">
            This gift has no remaining balance. Choose a gift with leftover funds from <Link href="/gifts/active" className="font-semibold text-[#DAA520] hover:text-[#B8860B]">Active Gifts</Link>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border-2 border-[#DAA520]/25 bg-gradient-to-br from-[#FFFBEB] via-[#FEF7ED] to-[#FFFBEB] p-[14px] shadow-sm">
        <div className="flex flex-row items-center justify-center gap-2">
          <Sparkles className="w-[26px] h-[26px] text-[#DAA520] flex-shrink-0" aria-hidden />
          <h1 className="text-[26px] font-bold text-[#654321] whitespace-nowrap">Support Wishbee</h1>
        </div>
        <p className="text-sm italic font-normal text-[#8B5A3C]/80 text-center mt-1">
          Built for connection. Supported by you.
        </p>
      </div>
      <div className="rounded-xl border-2 border-[#DAA520]/20 bg-white p-6 space-y-4">
        <p className="px-4 text-center mx-auto max-w-full sm:max-w-[60ch] leading-relaxed text-muted-foreground font-normal text-sm">
          Love the experience? Your support helps us build new features and keep <strong className="font-semibold text-[#654321]">Wishbee</strong> buzz-free. Every bit goes directly back into making <strong className="font-semibold text-[#654321]">Wishbee</strong> better for your next gift.
        </p>
        <button
          type="button"
          disabled={tipping}
          onClick={async () => {
            setTipping(true)
            const receiptUrl = await saveTipSettlement({
              giftId: gift.id,
              amount: remaining,
              recipientName,
              giftName: gift.name,
              totalFundsCollected: gift.currentAmount,
              finalGiftPrice: Math.round((gift.currentAmount - remaining) * 100) / 100,
            })
            setSuccess({ amount: remaining, receiptUrl: receiptUrl ?? undefined })
            setShowFoundersNote(true)
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
            setTipping(false)
          }}
          className="w-full max-w-xs mx-auto py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#B8860B] shadow-md hover:shadow-lg hover:brightness-105 flex items-center justify-center gap-2 border border-[#654321]/20 transition-all disabled:opacity-60"
        >
          {tipping ? "Processing…" : `Tip Wishbee $${remaining.toFixed(2)}`}
        </button>
      </div>
    </div>
  )
}
