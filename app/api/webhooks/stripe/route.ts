import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { Sentry } from "@/lib/sentry"
import { createAdminClient } from "@/lib/supabase/server"
import {
  sendOrganizerTaxReceipt,
  sendRecipientImpactCard,
  notifyAllContributors,
} from "@/lib/post-settlement-email-service"
import { getContributorCount } from "@/lib/recipient-notification-service"
import { Resend } from "resend"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Header to bypass Stripe signature verification in development for local testing without Stripe CLI. */
const WEBHOOK_TEST_BYPASS_HEADER = "x-webhook-test-bypass"

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured")
  }
  return new Stripe(secretKey, {
    apiVersion: "2024-11-20.acacia",
  })
}

export async function POST(req: NextRequest) {
  const runHandler = async () => {
    try {
      const body = await req.text()
    const signature = req.headers.get("stripe-signature")
    const bypassHeader = req.headers.get(WEBHOOK_TEST_BYPASS_HEADER)
    const isDevBypass =
      process.env.NODE_ENV === "development" &&
      (bypassHeader === "1" || bypassHeader?.toLowerCase() === "true")

    let eventId: string | undefined
    let settlementId: string | undefined
    let stripePaymentId: string

    if (isDevBypass) {
      try {
        const parsed = JSON.parse(body || "{}") as Record<string, string>
        eventId = parsed.eventId ?? parsed.gift_id ?? parsed.event_id
        settlementId = parsed.settlementId ?? parsed.settlement_id
        stripePaymentId = parsed.stripePaymentId ?? `test_${Date.now()}`
      } catch {
        return NextResponse.json(
          { error: "Dev bypass: invalid JSON body. Expected { eventId, settlementId }" },
          { status: 400 }
        )
      }
    } else {
      if (!signature) {
        return NextResponse.json(
          { error: "Missing stripe-signature header" },
          { status: 400 }
        )
      }

      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
      if (!webhookSecret) {
        console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured")
        return NextResponse.json(
          { error: "Webhook secret not configured" },
          { status: 500 }
        )
      }

      const stripe = getStripe()
      const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

      if (event.type !== "checkout.session.completed") {
        return NextResponse.json({ received: true })
      }

      const session = event.data.object as Stripe.Checkout.Session
      const metadata = (session.metadata ?? {}) as Record<string, string>
      eventId = metadata.eventId ?? metadata.gift_id ?? metadata.event_id
      settlementId = metadata.settlementId ?? metadata.settlement_id
      stripePaymentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.id
    }

    if (!eventId || !settlementId) {
      console.warn("[stripe-webhook] Missing eventId or settlementId:", { eventId, settlementId })
      return NextResponse.json(
        { error: "Missing eventId or settlementId in metadata/body" },
        { status: 400 }
      )
    }

    if (Sentry) {
      Sentry.setTag("eventId", eventId)
      Sentry.setTag("settlementId", settlementId)
      Sentry.setExtra("stripeSessionId", stripePaymentId)
    }
    console.log("[stripe-webhook] Webhook received for Event:", eventId)

    const admin = createAdminClient()
    if (!admin) {
      console.error("[stripe-webhook] Admin client unavailable")
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 500 }
      )
    }

    // 1. Database sync — persist first so we can retry emails later
    const { error: updateErr } = await admin
      .from("gift_settlements")
      .update({
        status: "completed",
        stripe_payment_id: stripePaymentId,
      })
      .eq("id", settlementId)
      .eq("gift_id", eventId)

    if (updateErr) {
      console.error("[stripe-webhook] Failed to update settlement:", updateErr)
      return NextResponse.json(
        { error: "Failed to update settlement" },
        { status: 500 }
      )
    }

    // 2. Multi-email trigger — each in try-catch so one failure doesn't block others
    const resendApiKey = process.env.RESEND_API_KEY?.trim()
    const from = process.env.TRANSPARENCY_EMAIL_FROM?.trim() || "Wishbee <onboarding@resend.dev>"

    if (resendApiKey) {
      const resend = new Resend(resendApiKey)
      const options = { resend, from }

      console.log("[stripe-webhook] Triggering Organizer Receipt...")
      try {
        await sendOrganizerTaxReceipt(settlementId, options)
      } catch (e) {
        console.error("[stripe-webhook] sendOrganizerTaxReceipt failed:", e)
        Sentry?.captureException(e, { tags: { emailType: "organizerReceipt" } })
      }

      console.log("[stripe-webhook] Triggering Recipient Impact Card...")
      try {
        await sendRecipientImpactCard(eventId, options)
      } catch (e) {
        console.error("[stripe-webhook] sendRecipientImpactCard failed:", e)
        Sentry?.captureException(e, { tags: { emailType: "recipientImpactCard" } })
      }

      const contributorCount = await getContributorCount(eventId)
      console.log("[stripe-webhook] Triggering Contributor Gratitude Emails (" + contributorCount + " recipients)...")
      try {
        await notifyAllContributors(eventId, options)
      } catch (e) {
        console.error("[stripe-webhook] notifyAllContributors failed:", e)
        Sentry?.captureException(e, { tags: { emailType: "contributorGratitude" } })
      }
    } else {
      console.warn("[stripe-webhook] RESEND_API_KEY not configured — skipping emails")
    }

    return NextResponse.json({ received: true })
    } catch (err) {
      console.error("[stripe-webhook] Error:", err)
      Sentry?.captureException(err)
      return NextResponse.json(
        { error: "Webhook handler failed" },
        { status: 400 }
      )
    }
  }

  if (Sentry?.withScope) {
    return Sentry.withScope(async (scope) => {
      scope.setTag("route", "/api/webhooks/stripe")
      return runHandler()
    })
  }
  return runHandler()
}
