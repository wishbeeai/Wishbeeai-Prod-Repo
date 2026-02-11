import type { Metadata } from "next"

/** Prevent search engines from indexing Impact Card links (eventHash is secure, not for public indexing) */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function ImpactLayout({ children }: { children: React.ReactNode }) {
  return children
}
