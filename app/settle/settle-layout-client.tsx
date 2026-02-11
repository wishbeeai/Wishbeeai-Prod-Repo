"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, Gift } from "lucide-react"

export function SettleLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isSettle = pathname.startsWith("/settle")

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link
          href="/gifts/active"
          className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors"
          aria-label="Back to Active Gifts"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Back to Active Gifts
        </Link>

        {isSettle && (
          /* Header — visible on all settle tabs */
          <div className="mb-6">
            <div className="bg-card border border-border rounded-lg p-[12px]">
              <div className="flex flex-row items-center justify-center gap-2">
                <Gift className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#DAA520] flex-shrink-0" />
                <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-foreground whitespace-nowrap">
                  Settle Balance
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2">
                Choose how to use your remaining balance: gift cards, charity, refunds, credits, or support the platform.
              </p>
            </div>
          </div>
        )}

        {children}
      </div>
    </div>
  )
}
