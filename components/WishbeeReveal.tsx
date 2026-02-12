"use client"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, Gift, Mail } from "lucide-react"

const WISHBEE_CONFETTI_PALETTE = ["#FFD700", "#FDB813", "#000000"] as const

/** Placeholder for reveal sound; replace with actual audio later. */
function playRevealSound() {
  if (typeof window === "undefined") return
  console.log("Tada!")
  // TODO: new Audio('/sounds/tada.mp3').play()
}

function runWishbeeConfetti() {
  if (typeof window === "undefined") return
  import("canvas-confetti").then((confetti) => {
    const c = confetti.default
    const colors = [...WISHBEE_CONFETTI_PALETTE]
    const particleCount = 80
    // Cannon from bottom-left (angle ~60° toward center)
    c({
      particleCount,
      spread: 55,
      origin: { x: 0, y: 1 },
      angle: 60,
      startVelocity: 45,
      colors,
    })
    // Cannon from bottom-right (angle ~120° toward center)
    c({
      particleCount,
      spread: 55,
      origin: { x: 1, y: 1 },
      angle: 120,
      startVelocity: 45,
      colors,
    })
  })
}

/** Clear active confetti (for testing reset). */
function clearConfetti() {
  if (typeof window === "undefined") return
  import("canvas-confetti").then((confetti) => {
    confetti.default.reset()
  })
}

export type WishbeeRevealProps = {
  /** Gift card claim URL (e.g. from Reloadly) */
  giftClaimUrl: string
  /** Gift card amount in dollars */
  giftAmount: number
  /** Optional: amount donated to charity in dollars */
  charityAmount?: number
  /** Optional: charity name for the impact message */
  charityName?: string
  /** Optional: email for "Say Thanks" mailto (default: email@wishbee.ai) */
  organizerEmail?: string
  /** Optional: recipient name for thank-you prefill */
  recipientName?: string
}

