import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Refund complete | Wishbee.ai",
  description: "Summary of bank refunds and store credits issued.",
}

export default function RefundDirectSummaryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
