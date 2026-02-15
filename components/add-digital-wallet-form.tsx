"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import type { PaymentMethodOption } from "@/components/select-payment-method"

type AddDigitalWalletFormProps = {
  method: Exclude<PaymentMethodOption, "credit_card">
  onSuccess: () => void
  onCancel: () => void
}

export function AddDigitalWalletForm({
  method,
  onSuccess,
  onCancel,
}: AddDigitalWalletFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [paypalEmail, setPaypalEmail] = useState("")
  const [venmoUsername, setVenmoUsername] = useState("")
  const [setAsDefault, setSetAsDefault] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (method === "paypal" && !paypalEmail.trim()) {
      setErrors({ email: "Enter your PayPal email address" })
      return
    }
    if (method === "venmo" && !venmoUsername.trim()) {
      setErrors({ username: "Enter your Venmo username or phone number" })
      return
    }

    setSubmitting(true)
    try {
      // Placeholder: Backend integration via Stripe will be implemented when Stripe access is configured
      await new Promise((r) => setTimeout(r, 1000))
      onSuccess()
    } catch {
      setErrors({ form: "Something went wrong. Please try again." })
    } finally {
      setSubmitting(false)
    }
  }

  const methodLabels: Record<string, string> = {
    paypal: "PayPal",
    google_pay: "Google Pay",
    apple_pay: "Apple Pay",
    venmo: "Venmo",
  }
  const label = methodLabels[method] ?? method

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-center py-1">
        <h2 className="text-base font-bold uppercase tracking-wide text-[#654321]">
          Add {label}
        </h2>
      </div>

      {method === "paypal" && (
        <>
          <p className="text-sm text-[#654321]">
            Enter the email address associated with your PayPal account. You&apos;ll
            be redirected to PayPal to confirm and link your account.
          </p>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#654321]">
              PayPal Email Address
            </label>
            <input
              type="email"
              autoComplete="email"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              placeholder="you@example.com"
              className={`w-full rounded-lg border px-3 py-2.5 text-[#654321] placeholder:text-[#654321]/70 focus:outline-none focus:ring-2 focus:ring-[#654321] ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
          </div>
        </>
      )}

      {method === "google_pay" && (
        <>
          <p className="text-sm text-[#654321]">
            Link your Google Pay account to pay quickly at checkout. You&apos;ll be
            redirected to Google to sign in and authorize.
          </p>
          <p className="text-xs text-[#8B4513]/80">
            Make sure you&apos;re signed into your Google account. Google Pay will
            use your saved payment methods.
          </p>
        </>
      )}

      {method === "apple_pay" && (
        <>
          <p className="text-sm text-[#654321]">
            Add Apple Pay to use your saved cards and wallet for fast checkout.
            You&apos;ll verify with Face ID, Touch ID, or your device passcode.
          </p>
          <p className="text-xs text-[#8B4513]/80">
            Apple Pay works best in Safari on iPhone, iPad, or Mac. Ensure you
            have a card set up in Wallet.
          </p>
        </>
      )}

      {method === "venmo" && (
        <>
          <p className="text-sm text-[#654321]">
            Enter your Venmo username or the phone number or email linked to your
            Venmo account. You&apos;ll be redirected to Venmo to confirm.
          </p>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#654321]">
              Venmo Username, Phone, or Email
            </label>
            <input
              type="text"
              autoComplete="username"
              value={venmoUsername}
              onChange={(e) => setVenmoUsername(e.target.value)}
              placeholder="@username or phone or email"
              className={`w-full rounded-lg border px-3 py-2.5 text-[#654321] placeholder:text-[#654321]/70 focus:outline-none focus:ring-2 focus:ring-[#654321] ${
                errors.username ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.username && (
              <p className="mt-1 text-xs text-red-600">{errors.username}</p>
            )}
          </div>
        </>
      )}

      <label className="flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          checked={setAsDefault}
          onChange={(e) => setSetAsDefault(e.target.checked)}
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
          ) : method === "google_pay" ? (
            "Continue with Google Pay"
          ) : method === "apple_pay" ? (
            "Add Apple Pay"
          ) : (
            `Link ${label} Account`
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
