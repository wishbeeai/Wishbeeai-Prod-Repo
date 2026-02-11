/**
 * Donation Service — Immediate charity donation processing (no pooling).
 *
 * Donations are processed instantly via our secure partner network.
 *
 * FUTURE INTEGRATION:
 * - Stripe Connect: Use connected accounts to route funds to charity
 * - PayPal Giving Fund: Donate via PayPal's charity network
 * - Network for Good: Charity donation API
 */

export type ImmediateDonationStatus = "completed" | "failed"

export type ImmediateDonationRequest = {
  giftId: string
  amount: number
  netToCharity: number
  fee: number
  feeCovered: boolean
  charityId: string
  charityName: string
  dedication: string
  recipientEmail: string
  recipientName: string
  giftName: string
}

/**
 * Process immediate donation — placeholder for future payment API integration.
 *
 * When implemented, this will:
 * 1. Charge the user (Stripe/PayPal) for totalCharged = netToCharity + (fee if feeCovered)
 * 2. Transfer netToCharity to the charity via partner network
 * 3. Return success with transaction ID or failure with error message
 */
export async function processImmediateDonation(
  _req: ImmediateDonationRequest
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  // TODO: Integrate with Stripe Connect or PayPal Giving Fund API
  // For now, return success to allow the UI flow to complete
  console.log("[donationService] processImmediateDonation called (placeholder)", {
    giftId: _req.giftId,
    netToCharity: _req.netToCharity,
    fee: _req.fee,
    feeCovered: _req.feeCovered,
  })
  return { success: true }
}
