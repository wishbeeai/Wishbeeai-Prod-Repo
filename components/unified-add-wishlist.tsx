"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Sparkles,
  Package,
  Loader2,
  CheckCircle,
  Upload,
  ShoppingBag,
  X,
  Check,
  Edit2,
  ExternalLink,
  Info,
  AlertCircle,
  Plus,
  Trash2,
  Heart,
  Pencil,
} from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

interface ExtractedProduct {
  productName: string
  description: string
  price: number
  originalPrice?: number
  storeName: string
  imageUrl: string
  productLink: string
  quantity: number
  rating?: number
  reviewCount?: number
  amazonChoice?: boolean
  bestSeller?: boolean
  overallPick?: boolean
  attributes: {
    color: string | null
    size: string | null
    brand: string | null
    material?: string | null
    features?: string | null
    stockStatus?: string | null
    [key: string]: any // Allow additional specification attributes
  }
}

// Helper function to clean HTML entities from values
function cleanHtmlEntities(value: string): string {
  return value
    .replace(/&lrm;|&rlm;|&zwj;|&zwnj;|&#x200e;|&#x200f;|&#8206;|&#8207;/gi, '')
    .replace(/[\u200E\u200F\u200C\u200D\u2066\u2067\u2068\u2069]/g, '')
    .trim()
}

// Helper function to get filtered specifications (matching /gifts/trending page)
function getFilteredSpecifications(attributes: Record<string, any> | undefined): Array<[string, string]> {
  if (!attributes) return []
  
  // Only exclude variant-related keys (same as trending page)
  const excludedKeys = [
    'color', 'size', 'style', 'brand', 'sizeOptions', 'colorVariants', 
    'combinedVariants', 'styleOptions', 'styleName', 'patternName'
  ]
  
  return Object.entries(attributes)
    .filter(([key, value]) => {
      const keyLower = key.toLowerCase()
      // Exclude if in explicit list
      if (excludedKeys.some(ek => keyLower === ek.toLowerCase())) return false
      // Exclude null/undefined/empty
      if (value === null || value === undefined || value === '') return false
      // Exclude arrays and objects
      if (Array.isArray(value) || typeof value === 'object') return false
      // Exclude garbage values
      if (isGarbageValue(String(value))) return false
      return true
    })
    .map(([key, value]) => [key, cleanHtmlEntities(String(value))] as [string, string])
}

// Helper to check if a value is garbage data
function isGarbageValue(value: string): boolean {
  if (!value || value.length > 200) return true
  const garbagePatterns = [
    /items?\s+in\s+cart/i,
    /percent\s+of\s+reviews/i,
    /out\s+of\s+5\s+stars/i,
    /customer\s+reviews/i,
    /add\s+to\s+(cart|list|shopping)/i,
    /buy\s+now/i,
    /back\s+to\s+top/i,
    /div:|span:|class:|id:/i,
    /background:|linear-gradient|transparent/i,
    /<[^>]+>/,
  ]
  return garbagePatterns.some(pattern => pattern.test(value))
}

// Helper function to clean garbage data from extracted values
function cleanExtractedValue(value: string | null | undefined): string | null {
  if (!value) return null
  
  let str = String(value).trim()
  
  // Remove HTML entities like &lrm; (Left-to-Right Mark), &rlm; (Right-to-Left Mark), etc.
  str = str.replace(/&lrm;|&rlm;|&zwj;|&zwnj;|&#x200e;|&#x200f;|&#8206;|&#8207;/gi, '')
  // Also remove the actual Unicode characters (LRM, RLM, ZWJ, ZWNJ)
  str = str.replace(/[\u200E\u200F\u200C\u200D\u2066\u2067\u2068\u2069]/g, '')
  str = str.trim()
  
  // If too long (likely garbage), reject
  if (str.length > 100) return null
  
  // If contains multiple sentences or paragraphs, reject
  if ((str.match(/\./g) || []).length > 2) return null
  
  // Garbage patterns to reject
  const garbagePatterns = [
    /items?\s+in\s+cart/i,
    /percent\s+of\s+reviews/i,
    /out\s+of\s+5\s+stars/i,
    /customer\s+reviews/i,
    /add\s+to\s+(cart|list|shopping)/i,
    /buy\s+now/i,
    /back\s+to\s+top/i,
    /about\s+this\s+item/i,
    /buying\s+options/i,
    /appleCare/i,
    /monthly.*\$/i,
    /\$\d+\.\d+/,
    /widget\s+jump/i,
    /jump\s+link/i,
    /shift,\s*alt/i,
    /Amazon\s+US\s+Home/i,
    /<[^>]+>/,  // HTML tags
    /div:|span:|class:|id:/i,  // CSS/HTML fragments
    /background:|linear-gradient|transparent/i,
    /^\d+\s*$/, // Just numbers
    /^\|/, // Starts with pipe
    /^0\s/, // Starts with 0 space
  ]
  
  for (const pattern of garbagePatterns) {
    if (pattern.test(str)) return null
  }
  
  // If it contains too many numbers mixed with text (likely garbage)
  const numberCount = (str.match(/\d+/g) || []).length
  const wordCount = str.split(/\s+/).length
  if (numberCount > 3 && wordCount > 5) return null
  
  return str
}

export function UnifiedAddWishlist() {
  const { toast } = useToast()
  const router = useRouter()

  const [productInput, setProductInput] = useState("")
  const [productUrl, setProductUrl] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [extractedProduct, setExtractedProduct] = useState<ExtractedProduct | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [productSuggestions, setProductSuggestions] = useState<any[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    color: "",
    size: "",
    quantity: "1",
    storeName: "",
    buyLink: "",
    imageUrl: "",
    category: "",
  })
  const [showExtractedProduct, setShowExtractedProduct] = useState(false)
  const [priceComparisonNote, setPriceComparisonNote] = useState<string>("")

  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isEditingProduct, setIsEditingProduct] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [manualPrice, setManualPrice] = useState("")
  const [manualSize, setManualSize] = useState("")
  const [manualColor, setManualColor] = useState("")
  const [manualMaterial, setManualMaterial] = useState("")

  // Custom fields for Product Details
  const [customFields, setCustomFields] = useState<Array<{ id: string; key: string; value: string }>>([])

  // I Wish clipped data from extension
  const [likeClippedImage, setLikeClippedImage] = useState<string | null>(null)
  const [likeClippedTitle, setLikeClippedTitle] = useState<string | null>(null)
  const [likeAttributes, setLikeAttributes] = useState<Record<string, string>>({})
  const [isWaitingForLikeClip, setIsWaitingForLikeClip] = useState(false)

  // Alternative clipped data from extension
  const [altClippedImage, setAltClippedImage] = useState<string | null>(null)
  const [altClippedTitle, setAltClippedTitle] = useState<string | null>(null)
  const [altAttributes, setAltAttributes] = useState<Record<string, string>>({})
  const [isWaitingForAltClip, setIsWaitingForAltClip] = useState(false)
  
  // I Wish variant options - dynamic key-value pairs preserving original labels from retailer
  const [iWishVariants, setIWishVariants] = useState<Record<string, string>>({})

  // Custom fields and notes for I Wish
  const [likeCustomFields, setLikeCustomFields] = useState<Array<{ id: string; key: string; value: string }>>([])
  const [likeNotes, setLikeNotes] = useState("")
  
  // Custom fields and notes for Alternative
  const [altCustomFields, setAltCustomFields] = useState<Array<{ id: string; key: string; value: string }>>([])
  const [altNotes, setAltNotes] = useState("")

  // Editable specifications
  const [editableSpecs, setEditableSpecs] = useState<Record<string, string>>({})
  const [isEditingSpecs, setIsEditingSpecs] = useState(false)

  // Preference level for variants - REQUIRED to prevent delays in gift purchases
  // This helps contributors know exactly which variant to purchase, avoiding wrong purchases and delays
  const [variantPreference, setVariantPreference] = useState<"I Like" | "Alternative" | "Optional" | "">("")
  const [preferenceError, setPreferenceError] = useState<string>("")
  const [isExtractingVariants, setIsExtractingVariants] = useState(false)

  useEffect(() => {
    const storedUrl = sessionStorage.getItem("pendingProductUrl")
    if (storedUrl) {
      setProductInput(storedUrl)
      sessionStorage.removeItem("pendingProductUrl")
      toast({
        title: "Product URL Restored",
        description: "Your product URL has been restored. Click 'Extract Product Details' to continue.",
      })
    }
  }, [toast])

  useEffect(() => {
    const searchProducts = async () => {
      if (productInput.trim().length >= 3 && !productInput.startsWith("http")) {
        setIsLoadingSuggestions(true)
        setShowSuggestions(true)

        try {
          const response = await fetch("/api/ai/search-products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: productInput,
              limit: 5,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            setProductSuggestions(data.products || [])
          }
        } catch (error) {
          console.error("[v0] Product search error:", error)
        } finally {
          setIsLoadingSuggestions(false)
        }
      } else {
        setProductSuggestions([])
        setShowSuggestions(false)
      }
    }

    const timeoutId = setTimeout(searchProducts, 500)
    return () => clearTimeout(timeoutId)
  }, [productInput])

  // Helper to normalize attribute keys (same as modal)
  const normalizeAttributeKey = (key: string): string => {
    const keyLower = key.toLowerCase().trim()
    if (keyLower.includes('color') || keyLower === 'colour') return 'Color'
    if (keyLower.includes('size') || keyLower === 'dimensions') return 'Size'
    if (keyLower.includes('style') || keyLower === 'design') return 'Style'
    if (keyLower.includes('config') || keyLower === 'variant') return 'Configuration'
    if (keyLower.includes('pattern')) return 'Pattern'
    if (keyLower.includes('material')) return 'Material'
    if (keyLower.includes('capacity') || keyLower.includes('storage')) return 'Capacity'
    // Capitalize first letter
    return key.charAt(0).toUpperCase() + key.slice(1)
  }

  // Poll for I Wish clip data from extension
  useEffect(() => {
    if (!isWaitingForLikeClip) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/extension/save-variants')
        if (response.ok) {
          const data = await response.json()
          if (data.variants && Object.keys(data.variants).length > 0) {
            console.log('[I Wish Clip] Received variants:', data.variants)
            
            // Normalize variant keys
            const normalizedAttributes: Record<string, string> = {}
            for (const [key, value] of Object.entries(data.variants)) {
              if (value) {
                const normalizedKey = normalizeAttributeKey(key)
                normalizedAttributes[normalizedKey] = value as string
              }
            }
            
            // Found clipped data for I Wish
            setLikeAttributes(normalizedAttributes)
            if (data.image) setLikeClippedImage(data.image)
            if (data.title) setLikeClippedTitle(data.title)
            setIsWaitingForLikeClip(false)
            
            toast({
              title: "I Wish Options Captured! 🐝",
              description: "Your preferred options have been saved.",
            })
          }
        }
      } catch (error) {
        console.error('[I Wish Clip] Polling error:', error)
      }
    }, 1000)

    // Stop polling after 60 seconds
    const timeout = setTimeout(() => {
      setIsWaitingForLikeClip(false)
      clearInterval(pollInterval)
    }, 60000)

    return () => {
      clearInterval(pollInterval)
      clearTimeout(timeout)
    }
  }, [isWaitingForLikeClip, toast])

  // Poll for Alternative clip data from extension
  useEffect(() => {
    if (!isWaitingForAltClip) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/extension/save-variants')
        if (response.ok) {
          const data = await response.json()
          if (data.variants && Object.keys(data.variants).length > 0) {
            console.log('[Alt Clip] Received variants:', data.variants)
            
            // Filter and normalize variant keys - remove garbage data
            const normalizedAttributes: Record<string, string> = {}
            const seenValues = new Set<string>()
            
            // Garbage patterns to filter out - for KEYS only
            const garbageKeyPatterns = [
              /\$\d+/,                    // Contains price like $593.87
              /option from/i,             // "1 option from $593.87"
              /^\d+\s+option/i,           // "1 option..."
              /see available/i,           // "See available options"
              /^\d+$/,                    // Pure numbers
            ]
            
            // Valid variant keys we want to keep
            const validVariantKeys = ['color', 'size', 'style', 'set', 'configuration', 'pattern', 'material', 'capacity', 'band', 'connector', 'type']
            
            for (const [key, value] of Object.entries(data.variants)) {
              if (!value || typeof value !== 'string') continue
              
              const keyLower = key.toLowerCase().trim()
              
              // Skip if key matches garbage patterns
              if (garbageKeyPatterns.some(p => p.test(key))) {
                console.log('[Alt Clip] Skipping garbage key:', key)
                continue
              }
              
              // Skip if key is not a valid variant key
              if (!validVariantKeys.some(vk => keyLower.includes(vk))) {
                console.log('[Alt Clip] Skipping non-variant key:', key)
                continue
              }
              
              // FIRST: Clean the value - remove extra whitespace and price info BEFORE checking if it's garbage
              let cleanedValue = value
                .replace(/\s+/g, ' ')                    // Normalize whitespace
                .replace(/\$[\d,.]+/g, '')              // Remove prices
                .replace(/\d+\s*option[s]?\s*from/gi, '') // Remove "X options from"
                .replace(/see available options?/gi, '') // Remove "see available"
                .trim()
              
              // For style/configuration keys, extract just Lightning/USB-C if present
              if (keyLower.includes('style') || keyLower.includes('configuration') || keyLower.includes('connector')) {
                // Check for Lightning or USB-C in the value
                const connectorMatch = cleanedValue.match(/\b(Lightning|USB-C|USB Type-C)\b/i)
                if (connectorMatch) {
                  cleanedValue = connectorMatch[1]
                  console.log('[Alt Clip] Extracted connector type:', cleanedValue)
                }
              }
              
              // Now check if the CLEANED value is still garbage
              if (!cleanedValue || cleanedValue.length < 2 || cleanedValue.length > 100) {
                console.log('[Alt Clip] Skipping empty/invalid cleaned value:', key, '=', cleanedValue)
                continue
              }
              
              // Skip garbage words that are clearly not variant options
              const garbageWords = ['price', 'option', 'select', 'choose', 'available', 'buy', 'cart', 'add', 'from', 'shipping', 'delivery']
              if (garbageWords.includes(cleanedValue.toLowerCase())) {
                console.log('[Alt Clip] Skipping garbage word value:', key, '=', cleanedValue)
                continue
              }
              
              // Skip duplicate values
              if (seenValues.has(cleanedValue.toLowerCase())) {
                console.log('[Alt Clip] Skipping duplicate value:', key, '=', cleanedValue)
                continue
              }
              seenValues.add(cleanedValue.toLowerCase())
              
              const normalizedKey = normalizeAttributeKey(key)
              normalizedAttributes[normalizedKey] = cleanedValue
            }
            
            console.log('[Alt Clip] Cleaned attributes:', normalizedAttributes)
            
            // Found clipped data for Alternative
            setAltAttributes(normalizedAttributes)
            
            // Check if the clipped image is a valid product image (not a color swatch or placeholder)
            // Color swatches and placeholders are typically very small images with specific URL patterns
            const isInvalidProductImage = (imageUrl: string): boolean => {
              if (!imageUrl) return true
              const url = imageUrl.toLowerCase()
              
              // Amazon color swatch and placeholder patterns
              // Be careful not to filter out valid product images!
              const invalidPatterns = [
                /_us\d{2,3}_/i,       // _US40_, _US50_, etc. (small thumbnails) 
                /_sx\d{2}_/i,         // _SX38_, etc. (very small - 2 digits only)
                /_sy\d{2}_/i,         // _SY38_, etc. (very small - 2 digits only)
                /_ss\d{2}_/i,         // _SS40_, etc. (very small - 2 digits only)
                /swatch/i,            // Contains "swatch"
                /\+\+/,               // Contains ++ (like 01++SjnuXRL)
                /transparent/i,       // Transparent placeholder
                /blank/i,             // Blank image
                /placeholder/i,       // Placeholder
                /spacer/i,            // Spacer image
                /pixel/i,             // Tracking pixel
              ]
              
              // Check if URL matches any invalid pattern
              if (invalidPatterns.some(pattern => pattern.test(url))) {
                return true
              }
              
              // Check if image ID looks like a placeholder
              const imageIdMatch = url.match(/\/images\/I\/([^.]+)\./i)
              if (imageIdMatch && imageIdMatch[1]) {
                const imageId = imageIdMatch[1]
                // Valid Amazon product images typically have IDs like 41XxYzAbCdE, 71ABcDeFgHi, etc.
                // They start with digits like 31, 41, 51, 61, 71, 81, 91
                // Placeholders often start with 0 and have weird IDs like 01++SjnuXRL
                if (imageId.startsWith('0') && (imageId.includes('+') || imageId.length < 8)) {
                  console.log('[Alt Clip] Invalid placeholder image ID detected:', imageId)
                  return true
                }
              }
              
              return false
            }
            
            // Log received image for debugging
            console.log('[Alt Clip] Received image URL:', data.image?.substring(0, 100))
            
            // Use the clipped image only if it's a valid product image
            // Do NOT fall back to main product image - Alternative should have its own distinct image
            if (data.image && !isInvalidProductImage(data.image)) {
              setAltClippedImage(data.image)
              console.log('[Alt Clip] ✅ Using clipped product image:', data.image?.substring(0, 80))
            } else {
              // Log why the image was rejected
              if (data.image) {
                const imageIdMatch = data.image.match(/\/images\/I\/([^.]+)\./i)
                console.log('[Alt Clip] ⚠️ Image rejected - URL:', data.image?.substring(0, 80))
                console.log('[Alt Clip] ⚠️ Image ID:', imageIdMatch?.[1] || 'not found')
              }
              // Keep Alternative image empty if clipped image is invalid
              console.log('[Alt Clip] Clipped image is invalid/placeholder, Alternative image will be empty')
            }
            if (data.title) setAltClippedTitle(data.title)
            setIsWaitingForAltClip(false)
            
            toast({
              title: "🐝 Alternative Options Captured!",
              description: "Your alternative preferences have been saved.",
              variant: "warm",
            })
          }
        }
      } catch (error) {
        console.error('[Alt Clip] Polling error:', error)
      }
    }, 1000)

    // Stop polling after 60 seconds
    const timeout = setTimeout(() => {
      setIsWaitingForAltClip(false)
      clearInterval(pollInterval)
    }, 60000)

    return () => {
      clearInterval(pollInterval)
      clearTimeout(timeout)
    }
  }, [isWaitingForAltClip, toast])

  // Auto-extract function that takes URL directly (used for paste)
  const handleAutoExtract = async (url: string) => {
    if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
      return
    }

    setIsExtracting(true)
    setSearchResults([])
    setShowExtractedProduct(false)

    try {
      console.log("[v0] (AUTO) Auto-extracting product from URL:", url)

      const extractResponse = await fetch("/api/ai/extract-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      if (!extractResponse.ok) {
        throw new Error("Failed to extract product from URL")
      }

      const extractedData = await extractResponse.json()
      console.log("[v0] Product auto-extracted:", extractedData)
      console.log("[v0] All attributes from API (auto):", JSON.stringify(extractedData.attributes, null, 2))

      // Clean only garbage values, but preserve all valid attributes
      const cleanedAttributes: Record<string, any> = {}
      if (extractedData.attributes) {
        for (const [key, value] of Object.entries(extractedData.attributes)) {
          if (value !== null && value !== undefined && value !== '') {
            const cleaned = cleanExtractedValue(String(value))
            if (cleaned) {
              cleanedAttributes[key] = cleaned
            } else if (typeof value === 'string' && value.length < 100 && !isGarbageValue(value)) {
              // Keep values that aren't garbage
              cleanedAttributes[key] = value
            }
          }
        }
      }
      
      console.log("[v0] (AUTO) Cleaned attributes:", JSON.stringify(cleanedAttributes, null, 2))
      console.log("[v0] (AUTO) ALL raw attributes from API:", JSON.stringify(extractedData.attributes || {}, null, 2))
      
      // Extract variant options from the product TITLE (most reliable for Apple Watch, etc.)
      const title = extractedData.productName || ''
      console.log("[v0] (AUTO) Parsing title for variants:", title)
      
      // Parse title for Apple Watch format: "[GPS + Cellular 42mm] ... with Silver Aluminum Case with Purple Fog Sport Band - S/M"
      let titleColor = ''
      let titleSize = ''
      let titleStyle = ''
      let titleConfig = ''
      
      // Extract size from title - multiple patterns
      // Pattern 1: Watch sizes (42mm, 46mm)
      const watchSizeMatch = title.match(/\b(\d+mm)\b/i)
      if (watchSizeMatch) {
        titleSize = watchSizeMatch[1]
        console.log("[v0] (AUTO) Title extracted watch size:", titleSize)
      }
      
      // Pattern 2: Band sizes (S/M, M/L, etc.)
      const bandSizeMatch = title.match(/\b(S\/M|M\/L|L\/XL|XS|XL)\b/i)
      if (bandSizeMatch) {
        titleSize = titleSize ? `${titleSize} + ${bandSizeMatch[1]}` : bandSizeMatch[1]
        console.log("[v0] (AUTO) Title extracted band size:", bandSizeMatch[1])
      }
      
      // Pattern 3: Kitchen appliance sizes (3 Quart, 6 Qt, 8-Quart, etc.)
      if (!titleSize) {
        const kitchenSizeMatch = title.match(/\b(\d+(?:\.\d+)?)\s*[-]?\s*(Quart|Qt|Quarts|Cup|Cups|Liter|Liters|L|Gallon|Gallons|Oz|Ounce|Ounces)\b/i)
        if (kitchenSizeMatch) {
          titleSize = `${kitchenSizeMatch[1]} ${kitchenSizeMatch[2]}`
          console.log("[v0] (AUTO) Title extracted kitchen size:", titleSize)
        }
      }
      
      // Pattern 4: General inch/feet sizes (24 inch, 55", 6 ft, etc.)
      if (!titleSize) {
        const inchSizeMatch = title.match(/\b(\d+(?:\.\d+)?)\s*[-]?\s*(inch|inches|"|in\.|ft|feet|foot)\b/i)
        if (inchSizeMatch) {
          const unit = inchSizeMatch[2] === '"' ? 'inch' : inchSizeMatch[2]
          titleSize = `${inchSizeMatch[1]} ${unit}`
          console.log("[v0] (AUTO) Title extracted inch/ft size:", titleSize)
        }
      }
      
      // Extract configuration from title (GPS, GPS + Cellular)
      const configMatch = title.match(/\[(GPS\s*\+?\s*Cellular|GPS)(?:\s+\d+mm)?\]/i)
      if (configMatch) {
        titleConfig = configMatch[1].trim()
        console.log("[v0] (AUTO) Title extracted configuration:", titleConfig)
      }
      
      // Extract case color/material from title (e.g., "Silver Aluminum Case", "Rose Gold Titanium Case")
      const caseMatch = title.match(/with\s+((?:Rose\s+Gold|Silver|Space\s+Gr[ae]y|Starlight|Midnight|Gold|Jet\s+Black|Natural|Slate|Black|Blue|Pink|Purple)\s+(?:Titanium|Alumini?um|Stainless\s+Steel)\s+Case)/i)
      if (caseMatch) {
        titleColor = caseMatch[1].trim()
        console.log("[v0] (AUTO) Title extracted case color:", titleColor)
      }
      
      // Extract color from end of title for AirPods Max and other products (e.g., "– Pink", "- Blue")
      console.log("[v0] (AUTO) Checking for end color in title:", title.substring(title.length - 30))
      if (!titleColor) {
        const endColorMatch = title.match(/[–\-—]\s*(Pink|Purple|Blue|Green|Orange|Midnight|Starlight|Silver|Space\s*Gr[ae]y|Sky\s*Blue|Red|White|Black|Gold|Rose\s*Gold)\s*$/i)
        if (endColorMatch) {
          titleColor = endColorMatch[1].trim()
          console.log("[v0] (AUTO) Title extracted end color (dash pattern):", titleColor)
        } else {
          const lastPart = title.substring(title.length - 50)
          const colorWordMatch = lastPart.match(/\b(Pink|Purple|Blue|Green|Orange|Midnight|Starlight|Silver|Space\s*Gr[ae]y|Sky\s*Blue|Red|White|Black|Gold|Rose\s*Gold)\b/i)
          if (colorWordMatch) {
            titleColor = colorWordMatch[1].trim()
            console.log("[v0] (AUTO) Title extracted color from last 50 chars:", titleColor)
          }
        }
      }
      
      // Extract band from title (e.g., "Purple Fog Sport Band - S/M")
      const bandMatch = title.match(/Case\s+with\s+([\w\s]+(?:Sport\s+Band|Sport\s+Loop|Milanese\s+Loop|Solo\s+Loop|Braided\s+Solo\s+Loop|Link\s+Bracelet|Ocean\s+Band|Alpine\s+Loop|Trail\s+Loop))/i)
      if (bandMatch) {
        titleStyle = bandMatch[1].trim()
        console.log("[v0] (AUTO) Title extracted band/style:", titleStyle)
      }
      
      // Generic color extraction: Look for colors in pipe/comma/dash-separated title patterns
      // This catches colors like "Cherry Crush", "Ginger Snap", etc.
      if (!titleColor) {
        // Pattern 1: Look for pipe-separated color (e.g., "Brand | Ginger Snap | Model")
        const pipeSegments = title.split('|').map(s => s.trim())
        if (pipeSegments.length >= 2) {
          for (let i = 1; i < pipeSegments.length - 1; i++) {
            const segment = pipeSegments[i]
            if (segment.length < 30 && !segment.match(/\d{3,}|[A-Z]{2,}\d+|\d+\s*(gb|tb|mm|inch|hz|w|v)/i)) {
              titleColor = segment
              console.log("[v0] (AUTO) Title extracted color from pipe pattern:", titleColor)
              break
            }
          }
          if (!titleColor && pipeSegments.length === 2) {
            const lastSegment = pipeSegments[1]
            if (lastSegment.length < 30 && !lastSegment.match(/\d{3,}|[A-Z]{2,}\d+/i)) {
              titleColor = lastSegment
              console.log("[v0] (AUTO) Title extracted color from last pipe segment:", titleColor)
            }
          }
        }
        
        // Pattern 2: Look for comma-separated color at end
        if (!titleColor) {
          const commaColorMatch = title.match(/,\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*$/i)
          if (commaColorMatch && commaColorMatch[1].length < 30) {
            const potentialColor = commaColorMatch[1].trim()
            if (!potentialColor.match(/\d|inch|mm|gb|tb|pack|count|set|kit|bundle|edition|version|model/i)) {
              titleColor = potentialColor
              console.log("[v0] (AUTO) Title extracted color from comma pattern:", titleColor)
            }
          }
        }
        
        // Pattern 3: Look for dash-separated color at end
        if (!titleColor) {
          const dashColorMatch = title.match(/[-–—]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*$/i)
          if (dashColorMatch && dashColorMatch[1].length < 30) {
            const potentialColor = dashColorMatch[1].trim()
            if (!potentialColor.match(/\d|inch|mm|gb|tb|pack|count|set|kit|bundle|edition|version|model/i)) {
              titleColor = potentialColor
              console.log("[v0] (AUTO) Title extracted color from dash pattern:", titleColor)
            }
          }
        }
      }
      
      // Build dynamic variants object preserving original labels from the retailer
      // Only include variant-like attributes (not specifications)
      // Note: 'material' removed - it's typically a specification, not a variant option
      const variantKeys = ['color', 'size', 'style', 'configuration', 'set', 'pattern', 'band', 'capacity', 'connector', 'type', 'finish']
      const specificationPatterns = [
        /\d+\s*(gb|tb|mb)/i, // Storage specs
        /\d+\s*(mah|wh)/i,   // Battery specs
        /5g|lte|wifi|bluetooth/i, // Connectivity
        /\d+\s*(hz|inch|"|cm|mm$)/i, // Display specs (but not sizes like 42mm for watches)
      ]
      
      const attrs = cleanedAttributes
      const dynamicVariants: Record<string, string> = {}
      
      // First, add title-extracted values with their original-ish labels
      if (titleColor) dynamicVariants['Color'] = titleColor
      if (titleSize) dynamicVariants['Size'] = titleSize
      if (titleStyle) dynamicVariants['Style'] = titleStyle
      if (titleConfig) dynamicVariants['Configuration'] = titleConfig
      
      // If no size from title, check API attributes for size/Size/sizeValue
      if (!dynamicVariants['Size']) {
        const apiSize = attrs.size || attrs.Size || attrs.sizeValue || attrs.size_name
        if (apiSize && typeof apiSize === 'string' && apiSize.length < 100) {
          dynamicVariants['Size'] = apiSize.trim()
          console.log("[v0] (AUTO) Size from API attributes:", dynamicVariants['Size'])
        }
      }
      
      // Check for connector type in title (Lightning vs USB-C for AirPods, etc.)
      const connectorMatch = title.match(/\b(Lightning|USB-C|USB Type-C)\b/i)
      if (connectorMatch && !dynamicVariants['Style']) {
        dynamicVariants['Style'] = connectorMatch[1]
        console.log("[v0] (AUTO) Title extracted connector style:", connectorMatch[1])
      }
      
      // For AirPods Max and other Apple products, detect style from URL or set default
      // AirPods Max Lightning: B08PZJ8FZ8, B0DGJJDFPR (various colors)
      // AirPods Max USB-C: B0DGJ7XCRM, B0DGJRXCK5 (various colors)
      const titleLower = title.toLowerCase()
      const isAirPodsMax = titleLower.includes('airpods max')
      const isAppleProduct = titleLower.includes('apple') || titleLower.includes('airpods') || titleLower.includes('iphone') || titleLower.includes('ipad') || titleLower.includes('macbook')
      
      console.log("[v0] Product detection - isAirPodsMax:", isAirPodsMax, "isAppleProduct:", isAppleProduct)
      
      if (isAirPodsMax) {
        // Detect color from ASIN for AirPods Max
        // Lightning ASINs: Pink, Space Gray, Silver, Green, Sky Blue
        // USB-C ASINs: Midnight, Starlight, Blue, Orange, Purple
        const airPodsMaxColors: Record<string, string> = {
          // Lightning versions
          'B08PZJ8FZ8': 'Pink',
          'B08PZD76NP': 'Space Gray',
          'B08PZJN7BD': 'Silver',
          'B08PZHMKX5': 'Green',
          'B08PZG12P3': 'Sky Blue',
          // USB-C versions
          'B0DGJ7XCRM': 'Midnight',
          'B0DGJRXCK5': 'Starlight',
          'B0DGJNZK82': 'Blue',
          'B0DGJJZZ61': 'Orange',
          'B0DGJS6LC2': 'Purple',
          'B0DGJPB4F9': 'Pink',
          'B0DGJTXWL3': 'Space Gray',
          'B0DGJMT8GL': 'Silver',
        }
        
        // Detect color from ASIN
        if (!dynamicVariants['Color']) {
          for (const [asin, color] of Object.entries(airPodsMaxColors)) {
            if (url.includes(asin)) {
              dynamicVariants['Color'] = color
              console.log("[v0] AirPods Max color from ASIN:", color)
              break
            }
          }
        }
        
        // Always set Style for AirPods Max
        if (!dynamicVariants['Style']) {
          const usbCAsins = ['B0DGJ7XCRM', 'B0DGJRXCK5', 'B0DGJNZK82', 'B0DGJJZZ61', 'B0DGJS6LC2', 'B0DGJPB4F9', 'B0DGJTXWL3', 'B0DGJMT8GL']
          const isUSBC = usbCAsins.some(asin => url.includes(asin))
          dynamicVariants['Style'] = isUSBC ? 'USB-C' : 'Lightning'
          console.log("[v0] AirPods Max default style:", dynamicVariants['Style'])
        }
        
        // Always set default AppleCare for AirPods Max
        if (!dynamicVariants['Set']) {
          dynamicVariants['Set'] = 'Without AppleCare+'
          console.log("[v0] AirPods Max default AppleCare:", dynamicVariants['Set'])
        }
      } else if (isAppleProduct) {
        // For other Apple products, also set default AppleCare if not detected
        if (!dynamicVariants['Set']) {
          dynamicVariants['Set'] = 'Without AppleCare+'
          console.log("[v0] Apple product default AppleCare:", dynamicVariants['Set'])
        }
      }
      
      // Check for AppleCare/Set in title
      if (title.toLowerCase().includes('without applecare')) {
        dynamicVariants['Set'] = 'Without AppleCare+'
      } else if (title.toLowerCase().includes('applecare+')) {
        const appleCareMatch = title.match(/(?:with\s+)?(AppleCare\+[^,.\]]*)/i)
        if (appleCareMatch) {
          dynamicVariants['Set'] = appleCareMatch[1].trim()
        }
      }
      
      // Check URL for AppleCare indication (Amazon encodes this in th= parameter sometimes)
      // Also check if URL contains keywords indicating AppleCare selection
      const urlLower = url.toLowerCase()
      if (!dynamicVariants['Set']) {
        if (urlLower.includes('without') && urlLower.includes('applecare')) {
          dynamicVariants['Set'] = 'Without AppleCare+'
          console.log("[v0] Found 'Without AppleCare' in URL")
        } else if (urlLower.includes('applecare')) {
          dynamicVariants['Set'] = 'With AppleCare+'
          console.log("[v0] Found 'AppleCare' in URL")
        }
      }
      
      // FIRST: Search ALL attributes for AppleCare values (regardless of key name)
      // Also search for keys that contain protection/warranty/plan/set/applecare
      console.log("[v0] Searching all attributes for AppleCare variants...")
      const protectionKeyPatterns = ['set', 'protection', 'warranty', 'applecare', 'plan', 'care', 'coverage']
      
      for (const [key, value] of Object.entries(attrs)) {
        if (!value || typeof value !== 'string') continue
        const keyLower = key.toLowerCase()
        const valueLower = value.toLowerCase()
        
        // Check if the KEY contains protection-related terms
        const isProtectionKey = protectionKeyPatterns.some(pattern => keyLower.includes(pattern))
        
        // Check if this value contains AppleCare information OR if key is protection-related
        if (valueLower.includes('applecare') || valueLower.includes('without applecare') || isProtectionKey) {
          const cleanedValue = value
            .replace(/&lrm;|&rlm;|&zwj;|&zwnj;|&#x200e;|&#x200f;|&#8206;|&#8207;/gi, '')
            .replace(/[\u200E\u200F\u200C\u200D\u2066\u2067\u2068\u2069]/g, '')
            .trim()
          if (cleanedValue && !dynamicVariants['Set']) {
            // Use the original key from the retailer if it's a meaningful protection key
            const displayKey = isProtectionKey ? key : 'Set'
            dynamicVariants[displayKey] = cleanedValue
            console.log(`[v0] Found protection/AppleCare variant - key: '${key}', value:`, cleanedValue)
          }
        }
      }
      
      // Garbage values to filter out from variants
      const garbageStyleValues = ['square', 'rectangle', 'round', 'oval', 'diamond', 'circle', 'triangle', 'form', 'shape']
      const garbageValueWords = ['price', 'option', 'select', 'choose', 'available', 'buy', 'cart', 'add', 'from', 'shipping', 'delivery', 'base', 'default', 'standard', 'basic', 'regular', 'normal', 'original', 'main']
      const garbageColorValues = ['base', 'default', 'standard', 'basic', 'regular', 'normal', 'original', 'main', 'primary', 'secondary', 'none', 'n/a', 'na', 'other', 'misc', 'classic']
      
      // Add attributes from API that look like variants (preserving their original keys)
      for (const [key, value] of Object.entries(attrs)) {
        if (!value || typeof value !== 'string') continue
        const keyLower = key.toLowerCase()
        const valueLower = value.toLowerCase()
        
        // Skip if we already have this from title extraction or AppleCare detection
        if (dynamicVariants[key] || dynamicVariants[keyLower] || dynamicVariants[key.charAt(0).toUpperCase() + key.slice(1)]) continue
        
        // Skip garbage values for style
        if (keyLower.includes('style') && garbageStyleValues.includes(valueLower)) {
          console.log(`[v0] Skipping garbage style value: ${value}`)
          continue
        }
        
        // Skip garbage values for color
        if (keyLower.includes('color') && garbageColorValues.includes(valueLower)) {
          console.log(`[v0] Skipping garbage color value: ${value}`)
          continue
        }
        
        // Skip garbage values that are clearly not variant options
        if (garbageValueWords.includes(valueLower) || valueLower.length < 2 || valueLower.length > 100) {
          console.log(`[v0] Skipping garbage value (auto): ${key}=${value}`)
          continue
        }
        
        // Skip values containing price patterns
        if (/\$[\d,.]+/.test(value) || /\d+\s*option/i.test(value)) {
          console.log(`[v0] Skipping price-containing value (auto): ${key}=${value}`)
          continue
        }
        
        // Check if this looks like a variant key
        const isVariantKey = variantKeys.some(vk => keyLower.includes(vk))
        
        // Skip if value looks like a specification
        const isSpecValue = specificationPatterns.some(pattern => pattern.test(value))

        if (isVariantKey && !isSpecValue) {
          // Clean HTML entities like &lrm; from values
          const cleanedValue = value
            .replace(/&lrm;|&rlm;|&zwj;|&zwnj;|&#x200e;|&#x200f;|&#8206;|&#8207;/gi, '')
            .replace(/[\u200E\u200F\u200C\u200D\u2066\u2067\u2068\u2069]/g, '')
            .trim()
          if (cleanedValue) {
            dynamicVariants[key] = cleanedValue
          }
        }
      }
      
      // Also check for Set/AppleCare by specific key names (fallback)
      if (!dynamicVariants['Set']) {
        const setKeys = ['set', 'Set', 'appleCare', 'AppleCare', 'protection', 'Protection', 'warranty', 'Warranty', 'plan', 'Plan']
        for (const setKey of setKeys) {
          if (attrs[setKey] && typeof attrs[setKey] === 'string') {
            const cleanedSetValue = String(attrs[setKey])
              .replace(/&lrm;|&rlm;|&zwj;|&zwnj;|&#x200e;|&#x200f;|&#8206;|&#8207;/gi, '')
              .replace(/[\u200E\u200F\u200C\u200D\u2066\u2067\u2068\u2069]/g, '')
              .trim()
            if (cleanedSetValue) {
              dynamicVariants['Set'] = cleanedSetValue
              console.log(`[v0] Found Set from key '${setKey}':`, cleanedSetValue)
              break
            }
          }
        }
      }

      setIWishVariants(dynamicVariants)

      console.log("[v0] Final I Wish variants (auto):", dynamicVariants)

      setFormData({
        title: extractedData.productName || "",
        description: extractedData.description || "",
        price: extractedData.price?.toString() || "",
        imageUrl: extractedData.imageUrl || "",
        category: extractedData.category || "",
        size: cleanedAttributes.size || "",
        color: cleanedAttributes.color || "",
        quantity: "1",
        storeName: extractedData.storeName || "",
        buyLink: extractedData.productLink || url,
      })

      // Log rating from API for debugging - IMPORTANT: Rating must match what API returns
      console.log("[v0] ⭐ API returned rating:", extractedData.rating, "reviewCount:", extractedData.reviewCount)
      console.log("[v0] ⭐ Full extractedData:", JSON.stringify({
        rating: extractedData.rating,
        reviewCount: extractedData.reviewCount,
        reviewStar: extractedData.reviewStar,
        attributes: extractedData.attributes ? { rating: extractedData.attributes.rating } : null
      }))
      
      // CRITICAL: Validate rating is reasonable (if API returns garbage, log it)
      if (extractedData.rating && (extractedData.rating < 1 || extractedData.rating > 5)) {
        console.error("[v0] ⚠️ INVALID RATING FROM API:", extractedData.rating)
      }

      // Set extracted product with all cleaned attributes
      // IMPORTANT: Preserve the exact rating from the API - do not modify it
      setExtractedProduct({
        ...extractedData,
        attributes: cleanedAttributes,
        // Ensure rating is preserved exactly as received from API
        rating: extractedData.rating,
        reviewCount: extractedData.reviewCount,
      })
      console.log("[v0] ⭐ Set extractedProduct with rating:", extractedData.rating)
      setShowExtractedProduct(true)
      
      // Initialize editable specifications from extracted attributes
      const specs = getFilteredSpecifications(cleanedAttributes)
      const specsObj: Record<string, string> = {}
      specs.forEach(([key, value]) => {
        specsObj[key] = value
      })
      setEditableSpecs(specsObj)
      setIsEditingSpecs(false)

      toast({
        title: "🐝 Product Extracted!",
        description: extractedData.notice || "Product details extracted successfully. Review and add to your wishlist.",
        variant: "warm",
      })
    } catch (error) {
      console.error("[v0] Auto-extraction error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to extract product",
        variant: "destructive",
      })
    } finally {
      setIsExtracting(false)
    }
  }

  const handleExtractProduct = async () => {
    if (!productInput.trim()) {
      toast({
        title: "Error",
        description: "Please paste a product URL",
        variant: "destructive",
      })
      return
    }

    if (!productInput.startsWith("http://") && !productInput.startsWith("https://")) {
      toast({
        title: "Error",
        description: "Please paste a valid product URL (starting with http:// or https://)",
        variant: "destructive",
      })
      return
    }

    setIsExtracting(true)
    setSearchResults([])
    setShowExtractedProduct(false)

    try {
      console.log("[v0] Extracting product from URL:", productInput)

      const extractResponse = await fetch("/api/ai/extract-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: productInput }),
      })

      if (!extractResponse.ok) {
        throw new Error("Failed to extract product from URL")
      }

      const extractedData = await extractResponse.json()
      console.log("[v0] Product extracted:", extractedData)
      console.log("[v0] All attributes from API:", JSON.stringify(extractedData.attributes, null, 2))

      // Clean only garbage values, but preserve all valid attributes
      const cleanedAttributes: Record<string, any> = {}
      if (extractedData.attributes) {
        for (const [key, value] of Object.entries(extractedData.attributes)) {
          if (value !== null && value !== undefined && value !== '') {
            const cleaned = cleanExtractedValue(String(value))
            if (cleaned) {
              cleanedAttributes[key] = cleaned
            } else if (typeof value === 'string' && value.length < 100 && !isGarbageValue(value)) {
              // Keep values that aren't garbage
              cleanedAttributes[key] = value
            }
          }
        }
      }
      
      console.log("[v0] Cleaned attributes:", JSON.stringify(cleanedAttributes, null, 2))
      
      // Extract variant options from the product TITLE (most reliable for Apple Watch, etc.)
      const title = extractedData.productName || ''
      console.log("[v0] (MANUAL) Parsing title for variants:", title)
      
      // Parse title for Apple Watch format: "[GPS + Cellular 42mm] ... with Silver Aluminum Case with Purple Fog Sport Band - S/M"
      let titleColor = ''
      let titleSize = ''
      let titleStyle = ''
      let titleConfig = ''
      
      // Extract size from title - multiple patterns
      // Pattern 1: Watch sizes (42mm, 46mm)
      const watchSizeMatch = title.match(/\b(\d+mm)\b/i)
      if (watchSizeMatch) {
        titleSize = watchSizeMatch[1]
        console.log("[v0] (MANUAL) Title extracted watch size:", titleSize)
      }
      
      // Pattern 2: Band sizes (S/M, M/L, etc.)
      const bandSizeMatch = title.match(/\b(S\/M|M\/L|L\/XL|XS|XL)\b/i)
      if (bandSizeMatch) {
        titleSize = titleSize ? `${titleSize} + ${bandSizeMatch[1]}` : bandSizeMatch[1]
        console.log("[v0] (MANUAL) Title extracted band size:", bandSizeMatch[1])
      }
      
      // Pattern 3: Kitchen appliance sizes (3 Quart, 6 Qt, 8-Quart, etc.)
      if (!titleSize) {
        const kitchenSizeMatch = title.match(/\b(\d+(?:\.\d+)?)\s*[-]?\s*(Quart|Qt|Quarts|Cup|Cups|Liter|Liters|L|Gallon|Gallons|Oz|Ounce|Ounces)\b/i)
        if (kitchenSizeMatch) {
          titleSize = `${kitchenSizeMatch[1]} ${kitchenSizeMatch[2]}`
          console.log("[v0] (MANUAL) Title extracted kitchen size:", titleSize)
        }
      }
      
      // Pattern 4: General inch/feet sizes (24 inch, 55", 6 ft, etc.)
      if (!titleSize) {
        const inchSizeMatch = title.match(/\b(\d+(?:\.\d+)?)\s*[-]?\s*(inch|inches|"|in\.|ft|feet|foot)\b/i)
        if (inchSizeMatch) {
          const unit = inchSizeMatch[2] === '"' ? 'inch' : inchSizeMatch[2]
          titleSize = `${inchSizeMatch[1]} ${unit}`
          console.log("[v0] (MANUAL) Title extracted inch/ft size:", titleSize)
        }
      }
      
      // Extract configuration from title (GPS, GPS + Cellular)
      const configMatch = title.match(/\[(GPS\s*\+?\s*Cellular|GPS)(?:\s+\d+mm)?\]/i)
      if (configMatch) {
        titleConfig = configMatch[1].trim()
        console.log("[v0] (MANUAL) Title extracted configuration:", titleConfig)
      }
      
      // Extract case color/material from title (e.g., "Silver Aluminum Case", "Rose Gold Titanium Case")
      const caseMatch = title.match(/with\s+((?:Rose\s+Gold|Silver|Space\s+Gr[ae]y|Starlight|Midnight|Gold|Jet\s+Black|Natural|Slate|Black|Blue|Pink|Purple)\s+(?:Titanium|Alumini?um|Stainless\s+Steel)\s+Case)/i)
      if (caseMatch) {
        titleColor = caseMatch[1].trim()
        console.log("[v0] (MANUAL) Title extracted case color:", titleColor)
      }
      
      // Extract color from end of title for AirPods Max and other products (e.g., "– Pink", "- Blue")
      console.log("[v0] (MANUAL) Checking for end color in title:", title.substring(title.length - 30))
      if (!titleColor) {
        const endColorMatch = title.match(/[–\-—]\s*(Pink|Purple|Blue|Green|Orange|Midnight|Starlight|Silver|Space\s*Gr[ae]y|Sky\s*Blue|Red|White|Black|Gold|Rose\s*Gold)\s*$/i)
        if (endColorMatch) {
          titleColor = endColorMatch[1].trim()
          console.log("[v0] (MANUAL) Title extracted end color (dash pattern):", titleColor)
        } else {
          const lastPart = title.substring(title.length - 50)
          const colorWordMatch = lastPart.match(/\b(Pink|Purple|Blue|Green|Orange|Midnight|Starlight|Silver|Space\s*Gr[ae]y|Sky\s*Blue|Red|White|Black|Gold|Rose\s*Gold)\b/i)
          if (colorWordMatch) {
            titleColor = colorWordMatch[1].trim()
            console.log("[v0] (MANUAL) Title extracted color from last 50 chars:", titleColor)
          }
        }
      }
      
      // Extract band from title (e.g., "Purple Fog Sport Band - S/M")
      const bandMatch = title.match(/Case\s+with\s+([\w\s]+(?:Sport\s+Band|Sport\s+Loop|Milanese\s+Loop|Solo\s+Loop|Braided\s+Solo\s+Loop|Link\s+Bracelet|Ocean\s+Band|Alpine\s+Loop|Trail\s+Loop))/i)
      if (bandMatch) {
        titleStyle = bandMatch[1].trim()
        console.log("[v0] (MANUAL) Title extracted band/style:", titleStyle)
      }
      
      // Generic color extraction: Look for colors in pipe/comma/dash-separated title patterns
      // This catches colors like "Cherry Crush", "Ginger Snap", etc.
      if (!titleColor) {
        // Pattern 1: Look for pipe-separated color (e.g., "Brand | Ginger Snap | Model")
        const pipeSegments = title.split('|').map(s => s.trim())
        if (pipeSegments.length >= 2) {
          for (let i = 1; i < pipeSegments.length - 1; i++) {
            const segment = pipeSegments[i]
            if (segment.length < 30 && !segment.match(/\d{3,}|[A-Z]{2,}\d+|\d+\s*(gb|tb|mm|inch|hz|w|v)/i)) {
              titleColor = segment
              console.log("[v0] (MANUAL) Title extracted color from pipe pattern:", titleColor)
              break
            }
          }
          if (!titleColor && pipeSegments.length === 2) {
            const lastSegment = pipeSegments[1]
            if (lastSegment.length < 30 && !lastSegment.match(/\d{3,}|[A-Z]{2,}\d+/i)) {
              titleColor = lastSegment
              console.log("[v0] (MANUAL) Title extracted color from last pipe segment:", titleColor)
            }
          }
        }
        
        // Pattern 2: Look for comma-separated color at end
        if (!titleColor) {
          const commaColorMatch = title.match(/,\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*$/i)
          if (commaColorMatch && commaColorMatch[1].length < 30) {
            const potentialColor = commaColorMatch[1].trim()
            if (!potentialColor.match(/\d|inch|mm|gb|tb|pack|count|set|kit|bundle|edition|version|model/i)) {
              titleColor = potentialColor
              console.log("[v0] (MANUAL) Title extracted color from comma pattern:", titleColor)
            }
          }
        }
        
        // Pattern 3: Look for dash-separated color at end
        if (!titleColor) {
          const dashColorMatch = title.match(/[-–—]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*$/i)
          if (dashColorMatch && dashColorMatch[1].length < 30) {
            const potentialColor = dashColorMatch[1].trim()
            if (!potentialColor.match(/\d|inch|mm|gb|tb|pack|count|set|kit|bundle|edition|version|model/i)) {
              titleColor = potentialColor
              console.log("[v0] (MANUAL) Title extracted color from dash pattern:", titleColor)
            }
          }
        }
      }
      
      // Build dynamic variants object preserving original labels from the retailer
      // Only include variant-like attributes (not specifications)
      // Note: 'material' removed - it's typically a specification, not a variant option
      const variantKeys = ['color', 'size', 'style', 'configuration', 'set', 'pattern', 'band', 'capacity', 'connector', 'type', 'finish']
      const specificationPatterns = [
        /\d+\s*(gb|tb|mb)/i, // Storage specs
        /\d+\s*(mah|wh)/i,   // Battery specs
        /5g|lte|wifi|bluetooth/i, // Connectivity
        /\d+\s*(hz|inch|"|cm|mm$)/i, // Display specs (but not sizes like 42mm for watches)
      ]
      
      const attrs = cleanedAttributes
      const dynamicVariants: Record<string, string> = {}
      
      // First, add title-extracted values with their original-ish labels
      if (titleColor) dynamicVariants['Color'] = titleColor
      if (titleSize) dynamicVariants['Size'] = titleSize
      if (titleStyle) dynamicVariants['Style'] = titleStyle
      if (titleConfig) dynamicVariants['Configuration'] = titleConfig
      
      // If no size from title, check API attributes for size/Size/sizeValue
      if (!dynamicVariants['Size']) {
        const apiSize = attrs.size || attrs.Size || attrs.sizeValue || attrs.size_name
        if (apiSize && typeof apiSize === 'string' && apiSize.length < 100) {
          dynamicVariants['Size'] = apiSize.trim()
          console.log("[v0] (MANUAL) Size from API attributes:", dynamicVariants['Size'])
        }
      }
      
      // Check for connector type in title (Lightning vs USB-C for AirPods, etc.)
      const connectorMatch = title.match(/\b(Lightning|USB-C|USB Type-C)\b/i)
      if (connectorMatch && !dynamicVariants['Style']) {
        dynamicVariants['Style'] = connectorMatch[1]
        console.log("[v0] (MANUAL) Title extracted connector style:", connectorMatch[1])
      }
      
      // For AirPods Max and other Apple products, detect style from URL or set default
      const titleLower = title.toLowerCase()
      const isAirPodsMax = titleLower.includes('airpods max')
      const isAppleProduct = titleLower.includes('apple') || titleLower.includes('airpods') || titleLower.includes('iphone') || titleLower.includes('ipad') || titleLower.includes('macbook')
      
      console.log("[v0] Product detection (manual) - isAirPodsMax:", isAirPodsMax, "isAppleProduct:", isAppleProduct)
      
      if (isAirPodsMax) {
        // Always set Style for AirPods Max
        if (!dynamicVariants['Style']) {
          const usbCAsins = ['B0DGJ7XCRM', 'B0DGJRXCK5', 'B0DGJNZK82', 'B0DGJJZZ61', 'B0DGJS6LC2', 'B0DGJPB4F9', 'B0DGJTXWL3', 'B0DGJMT8GL']
          const isUSBC = usbCAsins.some(asin => productInput.includes(asin))
          dynamicVariants['Style'] = isUSBC ? 'USB-C' : 'Lightning'
          console.log("[v0] AirPods Max default style:", dynamicVariants['Style'])
        }
        
        // Always set default AppleCare for AirPods Max
        if (!dynamicVariants['Set']) {
          dynamicVariants['Set'] = 'Without AppleCare+'
          console.log("[v0] AirPods Max default AppleCare:", dynamicVariants['Set'])
        }
      } else if (isAppleProduct) {
        // For other Apple products, also set default AppleCare if not detected
        if (!dynamicVariants['Set']) {
          dynamicVariants['Set'] = 'Without AppleCare+'
          console.log("[v0] Apple product default AppleCare:", dynamicVariants['Set'])
        }
      }
      
      // Check for AppleCare/Set in title
      if (title.toLowerCase().includes('without applecare')) {
        dynamicVariants['Set'] = 'Without AppleCare+'
      } else if (title.toLowerCase().includes('applecare+')) {
        const appleCareMatch = title.match(/(?:with\s+)?(AppleCare\+[^,.\]]*)/i)
        if (appleCareMatch) {
          dynamicVariants['Set'] = appleCareMatch[1].trim()
        }
      }
      
      // Check URL for AppleCare indication
      const urlLower = productInput.toLowerCase()
      if (!dynamicVariants['Set']) {
        if (urlLower.includes('without') && urlLower.includes('applecare')) {
          dynamicVariants['Set'] = 'Without AppleCare+'
          console.log("[v0] Found 'Without AppleCare' in URL")
        } else if (urlLower.includes('applecare')) {
          dynamicVariants['Set'] = 'With AppleCare+'
          console.log("[v0] Found 'AppleCare' in URL")
        }
      }
      
      // FIRST: Search ALL attributes for AppleCare values (regardless of key name)
      // Also search for keys that contain protection/warranty/plan/set/applecare
      console.log("[v0] Searching all attributes for AppleCare variants (manual extract)...")
      const protectionKeyPatterns = ['set', 'protection', 'warranty', 'applecare', 'plan', 'care', 'coverage']
      
      for (const [key, value] of Object.entries(attrs)) {
        if (!value || typeof value !== 'string') continue
        const keyLower = key.toLowerCase()
        const valueLower = value.toLowerCase()
        
        // Check if the KEY contains protection-related terms
        const isProtectionKey = protectionKeyPatterns.some(pattern => keyLower.includes(pattern))
        
        // Check if this value contains AppleCare information OR if key is protection-related
        if (valueLower.includes('applecare') || valueLower.includes('without applecare') || isProtectionKey) {
          const cleanedValue = value
            .replace(/&lrm;|&rlm;|&zwj;|&zwnj;|&#x200e;|&#x200f;|&#8206;|&#8207;/gi, '')
            .replace(/[\u200E\u200F\u200C\u200D\u2066\u2067\u2068\u2069]/g, '')
            .trim()
          if (cleanedValue && !dynamicVariants['Set']) {
            // Use the original key from the retailer if it's a meaningful protection key
            const displayKey = isProtectionKey ? key : 'Set'
            dynamicVariants[displayKey] = cleanedValue
            console.log(`[v0] Found protection/AppleCare variant - key: '${key}', value:`, cleanedValue)
          }
        }
      }
      
      // Garbage values to filter out from variants
      const garbageStyleValues = ['square', 'rectangle', 'round', 'oval', 'diamond', 'circle', 'triangle', 'form', 'shape']
      const garbageValueWords = ['price', 'option', 'select', 'choose', 'available', 'buy', 'cart', 'add', 'from', 'shipping', 'delivery', 'base', 'default', 'standard', 'basic', 'regular', 'normal', 'original', 'main']
      const garbageColorValues = ['base', 'default', 'standard', 'basic', 'regular', 'normal', 'original', 'main', 'primary', 'secondary', 'none', 'n/a', 'na', 'other', 'misc', 'classic']
      
      // Add attributes from API that look like variants (preserving their original keys)
      for (const [key, value] of Object.entries(attrs)) {
        if (!value || typeof value !== 'string') continue
        const keyLower = key.toLowerCase()
        const valueLower = value.toLowerCase()
        
        // Skip if we already have this from title extraction or AppleCare detection
        if (dynamicVariants[key] || dynamicVariants[keyLower] || dynamicVariants[key.charAt(0).toUpperCase() + key.slice(1)]) continue
        
        // Skip garbage values for style
        if (keyLower.includes('style') && garbageStyleValues.includes(valueLower)) {
          console.log(`[v0] Skipping garbage style value: ${value}`)
          continue
        }
        
        // Skip garbage values that are clearly not variant options
        if (garbageValueWords.includes(valueLower) || valueLower.length < 2 || valueLower.length > 100) {
          console.log(`[v0] Skipping garbage value: ${key}=${value}`)
          continue
        }
        
        // Skip values containing price patterns
        if (/\$[\d,.]+/.test(value) || /\d+\s*option/i.test(value)) {
          console.log(`[v0] Skipping price-containing value: ${key}=${value}`)
          continue
        }
        
        // Check if this looks like a variant key
        const isVariantKey = variantKeys.some(vk => keyLower.includes(vk))
        
        // Skip if value looks like a specification
        const isSpecValue = specificationPatterns.some(pattern => pattern.test(value))

        if (isVariantKey && !isSpecValue) {
          // Clean HTML entities like &lrm; from values
          const cleanedValue = value
            .replace(/&lrm;|&rlm;|&zwj;|&zwnj;|&#x200e;|&#x200f;|&#8206;|&#8207;/gi, '')
            .replace(/[\u200E\u200F\u200C\u200D\u2066\u2067\u2068\u2069]/g, '')
            .trim()
          if (cleanedValue) {
            dynamicVariants[key] = cleanedValue
          }
        }
      }
      
      // Also check for Set/AppleCare by specific key names (fallback)
      if (!dynamicVariants['Set']) {
        const setKeys = ['set', 'Set', 'appleCare', 'AppleCare', 'protection', 'Protection', 'warranty', 'Warranty', 'plan', 'Plan']
        for (const setKey of setKeys) {
          if (attrs[setKey] && typeof attrs[setKey] === 'string') {
            const cleanedSetValue = String(attrs[setKey])
              .replace(/&lrm;|&rlm;|&zwj;|&zwnj;|&#x200e;|&#x200f;|&#8206;|&#8207;/gi, '')
              .replace(/[\u200E\u200F\u200C\u200D\u2066\u2067\u2068\u2069]/g, '')
              .trim()
            if (cleanedSetValue) {
              dynamicVariants['Set'] = cleanedSetValue
              console.log(`[v0] Found Set from key '${setKey}':`, cleanedSetValue)
              break
            }
          }
        }
      }

      setIWishVariants(dynamicVariants)

      console.log("[v0] Final I Wish variants:", dynamicVariants)

      setFormData({
        title: extractedData.productName || "",
        description: extractedData.description || "",
        price: extractedData.price?.toString() || "",
        imageUrl: extractedData.imageUrl || "",
        category: extractedData.category || "",
        size: cleanedAttributes.size || "",
        color: cleanedAttributes.color || "",
        quantity: "1",
        storeName: extractedData.storeName || "",
        buyLink: extractedData.productLink || productInput,
      })

      // Log rating from API for debugging - IMPORTANT: Rating must match what API returns
      console.log("[v0] ⭐ API returned rating (manual):", extractedData.rating, "reviewCount:", extractedData.reviewCount)
      console.log("[v0] ⭐ Full extractedData (manual):", JSON.stringify({
        rating: extractedData.rating,
        reviewCount: extractedData.reviewCount,
        reviewStar: extractedData.reviewStar,
        attributes: extractedData.attributes ? { rating: extractedData.attributes.rating } : null
      }))
      
      // CRITICAL: Validate rating is reasonable (if API returns garbage, log it)
      if (extractedData.rating && (extractedData.rating < 1 || extractedData.rating > 5)) {
        console.error("[v0] ⚠️ INVALID RATING FROM API (manual):", extractedData.rating)
      }

      // Set extracted product with all cleaned attributes
      // IMPORTANT: Preserve the exact rating from the API - do not modify it
      setExtractedProduct({
        ...extractedData,
        attributes: cleanedAttributes,
        // Ensure rating is preserved exactly as received from API
        rating: extractedData.rating,
        reviewCount: extractedData.reviewCount,
      })
      console.log("[v0] ⭐ Set extractedProduct with rating (manual):", extractedData.rating)
      setShowExtractedProduct(true)
      
      // Initialize editable specifications from extracted attributes
      const specs = getFilteredSpecifications(cleanedAttributes)
      const specsObj: Record<string, string> = {}
      specs.forEach(([key, value]) => {
        specsObj[key] = value
      })
      setEditableSpecs(specsObj)
      setIsEditingSpecs(false)

      toast({
        title: "🐝 Product Extracted!",
        description: extractedData.notice || "Product details extracted successfully. Review and add to your wishlist.",
        variant: "warm",
      })
    } catch (error) {
      console.error("[v0] Extraction error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to extract product",
        variant: "destructive",
      })
    } finally {
      setIsExtracting(false)
    }
  }

  const handleSelectProduct = (product: any) => {
    console.log("[v0] Product selected:", product.productName, "Image:", product.imageUrl)

    // Clean garbage data from product attributes
    const cleanedSize = cleanExtractedValue(product.size)
    const cleanedColor = cleanExtractedValue(product.color)
    const cleanedBrand = cleanExtractedValue(product.brand)

    setFormData({
      title: product.productName,
      description: product.description,
      price: product.price.toString(),
      color: cleanedColor || "",
      size: cleanedSize || "",
      quantity: "1",
      storeName: product.storeName,
      buyLink: product.productUrl,
      imageUrl: product.imageUrl,
      category: product.category || "",
    })

    setExtractedProduct({
      productName: product.productName,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      storeName: product.storeName,
      imageUrl: product.imageUrl,
      productLink: product.productUrl,
      quantity: 1,
      rating: product.rating,
      reviewCount: product.reviewCount,
      amazonChoice: product.amazonChoice,
      bestSeller: product.bestSeller,
      overallPick: product.overallPick,
      attributes: {
        color: cleanedColor,
        size: cleanedSize,
        brand: cleanedBrand,
      },
    })

    setShowExtractedProduct(true)
    setSearchResults([])
    setShowSuggestions(false)
    setProductSuggestions([])

    toast({
      title: "Product Selected",
      description: `${product.productName} from ${product.storeName} has been added to the form`,
    })
  }

  const handleGenerateImage = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a product title first",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingImage(true)

    try {
      const response = await fetch("/api/ai/generate-gift-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftName: formData.title }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate image")
      }

      const data = await response.json()
      setFormData({ ...formData, imageUrl: data.imageUrl })
      toast({
        title: "Success",
        description: "Image generated!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleEnhanceDescription = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a product title first",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingDescription(true)

    try {
      const response = await fetch("/api/ai/enhance-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: formData.title,
          currentDescription: formData.description,
          price: formData.price,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to enhance description")
      }

      const data = await response.json()
      setFormData({ ...formData, description: data.description })
      toast({
        title: "Success",
        description: "Description enhanced!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to enhance description",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingDescription(false)
    }
  }

  const handleSaveToWishlist = async () => {
    if (!formData.title || !formData.price || !formData.imageUrl || !formData.color || !formData.size) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Title, Price, Image, Color, Size)",
        variant: "destructive",
      })
      return
    }

    // Validate preference levels - REQUIRED to prevent delays in gift purchases
    // Without preference levels, contributors may hesitate or purchase wrong variants, causing delays
    // Validate preference level if product has variants
    if ((extractedProduct?.attributes?.color || extractedProduct?.attributes?.size) && !variantPreference) {
      setPreferenceError("Preference level is required. This ensures contributors know which variant to purchase, preventing delays in buying gifts.")
      toast({
        title: "Preference Level Required",
        description: "Please select a preference level for the product variants. This prevents delays in gift purchases by ensuring contributors know exactly which variant to buy.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      console.log("[v0] Saving to wishlist:", formData)

      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftName: formData.title,
          currentPrice: Number.parseFloat(formData.price),
          description: formData.description,
          productImageUrl: formData.imageUrl,
          storeName: formData.storeName,
          productLink: formData.buyLink,
          category: formData.category,
          color: formData.color,
          size: formData.size,
          quantity: Number.parseInt(formData.quantity) || 1,
          // Preference level - required to prevent delays in gift purchases
          // This helps contributors know exactly which variant to purchase
          variantPreference: variantPreference || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save to wishlist")
      }

      const result = await response.json()
      console.log("[v0] Wishlist save result:", result)

      toast({
        title: "Success",
        description: `${formData.title} has been added to your wishlist!`,
      })

      setFormData({
        title: "",
        description: "",
        price: "",
        color: "",
        size: "",
        quantity: "1",
        storeName: "",
        buyLink: "",
        imageUrl: "",
        category: "",
      })
      setShowExtractedProduct(false)
      setSearchResults([])
      setProductUrl("")
      setProductInput("")
      setExtractedProduct(null)
      // Reset preference level
      setVariantPreference("")
      setPreferenceError("")
    } catch (error) {
      console.error("[v0] Wishlist save error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save to wishlist",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handler to add extracted product directly to wishlist
  const handleAddToWishlistFromExtracted = async () => {
    if (!extractedProduct) {
      toast({
        title: "Error",
        description: "No product extracted. Please extract a product first.",
        variant: "destructive",
      })
      return
    }

    // No longer require variantPreference since I Wish variants are captured in editable fields
    // The I Wish section already captures the user's variant preferences
    
    setIsSaving(true)
    console.log("[v0] Starting to add product to wishlist:", extractedProduct.productName)

    try {
      // First, get or create a default wishlist
      let wishlistId: string | null = null

      // Fetch user's wishlists
      console.log("[v0] Fetching user's wishlists...")
      const wishlistsResponse = await fetch("/api/wishlists")
      console.log("[v0] Wishlists response status:", wishlistsResponse.status)
      
      if (wishlistsResponse.ok) {
        const wishlistsData = await wishlistsResponse.json()
        console.log("[v0] Wishlists data:", wishlistsData)
        const wishlists = wishlistsData.wishlists
        
        if (wishlists && wishlists.length > 0) {
          // Use the first/most recent wishlist
          wishlistId = wishlists[0].id
          console.log("[v0] Using existing wishlist:", wishlistId)
        } else {
          // Create a default wishlist
          console.log("[v0] No wishlists found, creating new one...")
          const createResponse = await fetch("/api/wishlists", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "My Wishlist",
              description: "Default wishlist",
              isPublic: false,
            }),
          })
          console.log("[v0] Create wishlist response status:", createResponse.status)
          
          if (createResponse.ok) {
            const createData = await createResponse.json()
            console.log("[v0] Created wishlist:", createData)
            wishlistId = createData.wishlist?.id
          } else {
            const createError = await createResponse.json()
            console.error("[v0] Failed to create wishlist:", createError)
          }
        }
      } else {
        const errorData = await wishlistsResponse.json()
        console.error("[v0] Failed to fetch wishlists:", errorData)
        
        // Handle unauthorized - user needs to log in
        if (wishlistsResponse.status === 401) {
          toast({
            title: "Please Log In",
            description: "You need to be logged in to add items to your wishlist.",
            variant: "destructive",
          })
          return
        }
        
        throw new Error(errorData.error || "Failed to fetch wishlists")
      }

      if (!wishlistId) {
        throw new Error("Failed to get or create wishlist. Please make sure you are logged in.")
      }
      
      console.log("[v0] Using wishlist ID:", wishlistId)

      // Build preference options with user-entered variant data (dynamic keys)
      const preferenceOptions = {
        iLike: {
          ...iWishVariants, // Spread all dynamic variant key-value pairs
          image: extractedProduct.imageUrl || null,
          title: extractedProduct.productName || null,
          customFields: likeCustomFields.filter(f => f.key && f.value).map(f => ({ key: f.key, value: f.value })),
          notes: likeNotes.trim() || null,
        },
        alternative: Object.keys(altAttributes).length > 0 || altCustomFields.length > 0 || altNotes.trim() ? {
          ...altAttributes,
          image: altClippedImage || null,
          title: altClippedTitle || null,
          customFields: altCustomFields.filter(f => f.key && f.value).map(f => ({ key: f.key, value: f.value })),
          notes: altNotes.trim() || null,
        } : null,
        okToBuy: "You may purchase this product from another retailer, as long as it aligns with the preferences above."
      }
      
      // Log extracted product for debugging
      console.log("[v0] Extracted product details:", {
        rating: extractedProduct.rating,
        reviewCount: extractedProduct.reviewCount,
        amazonChoice: extractedProduct.amazonChoice,
        bestSeller: extractedProduct.bestSeller,
        overallPick: extractedProduct.overallPick,
        badges: extractedProduct.badges,
        originalPrice: extractedProduct.originalPrice,
      })
      
      // Prepare product data for wishlist item
      const wishlistItemData = {
        wishlistId,
        productName: extractedProduct.productName,
        productUrl: extractedProduct.productLink || productInput,
        productPrice: typeof extractedProduct.price === "number" ? extractedProduct.price : Number.parseFloat(extractedProduct.price.toString()),
        productImage: extractedProduct.imageUrl,
        // Map to new format
        title: extractedProduct.productName,
        product_url: extractedProduct.productLink || productInput,
        image_url: extractedProduct.imageUrl,
        list_price: typeof extractedProduct.price === "number" ? Math.round(extractedProduct.price * 100) : Math.round(Number.parseFloat(extractedProduct.price.toString()) * 100),
        currency: "USD",
        source: extractedProduct.storeName?.toLowerCase() || "amazon",
        // Additional fields
        category: formData.category || null,
        quantity: 1,
        // Variant information - use the user-entered values (dynamic keys)
        color: iWishVariants['Color'] || iWishVariants['color'] || extractedProduct.attributes?.color || null,
        size: iWishVariants['Size'] || iWishVariants['size'] || extractedProduct.attributes?.size || null,
        variantPreference: "I Like", // Always use "I Like" for the primary wish
        preferenceOptions: preferenceOptions,
        // Store information for display
        storeName: extractedProduct.storeName || "Amazon",
        originalPrice: extractedProduct.originalPrice || null,
        salePrice: extractedProduct.price || null,
        // Rating - API returns 'rating' not 'reviewStar'
        review_star: extractedProduct.rating || extractedProduct.reviewStar || null,
        review_count: extractedProduct.reviewCount || null,
        // Badges - check multiple possible field names
        badges: extractedProduct.badges || {
          amazonChoice: extractedProduct.amazonChoice || extractedProduct.attributes?.amazonChoice || false,
          bestSeller: extractedProduct.bestSeller || extractedProduct.attributes?.bestSeller || false,
          overallPick: extractedProduct.overallPick || extractedProduct.attributes?.overallPick || false,
        },
        specifications: Object.keys(editableSpecs).length > 0 ? editableSpecs : (extractedProduct.attributes || null),
      }

      // Save to wishlist
      console.log("[v0] Saving item to wishlist with data:", JSON.stringify(wishlistItemData, null, 2))
      
      const response = await fetch("/api/wishlists/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wishlistItemData),
      })
      
      console.log("[v0] Add item response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle duplicate product (409 Conflict)
        if (response.status === 409) {
          toast({
            title: "🐝 Already in Wishlist!",
            description: "This product is already in your wishlist.",
            action: (
              <ToastAction 
                altText="View Wishlist" 
                onClick={() => router.push('/wishlist')}
                className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520] px-3 py-1 rounded-md text-xs font-semibold"
              >
                View Wishlist
              </ToastAction>
            ),
          })
          return
        }
        
        throw new Error(errorData.error || "Failed to add to wishlist")
      }

      const result = await response.json()
      console.log("[v0] Wishlist item added:", result)

      toast({
        title: "✅ Added to My Wishlist!",
        description: `${extractedProduct.productName?.substring(0, 50)}${extractedProduct.productName?.length > 50 ? '...' : ''} has been added.`,
        action: (
          <ToastAction 
            altText="View Wishlist" 
            onClick={() => router.push('/wishlist')}
            className="bg-black text-white hover:bg-gray-800 px-3 py-1 rounded-md text-xs font-semibold"
          >
            View Wishlist
          </ToastAction>
        ),
      })

      // Reset form
      handleCancelExtractedProduct()
    } catch (error) {
      console.error("[v0] Add to wishlist error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add to wishlist",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handler to cancel and reset extracted product
  const handleCancelExtractedProduct = () => {
    setExtractedProduct(null)
    setShowExtractedProduct(false)
    setProductInput("")
    setProductUrl("")
    setVariantPreference("")
    setPreferenceError("")
    setSearchResults([])
    setIsExtracting(false)
    setIsExtractingVariants(false)
    // Reset I Wish variants
    setIWishVariants({})
    // Reset editable specifications
    setEditableSpecs({})
    setIsEditingSpecs(false)
    // Reset Alternative data
    setAltClippedImage(null)
    setAltClippedTitle(null)
    setAltAttributes({})
    setIsWaitingForAltClip(false)
    // Reset custom fields and notes
    setLikeCustomFields([])
    setLikeNotes("")
    setAltCustomFields([])
    setAltNotes("")
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingImage(true)
    try {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setExtractedProduct((prev: any) => ({
          ...prev,
          imageUrl: base64String,
        }))
        toast({
          title: "Success",
          description: "Image uploaded successfully",
        })
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSaveProductEdits = () => {
    setExtractedProduct((prev: any) => ({
      ...prev,
      price: Number.parseFloat(manualPrice) || prev.price,
      attributes: {
        ...prev.attributes,
        color: manualColor || prev.attributes?.color,
        size: manualSize || prev.attributes?.size,
        material: manualMaterial || prev.attributes?.material,
      },
    }))
    setIsEditingProduct(false)
    toast({
      title: "Success",
      description: "Product details updated",
    })
  }

  const handleRefreshProduct = async () => {
    if (!productInput) return

    setIsRefreshing(true)
    try {
      const response = await fetch("/api/ai/extract-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: productInput }),
      })

      if (!response.ok) throw new Error("Failed to refresh product")

      const data = await response.json()
      setExtractedProduct(data)

      toast({
        title: "Success",
        description: "Product details refreshed",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh product details",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-2xl rounded-2xl overflow-hidden border-2 border-gray-200">
      <div className="bg-card border-b border-border p-6">
        <div className="flex flex-row items-center justify-center gap-2">
          <Package className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#DAA520] flex-shrink-0" />
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-foreground whitespace-nowrap">Add Wishlist</h2>
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="productUrl" className="block text-sm font-semibold text-gray-700 mb-2">
              Product URL <span className="text-red-500">*</span>
            </label>
            {/* URL Input + AI Extract Button - Matches Admin Affiliate Product UI */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="productUrl"
                  type="text"
                  placeholder="Paste product link to extract product details"
                  value={productInput}
                  onChange={(e) => setProductInput(e.target.value)}
                  onFocus={() => {
                    if (productSuggestions.length > 0) {
                      setShowSuggestions(true)
                    }
                  }}
                  onPaste={(e) => {
                    // Auto-extract on paste like affiliate products page
                    const pastedText = e.clipboardData.getData('text').trim()
                    if (pastedText && (pastedText.startsWith('http://') || pastedText.startsWith('https://'))) {
                      // Prevent default paste and set value manually for immediate extraction
                      e.preventDefault()
                      setProductInput(pastedText)
                      // Trigger extraction after state update
                      setTimeout(() => {
                        handleAutoExtract(pastedText)
                      }, 50)
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-xs sm:text-sm md:text-base"
                  disabled={isExtracting}
                />

              {showSuggestions && (productSuggestions.length > 0 || isLoadingSuggestions) && (
                <div className="absolute z-50 w-full mt-2 bg-white border-2 border-amber-300 rounded-xl shadow-2xl max-h-96 overflow-y-auto">
                  {isLoadingSuggestions ? (
                    <div className="p-4 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                      <p className="text-sm text-gray-600 mt-2">Searching products...</p>
                    </div>
                  ) : (
                    <div className="p-2">
                      <div className="flex items-center justify-between px-3 py-2 mb-2 bg-amber-50 rounded-lg">
                        <span className="text-sm font-semibold text-amber-800">
                          Top {productSuggestions.length} Products from Trusted Stores
                        </span>
                        <button onClick={() => setShowSuggestions(false)} className="text-gray-500 hover:text-gray-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {productSuggestions.map((product, index) => (
                        <div
                          key={index}
                          onClick={() => handleSelectProduct(product)}
                          className="flex gap-3 p-3 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors border-b last:border-b-0"
                        >
                          <div className="relative w-16 h-16 flex-shrink-0 bg-white rounded border">
                            {product.imageUrl && !product.imageUrl.includes("placeholder.svg") ? (
                              <Image
                                src={product.imageUrl || "/placeholder.svg"}
                                alt={product.productName}
                                fill
                                className="object-contain p-1"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                <Package className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">{product.productName}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className="bg-green-100 text-green-700 text-xs">{product.storeName}</Badge>
                              {product.color && (
                                <Badge className="bg-purple-100 text-purple-700 text-xs">{product.color}</Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-1 mt-1">{product.description}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-lg font-bold text-amber-600">${product.price?.toFixed(2)}</span>
                              <span className="text-xs text-gray-500">Click to select</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              </div>
              {/* AI Extract Button - Inline like Admin Affiliate Product */}
              <Button
                type="button"
                onClick={handleExtractProduct}
                disabled={isExtracting || !productInput.trim()}
                className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 whitespace-nowrap px-4 py-3 rounded-xl"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    <span className="hidden sm:inline">Extracting...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">AI Extract</span>
                    <span className="sm:hidden">Extract</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      {showExtractedProduct && extractedProduct && (
        <CardContent className="p-3 sm:p-6 border-t-2 border-gray-100">
          <div className="bg-gradient-to-br from-orange-50/80 via-amber-50/60 to-yellow-50/80 rounded-xl shadow-lg border-2 border-[#DAA520]/30 overflow-hidden hover:shadow-2xl transition-all duration-300">
            <div className="flex flex-col gap-3 sm:gap-4 p-3 sm:p-4">
              {/* Product Content - No left panel image, images only in I Wish and Alternative sections */}
              <div className="flex-1 min-w-0 flex flex-col">
                {/* Product Title - 2 lines with ellipsis */}
                <h3 className="text-sm font-bold text-[#5D4037] mb-1.5 line-clamp-2">
                  {extractedProduct.productName || "Extracted Product"}
                </h3>

                {/* Store Name */}
                {extractedProduct.storeName && (
                  <p className="text-xs text-[#8B6914] font-medium mb-2">{extractedProduct.storeName}</p>
                )}

                {/* Rating with Partial Stars - Matches Trending Gifts */}
                {extractedProduct.rating && extractedProduct.rating > 0 && (
                  <div className="flex items-center gap-2 mb-2 bg-amber-50/50 rounded-lg px-2 py-1 w-fit">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((starPosition) => {
                        const rating = extractedProduct.rating || 0
                        const fillAmount = Math.max(0, Math.min(1, rating - (starPosition - 1)))
                        const fillPercent = Math.round(fillAmount * 100)
                        const gradientId = `star-extracted-${starPosition}`
                        
                        return (
                          <svg
                            key={starPosition}
                            className="w-3.5 h-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <defs>
                              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset={`${fillPercent}%`} stopColor="#F4C430" />
                                <stop offset={`${fillPercent}%`} stopColor="#E5E7EB" />
                              </linearGradient>
                            </defs>
                            <path
                              d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                              fill={`url(#${gradientId})`}
                              stroke="#F4C430"
                              strokeWidth="1"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )
                      })}
                    </div>
                    <span className="text-sm font-bold text-[#654321]">{extractedProduct.rating.toFixed(1)}</span>
                    {extractedProduct.reviewCount && extractedProduct.reviewCount > 0 && (
                      <span className="text-xs text-gray-500">({extractedProduct.reviewCount.toLocaleString()})</span>
                    )}
                  </div>
                )}

                {/* Badges - Matches Trending Gifts */}
                {(extractedProduct.amazonChoice || extractedProduct.bestSeller || extractedProduct.overallPick) && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {extractedProduct.amazonChoice && (
                      <span className="bg-gradient-to-r from-gray-900 to-black text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                        Amazon's Choice
                      </span>
                    )}
                    {extractedProduct.bestSeller && (
                      <span className="text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm" style={{ backgroundColor: '#D14900' }}>
                        #1 Best Seller
                      </span>
                    )}
                    {extractedProduct.overallPick && (
                      <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                        ⭐ Overall Pick
                      </span>
                    )}
                  </div>
                )}

                {/* Price - List Price and Sale Price with warm styling */}
                <div className="bg-gradient-to-r from-[#FEF3C7]/50 to-[#FDE68A]/30 rounded-lg px-2 py-1.5 mb-2 w-fit">
                  <div className="flex items-baseline gap-1.5">
                    {extractedProduct.originalPrice && extractedProduct.originalPrice > extractedProduct.price ? (
                      <>
                        <span className="text-lg font-bold text-[#654321]">
                          ${typeof extractedProduct.price === "number"
                            ? extractedProduct.price.toFixed(2)
                            : Number.parseFloat(String(extractedProduct.price)).toFixed(2)}
                        </span>
                        <span className="text-gray-400 line-through text-xs">
                          ${extractedProduct.originalPrice.toFixed(2)}
                        </span>
                        <span className="bg-gradient-to-r from-[#DC2626] to-[#EF4444] text-white font-semibold text-[10px] px-1.5 py-0.5 rounded-full shadow-sm">
                          -{Math.round(((extractedProduct.originalPrice - extractedProduct.price) / extractedProduct.originalPrice) * 100)}%
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-[#654321]">
                        ${typeof extractedProduct.price === "number"
                          ? extractedProduct.price.toFixed(2)
                          : Number.parseFloat(String(extractedProduct.price)).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Product Specifications - Editable with Edit/Remove icons */}
                {Object.keys(editableSpecs).length > 0 && (
                  <div className="bg-gradient-to-r from-[#6B4423]/5 to-[#8B5A3C]/5 rounded-lg p-3 border border-[#8B5A3C]/10 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold text-[#6B4423] uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-[#DAA520] rounded-full"></span>
                        Specifications
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsEditingSpecs(!isEditingSpecs)}
                        className="p-1 bg-[#DAA520] hover:bg-[#B8860B] text-white rounded-full transition-colors"
                        title={isEditingSpecs ? "Done editing" : "Edit specifications"}
                      >
                        {isEditingSpecs ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {Object.entries(editableSpecs)
                        .slice(0, isEditingSpecs ? undefined : 5)
                        .map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2 text-[10px]">
                            {isEditingSpecs ? (
                              <>
                                <span className="font-semibold text-[#6B4423] capitalize w-[100px] flex-shrink-0 truncate">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                                </span>
                                <input
                                  type="text"
                                  value={value}
                                  onChange={(e) => setEditableSpecs(prev => ({ ...prev, [key]: e.target.value }))}
                                  className="flex-1 px-2 py-1 text-xs border border-[#8B5A3C]/30 rounded bg-white focus:outline-none focus:border-[#DAA520]"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newSpecs = { ...editableSpecs }
                                    delete newSpecs[key]
                                    setEditableSpecs(newSpecs)
                                  }}
                                  className="p-1 text-red-500 hover:text-red-700 transition-colors"
                                  title="Remove specification"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="font-semibold text-[#6B4423] capitalize w-[100px] flex-shrink-0 truncate">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                                </span>
                                <span className="text-[#654321] truncate flex-1" title={String(value)}>
                                  {String(value)}
                                </span>
                              </>
                            )}
                          </div>
                        ))
                      }
                      {!isEditingSpecs && Object.keys(editableSpecs).length > 5 && (
                        <p className="text-[10px] font-bold text-[#DAA520] mt-1">
                          +{Object.keys(editableSpecs).length - 5} more specs
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Choose Your Preferred Options - Matches Modal UI */}
                {extractedProduct && (
                  <div className="mt-4 space-y-3 bg-gradient-to-br from-[#FEF7ED] via-[#FFF7ED] to-[#FFFBEB] border-2 border-[#DAA520]/30 rounded-xl p-4 shadow-lg">
                    {/* Header - Matches modal header style */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🎁</span>
                        <h3 className="text-base font-bold text-[#8B4513]">Choose Your Preferred Options</h3>
                      </div>
                    </div>

                    {/* I Wish Option Card - Auto-extracted variant options (like modal) */}
                    <div className="rounded-lg border-2 border-[#B8860B] bg-gradient-to-r from-[#DAA520]/30 to-[#F4C430]/25 shadow-md p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#F4C430] text-white flex items-center gap-1 shadow-sm">
                          <Heart className="w-3 h-3 fill-red-500 text-red-500" /> I Wish
                        </span>
                        <span className="text-[10px] text-red-500 font-medium">* Required</span>
                      </div>
                      
                      <p className="text-[10px] text-[#8B6914] bg-[#DAA520]/10 px-2 py-1 rounded-md border border-[#DAA520]/20 italic mb-2">
                        💡 Options auto-extracted from your pasted URL. Edit if needed.
                      </p>
                      
                      {/* Product Image & Options Row - like modal */}
                      <div className="flex gap-3">
                        {extractedProduct.imageUrl && (
                          <img 
                            src={extractedProduct.imageUrl} 
                            alt={extractedProduct.productName || 'Selected product'}
                            className="w-16 h-16 object-contain rounded-lg bg-white border border-[#DAA520]/20 flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 space-y-1.5">
                          {/* Show extracted/editable variant fields - dynamic based on extracted attributes */}
                          {Object.keys(iWishVariants).length > 0 ? (
                            <>
                              {Object.entries(iWishVariants).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-2">
                                  <label className="text-xs text-[#6B4423] w-20 font-medium truncate" title={key}>
                                    {key}:
                                  </label>
                                  <input
                                    type="text"
                                    value={value}
                                    onChange={(e) => setIWishVariants(prev => ({ ...prev, [key]: e.target.value }))}
                                    className="flex-1 text-xs px-2 py-1 border border-[#DAA520]/30 rounded bg-white/80 focus:outline-none focus:border-[#DAA520]"
                                  />
                                </div>
                              ))}
                            </>
                          ) : (
                            /* No options extracted - show message */
                            <div className="text-[10px] text-[#8B6914] italic py-2">
                              ℹ️ No variant options detected from URL. This product may not have selectable variants.
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Custom Fields Section for I Wish */}
                      {likeCustomFields.length > 0 && (
                        <div className="space-y-1.5 mt-2">
                          {likeCustomFields.map((field) => (
                            <div key={field.id} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={field.key}
                                onChange={(e) => setLikeCustomFields(prev => prev.map(f => f.id === field.id ? { ...f, key: e.target.value } : f))}
                                placeholder="Field name"
                                className="w-24 px-2 py-1 text-xs border border-[#DAA520]/30 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#DAA520] text-[#4A2F1A]"
                              />
                              <input
                                type="text"
                                value={field.value}
                                onChange={(e) => setLikeCustomFields(prev => prev.map(f => f.id === field.id ? { ...f, value: e.target.value } : f))}
                                placeholder="Value"
                                className="flex-1 px-2 py-1 text-xs border border-[#DAA520]/30 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#DAA520] text-[#4A2F1A]"
                              />
                              <button
                                type="button"
                                onClick={() => setLikeCustomFields(prev => prev.filter(f => f.id !== field.id))}
                                className="p-1 text-red-500 hover:text-red-700 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Custom Field Button for I Wish */}
                      <button
                        type="button"
                        onClick={() => setLikeCustomFields(prev => [...prev, { id: Date.now().toString(), key: '', value: '' }])}
                        className="flex items-center gap-1 text-[10px] text-[#8B6914] hover:text-[#654321] font-medium mt-2"
                      >
                        <Plus className="w-3 h-3" />
                        Add Custom Field
                      </button>

                      {/* Notes Section for I Wish */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs text-[#6B4423] font-medium">Notes</label>
                          {likeNotes && (
                            <button
                              type="button"
                              onClick={() => setLikeNotes("")}
                              className="p-0.5 text-red-500 hover:text-red-700 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <textarea
                          value={likeNotes}
                          onChange={(e) => setLikeNotes(e.target.value)}
                          placeholder="Add any special notes or instructions..."
                          className="w-full px-2 py-1.5 text-xs border border-[#DAA520]/30 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#DAA520] text-[#4A2F1A] resize-none"
                          rows={2}
                        />
                      </div>
                    </div>

                    {/* Alternative Option Card - Same UI as I Wish */}
                    <div className="rounded-lg border-2 border-[#D97706] bg-gradient-to-r from-[#D97706]/15 to-[#F59E0B]/15 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-white shadow-sm">
                            ✓ Alternative
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium">Optional</span>
                        </div>
                        <a
                          href={extractedProduct.productLink || productInput}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setIsWaitingForAltClip(true)}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-[#4A2F1A] bg-white hover:bg-[#FEF3C7] border border-[#D97706]/30 rounded-lg transition-colors shadow-sm"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Select on Retailer
                        </a>
                      </div>
                      
                      <p className="text-[10px] text-[#92400E] bg-[#D97706]/10 px-2 py-1 rounded-md border border-[#D97706]/20 italic mb-2">
                        💡 Click Select on Retailer to open the product page → choose your preferred options → use the Wishbee extension to clip and auto-fill the information below.
                      </p>
                      
                      {/* Waiting for extension clip */}
                      {isWaitingForAltClip && !altClippedImage && Object.keys(altAttributes).length === 0 && (
                        <div className="flex items-center gap-2 text-[10px] text-[#92400E] bg-[#D97706]/10 px-2 py-1.5 rounded-md border border-[#D97706]/20 mb-2">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Waiting for extension... Select your preferred options and clip the product.</span>
                        </div>
                      )}

                      {/* Product Image & Options Row - Only show when clipped from extension */}
                      <div className="flex gap-3">
                        {/* Only show image if clipped from extension - no default image */}
                        {altClippedImage && (
                          <img 
                            src={altClippedImage} 
                            alt={altClippedTitle || 'Alternative product'}
                            className="w-16 h-16 object-contain rounded-lg bg-white border border-[#D97706]/20 flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 space-y-1.5">
                          {/* Show editable variant fields - only when clipped from extension */}
                          {Object.keys(altAttributes).length > 0 ? (
                            <>
                              {Object.entries(altAttributes).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-2">
                                  <label className="text-xs text-[#6B4423] w-20 font-medium truncate" title={key}>
                                    {key}:
                                  </label>
                                  <input
                                    type="text"
                                    value={value}
                                    onChange={(e) => setAltAttributes(prev => ({ ...prev, [key]: e.target.value }))}
                                    className="flex-1 text-xs px-2 py-1 border border-[#D97706]/30 rounded bg-white/80 focus:outline-none focus:border-[#D97706]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newAttrs = { ...altAttributes }
                                      delete newAttrs[key]
                                      setAltAttributes(newAttrs)
                                    }}
                                    className="p-0.5 text-red-500 hover:text-red-700 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </>
                          ) : (
                            /* No options clipped yet - show message */
                            <div className="text-[10px] text-[#92400E] italic py-2">
                              ℹ️ No alternative options selected yet. Click "Select on Retailer" and clip your preferred alternative.
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Custom Fields Section for Alternative */}
                      {altCustomFields.length > 0 && (
                        <div className="space-y-1.5 mt-2">
                          {altCustomFields.map((field) => (
                            <div key={field.id} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={field.key}
                                onChange={(e) => setAltCustomFields(prev => prev.map(f => f.id === field.id ? { ...f, key: e.target.value } : f))}
                                placeholder="Field name"
                                className="w-24 px-2 py-1 text-xs border border-[#D97706]/30 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#D97706] text-[#4A2F1A]"
                              />
                              <input
                                type="text"
                                value={field.value}
                                onChange={(e) => setAltCustomFields(prev => prev.map(f => f.id === field.id ? { ...f, value: e.target.value } : f))}
                                placeholder="Value"
                                className="flex-1 px-2 py-1 text-xs border border-[#D97706]/30 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#D97706] text-[#4A2F1A]"
                              />
                              <button
                                type="button"
                                onClick={() => setAltCustomFields(prev => prev.filter(f => f.id !== field.id))}
                                className="p-1 text-red-500 hover:text-red-700 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Custom Field Button for Alternative */}
                      <button
                        type="button"
                        onClick={() => setAltCustomFields(prev => [...prev, { id: Date.now().toString(), key: '', value: '' }])}
                        className="flex items-center gap-1 text-[10px] text-[#92400E] hover:text-[#78350F] font-medium mt-2"
                      >
                        <Plus className="w-3 h-3" />
                        Add Custom Field
                      </button>

                      {/* Notes Section for Alternative */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs text-[#6B4423] font-medium">Notes</label>
                          {altNotes && (
                            <button
                              type="button"
                              onClick={() => setAltNotes("")}
                              className="p-0.5 text-red-500 hover:text-red-700 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <textarea
                          value={altNotes}
                          onChange={(e) => setAltNotes(e.target.value)}
                          placeholder="Add any special notes or instructions..."
                          className="w-full px-2 py-1.5 text-xs border border-[#D97706]/30 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#D97706] text-[#4A2F1A] resize-none"
                          rows={2}
                        />
                      </div>
                    </div>

                    {/* Ok to Buy Option Card - Matches modal style */}
                    <div className="rounded-lg border-2 border-[#8B5A3C]/20 bg-white/50 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#C2410C] to-[#EA580C] text-white shadow-sm">
                          💫 Ok to Buy
                        </span>
                      </div>
                      <p className="text-[10px] text-[#9A3412] bg-[#C2410C]/10 px-2 py-1.5 rounded-md border border-[#C2410C]/20 italic">
                        💡 You may purchase this product from another retailer, as long as it aligns with the "I Wish" or "Alternative" preferences.
                      </p>
                    </div>

                    {/* Add to Wishlist and Cancel Buttons - Small size */}
                    <div className="flex flex-row gap-2 mt-3 pt-3 border-t border-[#DAA520]/30">
                      <Button
                        type="button"
                        onClick={handleAddToWishlistFromExtracted}
                        disabled={isSaving}
                        className="flex-1 h-8 px-3 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] text-xs font-semibold transition-all duration-200 hover:scale-105 hover:from-[#F4C430] hover:to-[#DAA520] shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                            <span>Adding...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-1.5 h-3 w-3" />
                            <span>Add to My Wishlist</span>
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        onClick={handleCancelExtractedProduct}
                        disabled={isSaving}
                        className="flex-1 h-8 px-3 rounded-full border border-[#8B4513] text-[#8B4513] bg-transparent text-xs font-semibold transition-all duration-200 hover:scale-105 hover:bg-[#8B4513] hover:text-white shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="mr-1.5 h-3 w-3" />
                        <span>Cancel</span>
                      </Button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </CardContent>
      )}

      {searchResults.length > 0 && (
        <CardContent className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-t-2 border-amber-200">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-6 h-6 text-amber-600" />
            <h3 className="text-xl font-bold text-gray-800">
              Potential Matches at {searchResults.length} Other Store{searchResults.length > 1 ? "s" : ""}
            </h3>
          </div>

          {priceComparisonNote && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Note:</span> {priceComparisonNote}
              </p>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">⚠️ Important:</span> Please verify brand, color, size, and other details on
              the store website before purchasing. These results are AI-generated suggestions and may not be exact
              matches.
            </p>
          </div>

          <p className="text-sm text-gray-600 mb-4">Click on any option below to select it and add to your wishlist</p>

          <div className="grid gap-4">
            {searchResults.map((product, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-xl transition-all border-2 border-gray-200 hover:border-amber-500 hover:scale-[1.02]"
                onClick={() => handleSelectProduct(product)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="relative w-28 h-28 flex-shrink-0 bg-white rounded-lg overflow-hidden border-2 border-gray-200">
                      {product.imageUrl && !product.imageUrl.includes("placeholder.svg") ? (
                        <Image
                          src={product.imageUrl || "/placeholder.svg"}
                          alt={product.productName}
                          fill
                          className="object-contain p-2"
                          unoptimized
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=400&width=400"
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                          <Package className="w-14 h-14 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-900 mb-2">{product.productName}</h4>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-green-100 text-green-800 border-green-300">{product.storeName}</Badge>
                        {index === 0 && (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold">
                            🏆 Best Price
                          </Badge>
                        )}
                        {product.color && (
                          <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                            Color: {product.color}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold text-amber-600">${product.price.toFixed(2)}</div>
                        <Button
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectProduct(product)
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Select & Save
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
