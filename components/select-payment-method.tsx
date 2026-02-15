"use client"

import { cn } from "@/lib/utils"

export type PaymentMethodOption = "credit_card" | "paypal" | "google_pay" | "apple_pay" | "venmo"

// Local payment icons from /images/credit-cards/
const DIGITAL_WALLET_OPTIONS: {
  id: PaymentMethodOption
  label: string
  logo: { src: string; alt: string }
  available: boolean
}[] = [
  {
    id: "paypal",
    label: "PayPal",
    logo: { src: "/images/credit-cards/PayPal.jpg", alt: "PayPal" },
    available: true,
  },
  {
    id: "google_pay",
    label: "Google Pay",
    logo: { src: "/images/credit-cards/GPay.jpg", alt: "Google Pay" },
    available: true,
  },
  {
    id: "apple_pay",
    label: "Apple Pay",
    logo: { src: "/images/credit-cards/Apple_Pay_logo.svg.png", alt: "Apple Pay" },
    available: true,
  },
  {
    id: "venmo",
    label: "Venmo",
    logo: { src: "/images/credit-cards/VenmoLogo1.png", alt: "Venmo" },
    available: true,
  },
]

type SelectPaymentMethodProps = {
  selected?: PaymentMethodOption | null
  onSelect?: (method: PaymentMethodOption) => void
}

export function SelectPaymentMethod({ selected, onSelect }: SelectPaymentMethodProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#654321]">
          Add Payment Method
        </h2>
        <div className="flex flex-wrap items-center justify-end gap-4">
        {/* Credit/Debit Card option */}
        <button
          type="button"
          onClick={() => onSelect?.("credit_card")}
          title="Credit / Debit Card"
          className={cn(
            "flex items-center justify-center p-0.5 mr-3 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#DAA520]/50 focus:ring-offset-1",
            selected === "credit_card" ? "opacity-100" : "opacity-80 hover:opacity-100"
          )}
        >
          <span className="flex h-8 w-11 items-center justify-center gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/credit-cards/VISA.jpg" alt="Visa" width={40} height={32} className="max-h-8 max-w-[3.5rem] object-contain object-center" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/credit-cards/MASTERCARD.jpg" alt="Mastercard" width={40} height={32} className="max-h-8 max-w-[3.5rem] object-contain object-center" />
          </span>
        </button>

        {/* Digital wallet options */}
        {DIGITAL_WALLET_OPTIONS.map((method) => {
          const isSelected = selected === method.id
          const isClickable = method.available || onSelect
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => isClickable && onSelect?.(method.id)}
              disabled={!method.available}
              title={method.label}
              className={cn(
                "flex items-center justify-center p-0.5 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#DAA520]/50 focus:ring-offset-1",
                isSelected ? "opacity-100" : "opacity-80 hover:opacity-100",
                !method.available && "cursor-not-allowed opacity-50"
              )}
            >
              <span className="flex h-8 w-11 items-center justify-center overflow-visible">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={method.logo.src}
                  alt={method.logo.alt}
                  width={44}
                  height={32}
                  className={cn(
                    "object-contain object-center",
                    method.id === "paypal" ? "h-12 w-auto max-w-16" : "max-h-8 max-w-11"
                  )}
                />
              </span>
            </button>
          )
        })}
        </div>
      </div>
    </div>
  )
}
