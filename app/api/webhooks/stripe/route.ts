import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient, recordPaymentTransaction, updateContributionStatus } from '@/lib/supabase/admin'

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

/**
 * Stripe Webhook Handler
 * 
 * This endpoint securely processes Stripe webhook events, particularly:
 * - payment_intent.succeeded: Records successful payments and updates contribution status
 * - payment_intent.payment_failed: Marks contributions as failed
 * - payment_intent.canceled: Marks contributions as canceled
 * 
 * Security:
 * - Verifies webhook signature using Stripe's webhook secret
 * - Uses admin client to bypass RLS for secure database updates
 * - Never exposes service role key to client
 */
export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('[Stripe Webhook] Missing signature header')
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature to ensure request is from Stripe
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const error = err as Error
    console.error('[Stripe Webhook] Signature verification failed:', error.message)
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${error.message}` },
      { status: 400 }
    )
  }

  // Initialize admin client for secure database operations
  const adminClient = createAdminClient()

  try {
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        console.log('[Stripe Webhook] Payment succeeded:', paymentIntent.id)

        // Extract metadata passed from frontend
        const metadata = paymentIntent.metadata
        const userId = metadata.user_id
        const contributionId = metadata.contribution_id
        const wishlistId = metadata.wishlist_id

        if (!userId) {
          console.error('[Stripe Webhook] Missing user_id in payment metadata')
          break
        }

        // Record payment transaction
        await recordPaymentTransaction(adminClient, {
          user_id: userId,
          contribution_id: contributionId || undefined,
          amount: paymentIntent.amount / 100, // Convert cents to dollars
          currency: paymentIntent.currency.toUpperCase(),
          stripe_payment_intent_id: paymentIntent.id,
          status: 'succeeded',
          metadata: {
            wishlist_id: wishlistId,
            payment_method: paymentIntent.payment_method_types[0],
            receipt_email: paymentIntent.receipt_email,
          },
        })

        // Update contribution status if contribution_id exists
        if (contributionId) {
          await updateContributionStatus(
            adminClient,
            contributionId,
            'completed',
            paymentIntent.id
          )

          console.log('[Stripe Webhook] Contribution updated:', contributionId)
        }

        // TODO: Update wishlist current_amount via database trigger
        // (Trigger should automatically update based on contribution status)

        // TODO: Send notification to gift recipient
        // await sendContributionNotification(userId, contributionId, amount)

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        console.log('[Stripe Webhook] Payment failed:', paymentIntent.id)

        const metadata = paymentIntent.metadata
        const contributionId = metadata.contribution_id

        if (contributionId) {
          await updateContributionStatus(
            adminClient,
            contributionId,
            'failed'
          )

          // Record failed transaction
          if (metadata.user_id) {
            await recordPaymentTransaction(adminClient, {
              user_id: metadata.user_id,
              contribution_id: contributionId,
              amount: paymentIntent.amount / 100,
              currency: paymentIntent.currency.toUpperCase(),
              stripe_payment_intent_id: paymentIntent.id,
              status: 'failed',
              metadata: {
                failure_reason: paymentIntent.last_payment_error?.message,
                failure_code: paymentIntent.last_payment_error?.code,
              },
            })
          }
        }

        break
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        console.log('[Stripe Webhook] Payment canceled:', paymentIntent.id)

        const metadata = paymentIntent.metadata
        const contributionId = metadata.contribution_id

        if (contributionId) {
          await updateContributionStatus(
            adminClient,
            contributionId,
            'failed' // or create a 'canceled' status if your schema supports it
          )
        }

        break
      }

      default:
        console.log('[Stripe Webhook] Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Stripe Webhook] Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    )
  }
}

// Disable body parsing, we need the raw body for signature verification
export const runtime = 'nodejs'

