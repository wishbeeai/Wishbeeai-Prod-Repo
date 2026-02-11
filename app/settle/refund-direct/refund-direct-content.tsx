"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { CreditCard, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { processCashRefunds } from "@/lib/actions/settle"

type RefundPreviewRow = {
  contributorName: string
  originalAmount: number
  estimatedRefund: number
}

type RefundPreview = {
  giftId: string
  giftName: string
  totalGross: number
  totalFees: number
  netRefundablePool: number
  rows: RefundPreviewRow[]
  /** When false, amounts are from gift_contributions/evite; refund to card requires payment records. */
  canProcessRefund?: boolean
}

function formatMoney(n: number): string {
  return `$${n.toFixed(2)}`
}

export function RefundDirectContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const giftId = searchParams.get("id")

  const [preview, setPreview] = useState<RefundPreview | null>(null)
  const [loading, setLoading] = useState(!!giftId)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPreview = useCallback(async () => {
    if (!giftId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/gifts/${giftId}/refund-preview`)
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? "Failed to load refund preview")
        setPreview(null)
        return
      }
      setPreview(data)
    } catch {
      setError("Failed to load refund preview")
      setPreview(null)
    } finally {
      setLoading(false)
    }
  }, [giftId])

  useEffect(() => {
    fetchPreview()
  }, [fetchPreview])

  const handleConfirm = async () => {
    if (!preview || preview.netRefundablePool < 0.01) return
    setProcessing(true)
    try {
      const result = await processCashRefunds(preview.giftId, preview.netRefundablePool)
      if (!result.success) {
        toast.error(result.error ?? "Refund failed")
        return
      }
      const bank = result.bankRefundCount ?? 0
      const credits = result.creditsIssuedCount ?? 0
      const failed = result.failedCount ?? 0
      router.push(
        `/settle/refund-direct/summary?bank=${bank}&credits=${credits}&failed=${failed}&giftId=${preview.giftId}`
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <Loader2 className="w-10 h-10 text-[#DAA520] animate-spin" aria-hidden />
        <p className="text-[#654321] font-medium">Loading refund preview...</p>
      </div>
    )
  }

  if (!giftId) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border-2 border-[#DAA520]/25 bg-gradient-to-br from-[#FFFBEB] via-[#FEF7ED] to-[#FFFBEB] p-[14px] shadow-sm">
          <div className="flex flex-row items-center justify-center gap-2">
            <CreditCard className="w-[26px] h-[26px] text-[#DAA520] flex-shrink-0" aria-hidden />
            <h1 className="text-[26px] font-bold text-[#654321] whitespace-nowrap">Card Refund</h1>
          </div>
          <p className="text-xs sm:text-sm text-[#8B5A3C]/90 text-center mt-2">
            Proportional refund to original payment method. Fees are deducted before distribution.
          </p>
        </div>
        <div className="rounded-2xl border-2 border-[#DAA520]/20 bg-white p-6 shadow-lg">
          <p className="text-sm text-[#654321]">
            Select a gift from <Link href="/gifts/active" className="font-semibold text-[#DAA520] hover:text-[#B8860B]">Active Gifts</Link> and
            click &quot;Settle balance&quot;, then choose &quot;Card Refund&quot; to see the fee breakdown and confirm.
          </p>
        </div>
      </div>
    )
  }

  if (error || !preview) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border-2 border-[#DAA520]/25 bg-gradient-to-br from-[#FFFBEB] via-[#FEF7ED] to-[#FFFBEB] p-[14px] shadow-sm">
          <div className="flex flex-row items-center justify-center gap-2">
            <CreditCard className="w-[26px] h-[26px] text-[#DAA520] flex-shrink-0" aria-hidden />
            <h1 className="text-[26px] font-bold text-[#654321] whitespace-nowrap">Card Refund</h1>
          </div>
          <p className="text-xs sm:text-sm text-[#8B5A3C]/90 text-center mt-2">
            {error ?? "No refundable contributions found."}
          </p>
        </div>
        <div className="rounded-2xl border-2 border-[#DAA520]/20 bg-white p-6 shadow-lg">
          <p className="text-sm text-[#654321]">
            Open a gift with completed contributions from <Link href="/gifts/active" className="font-semibold text-[#DAA520] hover:text-[#B8860B]">Active Gifts</Link> and
            use &quot;Settle balance&quot; → &quot;Card Refund&quot;.
          </p>
        </div>
      </div>
    )
  }

  const hasRows = preview.rows.length > 0 && preview.netRefundablePool >= 0.01

  return (
    <div className="space-y-6">
      <div className="rounded-xl border-2 border-[#DAA520]/25 bg-gradient-to-br from-[#FFFBEB] via-[#FEF7ED] to-[#FFFBEB] p-[14px] shadow-sm">
        <div className="flex flex-row items-center justify-center gap-2">
          <CreditCard className="w-[26px] h-[26px] text-[#DAA520] flex-shrink-0" aria-hidden />
          <h1 className="text-[26px] font-bold text-[#654321] whitespace-nowrap">Card Refund</h1>
        </div>
        <p className="text-xs sm:text-sm text-[#8B5A3C]/90 text-center mt-2">
          Refunds are sent back to original payment methods. If a card is expired or fails, we&apos;ll automatically issue Wishbee Credits to that user.
        </p>
      </div>
      {/* Fee breakdown */}
      <div className="rounded-2xl border-2 border-[#DAA520]/20 bg-white p-6 shadow-lg space-y-3">
        <h2 className="text-sm font-bold text-[#654321]">Fee breakdown</h2>
        <div className="text-sm text-[#8B5A3C]/90 space-y-1">
          <p>Total contributions (gross): {formatMoney(preview.totalGross)}</p>
          <p>Stripe fees (deducted): −{formatMoney(preview.totalFees)}</p>
          <p className="font-semibold text-[#654321] pt-1 border-t border-[#DAA520]/20">
            Net refundable pool: {formatMoney(preview.netRefundablePool)}
          </p>
        </div>
      </div>

      {/* Table */}
      {hasRows && (
        <div className="rounded-2xl border-2 border-[#DAA520]/20 bg-white overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5F1E8] border-b border-[#DAA520]/20">
                  <th className="text-left py-3 px-4 font-semibold text-[#654321]">Contributor</th>
                  <th className="text-right py-3 px-4 font-semibold text-[#654321]">Original amount</th>
                  <th className="text-right py-3 px-4 font-semibold text-[#654321]">Estimated refund</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, idx) => (
                  <tr key={idx} className="border-b border-[#DAA520]/10 last:border-0">
                    <td className="py-3 px-4 text-[#654321]">{row.contributorName}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-[#8B5A3C]">{formatMoney(row.originalAmount)}</td>
                    <td className="py-3 px-4 text-right tabular-nums font-medium text-[#654321]">{formatMoney(row.estimatedRefund)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Process Refunds */}
      {hasRows && (
        <button
          type="button"
          onClick={handleConfirm}
          disabled={processing}
          className="w-full max-w-xs mx-auto py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#B8860B] shadow-md hover:shadow-lg hover:brightness-105 disabled:opacity-60 flex items-center justify-center gap-2 border border-[#654321]/20 transition-all"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              Processing…
            </>
          ) : (
            "Process Refunds"
          )}
        </button>
      )}

      {preview.rows.length > 0 && preview.netRefundablePool < 0.01 && (
        <p className="text-sm text-[#8B5A3C]/90">
          Net refundable pool is below $0.01 after fees. No refund to process.
        </p>
      )}
    </div>
  )
}
