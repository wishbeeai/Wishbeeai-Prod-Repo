"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2,
  CheckCircle,
  ExternalLink,
  ArrowRight,
  X,
  Heart,
} from "lucide-react"

interface Gift {
  id: string
  giftName: string
  productLink?: string
  image?: string
  targetAmount: number
  source?: string
  category?: string
}

interface AddToWishlistModalProps {
  gift: Gift | null
  isOpen: boolean
  onClose: () => void
}

interface ExtractedProduct {
  productName: string
  description?: string
  price: number
  storeName: string
  imageUrl: string
  productLink: string
  attributes: {
    color: string | null
    size: string | null
    brand?: string | null
    material?: string | null
  }
}

// Add affiliate tag to Amazon URLs
const addAffiliateTag = (url: string): string => {
  if (!url) return url
  try {
    const urlObj = new URL(url)
    if (urlObj.hostname.includes('amazon.')) {
      urlObj.searchParams.delete('tag')
      urlObj.searchParams.set('tag', 'wishbeeai-20')
      return urlObj.toString()
    }
    return url
  } catch {
    return url
  }
}

export function AddToWishlistModal({ gift, isOpen, onClose }: AddToWishlistModalProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<1 | 2>(1)
  const [extractedProduct, setExtractedProduct] = useState<ExtractedProduct | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasOpenedRetailer, setHasOpenedRetailer] = useState(false)
  const [variantPreference, setVariantPreference] = useState<"Ideal" | "Alternative" | "Nice to have" | "">("")
  const [preferenceError, setPreferenceError] = useState<string>("")
  const [pastedUrl, setPastedUrl] = useState("")
  const [isExtractingVariants, setIsExtractingVariants] = useState(false)
  
  // I Wish preference options (Green)
  const [likeSize, setLikeSize] = useState("")
  const [likeColor, setLikeColor] = useState("")
  const [likeStyle, setLikeStyle] = useState("")
  const [likeConfiguration, setLikeConfiguration] = useState("")
  const [likeSelected, setLikeSelected] = useState(false)

  // Alternative preference options (Orange)
  const [altSize, setAltSize] = useState("")
  const [altColor, setAltColor] = useState("")
  const [altStyle, setAltStyle] = useState("")
  const [altConfiguration, setAltConfiguration] = useState("")
  const [altSelected, setAltSelected] = useState(false)
  
  // Ok to buy preference options (Coral)
  const [okSize, setOkSize] = useState("")
  const [okColor, setOkColor] = useState("")
  const [okStyle, setOkStyle] = useState("")
  const [okConfiguration, setOkConfiguration] = useState("")
  const [okSelected, setOkSelected] = useState(false)

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setExtractedProduct(null)
      setHasOpenedRetailer(false)
      setVariantPreference("")
      setPreferenceError("")
      setPastedUrl("")
      // Reset I Like options
      setLikeSize("")
      setLikeColor("")
      setLikeStyle("")
      setLikeConfiguration("")
      setLikeSelected(false)
      // Reset Alternative options
      setAltSize("")
      setAltColor("")
      setAltStyle("")
      setAltConfiguration("")
      setAltSelected(false)
      // Reset Ok to buy options
      setOkSize("")
      setOkColor("")
      setOkStyle("")
      setOkConfiguration("")
      setOkSelected(false)
    }
  }, [isOpen])

  // Poll for variant data from the Wishbee browser extension via API
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null

    const checkForVariants = async () => {
      try {
        const response = await fetch('/api/extension/save-variants', {
          method: 'GET',
          credentials: 'include',
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.variants && Object.keys(data.variants).length > 0) {
            // Auto-fill Alternative fields
            if (data.variants.size) setAltSize(data.variants.size)
            if (data.variants.color) setAltColor(data.variants.color)
            if (data.variants.style) setAltStyle(data.variants.style)
            if (data.variants.configuration) setAltConfiguration(data.variants.configuration)
            setAltSelected(true)
            
            toast({
              title: "Options Received! 🐝",
              description: "Alternative options auto-filled from Wishbee extension.",
            })
            
            // Stop polling after receiving data
            if (pollInterval) {
              clearInterval(pollInterval)
              pollInterval = null
            }
          }
        }
      } catch (e) {
        // Ignore errors - extension might not have sent data yet
      }
    }

    // Start polling when modal is open and Alternative is selected
    if (isOpen && altSelected) {
      // Check immediately
      checkForVariants()
      // Then poll every 2 seconds
      pollInterval = setInterval(checkForVariants, 2000)
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [isOpen, altSelected, toast])

  // Extract variants from pasted URL
  const extractVariantsFromUrl = async () => {
    if (!pastedUrl || !pastedUrl.startsWith("http")) {
      toast({
        title: "Invalid URL",
        description: "Please paste a valid product URL",
        variant: "destructive",
      })
      return
    }

    setIsExtractingVariants(true)
    try {
      const response = await fetch("/api/ai/extract-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: pastedUrl }),
      })

      if (!response.ok) throw new Error("Failed to extract product")

      const data = await response.json()
      const extracted = data.productData || data

      // Update extracted product with new data
      if (extracted) {
        setExtractedProduct(prev => ({
          ...prev!,
          productLink: pastedUrl,
          imageUrl: extracted.imageUrl || prev?.imageUrl || "/placeholder.svg",
          price: extracted.price || prev?.price || 0,
        }))

        // Auto-fill variant fields from extracted attributes (for I Wish)
        const attrs = extracted.attributes || {}
        let hasAnyOption = false

        // Size extraction
        const size = attrs.size || attrs.Size || attrs.sizeValue
        if (size) {
          setLikeSize(size)
          hasAnyOption = true
        }

        // Color extraction
        const color = attrs.color || attrs.Color || attrs.colorValue || attrs.colour
        if (color) {
          setLikeColor(color)
          hasAnyOption = true
        }

        // Style extraction
        const style = attrs.style || attrs.Style || attrs.band || attrs.Band || attrs.material || attrs.Material
        if (style) {
          setLikeStyle(style)
          hasAnyOption = true
        }

        // Configuration extraction
        const config = attrs.configuration || attrs.Configuration || attrs.pattern || attrs.Pattern || attrs.model || attrs.Model || attrs.variant || attrs.Variant
        if (config) {
          setLikeConfiguration(config)
          hasAnyOption = true
        }

        // Auto-select I Wish when any option is extracted
        if (hasAnyOption) {
          setLikeSelected(true)
        }

        // Show success message with extracted options
        const extractedOptions = [
          size && `Size: ${size}`,
          color && `Color: ${color}`,
          style && `Style: ${style}`,
          config && `Config: ${config}`,
        ].filter(Boolean)

        toast({
          title: hasAnyOption ? "Options Extracted!" : "Product Updated",
          description: hasAnyOption 
            ? `Found: ${extractedOptions.join(", ")}`
            : "No variant options found. Please enter manually.",
        })
        
        // Move to step 2
        setStep(2)
      }
    } catch (error) {
      console.error("[AddToWishlistModal] Variant extraction error:", error)
      toast({
        title: "Extraction Failed",
        description: "Could not extract options. Please enter them manually.",
        variant: "destructive",
      })
      // Still move to step 2 for manual entry
      setStep(2)
    } finally {
      setIsExtractingVariants(false)
    }
  }

  // Extract product when modal opens
  useEffect(() => {
    if (isOpen && gift?.productLink) {
      extractProductFromUrl(gift.productLink)
    }
  }, [isOpen, gift?.productLink])

  const extractProductFromUrl = async (url: string) => {
    if (!url || !url.startsWith("http")) return

    setIsExtracting(true)
    try {
      const response = await fetch("/api/ai/extract-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) throw new Error("Failed to extract product")

      const data = await response.json()
      const extracted = data.productData || data

      setExtractedProduct({
        productName: extracted.productName || gift?.giftName || "Product",
        description: extracted.description,
        price: extracted.price || gift?.targetAmount || 0,
        storeName: extracted.storeName || gift?.source || "Store",
        imageUrl: extracted.imageUrl || gift?.image || "/placeholder.svg",
        productLink: url,
        attributes: {
          color: extracted.attributes?.color || null,
          size: extracted.attributes?.size || null,
          brand: extracted.attributes?.brand || null,
          material: extracted.attributes?.material || null,
        },
      })
      
      // Pre-fill I Wish options from extracted data
      if (extracted.attributes?.color) setLikeColor(extracted.attributes.color)
      if (extracted.attributes?.size) setLikeSize(extracted.attributes.size)
    } catch (error) {
      console.error("[AddToWishlistModal] Extraction error:", error)
      if (gift) {
        setExtractedProduct({
          productName: gift.giftName,
          price: gift.targetAmount,
          storeName: gift.source || "Store",
          imageUrl: gift.image || "/placeholder.svg",
          productLink: gift.productLink || "",
          attributes: { color: null, size: null },
        })
      }
    } finally {
      setIsExtracting(false)
    }
  }

  const handleOpenRetailer = () => {
    if (gift?.productLink) {
      window.open(addAffiliateTag(gift.productLink), '_blank')
      setHasOpenedRetailer(true)
    }
  }

  const handleContinueAfterReturn = () => {
    setStep(2)
  }

  const handleAddToWishlist = async () => {
    if (!extractedProduct || !gift) {
      toast({
        title: "Error",
        description: "Product data is missing",
        variant: "destructive",
      })
      return
    }

    // Validate that at least one preference is selected
    if (!likeSelected && !altSelected && !okSelected) {
      setPreferenceError("Please select at least one preference option")
      return
    }

    setIsSaving(true)

    try {
      // Get or create a default wishlist
      let wishlistId: string | null = null

      const wishlistsResponse = await fetch("/api/wishlists")
      if (wishlistsResponse.ok) {
        const { wishlists } = await wishlistsResponse.json()
        if (wishlists && wishlists.length > 0) {
          wishlistId = wishlists[0].id
        } else {
          const createResponse = await fetch("/api/wishlists", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "My Wishlist",
              description: "Default wishlist",
              isPublic: false,
            }),
          })
          if (createResponse.ok) {
            const { wishlist } = await createResponse.json()
            wishlistId = wishlist.id
          }
        }
      }

      if (!wishlistId) {
        throw new Error("Failed to get or create wishlist")
      }

      // Build preference options object
      const preferenceOptions = {
        iLike: likeSelected ? {
          size: likeSize || null,
          color: likeColor || null,
          style: likeStyle || null,
          configuration: likeConfiguration || null,
        } : null,
        alternative: altSelected ? {
          size: altSize || null,
          color: altColor || null,
          style: altStyle || null,
          configuration: altConfiguration || null,
        } : null,
        okToBuy: okSelected ? {
          size: okSize || null,
          color: okColor || null,
          style: okStyle || null,
          configuration: okConfiguration || null,
        } : null,
      }

      // Determine primary preference (priority: I Wish > Alternative > Ok to buy)
      const primaryPreference = likeSelected ? "Ideal" : altSelected ? "Alternative" : "Nice to have"

      // Prepare wishlist item data
      const wishlistItemData = {
        wishlistId,
        productName: extractedProduct.productName,
        productUrl: extractedProduct.productLink,
        productPrice: extractedProduct.price,
        productImage: extractedProduct.imageUrl,
        title: extractedProduct.productName,
        product_url: extractedProduct.productLink,
        image_url: extractedProduct.imageUrl,
        list_price: Math.round(extractedProduct.price * 100),
        currency: "USD",
        source: extractedProduct.storeName?.toLowerCase() || "amazon",
        category: gift.category || null,
        quantity: 1,
        preferenceOptions: JSON.stringify(preferenceOptions),
        variantPreference: primaryPreference,
      }

      const response = await fetch("/api/wishlists/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wishlistItemData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add to wishlist")
      }

      toast({
        title: "Success",
        description: `${extractedProduct.productName} has been added to your wishlist!`,
      })

      onClose()
    } catch (error) {
      console.error("[AddToWishlistModal] Add to wishlist error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add to wishlist",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] p-4 border-b-2 border-[#4A2F1A]">
          <div className="flex items-center justify-center relative">
            <h3 className="text-lg font-bold text-[#F5DEB3] flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#F5DEB3]" />
              Choose Your Preferred Options
            </h3>
            <button
              onClick={onClose}
              className="absolute right-0 p-1 hover:bg-[#4A2F1A] rounded-full transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 text-[#F5DEB3]" />
            </button>
          </div>
        </div>

        {/* Two Panel Body */}
        <div className="flex flex-row">
          {/* LEFT PANEL - Product Image */}
          <div className="w-1/3 bg-gradient-to-b from-[#F5F1E8] to-[#E8E0D5] p-6 flex flex-col items-center justify-start border-r border-[#8B5A3C]/20">
            {extractedProduct && (
              <>
                <img
                  src={extractedProduct.imageUrl}
                  alt={extractedProduct.productName}
                  className="w-full max-w-[180px] h-auto object-contain rounded-lg bg-white border border-[#8B5A3C]/20 shadow-lg mb-4"
                />
                <p className="text-base font-bold text-[#DAA520] text-center">
                  ${extractedProduct.price.toFixed(2)}
                </p>
                <p className="text-xs text-[#6B4423] text-center mt-1">
                  From {extractedProduct.storeName}
                </p>
              </>
            )}
            {isExtracting && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#DAA520]" />
              </div>
            )}
          </div>

          {/* RIGHT PANEL - Options & Actions */}
          <div className="w-2/3 p-4 overflow-y-auto max-h-[55vh] bg-gradient-to-b from-[#F5F1E8] to-white">
            {isExtracting ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-[#6B4423]">Loading product details...</p>
              </div>
            ) : (
              <>
                {/* Product Name */}
                {extractedProduct && (
                  <p className="text-sm font-bold text-[#4A2F1A] line-clamp-3 mb-4">
                    {extractedProduct.productName}
                  </p>
                )}

                {/* Preference Level Options */}
              {extractedProduct && (
                <div className="space-y-3">
                  <p className="text-xs text-[#6B4423] mb-2">Select your preferred options for each preference level:</p>

{/* I Wish Option Card - Green */}
                  <div
                    className={`rounded-lg border-2 transition-all duration-200 ${
                      likeSelected
                        ? "border-[#059669] bg-gradient-to-r from-[#059669]/10 to-[#10B981]/10"
                        : "border-[#8B5A3C]/20 bg-white/50 hover:border-[#059669]/50"
                    }`}
                  >
                    <div className="w-full p-3 flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#059669] to-[#10B981] text-white">
                        ⭐ I wish
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (extractedProduct?.productLink) {
                            const url = addAffiliateTag(extractedProduct.productLink)
                            window.open(url, '_blank')
                            setLikeSelected(true)
                          }
                        }}
                        className="text-xs text-[#059669] font-semibold hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Select
                      </button>
                    </div>
                    
                    {likeSelected && (
                      <div className="px-3 pb-3 space-y-2">
                        <p className="text-[10px] text-[#047857] bg-[#059669]/10 px-2 py-1 rounded-md border border-[#059669]/20 italic mb-2">
                          💡 Click Select to open the product page → choose your preferred options → use the Wishbee extension to clip and auto-fill the information below.
                        </p>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-[#6B4423] w-16 font-medium">Size:</Label>
                          <input
                            type="text"
                            value={likeSize}
                            onChange={(e) => setLikeSize(e.target.value)}
                            placeholder="e.g., 45mm, Large"
                            className="flex-1 px-2 py-1 text-xs border border-[#059669]/30 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#059669] text-[#4A2F1A]"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-[#6B4423] w-16 font-medium">Color:</Label>
                          <input
                            type="text"
                            value={likeColor}
                            onChange={(e) => setLikeColor(e.target.value)}
                            placeholder="e.g., Rose Gold"
                            className="flex-1 px-2 py-1 text-xs border border-[#059669]/30 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#059669] text-[#4A2F1A]"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-[#6B4423] w-16 font-medium">Style:</Label>
                          <input
                            type="text"
                            value={likeStyle}
                            onChange={(e) => setLikeStyle(e.target.value)}
                            placeholder="e.g., Sport Band"
                            className="flex-1 px-2 py-1 text-xs border border-[#059669]/30 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#059669] text-[#4A2F1A]"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-[#6B4423] w-16 font-medium">Config:</Label>
                          <input
                            type="text"
                            value={likeConfiguration}
                            onChange={(e) => setLikeConfiguration(e.target.value)}
                            placeholder="e.g., GPS"
                            className="flex-1 px-2 py-1 text-xs border border-[#059669]/30 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#059669] text-[#4A2F1A]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

{/* Alternative Option Card */}
                  <div
                    className={`rounded-lg border-2 transition-all duration-200 ${
                      altSelected
                        ? "border-[#EA580C] bg-gradient-to-r from-[#EA580C]/10 to-[#FB923C]/10"
                        : "border-[#8B5A3C]/20 bg-white/50 hover:border-[#EA580C]/50"
                    }`}
                  >
                    <div className="w-full p-3 flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#EA580C] to-[#FB923C] text-white">
                        ✓ Alternative
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (extractedProduct?.productLink) {
                            const url = addAffiliateTag(extractedProduct.productLink)
                            window.open(url, '_blank')
                            setAltSelected(true)
                          }
                        }}
                        className="text-xs text-[#EA580C] font-semibold hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Select
                      </button>
                    </div>
                    
                    {altSelected && (
                      <div className="px-3 pb-3 space-y-2">
                        <p className="text-[10px] text-[#9A3412] bg-[#EA580C]/10 px-2 py-1 rounded-md border border-[#EA580C]/20 italic mb-2">
                          💡 Click Select to open the product page → choose your preferred options → use the Wishbee extension to clip and auto-fill the information below.
                        </p>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-[#6B4423] w-16 font-medium">Size:</Label>
                          <input
                            type="text"
                            value={altSize}
                            onChange={(e) => setAltSize(e.target.value)}
                            placeholder="e.g., 45mm, Large"
                            className="flex-1 px-2 py-1 text-xs border border-[#EA580C]/30 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#EA580C] text-[#4A2F1A]"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-[#6B4423] w-16 font-medium">Color:</Label>
                          <input
                            type="text"
                            value={altColor}
                            onChange={(e) => setAltColor(e.target.value)}
                            placeholder="e.g., Rose Gold"
                            className="flex-1 px-2 py-1 text-xs border border-[#EA580C]/30 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#EA580C] text-[#4A2F1A]"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-[#6B4423] w-16 font-medium">Style:</Label>
                          <input
                            type="text"
                            value={altStyle}
                            onChange={(e) => setAltStyle(e.target.value)}
                            placeholder="e.g., Sport Band"
                            className="flex-1 px-2 py-1 text-xs border border-[#EA580C]/30 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#EA580C] text-[#4A2F1A]"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-[#6B4423] w-16 font-medium">Config:</Label>
                          <input
                            type="text"
                            value={altConfiguration}
                            onChange={(e) => setAltConfiguration(e.target.value)}
                            placeholder="e.g., GPS"
                            className="flex-1 px-2 py-1 text-xs border border-[#EA580C]/30 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#EA580C] text-[#4A2F1A]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

{/* Ok to Buy Option Card - Always Expanded */}
                  <div className="rounded-lg border-2 border-[#E11D48] bg-gradient-to-r from-[#E11D48]/10 to-[#FB7185]/10">
                    <div className="w-full p-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#E11D48] to-[#FB7185] text-white">
                        💫 Ok to buy
                      </span>
                    </div>
                    <div className="px-3 pb-3">
                      <p className="text-[10px] text-[#9F1239] bg-[#E11D48]/10 px-2 py-1.5 rounded-md border border-[#E11D48]/20 italic">
                        💡 You may purchase this product from another retailer, as long as it aligns with the "I wish" or "Alternative" preferences.
                      </p>
                    </div>
                  </div>

                  {/* Validation message */}
                  {preferenceError && (
                    <p className="text-xs text-red-500">{preferenceError}</p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={onClose}
                      className="flex-1 h-11 rounded-xl border-2 border-[#8B5A3C]/30 text-[#6B4423] font-medium hover:bg-[#8B5A3C]/10 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddToWishlist}
                      disabled={isSaving}
                      className="flex-1 h-11 bg-gradient-to-r from-[#DAA520] to-[#F4C430] hover:from-[#F4C430] hover:to-[#DAA520] text-[#654321] rounded-xl font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                      {isSaving ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Adding...
                        </span>
                      ) : (
                        "Add to My Wishlist"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          </div>
        </div>

        {/* Footer - Same style as Product Specifications */}
        <div className="h-[60px] w-full bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] border-t-2 border-[#4A2F1A] flex items-center justify-center">
          <span className="text-xs text-[#DAA520] font-medium">
            Select your preferred options for gift contributors
          </span>
        </div>
      </div>
    </div>
  )
}
