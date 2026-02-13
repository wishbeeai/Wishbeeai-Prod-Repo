"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { ArrowLeft, Gift } from "lucide-react"

export function SettleLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isSettle = pathname.startsWith("/settle")
  const giftId = searchParams.get("id")
  const [collectionTitle, setCollectionTitle] = useState<string | null>(null)

  useEffect(() => {
    if (!giftId || !isSettle) {
      setCollectionTitle(null)
      return
    }
    let cancelled = false
    fetch(`/api/gifts/${giftId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const title = data?.gift?.name ?? data?.gift?.collectionTitle ?? data?.gift?.giftName ?? data?.name
        if (!cancelled && title) setCollectionTitle(title)
      })
      .catch(() => {
        if (!cancelled) setCollectionTitle(null)
      })
    return () => {
      cancelled = true
    }
  }, [giftId, isSettle])

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
              {collectionTitle && (
                <p className="text-base font-semibold text-[#654321] text-center mt-2" aria-label={`Settlement for ${collectionTitle}`}>
                  {collectionTitle}
                </p>
              )}
            </div>
          </div>
        )}

        {children}
      </div>
    </div>
  )
}
