/**
 * Transparency Email — sent to contributors after a gift purchase is finalized.
 * Uses Wishbee hex colors and mobile-responsive HTML.
 */

export type TransparencyDisposition = "bonus" | "charity" | "tip"

export type TransparencyEmailEventData = {
  recipientName: string
  totalFundsCollected: number
  finalGiftPrice: number
  remainingBalance: number
  disposition: TransparencyDisposition
  charityName?: string
  viewGiftDetailsUrl: string
}

// Wishbee brand hex colors for email
const COLORS = {
  gold: "#DAA520",
  honey: "#F4C430",
  brown: "#654321",
  brownMuted: "#8B4513",
  cream: "#F5F1E8",
  creamDark: "#EDE9E0",
} as const

function formatMoney(n: number): string {
  return `$${Math.round(n * 100) / 100}`
}

/**
 * Builds the dynamic explanation line based on organizer's choice for the remaining balance.
 */
function getDispositionExplanation(data: TransparencyEmailEventData): string {
  const { disposition, remainingBalance, recipientName, charityName } = data
  const balance = formatMoney(remainingBalance)
  if (disposition === "bonus") {
    return `The leftover ${balance} was sent as an Amazon eGift Card to ${recipientName}.`
  }
  if (disposition === "charity" && charityName) {
    return `The leftover ${balance} is scheduled to be donated to ${charityName} as part of the monthly Wishbee Hive gift.`
  }
  if (disposition === "tip") {
    return `The leftover ${balance} has been added to the Wishbee development fund to help keep our AI free.`
  }
  return `The remaining balance of ${balance} was applied according to the organizer's choice.`
}

/**
 * Generates the HTML body for the transparency email.
 * Mobile-responsive, uses Wishbee hex colors.
 */
export function buildTransparencyEmailHtml(eventData: TransparencyEmailEventData): string {
  const d = eventData
  const explanation = getDispositionExplanation(d)

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gift purchased!</title>
</head>
<body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${COLORS.cream};">
  <div style="max-width: 560px; margin: 0 auto; padding: 24px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(101, 67, 33, 0.12); overflow: hidden;">
      <tr>
        <td style="padding: 28px 24px; background: linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.honey} 100%); text-align: center;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">
            🎉 Success! The gift for ${d.recipientName} has been purchased!
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding: 28px 24px;">
          <p style="margin: 0 0 20px; font-size: 15px; color: ${COLORS.brownMuted}; line-height: 1.5;">
            Here’s a clear breakdown of how the funds were used.
          </p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
            <tr style="border-bottom: 1px solid ${COLORS.creamDark};">
              <td style="padding: 12px 0; color: ${COLORS.brownMuted};">Total Funds Collected</td>
              <td style="padding: 12px 0; text-align: right; font-weight: 600; color: ${COLORS.brown};">
                ${formatMoney(d.totalFundsCollected)}
              </td>
            </tr>
            <tr style="border-bottom: 1px solid ${COLORS.creamDark};">
              <td style="padding: 12px 0; color: ${COLORS.brownMuted};">Final Gift Price</td>
              <td style="padding: 12px 0; text-align: right; font-weight: 600; color: ${COLORS.brown};">
                ${formatMoney(d.finalGiftPrice)}
              </td>
            </tr>
            <tr style="border-bottom: 1px solid ${COLORS.creamDark};">
              <td style="padding: 12px 0; font-weight: 700; color: ${COLORS.brown};">Remaining Balance</td>
              <td style="padding: 12px 0; text-align: right; font-weight: 700; color: ${COLORS.gold}; font-size: 16px;">
                ${formatMoney(d.remainingBalance)}
              </td>
            </tr>
          </table>

          <p style="margin: 0 0 24px; font-size: 15px; color: ${COLORS.brown}; line-height: 1.6;">
            ${explanation}
          </p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="text-align: center; padding: 8px 0 20px;">
                <a href="${d.viewGiftDetailsUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.honey} 100%); color: ${COLORS.brown}; font-weight: 700; font-size: 15px; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 14px rgba(218, 165, 32, 0.35);">
                  View Gift Details
                </a>
              </td>
            </tr>
          </table>

          <p style="margin: 0; font-size: 12px; color: ${COLORS.brownMuted}; line-height: 1.5;">
            <strong>Note:</strong> Amazon eGift Cards allow custom amounts over $1.00. Direct reloads to an existing balance have a $5.00 minimum.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px 24px; background-color: ${COLORS.cream}; border-top: 1px solid ${COLORS.creamDark}; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: ${COLORS.brownMuted};">
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

/**
 * Returns the subject line for the transparency email.
 */
export function getTransparencyEmailSubject(eventData: TransparencyEmailEventData): string {
  return `🎉 Success! The gift for ${eventData.recipientName} has been purchased!`
}

export type SendTransparencyEmailOptions = {
  to: { email: string; name?: string }[]
  from?: string
  resend: InstanceType<typeof import("resend").Resend>
}

/**
 * Sends the transparency email to the given recipients using Resend.
 * Use from an API route or server action after a gift purchase is finalized.
 */
export async function sendTransparencyEmail(
  eventData: TransparencyEmailEventData,
  options: SendTransparencyEmailOptions
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const { to, resend, from = "Wishbee <onboarding@resend.dev>" } = options
  const subject = getTransparencyEmailSubject(eventData)
  const html = buildTransparencyEmailHtml(eventData)

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
      const errMsg = typeof result.error === "object" && result.error !== null && "message" in result.error
        ? String((result.error as { message?: string }).message)
        : String(result.error)
      errors.push(`${recipient.email}: ${errMsg}`)
    } else {
      sent++
    }
  }

  return { sent, failed, errors }
}
