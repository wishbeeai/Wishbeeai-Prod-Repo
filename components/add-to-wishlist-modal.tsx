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
  
  // Dynamic product attributes - determined by product type
  const [availableAttributes, setAvailableAttributes] = useState<string[]>([])
  
  // I Wish preference options (Green) - dynamic key-value store
  const [likeAttributes, setLikeAttributes] = useState<Record<string, string>>({})
  const [likeSelected, setLikeSelected] = useState(true) // Expanded by default

  // Alternative preference options (Orange) - dynamic key-value store
  const [altAttributes, setAltAttributes] = useState<Record<string, string>>({})
  const [altSelected, setAltSelected] = useState(true) // Expanded by default
  
  // Legacy state for backward compatibility (will be deprecated)
  const [likeSize, setLikeSize] = useState("")
  const [likeColor, setLikeColor] = useState("")
  const [likeStyle, setLikeStyle] = useState("")
  const [likeConfiguration, setLikeConfiguration] = useState("")
  const [altSize, setAltSize] = useState("")
  const [altColor, setAltColor] = useState("")
  const [altStyle, setAltStyle] = useState("")
  const [altConfiguration, setAltConfiguration] = useState("")
  
  // Track which preference is awaiting extension data
  const [awaitingExtensionFor, setAwaitingExtensionFor] = useState<"like" | "alt" | null>(null)
  
  // Clipped product data from extension - separate for each preference
  const [likeClippedImage, setLikeClippedImage] = useState<string | null>(null)
  const [likeClippedTitle, setLikeClippedTitle] = useState<string | null>(null)
  const [altClippedImage, setAltClippedImage] = useState<string | null>(null)
  const [altClippedTitle, setAltClippedTitle] = useState<string | null>(null)
  
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
      setLikeClippedImage(null)
      setLikeClippedTitle(null)
      setAltClippedImage(null)
      setAltClippedTitle(null)
      setVariantPreference("")
      setPreferenceError("")
      setPastedUrl("")
      // Reset dynamic attributes
      setAvailableAttributes([])
      setLikeAttributes({})
      setAltAttributes({})
      // Reset I Like options (legacy)
      setLikeSize("")
      setLikeColor("")
      setLikeStyle("")
      setLikeConfiguration("")
      setLikeSelected(true) // Keep expanded by default
      // Reset Alternative options (legacy)
      setAltSize("")
      setAltColor("")
      setAltStyle("")
      setAltConfiguration("")
      setAltSelected(true) // Keep expanded by default
      // Reset Ok to buy options
      setOkSize("")
      setOkColor("")
      setOkStyle("")
      setOkConfiguration("")
      setOkSelected(false)
      // Reset awaiting extension state
      setAwaitingExtensionFor(null)
    }
  }, [isOpen])

  // Normalize variant keys to standard display labels
  const normalizeAttributeKey = (key: string): string => {
    const keyLower = key.toLowerCase().replace(/[_\s]+/g, '')
    
    // Map to standard labels
    if (keyLower.includes('color') || keyLower.includes('colour')) return 'Color'
    if (keyLower.includes('size') || keyLower === 'formfactor') return 'Size'
    if (keyLower.includes('style') || keyLower.includes('earplacement') || keyLower === 'headphonestyle') return 'Style'
    if (keyLower.includes('config') || keyLower.includes('pattern')) return 'Configuration'
    if (keyLower.includes('brand')) return 'Brand'
    if (keyLower.includes('material')) return 'Material'
    if (keyLower.includes('connectivity')) return 'Connectivity'
    
    // Return capitalized version of the key
    return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
  }

  // Poll for variant data from the Wishbee browser extension via API
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null

    const checkForVariants = async () => {
      console.log('[Modal] Polling for variants, awaiting:', awaitingExtensionFor)
      try {
        const response = await fetch('/api/extension/save-variants', {
          method: 'GET',
          credentials: 'include',
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('[Modal] API response:', JSON.stringify(data))
          console.log('[Modal] API response image field:', data.image)
          console.log('[Modal] API response has image:', 'image' in data, data.image ? 'yes' : 'no')
          console.log('[Modal] Awaiting extension for:', awaitingExtensionFor)
          
          if (data.variants && Object.keys(data.variants).length > 0) {
            console.log('[Modal] ========================================')
            console.log('[Modal] VARIANTS RECEIVED - awaitingExtensionFor:', awaitingExtensionFor)
            console.log('[Modal] Is this for I Wish?', awaitingExtensionFor === "like")
            console.log('[Modal] Is this for Alternative?', awaitingExtensionFor === "alt")
            console.log('[Modal] Variants:', JSON.stringify(data.variants))
            console.log('[Modal] Image:', data.image?.substring(0, 80))
            console.log('[Modal] ========================================')
            
            // Normalize variants ONLY - show only actual variant options from the product page
            // Do NOT add specifications as attributes - they're not selectable variants
            const normalizedAttributes: Record<string, string> = {}
            
            // Process only actual variants (these are the selectable options on the product page)
            for (const [key, value] of Object.entries(data.variants)) {
              if (value) {
                const normalizedKey = normalizeAttributeKey(key)
                normalizedAttributes[normalizedKey] = value as string
              }
            }
            
            console.log('[Modal] Normalized variants only (no specs):', normalizedAttributes)
            
            // Determine available attribute keys in preferred order
            const preferredOrder = ['Color', 'Size', 'Style', 'Configuration', 'Brand', 'Material']
            const attrKeys = [
              ...preferredOrder.filter(k => normalizedAttributes[k]),
              ...Object.keys(normalizedAttributes).filter(k => !preferredOrder.includes(k))
            ]
            console.log('[Modal] Normalized attribute keys:', attrKeys)
            console.log('[Modal] Normalized attributes:', JSON.stringify(normalizedAttributes))
            
            // ALWAYS update available attributes with the NEW product's variants
            // Each product has its own unique set of variants
            setAvailableAttributes(attrKeys)
            console.log('[Modal] ✅ Updated availableAttributes to:', attrKeys)
            
            // Fill the appropriate fields based on which preference is awaiting
            if (awaitingExtensionFor === "like") {
              console.log('[Modal] ========== I WISH DATA RECEIVED ==========')
              console.log('[Modal] LIKE - Image URL:', data.image)
              console.log('[Modal] LIKE - Timestamp:', data.timestamp)
              
              // Update clipped image and title for I wish
              if (data.image) {
                console.log('[Modal] ✅ Setting likeClippedImage:', data.image)
                setLikeClippedImage(data.image)
              }
              if (data.title) {
                console.log('[Modal] Setting likeClippedTitle:', data.title.substring(0, 50))
                setLikeClippedTitle(data.title)
              }
              
              // Auto-fill I wish fields with normalized attributes
              setLikeAttributes(normalizedAttributes)
              
              // Also set legacy fields for backward compatibility
              if (normalizedAttributes['Size']) setLikeSize(normalizedAttributes['Size'])
              if (normalizedAttributes['Color']) setLikeColor(normalizedAttributes['Color'])
              if (normalizedAttributes['Style']) setLikeStyle(normalizedAttributes['Style'])
              if (normalizedAttributes['Configuration']) setLikeConfiguration(normalizedAttributes['Configuration'])
              setLikeSelected(true)
              
              console.log('[Modal] ✅ Filled I wish fields with extension data:', normalizedAttributes)
              toast({
                title: "Options Received! 🐝",
                description: "I Wish options auto-filled from Wishbee extension.",
              })
            } else if (awaitingExtensionFor === "alt") {
              console.log('[Modal] ========== ALTERNATIVE DATA RECEIVED ==========')
              console.log('[Modal] ALT - Image URL:', data.image)
              console.log('[Modal] ALT - Timestamp:', data.timestamp)
              
              // Update clipped image and title for Alternative
              if (data.image) {
                console.log('[Modal] ✅ Setting altClippedImage:', data.image)
                setAltClippedImage(data.image)
              } else {
                console.log('[Modal] ⚠️ ALT - No image in data!')
              }
              if (data.title) {
                console.log('[Modal] Setting altClippedTitle:', data.title.substring(0, 50))
                setAltClippedTitle(data.title)
              }
              
              // Auto-fill Alternative fields with normalized attributes
              setAltAttributes(normalizedAttributes)
              
              // Also set legacy fields for backward compatibility
              if (normalizedAttributes['Size']) setAltSize(normalizedAttributes['Size'])
              if (normalizedAttributes['Color']) setAltColor(normalizedAttributes['Color'])
              if (normalizedAttributes['Style']) setAltStyle(normalizedAttributes['Style'])
              if (normalizedAttributes['Configuration']) setAltConfiguration(normalizedAttributes['Configuration'])
              setAltSelected(true)
              
              console.log('[Modal] ✅ Filled Alternative fields with extension data:', normalizedAttributes)
              console.log('[Modal] === END ALTERNATIVE ===')
              
              toast({
                title: "Options Received! 🐝",
                description: "Alternative options auto-filled from Wishbee extension.",
              })
            }
            
            // Clear the awaiting state and stop polling
            setAwaitingExtensionFor(null)
            if (pollInterval) {
              clearInterval(pollInterval)
              pollInterval = null
            }
          } else if (data.image || data.title) {
            // Even without variants, if we got image/title, show success
            console.log('[Modal] Got image/title but no variants')
            if (awaitingExtensionFor) {
              // Set the image/title for the correct preference
              if (awaitingExtensionFor === "like") {
                if (data.image) setLikeClippedImage(data.image)
                if (data.title) setLikeClippedTitle(data.title)
                setLikeSelected(true)
              } else if (awaitingExtensionFor === "alt") {
                if (data.image) setAltClippedImage(data.image)
                if (data.title) setAltClippedTitle(data.title)
                setAltSelected(true)
              }
              setAwaitingExtensionFor(null)
              toast({
                title: "Product Clipped! 🐝",
                description: "Product info received. You can manually enter variant options.",
              })
            }
          }
        }
      } catch (e) {
        console.log('[Modal] Polling error:', e)
        // Ignore errors - extension might not have sent data yet
      }
    }

    // Start polling when modal is open and awaiting extension data
    if (isOpen && awaitingExtensionFor) {
      console.log('[Modal] Starting polling for:', awaitingExtensionFor)
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
  }, [isOpen, awaitingExtensionFor, toast])

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
        title: "✓ Added to My Wishlist",
        description: `${extractedProduct.productName} has been added to your wishlist!`,
        variant: "success",
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
        className="bg-white rounded-2xl shadow-2xl w-[512px] max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - 512 x 75 */}
        <div className="w-[512px] h-[75px] bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] px-4 border-b-2 border-[#4A2F1A] flex items-center justify-center relative">
          <h3 className="text-[18px] font-bold text-[#F5DEB3] flex items-center gap-2">
            <Heart className="w-[18px] h-[18px] text-[#F5DEB3]" />
            Choose Your Preferred Options
          </h3>
          <button
            onClick={onClose}
            className="absolute right-4 p-1.5 hover:bg-[#4A2F1A] rounded-full transition-colors"
          >
            <X className="w-[18px] h-[18px] text-[#F5DEB3]" />
          </button>
        </div>

        {/* Single Panel Body */}
        <div className="p-4 overflow-y-auto max-h-[60vh] bg-gradient-to-b from-[#F5F1E8] to-white">
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

