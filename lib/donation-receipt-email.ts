/**
 * Donation Receipt Email — sent immediately after a charity donation is processed.
 * No charity dedication metadata in subject/body for Support Wishbee path.
 */

import { getServerBaseUrl } from "@/lib/base-url"

const COLORS = {
  gold: "#DAA520",
  honey: "#F4C430",
  brown: "#654321",
  brownMuted: "#8B4513",
  cream: "#F5F1E8",
} as const

export type DonationReceiptEmailData = {
  organizerName: string
  organizerEmail: string
  amount: number
  charityName: string
  /** Charity EIN for IRS tax disclosure. Omit for Support Wishbee. */
  ein?: string | null
  eventName: string
  receiptUrl: string
  /** Charity dedication text (e.g. "On behalf of the X group via Wishbee.ai"). Omit for Support Wishbee. */
  dedication?: string | null
}

function formatMoney(n: number): string {
  return `$${Math.round(n * 100) / 100}`
}

export function getDonationReceiptSubject(charityName: string, eventName: string): string {
  return `🐝 Receipt: Your donation to ${charityName} on behalf of ${eventName}`
}

export function buildDonationReceiptHtml(data: DonationReceiptEmailData): string {
  const amount = formatMoney(data.amount)
  const dedicationLine = data.dedication
    ? `<p style="margin: 0 0 20px; font-size: 13px; color: ${COLORS.brownMuted}; font-style: italic;">${data.dedication}</p>`
    : ""

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Donation receipt</title>
</head>
<body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${COLORS.cream};">
  <div style="max-width: 560px; margin: 0 auto; padding: 24px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(101, 67, 33, 0.12); overflow: hidden;">
      <tr>
        <td style="padding: 28px 24px; background: linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.honey} 100%); text-align: center;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">
            🎁 Donation receipt from ${data.charityName}
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding: 28px 24px;">
          <p style="margin: 0 0 20px; font-size: 15px; color: ${COLORS.brownMuted}; line-height: 1.5;">
            Hi ${data.organizerName},
          </p>
          <p style="margin: 0 0 20px; font-size: 15px; color: ${COLORS.brown}; line-height: 1.6;">
            Your donation of <strong>${amount}</strong> to <strong>${data.charityName}</strong> on behalf of the <strong>${data.eventName}</strong> group gift has been processed.
          </p>
          ${dedicationLine}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="text-align: center; padding: 8px 0 20px;">
                <a href="${data.receiptUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.honey} 100%); color: ${COLORS.brown}; font-weight: 700; font-size: 15px; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 14px rgba(218, 165, 32, 0.35);">
                  View Receipt
                </a>
              </td>
            </tr>
          </table>
          <p style="margin: 0; font-size: 12px; color: ${COLORS.brownMuted}; line-height: 1.5;">
            Thanks for celebrating with Wishbee — your Operating System for Celebrations. 🐝
          </p>
          <!-- Legal Footer: IRS tax disclosure (conspicuous, 10–12pt) -->
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #EDE9E0;">
            <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #6B5B4F;">
              No goods or services were provided in exchange for this contribution.${data.ein ? ` ${data.charityName} is a 501(c)(3) tax-exempt organization (EIN: ${data.ein}).` : ""} Please retain this receipt for your tax records.
            </p>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`.trim()
}

export type SendDonationReceiptOptions = {
  to: { email: string; name?: string }[]
  from?: string
  resend: InstanceType<typeof import("resend").Resend>
}

export async function sendDonationReceiptEmail(
  data: DonationReceiptEmailData,
  options: SendDonationReceiptOptions
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const { to, resend, from = "Wishbee <onboarding@resend.dev>" } = options
  const subject = getDonationReceiptSubject(data.charityName, data.eventName)
  const html = buildDonationReceiptHtml(data)

  const errors: string[] = []
  let sent = 0
  let failed = 0

  for (const recipient of to) {
    if (!recipient.email?.trim()) continue
    const result = await resend.emails.send({
      from: process.env.TRANSPARENCY_EMAIL_FROM?.trim() || from,
      to: recipient.email,
      subject,
      html,
    })
    if (result.error) {
      failed++
      const errMsg =
        typeof result.error === "object" && result.error !== null && "message" in result.error
          ? String((result.error as { message?: string }).message)
          : String(result.error)
      errors.push(`${recipient.email}: ${errMsg}`)
    } else {
      sent++
    }
  }

  return { sent, failed, errors }
}

/** Instant receipt — wrapper for sendDonationReceiptEmail with { email, charityName, amount, transactionId }. */
export type SendInstantReceiptParams = {
  email: string
  name?: string
  charityName: string
  /** Charity EIN for IRS tax disclosure. Omit for Support Wishbee. */
  ein?: string | null
  amount: number
  transactionId: string
  eventName?: string
  receiptUrl?: string
  dedication?: string | null
}

export async function sendInstantReceipt(
  params: SendInstantReceiptParams,
  options: { resend: InstanceType<typeof import("resend").Resend>; from?: string }
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const receiptUrl = params.receiptUrl || `${getServerBaseUrl()}/gifts/receipt/${params.transactionId}`
  return sendDonationReceiptEmail(
    {
      organizerName: params.name || "Organizer",
      organizerEmail: params.email,
      amount: params.amount,
      charityName: params.charityName,
      ein: params.ein,
      eventName: params.eventName || "Group gift",
      receiptUrl,
      dedication: params.dedication,
    },
    {
      to: [{ email: params.email, name: params.name }],
      from: options.from || process.env.TRANSPARENCY_EMAIL_FROM?.trim() || "Wishbee <onboarding@resend.dev>",
      resend: options.resend,
    }
  )
}
