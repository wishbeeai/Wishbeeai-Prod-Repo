"use client"

import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Loader2 } from "lucide-react"

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || ""
)

const appearance = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#654321",
    borderRadius: "8px",
  },
}

function AddPaymentMethodFormInner({
  clientSecret,
  onSuccess,
  onCancel,
}: {
  clientSecret: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [confirming, setConfirming] = useState(false)
  const [setAsDefault, setSetAsDefault] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements || !clientSecret) return
    setConfirming(true)
    try {
      const { error } = await stripe.confirmSetup({
        elements,
        clientSecret,
        redirect: "if_required",
        confirmParams:
          typeof window !== "undefined"
            ? { return_url: window.location.href }
            : undefined,
      })
      if (error) throw new Error(error.message)
      onSuccess()
    } catch (err) {
      throw err
    } finally {
      setConfirming(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold uppercase tracking-wide text-[#654321]">
          Add Payment Method
        </h2>
        <button
          type="button"
          onClick={onCancel}
          disabled={confirming}
          className="text-sm text-[#654321]/90 hover:text-[#654321]"
        >
          Cancel
        </button>
      </div>
      <p className="text-sm text-[#654321]">
        Now please enter your payment details. You can use a card, PayPal, Apple
        Pay, Google Pay, or other methods.
      </p>

      <PaymentElement
        options={{
          layout: "accordion" as const,
          defaultCollapsed: false,
        }}
      />

      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={setAsDefault}
          onChange={(e) => setSetAsDefault(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-[#654321] focus:ring-[#654321]"
        />
        <span className="text-sm font-normal text-[#654321]">
          Set as default payment method
        </span>
      </label>

      <button
        type="submit"
        disabled={!stripe || confirming}
        className="w-full rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] px-4 py-3 text-sm font-semibold text-[#78350F] hover:shadow-lg transition-all disabled:opacity-70"
      >
        {confirming ? (
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        ) : (
          "Save Payment Method"
        )}
      </button>

      <div className="border-t border-gray-100 pt-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#654321]">
          We accept
        </p>
        <div className="flex flex-wrap items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://cdn.simpleicons.org/americanexpress"
            alt="American Express"
            width={40}
            height={24}
            className="h-6 w-auto object-contain"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://cdn.simpleicons.org/visa"
            alt="Visa"
            width={40}
            height={24}
            className="h-6 w-auto object-contain"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://cdn.simpleicons.org/mastercard"
            alt="Mastercard"
            width={40}
            height={24}
            className="h-6 w-auto object-contain"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://cdn.simpleicons.org/discover"
            alt="Discover"
            width={40}
            height={24}
            className="h-6 w-auto object-contain"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://cdn.simpleicons.org/paypal"
            alt="PayPal"
            width={40}
            height={24}
            className="h-6 w-auto object-contain"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://cdn.simpleicons.org/applepay"
            alt="Apple Pay"
            width={40}
            height={24}
            className="h-6 w-auto object-contain"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://cdn.simpleicons.org/googlepay"
            alt="Google Pay"
            width={40}
            height={24}
            className="h-6 w-auto object-contain"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://cdn.simpleicons.org/venmo"
            alt="Venmo"
            width={40}
            height={24}
            className="h-6 w-auto object-contain"
          />
        </div>
      </div>
    </form>
  )
}

export function AddPaymentMethodForm({
  clientSecret,
  onSuccess,
  onCancel,
}: {
  clientSecret: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const options = {
    clientSecret,
    appearance,
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <AddPaymentMethodFormInner
        clientSecret={clientSecret}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  )
}