{/* I Wish Option Card - Golden Honey (Primary Brand Color) */}
                  <div
                    className={`rounded-lg border-2 transition-all duration-200 ${
                      likeSelected
                        ? "border-[#B8860B] bg-gradient-to-r from-[#DAA520]/30 to-[#F4C430]/25 shadow-md"
                        : "border-[#8B5A3C]/20 bg-white/50 hover:border-[#DAA520]/50"
                    }`}
                  >
                    <div className="w-full p-3 flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321]">
                        ⭐ I Wish
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (extractedProduct?.productLink) {
                            const url = addAffiliateTag(extractedProduct.productLink)
                            window.open(url, '_blank')
                            setLikeSelected(true)
                            setAwaitingExtensionFor("like")
                          }
                        }}
                        className="text-xs text-[#DAA520] font-semibold hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Select
                      </button>
                    </div>
                    
                    {likeSelected && (
                      <div className="px-3 pb-3 space-y-2">
                        <p className="text-[10px] text-[#8B6914] bg-[#DAA520]/10 px-2 py-1 rounded-md border border-[#DAA520]/20 italic mb-2">
                          💡 Click Select to open the product page → choose your preferred options → use the Wishbee extension to clip and auto-fill the information below.
                          {awaitingExtensionFor === "like" && " ⏳ Waiting for extension..."}
                        </p>
                        {/* Product Image & Options Row */}
                        <div className="flex gap-3">
                          {/* Only show image if clipped from extension - no default fallback */}
                          {likeClippedImage && (
                            <img
                              key={likeClippedImage}
                              src={likeClippedImage}
                              alt={likeClippedTitle || 'Selected product'}
                              className="w-16 h-16 object-contain rounded-lg bg-white border border-[#DAA520]/20 flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 space-y-1.5">
                            {/* Dynamic attributes based on product - only show detected variants */}
                            {availableAttributes.length > 0 && (
                              availableAttributes.slice(0, 6).map((attrKey) => (
                                <div key={attrKey} className="flex items-center gap-2">
                                  <Label className="text-xs text-[#6B4423] w-20 font-medium truncate">
                                    {attrKey}:
                                  </Label>
                                  <input
                                    type="text"
                                    value={likeAttributes[attrKey] || ''}
                                    onChange={(e) => setLikeAttributes(prev => ({ ...prev, [attrKey]: e.target.value }))}
                                    placeholder={`Enter ${attrKey.toLowerCase()}`}
                                    className="flex-1 px-2 py-1 text-xs border border-[#DAA520]/30 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#DAA520] text-[#4A2F1A]"
                                  />
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

{/* Alternative Option Card - Warm Amber */}
                  <div
                    className={`rounded-lg border-2 transition-all duration-200 ${
                      altSelected
                        ? "border-[#D97706] bg-gradient-to-r from-[#D97706]/15 to-[#F59E0B]/15"
                        : "border-[#8B5A3C]/20 bg-white/50 hover:border-[#D97706]/50"
                    }`}
                  >
                    <div className="w-full p-3 flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-white">
                        ✓ Alternative
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (extractedProduct?.productLink) {
                            const url = addAffiliateTag(extractedProduct.productLink)
                            window.open(url, '_blank')
                            setAltSelected(true)
                            setAwaitingExtensionFor("alt")
                          }
                        }}
                        className="text-xs text-[#D97706] font-semibold hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Select
                      </button>
                    </div>
                    
                    {altSelected && (
                      <div className="px-3 pb-3 space-y-2">
                        <p className="text-[10px] text-[#92400E] bg-[#D97706]/10 px-2 py-1 rounded-md border border-[#D97706]/20 italic mb-2">
                          💡 Click Select to open the product page → choose your preferred options → use the Wishbee extension to clip and auto-fill the information below.
                          {awaitingExtensionFor === "alt" && " ⏳ Waiting for extension..."}
                        </p>
                        {/* Product Image & Options Row */}
                        <div className="flex gap-3">
                          {/* Only show image if clipped from extension - no default fallback */}
                          {altClippedImage && (
                            <img
                              key={altClippedImage}
                              src={altClippedImage}
                              alt={altClippedTitle || 'Selected product'}
                              className="w-16 h-16 object-contain rounded-lg bg-white border border-[#D97706]/20 flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 space-y-1.5">
                            {/* Dynamic attributes based on product */}
                            {availableAttributes.length > 0 && (
                              availableAttributes.slice(0, 6).map((attrKey) => (
                                <div key={attrKey} className="flex items-center gap-2">
                                  <Label className="text-xs text-[#6B4423] w-20 font-medium truncate">
                                    {attrKey}:
                                  </Label>
                                  <input
                                    type="text"
                                    value={altAttributes[attrKey] || ''}
                                    onChange={(e) => setAltAttributes(prev => ({ ...prev, [attrKey]: e.target.value }))}
                                    placeholder={`Enter ${attrKey.toLowerCase()}`}
                                    className="flex-1 px-2 py-1 text-xs border border-[#D97706]/30 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#D97706] text-[#4A2F1A]"
                                  />
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

{/* Ok to Buy Option Card - Warm Terracotta */}
                  <div className="rounded-lg border-2 border-[#C2410C] bg-gradient-to-r from-[#C2410C]/15 to-[#EA580C]/15">
                    <div className="w-full p-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#C2410C] to-[#EA580C] text-white">
                        💫 Ok to buy
                      </span>
                    </div>
                    <div className="px-3 pb-3">
                      <p className="text-[10px] text-[#9A3412] bg-[#C2410C]/10 px-2 py-1.5 rounded-md border border-[#C2410C]/20 italic">
                        💡 You may purchase this product from another retailer, as long as it aligns with the "I Wish" or "Alternative" preferences.
                      </p>
                    </div>
                  </div>

                  {/* Validation message */}
                  {preferenceError && (
                    <p className="text-xs text-red-500">{preferenceError}</p>
                  )}

                  {/* Action Buttons - Smaller size */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={onClose}
                      className="flex-1 h-8 text-xs rounded-lg border border-[#8B5A3C]/30 text-[#6B4423] font-medium hover:bg-[#8B5A3C]/10 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddToWishlist}
                      disabled={isSaving}
                      className="flex-1 h-8 text-xs bg-gradient-to-r from-[#DAA520] to-[#F4C430] hover:from-[#F4C430] hover:to-[#DAA520] text-[#654321] rounded-lg font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                    >
                      {isSaving ? (
                        <span className="flex items-center justify-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
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

        {/* Footer - 512 x 50 */}
        <div className="w-[512px] h-[50px] bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] border-t-2 border-[#4A2F1A]">
        </div>
      </div>
    </div>
  )
}
