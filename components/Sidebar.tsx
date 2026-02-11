"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Gift, Heart, CreditCard, Wallet, ScrollText, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

/** Wishbee Yellow — active state for settlement navigation */
const WISHBEE_YELLOW_ACTIVE = "bg-[#DAA520] border-[#B8860B] text-white"
const WISHBEE_YELLOW_INACTIVE = "border-[#DAA520]/30 text-[#654321] hover:border-[#DAA520] hover:bg-[#FFFBEB]/80 bg-white"

export const NAV_ITEMS = [
  { id: "balance", label: "Gift Rewards", path: "/settle/balance", icon: Gift, ariaLabel: "Gift Rewards" },
  { id: "charity", label: "Social Impact", path: "/settle/charity", icon: Heart, ariaLabel: "Social Impact" },
  { id: "refund-direct", label: "Card Refund", path: "/settle/refund-direct", icon: CreditCard, ariaLabel: "Card Refund" },
  { id: "refund-credits", label: "Store Credit", path: "/settle/refund-credits", icon: Wallet, ariaLabel: "Store Credit" },
  { id: "support", label: "Support Wishbee", path: "/settle/support-wishbee", icon: Sparkles, ariaLabel: "Support Wishbee" },
  { id: "history", label: "Settlement History", path: "/settle/history", icon: ScrollText, ariaLabel: "Settlement History" },
] as const

export type NavItemId = (typeof NAV_ITEMS)[number]["id"]

type SidebarProps = {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <nav
      className={cn("flex flex-col gap-2 p-4 md:p-6 bg-[#F5F1E8] border-r border-[#DAA520]/20", className)}
      aria-label="Settlement options"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.path
        return (
          <Link
            key={item.id}
            href={item.path}
            className={cn(
              "flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all w-full min-w-0 text-left border-2",
              isActive ? WISHBEE_YELLOW_ACTIVE : WISHBEE_YELLOW_INACTIVE
            )}
            aria-current={isActive ? "page" : undefined}
            aria-label={item.ariaLabel}
          >
            <span className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center" aria-hidden>
              <Icon
                className={cn("w-4 h-4", isActive ? "text-white" : "text-[#8B5A3C]")}
                aria-hidden
              />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-xs font-bold leading-tight">{item.label}</span>
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
