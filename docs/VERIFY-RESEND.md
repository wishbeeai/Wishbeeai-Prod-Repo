# Verify Resend configuration

Use this to confirm that the recipient (and other) emails can be delivered.

## 1. Environment variables

In `.env.local` you should have:

| Variable | Required | Purpose |
|----------|----------|---------|
| `RESEND_API_KEY` | Yes | API key from [Resend → API Keys](https://resend.com/api-keys). Must start with `re_`. |
| `TRANSPARENCY_EMAIL_FROM` | Recommended | Sender for gift card delivery, impact, and transparency emails. Example: `Wishbee <notifications@wishbee.ai>`. |
| `REMIND_EMAIL_FROM` | Optional | Sender for reminder emails. Can be same as above. |

If `TRANSPARENCY_EMAIL_FROM` is not set, the app falls back to `Wishbee <onboarding@resend.dev>`. With that sender, **Resend only allows sending to the email address of your Resend account** until you verify a domain.

## 2. Resend dashboard checks

1. **API key**  
   [resend.com → API Keys](https://resend.com/api-keys): confirm the key exists and is not revoked.

2. **Domain (for custom “From”)**  
   If you use `notifications@wishbee.ai` (or any `@wishbee.ai`):
   - Go to [resend.com → Domains](https://resend.com/domains).
   - Add and verify the domain (DNS records as shown by Resend).
   - Until the domain is verified, sending from that address can fail or be restricted.

3. **Logs**  
   After sending, check [resend.com → Emails](https://resend.com/emails) for delivery status and any bounce/failure messages.

## 3. Send a test email (development only)

With the dev server running (`npm run dev` or `bun dev`):

```bash
# Replace with your real email (e.g. the Resend account email or your own)
curl "http://localhost:3000/api/verify-resend?to=your@email.com"
```

Or open in the browser:

`http://localhost:3000/api/verify-resend?to=your@email.com`

- **Success:** JSON like `{ "ok": true, "message": "Test email sent to ...", "id": "..." }`. Check inbox (and spam).
- **RESEND_API_KEY missing:** Add it to `.env.local` and restart the dev server.
- **Error about “from” / domain:** Set `TRANSPARENCY_EMAIL_FROM` (and optionally `REMIND_EMAIL_FROM`) to a verified sender in Resend (e.g. `Wishbee <notifications@wishbee.ai>`) and ensure the domain is verified.

This route is only available when `NODE_ENV=development`; it is disabled in production.

## 4. Verify recipient gift-card email

1. Create a gift and set **Recipient Email** (in Purpose tab or on the settle screen).
2. Complete a gift card settlement (e.g. “Confirm Settlement” with a chosen card).
3. Check Resend dashboard **Emails** for the “Your gift card is ready” message and its status.
4. Check the recipient inbox (and spam) for the same email with the claim link.

If the recipient never gets it:

- Confirm `RESEND_API_KEY` is set in the environment that runs the settle API (e.g. production env vars).
- Confirm `TRANSPARENCY_EMAIL_FROM` (or the fallback) is a sender allowed by Resend (e.g. verified domain or onboarding address).
- In Resend → Emails, see whether the send succeeded or bounced/failed and use that to fix config (domain, “from”, or key).
