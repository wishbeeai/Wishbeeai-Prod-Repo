"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Wallet, Loader2, CheckCircle, PartyPopper } from "lucide-react"
import { processStoreCredits } from "@/lib/actions/settle"

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
}

function formatMoney(n: number): string {
  return `$${n.toFixed(2)}`
}

export function RefundCreditsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const giftId = searchParams.get("id")

  const [preview, setPreview] = useState<RefundPreview | null>(null)
  const [loading, setLoading] = useState(!!giftId)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ creditsIssued: number; failed: number } | null>(null)

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
        setError(data?.error ?? "Failed to load preview")
        setPreview(null)
        return
      }
      setPreview(data)
    } catch {
      setError("Failed to load preview")
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
    setError(null)
    try {
      const result = await processStoreCredits(preview.giftId, preview.netRefundablePool)
      if (!result.success) {
        setError(result.error ?? "Failed to issue credits")
        return
      }
      setSuccess({
        creditsIssued: result.creditsIssuedCount ?? 0,
        failed: result.failedCount ?? 0,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <Loader2 className="w-10 h-10 text-[#DAA520] animate-spin" aria-hidden />
        <p className="text-[#654321] font-medium">Loading proportional credit distribution...</p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100" aria-hidden>
            <CheckCircle className="w-6 h-6 text-emerald-600" aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-bold text-[#654321]">Success!</h1>
            <p className="text-sm text-[#8B5A3C]/90">
              Your friends just got a head start on their next Wishbee.
            </p>
          </div>
        </div>
        <div className="rounded-xl border-2 border-[#DAA520]/20 bg-white p-6 space-y-3">
          <div className="flex items-center gap-2 text-[#654321]">
            <PartyPopper className="w-5 h-5 text-[#DAA520]" aria-hidden />
            <span className="font-semibold">Credits distributed</span>
          </div>
          <p className="text-sm text-[#8B5A3C]/90">
            <strong>{success.creditsIssued}</strong> contributor{success.creditsIssued !== 1 ? "s" : ""} received Wishbee Credits to their account.
            {success.failed > 0 && (
              <span className="block mt-1 text-amber-700">
                {success.failed} could not receive credits (no matching account).
              </span>
            )}
          </p>
          <Link
            href="/gifts/active"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#DAA520] hover:text-[#B8860B]"
          >
            Back to Active Gifts
          </Link>
        </div>
      </div>
    )
  }

  if (!giftId) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border-2 border-[#DAA520]/25 bg-gradient-to-br from-[#FFFBEB] via-[#FEF7ED] to-[#FFFBEB] p-[14px] shadow-sm">
          <div className="flex flex-row items-center justify-center gap-2">
            <Wallet className="w-[26px] h-[26px] text-[#DAA520] flex-shrink-0" aria-hidden />
            <h1 className="text-[26px] font-bold text-[#654321] whitespace-nowrap">Store Credit</h1>
          </div>
          <p className="text-xs sm:text-sm text-[#8B5A3C]/90 text-center mt-2">
            Convert your group gift balance into credits for contributors to use on future gifts.
          </p>
        </div>
        <div className="rounded-xl border-2 border-[#DAA520]/20 bg-white p-6">
          <p className="text-sm text-[#654321]">
            Select a gift from <Link href="/gifts/active" className="font-semibold text-[#DAA520] hover:text-[#B8860B]">Active Gifts</Link> and
            click &quot;Settle balance&quot;, then choose &quot;Store Credit&quot; to see the proportional distribution and confirm.
          </p>
        </div>
      </div>
    )
  }

  if (error && !preview) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border-2 border-[#DAA520]/25 bg-gradient-to-br from-[#FFFBEB] via-[#FEF7ED] to-[#FFFBEB] p-[14px] shadow-sm">
          <div className="flex flex-row items-center justify-center gap-2">
            <Wallet className="w-[26px] h-[26px] text-[#DAA520] flex-shrink-0" aria-hidden />
            <h1 className="text-[26px] font-bold text-[#654321] whitespace-nowrap">Store Credit</h1>
          </div>
          <p className="text-xs sm:text-sm text-[#8B5A3C]/90 text-center mt-2">{error}</p>
        </div>
        <div className="rounded-xl border-2 border-[#DAA520]/20 bg-white p-6">
          <Link href="/gifts/active" className="text-sm font-medium text-[#DAA520] hover:text-[#B8860B]">
            Back to Active Gifts
          </Link>
        </div>
      </div>
    )
  }

  const hasRows = preview.rows.length > 0 && preview.netRefundablePool >= 0.01

  return (
    <div className="space-y-6">
      <div className="rounded-xl border-2 border-[#DAA520]/25 bg-gradient-to-br from-[#FFFBEB] via-[#FEF7ED] to-[#FFFBEB] p-[14px] shadow-sm">
        <div className="flex flex-row items-center justify-center gap-2">
          <Wallet className="w-[26px] h-[26px] text-[#DAA520] flex-shrink-0" aria-hidden />
          <h1 className="text-[26px] font-bold text-[#654321] whitespace-nowrap">Store Credit</h1>
        </div>
        <p className="text-xs sm:text-sm text-[#8B5A3C]/90 text-center mt-2">
          Proportional credit distribution — credits go to each contributor&apos;s account.
        </p>
      </div>

      <div className="rounded-xl border-2 border-[#DAA520]/20 bg-white p-6 space-y-3">
        <h2 className="text-sm font-bold text-[#654321]">Proportional credit distribution</h2>
        <p className="text-xs text-[#8B5A3C]/90">
          Share = (Individual contribution ÷ Total gross) × Net refundable pool
        </p>
        <div className="text-sm text-[#8B5A3C]/90 space-y-1">
          <p>Total contributions (gross): {formatMoney(preview.totalGross)}</p>
          <p>Stripe fees (deducted): −{formatMoney(preview.totalFees)}</p>
          <p className="font-semibold text-[#654321] pt-1 border-t border-[#DAA520]/20">
            Net refundable pool: {formatMoney(preview.netRefundablePool)}
          </p>
        </div>
      </div>

      {hasRows && (
        <div className="rounded-xl border-2 border-[#DAA520]/20 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5F1E8] border-b border-[#DAA520]/20">
                  <th className="text-left py-3 px-4 font-semibold text-[#654321]">Contributor</th>
                  <th className="text-right py-3 px-4 font-semibold text-[#654321]">Original amount</th>
                  <th className="text-right py-3 px-4 font-semibold text-[#654321]">Credits to receive</th>
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

      {error && (
        <div className="rounded-xl border-2 border-red-200 bg-red-50/80 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

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
            "Distribute Credits"
          )}
        </button>
      )}

      {preview.rows.length > 0 && preview.netRefundablePool < 0.01 && (
        <p className="text-sm text-[#8B5A3C]/90">Net refundable pool is below $0.01. No credits to distribute.</p>
      )}
    </div>
  )
}
