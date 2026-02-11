import type { Metadata } from "next"
import { Suspense } from "react"
import { SettleNav } from "@/components/SettleNav"
import { SettleLayoutClient } from "./settle-layout-client"

export const metadata: Metadata = {
  title: "Settle Balance | Wishbee.ai",
  description: "Choose how to use your group gift balance: gift rewards, charity, refunds, or Wishbee credits.",
}

function SettleLoading() {
  return (
    <div className="flex items-center justify-center min-h-[320px] text-[#654321]">
      <div className="animate-pulse text-sm font-medium">Loading...</div>
    </div>
  )
}

export default function SettleLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettleLayoutClient>
      <div className="flex flex-col md:flex-row gap-0 md:gap-0 rounded-2xl overflow-hidden bg-white shadow-lg border border-[#DAA520]/20 min-h-[480px]">
        <aside className="md:w-64 lg:w-72 flex-shrink-0 border-r border-[#DAA520]/20" aria-label="Settlement navigation">
          <Suspense fallback={<div className="p-4 animate-pulse bg-[#F5F1E8] min-h-[400px]" />}>
            <SettleNav />
          </Suspense>
        </aside>
        <main className="flex-1 min-h-[400px] p-4 md:p-6 bg-gradient-to-br from-[#FEF7ED] via-[#FFF7ED] to-[#FFFBEB] overflow-auto">
          <Suspense fallback={<SettleLoading />}>
            {children}
          </Suspense>
        </main>
      </div>
    </SettleLayoutClient>
  )
}
