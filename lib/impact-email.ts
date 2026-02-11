/**
 * Impact Email — sent when a pooled donation batch is completed.
 * Notifies organizers that their donation has been officially made.
 */

const COLORS = {
  gold: "#DAA520",
  honey: "#F4C430",
  brown: "#654321",
  brownMuted: "#8B4513",
  cream: "#F5F1E8",
  creamDark: "#EDE9E0",
} as const

export type ImpactEmailData = {
  organizerName: string
  organizerEmail: string
  amount: number
  charityName: string
  eventName: string
  collectiveReceiptUrl: string
}

function formatMoney(n: number): string {
  return `$${Math.round(n * 100) / 100}`
}

/**
 * Subject: 🐝 Impact Update: Your Wishbee donation to [Charity Name] is complete!
 */
export function getImpactEmailSubject(charityName: string): string {
  return `🐝 Impact Update: Your Wishbee donation to ${charityName} is complete!`
}

/**
 * HTML body for the impact email.
 */
export function buildImpactEmailHtml(data: ImpactEmailData): string {
  const amount = formatMoney(data.amount)
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Donation complete</title>
</head>
<body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${COLORS.cream};">
  <div style="max-width: 560px; margin: 0 auto; padding: 24px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(101, 67, 33, 0.12); overflow: hidden;">
      <tr>
        <td style="padding: 28px 24px; background: linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.honey} 100%); text-align: center;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">
            🐝 Impact Update: Your donation is complete!
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding: 28px 24px;">
          <p style="margin: 0 0 20px; font-size: 15px; color: ${COLORS.brownMuted}; line-height: 1.5;">
            Hi ${data.organizerName},
          </p>
          <p style="margin: 0 0 24px; font-size: 15px; color: ${COLORS.brown}; line-height: 1.6;">
            We are excited to share that your leftover balance of <strong>${amount}</strong> has been officially donated to <strong>${data.charityName}</strong> as part of our monthly collective gift on behalf of the <strong>${data.eventName}</strong> group gift.
          </p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="text-align: center; padding: 8px 0 20px;">
                <a href="${data.collectiveReceiptUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.honey} 100%); color: ${COLORS.brown}; font-weight: 700; font-size: 15px; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 14px rgba(218, 165, 32, 0.35);">
                  View Collective Receipt
                </a>
              </td>
            </tr>
          </table>

          <p style="margin: 0; font-size: 12px; color: ${COLORS.brownMuted}; line-height: 1.5;">
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

export type SendImpactEmailOptions = {
  to: { email: string; name?: string }[]
  from?: string
  resend: InstanceType<typeof import("resend").Resend>
}

/**
 * Sends the impact email to organizers after a pooled donation batch is completed.
 */
export async function sendImpactEmail(
  data: ImpactEmailData,
  options: SendImpactEmailOptions
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const { to, resend, from = "Wishbee <onboarding@resend.dev>" } = options
  const subject = getImpactEmailSubject(data.charityName)
  const html = buildImpactEmailHtml(data)

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
