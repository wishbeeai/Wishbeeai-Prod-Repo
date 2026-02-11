/**
 * Tremendous API — Gift card / reward creation via POST /orders.
 *
 * Endpoint: POST {baseUrl}/orders (environment-aware).
 * Payload: payment: { funding_source_id } from TREMENDOUS_FUNDING_SOURCE_ID, reward: { delivery: { method: 'LINK' } }.
 * Returns delivery.link from the API response (saved to claimUrl in gift_settlements).
 *
 * Env: TREMENDOUS_API_KEY, TREMENDOUS_CAMPAIGN_ID, TREMENDOUS_FUNDING_SOURCE_ID, TREMENDOUS_URL (optional override).
 */

const TREMENDOUS_SANDBOX_URL = "https://testflight.tremendous.com/api/v2"
const TREMENDOUS_PRODUCTION_URL = "https://api.tremendous.com/api/v2"

/** Base URL for Tremendous API: development → sandbox, production → live. Use TREMENDOUS_URL to override. */
export function getTremendousBaseUrl(): string {
  const override = process.env.TREMENDOUS_URL?.trim()
  if (override) return override.replace(/\/$/, "")
  const isProd = process.env.NODE_ENV === "production"
  return isProd ? TREMENDOUS_PRODUCTION_URL : TREMENDOUS_SANDBOX_URL
}

export type CreateTremendousRewardParams = {
  amount: number
  recipientEmail: string
  recipientName: string
  /** Idempotency: same external_id returns existing order (201) */
  externalId?: string
}

export type CreateTremendousRewardResult =
  | { success: true; claimUrl: string; orderId: string; rewardId?: string }
  | { success: false; error: string; code?: string }

/**
 * Create a reward via Tremendous POST /orders.
 * Uses payment: { funding_source_id: 'BALANCE' } (sandbox) and reward: { delivery: { method: 'LINK' } }.
 * Returns the delivery.link from the API response.
 */
export async function createTremendousReward(
  params: CreateTremendousRewardParams
): Promise<CreateTremendousRewardResult> {
  const apiKey = process.env.TREMENDOUS_API_KEY?.trim()
  const baseUrl = getTremendousBaseUrl()
  const campaignId = process.env.TREMENDOUS_CAMPAIGN_ID?.trim()
  const fundingSourceId = process.env.TREMENDOUS_FUNDING_SOURCE_ID?.trim() || "balance"

  if (!apiKey) {
    return { success: false, error: "TREMENDOUS_API_KEY is not set" }
  }
  if (!campaignId) {
    return { success: false, error: "TREMENDOUS_CAMPAIGN_ID is not set" }
  }

  const amountRounded = Math.round(params.amount * 100) / 100
  if (amountRounded < 1) {
    return { success: false, error: "Amount must be at least $1.00" }
  }

  const body: Record<string, unknown> = {
    payment: { funding_source_id: fundingSourceId },
    reward: {
      campaign_id: campaignId,
      value: { denomination: amountRounded, currency_code: "USD" },
      recipient: {
        email: params.recipientEmail,
        name: params.recipientName,
      },
      delivery: { method: "LINK" },
    },
  }
  if (params.externalId) {
    body.external_id = params.externalId
  }

  const ordersUrl = `${baseUrl}/orders`
  let res: Response
  try {
    res = await fetch(ordersUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error"
    return { success: false, error: `Tremendous request failed: ${message}` }
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401) {
      console.error("[Tremendous] 401 Unauthorized. Check if Tremendous Production Access has been approved yet.")
    }
    const msg = data?.error?.message ?? data?.message ?? JSON.stringify(data)
    return {
      success: false,
      error: typeof msg === "string" ? msg : "Tremendous order failed",
      code: data?.error?.code ?? String(res.status),
    }
  }

  // Response: order with rewards array; LINK delivery includes delivery.link
  const orderId = data?.order?.id ?? data?.id
  const rewards = data?.order?.rewards ?? data?.rewards ?? []
  const firstReward = Array.isArray(rewards) ? rewards[0] : null
  const link = firstReward?.delivery?.link ?? firstReward?.link
  const rewardId = firstReward?.id

  if (!orderId) {
    return { success: false, error: "Tremendous response missing order id" }
  }
  if (!link || typeof link !== "string") {
    if (rewardId && baseUrl) {
      try {
        const linkRes = await fetch(`${baseUrl}/rewards/${rewardId}/generate_link`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({}),
        })
        const linkData = await linkRes.json().catch(() => ({}))
        const generatedLink = linkData?.link ?? linkData?.reward?.delivery?.link
        if (generatedLink) {
          return { success: true, claimUrl: generatedLink, orderId, rewardId }
        }
      } catch {
        // ignore
      }
    }
    return {
      success: false,
      error: "Tremendous response missing delivery link; reward may still be processing",
      code: "MISSING_LINK",
    }
  }

  return { success: true, claimUrl: link, orderId, rewardId }
}
