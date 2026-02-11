import type { Metadata } from "next"
import { Suspense } from "react"
import { CharityContent } from "./charity-content"
import { Loader2 } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Social Impact – Donate to Charity | Wishbee.ai",
  description: "Donate your group gift balance to 501(c)(3) charities. Make a tax-deductible impact.",
}

function CharityFallback() {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <Loader2 className="w-10 h-10 text-[#DAA520] animate-spin" aria-hidden />
      <p className="text-[#654321] font-medium">Loading...</p>
    </div>
  )
}

export default function SettleCharityPage() {
  return (
    <Suspense fallback={<CharityFallback />}>
      <CharityContent />
    </Suspense>
  )
}