export function WishbeeReveal({
  giftClaimUrl,
  giftAmount,
  charityAmount,
  charityName,
  organizerEmail = "email@wishbee.ai",
  recipientName,
}: WishbeeRevealProps) {
  const [revealed, setRevealed] = useState(false)
  const testTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleReveal = useCallback(() => {
    runWishbeeConfetti()
    playRevealSound()
    setRevealed(true)
  }, [])

  const isDev = process.env.NODE_ENV === "development"

  const handleTestAnimation = useCallback(() => {
    if (testTimeoutRef.current) clearTimeout(testTimeoutRef.current)
    setRevealed(false)
    clearConfetti()
    testTimeoutRef.current = setTimeout(() => {
      testTimeoutRef.current = null
      setRevealed(true)
      runWishbeeConfetti()
      playRevealSound()
    }, 500)
  }, [])

  const sayThanksSubject = encodeURIComponent("Thank you for my Wishbee gift!")
  const sayThanksBody = encodeURIComponent(
    recipientName
      ? `Hi,\n\nI wanted to say thank you for my amazing Wishbee gift! I'm so grateful.\n\nBest,\n${recipientName}`
      : "Hi,\n\nI wanted to say thank you for my amazing Wishbee gift! I'm so grateful.\n\nBest wishes"
  )
  const mailtoHref = `mailto:${organizerEmail}?subject=${sayThanksSubject}&body=${sayThanksBody}`

  return (
    <div className="relative min-h-[420px] flex flex-col items-center justify-center p-6">
      {isDev && (
        <button
          type="button"
          onClick={handleTestAnimation}
          className="fixed bottom-4 right-4 z-50 px-3 py-2 rounded-xl text-xs font-medium bg-amber-900/90 text-amber-100 shadow-lg hover:bg-amber-800 border border-amber-700/50"
          aria-label="Test animation (development only)"
        >
          🛠️ Test Animation
        </button>
      )}
      <AnimatePresence mode="wait">
        {!revealed ? (
          /* Phase 1: The Sealed Wishbee (Anticipation) */
          <motion.div
            key="sealed"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.08, rotateY: 90 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            <motion.div
              role="button"
              tabIndex={0}
              onClick={handleReveal}
              onKeyDown={(e) => e.key === "Enter" && handleReveal()}
              className="relative rounded-3xl bg-gradient-to-br from-amber-50 via-white to-amber-50/80 border-2 border-amber-200/80 shadow-[0_20px_60px_-15px_rgba(180,134,11,0.25),0_8px_24px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_24px_72px_-16px_rgba(180,134,11,0.3),0_12px_28px_-8px_rgba(0,0,0,0.1)] cursor-pointer overflow-hidden"
              animate={{
                y: [0, -6, 0],
                boxShadow: [
                  "0 20px 60px -15px rgba(180,134,11,0.25), 0 8px 24px -8px rgba(0,0,0,0.08)",
                  "0 24px 72px -16px rgba(180,134,11,0.3), 0 12px 28px -8px rgba(0,0,0,0.1)",
                  "0 20px 60px -15px rgba(180,134,11,0.25), 0 8px 24px -8px rgba(0,0,0,0.08)",
                ],
              }}
              transition={{
                y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="px-8 py-12 text-center">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-200 to-amber-100 border border-amber-300/50 shadow-inner mb-6"
                >
                  <Gift className="w-8 h-8 text-amber-800" strokeWidth={1.8} />
                </motion.div>
                <p className="text-lg font-semibold text-amber-900/95 tracking-tight">
                  You have a Wishbee!
                </p>
                <p className="mt-2 text-sm text-amber-800/80">
                  Click to reveal your gift.
                </p>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          /* Phase 2 & 3: The Reveal → Impact Dashboard */
          <motion.div
            key="revealed"
            initial={{ opacity: 0, scale: 0.88, rotateY: -12 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md space-y-6"
          >
            {/* Gift Card section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="rounded-3xl bg-white border border-amber-200/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08),0_8px_24px_-8px_rgba(180,134,11,0.12)] overflow-hidden"
            >
              <div className="p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200/60">
                    <Gift className="w-6 h-6 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-900/70 uppercase tracking-wider">
                      Your gift card
                    </p>
                    <p className="text-2xl font-bold text-amber-900">
                      ${giftAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
                <a
                  href={giftClaimUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-4 px-6 rounded-2xl font-semibold text-amber-900 bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 border border-amber-300/60 shadow-sm hover:shadow-md hover:from-amber-300 hover:via-amber-200 hover:to-amber-300 transition-all duration-200"
                >
                  <Gift className="w-5 h-5" />
                  Claim your gift card
                </a>
              </div>
            </motion.section>

            {/* Bonus Impact section (only when charity data present) */}
            {charityAmount != null && charityAmount > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="rounded-3xl bg-white border border-rose-200/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06),0_8px_24px_-8px_rgba(244,63,94,0.08)] overflow-hidden"
              >
                <div className="p-6 md:p-8 space-y-3">
                  <div className="flex items-center gap-3 text-rose-700">
                    <Heart className="w-7 h-7 fill-rose-400/80" />
                    <h3 className="text-base font-semibold text-amber-900/90">
                      Bonus impact
                    </h3>
                  </div>
                  <p className="text-amber-900/90 leading-relaxed">
                    Because your friends are amazing, they also made a donation of{" "}
                    <strong className="text-amber-800">${charityAmount.toFixed(2)}</strong>
                    {charityName ? ` to ${charityName}` : ""} in your name.
                  </p>
                </div>
              </motion.section>
            )}

            {/* Say Thanks */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="flex justify-center pt-2"
            >
              <a
                href={mailtoHref}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-medium text-amber-900/90 bg-white/90 border border-amber-200/70 shadow-sm hover:shadow-md hover:bg-amber-50/80 transition-all duration-200"
              >
                <Mail className="w-4 h-4" />
                Say Thanks
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
