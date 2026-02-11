import type { Metadata } from "next"
import { Suspense } from "react"
import { SupportWishbeeContent } from "./support-wishbee-content"
import { Loader2 } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Support Wishbee | Wishbee.ai",
  description: "Love the experience? Your support helps Wishbee build new features and keep gifting simple for everyone.",
}

function SupportWishbeeFallback() {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <Loader2 className="w-10 h-10 text-[#DAA520] animate-spin" aria-hidden />
      <p className="text-[#654321] font-medium">Loading...</p>
    </div>
  )
}

export default function SettleSupportWishbeePage() {
  return (
    <Suspense fallback={<SupportWishbeeFallback />}>
      <SupportWishbeeContent />
    </Suspense>
  )
}
