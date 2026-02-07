"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Heart, Gift, Sparkles } from "lucide-react"

const HONEY_GOLD = "#EAB308"

export type ThankYouContributor = {
  id: string
  name: string
  amount?: number
  showAmount?: boolean
  hearted?: boolean
}

export type ThankYouImpact =
  | { type: "charity"; charityName: string; amount: number }
  | { type: "bonus"; amount: number }
  | { type: "hive"; amount: number }

export type ThankYouGalleryProps = {
  recipientName: string
  giftName?: string
  unboxingImageUrl?: string | null
  thankYouNote: string
  contributors: ThankYouContributor[]
  impact?: ThankYouImpact | null
  onUnboxingUpload?: (file: File) => void
  onHeartClick?: (contributorId: string, hearted: boolean) => void
  showConfetti?: boolean
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

export function ThankYouGallery({
  recipientName,
  giftName,
  unboxingImageUrl,
  thankYouNote,
  contributors,
  impact,
  onUnboxingUpload,
  onHeartClick,
  showConfetti = true,
}: ThankYouGalleryProps) {
  const confettiFired = useRef(false)
  const [heartedIds, setHeartedIds] = useState<Set<string>>(() =>
    new Set(contributors.filter((c) => c.hearted).map((c) => c.id))
  )

  useEffect(() => {
    if (showConfetti && !confettiFired.current) {
      confettiFired.current = true
      runConfetti()
    }
  }, [showConfetti])

  const handleHeart = (id: string) => {
    const next = new Set(heartedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setHeartedIds(next)
    onHeartClick?.(id, next.has(id))
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8] py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Hero Reveal — unboxing image + Thank You badge */}
        <motion.section
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative rounded-2xl overflow-hidden shadow-lg bg-white border border-[#EAB308]/20"
        >
          <div className="aspect-[4/3] bg-gradient-to-br from-amber-100 to-[#FEF3C7] flex items-center justify-center">
            {unboxingImageUrl ? (
              <img
                src={unboxingImageUrl}
                alt={`${recipientName} unboxing`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-6">
                <Gift className="w-16 h-16 mx-auto text-[#EAB308]/60 mb-3" />
                <p className="text-[#8B4513]/70 text-sm">Unboxing photo</p>
                {onUnboxingUpload && (
                  <label className="mt-2 inline-block px-4 py-2 rounded-xl text-sm font-medium cursor-pointer border-2 border-[#EAB308]/50 text-[#654321] hover:bg-[#EAB308]/10 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) onUnboxingUpload(f)
                      }}
                    />
                    Upload photo
                  </label>
                )}
              </div>
            )}
          </div>
          <div
            className="absolute top-4 right-4 px-4 py-2 rounded-xl font-bold text-white shadow-lg"
            style={{ backgroundColor: HONEY_GOLD }}
          >
            Thank You!
          </div>
        </motion.section>

        {/* AI-Drafted Note */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="bg-white rounded-2xl shadow-lg border border-[#EAB308]/20 p-6"
        >
          <div className="flex items-center gap-2 text-[#654321] mb-3">
            <Sparkles className="w-5 h-5" style={{ color: HONEY_GOLD }} />
            <span className="text-sm font-semibold">A note from {recipientName}</span>
          </div>
          <p className="text-[#8B4513] leading-relaxed whitespace-pre-wrap">{thankYouNote}</p>
        </motion.section>

        {/* Wall of Buzz */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <h2 className="text-lg font-bold text-[#654321] mb-4 px-1">Wall of Buzz</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {contributors.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.06, duration: 0.35 }}
                className="bg-white rounded-xl shadow-md border border-[#EAB308]/20 p-4 flex flex-col items-center text-center"
              >
                <p className="font-semibold text-[#654321] text-sm truncate w-full">{c.name}</p>
                {(c.showAmount !== false && c.amount != null) && (
                  <p className="text-xs mt-0.5" style={{ color: HONEY_GOLD }}>
                    ${c.amount.toFixed(2)} chipped in
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => handleHeart(c.id)}
                  className="mt-2 p-1.5 rounded-full transition-colors hover:bg-amber-50"
                  aria-label={heartedIds.has(c.id) ? "Remove heart" : "Send heart"}
                >
                  <Heart
                    className="w-5 h-5"
                    fill={heartedIds.has(c.id) ? "#EAB308" : "none"}
                    stroke={heartedIds.has(c.id) ? "#EAB308" : "#8B4513"}
                    strokeWidth={2}
                  />
                </button>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Final Impact Badge — Bonus (≥$1), Charity, or Hive Supporter (<$1) */}
        {impact != null && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col gap-2"
          >
            {impact.type === "charity" && (
              <p className="text-center text-sm text-[#8B4513] bg-white/80 rounded-xl py-3 px-4 border border-[#EAB308]/20 shadow-sm">
                This Hive also supported <strong>{impact.charityName}</strong> with a{" "}
                <strong style={{ color: HONEY_GOLD }}>${impact.amount.toFixed(2)}</strong> donation!
              </p>
            )}
            {impact.type === "bonus" && impact.amount >= 1 && (
              <p className="text-center text-sm text-[#8B4513] bg-white/80 rounded-xl py-3 px-4 border border-[#EAB308]/20 shadow-sm">
                This Hive sent a{" "}
                <strong style={{ color: HONEY_GOLD }}>${impact.amount.toFixed(2)}</strong> bonus gift
                card!
              </p>
            )}
            {(impact.type === "hive" || (impact.type === "bonus" && impact.amount < 1)) && (
              <div className="text-center">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#654321] border-2 shadow-sm"
                  style={{ borderColor: HONEY_GOLD, backgroundColor: "#FEFCE8" }}
                >
                  <span aria-hidden>🐝</span>
                  Hive Supporter
                </span>
                <p className="text-xs text-[#8B4513]/80 mt-1.5">
                  A small balance helped keep Wishbee ad-free.
                </p>
              </div>
            )}
          </motion.section>
        )}
      </div>
    </div>
  )
}
