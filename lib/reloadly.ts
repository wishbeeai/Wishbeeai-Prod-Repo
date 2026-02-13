/**
 * Reloadly Gift Cards API (sandbox).
 * Class-based client with OAuth2 token caching (tokens last ~24h).
 * Env: RELOADLY_CLIENT_ID, RELOADLY_CLIENT_SECRET.
 * All usage must be server-side only; never expose secrets to the frontend.
 */

import { cache } from "react"

const AUTH_URL = "https://auth.reloadly.com/oauth/token"
const SANDBOX_BASE = "https://giftcards-sandbox.reloadly.com"
/** Required audience for Reloadly Gift Cards (sandbox). Must match for token generation. */
const SANDBOX_AUDIENCE = "https://giftcards-sandbox.reloadly.com"

/** Token cache: refresh when less than 1 minute until expiry (24h lifetime in sandbox). */
const TOKEN_BUFFER_MS = 60_000

export type ReloadlyProduct = {
  productId: number
  countryCode: string
  productName: string
  global: boolean
  minRecipientDenomination?: number
  maxRecipientDenomination?: number
  senderFee?: number
  brand?: { name?: string }
  /** Brand logo URL(s); use logoUrls[0] for card display */
  logoUrls?: string[]
  [key: string]: unknown
}

export type PlaceOrderParams = {
  productId: number
  amount: number
  recipientEmail: string
  recipientName?: string
}

export type PlaceOrderResult =
  | { success: true; orderId: string; redeemCode?: string; infoText?: string; claimUrl?: string }
  | { success: false; error: string; code?: string }

export type BalanceResult = {
  balance: number
  currencyCode: string
  [key: string]: unknown
}

/**
 * Reloadly Gift Cards API client with OAuth2 token caching.
 * Use getReloadlyClient() for a singleton instance. Only use on the server.
 */
export class ReloadlyClient {
  private tokenCache: { token: string; expiresAt: number } | null = null

