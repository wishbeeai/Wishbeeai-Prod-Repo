import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

const VALID_PAYMENT_METHODS = [
  "credit-card",
  "paypal",
  "mastercard",
  "amex",
  "discover",
  "venmo",
  "zip",
  "apple-pay",
]
const VALID_CURRENCIES = ["USD", "EUR", "GBP", "CAD"]

const DEFAULT_PAYMENT = {
  defaultPaymentMethod: "credit-card",
  savePaymentInfo: true,
  currency: "USD",
}

async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user.id
}

export async function GET(_request: NextRequest) {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = createAdminClient() ?? await createClient()
    const { data: row, error } = await db
      .from("profiles")
      .select("default_payment_method, save_payment_info, currency")
      .eq("id", userId)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("[settings/payment] GET error:", error.message)
      return NextResponse.json(DEFAULT_PAYMENT, { status: 200 })
    }

    const p = row ?? {}
    const method = p.default_payment_method ?? DEFAULT_PAYMENT.defaultPaymentMethod
    const currency = p.currency ?? DEFAULT_PAYMENT.currency
    return NextResponse.json({
      defaultPaymentMethod: VALID_PAYMENT_METHODS.includes(method) ? method : "credit-card",
      savePaymentInfo: p.save_payment_info ?? DEFAULT_PAYMENT.savePaymentInfo,
      currency: VALID_CURRENCIES.includes(currency) ? currency : "USD",
    })
  } catch (error) {
    console.error("[settings/payment] Error:", error)
    return NextResponse.json({ error: "Failed to fetch payment settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const db = createAdminClient() ?? await createClient()
    const updates: Record<string, unknown> = { id: userId, updated_at: new Date().toISOString() }

    if (body.defaultPaymentMethod !== undefined) {
      const v = body.defaultPaymentMethod
      updates.default_payment_method = VALID_PAYMENT_METHODS.includes(v) ? v : "credit-card"
    }
    if (typeof body.savePaymentInfo === "boolean") {
      updates.save_payment_info = body.savePaymentInfo
    }
    if (body.currency !== undefined) {
      const v = body.currency
      updates.currency = VALID_CURRENCIES.includes(v) ? v : "USD"
    }

    const { error } = await db.from("profiles").upsert(updates, { onConflict: "id" })

    if (error) {
      console.error("[settings/payment] PUT error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Payment settings updated successfully",
      data: {
        defaultPaymentMethod: updates.default_payment_method ?? body.defaultPaymentMethod ?? "credit-card",
        savePaymentInfo: updates.save_payment_info ?? body.savePaymentInfo ?? true,
        currency: updates.currency ?? body.currency ?? "USD",
      },
    })
  } catch (error) {
    console.error("[settings/payment] Error:", error)
    return NextResponse.json({ error: "Failed to update payment settings" }, { status: 500 })
  }
}
