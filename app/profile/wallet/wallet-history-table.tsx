"use client"

import Link from "next/link"
import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { CreditTransactionRow } from "@/lib/user-credits"

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function giftDisplayName(row: CreditTransactionRow): string {
  if (!row.gift) return "Wishbee"
  const name = row.gift.gift_name || row.gift.collection_title
  return name?.trim() || "Wishbee"
}

function activityLabel(row: CreditTransactionRow): string {
  const name = giftDisplayName(row)
  switch (row.type) {
    case "REFUND":
      return `Refund from ${name}`
    case "SPEND":
      return `Contribution to ${name}`
    case "BONUS":
      return `Bonus from ${name}`
    default:
      return row.type
  }
}

function detailsTooltip(row: CreditTransactionRow): string | null {
  if (row.type !== "REFUND" || !row.gift) return null
  const name = giftDisplayName(row)
  const poolTotal = row.metadata?.pool_total
  if (poolTotal != null && poolTotal >= 0) {
    return `Your share of the leftover balance ($${Number(poolTotal).toFixed(2)}) from ${name}.`
  }
  return `Credits from settling ${name}.`
}

interface WalletHistoryTableProps {
  transactions: CreditTransactionRow[]
}

function TypeBadge({ type }: { type: string }) {
  const styles =
    type === "REFUND" || type === "BONUS"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : "bg-[#FFFBEB] text-[#8B5A3C] border-[#DAA520]/30"
  return (
    <span
      className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${styles}`}
    >
      {type}
    </span>
  )
}

export function WalletHistoryTable({ transactions }: WalletHistoryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#FAF8F5] border-b-2 border-[#E8E0D5]">
            <th className="text-left py-4 px-6 font-semibold text-[#8B5A3C] uppercase tracking-wider text-xs">
              Date
            </th>
            <th className="text-left py-4 px-6 font-semibold text-[#8B5A3C] uppercase tracking-wider text-xs">
              Activity
            </th>
            <th className="text-left py-4 px-6 font-semibold text-[#8B5A3C] uppercase tracking-wider text-xs">
              Wishbee Pool
            </th>
            <th className="text-right py-4 px-6 font-semibold text-[#8B5A3C] uppercase tracking-wider text-xs">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((row) => {
            const isAddition = row.type === "REFUND" || row.type === "BONUS"
            const amountStr = isAddition
              ? `+$${row.amount.toFixed(2)}`
              : `-$${row.amount.toFixed(2)}`
            const tooltipText = detailsTooltip(row)
            return (
              <tr
                key={row.id}
                className="border-b border-[#E8E0D5] last:border-0 hover:bg-[#FFFBEB]/60 transition-colors"
              >
                <td className="py-4 px-6 text-[#8B5A3C]/90 tabular-nums">
                  {formatDate(row.created_at)}
                </td>
                <td className="py-4 px-6">
                  <span className="flex items-center gap-2 flex-wrap">
                    <TypeBadge type={row.type} />
                    <span className="text-[#654321]">{activityLabel(row)}</span>
                    {tooltipText && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#DAA520]/20 text-[#B8860B] cursor-help shrink-0"
                            aria-label="Details"
                          >
                            <Info className="w-3 h-3" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          {tooltipText}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </span>
                </td>
                <td className="py-4 px-6">
                  {row.wishbee_id ? (
                    <Link
                      href={`/gifts/${row.wishbee_id}`}
                      className="font-medium text-[#B8860B] hover:text-[#8B5A3C] underline underline-offset-2"
                    >
                      {giftDisplayName(row)}
                    </Link>
                  ) : (
                    <span className="text-[#8B5A3C]/50">—</span>
                  )}
                </td>
                <td
                  className={`py-4 px-6 text-right font-bold tabular-nums ${
                    isAddition ? "text-emerald-600" : "text-[#654321]"
                  }`}
                >
                  {amountStr}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
