/**
 * Donation fee utility — Stripe-safe formula (2.9% + $0.30).
 * Used for immediate charity donations.
 */

const STRIPE_PERCENT = 0.029
const STRIPE_FLAT = 0.3

/**
 * Stripe-safe formula: total to charge so charity receives exactly netAmount.
 * (netAmount + 0.30) / (1 - 0.029)
 */
export function calculateTotalWithFees(netAmount: number): number {
  const rounded = Math.round(netAmount * 100) / 100
  const total = (rounded + STRIPE_FLAT) / (1 - STRIPE_PERCENT)
  return Math.round(total * 100) / 100
}

/**
 * Calculates fee when user pays totalCharged (Stripe formula).
 */
export function calculateFeeFromTotal(totalCharged: number): number {
  const fee = totalCharged * STRIPE_PERCENT + STRIPE_FLAT
  return Math.round(fee * 100) / 100
}

/**
 * When feeCovered=false: fee deducted from amount (Stripe takes from donation).
 * Also used for refund fee breakdown: TotalFees = sum(calculateFeeFromAmount(contribution.amount)).
 */
export function calculateFeeFromAmount(amount: number): number {
  const fee = amount * STRIPE_PERCENT + STRIPE_FLAT
  return Math.round(fee * 100) / 100
}

/**
 * Computes net amount to charity and total charged based on fee coverage.
 * @param amount - User's donation amount (remaining balance = what charity should receive if fee covered)
 * @param feeCovered - If true, user pays (amount + 0.30)/(1-0.029); charity receives full amount. If false, fee is deducted from amount.
 */
export function computeDonationAmounts(
  amount: number,
  feeCovered: boolean
): { netToCharity: number; totalCharged: number; fee: number } {
  const rounded = Math.round(amount * 100) / 100
  if (feeCovered) {
    const totalCharged = calculateTotalWithFees(rounded)
    const fee = Math.round((totalCharged - rounded) * 100) / 100
    return {
      netToCharity: rounded,
      totalCharged,
      fee,
    }
  }
  const fee = calculateFeeFromAmount(rounded)
  const netToCharity = Math.round((rounded - fee) * 100) / 100
  return {
    netToCharity: Math.max(0, netToCharity),
    totalCharged: rounded,
    fee,
  }
}
