"use server"

import { getReloadlyClient } from "@/lib/reloadly"
import type { ReloadlyProduct, PlaceOrderParams, PlaceOrderResult, BalanceResult } from "@/lib/reloadly"

/**
 * Server-only Reloadly actions. RELOADLY_CLIENT_SECRET is never sent to the client.
 */

export type ProductsActionResult =
  | { success: true; products: ReloadlyProduct[] }
  | { success: false; error: string }

export type BalanceActionResult =
  | { success: true; balance: number; currencyCode: string; canFulfillGiftCard: boolean }
  | { success: false; error: string; canFulfillGiftCard: false }

export type CreateOrderActionResult = PlaceOrderResult

export async function getProductsAction(): Promise<ProductsActionResult> {
  try {
    const client = getReloadlyClient()
    const products = await client.getProducts()
    return { success: true, products }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load gift card products"
    return { success: false, error: message }
  }
}

export type GiftCardsGalleryResult =
  | { success: true; products: ReloadlyProduct[]; balance: number }
  | { success: false; error: string; products: []; balance: 0 }

/**
 * Fetch US gift card products and current balance for the gallery.
 * Use in Settlement page; empty state when products.length === 0 || balance === 0.
 */
export async function getGiftCardsForGalleryAction(): Promise<GiftCardsGalleryResult> {
  try {
    const client = getReloadlyClient()
    const [allProducts, balanceResult] = await Promise.all([
      client.getProducts(),
      client.getBalance(),
    ])
    const balance = Number(balanceResult.balance ?? 0)
    const products = (allProducts as ReloadlyProduct[]).filter(
      (p) => (p.countryCode ?? "").toUpperCase() === "US"
    )
    return { success: true, products, balance }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load gift cards"
    return { success: false, error: message, products: [], balance: 0 }
  }
}

export async function getBalanceAction(amount: number): Promise<BalanceActionResult> {
  try {
    const client = getReloadlyClient()
    const result: BalanceResult = await client.getBalance()
    const balance = Number(result.balance ?? 0)
    const canFulfillGiftCard = !isNaN(amount) && amount >= 0 && balance >= amount
    return {
      success: true,
      balance,
      currencyCode: result.currencyCode ?? "USD",
      canFulfillGiftCard,
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to check balance"
    return { success: false, error: message, canFulfillGiftCard: false }
  }
}

export async function createOrderAction(params: PlaceOrderParams): Promise<CreateOrderActionResult> {
  const client = getReloadlyClient()
  return client.createOrder(params)
}
