/**
 * AmazonGiftCardService — Digital gift card issuance via Amazon Incentives API (AGCOD).
 *
 * - Authorization: AWS Signature Version 4 with corporate credentials
 * - Purchase: CreateGiftCard operation
 * - Validation: Amount >= $1.00 (else suggest Support Wishbee)
 * - Idempotency: creationRequestId from eventID (partnerId + eventId)
 * - DB Update: On success, store gc_claim_code and amazon_request_id in gift_settlements
 */

import { createAdminClient } from "@/lib/supabase/server"
import { createHash, createHmac } from "crypto"

const MIN_AMOUNT_USD = 1.0
const CURRENCY_CODE = "USD"
const AGCOD_REGION = "us-east-1"
const AGCOD_SERVICE = "AGCODService"

const SANDBOX_ENDPOINT = "agcod-v2-gamma.amazon.com"
const PROD_ENDPOINT = "agcod-v2.amazon.com"

export type IssueGiftCardResult =
  | { success: true; gcClaimCode: string; creationRequestId: string; gcId?: string }
  | { success: false; error: string; code?: string }

export type IssueGiftCardParams = {
  amount: number
  recipientEmail: string
  eventId: string
  settlementId: string
}

/**
 * Validates amount. Returns error suggesting Support Wishbee if < $1.00.
 */
export function validateAmount(amount: number): { valid: boolean; error?: string } {
  const rounded = Math.round(amount * 100) / 100
  if (rounded < MIN_AMOUNT_USD) {
    return {
      valid: false,
      error: `Amount must be at least $${MIN_AMOUNT_USD.toFixed(2)}. For amounts under $1.00, consider using 'Support Wishbee' to tip the platform.`,
    }
  }
  if (rounded > 2000) {
    return { valid: false, error: "Amount cannot exceed $2,000.00 for a single gift card." }
  }
  return { valid: true }
}

/**
 * Builds idempotency key (creationRequestId) for AGCOD.
 * Must be prefixed with partnerId, max 40 chars.
 */
function buildCreationRequestId(partnerId: string, eventId: string): string {
  const sanitized = eventId.replace(/-/g, "").slice(0, 34)
  return `${partnerId}-${sanitized}`
}

/**
 * AWS Signature Version 4 — signs a request for AGCOD.
 */
function signAws4(
  method: string,
  host: string,
  path: string,
  body: string,
  headers: Record<string, string>,
  accessKey: string,
  secretKey: string,
  region: string,
  service: string
): Record<string, string> {
  const algorithm = "AWS4-HMAC-SHA256"
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z"
  const dateStamp = amzDate.slice(0, 8)
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`

  const payloadHash = createHash("sha256").update(body).digest("hex")
  const signedHeaders = "content-type;host;x-amz-date;x-amz-target"
  const canonicalHeaders =
    `content-type:${headers["Content-Type"]}\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:${headers["x-amz-target"]}\n`
  const canonicalRequest =
    `${method}\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`
  const canonicalRequestHash = createHash("sha256").update(canonicalRequest).digest("hex")
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`
  const kDate = createHmac("sha256", "AWS4" + secretKey).update(dateStamp).digest()
  const kRegion = createHmac("sha256", kDate).update(region).digest()
  const kService = createHmac("sha256", kRegion).update(service).digest()
  const kSigning = createHmac("sha256", kService).update("aws4_request").digest()
  const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex")

  const auth =
    `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  return {
    ...headers,
    "x-amz-date": amzDate,
    Authorization: auth,
  }
}

/**
 * Authenticates and sends signed request to Amazon Incentives API.
 */
async function sendCreateGiftCardRequest(
  amount: number,
  creationRequestId: string,
  partnerId: string,
  accessKey: string,
  secretKey: string,
  useSandbox: boolean
): Promise<{ status: string; gcClaimCode?: string; gcId?: string; errorCode?: string; message?: string }> {
  const host = useSandbox ? SANDBOX_ENDPOINT : PROD_ENDPOINT
  const path = "/CreateGiftCard"
  const body = JSON.stringify({
    creationRequestId,
    partnerId,
    value: {
      currencyCode: CURRENCY_CODE,
      amount: Math.round(amount * 100) / 100,
    },
  })

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-amz-target": "com.amazonaws.agcod.AGCODService.CreateGiftCard",
  }

  const signedHeaders = signAws4(
    "POST",
    host,
    path,
    body,
    headers,
    accessKey,
    secretKey,
    AGCOD_REGION,
    AGCOD_SERVICE
  )

  const url = `https://${host}${path}`
  const res = await fetch(url, {
    method: "POST",
    headers: signedHeaders,
    body,
  })

  const data = (await res.json().catch(() => ({}))) as {
    status?: string
    gcClaimCode?: string
    gcId?: string
    cardInfo?: { cardStatus?: string }
    errorCode?: string
    message?: string
  }

  return {
    status: data.status || "FAILURE",
    gcClaimCode: data.gcClaimCode,
    gcId: data.gcId,
    errorCode: data.errorCode,
    message: data.message,
  }
}

/**
 * Issues an Amazon eGift Card via the Incentives API.
 * Uses eventId as idempotency key; on success updates gift_settlements.
 */
export async function issueGiftCard(params: IssueGiftCardParams): Promise<IssueGiftCardResult> {
  const { amount, recipientEmail, eventId, settlementId } = params

  const validation = validateAmount(amount)
  if (!validation.valid) {
    return { success: false, error: validation.error! }
  }

  const partnerId = process.env.AGCOD_PARTNER_ID?.trim()
  const accessKey = process.env.AGCOD_ACCESS_KEY?.trim()
  const secretKey = process.env.AGCOD_SECRET_KEY?.trim()
  const useSandbox = process.env.AGCOD_USE_SANDBOX !== "false"

  if (!partnerId || !accessKey || !secretKey) {
    return {
      success: false,
      error: "Amazon Gift Card API credentials not configured (AGCOD_PARTNER_ID, AGCOD_ACCESS_KEY, AGCOD_SECRET_KEY).",
    }
  }

  const creationRequestId = buildCreationRequestId(partnerId, eventId)
  const roundedAmount = Math.round(amount * 100) / 100

  const result = await sendCreateGiftCardRequest(
    roundedAmount,
    creationRequestId,
    partnerId,
    accessKey,
    secretKey,
    useSandbox
  )

  if (result.status === "SUCCESS" && result.gcClaimCode) {
    const supabase = createAdminClient()
    if (supabase) {
      await supabase
        .from("gift_settlements")
        .update({
          gc_claim_code: result.gcClaimCode,
          amazon_request_id: creationRequestId,
          recipient_email: recipientEmail,
        })
        .eq("id", settlementId)
    }

    return {
      success: true,
      gcClaimCode: result.gcClaimCode,
      creationRequestId,
      gcId: result.gcId,
    }
  }

  const errMsg = result.message || result.errorCode || "CreateGiftCard failed"
  return { success: false, error: errMsg, code: result.errorCode }
}
