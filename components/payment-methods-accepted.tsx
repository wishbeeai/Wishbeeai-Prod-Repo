"use client"

/**
 * Row of payment method logos - Visa, PayPal, Mastercard, Amex, Discover, Venmo, Zip, Apple Pay (USA)
 */
const PAYMENT_LOGO_SIZE = 52

const paymentMethodsWithLogos = [
  { name: "Visa", src: "https://cdn.simpleicons.org/visa", alt: "Visa" },
  { name: "PayPal", src: "https://cdn.simpleicons.org/paypal", alt: "PayPal" },
  { name: "Mastercard", src: "https://cdn.simpleicons.org/mastercard", alt: "Mastercard" },
  { name: "American Express", src: "https://cdn.simpleicons.org/americanexpress", alt: "American Express" },
  { name: "Discover", src: "https://cdn.simpleicons.org/discover", alt: "Discover" },
  { name: "Venmo", src: "https://cdn.simpleicons.org/venmo", alt: "Venmo" },
  { name: "Apple Pay", src: "https://cdn.simpleicons.org/applepay", alt: "Apple Pay" },
] as const

export function PaymentMethodsAccepted() {
  return (
    <div className="rounded-xl bg-[#F5F1E8] border border-[#E8E0D5] px-4 sm:px-6 py-4">
      <p className="text-xs font-medium text-[#8B4513]/80 mb-3">We accept</p>
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        {paymentMethodsWithLogos.map((pm) => (
          <div
            key={pm.name}
            className="flex items-center justify-center h-10 sm:h-12 shrink-0"
            title={pm.alt}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pm.src}
              alt={pm.alt}
              width={PAYMENT_LOGO_SIZE}
              height={PAYMENT_LOGO_SIZE}
              className="h-8 w-auto sm:h-10 object-contain opacity-90 hover:opacity-100 transition-opacity"
            />
          </div>
        ))}
        {/* Zip - styled badge (Simple Icons may not have it) */}
        <div
          className="flex items-center justify-center h-8 px-2 rounded bg-[#7B2D8E] text-white text-xs font-bold shrink-0"
          title="Zip"
        >
          zip
        </div>
      </div>
    </div>
  )
}
