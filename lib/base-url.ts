/**
 * Server-side base URL for receipt links, emails, and API callbacks.
 * Uses production domain (wishbee.ai or NEXT_PUBLIC_BASE_URL) — NOT VERCEL_URL — so share/contribute
 * links never hit protected *.vercel.app URLs that trigger Vercel SSO.
 */
export function getServerBaseUrl(): string {
  const isProduction =
    process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL_URL)

  // Prefer explicit production domain
  if (process.env.NEXT_PUBLIC_BASE_URL?.trim()) {
    const url = process.env.NEXT_PUBLIC_BASE_URL.trim().replace(/\/$/, "")
    if (!url.includes("localhost")) return url
  }
  if (process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
    const url = process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/$/, "")
    if (!url.includes("localhost")) return url
  }
  // In production: use wishbee.ai (never VERCEL_URL) — vercel.app URLs trigger deployment protection/SSO
  if (isProduction) {
    return "https://wishbee.ai"
  }
  return "http://localhost:3001"
}
