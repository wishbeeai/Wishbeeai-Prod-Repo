import { type NextRequest, NextResponse } from "next/server"

// In-memory storage (in production, use a database)
const paymentSettingsStore = new Map<string, PaymentSettings>()

interface PaymentSettings {
  defaultPaymentMethod: "credit-card" | "paypal" | "apple-pay" | "google-pay" | "venmo" | "cash-app"
  savePaymentInfo: boolean
  currency: "USD" | "EUR" | "GBP" | "CAD"
  lastUpdated?: string
}

const VALID_PAYMENT_METHODS = ["credit-card", "paypal", "apple-pay", "google-pay", "venmo", "cash-app"]
const VALID_CURRENCIES = ["USD", "EUR", "GBP", "CAD"]

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query parameter (in production, get from session/JWT)
    const userId = request.nextUrl.searchParams.get("userId") || "default"

    // Get payment settings from store or return defaults
    const paymentSettings = paymentSettingsStore.get(userId) || {
      defaultPaymentMethod: "credit-card",
      savePaymentInfo: true,
      currency: "USD",
    }

    console.log("[v0] Fetching payment settings for user:", userId, paymentSettings)

    return NextResponse.json(paymentSettings)
  } catch (error) {
    console.error("[v0] Error fetching payment settings:", error)
    return NextResponse.json({ error: "Failed to fetch payment settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.defaultPaymentMethod || typeof body.savePaymentInfo !== "boolean" || !body.currency) {
      return NextResponse.json(
        { error: "Missing required fields: defaultPaymentMethod, savePaymentInfo, currency" },
        { status: 400 },
      )
    }

    // Validate payment method
    if (!VALID_PAYMENT_METHODS.includes(body.defaultPaymentMethod)) {
      return NextResponse.json(
        { error: `Invalid payment method. Must be one of: ${VALID_PAYMENT_METHODS.join(", ")}` },
        { status: 400 },
      )
    }

    // Validate currency
    if (!VALID_CURRENCIES.includes(body.currency)) {
      return NextResponse.json(
        { error: `Invalid currency. Must be one of: ${VALID_CURRENCIES.join(", ")}` },
        { status: 400 },
      )
    }

    // Get user ID (in production, get from session/JWT)
    const userId = "default"

    // Create payment settings object
    const paymentSettings: PaymentSettings = {
      defaultPaymentMethod: body.defaultPaymentMethod,
      savePaymentInfo: body.savePaymentInfo,
      currency: body.currency,
      lastUpdated: new Date().toISOString(),
    }

    // Store in memory (in production, save to database)
    paymentSettingsStore.set(userId, paymentSettings)

    console.log("[v0] Updated payment settings for user:", userId, paymentSettings)

    // Simulate database delay
    await new Promise((resolve) => setTimeout(resolve, 300))

    return NextResponse.json({
      success: true,
      message: "Payment settings updated successfully",
      data: paymentSettings,
    })
  } catch (error) {
    console.error("[v0] Error updating payment settings:", error)
    return NextResponse.json({ error: "Failed to update payment settings" }, { status: 500 })
  }
}
