"use client"

import { useSettlement } from "@/lib/settlement-context"

/**
 * Small, subtle notice only visible to admins when Gift Card tab is hidden
 * because Reloadly balance is lower than current surplus.
 */
export function SettlementAdminNotice() {
  const settlement = useSettlement()
  if (!settlement) return null
  const { showGiftCardTab, isAdmin, reloadlyBalance, currentSurplus } = settlement
  if (showGiftCardTab || !isAdmin || reloadlyBalance === null) return null

  const balanceStr = typeof reloadlyBalance === "number" ? reloadlyBalance.toFixed(2) : "0.00"
  const surplusStr = typeof currentSurplus === "number" ? currentSurplus.toFixed(2) : "0.00"

  return (
    <p
      className="text-[11px] text-[#8B5A3C]/70 bg-[#F5F1E8]/80 border border-[#DAA520]/15 rounded-lg py-1.5 px-2.5 mb-3 max-w-md"
      role="status"
    >
      Gift cards hidden: Reloadly balance (${balanceStr}) is lower than surplus (${surplusStr}).
    </p>
  )
}
