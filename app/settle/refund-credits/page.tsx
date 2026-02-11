import type { Metadata } from "next"
import { RefundCreditsContent } from "./refund-credits-content"

export const metadata: Metadata = {
  title: "Store Credit | Wishbee.ai",
  description: "Refund as Wishbee store credits. Proportional credit distribution to each contributor.",
}

export default function SettleRefundCreditsPage() {
  return <RefundCreditsContent />
}
