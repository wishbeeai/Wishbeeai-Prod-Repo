import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getOrCreateStripeCustomer } from "@/lib/stripe-customer"
import Stripe from "stripe"

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

/**
 * Creates a SetupIntent for adding a new payment method. Returns client_secret for Stripe.js.
 */
export async function POST() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const customerId = await getOrCreateStripeCustomer(
      user.id,
      user.email,
      user.user_metadata?.name
    )

    const secretKey = process.env.STRIPE_SECRET_KEY?.trim()
    if (!secretKey) {
      return NextResponse.json({ error: "Payment system not configured" }, { status: 503 })
    }

    const stripe = new Stripe(secretKey, { apiVersion: "2024-11-20.acacia" })
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session",
      metadata: { wishbee_user_id: user.id },
    })

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
    })
  } catch (err) {
    console.error("[payment-methods/setup] error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create setup intent" },
      { status: 500 }
    )
  }
}
