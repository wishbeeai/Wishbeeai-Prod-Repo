"use client"

import { motion } from "framer-motion"
import { Trash2, Pencil, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export type LinkedAccountBrand =
  | "visa"
  | "mastercard"
  | "amex"
  | "discover"
  | "paypal"
  | "google-pay"
  | "apple-pay"
  | "venmo"
  | "cash-app"

export type PaymentMethodCardProps = {
  id: string
  brand: LinkedAccountBrand | string
  obscuredInfo: string
  status?: "active" | "pending"
  onRemove?: (id: string) => void
  onEdit?: (id: string) => void
  index?: number
}

const BRAND_STYLES: Record<string, { bg: string; logoBg?: string; logoColor?: string }> = {
  visa: { bg: "bg-white", logoBg: "bg-[#1A1F71]", logoColor: "text-white" },
  mastercard: { bg: "bg-white", logoBg: "bg-[#EB001B]", logoColor: "text-white" },
  amex: { bg: "bg-white", logoBg: "bg-[#2E77BC]", logoColor: "text-white" },
  discover: { bg: "bg-white", logoBg: "bg-[#FF6000]", logoColor: "text-white" },
  paypal: { bg: "bg-white", logoBg: "bg-[#00457C]", logoColor: "text-white" },
  "google-pay": { bg: "bg-white", logoBg: "bg-[#4285F4]", logoColor: "text-white" },
  "apple-pay": { bg: "bg-black", logoBg: "bg-transparent", logoColor: "text-white" },
  venmo: { bg: "bg-white", logoBg: "bg-[#008CFF]", logoColor: "text-white" },
  "cash-app": { bg: "bg-white", logoBg: "bg-[#00D54B]", logoColor: "text-white" },
}

const BRAND_LOGOS: Record<string, string> = {
  visa: "https://cdn.simpleicons.org/visa",
  mastercard: "https://cdn.simpleicons.org/mastercard",
  amex: "https://cdn.simpleicons.org/americanexpress",
  americanexpress: "https://cdn.simpleicons.org/americanexpress",
  discover: "https://cdn.simpleicons.org/discover",
  paypal: "https://cdn.simpleicons.org/paypal",
  "google-pay": "https://cdn.simpleicons.org/googlepay",
  "googlepay": "https://cdn.simpleicons.org/googlepay",
  "apple-pay": "https://cdn.simpleicons.org/applepay",
  applepay: "https://cdn.simpleicons.org/applepay",
  venmo: "https://cdn.simpleicons.org/venmo",
  "cash-app": "https://cdn.simpleicons.org/squarecash",
  cashapp: "https://cdn.simpleicons.org/squarecash",
}

export function PaymentMethodCard({
  id,
  brand,
  obscuredInfo,
  status = "active",
  onRemove,
  onEdit,
  index = 0,
}: PaymentMethodCardProps) {
  const normalizedBrand = brand.toLowerCase().replace(/\s+/g, "-").replace("americanexpress", "amex")
  const styles = BRAND_STYLES[normalizedBrand] ?? { bg: "bg-white", logoBg: "bg-[#654321]", logoColor: "text-white" }
  const logoUrl = BRAND_LOGOS[normalizedBrand] ?? BRAND_LOGOS.visa
  const isApplePay = normalizedBrand === "apple-pay"

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`relative h-[140px] rounded-xl border shadow-sm overflow-hidden group ${
        isApplePay ? "bg-black border-gray-800" : "bg-white border-gray-200"
      }`}
    >
      <div className="absolute inset-0 p-4 flex flex-col">
        {/* Top row: logo + status */}
        <div className="flex items-start justify-between">
          <div
            className={`flex items-center justify-center w-14 h-14 rounded-lg shrink-0 ${
              isApplePay ? "bg-white/10" : styles.logoBg
            }`}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={brand}
                width={40}
                height={40}
                className={`h-9 w-auto object-contain ${isApplePay ? "brightness-0 invert" : ""}`}
              />
            ) : (
              <span className={`text-xs font-bold ${styles.logoColor}`}>
                {normalizedBrand.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {status === "active" ? (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                <Check className="w-3.5 h-3.5" />
                Verified
              </span>
            )}
          </div>
        </div>

        {/* Bottom left: obscured info */}
        <div className="mt-auto">
          <p className={`text-sm font-medium truncate ${isApplePay ? "text-white/90" : "text-gray-700"}`}>
            {obscuredInfo}
          </p>
        </div>
      </div>

      {/* Hover overlay: Remove / Edit */}
      {(onRemove || onEdit) && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto pointer-events-none transition-opacity duration-200">
          {onEdit && (
            <Button
              variant="secondary"
              size="sm"
              className="h-8 px-2 bg-white/90 hover:bg-white text-gray-800"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(id)
              }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
          {onRemove && (
            <Button
              variant="secondary"
              size="sm"
              className="h-8 px-2 bg-rose-500/90 hover:bg-rose-500 text-white"
              onClick={(e) => {
                e.stopPropagation()
                onRemove(id)
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )}
    </motion.div>
  )
}
