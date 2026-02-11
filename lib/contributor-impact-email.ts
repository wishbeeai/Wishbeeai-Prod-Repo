/**
 * Contributor Impact Email — sent to each contributor when the gift is complete.
 * Subject: 🐝 The gift is complete! See the impact you made.
 */

const COLORS = {
  gold: "#DAA520",
  honey: "#F4C430",
  brown: "#654321",
  brownMuted: "#8B4513",
  cream: "#F5F1E8",
} as const

export type ContributorImpactEmailData = {
  contributorName: string
  eventName: string
  recipientName: string
  amazonAmount: number
  donationAmount: number
  charityName: string
  impactCardUrl: string
}

function formatMoney(n: number): string {
  return `$${Math.round(n * 100) / 100}`
}

export function getContributorImpactSubject(): string {
  return "🐝 The gift is complete! See the impact you made."
}

/**
 * HTML body for the contributor impact email.
 */
export function buildContributorImpactEmailHtml(data: ContributorImpactEmailData): string {
  const amazonAmount = formatMoney(data.amazonAmount)
  const donationAmount = formatMoney(data.donationAmount)

  const bonusSection =
    data.donationAmount > 0
      ? `
          <p style="margin: 0 0 20px; font-size: 15px; color: ${COLORS.brown}; line-height: 1.6;">
            <strong>The Bonus:</strong> Because of the extra funds, a donation of <strong>${donationAmount}</strong> was made to <strong>${data.charityName}</strong> in ${data.recipientName}'s honor!
          </p>
        `
      : ""

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The gift is complete!</title>
</head>
<body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${COLORS.cream};">
  <div style="max-width: 560px; margin: 0 auto; padding: 24px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(101, 67, 33, 0.12); overflow: hidden;">
      <tr>
        <td style="padding: 28px 24px; background: linear-gradient(135deg, ${COLORS.gold} 0% ${COLORS.honey} 100%); text-align: center;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">
            🐝 The gift is complete! See the impact you made.
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding: 28px 24px;">
          <p style="margin: 0 0 20px; font-size: 15px; color: ${COLORS.brownMuted}; line-height: 1.5;">
            Hi ${data.contributorName},
          </p>
          <p style="margin: 0 0 20px; font-size: 15px; color: ${COLORS.brown}; line-height: 1.6;">
            Great news! The <strong>${data.eventName}</strong> group gift has been officially delivered to <strong>${data.recipientName}</strong>.
          </p>
          <p style="margin: 0 0 24px; font-size: 15px; color: ${COLORS.brown}; line-height: 1.6;">
            Thanks to your contribution and the collective power of the group, we didn't just meet the goal—we exceeded it.
          </p>

          <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: ${COLORS.brown};">
            Here is the final breakdown of your group's impact:
          </p>
          <p style="margin: 0 0 12px; font-size: 15px; color: ${COLORS.brown}; line-height: 1.6;">
            <strong>The Gift:</strong> A ${amazonAmount} Amazon Gift Card was sent to ${data.recipientName}.
          </p>
          ${bonusSection}

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="text-align: center; padding: 16px 0 20px;">
                <a href="${data.impactCardUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.honey} 100%); color: ${COLORS.brown}; font-weight: 700; font-size: 15px; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 14px rgba(218, 165, 32, 0.35);">
                  View the Impact Card
                </a>
              </td>
            </tr>
          </table>

          <p style="margin: 0 0 20px; font-size: 15px; color: ${COLORS.brown}; line-height: 1.6;">
            Your generosity made this possible. Whether you gave $5 or $50, you helped create a bigger moment than any of us could have done alone.
          </p>
          <p style="margin: 0; font-size: 12px; color: ${COLORS.brownMuted}; line-height: 1.5;">
            Thanks for being part of Wishbee!
          </p>
          <p style="margin: 16px 0 0; font-size: 12px; color: ${COLORS.brownMuted};">
            Best,<br>The Wishbee Team 🐝
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`.trim()
}
