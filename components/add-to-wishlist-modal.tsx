"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
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
  
  // Editing state for Alternative section
  const [editingAltField, setEditingAltField] = useState<string | null>(null)
  const [editingAltValue, setEditingAltValue] = useState("")
  
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
        className="bg-white rounded-2xl shadow-2xl w-[600px] max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - 600 x 80 */}
        <div className="w-[600px] h-[80px] bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] px-4 border-b-2 border-[#4A2F1A] flex items-center justify-center relative">
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

        {/* Single Panel Body */}
        <div className="p-5 overflow-y-auto max-h-[70vh] bg-gradient-to-b from-[#F5F1E8] to-white">
            {isExtracting ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-[#6B4423]">Loading product details...</p>
              </div>
            ) : (
              <>
                {/* Product Name - 2 lines max with ellipsis */}
                {extractedProduct && (
                  <p className="text-sm font-bold text-[#4A2F1A] line-clamp-2 mb-4" title={extractedProduct.productName}>
                    {extractedProduct.productName}
                  </p>
                )}

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
                      </div>
                    </div>
                    
                    {likeSelected && (
                      <div className="px-3 pb-3 space-y-2">
                        <p className="text-[10px] text-[#8B6914] bg-[#DAA520]/10 px-2 py-1 rounded-md border border-[#DAA520]/20 italic mb-2">
                          To select different options, click <ExternalLink className="w-2.5 h-2.5 inline-block align-middle mx-0.5" /> Select on Retailer, choose your preferred options, and clip them using the Wishbee extension.
                          {awaitingExtensionFor === "like" && " ⏳ Waiting for extension..."}
                        </p>
                        
                        {/* Product Image & Selected Options Row */}
                        <div className="flex gap-3">
                          {/* Show clipped image if available, otherwise show main product image - with edit/delete icons */}
                          <div className="flex-shrink-0">
                            {/* Hidden file input for image upload */}
                            <input
                              ref={likeImageInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleLikeImageUpload}
                              className="hidden"
                            />
                            
                            {/* Image URL input field */}
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
                                  <button 
                                    onClick={handleLikeImageUrlSubmit}
                                    className="flex-1 px-1 py-0.5 bg-green-500 text-white text-[9px] rounded hover:bg-green-600"
                                  >
                                    Save
                                  </button>
                                  <button 
                                    onClick={() => { setShowLikeImageInput(false); setLikeImageUrlInput(""); }}
                                    className="flex-1 px-1 py-0.5 bg-gray-300 text-gray-700 text-[9px] rounded hover:bg-gray-400"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="relative group">
                                {(() => {
                                  const imgSrc = likeClippedImage || extractedProduct?.imageUrl || gift?.image || "/placeholder.svg"
                                  console.log('[Modal] I Wish image render - likeClippedImage:', likeClippedImage?.substring(0, 50), 'using:', imgSrc.substring(0, 50))
                                  return (
                                    <img
                                      key={`like-img-${likeClippedImage || 'default'}`}
                                      src={imgSrc}
                                      alt={likeClippedTitle || extractedProduct?.productName || 'Selected product'}
                                      className="w-20 h-20 object-contain rounded-lg bg-white border border-[#DAA520]/20"
                                    />
                                  )
                                })()}
                                {/* Image edit/delete overlay */}
                                <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => setShowLikeImageInput(true)}
                                    className="p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors"
                                    title="Paste image URL"
                                  >
                                    <Pencil className="w-3.5 h-3.5 text-blue-600" />
                                  </button>
                                  <button
                                    onClick={() => likeImageInputRef.current?.click()}
                                    className="p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors"
                                    title="Upload image from computer"
                                  >
                                    <Upload className="w-3.5 h-3.5 text-amber-600" />
                                  </button>
                                  {likeClippedImage && (
                                    <button
                                      onClick={handleLikeImageDelete}
                                      className="p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors"
                                      title="Remove image"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-1.5">
                            {/* Clean variant options - Style, Color, Size, Set with Edit/Delete (with validation) */}
                            {likeStyle && isValidVariantValue(likeStyle) && (
                              <div className="flex items-center gap-2 group">
                                <span className="text-xs font-semibold text-[#654321] w-12">Style:</span>
                                {editingLikeField === 'style' ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editingLikeValue}
                                      onChange={(e) => setEditingLikeValue(e.target.value)}
                                      className="px-2 py-0.5 text-xs border border-[#DAA520] rounded w-24 focus:outline-none focus:ring-1 focus:ring-[#DAA520]"
                                      autoFocus
                                      onKeyDown={(e) => e.key === 'Enter' && saveEditingLikeField()}
                                    />
                                    <button onClick={saveEditingLikeField} className="p-0.5 hover:bg-green-100 rounded"><Check className="w-3 h-3 text-green-600" /></button>
                                    <button onClick={() => setEditingLikeField(null)} className="p-0.5 hover:bg-red-100 rounded"><X className="w-3 h-3 text-red-600" /></button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="px-2 py-0.5 bg-[#DAA520]/20 text-[#654321] text-xs font-medium rounded border border-[#DAA520]/30 flex-1 break-words" title={getCleanVariantDisplay(likeStyle)}>{getCleanVariantDisplay(likeStyle)}</span>
                                    <button onClick={() => startEditingLikeField('style', getCleanVariantDisplay(likeStyle))} className="p-0.5 hover:bg-amber-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Pencil className="w-3 h-3 text-amber-600" /></button>
                                    <button onClick={() => deleteLikeField('style')} className="p-0.5 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3 text-red-500" /></button>
                                  </>
                                )}
                              </div>
                            )}
                            {likeColor && isValidVariantValue(likeColor) && (
                              <div className="flex items-center gap-2 group">
                                <span className="text-xs font-semibold text-[#654321] w-12">Color:</span>
                                {editingLikeField === 'color' ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editingLikeValue}
                                      onChange={(e) => setEditingLikeValue(e.target.value)}
                                      className="px-2 py-0.5 text-xs border border-[#DAA520] rounded w-24 focus:outline-none focus:ring-1 focus:ring-[#DAA520]"
                                      autoFocus
                                      onKeyDown={(e) => e.key === 'Enter' && saveEditingLikeField()}
                                    />
                                    <button onClick={saveEditingLikeField} className="p-0.5 hover:bg-green-100 rounded"><Check className="w-3 h-3 text-green-600" /></button>
                                    <button onClick={() => setEditingLikeField(null)} className="p-0.5 hover:bg-red-100 rounded"><X className="w-3 h-3 text-red-600" /></button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="px-2 py-0.5 bg-[#DAA520]/20 text-[#654321] text-xs font-medium rounded border border-[#DAA520]/30 flex-1 break-words" title={getCleanVariantDisplay(likeColor)}>{getCleanVariantDisplay(likeColor)}</span>
                                    <button onClick={() => startEditingLikeField('color', getCleanVariantDisplay(likeColor))} className="p-0.5 hover:bg-amber-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Pencil className="w-3 h-3 text-amber-600" /></button>
                                    <button onClick={() => deleteLikeField('color')} className="p-0.5 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3 text-red-500" /></button>
                                  </>
                                )}
                              </div>
                            )}
                            {likeSize && isValidVariantValue(likeSize) && (
                              <div className="flex items-center gap-2 group">
                                <span className="text-xs font-semibold text-[#654321] w-12">Size:</span>
                                {editingLikeField === 'size' ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editingLikeValue}
                                      onChange={(e) => setEditingLikeValue(e.target.value)}
                                      className="px-2 py-0.5 text-xs border border-[#DAA520] rounded w-24 focus:outline-none focus:ring-1 focus:ring-[#DAA520]"
                                      autoFocus
                                      onKeyDown={(e) => e.key === 'Enter' && saveEditingLikeField()}
                                    />
                                    <button onClick={saveEditingLikeField} className="p-0.5 hover:bg-green-100 rounded"><Check className="w-3 h-3 text-green-600" /></button>
                                    <button onClick={() => setEditingLikeField(null)} className="p-0.5 hover:bg-red-100 rounded"><X className="w-3 h-3 text-red-600" /></button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="px-2 py-0.5 bg-[#DAA520]/20 text-[#654321] text-xs font-medium rounded border border-[#DAA520]/30 flex-1 break-words" title={getCleanVariantDisplay(likeSize)}>{getCleanVariantDisplay(likeSize)}</span>
                                    <button onClick={() => startEditingLikeField('size', getCleanVariantDisplay(likeSize))} className="p-0.5 hover:bg-amber-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Pencil className="w-3 h-3 text-amber-600" /></button>
                                    <button onClick={() => deleteLikeField('size')} className="p-0.5 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3 text-red-500" /></button>
                                  </>
                                )}
                              </div>
                            )}
                            {likeConfiguration && isValidVariantValue(likeConfiguration) && (
                              <div className="flex items-center gap-2 group">
                                <span className="text-xs font-semibold text-[#654321] w-12">Set:</span>
                                {editingLikeField === 'set' ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editingLikeValue}
                                      onChange={(e) => setEditingLikeValue(e.target.value)}
                                      className="px-2 py-0.5 text-xs border border-[#DAA520] rounded w-24 focus:outline-none focus:ring-1 focus:ring-[#DAA520]"
                                      autoFocus
                                      onKeyDown={(e) => e.key === 'Enter' && saveEditingLikeField()}
                                    />
                                    <button onClick={saveEditingLikeField} className="p-0.5 hover:bg-green-100 rounded"><Check className="w-3 h-3 text-green-600" /></button>
                                    <button onClick={() => setEditingLikeField(null)} className="p-0.5 hover:bg-red-100 rounded"><X className="w-3 h-3 text-red-600" /></button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="px-2 py-0.5 bg-[#DAA520]/20 text-[#654321] text-xs font-medium rounded border border-[#DAA520]/30 flex-1 break-words" title={getCleanVariantDisplay(likeConfiguration)}>{getCleanVariantDisplay(likeConfiguration)}</span>
                                    <button onClick={() => startEditingLikeField('set', getCleanVariantDisplay(likeConfiguration))} className="p-0.5 hover:bg-amber-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Pencil className="w-3 h-3 text-amber-600" /></button>
                                    <button onClick={() => deleteLikeField('set')} className="p-0.5 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3 text-red-500" /></button>
                                  </>
                                )}
                              </div>
                            )}
                            
                            {/* Add Field UI */}
                            {isAddingLikeField ? (
                              <div className="flex items-center gap-1 mt-1">
                                <input
                                  type="text"
                                  value={newLikeFieldName}
                                  onChange={(e) => setNewLikeFieldName(e.target.value)}
                                  placeholder="Field"
                                  className="px-2 py-0.5 text-xs border border-[#DAA520]/50 rounded w-16 focus:outline-none focus:ring-1 focus:ring-[#DAA520]"
                                />
                                <input
                                  type="text"
                                  value={newLikeFieldValue}
                                  onChange={(e) => setNewLikeFieldValue(e.target.value)}
                                  placeholder="Value"
                                  className="px-2 py-0.5 text-xs border border-[#DAA520]/50 rounded w-20 focus:outline-none focus:ring-1 focus:ring-[#DAA520]"
                                  onKeyDown={(e) => e.key === 'Enter' && addNewLikeField()}
                                />
                                <button onClick={addNewLikeField} className="p-0.5 hover:bg-green-100 rounded"><Check className="w-3 h-3 text-green-600" /></button>
                                <button onClick={() => { setIsAddingLikeField(false); setNewLikeFieldName(""); setNewLikeFieldValue(""); }} className="p-0.5 hover:bg-red-100 rounded"><X className="w-3 h-3 text-red-600" /></button>
                              </div>
                            ) : (
                              <button
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

                        {/* Notes Section */}
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-xs text-[#6B4423] font-medium">Notes</Label>
                            {likeNotes && (
                              <button
                                type="button"
                                onClick={() => setLikeNotes("")}
                                className="p-0.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
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
                      </div>
                    </div>
                    
                    {altSelected && (
                      <div className="px-3 pb-3 space-y-2">
                        <p className="text-[10px] text-[#92400E] bg-[#D97706]/10 px-2 py-1 rounded-md border border-[#D97706]/20 italic mb-2">
                          💡 If the primary option is unavailable, this is an acceptable alternative.
                          {awaitingExtensionFor === "alt" && " ⏳ Waiting for extension..."}
                        </p>
                        {/* Product Image & Options Row */}
                        <div className="flex gap-3">
                          {/* Show clipped image with edit/delete icons */}
                          <div className="flex-shrink-0">
                            {/* Hidden file input for image upload */}
                            <input
                              ref={altImageInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleAltImageUpload}
                              className="hidden"
                            />
                            
                            {/* Image URL input field */}
                            {showAltImageInput ? (
                              <div className="w-28 space-y-1">
                                <p className="text-[7px] text-[#6B4423] leading-tight">
                                  💡 Right-click image → Open in new tab → Copy URL
                                </p>
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
                                  <button 
                                    onClick={handleAltImageUrlSubmit}
                                    className="flex-1 px-1 py-0.5 bg-green-500 text-white text-[8px] rounded hover:bg-green-600"
                                  >
                                    Save
                                  </button>
                                  <button 
                                    onClick={() => { setShowAltImageInput(false); setAltImageUrlInput(""); }}
                                    className="flex-1 px-1 py-0.5 bg-gray-300 text-gray-700 text-[8px] rounded hover:bg-gray-400"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="relative group">
                                {(() => {
                                  console.log('[Modal] Alt image render - altClippedImage:', altClippedImage?.substring(0, 50) || 'null')
                                  if (altClippedImage) {
                                    return (
                                      <img
                                        key={`alt-img-${altClippedImage}`}
                                        src={altClippedImage}
                                        alt={altClippedTitle || 'Alternative product'}
                                        className="w-16 h-16 object-contain rounded-lg bg-white border border-[#D97706]/20"
                                      />
                                    )
                                  } else {
                                    return (
                                      <div 
                                        className="w-16 h-16 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-[#D97706]/20 flex items-center justify-center cursor-pointer hover:border-[#D97706]"
                                        onClick={() => setShowAltImageInput(true)}
                                      >
                                        <span className="text-[#D97706] text-[9px] text-center px-1">Click to add image</span>
                                      </div>
                                    )
                                  }
                                })()}
                                {/* Image edit/delete overlay - only show when there's an image */}
                                {altClippedImage && (
                                  <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => setShowAltImageInput(true)}
                                      className="p-1 bg-white/90 rounded-full hover:bg-white transition-colors"
                                      title="Change image URL"
                                    >
                                      <Pencil className="w-3 h-3 text-blue-600" />
                                    </button>
                                    <button
                                      onClick={() => altImageInputRef.current?.click()}
                                      className="p-1 bg-white/90 rounded-full hover:bg-white transition-colors"
                                      title="Upload image from computer"
                                    >
                                      <Upload className="w-3 h-3 text-amber-600" />
                                    </button>
                                    <button
                                      onClick={handleAltImageDelete}
                                      className="p-1 bg-white/90 rounded-full hover:bg-white transition-colors"
                                      title="Remove image"
                                    >
                                      <Trash2 className="w-3 h-3 text-red-500" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-1.5">
                            {/* Variant options - Style, Color, Size, Set with Edit/Delete */}
                            {altStyle && isValidVariantValue(altStyle) && (
                              <div className="flex items-center gap-2 group">
                                <span className="text-xs font-semibold text-[#6B4423] w-12">Style:</span>
                                {editingAltField === 'style' ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editingAltValue}
                                      onChange={(e) => setEditingAltValue(e.target.value)}
                                      className="px-2 py-0.5 text-xs border border-[#D97706] rounded w-24 focus:outline-none focus:ring-1 focus:ring-[#D97706]"
                                      autoFocus
                                      onKeyDown={(e) => e.key === 'Enter' && saveEditingAltField()}
                                    />
                                    <button onClick={saveEditingAltField} className="p-0.5 hover:bg-green-100 rounded"><Check className="w-3 h-3 text-green-600" /></button>
                                    <button onClick={() => setEditingAltField(null)} className="p-0.5 hover:bg-red-100 rounded"><X className="w-3 h-3 text-red-600" /></button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="px-2 py-0.5 bg-[#D97706]/20 text-[#6B4423] text-xs font-medium rounded border border-[#D97706]/30 flex-1 break-words" title={getCleanVariantDisplay(altStyle)}>{getCleanVariantDisplay(altStyle)}</span>
                                    <button onClick={() => startEditingAltField('style', getCleanVariantDisplay(altStyle))} className="p-0.5 hover:bg-amber-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Pencil className="w-3 h-3 text-amber-600" /></button>
                                    <button onClick={() => deleteAltField('style')} className="p-0.5 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3 text-red-500" /></button>
                                  </>
                                )}
                              </div>
                            )}
                            {altColor && isValidVariantValue(altColor) && (
                              <div className="flex items-center gap-2 group">
                                <span className="text-xs font-semibold text-[#6B4423] w-12">Color:</span>
                                {editingAltField === 'color' ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editingAltValue}
                                      onChange={(e) => setEditingAltValue(e.target.value)}
                                      className="px-2 py-0.5 text-xs border border-[#D97706] rounded w-24 focus:outline-none focus:ring-1 focus:ring-[#D97706]"
                                      autoFocus
                                      onKeyDown={(e) => e.key === 'Enter' && saveEditingAltField()}
                                    />
                                    <button onClick={saveEditingAltField} className="p-0.5 hover:bg-green-100 rounded"><Check className="w-3 h-3 text-green-600" /></button>
                                    <button onClick={() => setEditingAltField(null)} className="p-0.5 hover:bg-red-100 rounded"><X className="w-3 h-3 text-red-600" /></button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="px-2 py-0.5 bg-[#D97706]/20 text-[#6B4423] text-xs font-medium rounded border border-[#D97706]/30 flex-1 break-words" title={getCleanVariantDisplay(altColor)}>{getCleanVariantDisplay(altColor)}</span>
                                    <button onClick={() => startEditingAltField('color', getCleanVariantDisplay(altColor))} className="p-0.5 hover:bg-amber-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Pencil className="w-3 h-3 text-amber-600" /></button>
                                    <button onClick={() => deleteAltField('color')} className="p-0.5 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3 text-red-500" /></button>
                                  </>
                                )}
                              </div>
                            )}
                            {altSize && isValidVariantValue(altSize) && (
                              <div className="flex items-center gap-2 group">
                                <span className="text-xs font-semibold text-[#6B4423] w-12">Size:</span>
                                {editingAltField === 'size' ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editingAltValue}
                                      onChange={(e) => setEditingAltValue(e.target.value)}
                                      className="px-2 py-0.5 text-xs border border-[#D97706] rounded w-24 focus:outline-none focus:ring-1 focus:ring-[#D97706]"
                                      autoFocus
                                      onKeyDown={(e) => e.key === 'Enter' && saveEditingAltField()}
                                    />
                                    <button onClick={saveEditingAltField} className="p-0.5 hover:bg-green-100 rounded"><Check className="w-3 h-3 text-green-600" /></button>
                                    <button onClick={() => setEditingAltField(null)} className="p-0.5 hover:bg-red-100 rounded"><X className="w-3 h-3 text-red-600" /></button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="px-2 py-0.5 bg-[#D97706]/20 text-[#6B4423] text-xs font-medium rounded border border-[#D97706]/30 flex-1 break-words" title={getCleanVariantDisplay(altSize)}>{getCleanVariantDisplay(altSize)}</span>
                                    <button onClick={() => startEditingAltField('size', getCleanVariantDisplay(altSize))} className="p-0.5 hover:bg-amber-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Pencil className="w-3 h-3 text-amber-600" /></button>
                                    <button onClick={() => deleteAltField('size')} className="p-0.5 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3 text-red-500" /></button>
                                  </>
                                )}
                              </div>
                            )}
                            {altConfiguration && isValidVariantValue(altConfiguration) && (
                              <div className="flex items-center gap-2 group">
                                <span className="text-xs font-semibold text-[#6B4423] w-12">Set:</span>
                                {editingAltField === 'set' ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editingAltValue}
                                      onChange={(e) => setEditingAltValue(e.target.value)}
                                      className="px-2 py-0.5 text-xs border border-[#D97706] rounded w-24 focus:outline-none focus:ring-1 focus:ring-[#D97706]"
                                      autoFocus
                                      onKeyDown={(e) => e.key === 'Enter' && saveEditingAltField()}
                                    />
                                    <button onClick={saveEditingAltField} className="p-0.5 hover:bg-green-100 rounded"><Check className="w-3 h-3 text-green-600" /></button>
                                    <button onClick={() => setEditingAltField(null)} className="p-0.5 hover:bg-red-100 rounded"><X className="w-3 h-3 text-red-600" /></button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="px-2 py-0.5 bg-[#D97706]/20 text-[#6B4423] text-xs font-medium rounded border border-[#D97706]/30 flex-1 break-words" title={getCleanVariantDisplay(altConfiguration)}>{getCleanVariantDisplay(altConfiguration)}</span>
                                    <button onClick={() => startEditingAltField('set', getCleanVariantDisplay(altConfiguration))} className="p-0.5 hover:bg-amber-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Pencil className="w-3 h-3 text-amber-600" /></button>
                                    <button onClick={() => deleteAltField('set')} className="p-0.5 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3 text-red-500" /></button>
                                  </>
                                )}
                              </div>
                            )}
                            
                            {/* Add Field UI for Alternative */}
                            {isAddingAltField ? (
                              <div className="flex items-center gap-1 mt-1">
                                <input
                                  type="text"
                                  value={newAltFieldName}
                                  onChange={(e) => setNewAltFieldName(e.target.value)}
                                  placeholder="Field"
                                  className="px-2 py-0.5 text-xs border border-[#D97706]/50 rounded w-16 focus:outline-none focus:ring-1 focus:ring-[#D97706]"
                                />
                                <input
                                  type="text"
                                  value={newAltFieldValue}
                                  onChange={(e) => setNewAltFieldValue(e.target.value)}
                                  placeholder="Value"
                                  className="px-2 py-0.5 text-xs border border-[#D97706]/50 rounded w-20 focus:outline-none focus:ring-1 focus:ring-[#D97706]"
                                  onKeyDown={(e) => e.key === 'Enter' && addNewAltField()}
                                />
                                <button onClick={addNewAltField} className="p-0.5 hover:bg-green-100 rounded"><Check className="w-3 h-3 text-green-600" /></button>
                                <button onClick={() => { setIsAddingAltField(false); setNewAltFieldName(""); setNewAltFieldValue(""); }} className="p-0.5 hover:bg-red-100 rounded"><X className="w-3 h-3 text-red-600" /></button>
                              </div>
                            ) : (
                              <button
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

                        {/* Notes Section for Alternative */}
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-xs text-[#6B4423] font-medium">Notes</Label>
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

        {/* Footer - 600 x 50 */}
        <div className="w-[600px] h-[50px] bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] border-t-2 border-[#4A2F1A]">
        </div>
      </div>
    </div>
  )
}