  async getAccessToken(): Promise<string> {
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now() + TOKEN_BUFFER_MS) {
      return this.tokenCache.token
    }
    const clientId = process.env.RELOADLY_CLIENT_ID?.trim()
    const clientSecret = process.env.RELOADLY_CLIENT_SECRET?.trim()
    if (!clientId || !clientSecret) {
      throw new Error("RELOADLY_CLIENT_ID and RELOADLY_CLIENT_SECRET are required")
    }
    const res = await fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
        audience: SANDBOX_AUDIENCE,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = data?.error_description ?? data?.message ?? res.statusText
      throw new Error(`Reloadly auth failed: ${msg}`)
    }
    const token = data?.access_token
    const expiresIn = Number(data?.expires_in) ?? 86400
    if (!token) throw new Error("Reloadly auth response missing access_token")
    this.tokenCache = { token, expiresAt: Date.now() + expiresIn * 1000 }
    return token
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken()
    const url = path.startsWith("http") ? path : `${SANDBOX_BASE}${path.startsWith("/") ? path : `/${path}`}`
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/com.reloadly.giftcards-v1+json",
        Authorization: `Bearer ${token}`,
        ...(options.headers as Record<string, string>),
      },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = data?.message ?? data?.error ?? res.statusText
      throw new Error(typeof msg === "string" ? msg : "Reloadly request failed")
    }
    return data as T
  }

  /**
   * Fetch all gift card products. Optionally filter by country (e.g. "US" for USA).
   * Uses Reloadly's countryCode param and paginates through all pages (large page size).
   */
  async getProducts(countryCode?: string): Promise<ReloadlyProduct[]> {
    const pageSize = 500
    const countryParam = countryCode ? `&countryCode=${encodeURIComponent(countryCode.toUpperCase())}` : ""
    const baseQuery = `/products?size=${pageSize}&page=`
    type PageResponse = {
      content?: ReloadlyProduct[]
      data?: ReloadlyProduct[]
      totalPages?: number
      totalElements?: number
      number?: number
    }
    const first = await this.request<PageResponse | ReloadlyProduct[]>(`${baseQuery}0${countryParam}`)
    const isDirectArray = Array.isArray(first)
    const content = isDirectArray ? first : (first as PageResponse)?.content ?? (first as PageResponse)?.data
    let list = Array.isArray(content) ? [...content] : []
    const totalElements = isDirectArray ? list.length : (first as PageResponse)?.totalElements ?? list.length
    const totalPages =
      (first as PageResponse)?.totalPages ?? Math.max(1, Math.ceil(totalElements / pageSize))
    for (let page = 1; page < totalPages; page++) {
      const next = await this.request<PageResponse | ReloadlyProduct[]>(`${baseQuery}${page}${countryParam}`)
      const nextArr = Array.isArray(next) ? next : (next as PageResponse)?.content ?? (next as PageResponse)?.data
      if (Array.isArray(nextArr) && nextArr.length > 0) list = list.concat(nextArr)
      else if (!Array.isArray(nextArr) || nextArr.length === 0) break
    }
    return list as ReloadlyProduct[]
  }

  /**
   * Get Reloadly wallet balance (Float). Balance is in USD.
   * Use before offering gift card to ensure we can fulfill the order.
   */
  async getBalance(): Promise<BalanceResult> {
    const data = await this.request<{ balance?: number; float?: number; currencyCode?: string; currency?: string }>(
      "/accounts/balance"
    )
    const balance = Number(data?.balance ?? data?.float ?? 0)
    const currencyCode = data?.currencyCode ?? data?.currency ?? "USD"
    return { balance, currencyCode, ...data }
  }

  /**
   * Place a gift card order. Returns redeemCode or infoText for display to the user.
   */
  async createOrder(params: PlaceOrderParams): Promise<PlaceOrderResult> {
    const amountRounded = Math.round(params.amount * 100) / 100
    if (amountRounded < 1) {
      return { success: false, error: "Amount must be at least $1.00" }
    }
    const body = {
      productId: params.productId,
      quantity: 1,
      unitPrice: amountRounded,
      recipientEmail: params.recipientEmail,
      ...(params.recipientName && { recipientName: params.recipientName }),
    }
    try {
      const data = await this.request<{
        transactionId?: string
        orderId?: string
        id?: string
        redeemCode?: string
        redemptionCode?: string
        redeemInstruction?: { redemptionCode?: string; infoText?: string }
        infoText?: string
        instructions?: string
        claimUrl?: string
        delivery?: { link?: string }
        message?: string
        error?: string
        code?: string
      }>("/orders", {
        method: "POST",
        body: JSON.stringify(body),
      })
      const orderId = data?.transactionId ?? data?.orderId ?? data?.id ?? ""
      const redeemCode =
        data?.redeemCode ??
        data?.redemptionCode ??
        data?.redeemInstruction?.redemptionCode
      const infoText =
        data?.infoText ?? data?.redeemInstruction?.infoText ?? data?.instructions
      const claimUrl = data?.claimUrl ?? data?.delivery?.link
      return {
        success: true,
        orderId: String(orderId),
        redeemCode: redeemCode != null ? String(redeemCode) : undefined,
        infoText: infoText != null ? String(infoText) : undefined,
        claimUrl: claimUrl != null ? String(claimUrl) : undefined,
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Reloadly order failed"
      return { success: false, error: message }
    }
  }
}

let clientInstance: ReloadlyClient | null = null

/**
 * Get singleton Reloadly client. Use only on the server (API routes or server actions).
 */
export function getReloadlyClient(): ReloadlyClient {
  if (!clientInstance) {
    clientInstance = new ReloadlyClient()
  }
  return clientInstance
}

// Legacy exports for backward compatibility with existing callers
export async function getReloadlyAccessToken(): Promise<string> {
  return getReloadlyClient().getAccessToken()
}

export async function getGiftCards(): Promise<ReloadlyProduct[]> {
  return getReloadlyClient().getProducts()
}

export async function placeOrder(params: PlaceOrderParams): Promise<PlaceOrderResult> {
  return getReloadlyClient().createOrder(params)
}

export async function getBalance(): Promise<BalanceResult> {
  return getReloadlyClient().getBalance()
}

/**
 * Get Reloadly wallet balance as a number (USD).
 * Calls the /accounts/balance endpoint.
 */
export async function getReloadlyBalance(): Promise<number> {
  const result = await getReloadlyClient().getBalance()
  return Number(result.balance ?? 0)
}

/**
 * Cached balance for the current request (React cache).
 * Deduplicates multiple getReloadlyBalance calls in the same render/request.
 */
export const getCachedReloadlyBalance = cache(getReloadlyBalance)
