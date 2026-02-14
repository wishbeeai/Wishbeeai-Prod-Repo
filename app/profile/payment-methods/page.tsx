"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, CreditCard, Trash2, Loader2, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { loadStripe } from "@stripe/stripe-js"

type PaymentMethod = {
  id: string
  brand?: string
  last4?: string
  expMonth?: number
  expYear?: number
}

const cardElementStyle = {
  base: {
    fontSize: "16px",
    color: "#654321",
    "::placeholder": { color: "#8B4513" },
  },
  invalid: { color: "#dc2626" },
}

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [nameOnCard, setNameOnCard] = useState("")
  const [billingZip, setBillingZip] = useState("")
  const cardNumberElRef = useRef<HTMLDivElement>(null)
  const cardExpiryElRef = useRef<HTMLDivElement>(null)
  const cardCvcElRef = useRef<HTMLDivElement>(null)
  const elementsRef = useRef<{
    stripe: Awaited<ReturnType<typeof loadStripe>>
    cardNumber: unknown
    cardExpiry: unknown
    cardCvc: unknown
  } | null>(null)

  const fetchMethods = async () => {
    const res = await fetch("/api/payment-methods")
    const data = await res.json()
    if (res.ok && data.paymentMethods) {
      setMethods(data.paymentMethods)
    }
  }

  const fetchSetupIntent = async () => {
    const res = await fetch("/api/payment-methods/setup", { method: "POST" })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Failed to start")
    return data.clientSecret
  }

  useEffect(() => {
    fetchMethods().finally(() => setLoading(false))
  }, [])

  const startAddCard = async () => {
    setAdding(true)
    setClientSecret(null)
    try {
      const secret = await fetchSetupIntent()
      setClientSecret(secret)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add card")
      setAdding(false)
    }
  }

  useEffect(() => {
    if (!clientSecret || !cardNumberElRef.current || !cardExpiryElRef.current || !cardCvcElRef.current) {
      if (elementsRef.current) {
        const { cardNumber, cardExpiry, cardCvc } = elementsRef.current
        ;[cardNumber, cardExpiry, cardCvc].forEach((el) => {
          const e = el as { unmount?: () => void }
          if (e?.unmount) e.unmount()
        })
        elementsRef.current = null
      }
      return
    }

    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()
    if (!pk) {
      toast.error("Payment system not configured")
      setAdding(false)
      setClientSecret(null)
      return
    }

    let cardNumberEl: { unmount?: () => void } | null = null
    let cardExpiryEl: { unmount?: () => void } | null = null
    let cardCvcEl: { unmount?: () => void } | null = null
    ;(async () => {
      const stripe = await loadStripe(pk)
      if (!stripe || !cardNumberElRef.current || !cardExpiryElRef.current || !cardCvcElRef.current) return

      const elements = stripe.elements()
      const cardNumber = elements.create("cardNumber", { style: cardElementStyle })
      const cardExpiry = elements.create("cardExpiry", { style: cardElementStyle })
      const cardCvc = elements.create("cardCvc", { style: cardElementStyle })
      cardNumber.mount(cardNumberElRef.current)
      cardExpiry.mount(cardExpiryElRef.current)
      cardCvc.mount(cardCvcElRef.current)
      cardNumberEl = cardNumber
      cardExpiryEl = cardExpiry
      cardCvcEl = cardCvc
      elementsRef.current = { stripe, cardNumber, cardExpiry, cardCvc }
    })()

    return () => {
      ;[cardNumberEl, cardExpiryEl, cardCvcEl].forEach((el) => {
        if (el?.unmount) el.unmount()
      })
      elementsRef.current = null
    }
  }, [clientSecret])

  const confirmAddCard = async () => {
    const { stripe, cardNumber } = elementsRef.current || {}
    if (!stripe || !cardNumber || !clientSecret) return
    setConfirming(true)
    try {
      const { error } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardNumber,
          billing_details: {
            name: nameOnCard.trim() || undefined,
            address: { postal_code: billingZip.trim() || undefined },
          },
        },
      })
      if (error) throw new Error(error.message)
      toast.success("Card added successfully")
      setClientSecret(null)
      setAdding(false)
      await fetchMethods()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save card")
    } finally {
      setConfirming(false)
    }
  }

  const removeMethod = async (id: string) => {
    if (!confirm("Remove this card?")) return
    const res = await fetch(`/api/payment-methods/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error || "Could not remove card")
      return
    }
    toast.success("Card removed")
    await fetchMethods()
  }

  const cancelAdd = () => {
    setClientSecret(null)
    setAdding(false)
    setNameOnCard("")
    setBillingZip("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F1E8] via-[#FEFCF8] to-[#F5F1E8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#654321] mb-8 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Link>

        <header className="mb-10 text-center">
          <h1 className="text-[30px] font-bold text-[#654321] flex items-center justify-center gap-3">
            <span className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl text-[#654321]">
              <CreditCard className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden />
            </span>
            Payment Methods
          </h1>
          <p className="text-[16px] text-[#8B5A3C]/90 mt-2 max-w-lg mx-auto">
            Add and manage saved payment methods for faster checkout.
          </p>
        </header>

        <section className="mb-10">
          <div className="rounded-2xl bg-white shadow-xl border-2 border-[#E8E0D5] overflow-hidden">
            <div className="px-6 sm:px-8 py-5 border-b border-[#E8E0D5] bg-[#FAF8F5] text-center">
              <h2 className="text-lg sm:text-xl font-bold text-[#654321]">Saved Cards</h2>
              <p className="text-sm text-[#8B4513]/80 mt-1">
                Cards saved here can be used for faster checkout.
              </p>
              {!adding && (
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  <Button
                    onClick={startAddCard}
                    disabled={loading}
                    className="bg-gradient-to-r from-[#DAA520] via-[#F4C430] to-[#DAA520] text-[#3B2F0F] hover:brightness-110 shadow-md font-semibold"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Add Card
                  </Button>
                  <Link
                    href="/settings"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-[#654321] border-2 border-[#DAA520]/50 bg-[#FFFBEB]/50 hover:border-[#DAA520] hover:bg-[#FFFBEB] transition-all"
                  >
                    <Shield className="w-4 h-4 text-[#DAA520]" />
                    Payment Settings
                  </Link>
                </div>
              )}
            </div>

            <div className="p-6 sm:px-8 space-y-4">
              {loading ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#DAA520] mx-auto" />
                </div>
              ) : adding && !clientSecret ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#DAA520] mx-auto mb-4" />
                  <p className="text-sm text-[#8B4513]/80">Setting up secure form…</p>
                </div>
              ) : adding && clientSecret ? (
                <div className="space-y-4 p-6 rounded-xl border-2 border-[#DAA520]/20 bg-[#FFFBEB]/30 max-w-md mx-auto">
                  <h3 className="text-sm font-semibold text-[#654321]">Add a Card</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[#654321] mb-1">Name on Card</label>
                      <input
                        type="text"
                        value={nameOnCard}
                        onChange={(e) => setNameOnCard(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 rounded-lg border-2 border-[#DAA520]/30 bg-white text-[#654321] placeholder:text-[#8B4513]/60 focus:border-[#DAA520]/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#654321] mb-1">Card Number</label>
                      <div ref={cardNumberElRef} className="p-3 rounded-lg border-2 border-[#DAA520]/30 bg-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[#654321] mb-1">Expiration (Month / Year)</label>
                        <div ref={cardExpiryElRef} className="p-3 rounded-lg border-2 border-[#DAA520]/30 bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#654321] mb-1">Security Code</label>
                        <div ref={cardCvcElRef} className="p-3 rounded-lg border-2 border-[#DAA520]/30 bg-white" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#654321] mb-1">Billing ZIP Code</label>
                      <input
                        type="text"
                        value={billingZip}
                        onChange={(e) => setBillingZip(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="12345"
                        maxLength={10}
                        className="w-full px-3 py-2 rounded-lg border-2 border-[#DAA520]/30 bg-white text-[#654321] placeholder:text-[#8B4513]/60 focus:border-[#DAA520]/50 focus:outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-[#8B4513]/90">
                    By continuing, I allow Wishbee to save my payment instrument information for future
                    transactions pursuant to the{" "}
                    <Link href="/terms-of-use" className="text-[#654321] underline hover:text-[#DAA520]">
                      Terms of Use
                    </Link>
                    .
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={confirmAddCard} disabled={confirming} className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] hover:brightness-110 font-semibold">
                      {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Card"}
                    </Button>
                    <Button variant="outline" onClick={cancelAdd} disabled={confirming} className="border-[#DAA520]/40 text-[#654321]">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : methods.length === 0 && !adding ? (
                <div className="px-6 sm:px-8 py-16 sm:py-20 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] flex items-center justify-center mx-auto mb-6 shadow-inner border border-[#DAA520]/20">
                    <CreditCard className="w-10 h-10 text-[#B8860B]" aria-hidden />
                  </div>
                  <h3 className="text-xl font-semibold text-[#654321] mb-2">No saved cards yet</h3>
                  <p className="text-sm text-[#8B4513]/90 max-w-sm mx-auto mb-8 leading-relaxed">
                    Add a card to use for faster checkout when contributing to gifts.
                  </p>
                  <Button onClick={startAddCard} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-[#3B2F0F] bg-gradient-to-r from-[#DAA520] to-[#F4C430] hover:shadow-lg transition-all">
                    <CreditCard className="w-4 h-4" />
                    Add your first card
                  </Button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {methods.map((pm) => (
                    <li
                      key={pm.id}
                      className="flex items-center justify-between p-4 rounded-xl border-2 border-[#DAA520]/20 bg-[#FFFBEB]/20 hover:border-[#DAA520]/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] flex items-center justify-center border border-[#DAA520]/20">
                          <CreditCard className="w-5 h-5 text-[#654321]" />
                        </div>
                        <div>
                          <span className="font-semibold text-[#654321] capitalize">{pm.brand}</span>
                          <span className="text-[#8B4513] ml-2">•••• {pm.last4}</span>
                          {pm.expMonth != null && pm.expYear != null && (
                            <p className="text-xs text-[#8B4513]/80 mt-0.5">
                              Expires {String(pm.expMonth).padStart(2, "0")}/{pm.expYear}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        onClick={() => removeMethod(pm.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-[#8B4513]/70">
          Payment methods are securely stored and processed by Stripe. We never see your full card number.
        </p>
      </div>
    </div>
  )
}
