"use client"

/**
 * Flex container of small, uniform cards displaying payment logos:
 * Credit Card (Visa/Mastercard), PayPal, Google Pay, Apple Pay, Venmo, Cash App
 */
const paymentItems: {
  label: string
  sublabel?: string
  logos: { src: string; alt: string }[]
}[] = [
  {
    label: "Credit Card",
    sublabel: "Visa · Mastercard",
    logos: [
      { src: "https://cdn.simpleicons.org/visa", alt: "Visa" },
      { src: "https://cdn.simpleicons.org/mastercard", alt: "Mastercard" },
    ],
  },
  {
    label: "PayPal",
    logos: [{ src: "https://cdn.simpleicons.org/paypal", alt: "PayPal" }],
  },
  {
    label: "Google Pay",
    logos: [{ src: "https://cdn.simpleicons.org/googlepay", alt: "Google Pay" }],
  },
  {
    label: "Apple Pay",
    logos: [{ src: "https://cdn.simpleicons.org/applepay", alt: "Apple Pay" }],
  },
  {
    label: "Venmo",
    logos: [{ src: "https://cdn.simpleicons.org/venmo", alt: "Venmo" }],
  },
  {
    label: "Cash App",
    logos: [{ src: "https://cdn.simpleicons.org/squarecash", alt: "Cash App" }],
  },
]

export function PaymentLogosFlex() {
  return (
    <div className="flex flex-wrap gap-3 sm:gap-4">
      {paymentItems.map((item) => (
        <div
          key={item.label}
          className="flex shrink-0 flex-col items-center justify-center rounded-xl border border-[#E8E0D5] bg-white px-5 py-4 shadow-sm w-[120px] sm:w-[130px] h-[88px] sm:h-[96px]"
        >
          <div className="flex items-center gap-1.5 mb-1">
            {item.logos.map((logo) => (
              <span key={logo.alt} className="flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo.src}
                  alt={logo.alt}
                  width={40}
                  height={40}
                  className="h-9 w-auto object-contain sm:h-10"
                />
              </span>
            ))}
          </div>
          <p className="text-[10px] sm:text-xs font-medium text-[#654321] text-center leading-tight">
            {item.label}
          </p>
          {item.sublabel && (
            <p className="text-[9px] text-[#8B4513]/70 mt-0.5">{item.sublabel}</p>
          )}
        </div>
      ))}
    </div>
  )
}
