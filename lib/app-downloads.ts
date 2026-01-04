/**
 * App Download Utilities
 * Handles device detection, app store links, and download tracking
 */

export type Platform = "ios" | "android" | "unknown"

export interface AppStoreLinks {
  ios: string
  android: string
}

// App Store URLs - Update these when your apps are published
export const APP_STORE_LINKS: AppStoreLinks = {
  ios: "https://apps.apple.com/app/wishbee", // Update with actual App Store URL
  android: "https://play.google.com/store/apps/details?id=com.wishbee", // Update with actual Play Store URL
}

/**
 * Detect user's platform from user agent
 */
export function detectPlatform(): Platform {
  if (typeof window === "undefined") return "unknown"

  const userAgent = navigator.userAgent.toLowerCase()

  // iOS detection
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return "ios"
  }

  // Android detection
  if (/android/.test(userAgent)) {
    return "android"
  }

  return "unknown"
}

/**
 * Get the appropriate app store URL based on platform
 */
export function getAppStoreUrl(platform: Platform): string {
  if (platform === "ios") {
    return APP_STORE_LINKS.ios
  } else if (platform === "android") {
    return APP_STORE_LINKS.android
  }
  // Default to iOS for desktop users
  return APP_STORE_LINKS.ios
}

/**
 * Track app download click for analytics
 */
export async function trackAppDownload(
  platform: Platform,
  source: string = "unknown"
): Promise<void> {
  try {
    await fetch("/api/app-downloads/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        platform,
        source,
        userAgent: navigator.userAgent,
        referrer: document.referrer || undefined,
      }),
    })
  } catch (error) {
    // Fail silently - don't block user from downloading
    console.error("[App Downloads] Failed to track download:", error)
  }
}

/**
 * Open app store and track the click
 */
export async function handleAppDownload(
  platform: Platform,
  source: string = "unknown"
): Promise<void> {
  // Track the download click
  await trackAppDownload(platform, source)

  // Get the appropriate URL
  const url = getAppStoreUrl(platform)

  // Open in new tab
  window.open(url, "_blank", "noopener,noreferrer")

  // Track with Google Analytics if available
  if (typeof window !== "undefined" && (window as any).gtag) {
    ;(window as any).gtag("event", "app_download_click", {
      platform: platform.toUpperCase(),
      source,
    })
  }
}

/**
 * Check if app is installed (for deep linking)
 * This is a basic check - can be enhanced with custom URL schemes
 */
export function isAppInstalled(): boolean {
  // TODO: Implement deep link checking
  // For iOS: Check if custom URL scheme works
  // For Android: Check if intent:// URL works
  return false
}

/**
 * Get deep link URL for opening app if installed
 */
export function getDeepLinkUrl(platform: Platform): string | null {
  // TODO: Implement deep linking
  // iOS: wishbee://
  // Android: intent://
  return null
}

