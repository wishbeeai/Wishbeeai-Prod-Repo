import type { Metadata } from "next"
import { RewardsContent } from "../rewards/rewards-content"

export const metadata: Metadata = {
  title: "Settle Balance | Wishbee.ai",
  description: "Convert your group gift pool into store gift cards like Target or Amazon.",
}

export default function SettleBalancePage() {
  return <RewardsContent />
}
