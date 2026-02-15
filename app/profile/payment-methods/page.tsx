"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, CreditCard, Trash2, Loader2 } from "lucide-react"
import {
  SelectPaymentMethod,
  type PaymentMethodOption,
} from "@/components/select-payment-method"
import { AddPaymentMethodForm } from "@/components/add-payment-method-form"
import { AddCardFormStandalone } from "@/components/add-card-form-standalone"
import { AddDigitalWalletForm } from "@/components/add-digital-wallet-form"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type PaymentMethod = {
  id: string
  brand?: string
  last4?: string
  expMonth?: number
  expYear?: number
}

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodOption | null>(null)

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

  // Handle return from PayPal or other redirect-based payment methods
  useEffect(() => {
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null
    const setupIntentClientSecret = params?.get("setup_intent_client_secret")
    if (setupIntentClientSecret) {
      toast.success("Payment method added successfully")
      setClientSecret(null)
      setAdding(false)
      setSelectedMethod(null)
      fetchMethods()
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [])

  const handleSelectMethod = (method: PaymentMethodOption) => {
    setSelectedMethod(method)
    setAdding(true)
    setClientSecret(null)
  }

  const handleAddSuccess = () => {
    toast.success("Payment method added successfully")
    setClientSecret(null)
    setAdding(false)
    setSelectedMethod(null)
    fetchMethods()
  }

  const cancelAdd = () => {
    setClientSecret(null)
    setAdding(false)
    setSelectedMethod(null)
  }

  const removeMethod = async (id: string) => {
    if (!confirm("Remove this payment method?")) return
    const res = await fetch(`/api/payment-methods/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error || "Could not remove")
      return
    }
    toast.success("Payment method removed")
    await fetchMethods()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F1E8] via-[#FEFCF8] to-[#F5F1E8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-[#654321] hover:text-[#654321]/90 mb-8 transition-colors text-[16px] font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Link>

        <header className="mb-10 text-center">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
            <CreditCard className="w-5 h-5 sm:w-8 sm:h-8 text-[#654321]" aria-hidden />
            <h1 className="text-[30px] font-bold text-[#654321]">Payment Methods</h1>
          </div>
          <p className="text-[#654321] mt-2 text-sm sm:text-base max-w-lg mx-auto">
            Add and manage saved payment methods for faster checkout.
          </p>
        </header>

        {/* Add Payment Method & Saved Cards - full-width card like Wallet */}
        <section className="mb-10">
          <div className="rounded-2xl bg-white shadow-xl border-2 border-[#E8E0D5] overflow-hidden">
            <div className="px-6 sm:px-8 py-5 border-b border-[#E8E0D5] bg-[#FAF8F5]">
              <SelectPaymentMethod
                selected={selectedMethod}
                onSelect={handleSelectMethod}
              />
            </div>

            {adding && selectedMethod === "credit_card" && !clientSecret && (
              <div className="px-6 sm:px-8 py-6 border-b border-[#E8E0D5] bg-white">
                <AddCardFormStandalone
                  onSuccess={handleAddSuccess}
                  onCancel={cancelAdd}
                />
              </div>
            )}

            {adding &&
              selectedMethod &&
              ["paypal", "google_pay", "apple_pay", "venmo"].includes(selectedMethod) && (
              <div className="px-6 sm:px-8 py-6 border-b border-[#E8E0D5] bg-white">
                <AddDigitalWalletForm
                  method={selectedMethod}
                  onSuccess={handleAddSuccess}
                  onCancel={cancelAdd}
                />
              </div>
            )}

            <div className="p-6 sm:px-8">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#DAA520] mx-auto" />
            </div>
          ) : adding &&
            ((selectedMethod === "credit_card" && !clientSecret) ||
              (selectedMethod !== null && ["paypal", "google_pay", "apple_pay", "venmo"].includes(selectedMethod)))
            ? null
          : adding && !clientSecret ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#DAA520] mx-auto mb-4" />
              <p className="text-sm text-[#654321]">Setting up secure form…</p>
            </div>
          ) : adding && clientSecret ? (
            <div className="max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <AddPaymentMethodForm
                clientSecret={clientSecret}
                onSuccess={handleAddSuccess}
                onCancel={cancelAdd}
              />
            </div>
          ) : methods.length === 0 && !adding ? (
            <div className="py-12 text-center">
              <CreditCard className="w-12 h-12 text-[#DAA520]/50 mx-auto mb-4" />
              <p className="text-sm font-medium text-[#654321] mb-1">No payment methods yet</p>
              <p className="text-xs text-[#8B4513]/80">
                Click Visa, Mastercard, or another option above to add a payment method.
              </p>
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
                      <span className="font-semibold text-[#654321] capitalize">
                        {pm.brand}
                      </span>
                      <span className="text-[#654321] ml-2">•••• {pm.last4}</span>
                      {pm.expMonth != null && pm.expYear != null && (
                        <p className="text-xs text-[#654321] mt-0.5">
                          Expires {String(pm.expMonth).padStart(2, "0")}/
                          {pm.expYear}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#78350F] font-semibold hover:shadow-lg transition-all hover:from-[#F59E0B] hover:to-[#FBBF24]"
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
      </div>
    </div>
  )
}
