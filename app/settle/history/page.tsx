import type { Metadata } from "next"
import { Suspense } from "react"
import { HistoryContent } from "./history-content"
import { Loader2 } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Settlement History | Wishbee.ai",
  description: "View past settlements: gift cards, charity donations, refunds, and tips.",
}

function HistoryFallback() {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <Loader2 className="w-10 h-10 text-[#DAA520] animate-spin" aria-hidden />
      <p className="text-[#654321] font-medium">Loading...</p>
    </div>
  )
}

export default function SettleHistoryPage() {
  return (
    <Suspense fallback={<HistoryFallback />}>
      <HistoryContent />
    </Suspense>
  )
}
