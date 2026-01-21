"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Loader2,
  CheckCircle,
  ExternalLink,
  ArrowRight,
  X,
  Heart,
  Plus,
  Trash2,
  SlidersHorizontal,
  Pencil,
  Check,
  Upload,
  Star,
  Link2,
  Scissors,
  Sparkles,
  AlertCircle,
} from "lucide-react"

interface Gift {
  id: string
  giftName: string
  productLink?: string
  image?: string
  targetAmount: number
  source?: string
  category?: string
  rating?: number
  reviewCount?: number
  amazonChoice?: boolean
  bestSeller?: boolean
  overallPick?: boolean
  originalPrice?: number
  attributes?: Record<string, any>
  preferenceOptions?: string | {
    iLike?: {
      image?: string
      title?: string
      size?: string
      color?: string
      style?: string
      configuration?: string
      customFields?: { key: string; value: string }[]
      notes?: string
    }
    alternative?: {
      image?: string
      title?: string
      size?: string
      color?: string
      style?: string
      configuration?: string
      customFields?: { key: string; value: string }[]
      notes?: string
    }
    okToBuy?: {
      image?: string
      title?: string
      size?: string
      color?: string
      style?: string
      configuration?: string
      customFields?: { key: string; value: string }[]
      notes?: string
    }
  }
}

export interface PreferenceOptions {
  iLike?: {
    image?: string | null
    title?: string | null
    size?: string | null
    color?: string | null
    style?: string | null
    configuration?: string | null
    customFields?: { key: string; value: string }[]
    notes?: string | null
  } | null
  alternative?: {
    image?: string | null
    title?: string | null
    size?: string | null
    color?: string | null
    style?: string | null
    configuration?: string | null
    customFields?: { key: string; value: string }[]
    notes?: string | null
  } | null
  okToBuy?: {
    image?: string | null
    title?: string | null
    size?: string | null
    color?: string | null
    style?: string | null
    configuration?: string | null
  } | null
}

interface AddToWishlistModalProps {
  gift: Gift | null
  isOpen: boolean
  onClose: () => void
  wishlistItemId?: string // If provided, this is an existing item that can be updated
  onSavePreferences?: (preferences: PreferenceOptions) => void // Callback when preferences are saved
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

// Helper to clean variant option values - strips garbage patterns while preserving valid prefix
function cleanVariantValue(value: any): string {
  if (!value || typeof value !== 'string') return ''
  let v = value.trim()
  
  // Remove common garbage suffixes (e.g., "Lightning 1 option from $587.49" -> "Lightning")
  const garbageSuffixPatterns = [
    /\s+\d+\s*options?\s*(from\s*)?\$[\d,.]+.*$/i,  // "1 option from $587.49"
    /\s+from\s+\$[\d,.]+.*$/i,                       // "from $587.49"
    /\s+\$[\d,.]+.*$/i,                              // "$587.49" at end
    /\s+\d+\s*options?$/i,                           // "1 option" at end
  ]
  
  for (const pattern of garbageSuffixPatterns) {
    v = v.replace(pattern, '').trim()
  }
  
  return v
}

// Helper to validate variant option values - filters out garbage data
function isValidVariantValue(value: any): boolean {
  if (!value || typeof value !== 'string') return false
  const v = cleanVariantValue(value)
  if (v.length === 0 || v.length > 100) return false
  
  // Reject values that look like garbage (contain common garbage patterns)
  const garbagePatterns = [
    /items?\s*in\s*cart/i,           // "items in cart" anywhere
    /in\s*cart/i,                     // "in cart" anywhere
    /percent/i,                       // "percent" anywhere
    /out\s*of\s*\d+\s*stars/i,
    /customer\s*review/i,
    /about\s*this\s*item/i,
    /add\s*to\s*(cart|list)/i,
    /shopping\s*cart/i,
    /widget/i,
    /jump\s*link/i,
    /back\s*to\s*top/i,
    /customer\s*image/i,
    /applecare.*monthly/i,
    /^\|/,                            // Starts with pipe
    /^\d+\s*items?/i,                 // Starts with number of items
    /Array\(\d+\)/i,                  // Array notation
    /undefined/i,
    /null/i,
    /^\$/,                            // Starts with dollar sign
    /\d+\.\d+\s*out\s*of/i,           // Rating pattern
    /reviews?/i,                      // Contains "review" or "reviews"
    /\bstars?\b/i,                    // Contains standalone "star" or "stars" (not "Starlight")
    /^\d+\s+\d+/,                     // Starts with multiple numbers
    /selected\s*(color|style|size|set)/i, // "Selected Color is..."
    /tap\s*to/i,                      // "Tap to collapse"
    /collapse/i,                      // "collapse"
    /\d+\s*options?\s*from/i,         // "1 option from"
    /from\s*\$/i,                     // "from $"
  ]
  
  for (const pattern of garbagePatterns) {
    if (pattern.test(v)) return false
  }
  
  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(v)) return false
  
  // Reject if too many words (Apple Watch colors can have 8+ words like 
  // "Natural Titanium Case with Light Blue Alpine Loop")
  const wordCount = v.split(/\s+/).length
  if (wordCount > 12) return false
  
  return true
}

// Get clean display value for variant (cleans and returns cleaned version)
function getCleanVariantDisplay(value: string): string {
  return cleanVariantValue(value)
}

