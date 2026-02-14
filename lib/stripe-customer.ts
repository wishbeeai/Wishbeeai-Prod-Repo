import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/server"

const STRIPE_API_VERSION = "2024-11-20.acacia" as const

function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim()
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured")
  return new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION })
}

/**
 * Gets or creates a Stripe customer for the user. Stores stripe_customer_id in profiles.
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email?: string | null,
  name?: string | null
): Promise<string> {
  const supabase = createAdminClient()
  if (!supabase) throw new Error("Database not configured")

  const { data: row } = await supabase
    .from("profiles")
    .select("stripe_customer_id, email, name")
    .eq("id", userId)
    .single()

  const existingId = row?.stripe_customer_id?.trim()
  if (existingId) return existingId

  const stripe = getStripe()
  const customer = await stripe.customers.create({
    email: email ?? row?.email ?? undefined,
    name: name ?? row?.name ?? undefined,
    metadata: { wishbee_user_id: userId },
  })

  await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        stripe_customer_id: customer.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )

  return customer.id
}

/**
 * Gets the Stripe customer ID for a user, or null if not created yet.
 */
export async function getStripeCustomerId(userId: string): Promise<string | null> {
  const supabase = createAdminClient()
  if (!supabase) return null

  const { data } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single()

  const id = data?.stripe_customer_id?.trim()
  return id || null
}
