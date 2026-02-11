import type { Metadata } from "next"
import { HistoryContent } from "./history-content"

export const metadata: Metadata = {
  title: "Settlement History | Wishbee.ai",
  description: "View past settlements: gift cards, charity donations, refunds, and tips.",
}

export default function SettleHistoryPage() {
  return <HistoryContent />
}
