"use client"

import { Info, ShieldCheck } from "lucide-react"

export function FooterDisclaimer() {
  return (
    <div className="py-6">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
        <div className="flex items-center gap-2 text-[#A0522D]">
          <Info className="w-4 h-4 text-[#DAA520]" />
          <p className="text-xs">
            Prices, ratings, and availability may change on the retailer&apos;s site.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[#A0522D]">
          <ShieldCheck className="w-4 h-4 text-[#27AE60]" />
          <p className="text-xs font-medium">
            Secure & trusted platform
          </p>
        </div>
      </div>
    </div>
  )
}
