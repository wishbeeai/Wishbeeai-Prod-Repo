import type { Metadata } from "next"
import { CharityContent } from "./charity-content"

export const metadata: Metadata = {
  title: "Social Impact – Donate to Charity | Wishbee.ai",
  description: "Donate your group gift balance to 501(c)(3) charities. Make a tax-deductible impact.",
}

export default function SettleCharityPage() {
  return <CharityContent />
}
