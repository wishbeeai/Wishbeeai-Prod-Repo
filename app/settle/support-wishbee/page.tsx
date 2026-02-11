import type { Metadata } from "next"
import { SupportWishbeeContent } from "./support-wishbee-content"

export const metadata: Metadata = {
  title: "Support Wishbee | Wishbee.ai",
  description: "Love the experience? Your support helps Wishbee build new features and keep gifting simple for everyone.",
}

export default function SettleSupportWishbeePage() {
  return <SupportWishbeeContent />
}
