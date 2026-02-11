import type { Metadata } from "next"
import { Suspense } from "react"
import { RewardsContent } from "../rewards/rewards-content"
import { Loader2 } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Settle Balance | Wishbee.ai",
  description: "Convert your group gift pool into store gift cards like Target or Amazon.",
}

function RewardsFallback() {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <Loader2 className="w-10 h-10 text-[#DAA520] animate-spin" aria-hidden />
      <p className="text-[#654321] font-medium">Loading...</p>
    </div>
  )
}

export default function SettleBalancePage() {
  return (
    <Suspense fallback={<RewardsFallback />}>
      <RewardsContent />
    </Suspense>
  )
}
