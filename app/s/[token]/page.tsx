/**
 * Public Shared Wishlist View Page
 * 
 * This page displays a shared wishlist or product to anyone with the link.
 * No authentication required.
 * 
 * Route: /s/:token
 */

import { Metadata } from "next"
import { notFound } from "next/navigation"
import { SharedWishlistView } from "./shared-wishlist-view"

interface PageProps {
  params: Promise<{ token: string }>
}

/**
 * Generate metadata for SEO and social sharing
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wishbee.ai"
    const response = await fetch(`${baseUrl}/api/share/${token}`, {
      cache: "no-store",
    })
    
    if (!response.ok) {
      return {
        title: "Wishlist Not Found | Wishbee",
        description: "This wishlist link is invalid or has expired.",
      }
    }
    
    const data = await response.json()
    
    const title = data.product
      ? `${data.product.name} | ${data.sharedBy}'s Wishlist`
      : `${data.wishlist.title} | ${data.sharedBy}'s Wishlist`
    
    const description = data.product
      ? `Check out ${data.product.name} on ${data.sharedBy}'s wishlist on Wishbee!`
      : `View ${data.sharedBy}'s wishlist with ${data.items.length} items on Wishbee!`
    
    const image = data.product?.image || data.items[0]?.image || "/og-image.png"
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [image],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
    }
  } catch (error) {
    return {
      title: "Shared Wishlist | Wishbee",
      description: "View a shared wishlist on Wishbee.ai",
    }
  }
}

export default async function SharedWishlistPage({ params }: PageProps) {
  const { token } = await params
  
  if (!token) {
    notFound()
  }
  
  return <SharedWishlistView token={token} />
}
