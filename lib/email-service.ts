/**
 * EmailService — Sends immediate donation receipts after successful transactions.
 * Supports charity donations and Support Wishbee (tip) with distinct templates.
 */

import { getServerBaseUrl } from "@/lib/base-url"

const COLORS = {
  gold: "#DAA520",
  honey: "#F4C430",
  brown: "#654321",
  brownMuted: "#8B4513",
  cream: "#F5F1E8",
} as const

function formatMoney(n: number): string {
  return `$${Math.round(n * 100) / 100}`
}

export type DonationResult = {
  donorName: string
  donorEmail: string
  charityName: string
  netAmount: number
  feeAmount: number
  totalCharged: number
  transactionId: string
  charityEIN?: string | null
  coverFees: boolean
  disposition: "charity" | "tip"
  receiptUrl?: string
  eventName?: string
}

export type SendInstantDonationEmailOptions = {
  resend: InstanceType<typeof import("resend").Resend>
  from?: string
}

/**
 * Sends immediate donation receipt email.
 * If coverFees: shows fee as 'covered surcharge'.
 * If !coverFees: shows netAmount as final gift and explains the deduction.
 * Support Wishbee (disposition='tip'): simplified template, no 501(c)(3) tax language.
 */
export async function sendInstantDonationEmail(
  result: DonationResult,
  options: SendInstantDonationEmailOptions
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const { resend, from = "Wishbee <onboarding@resend.dev>" } = options
  const fromAddr = process.env.TRANSPARENCY_EMAIL_FROM?.trim() || from

  const subject =
    result.disposition === "tip"
      ? "🐝 Thank you for supporting Wishbee!"
      : `🐝 Receipt: Your donation to ${result.charityName}`

  const html =
    result.disposition === "tip"
      ? buildSupportWishbeeHtml(result)
      : buildCharityDonationHtml(result)

  const errors: string[] = []
  let sent = 0
  let failed = 0

  if (!result.donorEmail?.trim()) {
    return { sent: 0, failed: 1, errors: ["No donor email provided"] }
  }

  const emailResult = await resend.emails.send({
    from: fromAddr,
    to: result.donorEmail,
    subject,
    html,
  })

  if (emailResult.error) {
    failed++
    const errMsg =
      typeof emailResult.error === "object" &&
      emailResult.error !== null &&
      "message" in emailResult.error
        ? String((emailResult.error as { message?: string }).message)
        : String(emailResult.error)
    errors.push(`${result.donorEmail}: ${errMsg}`)
  } else {
    sent++
  }

  return { sent, failed, errors }
}

