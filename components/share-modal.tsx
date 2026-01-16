"use client"

/**
 * ShareModal Component
 * 
 * A modal dialog for sharing wishlists or products via various channels:
 * - Copy Link
 * - WhatsApp
 * - iMessage / SMS
 * - Email
 * - Native share (mobile)
 * - Share to Wishbee Group
 */

import { useState, useEffect } from "react"
// Using custom modal matching Additional Specifications widget UI
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Copy,
  Check,
  MessageCircle,
  Mail,
  Users,
  Smartphone,
  Loader2,
  X,
} from "lucide-react"
import {
  copyToClipboard,
  isWebShareSupported,
  triggerNativeShare,
  getWhatsAppShareUrl,
  getSmsShareUrl,
  getEmailShareUrl,
  openShareWindow,
  type ShareContent,
} from "@/lib/share-utils"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  wishlistId: string
  wishlistTitle: string
  productId?: string | null
  productName?: string | null
}

export function ShareModal({
  isOpen,
  onClose,
  wishlistId,
  wishlistTitle,
  productId,
  productName,
}: ShareModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setShareUrl(null)
      setCopied(false)
      setError(null)
      generateShareLink()
    }
  }, [isOpen, wishlistId, productId])

  /**
   * Generate a share link via the API
   */
  const generateShareLink = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/share/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wishlistId,
          productId: productId || null,
          accessLevel: "view", // Default to view-only
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create share link")
      }

      setShareUrl(data.shareUrl)
    } catch (err: any) {
      console.error("Error generating share link:", err)
      setError(err.message || "Failed to generate share link")
      toast({
        title: "Error",
        description: err.message || "Failed to generate share link",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Get share content for platforms
   */
  const getShareContent = (): ShareContent => {
    const title = productName
      ? `Check out "${productName}" on my Wishbee wishlist!`
      : `Check out my Wishbee wishlist: ${wishlistTitle}`

    return {
      title,
      description: productName
        ? `I added ${productName} to my wishlist on Wishbee.ai`
        : `View my wishlist "${wishlistTitle}" on Wishbee.ai`,
      url: shareUrl || "",
    }
  }

  /**
   * Handle copy link
   */
  const handleCopyLink = async () => {
    if (!shareUrl) return

    const success = await copyToClipboard(shareUrl)
    if (success) {
      setCopied(true)
      toast({
        title: "Link copied!",
        description: "The share link has been copied to your clipboard.",
      })
      setTimeout(() => setCopied(false), 3000)
    } else {
      toast({
        title: "Failed to copy",
        description: "Please manually copy the link.",
        variant: "destructive",
      })
    }
  }

  /**
   * Handle WhatsApp share
   */
  const handleWhatsAppShare = () => {
    if (!shareUrl) return
    const url = getWhatsAppShareUrl(getShareContent())
    openShareWindow(url, "whatsapp")
  }

  /**
   * Handle SMS/iMessage share
   */
  const handleSmsShare = () => {
    if (!shareUrl) return
    const url = getSmsShareUrl(getShareContent())
    window.location.href = url
  }

  /**
   * Handle Email share
   */
  const handleEmailShare = () => {
    if (!shareUrl) return
    const url = getEmailShareUrl(getShareContent())
    window.location.href = url
  }

  /**
   * Handle native share (mobile)
   */
  const handleNativeShare = async () => {
    if (!shareUrl) return
    const success = await triggerNativeShare(getShareContent())
    if (!success && !isWebShareSupported()) {
      toast({
        title: "Not supported",
        description: "Native share is not available on this device.",
        variant: "destructive",
      })
    }
  }

  /**
   * Handle share to Wishbee group
   */
  const handleWishbeeGroupShare = () => {
    // TODO: Implement group sharing functionality
    toast({
      title: "Coming Soon!",
      description: "Sharing to Wishbee groups will be available soon.",
    })
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border-2 border-[#DAA520]/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header - Same as Additional Specifications */}
        <div className="bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] p-4 border-b-2 border-[#4A2F1A] relative">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 p-1.5 hover:bg-[#4A2F1A] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="text-center px-8">
            <h3 className="text-lg font-bold text-[#F5DEB3] line-clamp-2">
              {productName 
                ? (productName.length > 50 ? productName.substring(0, 50) + '...' : productName)
                : wishlistTitle}
            </h3>
            <p className="text-sm text-[#DAA520] mt-1 font-semibold">
              Share {productName ? "Product" : "Wishlist"}
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 bg-gradient-to-b from-[#F5F1E8] to-white">
          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#DAA520]/20 to-[#F4C430]/20 animate-pulse" />
                <Loader2 className="w-8 h-8 animate-spin text-[#DAA520] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <span className="mt-4 text-[#6B4423] font-medium">Generating share link...</span>
            </div>
          )}

          {/* Error state */}
          {error && !isLoading && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-5 text-center">
              <p className="text-red-600 text-sm font-medium mb-3">{error}</p>
              <Button
                onClick={generateShareLink}
                className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520] rounded-lg shadow-md"
                size="sm"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Share options */}
          {shareUrl && !isLoading && (
            <div className="space-y-4">
              {/* Copy Link Section */}
              <div className="space-y-1.5">
                <Label className="text-[#6B4423] font-semibold text-xs">Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="flex-1 text-[10px] h-8 bg-white border-[#8B5A3C]/30 focus:border-[#DAA520] focus:ring-2 focus:ring-[#DAA520]/20 rounded-lg"
                  />
                  <Button
                    onClick={handleCopyLink}
                    className={`h-8 px-3 transition-all duration-300 rounded-lg shadow-sm hover:shadow-md hover:scale-105 ${
                      copied
                        ? "bg-gradient-to-r from-[#EA580C] to-[#FB923C] text-white"
                        : "bg-gradient-to-r from-[#DAA520] to-[#F4C430] hover:from-[#F4C430] hover:to-[#DAA520] text-[#654321]"
                    }`}
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Share Channels Grid */}
              <div className="space-y-2">
                <Label className="text-[#6B4423] font-semibold text-xs">Share via</Label>
                <div className="grid grid-cols-2 gap-2">
                  {/* WhatsApp - Warm Orange */}
                  <Button
                    onClick={handleWhatsAppShare}
                    className="h-8 bg-gradient-to-r from-[#EA580C] to-[#FB923C] text-white hover:from-[#FB923C] hover:to-[#EA580C] transition-all duration-300 rounded-lg shadow-sm hover:shadow-md hover:scale-105 font-medium text-xs"
                  >
                    <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    WhatsApp
                  </Button>

                  {/* iMessage/SMS - Amber Gold */}
                  <Button
                    onClick={handleSmsShare}
                    className="h-8 bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#78350F] hover:from-[#FBBF24] hover:to-[#F59E0B] transition-all duration-300 rounded-lg shadow-sm hover:shadow-md hover:scale-105 font-medium text-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                    iMessage
                  </Button>

                  {/* Email - Warm Coral */}
                  <Button
                    onClick={handleEmailShare}
                    className="h-8 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white hover:from-[#FF8E53] hover:to-[#FF6B6B] transition-all duration-300 rounded-lg shadow-sm hover:shadow-md hover:scale-105 font-medium text-xs"
                  >
                    <Mail className="w-3.5 h-3.5 mr-1.5" />
                    Email
                  </Button>

                  {/* Native Share (if supported) - Rust/Terracotta */}
                  {isWebShareSupported() && (
                    <Button
                      onClick={handleNativeShare}
                      className="h-8 bg-gradient-to-r from-[#B45309] to-[#D97706] text-white hover:from-[#D97706] hover:to-[#B45309] transition-all duration-300 rounded-lg shadow-sm hover:shadow-md hover:scale-105 font-medium text-xs"
                    >
                      <Smartphone className="w-3.5 h-3.5 mr-1.5" />
                      More
                    </Button>
                  )}

                  {/* Wishbee Group - Golden Honey */}
                  <Button
                    onClick={handleWishbeeGroupShare}
                    className="h-8 bg-gradient-to-r from-[#DAA520] via-[#F4C430] to-[#FF8E53] text-[#654321] hover:from-[#FF8E53] hover:via-[#F4C430] hover:to-[#DAA520] transition-all duration-300 rounded-lg shadow-sm hover:shadow-md hover:scale-105 font-semibold text-xs col-span-2"
                  >
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    Share to Wishbee Group
                  </Button>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Modal Footer - Same as header color */}
        <div className="bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] w-full h-[50px] border-t-2 border-[#4A2F1A]">
        </div>
      </div>
    </div>
  )
}
