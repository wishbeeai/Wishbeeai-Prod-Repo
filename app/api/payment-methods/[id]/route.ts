import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getStripeCustomerId } from "@/lib/stripe-customer"
import Stripe from "stripe"

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

/**
 * Detaches a payment method from the customer. Only allows removing methods that belong to the user's Stripe customer.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id: paymentMethodId } = await params
    if (!paymentMethodId) {
      return NextResponse.json({ error: "Payment method ID required" }, { status: 400 })
    }

    const customerId = await getStripeCustomerId(user.id)
    if (!customerId) {
      return NextResponse.json({ error: "No payment methods found" }, { status: 404 })
    }

    const secretKey = process.env.STRIPE_SECRET_KEY?.trim()
    if (!secretKey) {
      return NextResponse.json({ error: "Payment system not configured" }, { status: 503 })
    }

    const stripe = new Stripe(secretKey, { apiVersion: "2024-11-20.acacia" })

    const pm = await stripe.paymentMethods.retrieve(paymentMethodId)
    if (pm.customer !== customerId) {
      return NextResponse.json({ error: "Payment method not found" }, { status: 404 })
    }

    await stripe.paymentMethods.detach(paymentMethodId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[payment-methods] DELETE error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to remove payment method" },
      { status: 500 }
    )
  }
}
