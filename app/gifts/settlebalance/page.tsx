import { Suspense } from "react"
import { SettleBalanceContent } from "./settlebalance-content"
import { Loader2 } from "lucide-react"

export const dynamic = "force-dynamic"

function SettleBalanceFallback() {
  return (
    <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-[#DAA520] animate-spin" aria-hidden />
        <p className="text-[#654321] font-medium">Loading...</p>
      </div>
    </div>
  )
}

export default function SettleBalancePage() {
  return (
    <Suspense fallback={<SettleBalanceFallback />}>
      <SettleBalanceContent />
    </Suspense>
  )
}
