import type { Metadata } from "next"
import { RefundDirectContent } from "./refund-direct-content"

export const metadata: Metadata = {
  title: "Card Refund | Wishbee.ai",
  description: "Refund to original payment method. Proportional refund after fees. Process refunds or get Store Credit.",
}

export default function SettleRefundDirectPage() {
  return <RefundDirectContent />
}
