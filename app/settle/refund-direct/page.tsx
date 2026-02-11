import type { Metadata } from "next"
import { Suspense } from "react"
import { RefundDirectContent } from "./refund-direct-content"
import { Loader2 } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Card Refund | Wishbee.ai",
  description: "Refund to original payment method. Proportional refund after fees. Process refunds or get Store Credit.",
}

function RefundDirectFallback() {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <Loader2 className="w-10 h-10 text-[#DAA520] animate-spin" aria-hidden />
      <p className="text-[#654321] font-medium">Loading...</p>
    </div>
  )
}

export default function SettleRefundDirectPage() {
  return (
    <Suspense fallback={<RefundDirectFallback />}>
      <RefundDirectContent />
    </Suspense>
  )
}
