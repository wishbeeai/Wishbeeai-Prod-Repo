/**
 * Wishbee Credits — balance (profiles.credit_balance), credit_transactions, spend with lock.
 * Also legacy addUserCredit for refund-fallback (user_credit_ledger).
 */

import { createAdminClient } from "@/lib/supabase/server"

export type AddUserCreditResult = { success: boolean; error?: string }
export type SpendCreditsResult = { success: boolean; error?: string; newBalance?: number }

/**
 * Get current Wishbee Credits balance for a user (profiles.credit_balance).
 */
export async function getCreditBalance(userId: string): Promise<number> {
  const admin = createAdminClient()
  if (!admin) return 0
  const { data } = await admin
    .from("profiles")
    .select("credit_balance")
    .eq("id", userId)
    .single()
  const bal = data?.credit_balance != null ? Number(data.credit_balance) : 0
  return Math.max(0, Math.round(bal * 100) / 100)
}

/**
 * Add Wishbee Credits (REFUND or BONUS): update profiles.credit_balance and insert credit_transactions.
 * metadata: optional e.g. { pool_total: 93.80 } for REFUND "source of funds" tooltip.
 */
export async function addCredits(
  userId: string,
  amountDollars: number,
  type: "REFUND" | "BONUS",
  wishbeeId?: string | null,
  metadata?: Record<string, unknown> | null
): Promise<AddUserCreditResult> {
  const admin = createAdminClient()
  if (!admin) {
    return { success: false, error: "Server configuration error." }
  }
  const rounded = Math.round(amountDollars * 100) / 100
  if (rounded < 0.01) {
    return { success: false, error: "Amount must be at least $0.01." }
  }
  const { data: profile } = await admin
    .from("profiles")
    .select("credit_balance")
    .eq("id", userId)
    .single()
  const current = profile?.credit_balance != null ? Number(profile.credit_balance) : 0
  const newBalance = Math.round((current + rounded) * 100) / 100
  const { error: updateErr } = await admin
    .from("profiles")
    .update({ credit_balance: newBalance, updated_at: new Date().toISOString() })
    .eq("id", userId)
  if (updateErr) {
    return { success: false, error: updateErr.message }
  }
  const { error: txErr } = await admin.from("credit_transactions").insert({
    user_id: userId,
    amount: rounded,
    type,
    wishbee_id: wishbeeId ?? null,
    metadata: metadata ?? null,
  })
  if (txErr) {
    return { success: false, error: txErr.message }
  }
  return { success: true }
}

/**
 * Spend Wishbee Credits (checkout). Uses DB function with row-level lock to prevent negative balance.
 */
export async function spendCredits(
  userId: string,
  amountDollars: number,
  wishbeeId?: string | null
): Promise<SpendCreditsResult> {
  const admin = createAdminClient()
  if (!admin) {
    return { success: false, error: "Server configuration error." }
  }
  const rounded = Math.round(amountDollars * 100) / 100
  if (rounded < 0.01) {
    return { success: false, error: "Amount must be at least $0.01." }
  }
  const { data, error } = await admin.rpc("spend_credits", {
    p_user_id: userId,
    p_amount: rounded,
    p_wishbee_id: wishbeeId ?? null,
  })
  if (error) {
    return { success: false, error: error.message }
  }
  const row = Array.isArray(data) ? data[0] : data
  const success = row?.success === true
  const newBalance = row?.new_balance != null ? Number(row.new_balance) : undefined
  return { success, newBalance, error: success ? undefined : "Insufficient credits or failed to spend." }
}

export type CreditTransactionRow = {
  id: string
  amount: number
  type: string
  wishbee_id: string | null
  created_at: string
  metadata: { pool_total?: number } | null
  gift?: { id: string; collection_title: string | null; gift_name: string | null } | null
}

/**
 * Fetch all credit transactions for a user (newest first), with optional gift details for links/labels.
 * Use server-side with admin client; caller must ensure userId is the authenticated user.
 */
export async function getCreditTransactionsForUser(
  userId: string
): Promise<CreditTransactionRow[]> {
  const admin = createAdminClient()
  if (!admin) return []
  const { data: rows, error } = await admin
    .from("credit_transactions")
    .select("id, amount, type, wishbee_id, created_at, metadata")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error || !rows?.length) return []
  const giftIds = [...new Set((rows as CreditTransactionRow[]).map((r) => r.wishbee_id).filter(Boolean))]
  let gifts: Record<string, { id: string; collection_title: string | null; gift_name: string | null }> = {}
  if (giftIds.length > 0) {
    const { data: giftRows } = await admin
      .from("gifts")
      .select("id, collection_title, gift_name")
      .in("id", giftIds)
    if (giftRows) {
      gifts = Object.fromEntries(giftRows.map((g) => [g.id, g]))
    }
  }
  return (rows as CreditTransactionRow[]).map((r) => ({
    ...r,
    amount: Number(r.amount),
    metadata: (r.metadata as CreditTransactionRow["metadata"]) ?? null,
    gift: r.wishbee_id ? gifts[r.wishbee_id] ?? null : null,
  }))
}

/**
 * Add Wishbee Store Credit for a user (e.g. when Stripe refund fails due to expired card).
 * Logs to user_credit_ledger for auditing. Does not update profiles.credit_balance (legacy path).
 */
export async function addUserCredit(
  userId: string,
  amountDollars: number,
  options?: { referenceId?: string; referenceType?: string }
): Promise<AddUserCreditResult> {
  const admin = createAdminClient()
  if (!admin) {
    return { success: false, error: "Server configuration error." }
  }
  const rounded = Math.round(amountDollars * 100) / 100
  if (rounded < 0.01) {
    return { success: false, error: "Amount must be at least $0.01." }
  }
  const { error } = await admin.from("user_credit_ledger").insert({
    user_id: userId,
    amount: rounded,
    type: "refund_fallback",
    reference_id: options?.referenceId ?? null,
    reference_type: options?.referenceType ?? null,
  })
  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}
