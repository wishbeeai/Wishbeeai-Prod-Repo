# Email Flow Testing

Guide for testing the automated post-settlement email flow (Organizer Receipt, Recipient Impact Card, Contributor Gratitude) without sending real emails to your inbox.

## Capturing Outgoing Emails

Use one of these tools to inspect formatting, links, and EIN data:

### Mailtrap
1. Sign up at [mailtrap.io](https://mailtrap.io).
2. Create an Inbox and get SMTP credentials.
3. Configure Resend (or your email provider) to use Mailtrap’s SMTP in development:
   - Use Mailtrap SMTP host/port/user/pass instead of Resend’s API in dev.
   - Or point `TRANSPARENCY_EMAIL_FROM` to a Mailtrap test address.
4. Trigger the webhook (Dev Tools or Stripe CLI) — emails appear in the Mailtrap inbox.

### Inngest
1. Set up [Inngest](https://www.inngest.com) and connect it to your app.
2. Add Inngest event handlers that intercept or log email sends.
3. Use Inngest’s dashboard to inspect events and captured payloads.

### Resend Test Mode
If using Resend, you can add a test recipient in the Resend dashboard and route dev emails there.

## Local Testing Without Stripe CLI

1. Run the app in development (`npm run dev`).
2. Open **Active Gift Collections** (Organizer Dashboard).
3. Find the **Dev Tools** section (only on `localhost`).
4. Enter a **Gift ID** and **Settlement ID** from your database.
5. Click **Simulate Successful Settlement**.
6. The webhook logic runs with signature verification bypassed; check the server console and Mailtrap for emails.

## Webhook Bypass Header

In development, you can POST to `/api/webhooks/stripe` with:
- Header: `x-webhook-test-bypass: 1`
- Body: `{ "eventId": "<gift_id>", "settlementId": "<settlement_id>" }`

This skips Stripe signature verification so you can test locally without the Stripe CLI.
