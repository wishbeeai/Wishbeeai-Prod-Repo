"use client"

import { Lock } from "lucide-react"

/**
 * Industry-standard trust bar: Secure checkout + accepted payment methods.
 */
const PAYMENT_OPTIONS: {
  label: string
  sublabel?: string
  logos: { src: string; alt: string }[]
}[] = [
  {
    label: "Credit Card",
    sublabel: "Visa · Mastercard",
    logos: [
      { src: "https://cdn.simpleicons.org/visa/1A1F71", alt: "Visa" },
      { src: "https://cdn.simpleicons.org/mastercard/EB001B", alt: "Mastercard" },
    ],
  },
  { label: "PayPal", logos: [{ src: "https://cdn.simpleicons.org/paypal/00457C", alt: "PayPal" }] },
  { label: "Discover", logos: [{ src: "https://cdn.simpleicons.org/discover", alt: "Discover" }] },
  { label: "Google Pay", logos: [{ src: "https://cdn.simpleicons.org/googlepay/4285F4", alt: "Google Pay" }] },
  { label: "Apple Pay", logos: [{ src: "https://cdn.simpleicons.org/applepay/000000", alt: "Apple Pay" }] },
  { label: "Venmo", logos: [{ src: "https://cdn.simpleicons.org/venmo/008CFF", alt: "Venmo" }] },
] as const

export function PaymentOptionsTrustBar() {
  return (
    <div className="rounded-2xl border-2 border-[#E8E0D5] bg-white px-6 py-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <Lock className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#654321]">Secure checkout</p>
            <p className="text-xs text-[#8B5A3C]/80">256-bit SSL encryption · PCI DSS compliant</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-xs font-medium text-[#8B5A3C]/80">We accept</span>
          {PAYMENT_OPTIONS.map((opt) => (
            <div
              key={opt.label}
              className="flex flex-col items-center gap-1 rounded-lg bg-gray-50 px-4 py-2.5 transition-colors hover:bg-gray-100"
            >
              <div className="flex items-center gap-1.5">
                {opt.logos.map((logo) => (
                  // eslint-disable-next-line @next/next/no-img-element -- external payment logos from CDN
                  <img
                    key={logo.alt}
                    src={logo.src}
                    alt={logo.alt}
                    width={32}
                    height={24}
                    className="h-5 w-auto object-contain sm:h-6"
                  />
                ))}
              </div>
              <p className="text-[10px] font-medium text-gray-600">{opt.label}</p>
              {opt.sublabel && (
                <p className="text-[9px] text-gray-500">{opt.sublabel}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
