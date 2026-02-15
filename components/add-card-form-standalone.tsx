"use client"

import { useState } from "react"
import { Loader2, CreditCard } from "lucide-react"
import Link from "next/link"

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC",
]

function formatCardNumber(value: string) {
  const v = value.replace(/\s/g, "").replace(/\D/g, "").slice(0, 16)
  return v.replace(/(.{4})/g, "$1 ").trim()
}

function formatExpiry(value: string) {
  const v = value.replace(/\D/g, "").slice(0, 4)
  if (v.length >= 2) return v.slice(0, 2) + "/" + v.slice(2)
  return v
}

type AddCardFormStandaloneProps = {
  onSuccess?: () => void
  onCancel: () => void
}

export function AddCardFormStandalone({
  onSuccess,
  onCancel,
}: AddCardFormStandaloneProps) {
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    cardNumber: "",
    expMonth: "",
    expYear: "",
    cvc: "",
    nameOnCard: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
    setAsDefault: false,
  })

  const validate = () => {
    const err: Record<string, string> = {}
    const rawCard = form.cardNumber.replace(/\s/g, "")
    if (rawCard.length < 15) err.cardNumber = "Enter a valid card number"
    if (!form.expMonth || !form.expYear) err.expiry = "Enter expiration date"
    if (form.cvc.length < 3) err.cvc = "Enter a valid security code"
    if (!form.nameOnCard.trim()) err.nameOnCard = "Enter name on card"
    if (!form.addressLine1.trim()) err.addressLine1 = "Enter billing address"
    if (!form.city.trim()) err.city = "Enter city"
    if (!form.state && form.country === "US") err.state = "Enter state"
    if (!form.postalCode.trim()) err.postalCode = "Enter ZIP / postal code"
    setErrors(err)
    return Object.keys(err).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      // Placeholder: Stripe integration will process this when enabled
      await new Promise((r) => setTimeout(r, 800))
      onSuccess?.()
    } catch {
      setErrors({ form: "Something went wrong. Please try again." })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-center py-1">
        <h2 className="text-base font-bold uppercase tracking-wide text-[#654321]">
          Add credit or debit card
        </h2>
      </div>
      {/* Card details */}
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#654321]">
            Card Number
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              value={form.cardNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, cardNumber: formatCardNumber(e.target.value) }))
              }
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className={`w-full rounded-lg border px-3 py-2.5 pr-10 text-[#654321] placeholder:text-[#654321]/70 focus:outline-none focus:ring-2 focus:ring-[#654321] ${
                errors.cardNumber ? "border-red-500" : "border-gray-300"
              }`}
            />
            <CreditCard
              className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#654321]/70 pointer-events-none"
              aria-hidden
            />
          </div>
          {errors.cardNumber && (
            <p className="mt-1 text-xs text-red-600">{errors.cardNumber}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#654321]">
              Expiry Date
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-exp"
              value={form.expMonth && form.expYear ? `${form.expMonth}/${form.expYear}` : ""}
              onChange={(e) => {
                const v = formatExpiry(e.target.value)
                const [mm, yy] = v.split("/")
                setForm((f) => ({
                  ...f,
                  expMonth: mm || "",
                  expYear: yy || "",
                }))
              }}
              placeholder="MM/YY"
              maxLength={5}
              className={`w-full rounded-lg border px-3 py-2.5 text-[#654321] placeholder:text-[#654321]/70 focus:outline-none focus:ring-2 focus:ring-[#654321] ${
                errors.expiry ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.expiry && (
              <p className="mt-1 text-xs text-red-600">{errors.expiry}</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#654321]">
              Security Code (CVC)
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-csc"
              value={form.cvc}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  cvc: e.target.value.replace(/\D/g, "").slice(0, 4),
                }))
              }
              placeholder="123"
              maxLength={4}
              className={`w-full rounded-lg border px-3 py-2.5 text-[#654321] placeholder:text-[#654321]/70 focus:outline-none focus:ring-2 focus:ring-[#654321] ${
                errors.cvc ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.cvc && (
              <p className="mt-1 text-xs text-red-600">{errors.cvc}</p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#654321]">
            Name on Card
          </label>
          <input
            type="text"
            autoComplete="cc-name"
            value={form.nameOnCard}
            onChange={(e) =>
              setForm((f) => ({ ...f, nameOnCard: e.target.value }))
            }
            placeholder="John Doe"
            className={`w-full rounded-lg border px-3 py-2.5 text-[#654321] placeholder:text-[#654321]/70 focus:outline-none focus:ring-2 focus:ring-[#654321] ${
              errors.nameOnCard ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.nameOnCard && (
            <p className="mt-1 text-xs text-red-600">{errors.nameOnCard}</p>
          )}
        </div>
      </div>

      {/* Billing address */}
      <div className="space-y-4 border-t border-gray-100 pt-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-[#654321] text-center">
          Billing Address
        </h3>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#654321]">
            Address Line 1
          </label>
          <input
            type="text"
            autoComplete="address-line1"
            value={form.addressLine1}
            onChange={(e) =>
              setForm((f) => ({ ...f, addressLine1: e.target.value }))
            }
            placeholder="123 Main St"
            className={`w-full rounded-lg border px-3 py-2.5 text-[#654321] placeholder:text-[#654321]/70 focus:outline-none focus:ring-2 focus:ring-[#654321] ${
              errors.addressLine1 ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.addressLine1 && (
            <p className="mt-1 text-xs text-red-600">{errors.addressLine1}</p>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#654321]">
            Address Line 2 <span className="font-normal text-[#654321]/90">(Optional)</span>
          </label>
          <input
            type="text"
            autoComplete="address-line2"
            value={form.addressLine2}
            onChange={(e) =>
              setForm((f) => ({ ...f, addressLine2: e.target.value }))
            }
            placeholder="Apt, suite, etc."
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-[#654321] placeholder:text-[#654321]/70 focus:outline-none focus:ring-2 focus:ring-[#654321]"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#654321]">
              City
            </label>
            <input
              type="text"
              autoComplete="address-level2"
              value={form.city}
              onChange={(e) =>
                setForm((f) => ({ ...f, city: e.target.value }))
              }
              placeholder="New York"
              className={`w-full rounded-lg border px-3 py-2.5 text-[#654321] placeholder:text-[#654321]/70 focus:outline-none focus:ring-2 focus:ring-[#654321] ${
                errors.city ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.city && (
              <p className="mt-1 text-xs text-red-600">{errors.city}</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#654321]">
              State
            </label>
            <select
              value={form.state}
              onChange={(e) =>
                setForm((f) => ({ ...f, state: e.target.value }))
              }
              className={`w-full rounded-lg border px-3 py-2.5 text-[#654321] focus:outline-none focus:ring-2 focus:ring-[#654321] ${
                errors.state ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {errors.state && (
              <p className="mt-1 text-xs text-red-600">{errors.state}</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#654321]">
              ZIP Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              value={form.postalCode}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  postalCode: e.target.value.replace(/\D/g, "").slice(0, 10),
                }))
              }
              placeholder="10001"
              maxLength={10}
              className={`w-full rounded-lg border px-3 py-2.5 text-[#654321] placeholder:text-[#654321]/70 focus:outline-none focus:ring-2 focus:ring-[#654321] ${
                errors.postalCode ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.postalCode && (
              <p className="mt-1 text-xs text-red-600">{errors.postalCode}</p>
            )}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#654321]">
            Country
          </label>
          <select
            value={form.country}
            onChange={(e) =>
              setForm((f) => ({ ...f, country: e.target.value }))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-[#654321] focus:outline-none focus:ring-2 focus:ring-[#654321]"
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
          </select>
        </div>
      </div>

      {/* Options & consent */}
      <label className="flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          checked={form.setAsDefault}
          onChange={(e) =>
            setForm((f) => ({ ...f, setAsDefault: e.target.checked }))
          }
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#654321] focus:ring-[#654321]"
        />
        <span className="text-sm text-[#654321]">
          Set as default payment method
        </span>
      </label>

      {errors.form && (
        <p className="text-xs text-red-600">{errors.form}</p>
      )}

      <div className="pt-6 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="w-[341px] h-[46px] flex items-center justify-center text-base font-semibold text-[#654321] border-2 border-[#DAA520] rounded-lg hover:bg-[#F5F1E8] transition-all disabled:opacity-70"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="w-[341px] h-[46px] flex items-center justify-center rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-base font-semibold text-[#78350F] hover:shadow-lg transition-all disabled:opacity-70"
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "Save Card"
          )}
        </button>
      </div>

      <div className="mt-8 pt-6 rounded-xl border border-[#E8E0D5] bg-[#FAF8F5] px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#DAA520]/10">
            <svg className="h-5 w-5 text-[#DAA520]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-xs text-[#654321] leading-relaxed">
              Secured by Stripe. We never store your full card number. 256-bit SSL &amp; PCI DSS compliant. By adding a payment method you agree to our{" "}
              <Link href="/terms-of-use" className="font-semibold text-[#654321] underline decoration-[#DAA520]/50 underline-offset-2 hover:text-[#DAA520] hover:decoration-[#DAA520] transition-colors">
                Terms of Use
              </Link>{" "}
              and authorize future gift charges.
            </p>
          </div>
        </div>
      </div>
    </form>
  )
}
