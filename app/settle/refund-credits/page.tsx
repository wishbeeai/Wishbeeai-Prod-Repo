import type { Metadata } from "next"
import { Suspense } from "react"
import { RefundCreditsContent } from "./refund-credits-content"
import { Loader2 } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Store Credit | Wishbee.ai",
  description: "Refund as Wishbee store credits. Proportional credit distribution to each contributor.",
}

function RefundCreditsFallback() {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <Loader2 className="w-10 h-10 text-[#DAA520] animate-spin" aria-hidden />
      <p className="text-[#654321] font-medium">Loading...</p>
    </div>
  )
}

export default function SettleRefundCreditsPage() {
  return (
    <Suspense fallback={<RefundCreditsFallback />}>
      <RefundCreditsContent />
    </Suspense>
  )
}
