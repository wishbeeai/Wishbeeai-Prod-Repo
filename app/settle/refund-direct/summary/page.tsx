import { Suspense } from "react"
import { RefundDirectSummaryContent } from "./summary-content"
import { Loader2 } from "lucide-react"

export const dynamic = "force-dynamic"

function SummaryFallback() {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <Loader2 className="w-10 h-10 text-[#DAA520] animate-spin" aria-hidden />
      <p className="text-[#654321] font-medium">Loading...</p>
    </div>
  )
}

export default function RefundDirectSummaryPage() {
  return (
    <Suspense fallback={<SummaryFallback />}>
      <RefundDirectSummaryContent />
    </Suspense>
  )
}