function buildCharityDonationHtml(result: DonationResult): string {
  const net = formatMoney(result.netAmount)
  const fee = formatMoney(result.feeAmount)
  const total = formatMoney(result.totalCharged)

  const feeLine = result.coverFees
    ? `<tr><td style="padding: 4px 0; color: ${COLORS.brownMuted};">Covered surcharge</td><td style="text-align: right; color: ${COLORS.brownMuted};">${fee}</td></tr>`
    : `<tr><td style="padding: 4px 0; color: ${COLORS.brownMuted};">Processing fee (deducted)</td><td style="text-align: right; color: ${COLORS.brownMuted};">-${fee}</td></tr>`

  const giftExplanation = result.coverFees
    ? `Your total charge of <strong>${total}</strong> includes a ${fee} covered surcharge so that <strong>${result.charityName}</strong> receives the full <strong>${net}</strong>.`
    : `After a ${fee} processing fee, <strong>${result.charityName}</strong> received <strong>${net}</strong> as your final gift.`

  const legalFooter = result.charityEIN
    ? `<div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #EDE9E0;"><p style="margin: 0; font-size: 12px; line-height: 1.6; color: #6B5B4F;">No goods or services were provided in exchange for this contribution. ${result.charityName} is a 501(c)(3) tax-exempt organization (EIN: ${result.charityEIN}). Please retain this receipt for your tax records.</p></div>`
    : `<div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #EDE9E0;"><p style="margin: 0; font-size: 12px; line-height: 1.6; color: #6B5B4F;">No goods or services were provided in exchange for this contribution. Please retain this receipt for your records.</p></div>`

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"
  const receiptUrl =
    result.receiptUrl || `${BASE_URL}/gifts/receipt/${result.transactionId}`

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Donation receipt</title>
</head>
<body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${COLORS.cream};">
  <div style="max-width: 560px; margin: 0 auto; padding: 24px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(101, 67, 33, 0.12); overflow: hidden;">
      <tr>
        <td style="padding: 28px 24px; background: linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.honey} 100%); text-align: center;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff;">
            🎁 Donation receipt from ${result.charityName}
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding: 28px 24px;">
          <p style="margin: 0 0 20px; font-size: 15px; color: ${COLORS.brownMuted};">
            Hi ${result.donorName},
          </p>
          <p style="margin: 0 0 20px; font-size: 15px; color: ${COLORS.brown}; line-height: 1.6;">
            Thank you for your donation. ${giftExplanation}
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0; font-size: 14px; color: ${COLORS.brown};">
            <tr><td style="padding: 4px 0;">Amount to charity</td><td style="text-align: right; font-weight: 600;">${net}</td></tr>
            ${feeLine}
            <tr><td style="padding: 4px 0; font-weight: 600;">Total charged</td><td style="text-align: right; font-weight: 600;">${total}</td></tr>
            <tr><td colspan="2" style="padding: 8px 0 0; font-size: 12px; color: ${COLORS.brownMuted};">Transaction ID: ${result.transactionId}</td></tr>
          </table>
          <div style="text-align: center; padding: 16px 0;">
            <a href="${receiptUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.honey} 100%); color: ${COLORS.brown}; font-weight: 700; font-size: 15px; text-decoration: none; border-radius: 12px;">
              View Receipt
            </a>
          </div>
          ${legalFooter}
          <p style="margin: 20px 0 0; font-size: 12px; color: ${COLORS.brownMuted};">
            Thanks for celebrating with Wishbee — your Operating System for Celebrations. 🐝
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`.trim()
}

function buildSupportWishbeeHtml(result: DonationResult): string {
  const amount = formatMoney(result.netAmount)
  const receiptUrl =
    result.receiptUrl || `${getServerBaseUrl()}/gifts/receipt/${result.transactionId}`

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank you for supporting Wishbee</title>
</head>
<body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${COLORS.cream};">
  <div style="max-width: 560px; margin: 0 auto; padding: 24px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(101, 67, 33, 0.12); overflow: hidden;">
      <tr>
        <td style="padding: 28px 24px; background: linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.honey} 100%); text-align: center;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff;">
            🐝 Thank you for supporting Wishbee!
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding: 28px 24px;">
          <p style="margin: 0 0 20px; font-size: 15px; color: ${COLORS.brownMuted};">
            Hi ${result.donorName},
          </p>
          <p style="margin: 0 0 20px; font-size: 15px; color: ${COLORS.brown}; line-height: 1.6;">
            Your tip of <strong>${amount}</strong> has been received. Thank you for helping keep Wishbee free and ad-free!
          </p>
          <p style="margin: 0 0 16px; font-size: 12px; color: ${COLORS.brownMuted};">
            Transaction ID: ${result.transactionId}
          </p>
          <div style="text-align: center; padding: 16px 0;">
            <a href="${receiptUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.honey} 100%); color: ${COLORS.brown}; font-weight: 700; font-size: 15px; text-decoration: none; border-radius: 12px;">
              View Receipt
            </a>
          </div>
          <p style="margin: 20px 0 0; font-size: 12px; color: ${COLORS.brownMuted};">
            Thanks for celebrating with Wishbee — your Operating System for Celebrations. 🐝
          </p>
          <!-- Legal Footer: Support Wishbee non-deductible disclosure -->
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #EDE9E0;">
            <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #6B5B4F;">Thank you for supporting Wishbee! Please note that tips to the platform are used to maintain our AI tools and services and are generally not considered tax-deductible charitable contributions.</p>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`.trim()
}
