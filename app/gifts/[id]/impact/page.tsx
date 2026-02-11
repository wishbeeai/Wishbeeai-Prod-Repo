"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Heart, Share2 } from "lucide-react"
import { getCharityById } from "@/lib/charity-data"

type GiftData = {
  recipientName?: string | null
  contributors?: number
  name?: string
}

type Settlement = {
  id: string
  amount: number
  disposition: string
  charityId: string | null
  charityName: string | null
}

function runConfetti() {
  if (typeof window === "undefined") return
  import("canvas-confetti").then((confetti) => {
    const count = 120
    const defaults = { origin: { y: 0.6 }, colors: ["#EAB308", "#F4C430", "#DAA520", "#FEF3C7", "#654321"] }
    function fire(particleRatio: number, opts: { spread: number; startVelocity?: number }) {
      confetti.default({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      })
    }
    fire(0.25, { spread: 26, startVelocity: 55 })
    fire(0.2, { spread: 60 })
    fire(0.35, { spread: 100, startVelocity: 25 })
    fire(0.2, { spread: 120, startVelocity: 45 })
  })
}

export default function ImpactPage() {
  const params = useParams()
  const giftId = params.id as string
  const [gift, setGift] = useState<GiftData | null>(null)
  const [impactSettlement, setImpactSettlement] = useState<Settlement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const confettiFired = useRef(false)

  useEffect(() => {
    if (!giftId) return
    const fetchData = async () => {
      try {
        const [giftRes, settlementsRes] = await Promise.all([
          fetch(`/api/gifts/${giftId}`),
          fetch(`/api/gifts/${giftId}/settlements`),
        ])
        if (!giftRes.ok) throw new Error("Gift not found")
        if (!settlementsRes.ok) throw new Error("Settlements not found")
        const giftData = await giftRes.json()
        const settlementsData = await settlementsRes.json()
        setGift(giftData.gift ?? null)
        const settlements = (settlementsData.settlements ?? []) as Settlement[]
        const impact = settlements.find((s) => s.disposition === "charity" || s.disposition === "tip")
        setImpactSettlement(impact ?? null)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [giftId])

  useEffect(() => {
    if (!loading && impactSettlement && !confettiFired.current) {
      confettiFired.current = true
      runConfetti()
    }
  }, [loading, impactSettlement])

  const shareText = impactSettlement
    ? `My friends are the best! They got me a great gift and donated to ${impactSettlement.charityName ?? "Wishbee"} in my honor via @WishbeeAI! 🐝✨`
    : "My friends are the best! They got me a great gift via @WishbeeAI! 🐝✨"

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My friends surprised me!",
          text: shareText,
          url: window.location.href,
        })
      } catch (err) {
        if ((err as Error).name !== "AbortError") copyAndOpenLinkedIn()
      }
    } else {
      copyAndOpenLinkedIn()
    }
  }

  const copyAndOpenLinkedIn = () => {
    navigator.clipboard.writeText(shareText)
    toast.success("Post copied! Paste into LinkedIn or Instagram.")
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`
    window.open(url, "_blank", "width=600,height=500")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/80 to-rose-50/60 flex items-center justify-center p-6">
        <div className="animate-spin w-10 h-10 border-2 border-[#DAA520] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !gift) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/80 to-rose-50/60 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <p className="text-[#8B5A3C] mb-4">{error || "Page not found"}</p>
          <a href="/gifts/active" className="text-[#DAA520] font-semibold hover:text-[#B8860B]">
            Back to Active Gifts
          </a>
        </div>
      </div>
    )
  }

  const recipientName = gift.recipientName ?? "you"
  const contributorCount = gift.contributors ?? 0
  const charityName = impactSettlement?.charityName ?? "Wishbee"
  const netAmount = impactSettlement?.amount ?? 0
  const charityConfig = impactSettlement?.charityId ? getCharityById(impactSettlement.charityId) : null
  const charityMission =
    charityConfig?.description ??
    (impactSettlement?.disposition === "tip" ? "keep Wishbee's AI free and ad-free" : "make a meaningful difference")

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/80 to-rose-50/60 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#654321] leading-tight">
            Wishbee has a special surprise for you, {recipientName}!
          </h1>
        </motion.section>

        {/* Impact Card — Charity or Wishbee Tip donation in honor */}
        {impactSettlement ? (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="bg-white rounded-2xl shadow-xl border-2 border-[#DAA520]/30 overflow-hidden"
          >
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 text-[#DAA520]">
                <Heart className="w-8 h-8 fill-[#DAA520]/30" />
                <h2 className="text-lg font-bold text-[#654321]">Your friends went above and beyond!</h2>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[#FFFBEB]/80 border border-[#DAA520]/20">
                {charityConfig?.logo ? (
                  <Image
                    src={charityConfig.logo}
                    alt={charityName}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-lg object-contain bg-white shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-[#DAA520]/20 flex items-center justify-center">
                    <Heart className="w-8 h-8 text-[#DAA520]" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-[#654321]">
                    A donation of <span className="text-[#DAA520]">${netAmount.toFixed(2)}</span> was made to{" "}
                    <strong>{charityName}</strong> in your honor.
                  </p>
                  <p className="text-sm text-[#8B5A3C]/90 mt-1">This gift helps {charityMission}.</p>
                </div>
              </div>
            </div>
          </motion.section>
        ) : (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="bg-white/80 rounded-2xl shadow-lg border border-[#DAA520]/20 p-6 text-center"
          >
            <p className="text-[#654321] font-medium">Your friends are amazing! 🐝</p>
          </motion.section>
        )}

        {/* Personal Touch / Group Note */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="bg-white/80 rounded-2xl shadow-lg border border-[#DAA520]/20 p-6 text-center"
        >
          <p className="text-[#654321] font-medium">
            By pooling their resources, your{" "}
            <strong className="text-[#DAA520]">{contributorCount}</strong> friends made this possible.
          </p>
        </motion.section>

        {/* Social Sharing */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="flex justify-center"
        >
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[#654321] bg-gradient-to-r from-[#DAA520] to-[#F4C430] shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            <Share2 className="w-5 h-5" />
            Share the good news
          </button>
        </motion.section>
      </div>
    </div>
  )
}
