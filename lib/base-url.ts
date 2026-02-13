/**
 * Server-side base URL for receipt links, emails, and API callbacks.
 * In production (or when VERCEL_URL is set) uses production URL so receipt/email links work.
 */
export function getServerBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL?.trim()) {
    return process.env.NEXT_PUBLIC_BASE_URL.trim().replace(/\/$/, "")
  }
  const isProduction =
    process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL_URL)
  if (isProduction) {
    if (process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
      return process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/$/, "")
    }
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`
    }
    return "https://wishbee.ai"
  }
  return "http://localhost:3001"
}
