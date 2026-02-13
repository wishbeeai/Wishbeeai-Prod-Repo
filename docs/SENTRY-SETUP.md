# Sentry Error Tracking Setup

## Configuration

1. Add `SENTRY_DSN` to `.env.local` (get it from [sentry.io](https://sentry.io)).
2. Optionally set `SENTRY_ORG` and `SENTRY_PROJECT` for build-time config.

## Alerting Rules

Create an alert in the Sentry dashboard:

1. Go to **Alerts** → **Create Alert**.
2. **Condition**: When an event is seen → `transaction` equals `/api/webhooks/stripe` (or use the `route` tag we set: `route:/api/webhooks/stripe`).
3. **Action**: Send an immediate Slack and/or Email notification to the admin.
4. **Filter**: Optionally filter by environment (e.g. production only).

## Metadata for Debugging

The Stripe webhook attaches the following to Sentry reports:

- **Tags**: `eventId`, `settlementId`, `route`
- **Extra**: `stripeSessionId` (Stripe Checkout Session ID or Payment Intent ID)

Use these to cross-reference failures with the [Stripe Dashboard](https://dashboard.stripe.com).
