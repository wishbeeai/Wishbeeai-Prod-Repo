import { NextResponse } from "next/server"
import { getReloadlyClient } from "@/lib/reloadly"
import type { ReloadlyProduct } from "@/lib/reloadly"

export const dynamic = "force-dynamic"

/** Top brands to show on Settlement (by name substring match, case-insensitive). */
const TOP_BRAND_NAMES = ["Amazon", "Target", "Starbucks", "Walmart", "eBay"]

function brandSortKey(p: ReloadlyProduct): number {
  const name = (p.productName ?? p.brand?.name ?? "").toLowerCase()
  const idx = TOP_BRAND_NAMES.findIndex((b) => name.includes(b.toLowerCase()))
  return idx >= 0 ? idx : TOP_BRAND_NAMES.length
}

/**
 * GET /api/reloadly/products
 * Returns up to 5 gift card products (top brands: Amazon, Target, Starbucks, Walmart, eBay).
 * Used by the Settlement page to let the user pick a brand. All Reloadly calls are server-only.
 */
export async function GET() {
  try {
    const client = getReloadlyClient()
    const all = await client.getProducts()
    const withBrand = all.filter((p) => {
      const name = (p.productName ?? p.brand?.name ?? "").toLowerCase()
      return TOP_BRAND_NAMES.some((b) => name.includes(b.toLowerCase()))
    })
    const sorted = [...withBrand].sort((a, b) => brandSortKey(a) - brandSortKey(b))
    const top5 = sorted.slice(0, 5).map((p) => ({
      productId: p.productId,
      productName: p.productName ?? p.brand?.name ?? "Gift Card",
      countryCode: p.countryCode,
      minRecipientDenomination: p.minRecipientDenomination,
      maxRecipientDenomination: p.maxRecipientDenomination,
    }))
    return NextResponse.json({ products: top5 })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load products"
    console.error("[reloadly/products]", e)
    return NextResponse.json({ error: message, products: [] }, { status: 502 })
  }
}
