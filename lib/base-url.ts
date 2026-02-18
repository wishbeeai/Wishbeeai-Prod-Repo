/**
 * Server-side base URL for receipt links, emails, and API callbacks.
 * In production (or when VERCEL_URL is set) uses production URL so receipt/email links work.
 * Never returns localhost when VERCEL_URL is set (fixes contribute/Bonus links in production).
 */
export function getServerBaseUrl(): string {
  const isProduction =
    process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL_URL)

  // In production, never use localhost — prefer VERCEL_URL or production fallback
  if (isProduction && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  if (isProduction && process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
    const url = process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/$/, "")
    if (!url.includes("localhost")) return url
  }
  if (process.env.NEXT_PUBLIC_BASE_URL?.trim()) {
    const url = process.env.NEXT_PUBLIC_BASE_URL.trim().replace(/\/$/, "")
    if (!url.includes("localhost")) return url
  }
  if (isProduction) {
    return "https://wishbee.ai"
  }
  return "http://localhost:3001"
}
