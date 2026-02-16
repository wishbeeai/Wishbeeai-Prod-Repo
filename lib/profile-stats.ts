/**
 * Profile gifting stats — real data only from gifts, gift_payment_contributions, credit_transactions.
 */

import { createAdminClient } from "@/lib/supabase/server"

export type GiftingStats = {
  totalGifts: number
  totalContributed: number
  poolsJoined: number
  contributionCount: number
  averageContribution: number | null
  completedGifts: number
  successRate: number | null
}

export async function getGiftingStatsForUser(userId: string): Promise<GiftingStats> {
  const admin = createAdminClient()
  if (!admin) {
    return {
      totalGifts: 0,
      totalContributed: 0,
      poolsJoined: 0,
      contributionCount: 0,
      averageContribution: null,
      completedGifts: 0,
      successRate: null,
    }
  }

  const [giftsRes, paymentsRes, creditsRes] = await Promise.all([
    // Gifts created by user
    admin.from("gifts").select("id, status").eq("user_id", userId),
    // Card/checkout contributions (user_id may be null for guest contributions)
    admin.from("gift_payment_contributions").select("gift_id, amount").eq("user_id", userId).eq("status", "completed"),
    // Credit spend (Wishbee Credits used at checkout)
    admin.from("credit_transactions").select("amount, wishbee_id").eq("user_id", userId).eq("type", "SPEND"),
  ])

  const gifts = giftsRes.data ?? []
  const payments = (paymentsRes.data ?? []) as { gift_id: string; amount: number }[]
  const creditSpends = (creditsRes.data ?? []) as { amount: number; wishbee_id: string | null }[]

  const totalGifts = gifts.length
  const completedGifts = gifts.filter((g) => (g as { status?: string }).status === "completed" || (g as { status?: string }).status === "settled" || (g as { status?: string }).status === "settled_refund" || (g as { status?: string }).status === "settled_credits").length
  const successRate = totalGifts > 0 ? Math.round((completedGifts / totalGifts) * 100) : null

  const totalFromPayments = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const totalFromCredits = creditSpends.reduce((sum, c) => sum + Number(c.amount || 0), 0)
  const totalContributed = Math.round((totalFromPayments + totalFromCredits) * 100) / 100

  const poolIdsFromPayments = new Set(payments.map((p) => p.gift_id))
  const poolIdsFromCredits = new Set(creditSpends.map((c) => c.wishbee_id).filter(Boolean) as string[])
  const poolsJoined = new Set([...poolIdsFromPayments, ...poolIdsFromCredits]).size

  const contributionCount = payments.length + creditSpends.length
  const averageContribution =
    contributionCount > 0 ? Math.round((totalContributed / contributionCount) * 100) / 100 : null

  return {
    totalGifts,
    totalContributed,
    poolsJoined,
    contributionCount,
    averageContribution,
    completedGifts,
    successRate,
  }
}