export function AddToWishlistModal({ gift, isOpen, onClose, wishlistItemId, onSavePreferences }: AddToWishlistModalProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [extractedProduct, setExtractedProduct] = useState<ExtractedProduct | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const savingRef = useRef(false) // Extra protection against double submissions
  const likeImageInputRef = useRef<HTMLInputElement>(null) // Ref for I Wish image upload
  const altImageInputRef = useRef<HTMLInputElement>(null) // Ref for Alternative image upload
  const [hasOpenedRetailer, setHasOpenedRetailer] = useState(false)
  const [variantPreference, setVariantPreference] = useState<"Ideal" | "Alternative" | "Nice to have" | "">("")
  const [preferenceError, setPreferenceError] = useState<string>("")
  const [pastedUrl, setPastedUrl] = useState("")
  const [isExtractingVariants, setIsExtractingVariants] = useState(false)
  
  // Dynamic product attributes - determined by product type
  const [availableAttributes, setAvailableAttributes] = useState<string[]>([])
  
  // I Wish preference options (Green) - dynamic key-value store
  const [likeAttributes, setLikeAttributes] = useState<Record<string, string>>({})
  const [likeSelected, setLikeSelected] = useState(true) // Expanded by default (required)

  // Alternative preference options (Orange) - dynamic key-value store
  const [altAttributes, setAltAttributes] = useState<Record<string, string>>({})
  const [altSelected, setAltSelected] = useState(false) // Collapsed by default (optional)
  
  // Ok to Buy section - collapsed by default
  const [okToBuyExpanded, setOkToBuyExpanded] = useState(false)
  
  // Legacy state for backward compatibility (will be deprecated)
  const [likeSize, setLikeSize] = useState("")
  const [likeColor, setLikeColor] = useState("")
  const [likeStyle, setLikeStyle] = useState("")
  const [likeConfiguration, setLikeConfiguration] = useState("")
  const [altSize, setAltSize] = useState("")
  const [altColor, setAltColor] = useState("")
  const [altStyle, setAltStyle] = useState("")
  const [altConfiguration, setAltConfiguration] = useState("")
  
  // Editing state for I Wish section
  const [editingLikeField, setEditingLikeField] = useState<string | null>(null)
  const [editingLikeValue, setEditingLikeValue] = useState("")
  const [isEditingIWish, setIsEditingIWish] = useState(false) // Single edit mode for all I Wish fields
  
  // Editable product details for I Wish
  const [iWishTitle, setIWishTitle] = useState("")
  const [iWishStore, setIWishStore] = useState("")
  const [iWishRating, setIWishRating] = useState("")
  const [iWishReviewCount, setIWishReviewCount] = useState("")
  const [iWishPrice, setIWishPrice] = useState("")
  const [iWishAmazonChoice, setIWishAmazonChoice] = useState(false)
  const [iWishBestSeller, setIWishBestSeller] = useState(false)
  const [iWishSpecs, setIWishSpecs] = useState<Record<string, string>>({})
  const [showAllIWishSpecs, setShowAllIWishSpecs] = useState(false)
  const [iWishCleared, setIWishCleared] = useState(false) // Track if I Wish was cleared
  
  // Editable product details for Alternative
  const [altTitle, setAltTitle] = useState("")
  const [altStore, setAltStore] = useState("")
  const [altRating, setAltRating] = useState("")
  const [altReviewCount, setAltReviewCount] = useState("")
  const [altPrice, setAltPrice] = useState("")
  const [altAmazonChoice, setAltAmazonChoice] = useState(false)
  const [altBestSeller, setAltBestSeller] = useState(false)
  const [altSpecs, setAltSpecs] = useState<Record<string, string>>({})
  const [showAllAltSpecs, setShowAllAltSpecs] = useState(false)
  const [altCleared, setAltCleared] = useState(false) // Track if Alternative was cleared
  
  // Price warning state
  const [showPriceWarning, setShowPriceWarning] = useState(false)
  const [priceWarningData, setPriceWarningData] = useState<{ altPrice: number; iWishPrice: number } | null>(null)
  
  // Add method toggle for I Wish and Alternative (url or extension)
  const [iWishAddMethod, setIWishAddMethod] = useState<"url" | "extension">("url")
  const [altAddMethod, setAltAddMethod] = useState<"url" | "extension">("url")
  const [iWishProductUrl, setIWishProductUrl] = useState("")
  const [altProductUrl, setAltProductUrl] = useState("")
  const [isExtractingIWish, setIsExtractingIWish] = useState(false)
  const [isExtractingAlt, setIsExtractingAlt] = useState(false)
  const [isWaitingForIWishClip, setIsWaitingForIWishClip] = useState(false)
  const [isWaitingForAltClip, setIsWaitingForAltClip] = useState(false)
  
  // Editing state for Alternative section
  const [editingAltField, setEditingAltField] = useState<string | null>(null)
  const [editingAltValue, setEditingAltValue] = useState("")
  const [isEditingAlt, setIsEditingAlt] = useState(false) // Single edit mode for all Alternative fields
  
  // Add custom field state
  const [isAddingLikeField, setIsAddingLikeField] = useState(false)
  const [newLikeFieldName, setNewLikeFieldName] = useState("")
  const [newLikeFieldValue, setNewLikeFieldValue] = useState("")
  const [isAddingAltField, setIsAddingAltField] = useState(false)
  const [newAltFieldName, setNewAltFieldName] = useState("")
  const [newAltFieldValue, setNewAltFieldValue] = useState("")
  
  // Track which preference is awaiting extension data
  const [awaitingExtensionFor, setAwaitingExtensionFor] = useState<"like" | "alt" | "ok" | null>(null)
  
  // Clipped product data from extension - separate for each preference
  const [likeClippedImage, setLikeClippedImage] = useState<string | null>(null)
  const [likeClippedTitle, setLikeClippedTitle] = useState<string | null>(null)
  const [altClippedImage, setAltClippedImage] = useState<string | null>(null)
  const [altClippedTitle, setAltClippedTitle] = useState<string | null>(null)
  
  // Image URL input states - for manually entering image URLs
  const [showLikeImageInput, setShowLikeImageInput] = useState(false)
  const [likeImageUrlInput, setLikeImageUrlInput] = useState("")
  const [showAltImageInput, setShowAltImageInput] = useState(false)
  const [altImageUrlInput, setAltImageUrlInput] = useState("")
  const [okClippedImage, setOkClippedImage] = useState<string | null>(null)
  const [okClippedTitle, setOkClippedTitle] = useState<string | null>(null)
  
  // Ok to buy preference options (Coral)
  const [okSize, setOkSize] = useState("")
  const [okColor, setOkColor] = useState("")
  const [okStyle, setOkStyle] = useState("")
  const [okConfiguration, setOkConfiguration] = useState("")
  const [okSelected, setOkSelected] = useState(false)
  const [okAttributes, setOkAttributes] = useState<Record<string, string>>({})

  // Custom fields and notes for I Wish
  const [likeCustomFields, setLikeCustomFields] = useState<Array<{ id: string; key: string; value: string }>>([])
  const [likeNotes, setLikeNotes] = useState("")
  
  // Custom fields and notes for Alternative
  const [altCustomFields, setAltCustomFields] = useState<Array<{ id: string; key: string; value: string }>>([])
  const [altNotes, setAltNotes] = useState("")

  // Pre-fill options from gift attributes OR extracted product when modal opens
  useEffect(() => {
    if (!isOpen) return
    
    // PRIORITY 1: Check top-level properties first (from admin affiliate products page)
    // These are saved as: gift.color, gift.size, gift.style, gift.configuration
    const topLevelColor = (gift as any)?.color || extractedProduct?.color
    const topLevelSize = (gift as any)?.size || extractedProduct?.size
    const topLevelStyle = (gift as any)?.style || extractedProduct?.style
    const topLevelConfiguration = (gift as any)?.configuration || (gift as any)?.set || 
                                   extractedProduct?.configuration || extractedProduct?.set
    
    console.log('[Modal] Pre-filling from top-level:', { 
      color: topLevelColor, 
      size: topLevelSize, 
      style: topLevelStyle, 
      configuration: topLevelConfiguration 
    })
    
    // Set from top-level properties
    if (topLevelColor && isValidVariantValue(topLevelColor)) {
      setLikeColor(topLevelColor)
      console.log('[Modal] Set likeColor from top-level:', topLevelColor)
    }
    if (topLevelSize && isValidVariantValue(topLevelSize)) {
      setLikeSize(topLevelSize)
      console.log('[Modal] Set likeSize from top-level:', topLevelSize)
    }
    if (topLevelStyle && isValidVariantValue(topLevelStyle)) {
      setLikeStyle(topLevelStyle)
      console.log('[Modal] Set likeStyle from top-level:', topLevelStyle)
    }
    if (topLevelConfiguration && isValidVariantValue(topLevelConfiguration)) {
      setLikeConfiguration(topLevelConfiguration)
      console.log('[Modal] Set likeConfiguration from top-level:', topLevelConfiguration)
    }
    
    // PRIORITY 2: Also check attributes object for any fields not found at top level
    const attrs = gift?.attributes || extractedProduct?.attributes || {}
    
    if (Object.keys(attrs).length > 0) {
      console.log('[Modal] Pre-filling from attributes:', attrs)
      
      // Known standard variant fields (case-insensitive matching)
      // Only these are shown - product specs like Material, Item Weight, etc. are excluded
      const standardFields = ['style', 'color', 'size', 'set', 'configuration']
      
      // Process all attributes
      for (const [key, value] of Object.entries(attrs)) {
        if (!value || !isValidVariantValue(value as string)) continue
        
        const lowerKey = key.toLowerCase()
        
        // Handle standard fields (only if not already set from top-level)
        if (lowerKey === 'style' && !topLevelStyle) {
          setLikeStyle(value as string)
          console.log('[Modal] Set likeStyle from attrs:', value)
        } else if (lowerKey === 'color' && !topLevelColor) {
          setLikeColor(value as string)
          console.log('[Modal] Set likeColor from attrs:', value)
        } else if (lowerKey === 'size' && !topLevelSize) {
          setLikeSize(value as string)
          console.log('[Modal] Set likeSize from attrs:', value)
        } else if ((lowerKey === 'set' || lowerKey === 'configuration') && !topLevelConfiguration) {
          setLikeConfiguration(value as string)
          console.log('[Modal] Set likeConfiguration from attrs:', value)
        }
        // NOTE: We intentionally do NOT auto-populate custom fields from product specs
        // like Material, Item Weight, Operating System, etc.
        // Only variant options (Style, Color, Size, Configuration) should be shown
        // Custom fields should only come from explicitly saved user preferences
      }
    }
  }, [isOpen, gift, extractedProduct])

  // Debug: Log when clipped images change
  useEffect(() => {
    console.log('[Modal] 🖼️ likeClippedImage STATE CHANGED:', likeClippedImage?.substring(0, 60) || 'null')
  }, [likeClippedImage])

  useEffect(() => {
    console.log('[Modal] 🖼️ altClippedImage STATE CHANGED:', altClippedImage?.substring(0, 60) || 'null')
  }, [altClippedImage])

  // Helper to load preferences into state
  const loadPreferencesIntoState = (prefs: any) => {
    if (!prefs) return false
    
    let loaded = false
    
    // Load I Wish preferences
    if (prefs.iLike) {
      const iLike = prefs.iLike
      if (iLike.image) setLikeClippedImage(iLike.image)
      if (iLike.title) setLikeClippedTitle(iLike.title)
      if (iLike.size) setLikeSize(iLike.size)
      if (iLike.color) setLikeColor(iLike.color)
      if (iLike.style) setLikeStyle(iLike.style)
      if (iLike.configuration) setLikeConfiguration(iLike.configuration)
      if (iLike.customFields) setLikeCustomFields(iLike.customFields.map((f: any) => ({ ...f, id: Date.now().toString() + Math.random() })))
      if (iLike.notes) setLikeNotes(iLike.notes)
      setLikeSelected(true)
      loaded = true
      console.log('[Modal] ✅ Loaded I Wish preferences')
    }
    
    // Load Alternative preferences
    if (prefs.alternative) {
      const alt = prefs.alternative
      if (alt.image) setAltClippedImage(alt.image)
      if (alt.title) setAltClippedTitle(alt.title)
      if (alt.size) setAltSize(alt.size)
      if (alt.color) setAltColor(alt.color)
      if (alt.style) setAltStyle(alt.style)
      if (alt.configuration) setAltConfiguration(alt.configuration)
      if (alt.customFields) setAltCustomFields(alt.customFields.map((f: any) => ({ ...f, id: Date.now().toString() + Math.random() })))
      if (alt.notes) setAltNotes(alt.notes)
      setAltSelected(true)
      loaded = true
      console.log('[Modal] ✅ Loaded Alternative preferences')
    }
    
    // Load Ok to Buy preferences
    if (prefs.okToBuy) {
      const ok = prefs.okToBuy
      if (ok.image) setOkClippedImage(ok.image)
      if (ok.title) setOkClippedTitle(ok.title)
      if (ok.size) setOkSize(ok.size)
      if (ok.color) setOkColor(ok.color)
      if (ok.style) setOkStyle(ok.style)
      if (ok.configuration) setOkConfiguration(ok.configuration)
      setOkSelected(true)
      setOkToBuyExpanded(true)
      loaded = true
      console.log('[Modal] ✅ Loaded Ok to Buy preferences')
    }
    
    return loaded
  }
  
  // Load saved preference options when modal opens
  // Priority: 1) gift.preferenceOptions (from database), 2) localStorage (for unsaved drafts)
  useEffect(() => {
    if (!isOpen || !gift?.id) return
    
    console.log('[Modal] Loading preferences for gift:', gift.id)
    
    // First, try to load from gift.preferenceOptions (database)
    if (gift.preferenceOptions) {
      console.log('[Modal] Loading from gift.preferenceOptions...')
      try {
        const prefs = typeof gift.preferenceOptions === 'string' 
          ? JSON.parse(gift.preferenceOptions) 
          : gift.preferenceOptions
        
        if (loadPreferencesIntoState(prefs)) {
          console.log('[Modal] ✅ Loaded preferences from database')
          return
        }
      } catch (e) {
        console.error('[Modal] Error parsing gift.preferenceOptions:', e)
      }
    }
    
    // Second, try to load from localStorage (for unsaved drafts)
    try {
      const localStorageKey = `wishbee_prefs_${gift.id}`
      const savedPrefs = localStorage.getItem(localStorageKey)
      if (savedPrefs) {
        console.log('[Modal] Loading from localStorage:', localStorageKey)
        const prefs = JSON.parse(savedPrefs)
        if (loadPreferencesIntoState(prefs)) {
          console.log('[Modal] ✅ Loaded preferences from localStorage')
          return
        }
      }
    } catch (e) {
      console.error('[Modal] Error loading from localStorage:', e)
    }
    
    console.log('[Modal] No saved preferences found for gift:', gift.id)
  }, [isOpen, gift?.id, gift?.preferenceOptions]) // eslint-disable-line react-hooks/exhaustive-deps

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
      setOkClippedImage(null)
      setOkClippedTitle(null)
      setOkAttributes({})
      setVariantPreference("")
      setPreferenceError("")
      setPastedUrl("")
      // Reset dynamic attributes
      setAvailableAttributes([])
      setLikeAttributes({})
      setAltAttributes({})
      // Reset custom fields and notes
      setLikeCustomFields([])
      setLikeNotes("")
      setAltCustomFields([])
      setAltNotes("")
      // Reset I Like options (legacy)
      setLikeSize("")
      setLikeColor("")
      setLikeStyle("")
      setLikeConfiguration("")
      setLikeSelected(true) // Keep expanded by default (required)
      // Reset Alternative options (legacy)
      setAltSize("")
      setAltColor("")
      setAltStyle("")
      setAltConfiguration("")
      setAltSelected(false) // Collapsed by default (optional)
      // Reset Ok to buy options
      setOkSize("")
      setOkColor("")
      setOkStyle("")
      setOkConfiguration("")
      setOkToBuyExpanded(false) // Collapsed by default
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
    if (keyLower.includes('config') || keyLower.includes('pattern') || keyLower === 'set') return 'Set'
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
            console.log('[Modal] Raw variants from extension:', JSON.stringify(data.variants))
            console.log('[Modal] Variant keys:', Object.keys(data.variants))
            console.log('[Modal] Has size?', 'size' in data.variants, data.variants.size)
            console.log('[Modal] Has Size?', 'Size' in data.variants, data.variants.Size)
            console.log('[Modal] Image:', data.image?.substring(0, 80))
            console.log('[Modal] ========================================')
            
            // Normalize variants - show only actual variant options from the product page
            // Also check specifications for Style if not in variants
            const normalizedAttributes: Record<string, string> = {}
            
            // Process actual variants (these are the selectable options on the product page)
            console.log('[Modal] Processing variants. Raw data.variants:', JSON.stringify(data.variants))
            console.log('[Modal] data.variants.color:', data.variants.color)
            console.log('[Modal] data.variants.Color:', data.variants.Color)
            
            for (const [key, value] of Object.entries(data.variants)) {
              console.log(`[Modal] Processing key="${key}", value="${value}", typeof value="${typeof value}"`)
              if (value) {
                const normalizedKey = normalizeAttributeKey(key)
                console.log(`[Modal] Normalizing variant: ${key} -> ${normalizedKey} = ${value}`)
                normalizedAttributes[normalizedKey] = value as string
              } else {
                console.log(`[Modal] Skipping key="${key}" because value is falsy`)
              }
            }
            
            console.log('[Modal] After processing, normalizedAttributes:', JSON.stringify(normalizedAttributes))
            console.log('[Modal] normalizedAttributes.Color:', normalizedAttributes['Color'])
            
            // Also check specifications for Style if not already in variants
            // Some Amazon products have Style in specifications instead of variants
            if (!normalizedAttributes['Style'] && data.specifications) {
              const specs = data.specifications as Record<string, string>
              if (specs['Style'] && typeof specs['Style'] === 'string') {
                // Clean the specification value (remove leading special chars)
                const styleVal = specs['Style'].replace(/^[\u200E\u200F\u202A-\u202E]+/, '').trim()
                if (styleVal && isValidVariantValue(styleVal)) {
                  console.log(`[Modal] Adding Style from specifications: ${styleVal}`)
                  normalizedAttributes['Style'] = styleVal
                }
              }
            }
            
            console.log('[Modal] Normalized attributes (variants + style from specs):', normalizedAttributes)
            
            // Determine available attribute keys in preferred order
            const preferredOrder = ['Style', 'Color', 'Size', 'Set', 'Configuration', 'Brand', 'Material']
            const attrKeys = [
              ...preferredOrder.filter(k => normalizedAttributes[k]),
              ...Object.keys(normalizedAttributes).filter(k => !preferredOrder.includes(k))
            ]
            console.log('[Modal] Preferred order check - Size in normalized?', 'Size' in normalizedAttributes, normalizedAttributes['Size'])
            console.log('[Modal] Final attribute keys to display:', attrKeys)
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
              
              // Also set legacy fields for backward compatibility (with validation)
              if (normalizedAttributes['Size'] && isValidVariantValue(normalizedAttributes['Size'])) setLikeSize(normalizedAttributes['Size'])
              if (normalizedAttributes['Color'] && isValidVariantValue(normalizedAttributes['Color'])) setLikeColor(normalizedAttributes['Color'])
              if (normalizedAttributes['Style'] && isValidVariantValue(normalizedAttributes['Style'])) setLikeStyle(normalizedAttributes['Style'])
              const configVal = normalizedAttributes['Set'] || normalizedAttributes['Configuration']
              if (configVal && isValidVariantValue(configVal)) setLikeConfiguration(configVal)
              setLikeSelected(true)
              
              console.log('[Modal] ✅ Filled I wish fields with extension data:', normalizedAttributes)
              toast({
                title: "🐝 Options Received!",
                description: "I Wish options auto-filled from Wishbee extension.",
                variant: "warm",
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

              // Also set legacy fields for backward compatibility (with validation)
              console.log('[Modal] ALT - Setting legacy fields from normalizedAttributes:', normalizedAttributes)
              
              const altSizeVal = normalizedAttributes['Size']
              const altColorVal = normalizedAttributes['Color']
              const altStyleVal = normalizedAttributes['Style']
              const altConfigVal = normalizedAttributes['Set'] || normalizedAttributes['Configuration']
              
              console.log('[Modal] ALT - Size:', altSizeVal, 'valid:', isValidVariantValue(altSizeVal))
              console.log('[Modal] ALT - Color:', altColorVal, 'valid:', isValidVariantValue(altColorVal))
              console.log('[Modal] ALT - Style:', altStyleVal, 'valid:', isValidVariantValue(altStyleVal))
              console.log('[Modal] ALT - Config:', altConfigVal, 'valid:', isValidVariantValue(altConfigVal))
              
              if (altSizeVal && isValidVariantValue(altSizeVal)) {
                setAltSize(altSizeVal)
                console.log('[Modal] ALT - ✅ Set Size:', altSizeVal)
              }
              if (altColorVal && isValidVariantValue(altColorVal)) {
                setAltColor(altColorVal)
                console.log('[Modal] ALT - ✅ Set Color:', altColorVal)
              }
              if (altStyleVal && isValidVariantValue(altStyleVal)) {
                setAltStyle(altStyleVal)
                console.log('[Modal] ALT - ✅ Set Style:', altStyleVal)
              }
              if (altConfigVal && isValidVariantValue(altConfigVal)) {
                setAltConfiguration(altConfigVal)
                console.log('[Modal] ALT - ✅ Set Config:', altConfigVal)
              }
              setAltSelected(true)
              
              console.log('[Modal] ✅ Filled Alternative fields with extension data:', normalizedAttributes)
              console.log('[Modal] === END ALTERNATIVE ===')
              
              toast({
                title: "🐝 Options Received!",
                description: "Alternative options auto-filled from Wishbee extension.",
                variant: "warm",
              })
            } else if (awaitingExtensionFor === "ok") {
              console.log('[Modal] ========== OK TO BUY DATA RECEIVED ==========')
              console.log('[Modal] OK - Image URL:', data.image)
              console.log('[Modal] OK - Timestamp:', data.timestamp)
              
              // Update clipped image and title for Ok to Buy
              if (data.image) {
                console.log('[Modal] ✅ Setting okClippedImage:', data.image)
                setOkClippedImage(data.image)
              }
              if (data.title) {
                console.log('[Modal] Setting okClippedTitle:', data.title.substring(0, 50))
                setOkClippedTitle(data.title)
              }
              
              // Auto-fill Ok to Buy fields with normalized attributes
              setOkAttributes(normalizedAttributes)
              
              // Also set legacy fields for backward compatibility
              if (normalizedAttributes['Size']) setOkSize(normalizedAttributes['Size'])
              if (normalizedAttributes['Color']) setOkColor(normalizedAttributes['Color'])
              if (normalizedAttributes['Style']) setOkStyle(normalizedAttributes['Style'])
              if (normalizedAttributes['Configuration']) setOkConfiguration(normalizedAttributes['Configuration'])
              setOkSelected(true)
              
              console.log('[Modal] ✅ Filled Ok to Buy fields with extension data:', normalizedAttributes)
              console.log('[Modal] === END OK TO BUY ===')
              
              toast({
                title: "🐝 Options Received!",
                description: "Ok to Buy options auto-filled from Wishbee extension.",
                variant: "warm",
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
              } else if (awaitingExtensionFor === "ok") {
                if (data.image) setOkClippedImage(data.image)
                if (data.title) setOkClippedTitle(data.title)
                setOkSelected(true)
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

  // Extract product when modal opens (skip if gift already has attributes from trending page)
  useEffect(() => {
    if (isOpen && gift?.productLink && !gift?.attributes) {
      extractProductFromUrl(gift.productLink)
    }
  }, [isOpen, gift?.productLink, gift?.attributes])

  // Pre-populate extractedProduct from gift data when attributes are available (trending page)
  useEffect(() => {
    if (isOpen && gift?.attributes && !extractedProduct) {
      setExtractedProduct({
        productName: gift.giftName || "Product",
        description: "",
        price: gift.targetAmount || 0,
        storeName: gift.source || "Store",
        imageUrl: gift.image || "/placeholder.svg",
        productLink: gift.productLink || "",
        attributes: gift.attributes,
        rating: gift.rating,
        reviewCount: gift.reviewCount,
        amazonChoice: gift.amazonChoice,
        bestSeller: gift.bestSeller,
      })
      // Pre-fill variant options from gift attributes
      if (gift.attributes?.color) setLikeColor(gift.attributes.color)
      if (gift.attributes?.size) setLikeSize(gift.attributes.size)
      if (gift.attributes?.style) setLikeStyle(gift.attributes.style)
      if (gift.attributes?.configuration || gift.attributes?.set) setLikeConfiguration(gift.attributes.configuration || gift.attributes.set)
      setLikeSelected(true)
      
      // Pre-fill editable I Wish fields
      setIWishTitle(gift.giftName || "")
      setIWishStore(gift.source || "")
      setIWishRating(gift.rating?.toString() || "")
      setIWishReviewCount(gift.reviewCount?.toString() || "")
      setIWishPrice(gift.targetAmount?.toString() || "")
      setIWishAmazonChoice(gift.amazonChoice || false)
      setIWishBestSeller(gift.bestSeller || false)
      
      // Pre-fill specifications from gift attributes
      if (gift.attributes) {
        const specs: Record<string, string> = {}
        const excludedKeys = ['color', 'size', 'style', 'brand', 'sizeOptions', 'colorVariants', 'combinedVariants', 'styleOptions', 'styleName', 'patternName', 'configuration', 'set']
        Object.entries(gift.attributes).forEach(([key, value]) => {
          if (!excludedKeys.includes(key.toLowerCase()) && value !== null && value !== undefined && value !== '') {
            specs[key] = String(value)
          }
        })
        setIWishSpecs(specs)
      }
    }
  }, [isOpen, gift, extractedProduct])

  // Price validation: Check if Alternative price is higher than I Wish price
  // Helper function to check and show price warning
  const checkAltPriceAndWarn = (altPriceValue: string | number) => {
    const iWishPriceNum = parseFloat(iWishPrice) || extractedProduct?.price || gift?.targetAmount || 0
    const altPriceNum = typeof altPriceValue === 'string' ? parseFloat(altPriceValue) : altPriceValue
    
    if (altPriceNum > 0 && iWishPriceNum > 0 && altPriceNum > iWishPriceNum) {
      setPriceWarningData({ altPrice: altPriceNum, iWishPrice: iWishPriceNum })
      setShowPriceWarning(true)
      return true // Price is too high
    }
    return false // Price is ok
  }
  
  useEffect(() => {
    if (!altSelected || !altPrice || altCleared) return
    
    checkAltPriceAndWarn(altPrice)
  }, [altPrice, altSelected, altCleared, iWishPrice, extractedProduct?.price, gift?.targetAmount])

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
          color: extracted.color || extracted.attributes?.color || null,
          size: extracted.attributes?.size || null,
          style: extracted.style || extracted.attributes?.style || null,
          set: extracted.set || extracted.attributes?.set || extracted.attributes?.configuration || null,
          brand: extracted.attributes?.brand || null,
          material: extracted.attributes?.material || null,
        },
      })

      // Pre-fill I Wish options from extracted data
      if (extracted.color || extracted.attributes?.color) setLikeColor(extracted.color || extracted.attributes?.color)
      if (extracted.attributes?.size) setLikeSize(extracted.attributes.size)
      if (extracted.style || extracted.attributes?.style) setLikeStyle(extracted.style || extracted.attributes?.style)
      if (extracted.set || extracted.attributes?.set || extracted.attributes?.configuration) {
        setLikeConfiguration(extracted.set || extracted.attributes?.set || extracted.attributes?.configuration)
      }
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
    // Prevent multiple submissions using both state and ref
    if (isSaving || savingRef.current) {
      console.log('[AddToWishlist] Already saving, ignoring duplicate call')
      return
    }

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

    // Set both state and ref to prevent double submissions
    savingRef.current = true
    setIsSaving(true)
    console.log('[AddToWishlist] Starting to add product:', extractedProduct.productName)

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

      // Helper to validate and clean option values (filter out garbage data)
      const cleanOptionValue = (value: string | null | undefined): string | null => {
        if (!value) return null
        const str = value.toString().trim()
        // Filter out garbage: too long, contains invalid patterns
        if (str.length > 100) return null
        if (str.length === 0) return null
        const garbagePatterns = [
          'stars', 'rating', 'review', 'cart', 'slide', 'percent', 
          'protection plan', 'about this', 'add to', 'widget', 
          'feedback', 'out of 5', 'customer', 'items in'
        ]
        const lowerStr = str.toLowerCase()
        if (garbagePatterns.some(p => lowerStr.includes(p))) return null
        return str
      }

      // Build preference options object with cleaned values
      // IMPORTANT: Include image and title for each preference section
      const preferenceOptions = {
        iLike: likeSelected ? {
          image: likeClippedImage || extractedProduct?.imageUrl || null,
          title: likeClippedTitle || extractedProduct?.productName || null,
          size: cleanOptionValue(likeSize),
          color: cleanOptionValue(likeColor),
          style: cleanOptionValue(likeStyle),
          configuration: cleanOptionValue(likeConfiguration),
          customFields: likeCustomFields.filter(f => f.key && f.value).map(f => ({ key: f.key, value: f.value })),
          notes: likeNotes.trim() || null,
        } : null,
        alternative: altSelected ? {
          image: altClippedImage || null,
          title: altClippedTitle || null,
          size: cleanOptionValue(altSize),
          color: cleanOptionValue(altColor),
          style: cleanOptionValue(altStyle),
          configuration: cleanOptionValue(altConfiguration),
          customFields: altCustomFields.filter(f => f.key && f.value).map(f => ({ key: f.key, value: f.value })),
          notes: altNotes.trim() || null,
        } : null,
        okToBuy: okSelected ? {
          image: okClippedImage || null,
          title: okClippedTitle || null,
          size: cleanOptionValue(okSize),
          color: cleanOptionValue(okColor),
          style: cleanOptionValue(okStyle),
          configuration: cleanOptionValue(okConfiguration),
        } : null,
      }
      
      console.log('[Modal] Saving preferenceOptions:', JSON.stringify(preferenceOptions))
      console.log('[Modal] I Wish image:', preferenceOptions.iLike?.image)
      console.log('[Modal] Alternative image:', preferenceOptions.alternative?.image)

      // Determine primary preference (priority: I Wish > Alternative > Ok to buy)
      const primaryPreference = likeSelected ? "Ideal" : altSelected ? "Alternative" : "Nice to have"

      // Prepare wishlist item data - include ALL relevant fields from gift
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
        // Include rating and reviews from gift
        review_star: gift.rating || null,
        review_count: gift.reviewCount || null,
        // Include badges and original price in description data
        badges: {
          amazonChoice: gift.amazonChoice || false,
          bestSeller: gift.bestSeller || false,
          overallPick: gift.overallPick || false,
        },
        originalPrice: gift.originalPrice || null,
        // Include specifications from gift attributes
        specifications: gift.attributes || null,
      }

      console.log('[AddToWishlist] Sending API request...')
      const response = await fetch("/api/wishlists/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wishlistItemData),
      })

      console.log('[AddToWishlist] API response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle duplicate product case (409 Conflict)
        if (response.status === 409) {
          toast({
            title: "🐝 Already in Wishlist",
            description: "This product is already in your wishlist",
            className: "bg-gradient-to-r from-[#FEF3C7] via-[#FDE68A] to-[#FCD34D] border-2 border-[#F59E0B] text-[#92400E]",
          })
          onClose()
          return
        }
        
        throw new Error(errorData.error || "Failed to add to wishlist")
      }
      
      console.log('[AddToWishlist] Successfully added to wishlist')
      
      // KEEP preferences in localStorage for when modal is reopened
      // The gift object doesn't have preferenceOptions, so we need localStorage
      if (gift?.id) {
        try {
          const localStorageKey = `wishbee_prefs_${gift.id}`
          // Save the current preferences to localStorage instead of clearing
          localStorage.setItem(localStorageKey, JSON.stringify(preferenceOptions))
          console.log('[AddToWishlist] ✅ Saved preferences to localStorage:', localStorageKey)
        } catch (e) {
          console.error('[AddToWishlist] Error saving to localStorage:', e)
        }
      }

      toast({
        title: "✓ Added to My Wishlist",
        description: `${extractedProduct.productName.length > 50 ? extractedProduct.productName.substring(0, 50) + '...' : extractedProduct.productName} has been added!`,
        variant: "success",
        action: (
          <ToastAction
            altText="View Wishlist"
            onClick={() => router.push('/wishlist')}
            className="bg-black text-white hover:bg-gray-800 border-black"
          >
            View Wishlist
          </ToastAction>
        ),
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
      savingRef.current = false
      setIsSaving(false)
    }
  }

  // Helper to build current preferences object
  const buildCurrentPreferences = (): PreferenceOptions => {
    console.log('[Modal] buildCurrentPreferences called')
    console.log('[Modal] - likeSelected:', likeSelected)
    console.log('[Modal] - altSelected:', altSelected, 'altClippedImage:', altClippedImage?.substring(0, 50), 'altColor:', altColor)
    console.log('[Modal] - okSelected:', okSelected)
    
    // Helper to validate and clean option values (filter out garbage data)
    const cleanOptionValue = (value: string | null | undefined): string | null => {
      if (!value) return null
      const str = value.toString().trim()
      if (str.length > 100 || str.length === 0) return null
      const garbagePatterns = [
        'stars', 'rating', 'review', 'cart', 'slide', 'percent',
        'protection plan', 'about this', 'add to', 'widget',
        'feedback', 'out of 5', 'customer', 'items in'
      ]
      const lowerStr = str.toLowerCase()
      if (garbagePatterns.some(p => lowerStr.includes(p))) return null
      return str
    }

    const prefs = {
      iLike: likeSelected ? {
        image: likeClippedImage || extractedProduct?.imageUrl || null,
        title: likeClippedTitle || extractedProduct?.productName || null,
        size: cleanOptionValue(likeSize),
        color: cleanOptionValue(likeColor),
        style: cleanOptionValue(likeStyle),
        configuration: cleanOptionValue(likeConfiguration),
        customFields: likeCustomFields.filter(f => f.key && f.value).map(f => ({ key: f.key, value: f.value })),
        notes: likeNotes.trim() || null,
      } : null,
      alternative: altSelected ? {
        image: altClippedImage || null,
        title: altClippedTitle || null,
        size: cleanOptionValue(altSize),
        color: cleanOptionValue(altColor),
        style: cleanOptionValue(altStyle),
        configuration: cleanOptionValue(altConfiguration),
        customFields: altCustomFields.filter(f => f.key && f.value).map(f => ({ key: f.key, value: f.value })),
        notes: altNotes.trim() || null,
      } : null,
      okToBuy: okSelected ? {
        image: okClippedImage || null,
        title: okClippedTitle || null,
        size: cleanOptionValue(okSize),
        color: cleanOptionValue(okColor),
        style: cleanOptionValue(okStyle),
        configuration: cleanOptionValue(okConfiguration),
      } : null,
    }
    
    console.log('[Modal] Built preferences object:', JSON.stringify(prefs))
    return prefs
  }

  // Handle close with auto-save of preferences
  const handleClose = async () => {
    // Check if any preferences have been set
    const hasPreferences = likeSelected || altSelected || okSelected
    
    console.log('[Modal] handleClose called - hasPreferences:', hasPreferences, 'gift.id:', gift?.id)
    console.log('[Modal] States: likeSelected=', likeSelected, 'altSelected=', altSelected, 'okSelected=', okSelected)
    console.log('[Modal] Alt data: image=', altClippedImage?.substring(0, 50), 'color=', altColor, 'style=', altStyle)

    if (hasPreferences && gift?.id) {
      const preferences = buildCurrentPreferences()
      console.log('[Modal] Built preferences:', JSON.stringify(preferences))

      // ALWAYS save to localStorage for draft persistence (works for new items too)
      try {
        const localStorageKey = `wishbee_prefs_${gift.id}`
        localStorage.setItem(localStorageKey, JSON.stringify(preferences))
        console.log('[Modal] ✅ Saved preferences to localStorage:', localStorageKey)
        
        toast({
          title: "🐝 Options Saved",
          description: "Your preferred options have been saved.",
          variant: "warm",
        })
      } catch (error) {
        console.error('[Modal] Error saving to localStorage:', error)
      }

      // If this is an existing wishlist item, also save preferences to the database
      if (wishlistItemId) {
        try {
          console.log('[Modal] Also saving preferences for existing item:', wishlistItemId)
          const response = await fetch(`/api/wishlists/items/${wishlistItemId}/preferences`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ preferenceOptions: preferences }),
          })

          if (response.ok) {
            console.log('[Modal] ✅ Preferences saved to database successfully')
          } else {
            console.error('[Modal] Failed to save preferences to database:', await response.text())
          }
        } catch (error) {
          console.error('[Modal] Error saving preferences to database:', error)
        }
      }

      // Notify parent component of preferences change
      if (onSavePreferences) {
        onSavePreferences(preferences)
      }
    }

    onClose()
  }

  // Helper functions for editing variant fields
  const startEditingLikeField = (field: string, currentValue: string) => {
    setEditingLikeField(field)
    setEditingLikeValue(currentValue)
  }
  
  const saveEditingLikeField = () => {
    if (!editingLikeField) return
    const value = editingLikeValue.trim()
    switch (editingLikeField) {
      case 'style': setLikeStyle(value); break
      case 'color': setLikeColor(value); break
      case 'size': setLikeSize(value); break
      case 'set': setLikeConfiguration(value); break
    }
    setEditingLikeField(null)
    setEditingLikeValue("")
  }
  
  const deleteLikeField = (field: string) => {
    switch (field) {
      case 'style': setLikeStyle(""); break
      case 'color': setLikeColor(""); break
      case 'size': setLikeSize(""); break
      case 'set': setLikeConfiguration(""); break
    }
  }
  
  const addNewLikeField = () => {
    const name = newLikeFieldName.trim().toLowerCase()
    const value = newLikeFieldValue.trim()
    if (!name || !value) return
    
    // Map to existing fields if possible
    if (name === 'style') setLikeStyle(value)
    else if (name === 'color') setLikeColor(value)
    else if (name === 'size') setLikeSize(value)
    else if (name === 'set' || name === 'configuration') setLikeConfiguration(value)
    else {
      // Add as custom field
      setLikeCustomFields(prev => [...prev, { id: Date.now().toString(), key: newLikeFieldName.trim(), value }])
    }
    
    setNewLikeFieldName("")
    setNewLikeFieldValue("")
    setIsAddingLikeField(false)
  }
  
  // Helper functions for editing Alternative variant fields
  const startEditingAltField = (field: string, currentValue: string) => {
    setEditingAltField(field)
    setEditingAltValue(currentValue)
  }
  
  const saveEditingAltField = () => {
    if (!editingAltField) return
    const value = editingAltValue.trim()
    switch (editingAltField) {
      case 'style': setAltStyle(value); break
      case 'color': setAltColor(value); break
      case 'size': setAltSize(value); break
      case 'set': setAltConfiguration(value); break
    }
    setEditingAltField(null)
    setEditingAltValue("")
  }
  
  const deleteAltField = (field: string) => {
    switch (field) {
      case 'style': setAltStyle(""); break
      case 'color': setAltColor(""); break
      case 'size': setAltSize(""); break
      case 'set': setAltConfiguration(""); break
    }
  }
  
  const addNewAltField = () => {
    const name = newAltFieldName.trim().toLowerCase()
    const value = newAltFieldValue.trim()
    if (!name || !value) return
    
    if (name === 'style') setAltStyle(value)
    else if (name === 'color') setAltColor(value)
    else if (name === 'size') setAltSize(value)
    else if (name === 'set' || name === 'configuration') setAltConfiguration(value)
    else {
      setAltCustomFields(prev => [...prev, { id: Date.now().toString(), key: newAltFieldName.trim(), value }])
    }
    
    setNewAltFieldName("")
    setNewAltFieldValue("")
    setIsAddingAltField(false)
  }

  // Image upload handlers for I Wish section
  const handleLikeImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      })
      return
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }
    
    // Convert to base64 for preview (in production, you'd upload to a server/CDN)
    const reader = new FileReader()
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string
      setLikeClippedImage(imageUrl)
      toast({
        title: "Image updated",
        description: "Product image has been updated for I Wish section",
      })
    }
    reader.readAsDataURL(file)
    
    // Reset the input so the same file can be re-selected
    e.target.value = ''
  }
  
  const handleLikeImageDelete = () => {
    setLikeClippedImage(null)
    toast({
      title: "Image removed",
      description: "Product image has been removed from I Wish section",
    })
  }
  
  const handleLikeImageUrlInput = () => {
    // Auto-populate with current image URL if available
    const currentUrl = likeClippedImage || extractedProduct?.imageUrl || gift?.image || ""
    // Don't show data: URLs or placeholder in the prompt
    const defaultUrl = currentUrl.startsWith('data:') || currentUrl === '/placeholder.svg' ? "" : currentUrl
    
    const url = prompt("Enter the product image URL:", defaultUrl)
    if (url !== null && url.trim()) {
      // Basic URL validation
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image')) {
        setLikeClippedImage(url.trim())
        toast({
          title: "Image updated",
          description: "Product image URL has been set for I Wish section",
        })
      } else {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid image URL starting with http:// or https://",
          variant: "destructive",
        })
      }
    }
  }
  
  // Image upload handlers for Alternative section
  const handleAltImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      })
      return
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }
    
    // Convert to base64 for preview
    const reader = new FileReader()
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string
      setAltClippedImage(imageUrl)
      toast({
        title: "Image updated",
        description: "Product image has been updated for Alternative section",
      })
    }
    reader.readAsDataURL(file)
    
    // Reset the input
    e.target.value = ''
  }
  
  const handleAltImageDelete = () => {
    setAltClippedImage(null)
    toast({
      title: "Image removed",
      description: "Product image has been removed from Alternative section",
    })
  }
  
  const handleAltImageUrlInput = () => {
    // Auto-populate with current image URL if available
    // Fall back to I Wish image or main product image as a starting point
    const currentUrl = altClippedImage || likeClippedImage || extractedProduct?.imageUrl || gift?.image || ""
    // Don't show data: URLs or placeholder in the prompt
    const defaultUrl = currentUrl.startsWith('data:') || currentUrl === '/placeholder.svg' ? "" : currentUrl
    
    const url = prompt("Enter the product image URL:", defaultUrl)
    if (url !== null && url.trim()) {
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image')) {
        setAltClippedImage(url.trim())
        toast({
          title: "Image updated",
          description: "Product image URL has been set for Alternative section",
        })
      } else {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid image URL starting with http:// or https://",
          variant: "destructive",
        })
      }
    }
  }
  
  // Paste from clipboard handlers - EASY way to add images
  // Simplified version that works better across browsers
  const handleLikePasteFromClipboard = async () => {
    console.log('[Paste] I Wish - Starting clipboard paste...')
    try {
      // First, try the simple text-based approach (most reliable)
      const text = await navigator.clipboard.readText()
      const trimmedText = text?.trim() || ""
      console.log('[Paste] I Wish - Clipboard text:', trimmedText.substring(0, 100))
      
      if (trimmedText) {
        // Check if it's a valid image URL
        if (trimmedText.startsWith('http://') || trimmedText.startsWith('https://')) {
          console.log('[Paste] I Wish - Valid URL detected, setting image...')
          // Accept any URL - let the browser try to load it
          setLikeClippedImage(trimmedText)
          toast({
            title: "Image URL pasted!",
            description: "Product image has been updated",
          })
          return
        } else {
          console.log('[Paste] I Wish - Text is not a URL:', trimmedText.substring(0, 50))
        }
      }
      
      // If no text URL, show instructions
      toast({
        title: "No image URL found",
        description: "Right-click the product image → 'Copy image address' → then paste",
        variant: "destructive",
      })
    } catch (error) {
      console.error('[Paste] I Wish - Clipboard read error:', error)
      toast({
        title: "Cannot access clipboard",
        description: "Please use 'Upload' button or 'Enter URL' instead",
        variant: "destructive",
      })
    }
  }
  
  const handleAltPasteFromClipboard = async () => {
    console.log('[Paste] Alt - Starting clipboard paste...')
    try {
      // First, try the simple text-based approach (most reliable)
      const text = await navigator.clipboard.readText()
      const trimmedText = text?.trim() || ""
      console.log('[Paste] Alt - Clipboard text:', trimmedText.substring(0, 100))
      
      if (trimmedText) {
        // Check if it's a valid image URL
        if (trimmedText.startsWith('http://') || trimmedText.startsWith('https://')) {
          console.log('[Paste] Alt - Valid URL detected, setting image...')
          // Accept any URL - let the browser try to load it
          setAltClippedImage(trimmedText)
          toast({
            title: "Image URL pasted!",
            description: "Alternative product image has been updated",
          })
          return
        } else {
          console.log('[Paste] Alt - Text is not a URL:', trimmedText.substring(0, 50))
        }
      }
      
      // If no text URL, show instructions
      toast({
        title: "No image URL found",
        description: "Right-click the product image → 'Copy image address' → then paste",
        variant: "destructive",
      })
    } catch (error) {
      console.error('[Paste] Alt - Clipboard read error:', error)
      toast({
        title: "Cannot access clipboard",
        description: "Please use 'Upload' button or 'Enter URL' instead",
        variant: "destructive",
      })
    }
  }
  
  // Submit image URL from text input
  const handleLikeImageUrlSubmit = () => {
    const url = likeImageUrlInput.trim()
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      setLikeClippedImage(url)
      setLikeImageUrlInput("")
      setShowLikeImageInput(false)
      toast({
        title: "Image updated!",
        description: "Product image has been set",
      })
    } else {
      toast({
        title: "Invalid URL",
        description: "Please enter a URL starting with http:// or https://",
        variant: "destructive",
      })
    }
  }
  
  const handleAltImageUrlSubmit = () => {
    const url = altImageUrlInput.trim()
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      setAltClippedImage(url)
      setAltImageUrlInput("")
      setShowAltImageInput(false)
      toast({
        title: "Image updated!",
        description: "Alternative product image has been set",
      })
    } else {
      toast({
        title: "Invalid URL",
        description: "Please enter a URL starting with http:// or https://",
        variant: "destructive",
      })
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-[750px] max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - 750 x 80 */}
        <div className="w-[750px] h-[80px] bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] px-4 border-b-2 border-[#4A2F1A] flex items-center justify-center relative">
          <h3 className="text-[18px] font-bold text-[#F5DEB3] flex items-center gap-2">
            <Heart className="w-[18px] h-[18px] text-[#F5DEB3]" />
            Choose Your Preferred Options
          </h3>
          <button
            onClick={handleClose}
            className="absolute right-4 p-1.5 hover:bg-[#4A2F1A] rounded-full transition-colors"
          >
            <X className="w-[18px] h-[18px] text-[#F5DEB3]" />
          </button>
        </div>

        {/* Single Panel Body - Warm gradient like create page */}
        <div className="p-5 overflow-y-auto max-h-[70vh] bg-gradient-to-br from-[#FEF7ED] via-[#FFF7ED] to-[#FFFBEB]">
            {isExtracting ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-[#6B4423]">Loading product details...</p>
              </div>
            ) : (
              <>
                {/* Preference Level Options */}
              {extractedProduct && (
                <div className="space-y-3">
                  <p className="text-xs text-[#6B4423] mb-2">Select your preferred options for each preference level:</p>

{/* I Wish Option Card - Golden Honey (Primary Brand Color) - REQUIRED */}
                  <div
                    className={`rounded-lg border-2 transition-all duration-200 ${
                      likeSelected
                        ? "border-[#B8860B] bg-gradient-to-r from-[#DAA520]/30 to-[#F4C430]/25 shadow-md"
                        : "border-[#8B5A3C]/20 bg-white/50 hover:border-[#DAA520]/50"
                    }`}
                  >
                    <div className="w-full p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#F4C430] text-white flex items-center gap-1 shadow-sm">
                          <Heart className="w-3 h-3 fill-red-500 text-red-500" /> I Wish
                        </span>
                        <span className="text-[10px] text-red-500 font-medium">* Required</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Only show these buttons when product data exists */}
                        {!(iWishCleared || (!extractedProduct && !gift?.giftName)) && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                if (extractedProduct?.productLink) {
                                  const url = addAffiliateTag(extractedProduct.productLink)
                                  window.open(url, '_blank')
                                  setLikeSelected(true)
                                  // Clear previous data for fresh state
                                  setLikeClippedImage(null)
                                  setLikeClippedTitle(null)
                                  setLikeStyle("")
                                  setLikeColor("")
                                  setLikeSize("")
                                  setLikeConfiguration("")
                                  setAwaitingExtensionFor("like")
                                  console.log('[Modal] Like - Set awaitingExtensionFor to like, polling should start')
                                }
                              }}
                              className="text-[10px] text-[#4A2F1A] font-medium hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              Select on Retailer
                            </button>
                            {/* Manual refresh button when waiting */}
                            {awaitingExtensionFor === "like" && (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  console.log('[Modal] Manual refresh triggered for like')
                                  try {
                                    const response = await fetch('/api/extension/save-variants', {
                                      method: 'GET',
                                      credentials: 'include',
                                    })
                                    if (response.ok) {
                                      const data = await response.json()
                                      console.log('[Modal] Manual refresh data:', data)
                                      if (data.variants && Object.keys(data.variants).length > 0) {
                                        // Process the data for I Wish
                                        if (data.image) {
                                          setLikeClippedImage(data.image)
                                          console.log('[Modal] Like - Set image:', data.image)
                                        }
                                        if (data.title) setLikeClippedTitle(data.title)
                                        // Set variant fields
                                        const variants = data.variants
                                        if (variants.color) setLikeColor(variants.color)
                                        if (variants.style) setLikeStyle(variants.style)
                                        if (variants.set) setLikeConfiguration(variants.set)
                                        if (variants.size) setLikeSize(variants.size)
                                        // Check specifications for Style
                                        if (!variants.style && data.specifications?.Style) {
                                          const styleVal = data.specifications.Style.replace(/^[\u200E\u200F\u202A-\u202E]+/, '').trim()
                                          if (styleVal) setLikeStyle(styleVal)
                                        }
                                        setAwaitingExtensionFor(null)
                                        toast({
                                          title: "🐝 Options Received!",
                                          description: "I Wish options updated from extension.",
                                          variant: "warm",
                                        })
                                      }
                                    }
                                  } catch (err) {
                                    console.log('[Modal] Manual refresh error:', err)
                                  }
                                }}
                                className="text-[10px] text-[#DAA520] font-medium hover:underline flex items-center gap-1 animate-pulse"
                              >
                                🔄 Refresh
                              </button>
                            )}
                            {/* Edit and Delete buttons for I Wish */}
                            {likeSelected && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setIsEditingIWish(!isEditingIWish)}
                                  className={`p-1.5 rounded-full transition-colors ${isEditingIWish ? 'bg-[#DAA520] text-white' : 'bg-[#DAA520]/20 hover:bg-[#DAA520]/40 text-[#654321]'}`}
                                  title={isEditingIWish ? "Done editing" : "Edit I Wish details"}
                                >
                                  {isEditingIWish ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Clear all I Wish data
                                    setIWishTitle("")
                                    setIWishStore("")
                                    setIWishRating("")
                                    setIWishReviewCount("")
                                    setIWishPrice("")
                                    setIWishAmazonChoice(false)
                                    setIWishBestSeller(false)
                                    setIWishSpecs({})
                                    setLikeStyle("")
                                    setLikeColor("")
                                    setLikeSize("")
                                    setLikeConfiguration("")
                                    setLikeClippedImage(null)
                                    setLikeClippedTitle(null)
                                    setLikeNotes("")
                                    setIsEditingIWish(false)
                                    setExtractedProduct(null)
                                    setIWishProductUrl("") // Clear the product URL
                                    setIWishCleared(true) // Mark as cleared to show URL/Extension input
                                  }}
                                  className="p-1.5 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                                  title="Clear I Wish section"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    {likeSelected && (
                      <div className="px-3 pb-3 space-y-2">
                        {/* Show URL/Extension input when no product data or when cleared */}
                        {iWishCleared || (!extractedProduct && !gift?.giftName) ? (
                          <div className="space-y-3">
                            {/* Method Toggle - Paste URL or Clip via Extension */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setIWishAddMethod("url")}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                  iWishAddMethod === "url"
                                    ? "bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white shadow-md"
                                    : "bg-white text-[#654321] border border-[#DAA520]/30 hover:border-[#DAA520]"
                                }`}
                              >
                                <Link2 className="w-4 h-4" />
                                Paste Product URL
                              </button>
                              <span className="text-xs font-semibold text-[#8B6914]">OR</span>
                              <button
                                type="button"
                                onClick={() => setIWishAddMethod("extension")}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                  iWishAddMethod === "extension"
                                    ? "bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white shadow-md"
                                    : "bg-white text-[#654321] border border-[#DAA520]/30 hover:border-[#DAA520]"
                                }`}
                              >
                                <Scissors className="w-4 h-4" />
                                Clip via Extension
                              </button>
                            </div>

                            {/* Paste URL Option */}
                            {iWishAddMethod === "url" && (
                              <div className="bg-white/80 rounded-lg p-3 border border-[#DAA520]/20">
                                <div className="flex gap-2">
                                  <input
                                    type="url"
                                    value={iWishProductUrl}
                                    onChange={(e) => setIWishProductUrl(e.target.value)}
                                    onPaste={async (e) => {
                                      // Get pasted text from clipboard
                                      const pastedText = e.clipboardData.getData('text').trim()
                                      if (!pastedText) return
                                      
                                      // Update the input value
                                      setIWishProductUrl(pastedText)
                                      
                                      // Auto-extract if it looks like a URL
                                      if (pastedText.startsWith('http://') || pastedText.startsWith('https://')) {
                                        e.preventDefault() // Prevent default paste to avoid double-setting
                                        setIsExtractingIWish(true)
                                        try {
                                          const response = await fetch("/api/ai/extract-product", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ url: pastedText }),
                                          })
                                          if (response.ok) {
                                            const data = await response.json()
                                            const extracted = data.productData || data
                                            // Populate I Wish fields
                                            setIWishTitle(extracted.productName || "")
                                            setIWishStore(extracted.storeName || "")
                                            setIWishRating(extracted.rating?.toString() || "")
                                            setIWishReviewCount(extracted.reviewCount?.toString() || "")
                                            setIWishPrice(extracted.price?.toString() || "")
                                            setIWishAmazonChoice(extracted.amazonChoice || false)
                                            setIWishBestSeller(extracted.bestSeller || false)
                                            setLikeClippedImage(extracted.imageUrl || null)
                                            setLikeClippedTitle(extracted.productName || null)
                                            // Populate specs
                                            if (extracted.attributes) {
                                              const specs: Record<string, string> = {}
                                              const excludedKeys = ['color', 'size', 'style', 'brand', 'sizeOptions', 'colorVariants', 'combinedVariants', 'styleOptions', 'styleName', 'patternName', 'configuration', 'set']
                                              Object.entries(extracted.attributes).forEach(([key, value]) => {
                                                if (!excludedKeys.includes(key.toLowerCase()) && value) {
                                                  specs[key] = String(value)
                                                }
                                              })
                                              setIWishSpecs(specs)
                                              // Populate variant options
                                              if (extracted.attributes.color) setLikeColor(extracted.attributes.color)
                                              if (extracted.attributes.size) setLikeSize(extracted.attributes.size)
                                              if (extracted.attributes.style) setLikeStyle(extracted.attributes.style)
                                              if (extracted.attributes.configuration || extracted.attributes.set) setLikeConfiguration(extracted.attributes.configuration || extracted.attributes.set)
                                            }
                                            setIWishCleared(false) // Show product details
                                            toast({ title: "🐝 Product Extracted!", description: "Product details have been filled in.", variant: "warm" })
                                          } else {
                                            toast({ title: "Extraction Failed", description: "Could not extract product details.", variant: "destructive" })
                                          }
                                        } catch (error) {
                                          console.error("Extraction error:", error)
                                          toast({ title: "Extraction Failed", description: "Could not extract product details.", variant: "destructive" })
                                        } finally {
                                          setIsExtractingIWish(false)
                                        }
                                      }
                                    }}
                                    placeholder="Paste product link to extract product details"
                                    className="w-full px-3 py-2 border-2 border-[#DAA520]/30 rounded-lg focus:border-[#DAA520] focus:ring-2 focus:ring-amber-200 text-xs flex-1 bg-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (!iWishProductUrl.trim()) return
                                      setIsExtractingIWish(true)
                                      try {
                                        const response = await fetch("/api/ai/extract-product", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ url: iWishProductUrl }),
                                        })
                                        if (response.ok) {
                                          const data = await response.json()
                                          const extracted = data.productData || data
                                          // Populate I Wish fields
                                          setIWishTitle(extracted.productName || "")
                                          setIWishStore(extracted.storeName || "")
                                          setIWishRating(extracted.rating?.toString() || "")
                                          setIWishReviewCount(extracted.reviewCount?.toString() || "")
                                          setIWishPrice(extracted.price?.toString() || "")
                                          setIWishAmazonChoice(extracted.amazonChoice || false)
                                          setIWishBestSeller(extracted.bestSeller || false)
                                          setLikeClippedImage(extracted.imageUrl || null)
                                          setLikeClippedTitle(extracted.productName || null)
                                          // Populate specs
                                          if (extracted.attributes) {
                                            const specs: Record<string, string> = {}
                                            const excludedKeys = ['color', 'size', 'style', 'brand', 'sizeOptions', 'colorVariants', 'combinedVariants', 'styleOptions', 'styleName', 'patternName', 'configuration', 'set']
                                            Object.entries(extracted.attributes).forEach(([key, value]) => {
                                              if (!excludedKeys.includes(key.toLowerCase()) && value) {
                                                specs[key] = String(value)
                                              }
                                            })
                                            setIWishSpecs(specs)
                                            // Populate variant options
                                            if (extracted.attributes.color) setLikeColor(extracted.attributes.color)
                                            if (extracted.attributes.size) setLikeSize(extracted.attributes.size)
                                            if (extracted.attributes.style) setLikeStyle(extracted.attributes.style)
                                            if (extracted.attributes.configuration || extracted.attributes.set) setLikeConfiguration(extracted.attributes.configuration || extracted.attributes.set)
                                          }
                                          setIWishCleared(false) // Show product details
                                          toast({ title: "🐝 Product Extracted!", description: "Product details have been filled in.", variant: "warm" })
                                        } else {
                                          toast({ title: "Extraction Failed", description: "Could not extract product details.", variant: "destructive" })
                                        }
                                      } catch (error) {
                                        console.error("Extraction error:", error)
                                        toast({ title: "Extraction Failed", description: "Could not extract product details.", variant: "destructive" })
                                      } finally {
                                        setIsExtractingIWish(false)
                                      }
                                    }}
                                    disabled={isExtractingIWish || !iWishProductUrl.trim()}
                                    className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white hover:from-[#DAA520] hover:to-[#B8860B] whitespace-nowrap px-3 py-2 rounded-lg font-semibold text-xs disabled:opacity-50"
                                  >
                                    {isExtractingIWish ? (
                                      <><Loader2 className="w-3 h-3 animate-spin inline mr-1" />Extracting...</>
                                    ) : (
                                      <><Sparkles className="w-3 h-3 inline mr-1" />AI Extract</>
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Clip via Extension Option */}
                            {iWishAddMethod === "extension" && (
                              <div className="bg-white/80 rounded-lg p-4 border border-[#DAA520]/20">
                                {isWaitingForIWishClip ? (
                                  <div className="flex flex-col items-center gap-3">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#DAA520]/20 to-[#F4C430]/20 rounded-full border border-[#DAA520]/40">
                                      <Loader2 className="w-4 h-4 animate-spin text-[#DAA520]" />
                                      <span className="text-sm font-semibold text-[#654321]">Listening for clip...</span>
                                    </div>
                                    <p className="text-xs text-[#8B6914] text-center">Open a product page and use the Wishbee extension to clip it.</p>
                                    <button
                                      type="button"
                                      onClick={() => setIsWaitingForIWishClip(false)}
                                      className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <p className="text-xs text-[#654321] text-center">
                                      Click <span className="font-semibold text-[#DAA520]">Start Listening</span>, then browse any product page and clip it with the Wishbee extension.
                                    </p>
                                    <div className="flex justify-center">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setIsWaitingForIWishClip(true)
                                          setAwaitingExtensionFor("like")
                                        }}
                                        className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520] font-semibold px-4 py-1.5 rounded-lg text-xs shadow-sm"
                                      >
                                        Start Listening
                                      </button>
                                    </div>
                                    <p className="text-[10px] text-[#8B6914]/70 text-center">
                                      Don't have the extension? <a href="https://wishbee.ai/extension" target="_blank" rel="noopener noreferrer" className="text-[#DAA520] font-semibold hover:underline">Get it free →</a>
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                        {/* Product Image & Details Row */}
                        <div className="flex gap-3 mb-3">
                          {/* Product Image with edit/delete overlay */}
                          <div className="flex-shrink-0">
                            <input
                              ref={likeImageInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleLikeImageUpload}
                              className="hidden"
                            />
                            {showLikeImageInput ? (
                              <div className="w-32 space-y-1">
                                <p className="text-[8px] text-[#654321] leading-tight">
                                  💡 Right-click image → Open in new tab → Copy URL from address bar
                                </p>
                                <input
                                  type="text"
                                  value={likeImageUrlInput}
                                  onChange={(e) => setLikeImageUrlInput(e.target.value)}
                                  placeholder="Paste image URL here"
                                  className="w-full px-1.5 py-1 text-[10px] border border-[#DAA520] rounded focus:outline-none focus:ring-1 focus:ring-[#DAA520]"
                                  autoFocus
                                  onKeyDown={(e) => e.key === 'Enter' && handleLikeImageUrlSubmit()}
                                />
                                <div className="flex gap-1">
                                  <button onClick={handleLikeImageUrlSubmit} className="flex-1 px-1 py-0.5 bg-green-500 text-white text-[9px] rounded hover:bg-green-600">Save</button>
                                  <button onClick={() => { setShowLikeImageInput(false); setLikeImageUrlInput(""); }} className="flex-1 px-1 py-0.5 bg-gray-300 text-gray-700 text-[9px] rounded hover:bg-gray-400">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div className="relative group">
                                <img
                                  src={likeClippedImage || extractedProduct?.imageUrl || gift?.image || "/placeholder.svg"}
                                  alt={likeClippedTitle || extractedProduct?.productName || 'Selected product'}
                                  className="w-20 h-20 object-contain rounded-lg bg-white border border-[#DAA520]/20"
                                />
                                <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                  <button onClick={() => setShowLikeImageInput(true)} className="p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors" title="Paste image URL"><Pencil className="w-3.5 h-3.5 text-blue-600" /></button>
                                  <button onClick={() => likeImageInputRef.current?.click()} className="p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors" title="Upload image"><Upload className="w-3.5 h-3.5 text-amber-600" /></button>
                                  {likeClippedImage && <button onClick={handleLikeImageDelete} className="p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors" title="Remove image"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Product Info - Editable when isEditingIWish is true */}
                          <div className="flex-1 min-w-0">
                            {/* Product Title */}
                            {isEditingIWish ? (
                              <input
                                type="text"
                                value={iWishTitle}
                                onChange={(e) => setIWishTitle(e.target.value)}
                                placeholder="Product title..."
                                className="w-full text-xs font-bold text-[#4A2F1A] bg-white border border-[#DAA520]/30 rounded px-2 py-1 mb-1 focus:outline-none focus:border-[#DAA520]"
                              />
                            ) : (
                              <h4 className="text-xs font-bold text-[#4A2F1A] line-clamp-2 leading-tight mb-1">
                                {iWishTitle || likeClippedTitle || extractedProduct?.productName || gift?.giftName || 'Product'}
                              </h4>
                            )}
                            
                            {/* Store Name */}
                            {isEditingIWish ? (
                              <input
                                type="text"
                                value={iWishStore}
                                onChange={(e) => setIWishStore(e.target.value)}
                                placeholder="Store name..."
                                className="w-full text-[10px] text-[#8B6914] bg-white border border-[#DAA520]/30 rounded px-2 py-0.5 mb-1 focus:outline-none focus:border-[#DAA520]"
                              />
                            ) : (iWishStore || extractedProduct?.storeName || gift?.source) ? (
                              <p className="text-[10px] text-[#8B6914] mb-1 flex items-center gap-1">
                                <span className="w-1 h-1 bg-[#DAA520] rounded-full"></span>
                                {iWishStore || extractedProduct?.storeName || gift?.source}
                              </p>
                            ) : null}
                            
                            {/* Rating & Review Count */}
                            {isEditingIWish ? (
                              <div className="flex items-center gap-2 mb-1">
                                <input
                                  type="text"
                                  value={iWishRating}
                                  onChange={(e) => setIWishRating(e.target.value)}
                                  placeholder="Rating (e.g., 4.5)"
                                  className="w-16 text-[10px] bg-white border border-[#DAA520]/30 rounded px-2 py-0.5 focus:outline-none focus:border-[#DAA520]"
                                />
                                <input
                                  type="text"
                                  value={iWishReviewCount}
                                  onChange={(e) => setIWishReviewCount(e.target.value)}
                                  placeholder="Reviews"
                                  className="w-20 text-[10px] bg-white border border-[#DAA520]/30 rounded px-2 py-0.5 focus:outline-none focus:border-[#DAA520]"
                                />
                              </div>
                            ) : (parseFloat(iWishRating) || extractedProduct?.rating || gift?.rating) ? (
                              <div className="flex items-center gap-1.5 mb-1">
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => {
                                    const rating = parseFloat(iWishRating) || extractedProduct?.rating || gift?.rating || 0
                                    const fillAmount = Math.max(0, Math.min(1, rating - (star - 1)))
                                    return (
                                      <Star
                                        key={star}
                                        className="w-3 h-3"
                                        fill={fillAmount >= 1 ? "#F4C430" : fillAmount > 0 ? `url(#star-grad-${star})` : "#E5E7EB"}
                                        stroke={fillAmount > 0 ? "#F4C430" : "#E5E7EB"}
                                        strokeWidth={1}
                                      />
                                    )
                                  })}
                                </div>
                                <span className="text-[10px] font-bold text-[#654321]">{(parseFloat(iWishRating) || extractedProduct?.rating || gift?.rating)?.toFixed(1)}</span>
                                {(parseInt(iWishReviewCount) || extractedProduct?.reviewCount || gift?.reviewCount) && (
                                  <span className="text-[9px] text-gray-500">({(parseInt(iWishReviewCount) || extractedProduct?.reviewCount || gift?.reviewCount)?.toLocaleString()})</span>
                                )}
                              </div>
                            ) : null}
                            
                            {/* Badges */}
                            {isEditingIWish ? (
                              <div className="flex flex-wrap gap-2 mb-1">
                                <label className="flex items-center gap-1 text-[9px] text-[#654321] cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={iWishAmazonChoice}
                                    onChange={(e) => setIWishAmazonChoice(e.target.checked)}
                                    className="w-3 h-3 accent-[#DAA520]"
                                  />
                                  Amazon's Choice
                                </label>
                                <label className="flex items-center gap-1 text-[9px] text-[#654321] cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={iWishBestSeller}
                                    onChange={(e) => setIWishBestSeller(e.target.checked)}
                                    className="w-3 h-3 accent-[#D14900]"
                                  />
                                  #1 Best Seller
                                </label>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-1 mb-1">
                                {(iWishAmazonChoice || extractedProduct?.amazonChoice || gift?.amazonChoice) && (
                                  <span className="bg-gradient-to-r from-gray-900 to-black text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">Amazon's Choice</span>
                                )}
                                {(iWishBestSeller || extractedProduct?.bestSeller || gift?.bestSeller) && (
                                  <span className="text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#D14900' }}>#1 Best Seller</span>
                                )}
                              </div>
                            )}
                            
                            {/* Price */}
                            {isEditingIWish ? (
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-bold text-[#654321]">$</span>
                                <input
                                  type="text"
                                  value={iWishPrice}
                                  onChange={(e) => setIWishPrice(e.target.value)}
                                  placeholder="0.00"
                                  className="w-24 text-sm font-bold text-[#654321] bg-white border border-[#DAA520]/30 rounded px-2 py-0.5 focus:outline-none focus:border-[#DAA520]"
                                />
                              </div>
                            ) : (parseFloat(iWishPrice) || extractedProduct?.price || gift?.targetAmount) ? (
                              <p className="text-sm font-bold text-[#654321]">
                                ${typeof (parseFloat(iWishPrice) || extractedProduct?.price || gift?.targetAmount) === 'number' 
                                  ? (parseFloat(iWishPrice) || extractedProduct?.price || gift?.targetAmount)?.toFixed(2) 
                                  : iWishPrice || extractedProduct?.price || gift?.targetAmount}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        {/* Specifications Section - Editable when isEditingIWish is true */}
                        {(Object.keys(iWishSpecs).length > 0 || isEditingIWish) && (
                          <div className="bg-white/60 rounded-lg p-2 border border-[#DAA520]/20 mb-2">
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider flex items-center gap-1">
                                <span className="w-1 h-1 bg-[#DAA520] rounded-full"></span>
                                Specifications
                              </p>
                              {isEditingIWish && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newKey = `Spec ${Object.keys(iWishSpecs).length + 1}`
                                    setIWishSpecs(prev => ({ ...prev, [newKey]: '' }))
                                  }}
                                  className="flex items-center gap-1 text-[9px] font-semibold text-[#DAA520] hover:text-[#B8860B] transition-colors"
                                >
                                  <Plus className="w-3 h-3" /> Add
                                </button>
                              )}
                            </div>
                            <div className="space-y-1">
                              {Object.entries(iWishSpecs)
                                .slice(0, showAllIWishSpecs ? undefined : 4)
                                .map(([key, value]) => (
                                  <div key={key} className="flex items-center gap-2">
                                    {isEditingIWish ? (
                                      <>
                                        <input
                                          type="text"
                                          defaultValue={key}
                                          onBlur={(e) => {
                                            const newKey = e.target.value.trim()
                                            if (newKey && newKey !== key) {
                                              const newSpecs = { ...iWishSpecs }
                                              const oldValue = newSpecs[key]
                                              delete newSpecs[key]
                                              newSpecs[newKey] = oldValue
                                              setIWishSpecs(newSpecs)
                                            }
                                          }}
                                          className="text-[10px] text-[#6B4423] w-20 font-medium px-1 py-0.5 border border-[#DAA520]/30 rounded bg-white focus:border-[#DAA520] focus:outline-none shrink-0"
                                        />
                                        <span className="text-[10px] text-[#6B4423] shrink-0">:</span>
                                        <input
                                          type="text"
                                          value={value}
                                          onChange={(e) => setIWishSpecs(prev => ({ ...prev, [key]: e.target.value }))}
                                          className="flex-1 text-[10px] px-2 py-0.5 border border-[#DAA520]/30 rounded bg-white focus:outline-none focus:border-[#DAA520] min-w-0"
                                          placeholder="Enter value..."
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newSpecs = { ...iWishSpecs }
                                            delete newSpecs[key]
                                            setIWishSpecs(newSpecs)
                                          }}
                                          className="p-0.5 text-red-500 hover:text-red-700 transition-colors"
                                          title="Remove specification"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <span className="text-[10px] text-[#6B4423] font-medium shrink-0 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <span className="text-[10px] text-[#6B4423] shrink-0">:</span>
                                        <span className="text-[10px] text-[#654321] font-semibold truncate">{value}</span>
                                      </>
                                    )}
                                  </div>
                                ))
                              }
                              {Object.keys(iWishSpecs).length > 4 && (
                                <button
                                  type="button"
                                  onClick={() => setShowAllIWishSpecs(!showAllIWishSpecs)}
                                  className="text-left text-[8px] font-bold text-[#DAA520] mt-1 hover:text-[#B8860B] hover:underline cursor-pointer transition-colors"
                                >
                                  {showAllIWishSpecs ? 'Show less' : `+${Object.keys(iWishSpecs).length - 4} more specs`}
                                </button>
                              )}
                              {Object.keys(iWishSpecs).length === 0 && isEditingIWish && (
                                <p className="text-[9px] text-[#8B6914] italic">Click "+ Add" to add specs</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Selected Options - Styled box like create page */}
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <div className="bg-white/60 rounded-lg p-2 border border-[#DAA520]/20">
                              <div className="flex items-center justify-between mb-1.5">
                                <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider flex items-center gap-1">
                                  <span className="w-1 h-1 bg-[#B8860B] rounded-full"></span>
                                  Selected Options
                                </p>
                              </div>
                              <div className="space-y-1.5">
                            {/* Selected Options - Style, Color, Size, Set - editable when isEditingIWish is true */}
                            {/* Style */}
                            {(likeStyle || isEditingIWish) && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-medium text-[#6B4423] w-16 shrink-0">Style:</span>
                                {isEditingIWish ? (
                                  <>
                                    <input
                                      type="text"
                                      value={likeStyle}
                                      onChange={(e) => setLikeStyle(e.target.value)}
                                      placeholder="Enter style..."
                                      className="flex-1 px-2 py-1 text-[10px] border border-[#DAA520]/30 rounded bg-white focus:outline-none focus:border-[#DAA520]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setLikeStyle("")}
                                      className="p-1 hover:bg-red-100 rounded transition-colors"
                                      title="Remove style"
                                    >
                                      <X className="w-3 h-3 text-red-500" />
                                    </button>
                                  </>
                                ) : likeStyle && isValidVariantValue(likeStyle) ? (
                                  <span className="text-[10px] text-[#654321] font-semibold">{getCleanVariantDisplay(likeStyle)}</span>
                                ) : (
                                  <span className="text-[10px] text-gray-400 italic">Not set</span>
                                )}
                              </div>
                            )}
                            {/* Color */}
                            {(likeColor || isEditingIWish) && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-medium text-[#6B4423] w-16 shrink-0">Color:</span>
                                {isEditingIWish ? (
                                  <>
                                    <input
                                      type="text"
                                      value={likeColor}
                                      onChange={(e) => setLikeColor(e.target.value)}
                                      placeholder="Enter color..."
                                      className="flex-1 px-2 py-1 text-[10px] border border-[#DAA520]/30 rounded bg-white focus:outline-none focus:border-[#DAA520]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setLikeColor("")}
                                      className="p-1 hover:bg-red-100 rounded transition-colors"
                                      title="Remove color"
                                    >
                                      <X className="w-3 h-3 text-red-500" />
                                    </button>
                                  </>
                                ) : likeColor && isValidVariantValue(likeColor) ? (
                                  <span className="text-[10px] text-[#654321] font-semibold">{getCleanVariantDisplay(likeColor)}</span>
                                ) : (
                                  <span className="text-[10px] text-gray-400 italic">Not set</span>
                                )}
                              </div>
                            )}
                            {/* Size */}
                            {(likeSize || isEditingIWish) && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-medium text-[#6B4423] w-16 shrink-0">Size:</span>
                                {isEditingIWish ? (
                                  <>
                                    <input
                                      type="text"
                                      value={likeSize}
                                      onChange={(e) => setLikeSize(e.target.value)}
                                      placeholder="Enter size..."
                                      className="flex-1 px-2 py-1 text-[10px] border border-[#DAA520]/30 rounded bg-white focus:outline-none focus:border-[#DAA520]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setLikeSize("")}
                                      className="p-1 hover:bg-red-100 rounded transition-colors"
                                      title="Remove size"
                                    >
                                      <X className="w-3 h-3 text-red-500" />
                                    </button>
                                  </>
                                ) : likeSize && isValidVariantValue(likeSize) ? (
                                  <span className="text-[10px] text-[#654321] font-semibold">{getCleanVariantDisplay(likeSize)}</span>
                                ) : (
                                  <span className="text-[10px] text-gray-400 italic">Not set</span>
                                )}
                              </div>
                            )}
                            {/* Configuration/Set */}
                            {(likeConfiguration || isEditingIWish) && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-medium text-[#6B4423] w-16 shrink-0">Config:</span>
                                {isEditingIWish ? (
                                  <>
                                    <input
                                      type="text"
                                      value={likeConfiguration}
                                      onChange={(e) => setLikeConfiguration(e.target.value)}
                                      placeholder="Enter configuration..."
                                      className="flex-1 px-2 py-1 text-[10px] border border-[#DAA520]/30 rounded bg-white focus:outline-none focus:border-[#DAA520]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setLikeConfiguration("")}
                                      className="p-1 hover:bg-red-100 rounded transition-colors"
                                      title="Remove configuration"
                                    >
                                      <X className="w-3 h-3 text-red-500" />
                                    </button>
                                  </>
                                ) : likeConfiguration && isValidVariantValue(likeConfiguration) ? (
                                  <span className="text-[10px] text-[#654321] font-semibold">{getCleanVariantDisplay(likeConfiguration)}</span>
                                ) : (
                                  <span className="text-[10px] text-gray-400 italic">Not set</span>
                                )}
                              </div>
                            )}
                            
                            {/* Add Field UI */}
                            {isAddingLikeField ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={newLikeFieldName}
                                  onChange={(e) => setNewLikeFieldName(e.target.value)}
                                  placeholder="Field name"
                                  className="w-16 shrink-0 px-2 py-1 text-[10px] font-medium text-[#6B4423] border border-[#DAA520]/30 rounded bg-white focus:outline-none focus:border-[#DAA520]"
                                />
                                <input
                                  type="text"
                                  value={newLikeFieldValue}
                                  onChange={(e) => setNewLikeFieldValue(e.target.value)}
                                  placeholder="Enter value..."
                                  className="flex-1 px-2 py-1 text-[10px] border border-[#DAA520]/30 rounded bg-white focus:outline-none focus:border-[#DAA520]"
                                  onKeyDown={(e) => e.key === 'Enter' && addNewLikeField()}
                                />
                                <button 
                                  type="button"
                                  onClick={addNewLikeField} 
                                  className="p-1 hover:bg-green-100 rounded transition-colors"
                                  title="Save field"
                                >
                                  <Check className="w-3 h-3 text-green-600" />
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => { setIsAddingLikeField(false); setNewLikeFieldName(""); setNewLikeFieldValue(""); }} 
                                  className="p-1 hover:bg-red-100 rounded transition-colors"
                                  title="Cancel"
                                >
                                  <X className="w-3 h-3 text-red-500" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setIsAddingLikeField(true)}
                                className="flex items-center gap-1 text-[10px] text-[#DAA520] hover:text-[#B8860B] mt-1"
                              >
                                <Plus className="w-3 h-3" />
                                Add Field
                              </button>
                            )}
                            
                            {/* Show message if no valid options are set */}
                            {!(likeStyle && isValidVariantValue(likeStyle)) && 
                             !(likeColor && isValidVariantValue(likeColor)) && 
                             !(likeSize && isValidVariantValue(likeSize)) && 
                             !(likeConfiguration && isValidVariantValue(likeConfiguration)) &&
                             !isAddingLikeField && (
                              <p className="text-[10px] text-gray-500 italic">
                                Click "Select on Retailer" to choose your options
                              </p>
                            )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Custom Fields Section */}
                        {likeCustomFields.length > 0 && (
                          <div className="space-y-1.5 mt-2">
                            {likeCustomFields.map((field) => (
                              <div key={field.id} className="flex items-center gap-2 group">
                                <input
                                  type="text"
                                  value={field.key}
                                  onChange={(e) => setLikeCustomFields(prev => 
                                    prev.map(f => f.id === field.id ? { ...f, key: e.target.value } : f)
                                  )}
                                  placeholder="Field name"
                                  className="w-20 px-2 py-0.5 text-xs border border-[#DAA520]/30 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#DAA520] text-[#4A2F1A]"
                                />
                                <input
                                  type="text"
                                  value={field.value}
                                  onChange={(e) => setLikeCustomFields(prev => 
                                    prev.map(f => f.id === field.id ? { ...f, value: e.target.value } : f)
                                  )}
                                  placeholder="Value"
                                  className="flex-1 px-2 py-0.5 text-xs border border-[#DAA520]/30 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#DAA520] text-[#4A2F1A]"
                                />
                                <button
                                  type="button"
                                  onClick={() => setLikeCustomFields(prev => prev.filter(f => f.id !== field.id))}
                                  className="p-0.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Notes Section - Styled box like create page */}
                        <div className="bg-white/60 rounded-lg p-2 border border-[#DAA520]/20 mt-2">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider flex items-center gap-1">
                              <span className="w-1 h-1 bg-[#DAA520] rounded-full"></span>
                              Notes
                            </p>
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
                            className="w-full px-2 py-1.5 text-[10px] border border-[#DAA520]/30 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#DAA520] text-[#4A2F1A] resize-none"
                            rows={2}
                          />
                        </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

{/* Alternative Option Card - Warm Amber - OPTIONAL */}
                  <div
                    className={`rounded-lg border-2 transition-all duration-200 ${
                      altSelected
                        ? "border-[#D97706] bg-gradient-to-r from-[#D97706]/15 to-[#F59E0B]/15"
                        : "border-[#8B5A3C]/20 bg-white/50 hover:border-[#D97706]/50"
                    }`}
                  >
                    <div 
                      className="w-full p-3 flex items-center justify-between cursor-pointer"
                      onClick={() => setAltSelected(!altSelected)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-white">
                          ✓ Alternative
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">Optional</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Only show these buttons when alternative product data exists */}
                        {!(altCleared || (!altClippedImage && !altClippedTitle && !altTitle)) && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (extractedProduct?.productLink) {
                                  const url = addAffiliateTag(extractedProduct.productLink)
                                  window.open(url, '_blank')
                                  setAltSelected(true)
                                  // Clear any previous alt data to ensure fresh state
                                  setAltClippedImage(null)
                                  setAltClippedTitle(null)
                                  setAltStyle("")
                                  setAltColor("")
                                  setAltSize("")
                                  setAltConfiguration("")
                                  setAwaitingExtensionFor("alt")
                                  console.log('[Modal] Alt - Set awaitingExtensionFor to alt, polling should start')
                                }
                              }}
                              className="text-[10px] text-[#4A2F1A] font-medium hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              Select on Retailer
                            </button>
                            {/* Manual refresh button when waiting */}
                            {awaitingExtensionFor === "alt" && (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  console.log('[Modal] Manual refresh triggered for alt')
                                  try {
                                    const response = await fetch('/api/extension/save-variants', {
                                      method: 'GET',
                                      credentials: 'include',
                                    })
                                    if (response.ok) {
                                      const data = await response.json()
                                      console.log('[Modal] Manual refresh data:', data)
                                      if (data.variants && Object.keys(data.variants).length > 0) {
                                        console.log('[Modal] Alt Refresh - Raw variants:', JSON.stringify(data.variants))
                                        
                                        // Process the data for Alternative
                                        if (data.image) {
                                          setAltClippedImage(data.image)
                                          console.log('[Modal] Alt - Set image:', data.image)
                                        }
                                        if (data.title) setAltClippedTitle(data.title)
                                        
                                        // Normalize and set variant fields (handle both lowercase and capitalized keys)
                                        const variants = data.variants
                                        const colorVal = variants.color || variants.Color
                                        const styleVal = variants.style || variants.Style
                                        const setVal = variants.set || variants.Set || variants.configuration || variants.Configuration
                                        const sizeVal = variants.size || variants.Size
                                        
                                        console.log('[Modal] Alt Refresh - Normalized: color=', colorVal, 'style=', styleVal, 'set=', setVal, 'size=', sizeVal)
                                        
                                        if (colorVal && isValidVariantValue(colorVal)) {
                                          setAltColor(colorVal)
                                          console.log('[Modal] Alt - Set color:', colorVal)
                                        }
                                        if (styleVal && isValidVariantValue(styleVal)) {
                                          setAltStyle(styleVal)
                                          console.log('[Modal] Alt - Set style:', styleVal)
                                        }
                                        if (setVal && isValidVariantValue(setVal)) {
                                          setAltConfiguration(setVal)
                                          console.log('[Modal] Alt - Set configuration:', setVal)
                                        }
                                        if (sizeVal && isValidVariantValue(sizeVal)) {
                                          setAltSize(sizeVal)
                                          console.log('[Modal] Alt - Set size:', sizeVal)
                                        }
                                        
                                        // Check specifications for Style as fallback
                                        if (!styleVal && data.specifications?.Style) {
                                          const specStyleVal = data.specifications.Style.replace(/^[\u200E\u200F\u202A-\u202E]+/, '').trim()
                                          if (specStyleVal && isValidVariantValue(specStyleVal)) {
                                            setAltStyle(specStyleVal)
                                            console.log('[Modal] Alt - Set style from specs:', specStyleVal)
                                          }
                                        }
                                        
                                        setAwaitingExtensionFor(null)
                                        toast({
                                          title: "🐝 Options Received!",
                                          description: "Alternative options updated from extension.",
                                          variant: "warm",
                                        })
                                      }
                                    }
                                  } catch (err) {
                                    console.log('[Modal] Manual refresh error:', err)
                                  }
                                }}
                                className="text-[10px] text-[#D97706] font-medium hover:underline flex items-center gap-1 animate-pulse"
                              >
                                🔄 Refresh
                              </button>
                            )}
                            {/* Edit and Delete buttons for Alternative */}
                            {altSelected && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setIsEditingAlt(!isEditingAlt); }}
                                  className={`p-1.5 rounded-full transition-colors ${isEditingAlt ? 'bg-[#D97706] text-white' : 'bg-[#D97706]/20 hover:bg-[#D97706]/40 text-[#654321]'}`}
                                  title={isEditingAlt ? "Done editing" : "Edit Alternative details"}
                                >
                                  {isEditingAlt ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // Clear all Alternative data
                                    setAltTitle("")
                                    setAltStore("")
                                    setAltRating("")
                                    setAltReviewCount("")
                                    setAltPrice("")
                                    setAltAmazonChoice(false)
                                    setAltBestSeller(false)
                                    setAltSpecs({})
                                    setAltStyle("")
                                    setAltColor("")
                                    setAltSize("")
                                    setAltConfiguration("")
                                    setAltClippedImage(null)
                                    setAltClippedTitle(null)
                                    setAltNotes("")
                                    setIsEditingAlt(false)
                                    setAltProductUrl("") // Clear the product URL
                                    setAltCleared(true) // Mark as cleared to show URL/Extension input
                                  }}
                                  className="p-1.5 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                                  title="Clear Alternative section"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    {altSelected && (
                      <div className="px-3 pb-3 space-y-2">
                        {/* Helper text */}
                        <p className="text-[10px] text-[#92400E] bg-[#D97706]/10 px-2 py-1 rounded-md border border-[#D97706]/20 italic mb-2">
                          💡 Choose a backup option priced equal to or lower than your "I Wish" selection.
                        </p>
                        
                        {/* Show URL/Extension input when no alternative data or when cleared */}
                        {altCleared || (!altClippedImage && !altClippedTitle && !altTitle) ? (
                          <div className="space-y-3">
                            {/* Method Toggle - Paste URL or Clip via Extension */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setAltAddMethod("url")}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                  altAddMethod === "url"
                                    ? "bg-gradient-to-r from-[#B45309] to-[#D97706] text-white shadow-md"
                                    : "bg-white text-[#654321] border border-[#D97706]/30 hover:border-[#D97706]"
                                }`}
                              >
                                <Link2 className="w-4 h-4" />
                                Paste Product URL
                              </button>
                              <span className="text-xs font-semibold text-[#92400E]">OR</span>
                              <button
                                type="button"
                                onClick={() => setAltAddMethod("extension")}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                  altAddMethod === "extension"
                                    ? "bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-white shadow-md"
                                    : "bg-white text-[#654321] border border-[#D97706]/30 hover:border-[#D97706]"
                                }`}
                              >
                                <Scissors className="w-4 h-4" />
                                Clip via Extension
                              </button>
                            </div>

                            {/* Paste URL Option */}
                            {altAddMethod === "url" && (
                              <div className="bg-white/80 rounded-lg p-3 border border-[#D97706]/20">
                                <div className="flex gap-2">
                                  <input
                                    type="url"
                                    value={altProductUrl}
                                    onChange={(e) => setAltProductUrl(e.target.value)}
                                    onPaste={async (e) => {
                                      // Get pasted text from clipboard
                                      const pastedText = e.clipboardData.getData('text').trim()
                                      if (!pastedText) return
                                      
                                      // Update the input value
                                      setAltProductUrl(pastedText)
                                      
                                      // Auto-extract if it looks like a URL
                                      if (pastedText.startsWith('http://') || pastedText.startsWith('https://')) {
                                        e.preventDefault() // Prevent default paste to avoid double-setting
                                        setIsExtractingAlt(true)
                                        try {
                                          const response = await fetch("/api/ai/extract-product", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ url: pastedText }),
                                          })
                                          if (response.ok) {
                                            const data = await response.json()
                                            const extracted = data.productData || data
                                            // Populate Alternative fields
                                            setAltTitle(extracted.productName || "")
                                            setAltStore(extracted.storeName || "")
                                            setAltRating(extracted.rating?.toString() || "")
                                            setAltReviewCount(extracted.reviewCount?.toString() || "")
                                            setAltPrice(extracted.price?.toString() || "")
                                            setAltAmazonChoice(extracted.amazonChoice || false)
                                            setAltBestSeller(extracted.bestSeller || false)
                                            setAltClippedImage(extracted.imageUrl || null)
                                            setAltClippedTitle(extracted.productName || null)
                                            // Populate specs
                                            if (extracted.attributes) {
                                              const specs: Record<string, string> = {}
                                              const excludedKeys = ['color', 'size', 'style', 'brand', 'sizeOptions', 'colorVariants', 'combinedVariants', 'styleOptions', 'styleName', 'patternName', 'configuration', 'set']
                                              Object.entries(extracted.attributes).forEach(([key, value]) => {
                                                if (!excludedKeys.includes(key.toLowerCase()) && value) {
                                                  specs[key] = String(value)
                                                }
                                              })
                                              setAltSpecs(specs)
                                              // Populate variant options
                                              if (extracted.attributes.color) setAltColor(extracted.attributes.color)
                                              if (extracted.attributes.size) setAltSize(extracted.attributes.size)
                                              if (extracted.attributes.style) setAltStyle(extracted.attributes.style)
                                              if (extracted.attributes.configuration || extracted.attributes.set) setAltConfiguration(extracted.attributes.configuration || extracted.attributes.set)
                                            }
                                            setAltCleared(false) // Show product details
                                            setAltSelected(true) // Ensure Alternative is selected
                                            // Check if price is too high
                                            const extractedAltPrice = typeof extracted.price === 'string' ? parseFloat(extracted.price) : (extracted.price || 0)
                                            const iWishPriceNum = parseFloat(iWishPrice) || extractedProduct?.price || gift?.targetAmount || 0
                                            console.log('[Price Check Paste] Alt:', extractedAltPrice, 'I Wish:', iWishPriceNum)
                                            if (extractedAltPrice > 0 && iWishPriceNum > 0 && extractedAltPrice > iWishPriceNum) {
                                              setPriceWarningData({ altPrice: extractedAltPrice, iWishPrice: iWishPriceNum })
                                              setShowPriceWarning(true)
                                            } else {
                                              toast({ title: "🐝 Product Extracted!", description: "Alternative product details have been filled in.", variant: "warm" })
                                            }
                                          } else {
                                            toast({ title: "Extraction Failed", description: "Could not extract product details.", variant: "destructive" })
                                          }
                                        } catch (error) {
                                          console.error("Alternative extraction error:", error)
                                          toast({ title: "Extraction Failed", description: "Could not extract product details.", variant: "destructive" })
                                        } finally {
                                          setIsExtractingAlt(false)
                                        }
                                      }
                                    }}
                                    placeholder="Paste product link to extract product details"
                                    className="w-full px-3 py-2 border-2 border-[#D97706]/30 rounded-lg focus:border-[#D97706] focus:ring-2 focus:ring-orange-200 text-xs flex-1 bg-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (!altProductUrl.trim()) return
                                      setIsExtractingAlt(true)
                                      try {
                                        const response = await fetch("/api/ai/extract-product", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ url: altProductUrl }),
                                        })
                                        if (response.ok) {
                                          const data = await response.json()
                                          const extracted = data.productData || data
                                          // Populate Alternative fields
                                          setAltTitle(extracted.productName || "")
                                          setAltStore(extracted.storeName || "")
                                          setAltRating(extracted.rating?.toString() || "")
                                          setAltReviewCount(extracted.reviewCount?.toString() || "")
                                          setAltPrice(extracted.price?.toString() || "")
                                          setAltAmazonChoice(extracted.amazonChoice || false)
                                          setAltBestSeller(extracted.bestSeller || false)
                                          setAltClippedImage(extracted.imageUrl || null)
                                          setAltClippedTitle(extracted.productName || null)
                                          // Populate specs
                                          if (extracted.attributes) {
                                            const specs: Record<string, string> = {}
                                            const excludedKeys = ['color', 'size', 'style', 'brand', 'sizeOptions', 'colorVariants', 'combinedVariants', 'styleOptions', 'styleName', 'patternName', 'configuration', 'set']
                                            Object.entries(extracted.attributes).forEach(([key, value]) => {
                                              if (!excludedKeys.includes(key.toLowerCase()) && value) {
                                                specs[key] = String(value)
                                              }
                                            })
                                            setAltSpecs(specs)
                                            // Populate variant options
                                            if (extracted.attributes.color) setAltColor(extracted.attributes.color)
                                            if (extracted.attributes.size) setAltSize(extracted.attributes.size)
                                            if (extracted.attributes.style) setAltStyle(extracted.attributes.style)
                                            if (extracted.attributes.configuration || extracted.attributes.set) setAltConfiguration(extracted.attributes.configuration || extracted.attributes.set)
                                          }
                                          setAltCleared(false) // Show product details
                                          setAltSelected(true) // Ensure Alternative is selected
                                          // Check if price is too high
                                          const extractedAltPrice = typeof extracted.price === 'string' ? parseFloat(extracted.price) : (extracted.price || 0)
                                          const iWishPriceNum = parseFloat(iWishPrice) || extractedProduct?.price || gift?.targetAmount || 0
                                          console.log('[Price Check Button] Alt:', extractedAltPrice, 'I Wish:', iWishPriceNum)
                                          if (extractedAltPrice > 0 && iWishPriceNum > 0 && extractedAltPrice > iWishPriceNum) {
                                            setPriceWarningData({ altPrice: extractedAltPrice, iWishPrice: iWishPriceNum })
                                            setShowPriceWarning(true)
                                          } else {
                                            toast({ title: "🐝 Product Extracted!", description: "Alternative product details have been filled in.", variant: "warm" })
                                          }
                                        } else {
                                          toast({ title: "Extraction Failed", description: "Could not extract product details.", variant: "destructive" })
                                        }
                                      } catch (error) {
                                        console.error("Alternative extraction error:", error)
                                        toast({ title: "Extraction Failed", description: "Could not extract product details.", variant: "destructive" })
                                      } finally {
                                        setIsExtractingAlt(false)
                                      }
                                    }}
                                    disabled={isExtractingAlt || !altProductUrl.trim()}
                                    className="bg-gradient-to-r from-[#B45309] to-[#D97706] text-white hover:from-[#D97706] hover:to-[#B45309] whitespace-nowrap px-3 py-2 rounded-lg font-semibold text-xs disabled:opacity-50"
                                  >
                                    {isExtractingAlt ? (
                                      <><Loader2 className="w-3 h-3 animate-spin inline mr-1" />Extracting...</>
                                    ) : (
                                      <><Sparkles className="w-3 h-3 inline mr-1" />AI Extract</>
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Clip via Extension Option */}
                            {altAddMethod === "extension" && (
                              <div className="bg-white/80 rounded-lg p-4 border border-[#D97706]/20">
                                {isWaitingForAltClip ? (
                                  <div className="flex flex-col items-center gap-3">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#D97706]/20 to-[#F59E0B]/20 rounded-full border border-[#D97706]/40">
                                      <Loader2 className="w-4 h-4 animate-spin text-[#D97706]" />
                                      <span className="text-sm font-semibold text-[#654321]">Listening for clip...</span>
                                    </div>
                                    <p className="text-xs text-[#92400E] text-center">Open a product page and use the Wishbee extension to clip it.</p>
                                    <button
                                      type="button"
                                      onClick={() => setIsWaitingForAltClip(false)}
                                      className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <p className="text-xs text-[#654321] text-center">
                                      Click <span className="font-semibold text-[#D97706]">Start Listening</span>, then browse any product page and clip it with the Wishbee extension.
                                    </p>
                                    <div className="flex justify-center">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setIsWaitingForAltClip(true)
                                          setAwaitingExtensionFor("alt")
                                        }}
                                        className="bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-white hover:from-[#F59E0B] hover:to-[#D97706] font-semibold px-4 py-1.5 rounded-lg text-xs shadow-sm"
                                      >
                                        Start Listening
                                      </button>
                                    </div>
                                    <p className="text-[10px] text-[#92400E]/70 text-center">
                                      Don't have the extension? <a href="https://wishbee.ai/extension" target="_blank" rel="noopener noreferrer" className="text-[#D97706] font-semibold hover:underline">Get it free →</a>
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                        {/* Product Image & Details Row */}
                        <div className="flex gap-3 mb-3">
                          {/* Product Image with edit/delete overlay */}
                          <div className="flex-shrink-0">
                            <input
                              ref={altImageInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleAltImageUpload}
                              className="hidden"
                            />
                            {showAltImageInput ? (
                              <div className="w-28 space-y-1">
                                <p className="text-[7px] text-[#6B4423] leading-tight">💡 Right-click image → Open in new tab → Copy URL</p>
                                <input
                                  type="text"
                                  value={altImageUrlInput}
                                  onChange={(e) => setAltImageUrlInput(e.target.value)}
                                  placeholder="Paste image URL"
                                  className="w-full px-1 py-1 text-[9px] border border-[#D97706] rounded focus:outline-none focus:ring-1 focus:ring-[#D97706]"
                                  autoFocus
                                  onKeyDown={(e) => e.key === 'Enter' && handleAltImageUrlSubmit()}
                                />
                                <div className="flex gap-0.5">
                                  <button onClick={handleAltImageUrlSubmit} className="flex-1 px-1 py-0.5 bg-green-500 text-white text-[8px] rounded hover:bg-green-600">Save</button>
                                  <button onClick={() => { setShowAltImageInput(false); setAltImageUrlInput(""); }} className="flex-1 px-1 py-0.5 bg-gray-300 text-gray-700 text-[8px] rounded hover:bg-gray-400">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div className="relative group">
                                {altClippedImage ? (
                                  <img src={altClippedImage} alt={altClippedTitle || 'Alternative product'} className="w-20 h-20 object-contain rounded-lg bg-white border border-[#D97706]/20" />
                                ) : (
                                  <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-[#D97706]/20 flex items-center justify-center cursor-pointer hover:border-[#D97706]" onClick={() => setShowAltImageInput(true)}>
                                    <span className="text-[#D97706] text-[9px] text-center px-1">Click to add</span>
                                  </div>
                                )}
                                {altClippedImage && (
                                  <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                    <button onClick={() => setShowAltImageInput(true)} className="p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors" title="Paste image URL"><Pencil className="w-3.5 h-3.5 text-blue-600" /></button>
                                    <button onClick={() => altImageInputRef.current?.click()} className="p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors" title="Upload image"><Upload className="w-3.5 h-3.5 text-amber-600" /></button>
                                    <button onClick={handleAltImageDelete} className="p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors" title="Remove image"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Product Info - Editable when isEditingAlt is true */}
                          <div className="flex-1 min-w-0">
                            {/* Product Title */}
                            {isEditingAlt ? (
                              <input
                                type="text"
                                value={altTitle}
                                onChange={(e) => setAltTitle(e.target.value)}
                                placeholder="Product title..."
                                className="w-full text-xs font-bold text-[#4A2F1A] bg-white border border-[#D97706]/30 rounded px-2 py-1 mb-1 focus:outline-none focus:border-[#D97706]"
                              />
                            ) : (
                              <h4 className="text-xs font-bold text-[#4A2F1A] line-clamp-2 leading-tight mb-1">
                                {altTitle || altClippedTitle || 'Alternative Product'}
                              </h4>
                            )}
                            
                            {/* Store Name */}
                            {isEditingAlt ? (
                              <input
                                type="text"
                                value={altStore}
                                onChange={(e) => setAltStore(e.target.value)}
                                placeholder="Store name..."
                                className="w-full text-[10px] text-[#92400E] bg-white border border-[#D97706]/30 rounded px-2 py-0.5 mb-1 focus:outline-none focus:border-[#D97706]"
                              />
                            ) : (altStore || extractedProduct?.storeName || gift?.source) ? (
                              <p className="text-[10px] text-[#92400E] mb-1 flex items-center gap-1">
                                <span className="w-1 h-1 bg-[#D97706] rounded-full"></span>
                                {altStore || extractedProduct?.storeName || gift?.source}
                              </p>
                            ) : null}
                            
                            {/* Rating & Review Count */}
                            {isEditingAlt ? (
                              <div className="flex items-center gap-2 mb-1">
                                <input
                                  type="text"
                                  value={altRating}
                                  onChange={(e) => setAltRating(e.target.value)}
                                  placeholder="Rating (e.g., 4.5)"
                                  className="w-16 text-[10px] bg-white border border-[#D97706]/30 rounded px-2 py-0.5 focus:outline-none focus:border-[#D97706]"
                                />
                                <input
                                  type="text"
                                  value={altReviewCount}
                                  onChange={(e) => setAltReviewCount(e.target.value)}
                                  placeholder="Reviews"
                                  className="w-20 text-[10px] bg-white border border-[#D97706]/30 rounded px-2 py-0.5 focus:outline-none focus:border-[#D97706]"
                                />
                              </div>
                            ) : (parseFloat(altRating) || extractedProduct?.rating || gift?.rating) ? (
                              <div className="flex items-center gap-1.5 mb-1">
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => {
                                    const rating = parseFloat(altRating) || extractedProduct?.rating || gift?.rating || 0
                                    const fillAmount = Math.max(0, Math.min(1, rating - (star - 1)))
                                    return (
                                      <Star
                                        key={star}
                                        className="w-3 h-3"
                                        fill={fillAmount >= 1 ? "#F59E0B" : fillAmount > 0 ? `url(#alt-star-grad-${star})` : "#E5E7EB"}
                                        stroke={fillAmount > 0 ? "#F59E0B" : "#E5E7EB"}
                                        strokeWidth={1}
                                      />
                                    )
                                  })}
                                </div>
                                <span className="text-[10px] font-bold text-[#654321]">{(parseFloat(altRating) || extractedProduct?.rating || gift?.rating)?.toFixed(1)}</span>
                                {(parseInt(altReviewCount) || extractedProduct?.reviewCount || gift?.reviewCount) && (
                                  <span className="text-[9px] text-gray-500">({(parseInt(altReviewCount) || extractedProduct?.reviewCount || gift?.reviewCount)?.toLocaleString()})</span>
                                )}
                              </div>
                            ) : null}
                            
                            {/* Badges */}
                            {isEditingAlt ? (
                              <div className="flex flex-wrap gap-2 mb-1">
                                <label className="flex items-center gap-1 text-[9px] text-[#654321] cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={altAmazonChoice}
                                    onChange={(e) => setAltAmazonChoice(e.target.checked)}
                                    className="w-3 h-3 accent-[#D97706]"
                                  />
                                  Amazon's Choice
                                </label>
                                <label className="flex items-center gap-1 text-[9px] text-[#654321] cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={altBestSeller}
                                    onChange={(e) => setAltBestSeller(e.target.checked)}
                                    className="w-3 h-3 accent-[#D14900]"
                                  />
                                  #1 Best Seller
                                </label>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-1 mb-1">
                                {(altAmazonChoice || extractedProduct?.amazonChoice || gift?.amazonChoice) && (
                                  <span className="bg-gradient-to-r from-gray-900 to-black text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">Amazon's Choice</span>
                                )}
                                {(altBestSeller || extractedProduct?.bestSeller || gift?.bestSeller) && (
                                  <span className="text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#D14900' }}>#1 Best Seller</span>
                                )}
                              </div>
                            )}
                            
                            {/* Price */}
                            {isEditingAlt ? (
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-bold text-[#654321]">$</span>
                                <input
                                  type="text"
                                  value={altPrice}
                                  onChange={(e) => setAltPrice(e.target.value)}
                                  placeholder="0.00"
                                  className="w-24 text-sm font-bold text-[#654321] bg-white border border-[#D97706]/30 rounded px-2 py-0.5 focus:outline-none focus:border-[#D97706]"
                                />
                              </div>
                            ) : (parseFloat(altPrice) || extractedProduct?.price || gift?.targetAmount) ? (
                              <p className="text-sm font-bold text-[#654321]">
                                ${typeof (parseFloat(altPrice) || extractedProduct?.price || gift?.targetAmount) === 'number' 
                                  ? (parseFloat(altPrice) || extractedProduct?.price || gift?.targetAmount)?.toFixed(2) 
                                  : altPrice || extractedProduct?.price || gift?.targetAmount}
                              </p>
                            ) : null}
                            
                            {/* Helper text - only show when not editing */}
                            {!isEditingAlt && (
                              <p className="text-[9px] text-[#92400E] bg-[#D97706]/10 px-2 py-1 rounded-md border border-[#D97706]/20 italic mt-1">
                                💡 Acceptable backup if primary is unavailable
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Specifications Section for Alternative - Editable when isEditingAlt is true */}
                        {(Object.keys(altSpecs).length > 0 || isEditingAlt) && (
                          <div className="bg-white/60 rounded-lg p-2 border border-[#D97706]/20 mb-2">
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider flex items-center gap-1">
                                <span className="w-1 h-1 bg-[#D97706] rounded-full"></span>
                                Specifications
                              </p>
                              {isEditingAlt && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newKey = `Spec ${Object.keys(altSpecs).length + 1}`
                                    setAltSpecs(prev => ({ ...prev, [newKey]: '' }))
                                  }}
                                  className="flex items-center gap-1 text-[9px] font-semibold text-[#D97706] hover:text-[#B45309] transition-colors"
                                >
                                  <Plus className="w-3 h-3" /> Add
                                </button>
                              )}
                            </div>
                            <div className="space-y-1">
                              {Object.entries(altSpecs)
                                .slice(0, showAllAltSpecs ? undefined : 4)
                                .map(([key, value]) => (
                                  <div key={key} className="flex items-center gap-2">
                                    {isEditingAlt ? (
                                      <>
                                        <input
                                          type="text"
                                          defaultValue={key}
                                          onBlur={(e) => {
                                            const newKey = e.target.value.trim()
                                            if (newKey && newKey !== key) {
                                              setAltSpecs(prev => {
                                                const updated = { ...prev }
                                                delete updated[key]
                                                updated[newKey] = value
                                                return updated
                                              })
                                            }
                                          }}
                                          className="w-20 shrink-0 text-[10px] font-medium text-[#6B4423] bg-white border border-[#D97706]/30 rounded px-1.5 py-0.5 focus:outline-none focus:border-[#D97706]"
                                        />
                                        <span className="text-[10px] text-[#6B4423] shrink-0">:</span>
                                        <input
                                          type="text"
                                          value={value}
                                          onChange={(e) => setAltSpecs(prev => ({ ...prev, [key]: e.target.value }))}
                                          className="flex-1 text-[10px] text-[#654321] font-semibold bg-white border border-[#D97706]/30 rounded px-1.5 py-0.5 focus:outline-none focus:border-[#D97706]"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => setAltSpecs(prev => {
                                            const updated = { ...prev }
                                            delete updated[key]
                                            return updated
                                          })}
                                          className="p-1 hover:bg-red-100 rounded transition-colors"
                                          title="Remove specification"
                                        >
                                          <X className="w-3 h-3 text-red-500" />
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <span className="text-[10px] text-[#6B4423] font-medium shrink-0 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <span className="text-[10px] text-[#6B4423] shrink-0">:</span>
                                        <span className="text-[10px] text-[#654321] font-semibold truncate">{String(value)}</span>
                                      </>
                                    )}
                                  </div>
                                ))
                              }
                              {Object.keys(altSpecs).length > 4 && (
                                <button
                                  type="button"
                                  onClick={() => setShowAllAltSpecs(!showAllAltSpecs)}
                                  className="text-left text-[8px] font-bold text-[#D97706] mt-1 hover:text-[#92400E] hover:underline cursor-pointer transition-colors"
                                >
                                  {showAllAltSpecs ? 'Show less' : `+${Object.keys(altSpecs).length - 4} more specs`}
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Selected Options - Styled box like create page */}
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <div className="bg-white/60 rounded-lg p-2 border border-[#D97706]/20">
                              <div className="flex items-center justify-between mb-1.5">
                                <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider flex items-center gap-1">
                                  <span className="w-1 h-1 bg-[#D97706] rounded-full"></span>
                                  Selected Options
                                </p>
                              </div>
                              <div className="space-y-1.5">
                            {/* Selected Options - Style, Color, Size, Set - editable when isEditingAlt is true */}
                            {/* Style */}
                            {(altStyle || isEditingAlt) && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-medium text-[#6B4423] w-16 shrink-0">Style:</span>
                                {isEditingAlt ? (
                                  <>
                                    <input
                                      type="text"
                                      value={altStyle}
                                      onChange={(e) => setAltStyle(e.target.value)}
                                      placeholder="Enter style..."
                                      className="flex-1 px-2 py-1 text-[10px] border border-[#D97706]/30 rounded bg-white focus:outline-none focus:border-[#D97706]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setAltStyle("")}
                                      className="p-1 hover:bg-red-100 rounded transition-colors"
                                      title="Remove style"
                                    >
                                      <X className="w-3 h-3 text-red-500" />
                                    </button>
                                  </>
                                ) : altStyle && isValidVariantValue(altStyle) ? (
                                  <span className="text-[10px] text-[#654321] font-semibold">{getCleanVariantDisplay(altStyle)}</span>
                                ) : (
                                  <span className="text-[10px] text-gray-400 italic">Not set</span>
                                )}
                              </div>
                            )}
                            {/* Color */}
                            {(altColor || isEditingAlt) && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-medium text-[#6B4423] w-16 shrink-0">Color:</span>
                                {isEditingAlt ? (
                                  <>
                                    <input
                                      type="text"
                                      value={altColor}
                                      onChange={(e) => setAltColor(e.target.value)}
                                      placeholder="Enter color..."
                                      className="flex-1 px-2 py-1 text-[10px] border border-[#D97706]/30 rounded bg-white focus:outline-none focus:border-[#D97706]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setAltColor("")}
                                      className="p-1 hover:bg-red-100 rounded transition-colors"
                                      title="Remove color"
                                    >
                                      <X className="w-3 h-3 text-red-500" />
                                    </button>
                                  </>
                                ) : altColor && isValidVariantValue(altColor) ? (
                                  <span className="text-[10px] text-[#654321] font-semibold">{getCleanVariantDisplay(altColor)}</span>
                                ) : (
                                  <span className="text-[10px] text-gray-400 italic">Not set</span>
                                )}
                              </div>
                            )}
                            {/* Size */}
                            {(altSize || isEditingAlt) && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-medium text-[#6B4423] w-16 shrink-0">Size:</span>
                                {isEditingAlt ? (
                                  <>
                                    <input
                                      type="text"
                                      value={altSize}
                                      onChange={(e) => setAltSize(e.target.value)}
                                      placeholder="Enter size..."
                                      className="flex-1 px-2 py-1 text-[10px] border border-[#D97706]/30 rounded bg-white focus:outline-none focus:border-[#D97706]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setAltSize("")}
                                      className="p-1 hover:bg-red-100 rounded transition-colors"
                                      title="Remove size"
                                    >
                                      <X className="w-3 h-3 text-red-500" />
                                    </button>
                                  </>
                                ) : altSize && isValidVariantValue(altSize) ? (
                                  <span className="text-[10px] text-[#654321] font-semibold">{getCleanVariantDisplay(altSize)}</span>
                                ) : (
                                  <span className="text-[10px] text-gray-400 italic">Not set</span>
                                )}
                              </div>
                            )}
                            {/* Configuration/Set */}
                            {(altConfiguration || isEditingAlt) && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-medium text-[#6B4423] w-16 shrink-0">Config:</span>
                                {isEditingAlt ? (
                                  <>
                                    <input
                                      type="text"
                                      value={altConfiguration}
                                      onChange={(e) => setAltConfiguration(e.target.value)}
                                      placeholder="Enter configuration..."
                                      className="flex-1 px-2 py-1 text-[10px] border border-[#D97706]/30 rounded bg-white focus:outline-none focus:border-[#D97706]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setAltConfiguration("")}
                                      className="p-1 hover:bg-red-100 rounded transition-colors"
                                      title="Remove configuration"
                                    >
                                      <X className="w-3 h-3 text-red-500" />
                                    </button>
                                  </>
                                ) : altConfiguration && isValidVariantValue(altConfiguration) ? (
                                  <span className="text-[10px] text-[#654321] font-semibold">{getCleanVariantDisplay(altConfiguration)}</span>
                                ) : (
                                  <span className="text-[10px] text-gray-400 italic">Not set</span>
                                )}
                              </div>
                            )}
                            
                            {/* Add Field UI for Alternative */}
                            {isAddingAltField ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={newAltFieldName}
                                  onChange={(e) => setNewAltFieldName(e.target.value)}
                                  placeholder="Field name"
                                  className="w-16 shrink-0 px-2 py-1 text-[10px] font-medium text-[#6B4423] border border-[#D97706]/30 rounded bg-white focus:outline-none focus:border-[#D97706]"
                                />
                                <input
                                  type="text"
                                  value={newAltFieldValue}
                                  onChange={(e) => setNewAltFieldValue(e.target.value)}
                                  placeholder="Enter value..."
                                  className="flex-1 px-2 py-1 text-[10px] border border-[#D97706]/30 rounded bg-white focus:outline-none focus:border-[#D97706]"
                                  onKeyDown={(e) => e.key === 'Enter' && addNewAltField()}
                                />
                                <button 
                                  type="button"
                                  onClick={addNewAltField} 
                                  className="p-1 hover:bg-green-100 rounded transition-colors"
                                  title="Save field"
                                >
                                  <Check className="w-3 h-3 text-green-600" />
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => { setIsAddingAltField(false); setNewAltFieldName(""); setNewAltFieldValue(""); }} 
                                  className="p-1 hover:bg-red-100 rounded transition-colors"
                                  title="Cancel"
                                >
                                  <X className="w-3 h-3 text-red-500" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setIsAddingAltField(true)}
                                className="flex items-center gap-1 text-[10px] text-[#D97706] hover:text-[#B45309] mt-1"
                              >
                                <Plus className="w-3 h-3" />
                                Add Field
                              </button>
                            )}
                            
                            {/* Show message if no valid options are set */}
                            {!(altStyle && isValidVariantValue(altStyle)) && 
                             !(altColor && isValidVariantValue(altColor)) && 
                             !(altSize && isValidVariantValue(altSize)) && 
                             !(altConfiguration && isValidVariantValue(altConfiguration)) &&
                             !isAddingAltField && (
                              <p className="text-[10px] text-gray-500 italic">
                                Click "Select on Retailer" to choose alternative options
                              </p>
                            )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Custom Fields Section for Alternative */}
                        {altCustomFields.length > 0 && (
                          <div className="space-y-1.5 mt-2">
                            {altCustomFields.map((field) => (
                              <div key={field.id} className="flex items-center gap-2 group">
                                <input
                                  type="text"
                                  value={field.key}
                                  onChange={(e) => setAltCustomFields(prev => prev.map(f => f.id === field.id ? { ...f, key: e.target.value } : f))}
                                  placeholder="Field name"
                                  className="w-20 px-2 py-0.5 text-xs border border-[#D97706]/30 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#D97706] text-[#4A2F1A]"
                                />
                                <input
                                  type="text"
                                  value={field.value}
                                  onChange={(e) => setAltCustomFields(prev => prev.map(f => f.id === field.id ? { ...f, value: e.target.value } : f))}
                                  placeholder="Value"
                                  className="flex-1 px-2 py-0.5 text-xs border border-[#D97706]/30 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#D97706] text-[#4A2F1A]"
                                />
                                <button
                                  type="button"
                                  onClick={() => setAltCustomFields(prev => prev.filter(f => f.id !== field.id))}
                                  className="p-0.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Notes Section for Alternative - Styled box like create page */}
                        <div className="bg-white/60 rounded-lg p-2 border border-[#D97706]/20 mt-2">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider flex items-center gap-1">
                              <span className="w-1 h-1 bg-[#D97706] rounded-full"></span>
                              Notes
                            </p>
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
                            className="w-full px-2 py-1.5 text-[10px] border border-[#D97706]/30 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#D97706] text-[#4A2F1A] resize-none"
                            rows={2}
                          />
                        </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

{/* Ok to Buy Option Card - Warm Terracotta - Simple info only */}
                  <div className="rounded-lg border-2 border-[#8B5A3C]/20 bg-white/50">
                    <div className="w-full p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#C2410C] to-[#EA580C] text-white">
                          💫 Ok to Buy
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">Optional</span>
                      </div>
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
                      onClick={handleClose}
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

        {/* Footer - 750 x 50 */}
        <div className="w-[750px] h-[50px] bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] border-t-2 border-[#4A2F1A]">
        </div>
      </div>

      {/* Alternative Price Too High Warning Dialog */}
      {showPriceWarning && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="sm:max-w-md w-full mx-4 border-2 border-[#D97706] bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-lg p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#D97706] to-[#F59E0B] flex items-center justify-center shadow-lg">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-center text-xl font-bold text-[#92400E]">
              Alternative Price Too High
            </h3>
            <div className="text-center text-base pt-3 text-[#78350F]">
              {priceWarningData && (
                <div className="space-y-3">
                  <p>
                    Alternative option{' '}
                    <span className="font-bold text-[#DC2626] bg-red-100 px-2 py-0.5 rounded-full">
                      ${priceWarningData.altPrice.toFixed(2)}
                    </span>{' '}
                    is priced higher than your I Wish selection{' '}
                    <span className="font-bold text-[#B8860B] bg-amber-100 px-2 py-0.5 rounded-full">
                      ${priceWarningData.iWishPrice.toFixed(2)}
                    </span>
                  </p>
                  <p className="text-sm text-[#92400E] font-medium">
                    Please choose a lower-priced alternative.
                  </p>
                </div>
              )}
            </div>
            {/* Footer */}
            <div className="mt-6">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation() // Prevent closing the main modal
                  setShowPriceWarning(false)
                  setPriceWarningData(null)
                  // Clear all Alternative data so user has to select a new product
                  setAltTitle("")
                  setAltStore("")
                  setAltRating("")
                  setAltReviewCount("")
                  setAltPrice("")
                  setAltAmazonChoice(false)
                  setAltBestSeller(false)
                  setAltSpecs({})
                  setAltStyle("")
                  setAltColor("")
                  setAltSize("")
                  setAltConfiguration("")
                  setAltClippedImage(null)
                  setAltClippedTitle(null)
                  setAltNotes("")
                  setAltProductUrl("")
                  setAltCleared(true) // Show URL/Extension input
                }}
                className="w-full h-10 text-sm bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-white font-semibold rounded-full hover:from-[#F59E0B] hover:to-[#D97706] hover:scale-105 transition-all shadow-md"
              >
                Got it, I'll choose another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
