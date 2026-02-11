"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Gift, Heart, CreditCard, Wallet, ScrollText, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const WISHBEE_YELLOW_ACTIVE = "bg-[#DAA520] border-[#B8860B] text-white"
const WISHBEE_YELLOW_INACTIVE = "border-[#DAA520]/30 text-[#654321] hover:border-[#DAA520] hover:bg-[#FFFBEB]/80 bg-white"

const NAV_ITEMS = [
  { id: "balance", label: "Gift Rewards", tagline: "Send as gift card", path: "/settle/balance", icon: Gift, ariaLabel: "Gift Rewards" },
  { id: "charity", label: "Social Impact", tagline: "Donate to charity", path: "/settle/charity", icon: Heart, ariaLabel: "Social Impact" },
  { id: "refund-direct", label: "Card Refund", tagline: "To original payment method", path: "/settle/refund-direct", icon: CreditCard, ariaLabel: "Card Refund" },
  { id: "refund-credits", label: "Store Credit", tagline: "As Wishbee store credits", path: "/settle/refund-credits", icon: Wallet, ariaLabel: "Store Credit" },
  { id: "support", label: "Support Wishbee", tagline: "Tip the platform", path: "/settle/support-wishbee", icon: Sparkles, ariaLabel: "Support Wishbee" },
  { id: "history", label: "Settlement History", tagline: "Past settlements", path: "/settle/history", icon: ScrollText, ariaLabel: "Settlement History" },
] as const

export function SettleNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const giftId = searchParams.get("id")
  const query = giftId ? `?id=${encodeURIComponent(giftId)}` : ""

  return (
    <nav
      className={cn("flex flex-col gap-2 p-4 md:p-6 bg-[#F5F1E8] border-r border-[#DAA520]/20 min-h-[400px]")}
      aria-label="Settlement options"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.path
        const href = `${item.path}${query}`
        return (
          <Link
            key={item.id}
            href={href}
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
              <span className="block text-[14px] font-bold leading-tight">{item.label}</span>
              <span className={cn("block text-[12px] leading-tight mt-0.5", isActive ? "text-white/80" : "text-[#8B5A3C]/70")}>
                {item.tagline}
              </span>
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
