"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Gift, FileText, Mail } from "lucide-react"

type Settlement = {
  id: string
  amount: number
  disposition: "charity" | "tip" | "bonus" | "refund" | "credit"
  status: string
  charityName: string | null
  recipientName: string | null
  recipientEmail: string | null
  gcClaimCode: string | null
  claimUrl?: string | null
  orderId?: string | null
  createdAt: string
}

type SettlementHistoryProps = {
  giftId: string | number
  remainingBalance: number
  /** Remaining balance for empty state message */
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatMoney(n: number): string {
  return `$${n.toFixed(2)}`
}

function getTypeIcon(disposition: string) {
  switch (disposition) {
    case "bonus":
      return "🎁"
    case "charity":
      return "🎗️"
    case "tip":
      return "🐝"
    case "refund":
      return "💳"
    case "credit":
      return "🎫"
    default:
      return "📄"
  }
}

function getTypeLabel(disposition: string): string {
  switch (disposition) {
    case "bonus":
      return "GIFT_CARD"
    case "charity":
      return "CHARITY"
    case "tip":
      return "WISHBEE_TIP"
    case "refund":
      return "BANK_REFUND"
    case "credit":
      return "STORE_CREDIT"
    default:
      return disposition.toUpperCase()
  }
}

function getRecipient(settlement: Settlement): string {
  if (settlement.disposition === "charity") return settlement.charityName ?? "Charity"
  if (settlement.disposition === "bonus" || settlement.disposition === "refund" || settlement.disposition === "credit")
    return settlement.recipientName ?? settlement.recipientEmail ?? "Recipient"
  return "Wishbee"
}

export function SettlementHistory({ giftId, remainingBalance }: SettlementHistoryProps) {
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!giftId) return
    const fetchSettlements = async () => {
      try {
        const res = await fetch(`/api/gifts/${giftId}/settlements`)
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          const msg = (data && typeof data.error === "string") ? data.error : "Failed to load settlement history"
          throw new Error(msg)
        }
        setSettlements(data.settlements ?? [])
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load settlement history")
      } finally {
        setLoading(false)
      }
    }
    fetchSettlements()
  }, [giftId])

  if (loading) {
    return (
      <div className="max-w-md mx-auto space-y-3 py-8">
        <div className="animate-pulse flex flex-col gap-3">
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto space-y-3 py-8 text-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  if (settlements.length === 0) {
    return (
      <div className="max-w-md mx-auto space-y-3 py-8 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#DAA520]/20 flex items-center justify-center">
          <Gift className="w-7 h-7 text-[#DAA520]" />
        </div>
        <p className="text-sm font-semibold text-[#654321]">No settlements yet</p>
        <p className="text-xs text-[#8B5A3C]/90">
          Your remaining balance is currently {formatMoney(remainingBalance)}. Select a gift card or charity to get started!
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-full overflow-x-auto">
      <table className="w-full text-left text-sm border-collapse border border-[#E8E0D5] rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-[#F5F1E8] border-b border-[#E8E0D5]">
            <th className="px-3 py-2.5 font-semibold text-[#654321]">Date</th>
            <th className="px-3 py-2.5 font-semibold text-[#654321]">Type</th>
            <th className="px-3 py-2.5 font-semibold text-[#654321]">Recipient</th>
            <th className="px-3 py-2.5 font-semibold text-[#654321]">Amount</th>
            <th className="px-3 py-2.5 font-semibold text-[#654321]">Status</th>
            <th className="px-3 py-2.5 font-semibold text-[#654321]">Action</th>
          </tr>
        </thead>
        <tbody>
          {settlements.map((s) => {
            const succeeded = s.status !== "failed"
            return (
              <tr key={s.id} className="border-b border-[#E8E0D5] last:border-b-0 hover:bg-[#FFFBEB]/50">
                <td className="px-3 py-2.5 text-[#654321]">{formatDate(s.createdAt)}</td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1">
                    <span aria-hidden>{getTypeIcon(s.disposition)}</span>
                    <span className="text-[#654321] font-medium">{getTypeLabel(s.disposition)}</span>
                  </span>
                </td>
                <td className="px-3 py-2.5 text-[#654321]">{getRecipient(s)}</td>
                <td className="px-3 py-2.5 font-semibold text-[#654321] tabular-nums">{formatMoney(s.amount)}</td>
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      succeeded
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {succeeded ? "Succeeded" : "Failed"}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  {s.disposition === "charity" && (
                    <Link
                      href={`/receipt/${s.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#DAA520] hover:text-[#B8860B]"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Tax Receipt
                    </Link>
                  )}
                  {s.disposition === "bonus" && (
                    <span className="inline-flex items-center gap-1 text-xs text-[#8B5A3C]">
                      {s.gcClaimCode ? (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(s.gcClaimCode ?? "")
                            toast.success("Claim code copied!")
                          }}
                          className="font-semibold text-[#DAA520] hover:text-[#B8860B]"
                        >
                          View Claim Code
                        </button>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          Email Sent
                        </span>
                      )}
                    </span>
                  )}
                  {s.disposition === "tip" && (
                    <Link
                      href={`/receipt/${s.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#DAA520] hover:text-[#B8860B]"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Receipt
                    </Link>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
