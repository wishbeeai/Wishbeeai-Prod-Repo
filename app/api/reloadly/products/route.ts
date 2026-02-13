import { NextResponse } from "next/server"
import { getReloadlyClient } from "@/lib/reloadly"
import type { ReloadlyProduct } from "@/lib/reloadly"

export const dynamic = "force-dynamic"

/**
 * GET /api/reloadly/products
 * Returns all Reloadly gift card products for the given country (default US).
 * Query: ?country=US to filter by country. No limit — full catalog for the dropdown.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const country = (searchParams.get("country") ?? "US").toUpperCase()

    const client = getReloadlyClient()
    // Request US products directly from Reloadly so we get the full USA catalog (paginated)
    const all = await client.getProducts(country === "US" ? "US" : undefined)
    const code = (c: string) => (c ?? "").toUpperCase().trim()
    const name = (p: ReloadlyProduct) =>
      (p.productName ?? p.brand?.name ?? "").toLowerCase()

    let filtered: ReloadlyProduct[]
    if (country === "US") {
      filtered = all.filter((p) => {
        const c = code(p.countryCode)
        if (c === "US" || c === "USA") return true
        return false
      })
      // When Reloadly doesn't set countryCode, keep only products whose name indicates US (e.g. "Amazon US", "Starbucks US")
      if (filtered.length === 0 && all.length > 0) {
        filtered = all.filter((p) => {
          const n = name(p)
          return (
            n.includes(" us") ||
            n.includes(" usa") ||
            n.includes(" united states") ||
            n.includes("(us)") ||
            n.startsWith("us ") ||
            n.startsWith("usa ")
          )
        })
      }
    } else {
      filtered = all.filter((p) => code(p.countryCode) === country)
    }

    // Deduplicate by productId
    const seenIds = new Set<number>()
    const byId = filtered.filter((p) => {
      if (seenIds.has(p.productId)) return false
      seenIds.add(p.productId)
      return true
    })

    // Deduplicate by normalized name so "Fortnite"/"Fortnite US"/"Free Fire"/"FreeFire" show once
    const normalizedKey = (p: ReloadlyProduct) => {
      let n = (p.productName ?? p.brand?.name ?? "").toLowerCase().trim()
      n = n
        .replace(/\s*[\[\(][^)\]]*[\)\]]\s*/g, " ") // remove (US), [USA], etc.
        .replace(/\s*[-–—]\s*(us|usa|u\.s\.?|united states)\s*$/gi, "")
        .replace(/\s+(us|usa|u\.s\.?|united states)\s*$/gi, "")
        .replace(/\b(v[- ]?bucks|gift\s*card|garena|digital\s*code|code)\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
      let key = n ? n.replace(/\s/g, "") : ""
      // Force same key for known duplicate game names (any variant → one canonical key)
      if (key.includes("fortnite")) key = "fortnite"
      else if (key.includes("freefire")) key = "freefire"
      return key || `id-${p.productId}`
    }
    const seenNames = new Set<string>()
    const unique = byId.filter((p) => {
      const key = normalizedKey(p)
      if (seenNames.has(key)) return false
      seenNames.add(key)
      return true
    })

    // Order by popularity: well-known brands first, then A–Z
    const POPULAR_BRANDS = [
      "amazon",
      "target",
      "starbucks",
      "walmart",
      "ebay",
      "best buy",
      "apple",
      "google play",
      "netflix",
      "spotify",
      "dunkin",
      "domino",
      "uber",
      "doordash",
      "grubhub",
    ]
    const popularityRank = (p: ReloadlyProduct) => {
      const n = name(p)
      const idx = POPULAR_BRANDS.findIndex((b) => n.includes(b))
      return idx >= 0 ? idx : POPULAR_BRANDS.length
    }
    const byPopularityThenName = [...unique].sort((a, b) => {
      const rA = popularityRank(a)
      const rB = popularityRank(b)
      if (rA !== rB) return rA - rB
      const nameA = (a.productName ?? a.brand?.name ?? "").toLowerCase()
      const nameB = (b.productName ?? b.brand?.name ?? "").toLowerCase()
      return nameA.localeCompare(nameB)
    })

    const products = byPopularityThenName.map((p) => ({
      productId: p.productId,
      productName: p.productName ?? p.brand?.name ?? "Gift Card",
      countryCode: p.countryCode,
      logoUrls: p.logoUrls ?? [],
      minRecipientDenomination: p.minRecipientDenomination,
      maxRecipientDenomination: p.maxRecipientDenomination,
    }))
    return NextResponse.json({ products })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load products"
    console.error("[reloadly/products]", e)
    return NextResponse.json({ error: message, products: [] }, { status: 502 })
  }
}
