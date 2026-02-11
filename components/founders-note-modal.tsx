"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

function runConfetti() {
  if (typeof window === "undefined") return
  import("canvas-confetti").then((confetti) => {
    const defaults = {
      origin: { y: 0.6 },
      colors: ["#EAB308", "#F4C430", "#DAA520", "#FEF3C7", "#654321", "#FFFBEB"],
    }
    confetti.default({ ...defaults, particleCount: 80, spread: 70 })
    confetti.default({ ...defaults, particleCount: 50, spread: 100, startVelocity: 30 })
  })
}

type FoundersNoteModalProps = {
  open: boolean
  onClose: () => void
  /** When provided, "Back to Settle Balance" navigates to /settle/balance?id=... so the user keeps gift context. */
  giftId?: string | null
}

export function FoundersNoteModal({ open, onClose, giftId }: FoundersNoteModalProps) {
  const router = useRouter()
  const confettiFired = useRef(false)

  useEffect(() => {
    if (open && !confettiFired.current) {
      confettiFired.current = true
      runConfetti()
    }
  }, [open])

  const handleBackToSettleBalance = () => {
    onClose()
    const query = giftId ? `?id=${encodeURIComponent(giftId)}` : ""
    router.push(`/settle/balance${query}`)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40"
            aria-hidden
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md rounded-2xl border border-[#E8D5A3]/50 bg-[#FFFBF0] shadow-2xl shadow-[#654321]/10 overflow-hidden"
              role="dialog"
              aria-labelledby="founder-note-title"
              aria-modal="true"
            >
              <div className="p-6 sm:p-8 text-center">
                {/* Logo / seal at top */}
                <div className="flex justify-center mb-5">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#DAA520]/20 border-2 border-[#DAA520]/30 shadow-inner overflow-hidden" aria-hidden>
                    <img src="/images/LogoBee-V1.png" alt="Wishbee" width={48} height={48} className="object-contain w-12 h-12" />
                  </div>
                </div>

                <p id="founder-note-title" className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-[#8B5A3C]/70 mb-4">
                  A note from the founder
                </p>

                <p className="text-sm sm:text-base text-[#654321] leading-relaxed text-left mb-5">
                  Thank you so much. Truly. Your support means we can keep Wishbee independent, ad-free, and focused on what matters: helping people show up for each other. We&apos;re building this for you, and we&apos;re so glad you&apos;re part of the hive.
                </p>

                <p className="text-sm text-[#8B5A3C] italic font-medium mb-6" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                  — The Wishbee Team
                </p>

                <button
                  type="button"
                  onClick={handleBackToSettleBalance}
                  className="w-full max-w-xs mx-auto py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#B8860B] shadow-md hover:shadow-lg hover:brightness-105 flex items-center justify-center gap-2 border border-[#654321]/20 transition-all"
                >
                  Back to Settle Balance
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
