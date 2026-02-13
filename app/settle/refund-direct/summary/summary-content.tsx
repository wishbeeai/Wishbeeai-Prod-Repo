"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CreditCard, CheckCircle } from "lucide-react"

export function RefundDirectSummaryContent() {
  const searchParams = useSearchParams()
  const bank = Number(searchParams.get("bank")) || 0
  const credits = Number(searchParams.get("credits")) || 0
  const failed = Number(searchParams.get("failed")) || 0
  const giftId = searchParams.get("giftId")

  return (
    <div className="space-y-6 text-center max-w-lg mx-auto">
      <div className="flex flex-col items-center gap-3">
        <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#DAA520]/20" aria-hidden>
          <CreditCard className="w-6 h-6 text-[#B8860B]" aria-hidden />
        </span>
        <div>
          <h1 className="text-xl font-bold text-[#654321]">Refund complete</h1>
          <p className="text-sm text-[#8B5A3C]/90">
            Summary of your cash refund and store credits.
          </p>
        </div>
      </div>

      <div className="rounded-xl border-2 border-[#DAA520]/20 bg-white p-6 space-y-4 text-center">
        <div className="flex items-center justify-center gap-2 text-[#654321]">
          <CheckCircle className="w-5 h-5 text-emerald-600" aria-hidden />
          <span className="font-semibold">Results</span>
        </div>
        {(bank > 0 || credits > 0) && giftId && (
          <p className="text-xs font-medium text-[#8B5A3C]/90" data-testid="gift-status">
            Gift status: Settled (Refund)
          </p>
        )}
        <ul className="space-y-2 text-sm text-[#8B5A3C]/90 list-none">
          <li>
            <strong className="text-[#654321]">{bank}</strong> bank refund{bank !== 1 ? "s" : ""} successful. Money will appear in 5–10 business days.
          </li>
          {credits > 0 && (
            <li data-testid="store-credit-fallback-message">
              <strong className="text-[#654321]">{credits}</strong> credit{credits !== 1 ? "s" : ""} issued (due to card errors). Recipients can use Wishbee Store Credit.
            </li>
          )}
          {failed > 0 && (
            <li className="text-amber-700">
              <strong>{failed}</strong> refund{failed !== 1 ? "s" : ""} could not be processed and no user account was available for credit. Check Refund Errors for admin resolution.
            </li>
          )}
        </ul>
        <div className="pt-2 text-center">
          <Link
            href={giftId ? `/settle/history?id=${giftId}` : "/settle/history"}
            className="text-sm font-medium text-[#DAA520] hover:text-[#B8860B]"
          >
            View settlement history
          </Link>
        </div>
      </div>
    </div>
  )
}
