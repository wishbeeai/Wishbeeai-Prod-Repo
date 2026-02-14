import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getOrCreateStripeCustomer, getStripeCustomerId } from "@/lib/stripe-customer"
import Stripe from "stripe"

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const customerId = await getStripeCustomerId(user.id)
    if (!customerId) {
      return NextResponse.json({ paymentMethods: [] })
    }

    const secretKey = process.env.STRIPE_SECRET_KEY?.trim()
    if (!secretKey) {
      return NextResponse.json({ error: "Payment system not configured" }, { status: 503 })
    }

    const stripe = new Stripe(secretKey, { apiVersion: "2024-11-20.acacia" })
    const methods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    })

    const paymentMethods = methods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
      isDefault: false,
    }))

    return NextResponse.json({ paymentMethods })
  } catch (err) {
    console.error("[payment-methods] GET error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list payment methods" },
      { status: 500 }
    )
  }
}
