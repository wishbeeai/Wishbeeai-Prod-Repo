/**
 * Share Utility Functions
 * 
 * This file contains utility functions for generating share links and
 * constructing share URLs for various platforms (WhatsApp, SMS, Email, etc.)
 */

// Base URL for the application (defaults to production URL)
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'https://wishbee.ai'
}

/**
 * Generate a cryptographically secure, URL-safe token for share links
 * Uses crypto.randomBytes for secure random generation
 * 
 * @param length - Length of the token in bytes (default: 16 for 128 bits of entropy)
 * @returns A URL-safe random token (base64url encoded)
 */
export function generateShareToken(length: number = 16): string {
  // For server-side (Node.js)
  if (typeof window === 'undefined') {
    const crypto = require('crypto')
    return crypto.randomBytes(length).toString('base64url')
  }
  
  // For client-side (browser)
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  // Convert to base64url (URL-safe base64)
  const base64 = btoa(String.fromCharCode(...array))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Construct the full share URL from a token
 * 
 * @param token - The share token
 * @returns Full share URL (e.g., https://wishbee.ai/s/abc123)
 */
export function getShareUrl(token: string): string {
  const baseUrl = getBaseUrl()
  return `${baseUrl}/s/${token}`
}

/**
 * Share URL constructors for various platforms
 */

export interface ShareContent {
  title: string
  description?: string
  url: string
}

/**
 * Generate WhatsApp share URL
 * Opens WhatsApp with a pre-filled message
 * 
 * @param content - Share content
 * @returns WhatsApp share URL
 */
export function getWhatsAppShareUrl(content: ShareContent): string {
  const text = formatShareMessage(content)
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

/**
 * Generate SMS/iMessage share URL
 * Opens the default messaging app with a pre-filled message
 * 
 * @param content - Share content
 * @returns SMS share URL
 */
export function getSmsShareUrl(content: ShareContent): string {
  const text = formatShareMessage(content)
  // Using &body= for broader compatibility (iOS and Android)
  return `sms:?&body=${encodeURIComponent(text)}`
}

/**
 * Generate Email share URL
 * Opens the default email client with subject and body
 * 
 * @param content - Share content
 * @returns Email mailto URL
 */
export function getEmailShareUrl(content: ShareContent): string {
  const subject = `Check out my wishlist on Wishbee: ${content.title}`
  const body = formatShareMessage(content)
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/**
 * Generate Twitter/X share URL
 * 
 * @param content - Share content
 * @returns Twitter share URL
 */
export function getTwitterShareUrl(content: ShareContent): string {
  const text = `${content.title}\n\n${content.url}`
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
}

/**
 * Generate Facebook share URL
 * 
 * @param content - Share content
 * @returns Facebook share URL
 */
export function getFacebookShareUrl(content: ShareContent): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(content.url)}`
}

/**
 * Format a share message for text-based platforms
 * 
 * @param content - Share content
 * @returns Formatted message string
 */
function formatShareMessage(content: ShareContent): string {
  let message = `${content.title}`
  
  if (content.description) {
    message += `\n\n${content.description}`
  }
  
  message += `\n\n${content.url}`
  message += `\n\n🐝 Shared via Wishbee.ai`
  
  return message
}

/**
 * Copy text to clipboard
 * 
 * @param text - Text to copy
 * @returns Promise that resolves to true if successful
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch {
      console.error('Failed to copy to clipboard:', error)
      return false
    }
  }
}

/**
 * Check if the Web Share API is available
 * This is typically available on mobile devices
 * 
 * @returns true if Web Share API is supported
 */
export function isWebShareSupported(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator
}

/**
 * Trigger native share dialog (mobile)
 * 
 * @param content - Share content
 * @returns Promise that resolves when share is complete
 */
export async function triggerNativeShare(content: ShareContent): Promise<boolean> {
  if (!isWebShareSupported()) {
    return false
  }
  
  try {
    await navigator.share({
      title: content.title,
      text: content.description || '',
      url: content.url,
    })
    return true
  } catch (error: any) {
    // User cancelled the share or error occurred
    if (error.name !== 'AbortError') {
      console.error('Error sharing:', error)
    }
    return false
  }
}

/**
 * Share channel types
 */
export type ShareChannel = 
  | 'copy'
  | 'whatsapp'
  | 'sms'
  | 'email'
  | 'twitter'
  | 'facebook'
  | 'native'
  | 'wishbee_group'

/**
 * Get share URL for a specific channel
 * 
 * @param channel - The share channel
 * @param content - Share content
 * @returns Share URL or null for channels that don't use URLs (copy, native)
 */
export function getShareUrlForChannel(
  channel: ShareChannel,
  content: ShareContent
): string | null {
  switch (channel) {
    case 'whatsapp':
      return getWhatsAppShareUrl(content)
    case 'sms':
      return getSmsShareUrl(content)
    case 'email':
      return getEmailShareUrl(content)
    case 'twitter':
      return getTwitterShareUrl(content)
    case 'facebook':
      return getFacebookShareUrl(content)
    case 'copy':
    case 'native':
    case 'wishbee_group':
      return null
    default:
      return null
  }
}

/**
 * Open share URL in a new window/tab
 * 
 * @param url - URL to open
 * @param windowName - Name for the popup window
 */
export function openShareWindow(url: string, windowName: string = 'share'): void {
  // For mobile-friendly URLs (sms:, mailto:), just navigate
  if (url.startsWith('sms:') || url.startsWith('mailto:')) {
    window.location.href = url
    return
  }
  
  // For web URLs, open in a popup for desktop
  const width = 600
  const height = 400
  const left = (window.innerWidth - width) / 2
  const top = (window.innerHeight - height) / 2
  
  window.open(
    url,
    windowName,
    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
  )
}
