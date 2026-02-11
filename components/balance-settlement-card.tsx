"use client"

import { useState } from "react"
import { Gift, Heart, ChevronDown, ExternalLink } from "lucide-react"

const HONEY_GOLD = "#EAB308"

const CHARITIES = [
  { id: "feeding-america", name: "Feeding America", description: "Help provide meals to families in need" },
  { id: "unicef", name: "UNICEF", description: "Support children's health & education" },
  { id: "red-cross", name: "American Red Cross", description: "Disaster relief & emergency response" },
] as const

type BalanceSettlementCardProps = {
  giftTotal: number
  totalRaised: number
  recipientName: string
  onBonusGiftCard?: (amount: number) => void
  onDonateToCharity?: (amount: number, charityId: string, charityName: string) => void
  onSupportWishbee?: (amount: number) => void
  onMicroBalanceThanks?: () => void
}

export function BalanceSettlementCard({
  giftTotal,
  totalRaised,
  recipientName,
  onBonusGiftCard,
  onDonateToCharity,
  onSupportWishbee,
  onMicroBalanceThanks,
}: BalanceSettlementCardProps) {
  const remainingBalance = Math.max(0, Math.round((totalRaised - giftTotal) * 100) / 100)
  const isTier1 = remainingBalance >= 1.0

  const [donateMenuOpen, setDonateMenuOpen] = useState(false)
  const [selectedCharity, setSelectedCharity] = useState<string | null>(null)

  const handleDonate = (charityId: string, charityName: string) => {
    onDonateToCharity?.(remainingBalance, charityId, charityName)
    setSelectedCharity(null)
    setDonateMenuOpen(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-[#EAB308]/20 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#EAB308]/20">
        <h3 className="text-base font-bold text-[#654321]">Balance Settlement</h3>
        <p className="text-sm text-[#8B4513]/80 mt-0.5">
          Celebrate! Here’s what happened with the funds.
        </p>
      </div>

      <div className="p-5 space-y-4">
        {/* Financial summary */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center text-[#8B4513]">
            <span>Gift total (with tax/shipping)</span>
            <span className="font-medium text-[#654321]">${giftTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-[#8B4513]">
            <span>Total raised</span>
            <span className="font-medium text-[#654321]">${totalRaised.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-[#EAB308]/30">
            <span className="font-semibold text-[#654321]">Remaining balance</span>
            <span className="font-bold text-base text-[#F5DEB3]">
              ${remainingBalance.toFixed(2)}
            </span>
          </div>
        </div>

        {isTier1 ? (
          /* Tier 1: Balance >= $1.00 */
          <div className="space-y-3 pt-1">
            <p className="text-sm text-[#8B4513]">
              You can use this balance to add a little extra for {recipientName}, give to a cause, or support Wishbee.
            </p>

            {/* Send as Bonus Gift Card (Amazon eGift Card) */}
            <button
              type="button"
              onClick={() => onBonusGiftCard?.(remainingBalance)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-white transition-all hover:opacity-95 hover:shadow-md"
              style={{ backgroundColor: "#FF9900" }}
            >
              <Gift className="w-5 h-5" />
              Send as Bonus Gift Card
              <ExternalLink className="w-4 h-4 opacity-80" />
            </button>

            {/* Donate to Charity (sub-menu) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDonateMenuOpen((o) => !o)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold border-2 transition-all hover:bg-[#FEF3C7]/50"
                style={{ borderColor: HONEY_GOLD, color: "#654321" }}
              >
                <Heart className="w-5 h-5" style={{ color: HONEY_GOLD }} />
                Donate to Charity
                <ChevronDown className={`w-4 h-4 transition-transform ${donateMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {donateMenuOpen && (
                <div className="mt-2 p-3 rounded-xl border border-[#EAB308]/30 bg-amber-50/80 space-y-2">
                  {CHARITIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleDonate(c.id, c.name)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/80 transition-colors"
                    >
                      <span className="font-medium text-[#654321] block">{c.name}</span>
                      <span className="text-xs text-[#8B4513]/80">{c.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Support Wishbee (Tip) */}
            <button
              type="button"
              onClick={() => onSupportWishbee?.(remainingBalance)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold border-2 transition-all hover:bg-[#FEF9E7]"
              style={{ borderColor: HONEY_GOLD, color: "#654321" }}
            >
              <span className="text-lg" aria-hidden>🐝</span>
              Support Wishbee
            </button>
            <p className="text-xs text-[#8B4513]/70 text-center">
              Did we do a good job? Tip Wishbee to help us keep our AI tools free and the platform ad-free for everyone.
            </p>
          </div>
        ) : (
          /* Tier 2: Micro-balance < $1.00 */
          <div className="space-y-4 pt-1">
            <div className="p-4 rounded-xl border border-[#EAB308]/30 bg-[#FEFCE8]/80">
              <p className="text-sm text-[#654321] leading-relaxed">
                Did we do a good job? Tip Wishbee to help us keep our AI tools free and the platform ad-free for everyone. Since the balance is under $1, it has been added as a platform tip.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onMicroBalanceThanks?.()}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-all hover:opacity-95 hover:shadow-md"
              style={{ backgroundColor: HONEY_GOLD }}
            >
              Awesome, Thanks!
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
