/**
 * App Download Utilities
 * Handles device detection, app store links, and download tracking
 */

export type Platform = "ios" | "android" | "unknown"

export interface AppStoreLinks {
  ios: string
  android: string
}

// Configuration: Set to true when apps are published
export const APPS_AVAILABLE = {
  ios: false, // Set to true when iOS app is published
  android: false, // Set to true when Android app is published
}

// App Store URLs - Update these when your apps are published
export const APP_STORE_LINKS: AppStoreLinks = {
  ios: "https://apps.apple.com/app/wishbee", // Update with actual App Store URL when published
  android: "https://play.google.com/store/apps/details?id=com.wishbee", // Update with actual Play Store URL when published
}

// Coming Soon page URLs (optional - can point to a landing page or waitlist)
export const COMING_SOON_LINKS: AppStoreLinks = {
  ios: "/app-download?platform=ios", // Or use a waitlist URL
  android: "/app-download?platform=android", // Or use a waitlist URL
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
 * Check if app is available for a platform
 */
export function isAppAvailable(platform: Platform): boolean {
  if (platform === "ios") {
    return APPS_AVAILABLE.ios
  } else if (platform === "android") {
    return APPS_AVAILABLE.android
  }
  return false
}

/**
 * Get the appropriate app store URL based on platform
 * Returns coming soon link if app is not available
 */
export function getAppStoreUrl(platform: Platform): string {
  const isAvailable = isAppAvailable(platform)
  
  if (platform === "ios") {
    return isAvailable ? APP_STORE_LINKS.ios : COMING_SOON_LINKS.ios
  } else if (platform === "android") {
    return isAvailable ? APP_STORE_LINKS.android : COMING_SOON_LINKS.android
  }
  // Default to iOS for desktop users
  return isAvailable ? APP_STORE_LINKS.ios : COMING_SOON_LINKS.ios
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
  const isAvailable = isAppAvailable(platform)

  // If app is not available, navigate within the app (for coming soon page)
  // Otherwise open app store in new tab
  if (isAvailable) {
    window.open(url, "_blank", "noopener,noreferrer")
  } else {
    // For coming soon, navigate within the app
    window.location.href = url
  }

  // Track with Google Analytics if available
  if (typeof window !== "undefined" && (window as any).gtag) {
    ;(window as any).gtag("event", isAvailable ? "app_download_click" : "app_coming_soon_click", {
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

