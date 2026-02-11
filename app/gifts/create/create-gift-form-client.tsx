"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import {
  Gift,
  Sparkles,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Type,
  RefreshCw,
  ArrowLeft,
  Check,
  Edit2,
  Package,
  Upload,
  ExternalLink,
  Loader2,
  Info,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  User,
  Calendar,
  DollarSign,
  Image as ImageIcon,
  FileText,
  Eye,
  Link as LinkIcon,
  Heart,
  Pencil,
  X,
  ShoppingBag,
  Users,
  ChevronDown,
  TrendingUp,
  Star,
  Trash2,
  Mail,
  Scissors,
  Copy,
  MessageCircle,
  Search,
  SlidersHorizontal,
  Grid3x3,
  List,
} from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { EviteWizard } from "@/components/evite-wizard"
import { AddToWishlistModal, type PreferenceOptions } from "@/components/add-to-wishlist-modal"

// Step configuration
const STEPS = [
  { id: 1, title: "Purpose", icon: User, description: "Who & Why" },
  { id: 2, title: "Include Gift", icon: ShoppingBag, description: "Add Wishlist Product" },
  { id: 3, title: "Funding", icon: DollarSign, description: "Goal & Deadline" },
  { id: 4, title: "Design", icon: ImageIcon, description: "Banner & Story" },
  { id: 5, title: "Review", icon: Eye, description: "Review Details" },
  { id: 6, title: "Contribute", icon: Heart, description: "Your Contribution" },
  { id: 7, title: "Share", icon: Gift, description: "Share Link" },
]

const OCCASIONS = [
  "Birthday",
  "Wedding",
  "Anniversary",
  "Graduation",
  "Baby Shower",
  "Housewarming",
  "Retirement",
  "Christmas",
  "Valentine's Day",
  "Mother's Day",
  "Father's Day",
  "Engagement",
  "Get Well Soon",
  "Congratulations",
  "Thank You",
  "Just Because",
]

export function CreateGiftFormClient() {
  const router = useRouter()
  const { toast } = useToast()
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1)
  
  // Evite Wizard state
  const [showEviteWizard, setShowEviteWizard] = useState(false)
  const [includeEvite, setIncludeEvite] = useState(true)
  const [eviteSettings, setEviteSettings] = useState<{
    bannerUrl?: string
    bannerStyle?: string
    invitationMessage?: string
    colorTheme?: string
    enableMagicLink?: boolean
    enableReminders?: boolean
    shareChannels?: string[]
  } | null>(null)

  // Step 1: Purpose
  const [collectionTitle, setCollectionTitle] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [occasion, setOccasion] = useState("")
  const [deadline, setDeadline] = useState("")
  
  // Step 2: Include Gift
  const [productUrl, setProductUrl] = useState("")
  const [extractedProduct, setExtractedProduct] = useState<any>(null)
  const [isExtractingProduct, setIsExtractingProduct] = useState(false)
  const [isExtractingAltProduct, setIsExtractingAltProduct] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [editableSpecs, setEditableSpecs] = useState<Record<string, string>>({})
  const [altEditableSpecs, setAltEditableSpecs] = useState<Record<string, string>>({})
  const [isEditingSpecs, setIsEditingSpecs] = useState(false)
  const [showAllAltSpecs, setShowAllAltSpecs] = useState(false)
  
  // Edit mode states for I Wish and Alternative sections
  const [isEditingIWishSpecs, setIsEditingIWishSpecs] = useState(false)
  const [isEditingIWishVariants, setIsEditingIWishVariants] = useState(false)
  const [isEditingAltSpecs, setIsEditingAltSpecs] = useState(false)
  const [isEditingAltVariants, setIsEditingAltVariants] = useState(false)
  
  // Product Source Selection
  const [productSource, setProductSource] = useState<"url" | "shared" | "trending">("shared")
  
  // Shared Wishlists
  const [sharedItems, setSharedItems] = useState<any[]>([])
  const [sharedWishlists, setSharedWishlists] = useState<any[]>([])
  const [isLoadingShared, setIsLoadingShared] = useState(false)
  const [selectedSharedWishlist, setSelectedSharedWishlist] = useState<string>("all")
  
  // Trending Gifts
  const [trendingGifts, setTrendingGifts] = useState<any[]>([])
  const [isLoadingTrending, setIsLoadingTrending] = useState(false)
  // Trending Gifts filters (same as /gifts/trending)
  const [searchQueryTrending, setSearchQueryTrending] = useState("")
  const [selectedCategoryTrending, setSelectedCategoryTrending] = useState("all")
  const [selectedSourceTrending, setSelectedSourceTrending] = useState("all")
  const [selectedRatingTrending, setSelectedRatingTrending] = useState("all")
  const [selectedBadgeTrending, setSelectedBadgeTrending] = useState("all")
  const [priceRangeTrending, setPriceRangeTrending] = useState({ min: "", max: "" })
  const [sortByTrending, setSortByTrending] = useState<"popularity" | "rating" | "price-low" | "price-high" | "name" | "newest">("popularity")
  const [showFiltersTrending, setShowFiltersTrending] = useState(false)
  const [viewModeTrending, setViewModeTrending] = useState<"grid" | "list">("grid")
  const [expandedSpecsTrending, setExpandedSpecsTrending] = useState<Record<string, boolean>>({})
  const [showPreviewProduct, setShowPreviewProduct] = useState(false)
  const [previewProduct, setPreviewProduct] = useState<any>(null)
  const [selectedGiftForDifferentOptions, setSelectedGiftForDifferentOptions] = useState<any>(null)
  const [showSelectDifferentOptionsModal, setShowSelectDifferentOptionsModal] = useState(false)
  
  // I Wish preferences (auto-extracted from URL)
  const [iWishVariants, setIWishVariants] = useState<Record<string, string>>({})
  const [iWishImage, setIWishImage] = useState<string>("")
  const [iWishNotes, setIWishNotes] = useState("")
  
  // Alternative preferences
  const [altVariants, setAltVariants] = useState<Record<string, string>>({})
  const [altImage, setAltImage] = useState<string>("")
  const [altNotes, setAltNotes] = useState("")
  const [altPrice, setAltPrice] = useState<number | null>(null)
  const [altProductName, setAltProductName] = useState("")
  const [altStoreName, setAltStoreName] = useState("")
  const [altRating, setAltRating] = useState<number | null>(null)
  const [altReviewCount, setAltReviewCount] = useState<number | null>(null)
  const [altBestSeller, setAltBestSeller] = useState(false)
  const [altAmazonChoice, setAltAmazonChoice] = useState(false)
  const [isWaitingForAltClip, setIsWaitingForAltClip] = useState(false)
  const [altProductUrl, setAltProductUrl] = useState("")
  const [altAddMethod, setAltAddMethod] = useState<"url" | "extension">("url")
  
  // Price warning dialog
  const [showPriceWarning, setShowPriceWarning] = useState(false)
  const [priceWarningData, setPriceWarningData] = useState<{ altPrice: number; iWishPrice: number } | null>(null)
  
  // Add method for "Add Your Own" section
  const [addMethod, setAddMethod] = useState<"url" | "extension">("url")
  const [isWaitingForMainClip, setIsWaitingForMainClip] = useState(false)
  
  // Specs expansion
  const [showAllSpecs, setShowAllSpecs] = useState(false)
  
  // Step 3: Funding
  const [giftName, setGiftName] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  
  // Helper functions for estimated tax and shipping
  const estimatedTax = (price: number) => price * 0.08 // 8% estimated tax
  const estimatedShipping = (price: number) => {
    // Tiered shipping based on product value
    if (price <= 50) return 6.99
    if (price <= 100) return 9.99
    if (price <= 300) return 12.99
    return 14.99 // Higher value items
  }
  
  // Calculate suggested target based on I Wish price
  const calculateSuggestedTarget = () => {
    if (!extractedProduct?.price) return null
    // Ensure price is a number (handle string prices)
    const basePrice = typeof extractedProduct.price === 'string' 
      ? parseFloat(extractedProduct.price.replace(/[^0-9.]/g, '')) 
      : extractedProduct.price
    if (isNaN(basePrice) || basePrice <= 0) return null
    const tax = estimatedTax(basePrice)
    const shipping = estimatedShipping(basePrice)
    return {
      basePrice,
      tax,
      shipping,
      total: basePrice + tax + shipping
    }
  }
  
  const suggestedTarget = calculateSuggestedTarget()
  
  // Step 4: Design
  const [bannerImage, setBannerImage] = useState("")
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false)
  const [description, setDescription] = useState("")
  const [isEnhancingDescription, setIsEnhancingDescription] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  
  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Contribution step state
  const [myContributionAmount, setMyContributionAmount] = useState("")
  const [showContributionPayment, setShowContributionPayment] = useState(false)
  const [contributionCardNumber, setContributionCardNumber] = useState("")
  const [contributionCardExpiry, setContributionCardExpiry] = useState("")
  const [contributionCardCvc, setContributionCardCvc] = useState("")
  const [contributionCardError, setContributionCardError] = useState("")
  const [isProcessingContribution, setIsProcessingContribution] = useState(false)
  const [contributionComplete, setContributionComplete] = useState(false)
  
  // Gift Created share modal state
  const [showGiftCreatedModal, setShowGiftCreatedModal] = useState(false)
  const [createdGiftMagicLink, setCreatedGiftMagicLink] = useState("")
  const [createdGiftId, setCreatedGiftId] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  
  // Review step edit mode
  const [isEditingIWishReview, setIsEditingIWishReview] = useState(false)
  const [isEditingAltReview, setIsEditingAltReview] = useState(false)
  
  // Include Gift tab edit mode (for I Wish and Alternative)
  const [isEditingIWish, setIsEditingIWish] = useState(false)
  const [isEditingAlt, setIsEditingAlt] = useState(false)

  const descriptionEditorRef = useRef<HTMLDivElement>(null)
  const colorPickerRef = useRef<HTMLDivElement>(null)

  // Auto-load shared wishlists when entering step 2
  useEffect(() => {
    if (currentStep === 2 && productSource === "shared" && sharedItems.length === 0) {
      loadSharedWishlists()
    }
  }, [currentStep])

  // Restore description content when entering step 4
  useEffect(() => {
    if (currentStep === 4 && descriptionEditorRef.current && description) {
      descriptionEditorRef.current.innerHTML = description
    }
  }, [currentStep])

  const TITLE_CHARACTER_LIMIT = 50

  const isUrl = (text: string): boolean => {
    try {
      new URL(text)
      return true
    } catch {
      return text.includes("http://") || text.includes("https://") || text.includes("www.")
    }
  }

  // Load saved title from session
  useEffect(() => {
    try {
      const savedTitle = sessionStorage.getItem("pendingCollectionTitle")
      if (savedTitle) {
        setCollectionTitle(savedTitle)
        sessionStorage.removeItem("pendingCollectionTitle")
      }
    } catch (error) {
      console.error("[v0] Error loading sessionStorage:", error)
    }
  }, [])

  // Auto-extract product when URL changes
  useEffect(() => {
    if (!productUrl || !productUrl.startsWith("http")) return
    const timer = setTimeout(() => extractProductFromUrl(productUrl), 1000)
    return () => clearTimeout(timer)
  }, [productUrl])

  // Helper to normalize attribute keys
  const normalizeAttributeKey = (key: string): string => {
    return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()
  }

  // Poll for Alternative clip data from extension
  useEffect(() => {
    if (!isWaitingForAltClip) return

    console.log('[Alt Clip Gift] 🚀 Starting polling for alternative clip data...')
    let pollCount = 0

    const pollInterval = setInterval(async () => {
      pollCount++
      try {
        console.log(`[Alt Clip Gift] 📡 Poll attempt #${pollCount}...`)
        const response = await fetch('/api/extension/save-variants', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        
        if (!response.ok) {
          console.log('[Alt Clip Gift] ❌ Response not OK:', response.status)
          return
        }
        
        const data = await response.json()
        console.log('[Alt Clip Gift] 📦 Full API response:', JSON.stringify(data, null, 2).substring(0, 800))
        
        // Check if we have variants OR image - either is enough to show clipped data
        const hasVariants = data.variants && typeof data.variants === 'object' && Object.keys(data.variants).length > 0
        const hasImage = data.image && typeof data.image === 'string' && data.image.startsWith('http')
        
        if (hasVariants || hasImage) {
          console.log('[Alt Clip Gift] ✅ Found clipped data!', { hasVariants, hasImage })
          console.log('[Alt Clip Gift] Raw variants:', data.variants)
          
          // Process variants if present
          if (hasVariants) {
            // Filter and normalize variant keys
            const normalizedAttributes: Record<string, string> = {}
            const seenValues = new Set<string>()
            
            const garbageKeyPatterns = [
              /\$\d+/,
              /option from/i,
              /^\d+\s+option/i,
              /see available/i,
              /^\d+$/,
              /^price$/i,
              /^shipping$/i,
              /^delivery$/i,
            ]
            
            for (const [key, value] of Object.entries(data.variants)) {
              if (!value || typeof value !== 'string') continue
              
              if (garbageKeyPatterns.some(p => p.test(key))) {
                console.log('[Alt Clip Gift] ⚠️ Rejected key (garbage pattern):', key)
                continue
              }
              if (key.length < 2 || key.length > 50) {
                console.log('[Alt Clip Gift] ⚠️ Rejected key (length):', key)
                continue
              }
              
              let cleanedValue = (value as string)
                .replace(/\s+/g, ' ')
                .replace(/\$[\d,.]+/g, '')
                .replace(/\d+\s*option[s]?\s*from/gi, '')
                .replace(/see available options?/gi, '')
                .trim()
              
              if (!cleanedValue || cleanedValue.length < 1 || cleanedValue.length > 150) {
                console.log('[Alt Clip Gift] ⚠️ Rejected value (empty/too long):', key, value)
                continue
              }
              
              const garbageWords = ['price', 'option', 'select', 'choose', 'available', 'buy', 'cart', 'add', 'shipping', 'delivery', 'undefined', 'null']
              if (garbageWords.includes(cleanedValue.toLowerCase())) {
                console.log('[Alt Clip Gift] ⚠️ Rejected value (garbage word):', key, cleanedValue)
                continue
              }
              
              if (seenValues.has(cleanedValue.toLowerCase())) continue
              seenValues.add(cleanedValue.toLowerCase())
              
              const normalizedKey = normalizeAttributeKey(key)
              normalizedAttributes[normalizedKey] = cleanedValue
              console.log('[Alt Clip Gift] ✅ Accepted variant:', normalizedKey, '=', cleanedValue)
            }
            
            console.log('[Alt Clip Gift] Final normalized variants:', normalizedAttributes)
            setAltVariants(normalizedAttributes)
          }
          
          // Set image
          console.log('[Alt Clip Gift] Image URL from API:', data.image?.substring(0, 120) || 'UNDEFINED')
          
          if (hasImage) {
            setAltImage(data.image)
            console.log('[Alt Clip Gift] ✅ Using clipped image:', data.image?.substring(0, 80))
          } else {
            // Fallback: use the main product image if no clipped image received
            const fallbackImage = extractedProduct?.imageUrl || iWishImage
            if (fallbackImage) {
              setAltImage(fallbackImage)
              console.log('[Alt Clip Gift] ⚠️ No clipped image - using main product image as fallback:', fallbackImage?.substring(0, 80))
            } else {
              console.log('[Alt Clip Gift] ⚠️ No valid image received and no fallback available')
            }
          }
          
          setIsWaitingForAltClip(false)
          
          toast({
            title: "🐝 Alternative Options Captured!",
            description: "Your alternative preferences have been saved.",
          })
        } else {
          console.log('[Alt Clip Gift] ⏳ No data yet, continuing to poll... (variants:', !!data.variants, ', image:', !!data.image, ')')
        }
      } catch (error) {
        console.error('[Alt Clip Gift] ❌ Polling error:', error)
      }
    }, 1500) // Poll every 1.5 seconds (slightly slower to reduce server load)

    const timeout = setTimeout(() => {
      console.log('[Alt Clip Gift] ⏰ Polling timeout after 90 seconds')
      setIsWaitingForAltClip(false)
      clearInterval(pollInterval)
      toast({
        title: "Timeout",
        description: "No clip received. Please try again.",
        variant: "destructive"
      })
    }, 90000) // Increase timeout to 90 seconds

    return () => {
      console.log('[Alt Clip Gift] 🛑 Cleaning up polling...')
      clearInterval(pollInterval)
      clearTimeout(timeout)
    }
  }, [isWaitingForAltClip, toast, extractedProduct, iWishImage])

  // Poll for Main product clip data from extension (when using "Clip via Extension" option)
  useEffect(() => {
    if (!isWaitingForMainClip) return

    console.log('[Main Clip Gift] 🚀 Starting polling for main product clip data...')
    let pollCount = 0
    let hasReceivedData = false

    const pollInterval = setInterval(async () => {
      if (hasReceivedData) return // Prevent duplicate processing
      pollCount++
      try {
        console.log(`[Main Clip Gift] 📡 Poll attempt #${pollCount}...`)
        const response = await fetch('/api/extension/save-variants', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (!response.ok) {
          console.log('[Main Clip Gift] ❌ Response not OK:', response.status)
          return
        }
        
        const data = await response.json()
        console.log('[Main Clip Gift] 📦 API response:', JSON.stringify(data, null, 2).substring(0, 800))
        
        // Check if we have ANY useful data (URL, variants, or image)
        const hasUrl = data.url && data.url.startsWith('http')
        const hasVariants = data.variants && typeof data.variants === 'object' && Object.keys(data.variants).length > 0
        const hasImage = data.image && data.image.startsWith('http')
        
        console.log('[Main Clip Gift] Data check:', { hasUrl, hasVariants, hasImage })
        
        if (hasUrl || hasVariants || hasImage) {
          console.log('[Main Clip Gift] ✅ Found clipped data!')
          hasReceivedData = true
          
          // Stop polling immediately
          clearInterval(pollInterval)
          setIsWaitingForMainClip(false)
          
          // Set the product URL
          if (hasUrl) {
            setProductUrl(data.url)
            console.log('[Main Clip Gift] Set URL:', data.url)
          }
          
          // Set variant data if present
          if (hasVariants) {
            const normalizedVariants: Record<string, string> = {}
            for (const [key, value] of Object.entries(data.variants)) {
              if (value && typeof value === 'string') {
                const normalizedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()
                normalizedVariants[normalizedKey] = value
              }
            }
            setIWishVariants(normalizedVariants)
            console.log('[Main Clip Gift] Set variants:', normalizedVariants)
          }
          
          // Set image if available
          if (hasImage) {
            setIWishImage(data.image)
            console.log('[Main Clip Gift] Set image:', data.image.substring(0, 80))
          }
          
          // Trigger URL extraction to get full product details
          if (hasUrl) {
            try {
              console.log('[Main Clip Gift] Starting AI extraction for URL:', data.url)
              const extractResponse = await fetch("/api/ai/extract-product", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: data.url }),
              })
              
              if (extractResponse.ok) {
                const extractData = await extractResponse.json()
                console.log('[Main Clip Gift] ✅ Extraction successful:', extractData.productName)
                setExtractedProduct(extractData)
                
                // Set price and gift name
                if (extractData.price) {
                  const priceValue = typeof extractData.price === "string" 
                    ? Number.parseFloat(extractData.price.replace(/[^0-9.]/g, "")) 
                    : extractData.price
                  if (!isNaN(priceValue)) setTargetAmount(priceValue.toFixed(2))
                }
                if (extractData.productName) setGiftName(extractData.productName)
                
                // Set image from extraction if not already set
                if (extractData.imageUrl && !hasImage) {
                  setIWishImage(extractData.imageUrl)
                }
                
                // Extract variants and specs
                const variants: Record<string, string> = {}
                const specs: Record<string, string> = {}
                const variantKeys = ['color', 'style', 'configuration', 'pattern', 'edition', 'size']
                const specificationKeys = ['brand', 'model', 'memorystoragecapacity', 'screensize', 'processor']
                
                if (extractData.attributes) {
                  Object.entries(extractData.attributes).forEach(([key, value]) => {
                    if (value && typeof value === 'string' && value.trim()) {
                      const keyLower = key.toLowerCase().replace(/[\s_-]/g, '')
                      const isVariant = variantKeys.some(vk => keyLower.includes(vk))
                      const normalizedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()
                      
                      if (isVariant) {
                        variants[normalizedKey] = value.trim()
                      } else {
                        specs[normalizedKey] = value.trim()
                      }
                    }
                  })
                }
                
                // Also check top-level fields
                variantKeys.forEach(vk => {
                  const val = extractData[vk]
                  if (val && typeof val === 'string') {
                    variants[vk.charAt(0).toUpperCase() + vk.slice(1)] = val
                  }
                })
                
                // Merge with clipped variants (clipped takes priority)
                setIWishVariants(prev => ({ ...variants, ...prev }))
                setEditableSpecs(specs)
                
                toast({
                  title: "🐝 Product Clipped!",
                  description: "Product details have been extracted from your clip.",
                  variant: "warm",
                })
              } else {
                console.log('[Main Clip Gift] ⚠️ Extraction failed, but clip data was saved')
                toast({
                  title: "🐝 Product Clipped!",
                  description: "Clip saved. Please paste the URL manually for full details.",
                  variant: "warm",
                })
              }
            } catch (extractError) {
              console.error('[Main Clip Gift] Extraction error:', extractError)
              toast({
                title: "🐝 Product Clipped!",
                description: "Clip saved but extraction failed. Try pasting the URL.",
                variant: "warm",
              })
            }
          } else {
            toast({
              title: "🐝 Options Captured!",
              description: "Variant options have been saved. Please paste a URL for full product details.",
              variant: "warm",
            })
          }
        } else {
          console.log('[Main Clip Gift] ⏳ No data yet, continuing to poll...')
        }
      } catch (error) {
        console.error('[Main Clip Gift] ❌ Polling error:', error)
      }
    }, 1500)

    const timeout = setTimeout(() => {
      if (!hasReceivedData) {
        console.log('[Main Clip Gift] ⏰ Polling timeout after 90 seconds')
        setIsWaitingForMainClip(false)
        clearInterval(pollInterval)
        toast({
          title: "Timeout",
          description: "No clip received. Please try clipping again or paste a URL.",
          variant: "destructive"
        })
      }
    }, 90000)

    return () => {
      console.log('[Main Clip Gift] 🛑 Cleaning up polling...')
      clearInterval(pollInterval)
      clearTimeout(timeout)
    }
  }, [isWaitingForMainClip, toast])

  const extractProductFromUrl = async (url: string) => {
    if (!url || !url.startsWith("http")) return

    setIsExtractingProduct(true)
    try {
      const response = await fetch("/api/ai/extract-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      const text = await response.text()
      if (!response.ok) {
        let data: { error?: string; message?: string; suggestion?: string }
        try {
          data = JSON.parse(text) || {}
        } catch (e) {
          toast({ title: "Extraction Error", description: "Failed to extract product details.", variant: "destructive" })
          return
        }
        const description = data.suggestion || data.message || data.error || "Failed to extract product details."
        toast({ title: "Extraction Error", description, variant: "destructive" })
        return
      }

      const data = JSON.parse(text)
      setExtractedProduct(data)

      // Set price and gift name
      if (data.price) {
        const priceValue = typeof data.price === "string" ? Number.parseFloat(data.price.replace(/[^0-9.]/g, "")) : data.price
        if (!isNaN(priceValue)) setTargetAmount(priceValue.toFixed(2))
      }
      if (data.productName && !giftName) setGiftName(data.productName)
      
      // Set I Wish image
      if (data.imageUrl) setIWishImage(data.imageUrl)
      
      // Extract I Wish variants from attributes (color, size, style, etc.)
      const variants: Record<string, string> = {}
      const specs: Record<string, string> = {}
      
      // Variant keys go to I Wish section (purchaser needs to select these)
      // These are SELECTABLE options on the product page (color swatches, dropdowns, etc.)
      // NOTE: 'size' and 'set' are intentionally EXCLUDED:
      // - Size: For electronics, different storage capacities are different products (ASINs), not variants
      // - Set: Duplicates Configuration (AppleCare options)
      // 'connectivity' added for Apple Watch GPS/GPS+Cellular style variants
      const variantKeys = ['color', 'style', 'configuration', 'pattern', 'edition', 'size', 'connectivity']
      
      console.log('[Gift Create] Raw API response - top-level variant fields:', {
        color: data.color,
        style: data.style,
        configuration: data.configuration,
        set: data.set
      })
      console.log('[Gift Create] Raw API response - attributes:', data.attributes)
      
      // Product specification keys - WHITELIST approach (only these will be included in specs)
      // Include Color, Material, Brand, Item Weight, Capacity for Product details display
      const specificationKeys = [
        'brand', 'color', 'material', 'capacity', 'itemweight',
        'operatingsystem', 'os', 'memorystoragecapacity', 'storagecapacity',
        'specialfeature', 'connectivitytechnology', 'wirelesscommunicationstandard',
        'batterycellcomposition', 'batterylife', 'batterycapacity', 'gps',
        'shape', 'screensize', 'displaysize', 'displayresolution', 'resolution',
        'processor', 'chip', 'ram', 'memory', 'graphics', 'graphicscoprocessor',
        'harddisksize', 'formfactor', 'impedance', 'noisecontrol',
        'camera', 'frontcamera', 'backcamera', 'wifi', 'bluetooth', 'ports',
        'waterdepthrating', 'waterresistant', 'compatible', 'sensor', 'display'
      ]
      
      // Keys to EXCLUDE from specs (irrelevant/internal data) - do NOT exclude itemweight so Item Weight shows
      const excludeFromSpecs = [
        'sizeOptions', 'colorVariants', 'combinedVariants', 'styleOptions', 'stockStatus', 'features',
        'caratweight', 'carat', 'productdimensions', 'dimensions',
        'model', 'modelname', 'modelnumber', 'asin', 'upc', 'ean', 'isbn',
        'packagedimensions', 'shippingweight', 'itemmodelnumber', 'manufacturerpartnumber'
      ]
      
      if (data.attributes) {
        Object.entries(data.attributes).forEach(([key, value]) => {
          if (value && typeof value === 'string' && value.trim()) {
            const keyLower = key.toLowerCase().replace(/[\s_-]/g, '')
            
            // Skip if in exclusion list
            if (excludeFromSpecs.some(ek => keyLower === ek || keyLower.includes(ek))) {
              return
            }
            
            // Filter out invalid color values
            const invalidColors = ['base', 'default', 'standard', 'normal', 'regular', 'basic', 'none', 'n/a']
            
            // CHECK VARIANTS FIRST (before specs) - variants take priority
            // Use exact match for most keys, but allow partial match for 'connectivity'
            // Exclude 'screensize' from matching 'size' - screen size is a spec, not a variant
            const isVariantKey = variantKeys.some(vk => {
              if (vk === 'size') {
                // Exact match only for 'size' to avoid matching 'screensize'
                return keyLower === 'size'
              }
              if (vk === 'connectivity') {
                // Partial match for connectivity
                return keyLower.includes('connectivity')
              }
              // Exact match for other variant keys
              return keyLower === vk
            })
            
            if (isVariantKey) {
              if (keyLower === 'color' && invalidColors.includes(value.toLowerCase().trim())) {
                return // Skip invalid color
              }
              // Map "Connectivity Technology" to "Style" for watches - but ALSO keep in specs
              let formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()
              if (keyLower.includes('connectivity') && (value.toLowerCase().includes('gps') || value.toLowerCase().includes('cellular'))) {
                variants['Style'] = value
                // Also add to specs as Connectivity Technology - don't return, let it fall through
                specs[formattedKey] = value
                return
              }
              variants[formattedKey] = value
              // Also show Color in specifications (user expects Color, Material, Brand, Item Weight, Capacity in specs)
              if (keyLower === 'color') {
                specs['Color'] = value
              }
              return // Don't also add to specs for other variants
            }
            
            // Check if this is a specification key (whitelist approach)
            const isSpecificationKey = specificationKeys.some(sk => keyLower === sk || keyLower.includes(sk))
            
            if (isSpecificationKey) {
              // Format key nicely for display
              const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()
              specs[formattedKey] = value
            }
            // Note: Any key NOT in specificationKeys and NOT a variant is now ignored (whitelist approach)
          }
        })
        
        // For electronics (iPad, iPhone, tablets, phones), add memoryStorageCapacity as "Size" variant
        // On Amazon, "Size" for electronics = storage capacity (128GB, 256GB, etc.), which is selectable
        const productNameLower = (data.productName || '').toLowerCase()
        const isElectronics = data.category?.toLowerCase() === 'electronics' || 
                              productNameLower.includes('ipad') ||
                              productNameLower.includes('iphone') ||
                              productNameLower.includes('tablet') ||
                              productNameLower.includes('phone') ||
                              productNameLower.includes('macbook') ||
                              productNameLower.includes('laptop')
        
        if (isElectronics && data.attributes?.memoryStorageCapacity && !variants['Size']) {
          variants['Size'] = data.attributes.memoryStorageCapacity
          console.log('[Gift Create] Added Size from memoryStorageCapacity:', data.attributes.memoryStorageCapacity)
        }
      }
      
      // Add brand separately if available at top level
      if (data.brand && !specs['Brand']) {
        specs['Brand'] = data.brand
      }
      
      // Only add top-level variant options that are ACTUAL selectable dimensions
      // These should only be added if the API explicitly extracted them as variants
      // Filter out invalid/placeholder color values
      const invalidColors = ['base', 'default', 'standard', 'normal', 'regular', 'basic', 'none', 'n/a']
      if (data.color && !variants['Color']) {
        const colorLower = String(data.color).toLowerCase().trim()
        if (!invalidColors.includes(colorLower)) {
          variants['Color'] = data.color
        }
      }
      if (data.style && !variants['Style']) {
        variants['Style'] = data.style
      }
      if (data.configuration && !variants['Configuration']) {
        variants['Configuration'] = data.configuration
      }
      // Note: Don't automatically add 'set' - it often duplicates 'configuration' (AppleCare)
      
      // Also filter out invalid colors that may have been added from attributes
      if (variants['Color'] && invalidColors.includes(String(variants['Color']).toLowerCase().trim())) {
        delete variants['Color']
      }
      
      console.log('[Gift Create] Final variants for I Wish:', variants)
      console.log('[Gift Create] Final specs:', specs)
      
      setIWishVariants(variants)
      setEditableSpecs(specs)
      setProductUrl("")
      
      toast({ title: "🎁 Product Extracted!", description: "Review the details and set your preferences.", variant: "warm" })
    } catch (error) {
      toast({ title: "Extraction Failed", description: "Could not extract product details.", variant: "destructive" })
    } finally {
      setIsExtractingProduct(false)
    }
  }

  // Load shared wishlist items
  const loadSharedWishlists = async () => {
    if (sharedItems.length > 0) return // Already loaded
    setIsLoadingShared(true)
    try {
      const response = await fetch("/api/wishlist-items/shared")
      if (!response.ok) throw new Error("Failed to load shared wishlists")
      const data = await response.json()
      setSharedItems(data.items || [])
      setSharedWishlists(data.wishlists || [])
    } catch (error) {
      toast({ title: "Error", description: "Could not load shared wishlists.", variant: "destructive" })
    } finally {
      setIsLoadingShared(false)
    }
  }

  // Load trending gifts
  const loadTrendingGifts = async () => {
    if (trendingGifts.length > 0) return // Already loaded
    setIsLoadingTrending(true)
    try {
      const response = await fetch("/api/trending-gifts")
      if (!response.ok) throw new Error("Failed to load trending gifts")
      const data = await response.json()
      setTrendingGifts(data.gifts || [])
    } catch (error) {
      toast({ title: "Error", description: "Could not load trending gifts.", variant: "destructive" })
    } finally {
      setIsLoadingTrending(false)
    }
  }

  // Select a shared wishlist item
  const selectSharedItem = (item: any) => {
    const product = {
      productName: item.title || "Shared Product",
      price: item.list_price || 0,
      imageUrl: item.image_url || "",
      productLink: item.product_url || item.affiliate_url || "",
      storeName: item.source || "Store",
      rating: item.review_star || 0,
      reviewCount: item.review_count || 0,
      description: item.description || "",
      attributes: {}
    }
    
    setExtractedProduct(product)
    setIWishImage(item.image_url || "")
    if (item.list_price) setTargetAmount(item.list_price.toString())
    if (item.title && !giftName) setGiftName(item.title)
    
    toast({ title: "🐝 Product Selected!", description: "Details synced from shared wishlist", variant: "warm" })
  }

  // Select a trending gift
  const selectTrendingGift = (gift: any) => {
    const product = {
      productName: gift.productName || "Trending Gift",
      price: gift.price || 0,
      originalPrice: gift.originalPrice,
      imageUrl: gift.image || "",
      productLink: gift.productLink || "",
      storeName: gift.source || "Store",
      rating: gift.rating || 0,
      reviewCount: gift.reviewCount || 0,
      description: gift.description || "",
      amazonChoice: gift.amazonChoice,
      bestSeller: gift.bestSeller,
      overallPick: gift.overallPick,
      attributes: gift.attributes || {}
    }
    
    setExtractedProduct(product)
    setIWishImage(gift.image || "")
    if (gift.price) setTargetAmount(gift.price.toString())
    if (gift.productName && !giftName) setGiftName(gift.productName)
    
    // Extract specs from attributes
    if (gift.attributes) {
      const specs: Record<string, string> = {}
      Object.entries(gift.attributes).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          specs[key] = value
        }
      })
      setEditableSpecs(specs)
    }
    
    toast({ title: "🐝 Product Selected!", description: "Details synced from trending gifts", variant: "warm" })
  }

  // Filter shared items by wishlist
  const filteredSharedItems = selectedSharedWishlist === "all" 
    ? sharedItems 
    : sharedItems.filter(item => item.wishlist_id === selectedSharedWishlist)

  // Trending Gifts: extract filter options and filter/sort (same as /gifts/trending)
  const categoriesTrending = useMemo(() => {
    return ["all", ...Array.from(new Set(trendingGifts.map((g) => g.category).filter(Boolean)))]
  }, [trendingGifts])

  const sourcesTrending = useMemo(() => {
    return ["all", ...Array.from(new Set(trendingGifts.map((g) => g.source).filter(Boolean)))]
  }, [trendingGifts])

  const filteredAndSortedTrendingGifts = useMemo(() => {
    const name = (g: any) => (g.productName || g.giftName || "").toLowerCase()
    const price = (g: any) => g.price ?? g.targetAmount ?? 0
    let filtered = trendingGifts.filter((gift) => {
      const matchesSearch =
        !searchQueryTrending ||
        name(gift).includes(searchQueryTrending.toLowerCase()) ||
        (gift.description || "").toLowerCase().includes(searchQueryTrending.toLowerCase()) ||
        (gift.category || "").toLowerCase().includes(searchQueryTrending.toLowerCase())
      const matchesCategory = selectedCategoryTrending === "all" || gift.category === selectedCategoryTrending
      const matchesSource = selectedSourceTrending === "all" || gift.source === selectedSourceTrending
      const matchesRating =
        selectedRatingTrending === "all" ||
        (gift.rating != null &&
          ((selectedRatingTrending === "4+" && gift.rating >= 4) ||
            (selectedRatingTrending === "3+" && gift.rating >= 3) ||
            (selectedRatingTrending === "2+" && gift.rating >= 2) ||
            (selectedRatingTrending === "1+" && gift.rating >= 1)))
      const matchesBadge =
        selectedBadgeTrending === "all" ||
        (selectedBadgeTrending === "amazon-choice" && gift.amazonChoice) ||
        (selectedBadgeTrending === "best-seller" && gift.bestSeller) ||
        (selectedBadgeTrending === "overall-pick" && gift.overallPick) ||
        (selectedBadgeTrending === "on-sale" && gift.originalPrice != null && gift.originalPrice > price(gift))
      const p = price(gift)
      const matchesPriceRange =
        (!priceRangeTrending.min || p >= parseFloat(priceRangeTrending.min)) &&
        (!priceRangeTrending.max || p <= parseFloat(priceRangeTrending.max))
      return matchesSearch && matchesCategory && matchesSource && matchesRating && matchesBadge && matchesPriceRange
    })
    filtered.sort((a, b) => {
      switch (sortByTrending) {
        case "rating":
          return (b.rating ?? 0) - (a.rating ?? 0)
        case "price-low":
          return price(a) - price(b)
        case "price-high":
          return price(b) - price(a)
        case "name":
          return (a.productName || a.giftName || "").localeCompare(b.productName || b.giftName || "")
        case "newest":
          const da = a.createdDate ? new Date(a.createdDate).getTime() : 0
          const db = b.createdDate ? new Date(b.createdDate).getTime() : 0
          return db - da
        case "popularity":
        default:
          return (b.reviewCount ?? 0) - (a.reviewCount ?? 0)
      }
    })
    return filtered
  }, [
    trendingGifts,
    searchQueryTrending,
    selectedCategoryTrending,
    selectedSourceTrending,
    selectedRatingTrending,
    selectedBadgeTrending,
    priceRangeTrending,
    sortByTrending,
  ])

  const activeFiltersCountTrending = useMemo(() => {
    let count = 0
    if (selectedCategoryTrending !== "all") count++
    if (selectedSourceTrending !== "all") count++
    if (selectedRatingTrending !== "all") count++
    if (selectedBadgeTrending !== "all") count++
    if (priceRangeTrending.min || priceRangeTrending.max) count++
    return count
  }, [selectedCategoryTrending, selectedSourceTrending, selectedRatingTrending, selectedBadgeTrending, priceRangeTrending])

  const clearAllTrendingFilters = () => {
    setSearchQueryTrending("")
    setSelectedCategoryTrending("all")
    setSelectedSourceTrending("all")
    setSelectedRatingTrending("all")
    setSelectedBadgeTrending("all")
    setPriceRangeTrending({ min: "", max: "" })
    setSortByTrending("popularity")
  }

  const getCategoryColorTrending = (category: string): { bg: string; text: string; border: string } => {
    const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
      Electronics: { bg: "from-rose-100 to-pink-100", text: "text-rose-700", border: "border-rose-200" },
      "Home & Kitchen": { bg: "from-amber-100 to-yellow-100", text: "text-amber-700", border: "border-amber-200" },
      Clothing: { bg: "from-violet-100 to-purple-100", text: "text-violet-700", border: "border-violet-200" },
      Beauty: { bg: "from-pink-100 to-rose-100", text: "text-pink-700", border: "border-pink-200" },
      Sports: { bg: "from-emerald-100 to-teal-100", text: "text-emerald-700", border: "border-emerald-200" },
      Toys: { bg: "from-orange-100 to-amber-100", text: "text-orange-700", border: "border-orange-200" },
      Books: { bg: "from-indigo-100 to-blue-100", text: "text-indigo-700", border: "border-indigo-200" },
      Jewelry: { bg: "from-fuchsia-100 to-pink-100", text: "text-fuchsia-700", border: "border-fuchsia-200" },
    }
    if (categoryColors[category]) return categoryColors[category]
    const hash = category.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const opts = [
      { bg: "from-coral-100 to-red-100", text: "text-red-700", border: "border-red-200" },
      { bg: "from-amber-100 to-orange-100", text: "text-amber-700", border: "border-amber-200" },
      { bg: "from-rose-100 to-pink-100", text: "text-rose-700", border: "border-rose-200" },
    ]
    return opts[hash % opts.length]
  }

  const addAffiliateTagTrending = (url: string): string => {
    if (!url) return url
    try {
      const u = new URL(url)
      if (u.hostname.includes("amazon.")) {
        u.searchParams.delete("tag")
        u.searchParams.set("tag", "wishbeeai-20")
        return u.toString()
      }
      return url
    } catch {
      return url
    }
  }

  const getFilteredAttributesTrending = (gift: any) => {
    if (!gift?.attributes) return []
    const exclude = ["color", "size", "style", "brand", "sizeOptions", "colorVariants", "combinedVariants", "styleOptions", "styleName", "patternName"]
    return Object.entries(gift.attributes).filter(
      ([key, value]) => !exclude.includes(key) && value != null && value !== ""
    )
  }

  // Map trending gift to shape expected by AddToWishlistModal (Choose Your Preferred Options / Change Options UI)
  const trendingGiftToModalGift = (gift: any) => {
    if (!gift) return null
    return {
      id: gift.id,
      giftName: gift.productName || gift.giftName || "Product",
      productLink: gift.productLink,
      image: gift.image,
      targetAmount: gift.price ?? gift.targetAmount ?? 0,
      source: gift.source,
      category: gift.category,
      rating: gift.rating,
      reviewCount: gift.reviewCount,
      amazonChoice: gift.amazonChoice,
      bestSeller: gift.bestSeller,
      overallPick: gift.overallPick,
      originalPrice: gift.originalPrice,
      attributes: gift.attributes,
    }
  }

  const handleGenerateBanner = async () => {
    if (!collectionTitle) {
      toast({ title: "Title required", description: "Please enter a collection title first.", variant: "destructive" })
      return
    }

    setIsGeneratingBanner(true)
    try {
      const response = await fetch("/api/ai/generate-banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: collectionTitle, occasion }),
      })
      if (!response.ok) throw new Error("Failed to generate banner")
      const data = await response.json()
      setBannerImage(data.bannerUrl)
      toast({ title: "Banner generated!", description: "Your collection banner has been created." })
    } catch (error) {
      toast({ title: "Generation failed", description: "Could not generate banner.", variant: "destructive" })
    } finally {
      setIsGeneratingBanner(false)
    }
  }

  const handleEnhanceDescription = async () => {
    if (!description.trim()) {
      toast({ title: "No description", description: "Please enter a description first.", variant: "destructive" })
      return
    }

    setIsEnhancingDescription(true)
    try {
      const response = await fetch("/api/ai/enhance-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: descriptionEditorRef.current?.innerText || description,
          recipientName: recipientName || "Gift recipient",
          occasion,
          tone: "helpful",
        }),
      })
      if (!response.ok) throw new Error("Failed to enhance")
      const data = await response.json()
      let enhancedText = data.enhancedDescription.replace(/```html\n?/g, "").replace(/```\n?/g, "").trim()
      if (descriptionEditorRef.current) {
        descriptionEditorRef.current.innerHTML = enhancedText
        setDescription(enhancedText)
      }
      toast({ title: "Enhanced!", description: "Your description has been improved with AI." })
    } catch (error) {
      toast({ title: "Enhancement failed", description: "Could not enhance description.", variant: "destructive" })
    } finally {
      setIsEnhancingDescription(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setIsUploadingImage(true)
    const reader = new FileReader()
    reader.onloadend = () => {
      setExtractedProduct((prev: any) => ({ ...prev, imageUrl: reader.result as string }))
      setIsUploadingImage(false)
    }
    reader.onerror = () => {
      toast({ title: "Upload Failed", description: "Failed to upload image.", variant: "destructive" })
      setIsUploadingImage(false)
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProductEdits = () => {
    setExtractedProduct((prev: any) => ({
      ...prev,
      price: manualPrice ? Number.parseFloat(manualPrice) : prev.price,
      attributes: {
        ...prev.attributes,
        color: manualColor || prev.attributes?.color,
        size: manualSize || prev.attributes?.size,
        material: manualFeatures || prev.attributes?.material,
      },
    }))
    setIsEditingProduct(false)
    toast({ title: "Saved", description: "Your changes have been saved." })
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!collectionTitle.trim()) {
          toast({ title: "Required", description: "Please enter a collection title.", variant: "destructive" })
          return false
        }
        if (isUrl(collectionTitle)) {
          toast({ title: "Invalid Title", description: "URLs are not allowed in the title.", variant: "destructive" })
          return false
        }
        if (!recipientName.trim()) {
          toast({ title: "Required", description: "Please enter the recipient's name.", variant: "destructive" })
          return false
        }
        if (!occasion) {
          toast({ title: "Required", description: "Please select an occasion.", variant: "destructive" })
          return false
        }
        return true
      case 2:
        // Product step - require a product from Trending Gifts, Shared Wishlists, or Add Your Own
        const hasProduct = !!(
          extractedProduct ||
          (Object.keys(iWishVariants).length > 0) ||
          (iWishImage && (giftName?.trim() || productUrl?.trim()))
        )
        if (!hasProduct) {
          toast({
            title: "Select a product",
            description: "Please choose a product from Trending Gifts, Shared Wishlists, or Add Your Own before continuing.",
            variant: "destructive",
          })
          return false
        }
        return true
      case 3:
        if (!giftName.trim()) {
          toast({ title: "Required", description: "Please enter a gift name.", variant: "destructive" })
          return false
        }
        if (!targetAmount || parseFloat(targetAmount) <= 0) {
          toast({ title: "Required", description: "Please enter a valid target amount.", variant: "destructive" })
          return false
        }
        if (!deadline) {
          toast({ title: "Required", description: "Please select a deadline.", variant: "destructive" })
          return false
        }
        return true
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < 6) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goToStep = (step: number) => {
    // Allow going back, but validate before going forward
    if (step < currentStep) {
      setCurrentStep(step)
    } else if (step > currentStep) {
      let canProceed = true
      for (let i = currentStep; i < step; i++) {
        if (!validateStep(i)) {
          canProceed = false
          break
        }
      }
      if (canProceed) setCurrentStep(step)
    }
  }

  const handleSubmit = async () => {
    // Validate all steps
    for (let i = 1; i <= 4; i++) {
      if (!validateStep(i)) return
    }

    // Validate alternative price is not higher than I Wish price
    if (altPrice && extractedProduct?.price && altPrice > extractedProduct.price) {
      toast({
        title: "Alternative Price Too High",
        description: "Alternative option must be priced equal to or lower than your I Wish selection.",
        variant: "destructive",
      })
      setCurrentStep(2) // Go back to Product step
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionTitle,
          recipientName,
          occasion,
          giftName,
          description,
          targetAmount: Number.parseFloat(targetAmount),
          deadline,
          bannerImage: bannerImage || null,
          price: extractedProduct?.price || null,
          category: extractedProduct?.category || "General",
          brand: extractedProduct?.attributes?.brand || null,
          productImage: iWishImage || extractedProduct?.imageUrl || null,
          productLink: extractedProduct?.productLink || productUrl,
          storeName: extractedProduct?.storeName || null,
          rating: extractedProduct?.rating || null,
          reviewCount: extractedProduct?.reviewCount || null,
          specifications: editableSpecs || null,
          // Preference options
          preferenceOptions: {
            iLike: {
              image: iWishImage || extractedProduct?.imageUrl || null,
              variants: iWishVariants,
              notes: iWishNotes,
            },
            alternative: {
              image: altImage || null,
              variants: altVariants,
              notes: altNotes,
              price: altPrice || null,
              specs: altEditableSpecs || null,
            },
          },
          eviteSettings: eviteSettings || null,
          // Self-contribution during create: record so progress shows on /gifts/active
          ...(contributionComplete && myContributionAmount != null && Number(myContributionAmount) >= 1
            ? { initialContribution: Number(myContributionAmount) }
            : {}),
        }),
      })

      const rawText = await response.text()
      let data: Record<string, unknown> = {}
      try {
        if (rawText && rawText.trim()) data = JSON.parse(rawText) as Record<string, unknown>
      } catch {
        console.error("[Gift Create] POST /api/gifts failed: response was not JSON. Status:", response.status, "Body (first 500 chars):", rawText.slice(0, 500))
        throw new Error("Server returned an error page. Check the browser console for the response body and the terminal where 'npm run dev' is running.")
      }
      if (!response.ok) {
        // Always derive message from raw body for 500s so we show the real server error
        let message = "Failed to create gift"
        if (rawText?.trim()) {
          try {
            const parsed = JSON.parse(rawText) as Record<string, unknown>
            const details = parsed?.details && typeof parsed.details === "string" ? parsed.details : null
            const errMsg = parsed?.error && typeof parsed.error === "string" ? parsed.error : null
            message = details || errMsg || message
            // When Supabase schema is wrong (PGRST204), tell user exactly how to fix
            const code = parsed?.code as string | undefined
            if ((code === "PGRST204" || (details && details.includes("schema cache"))) && message) {
              message = `${message} Fix: Copy RUN-GIFTS-MIGRATION.sql (project root) into Supabase SQL Editor → Run. Then Settings → API → Reload schema cache.`
            }
          } catch {
            message = response.status === 500
              ? "Server error. Check the terminal where 'npm run dev' is running."
              : message
          }
        } else if (response.status === 500) {
          message = "Server error (no response body). Check the terminal where 'npm run dev' is running."
        }
        console.error("[Gift Create] POST /api/gifts failed:", response.status, "rawBody:", rawText?.slice(0, 500))
        throw new Error(message)
      }
      
      // Generate magic link if evite settings are enabled
      if (eviteSettings?.enableMagicLink) {
        try {
          const magicLinkResponse = await fetch(`/api/gifts/${data.id}/magic-link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              enableReminders: eviteSettings.enableReminders,
              colorTheme: eviteSettings.colorTheme,
              invitationMessage: eviteSettings.invitationMessage,
            }),
          })
          
          const magicLinkData = await magicLinkResponse.json()
          
          if (magicLinkData.success) {
            console.log('[Gift Create] Magic link generated:', magicLinkData.magicLink.url)
            const url = magicLinkData.magicLink.url
            sessionStorage.setItem(`gift_${data.id}_magicLink`, url)
            setCreatedGiftMagicLink(url)
            setCreatedGiftId(String(data.id))
            setCurrentStep(7)
            return
          }
        } catch (magicLinkError) {
          console.error('[Gift Create] Failed to generate magic link:', magicLinkError)
        }
      }
      
      // Use contribution link and stay on create page → show Share tab (step 7) in same form
      const defaultLink = `${window.location.origin}/gifts/contribute/${data.id}`
      sessionStorage.setItem(`gift_${data.id}_magicLink`, defaultLink)
      setCreatedGiftMagicLink(defaultLink)
      setCreatedGiftId(String(data.id))
      setCurrentStep(7)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create gift collection."
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return 'completed'
    if (stepId === currentStep) return 'current'
    return 'upcoming'
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header — same as active */}
        <div className="mb-8">
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <div className="flex flex-row items-center justify-center gap-2">
              <Gift className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#DAA520] flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-foreground whitespace-nowrap">
                Create Gift Collection
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2">
              Start a new gift collection and invite friends to contribute
            </p>
          </div>
        </div>

      {/* Main Content with Left Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#DAA520]/20 overflow-hidden">
          
          {/* Two Column Layout: Left Nav + Content */}
          <div className="flex flex-col md:flex-row">
            {/* Left Navigation Sidebar */}
            <div className="md:w-52 lg:w-60 bg-[#F5F1E8] border-b md:border-b-0 md:border-r border-[#DAA520]/20 p-3 md:p-4">
              <div className="flex md:flex-col gap-1.5 md:gap-2 overflow-x-auto md:overflow-x-visible">
                {STEPS.map((step, index) => {
                  const status = getStepStatus(step.id)
                  const Icon = step.icon
                  
                  return (
                    <div key={step.id} className="flex md:flex-col items-center md:items-stretch">
                      <button
                        onClick={() => goToStep(step.id)}
                        className={`flex items-center gap-2 px-2.5 py-2 md:py-2.5 rounded-lg transition-all w-full min-w-[100px] md:min-w-0 ${
                          status === 'current'
                            ? 'bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white shadow-md'
                            : status === 'completed'
                            ? 'bg-white text-[#B8860B] border-2 border-[#DAA520]/30 hover:border-[#DAA520]'
                            : 'bg-white/50 text-gray-400 hover:bg-white hover:text-gray-600 border-2 border-transparent'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          status === 'current'
                            ? 'bg-white/20'
                            : status === 'completed'
                            ? 'bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white'
                            : 'bg-gray-200'
                        }`}>
                          {status === 'completed' ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-[14px] font-bold leading-tight">{step.title}</p>
                          <p className={`text-[12px] leading-tight mt-0.5 ${
                            status === 'current' ? 'text-white/80' : 'opacity-60'
                          }`}>{step.description}</p>
                        </div>
                        {status === 'current' && (
                          <ChevronRight className="w-4 h-4 hidden md:block flex-shrink-0" />
                        )}
                      </button>
                      
                      {/* Connector Line (vertical on desktop, horizontal on mobile) */}
                      {index < STEPS.length - 1 && (
                        <>
                          {/* Mobile: horizontal line */}
                          <div className={`w-6 h-0.5 mx-1 md:hidden ${
                            status === 'completed' ? 'bg-gradient-to-r from-[#DAA520] to-[#F4C430]' : 'bg-gray-300'
                          }`} />
                          {/* Desktop: vertical line */}
                          <div className={`hidden md:block w-0.5 h-2 ml-6 ${
                            status === 'completed' ? 'bg-gradient-to-r from-[#DAA520] to-[#F4C430]' : 'bg-gray-300'
                          }`} />
                        </>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Progress Summary */}
              <div className="hidden md:block mt-4 pt-4 border-t border-[#DAA520]/20">
                <div className="bg-white rounded-lg p-3 border border-[#DAA520]/20">
                  <p className="text-[10px] text-[#8B4513]/70 mb-1.5">Progress</p>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] transition-all duration-300"
                        style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-[#654321]">{currentStep}/{STEPS.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 min-w-0">
          {/* Step Content */}
          {/* Step 1: Purpose */}
          {currentStep === 1 && (
            <div className="p-6 sm:p-8">
              <div className="max-w-lg mx-auto space-y-6">
                {/* Collection Title */}
                <div className="space-y-2">
                  <Label className="text-[#654321] font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#DAA520]" />
                    Collection Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={collectionTitle}
                    onChange={(e) => e.target.value.length <= TITLE_CHARACTER_LIMIT && setCollectionTitle(e.target.value)}
                    placeholder="e.g., Sarah's Birthday Gift Fund"
                    className="border-2 border-[#DAA520]/30 focus:border-[#DAA520] h-12 text-base"
                  />
                  <div className="flex justify-between text-xs text-[#8B4513]/60">
                    <span>Give your collection a memorable name</span>
                    <span className={collectionTitle.length >= TITLE_CHARACTER_LIMIT ? "text-red-500 font-semibold" : ""}>
                      {collectionTitle.length}/{TITLE_CHARACTER_LIMIT}
                    </span>
                  </div>
                </div>

                {/* Recipient Name */}
                <div className="space-y-2">
                  <Label className="text-[#654321] font-semibold flex items-center gap-2">
                    <User className="w-4 h-4 text-[#DAA520]" />
                    Recipient Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Who will receive this gift?"
                    className="border-2 border-[#DAA520]/30 focus:border-[#DAA520] h-12 text-base"
                  />
                </div>

                {/* Occasion */}
                <div className="space-y-2">
                  <Label className="text-[#654321] font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#DAA520]" />
                    Occasion <span className="text-red-500">*</span>
                  </Label>
                  <select
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="w-full h-12 px-4 border-2 border-[#DAA520]/30 focus:border-[#DAA520] rounded-lg bg-white text-[#654321] text-base outline-none"
                  >
                    <option value="">Select an occasion...</option>
                    {OCCASIONS.map(occ => (
                      <option key={occ} value={occ}>{occ}</option>
                    ))}
                  </select>
                </div>

                {/* Tip Box */}
                <div className="bg-[#F5F1E8] rounded-xl p-4 border border-[#DAA520]/20">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-[#DAA520] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#654321]">Pro Tip</p>
                      <p className="text-xs text-[#8B4513]/70">A clear, personal title helps contributors connect with your cause and encourages more contributions.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Include Gift */}
          {currentStep === 2 && (
            <div className="p-3 sm:p-6">
              <div className="max-w-3xl mx-auto">
                {/* Product Source Selection Cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
                  {/* From Shared Wishlists - FIRST */}
                  <button
                    type="button"
                    onClick={() => {
                      setProductSource("shared")
                      loadSharedWishlists()
                    }}
                    className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all text-center ${
                      productSource === "shared"
                        ? "border-[#DAA520] bg-gradient-to-br from-[#DAA520]/10 to-[#F4C430]/10 shadow-md"
                        : "border-gray-200 bg-white hover:border-[#DAA520]/50 hover:bg-amber-50/30"
                    }`}
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                      productSource === "shared" 
                        ? "bg-gradient-to-br from-[#DAA520] to-[#F4C430]" 
                        : "bg-gray-100"
                    }`}>
                      <Users className={`w-5 h-5 sm:w-6 sm:h-6 ${productSource === "shared" ? "text-white" : "text-gray-500"}`} />
                    </div>
                    <p className={`text-xs sm:text-sm font-semibold ${productSource === "shared" ? "text-[#654321]" : "text-gray-600"}`}>
                      Shared Wishlists
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 hidden sm:block">Browse Sharelists</p>
                    {productSource === "shared" && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-[#DAA520] rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>

                  {/* From Trending Gifts - SECOND */}
                  <button
                    type="button"
                    onClick={() => {
                      setProductSource("trending")
                      loadTrendingGifts()
                    }}
                    className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all text-center ${
                      productSource === "trending"
                        ? "border-[#F59E0B] bg-gradient-to-br from-[#F59E0B]/10 to-[#FBBF24]/10 shadow-md"
                        : "border-gray-200 bg-white hover:border-[#F59E0B]/50 hover:bg-amber-50/30"
                    }`}
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                      productSource === "trending" 
                        ? "bg-gradient-to-br from-[#F59E0B] to-[#FBBF24]" 
                        : "bg-gray-100"
                    }`}>
                      <TrendingUp className={`w-5 h-5 sm:w-6 sm:h-6 ${productSource === "trending" ? "text-white" : "text-gray-500"}`} />
                    </div>
                    <p className={`text-xs sm:text-sm font-semibold ${productSource === "trending" ? "text-[#78350F]" : "text-gray-600"}`}>
                      Trending Gifts
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 hidden sm:block">Popular Items</p>
                    {productSource === "trending" && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-[#F59E0B] rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>

                  {/* Add Your Own - THIRD */}
                  <button
                    type="button"
                    onClick={() => setProductSource("url")}
                    className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all text-center ${
                      productSource === "url"
                        ? "border-[#EA580C] bg-gradient-to-br from-[#EA580C]/10 to-[#FB923C]/10 shadow-md"
                        : "border-gray-200 bg-white hover:border-[#EA580C]/50 hover:bg-orange-50/30"
                    }`}
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                      productSource === "url" 
                        ? "bg-gradient-to-br from-[#EA580C] to-[#FB923C]" 
                        : "bg-gray-100"
                    }`}>
                      <LinkIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${productSource === "url" ? "text-white" : "text-gray-500"}`} />
                    </div>
                    <p className={`text-xs sm:text-sm font-semibold ${productSource === "url" ? "text-[#7C2D12]" : "text-gray-600"}`}>
                      Add Your Own
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 hidden sm:block">Paste URL</p>
                    {productSource === "url" && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-[#EA580C] rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                </div>

                {/* Shared Wishlists Browser - FIRST */}
                {productSource === "shared" && (
                  <div className="bg-gradient-to-br from-amber-50/50 to-yellow-50/50 rounded-xl border border-[#DAA520]/20 overflow-hidden mb-4">
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#DAA520] to-[#F4C430]">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-white" />
                        <span className="text-sm font-semibold text-white">Shared Wishlists</span>
                      </div>
                      {sharedWishlists.length > 1 && (
                        <select
                          value={selectedSharedWishlist}
                          onChange={(e) => setSelectedSharedWishlist(e.target.value)}
                          className="px-2 py-1 text-xs border border-white/30 rounded-lg bg-white/20 text-white focus:outline-none"
                        >
                          <option value="all" className="text-gray-800">All Wishlists</option>
                          {sharedWishlists.map((wl) => (
                            <option key={wl.id} value={wl.id} className="text-gray-800">
                              {wl.title}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="max-h-[280px] overflow-y-auto">
                      {isLoadingShared ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-6 h-6 animate-spin text-[#DAA520]" />
                          <span className="ml-2 text-sm text-[#654321]">Loading...</span>
                        </div>
                      ) : filteredSharedItems.length === 0 ? (
                        <div className="text-center py-12 px-4">
                          <Users className="w-12 h-12 mx-auto text-[#DAA520]/30 mb-3" />
                          <p className="text-sm text-[#654321]/70 font-medium">No shared wishlists found</p>
                          <p className="text-xs text-[#654321]/50 mt-1">Ask friends to share their wishlists with you</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
                          {filteredSharedItems.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => selectSharedItem(item)}
                              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-[#DAA520] hover:shadow-md transition-all text-left"
                            >
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.title} className="w-14 h-14 object-contain rounded-lg bg-gray-50" />
                              ) : (
                                <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Package className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[#654321] line-clamp-2">{item.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {item.list_price && (
                                    <span className="text-sm font-bold text-[#DAA520]">${item.list_price.toFixed(2)}</span>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Trending Gifts Browser - SECOND */}
                {productSource === "trending" && (
                  <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/40 rounded-xl border-2 border-[#F59E0B]/25 overflow-hidden mb-4 shadow-sm">
                    <div className="flex items-center gap-2 px-4 py-3.5 bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]">
                      <TrendingUp className="w-5 h-5 text-white" />
                      <span className="text-base font-semibold text-white">Trending Gifts</span>
                      <span className="ml-auto text-sm text-white/90">{trendingGifts.length} items</span>
                    </div>
                    {/* Search and filters (same as /gifts/trending) */}
                    {trendingGifts.length > 0 && (
                      <div className="px-4 pt-3 pb-2 border-b border-[#F59E0B]/10 bg-white/50">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F59E0B] w-4 h-4" />
                            <input
                              type="text"
                              placeholder="Search trending gifts..."
                              value={searchQueryTrending}
                              onChange={(e) => setSearchQueryTrending(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 rounded-lg border-2 border-[#F59E0B]/20 focus:border-[#F59E0B] focus:outline-none bg-white text-[#654321] text-sm"
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              onClick={() => setShowFiltersTrending(!showFiltersTrending)}
                              className={`h-9 px-3 rounded-lg border-2 text-sm transition-all ${
                                showFiltersTrending || activeFiltersCountTrending > 0
                                  ? "bg-[#F59E0B] text-white border-[#F59E0B]"
                                  : "bg-white text-[#654321] border-[#F59E0B]/20 hover:border-[#F59E0B]"
                              }`}
                            >
                              <SlidersHorizontal className="w-4 h-4 mr-1.5" />
                              Filters
                              {activeFiltersCountTrending > 0 && (
                                <span className="ml-1.5 bg-white/20 text-white rounded-full px-1.5 py-0.5 text-xs font-bold">
                                  {activeFiltersCountTrending}
                                </span>
                              )}
                            </Button>
                            <div className="flex gap-0.5 border-2 border-[#F59E0B]/20 rounded-lg bg-white p-0.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewModeTrending("grid")}
                                className={`h-8 px-2.5 ${viewModeTrending === "grid" ? "bg-[#F59E0B] text-white" : "text-[#654321]"}`}
                              >
                                <Grid3x3 className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewModeTrending("list")}
                                className={`h-8 px-2.5 ${viewModeTrending === "list" ? "bg-[#F59E0B] text-white" : "text-[#654321]"}`}
                              >
                                <List className="w-4 h-4" />
                              </Button>
                            </div>
                            <select
                              value={sortByTrending}
                              onChange={(e) => setSortByTrending(e.target.value as typeof sortByTrending)}
                              className="h-9 px-3 rounded-lg border-2 border-[#F59E0B]/20 focus:border-[#F59E0B] focus:outline-none bg-white text-[#654321] text-sm font-medium cursor-pointer"
                            >
                              <option value="popularity">Sort: Popularity</option>
                              <option value="rating">Sort: Rating</option>
                              <option value="price-low">Sort: Price Low to High</option>
                              <option value="price-high">Sort: Price High to Low</option>
                              <option value="name">Sort: Name A–Z</option>
                              <option value="newest">Sort: Newest</option>
                            </select>
                          </div>
                        </div>
                        {/* Advanced filters panel */}
                        {showFiltersTrending && (
                          <div className="mt-3 pt-3 border-t border-[#F59E0B]/10">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-[#654321]">Filter options</span>
                              <div className="flex gap-2">
                                {activeFiltersCountTrending > 0 && (
                                  <Button type="button" variant="outline" size="sm" onClick={clearAllTrendingFilters} className="text-xs h-8 border-[#F59E0B] text-[#654321] hover:bg-[#F59E0B] hover:text-white">
                                    <X className="w-3 h-3 mr-1" /> Clear all
                                  </Button>
                                )}
                                <Button type="button" variant="ghost" size="sm" onClick={() => setShowFiltersTrending(false)} className="h-8 w-8 p-0">
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-[#654321] mb-1">Category</label>
                                <select value={selectedCategoryTrending} onChange={(e) => setSelectedCategoryTrending(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-[#F59E0B]/20 text-[#654321] text-sm focus:outline-none focus:border-[#F59E0B] bg-white">
                                  {categoriesTrending.map((c) => (
                                    <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-[#654321] mb-1">Store</label>
                                <select value={selectedSourceTrending} onChange={(e) => setSelectedSourceTrending(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-[#F59E0B]/20 text-[#654321] text-sm focus:outline-none focus:border-[#F59E0B] bg-white">
                                  {sourcesTrending.map((s) => (
                                    <option key={s} value={s}>{s === "all" ? "All stores" : s}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-[#654321] mb-1">Min. rating</label>
                                <select value={selectedRatingTrending} onChange={(e) => setSelectedRatingTrending(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-[#F59E0B]/20 text-[#654321] text-sm focus:outline-none focus:border-[#F59E0B] bg-white">
                                  <option value="all">All</option>
                                  <option value="4+">4+ Stars</option>
                                  <option value="3+">3+ Stars</option>
                                  <option value="2+">2+ Stars</option>
                                  <option value="1+">1+ Stars</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-[#654321] mb-1">Badge</label>
                                <select value={selectedBadgeTrending} onChange={(e) => setSelectedBadgeTrending(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-[#F59E0B]/20 text-[#654321] text-sm focus:outline-none focus:border-[#F59E0B] bg-white">
                                  <option value="all">All</option>
                                  <option value="amazon-choice">Amazon's Choice</option>
                                  <option value="best-seller">Best Seller</option>
                                  <option value="overall-pick">Overall Pick</option>
                                  <option value="on-sale">On Sale</option>
                                </select>
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-[#654321] mb-1">Price range</label>
                                <div className="flex gap-2">
                                  <input type="number" placeholder="Min" value={priceRangeTrending.min} onChange={(e) => setPriceRangeTrending((p) => ({ ...p, min: e.target.value }))} className="flex-1 px-2 py-1.5 rounded-lg border border-[#F59E0B]/20 text-[#654321] text-sm focus:outline-none focus:border-[#F59E0B] bg-white" />
                                  <input type="number" placeholder="Max" value={priceRangeTrending.max} onChange={(e) => setPriceRangeTrending((p) => ({ ...p, max: e.target.value }))} className="flex-1 px-2 py-1.5 rounded-lg border border-[#F59E0B]/20 text-[#654321] text-sm focus:outline-none focus:border-[#F59E0B] bg-white" />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-[#78350F]/80 mt-2">
                          {filteredAndSortedTrendingGifts.length} {filteredAndSortedTrendingGifts.length === 1 ? "gift" : "gifts"} found
                          {activeFiltersCountTrending > 0 && (
                            <button type="button" onClick={clearAllTrendingFilters} className="ml-2 underline font-medium hover:no-underline">
                              Clear filters
                            </button>
                          )}
                        </p>
                      </div>
                    )}
                    <div className="max-h-[520px] overflow-y-auto p-4">
                      {isLoadingTrending ? (
                        <div className="flex items-center justify-center py-16">
                          <Loader2 className="w-8 h-8 animate-spin text-[#F59E0B]" />
                          <span className="ml-3 text-base text-[#78350F]">Loading...</span>
                        </div>
                      ) : trendingGifts.length === 0 ? (
                        <div className="text-center py-16 px-4">
                          <TrendingUp className="w-14 h-14 mx-auto text-[#F59E0B]/30 mb-4" />
                          <p className="text-base text-[#78350F]/70 font-medium">No trending gifts yet</p>
                          <p className="text-sm text-[#78350F]/50 mt-2">Check back later for popular gift ideas</p>
                        </div>
                      ) : filteredAndSortedTrendingGifts.length === 0 ? (
                        <div className="text-center py-12 px-4">
                          <p className="text-sm text-[#78350F]/70 font-medium">No gifts match your filters</p>
                          <Button type="button" onClick={clearAllTrendingFilters} className="mt-3 bg-[#F59E0B] hover:bg-[#D97706] text-white text-sm">
                            Clear filters
                          </Button>
                        </div>
                      ) : viewModeTrending === "grid" ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredAndSortedTrendingGifts.map((gift) => {
                            const name = gift.productName || gift.giftName || "Trending Gift"
                            const priceVal = gift.price ?? gift.targetAmount ?? 0
                            const attrs = getFilteredAttributesTrending(gift)
                            return (
                              <div key={gift.id} className="bg-gradient-to-br from-white to-amber-50/30 rounded-2xl shadow-lg border border-[#DAA520]/30 overflow-hidden hover:shadow-2xl hover:border-[#DAA520]/60 transition-all duration-300 group flex flex-col h-full">
                                <div className="relative overflow-hidden">
                                  <img src={gift.image || "/placeholder.svg"} alt={name} className="w-full h-40 object-contain bg-white group-hover:scale-105 transition-transform duration-500" />
                                  {gift.category && (() => { const c = getCategoryColorTrending(gift.category); return <div className={`absolute top-2 left-2 bg-gradient-to-r ${c.bg} ${c.text} px-2.5 py-0.5 rounded-full text-xs font-bold border ${c.border}`}>{gift.category}</div> })()}
                                  {gift.originalPrice != null && gift.originalPrice > priceVal && <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">SALE</div>}
                                </div>
                                <div className="p-3 flex-grow flex flex-col">
                                  <Tooltip><TooltipTrigger asChild><h3 className="text-sm font-semibold text-[#654321] mb-1 line-clamp-2 min-h-[2.5rem] cursor-pointer">{name}</h3></TooltipTrigger><TooltipContent className="max-w-[280px] bg-[#4A2F1A] text-white text-xs p-2 rounded-lg"><p>{name}</p></TooltipContent></Tooltip>
                                  {gift.source && <p className="text-xs text-[#8B4513]/60 mb-1 flex items-center gap-1"><span className="w-1 h-1 bg-[#DAA520] rounded-full" /> From {gift.source}</p>}
                                  {gift.rating > 0 && (
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <div className="flex items-center gap-0.5">{[1,2,3,4,5].map((i) => { const fill = Math.max(0, Math.min(1, (gift.rating ?? 0) - (i - 1))); const pct = Math.round(fill * 100); const id = `star-cg-${gift.id}-${i}`; return <svg key={i} className="w-3 h-3" viewBox="0 0 24 24" fill="none"><defs><linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%"><stop offset={`${pct}%`} stopColor="#F4C430" /><stop offset={`${pct}%`} stopColor="#E5E7EB" /></linearGradient></defs><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={`url(#${id})`} stroke="#F4C430" strokeWidth="1" /></svg> })})</div>
                                      <span className="text-xs font-bold text-[#654321]">{gift.rating?.toFixed(1)}</span>{gift.reviewCount > 0 && <span className="text-xs text-gray-500">({gift.reviewCount})</span>}
                                    </div>
                                  )}
                                  {(gift.amazonChoice || gift.bestSeller || gift.overallPick) && (
                                    <div className="min-h-[22px] flex flex-wrap gap-1 mb-1">
                                      {gift.amazonChoice && <span className="text-[10px] px-2 py-0.5 bg-gray-900 text-white rounded-full font-medium">Amazon&apos;s Choice</span>}
                                      {gift.bestSeller && <span className="text-[10px] px-2 py-0.5 text-white rounded-full font-medium" style={{ backgroundColor: "#D14900" }}>Best Seller</span>}
                                      {gift.overallPick && <span className="text-[10px] px-2 py-0.5 bg-emerald-600 text-white rounded-full font-medium">Overall Pick</span>}
                                    </div>
                                  )}
                                  <div className="mb-2">{gift.originalPrice != null && gift.originalPrice > priceVal ? (<><span className="font-bold text-sm text-[#654321]">${priceVal.toFixed(2)}</span><span className="text-gray-400 line-through text-xs ml-1">${gift.originalPrice.toFixed(2)}</span></>) : <span className="font-bold text-sm text-[#654321]">${priceVal.toFixed(2)}</span>}</div>
                                  {attrs.length > 0 && (
                                    <div className="bg-[#6B4423]/5 rounded-lg p-2 border border-[#8B5A3C]/10 text-[10px]">
                                      <p className="font-bold text-[#6B4423] uppercase tracking-wider mb-1">Specs</p>
                                      {attrs.slice(0, expandedSpecsTrending[gift.id] ? undefined : 4).map(([key, value]) => <div key={key} className="flex gap-1 truncate"><span className="font-semibold text-[#6B4423] capitalize flex-shrink-0">{key.replace(/([A-Z])/g, " $1").trim()}:</span><span className="text-[#654321] truncate">{String(value)}</span></div>)}
                                      {attrs.length > 4 && <button type="button" onClick={(e) => { e.stopPropagation(); setExpandedSpecsTrending((p) => ({ ...p, [gift.id]: !p[gift.id] })) }} className="text-[8px] font-bold text-[#DAA520] mt-0.5 hover:underline">{expandedSpecsTrending[gift.id] ? "Show less" : `+${attrs.length - 4} more`}</button>}
                                    </div>
                                  )}
                                </div>
                                <div className="px-3 pb-3 pt-1 flex flex-col gap-1.5 border-t border-[#DAA520]/10">
                                  <button type="button" className="w-full px-3 py-1.5 bg-gradient-to-r from-[#DAA520] to-[#F4C430] hover:from-[#F4C430] hover:to-[#DAA520] text-[#8B4513] rounded-lg text-xs font-semibold flex items-center justify-center gap-1" onClick={(e) => { e.stopPropagation(); setPreviewProduct(gift); setShowPreviewProduct(true) }}><Gift className="w-3 h-3" /> Select for gift</button>
                                  <button type="button" className="w-full px-3 py-1.5 bg-gradient-to-r from-[#EA580C] to-[#FB923C] hover:from-[#FB923C] hover:to-[#EA580C] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1" onClick={(e) => { e.stopPropagation(); setSelectedGiftForDifferentOptions(trendingGiftToModalGift(gift)); setShowSelectDifferentOptionsModal(true) }}><ExternalLink className="w-3 h-3" /> Select different Options</button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredAndSortedTrendingGifts.map((gift) => {
                            const name = gift.productName || gift.giftName || "Trending Gift"
                            const priceVal = gift.price ?? gift.targetAmount ?? 0
                            const attrs = getFilteredAttributesTrending(gift)
                            return (
                              <div key={gift.id} className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 p-4 hover:shadow-xl transition-all flex gap-4 items-start">
                                <div className="relative flex-shrink-0"><img src={gift.image || "/placeholder.svg"} alt={name} className="w-24 h-24 object-contain bg-white rounded-lg border-2 border-[#DAA520]" />{gift.originalPrice != null && gift.originalPrice > priceVal && <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">SALE</div>}</div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-base font-bold text-[#654321] line-clamp-2 mb-1">{name}</h3>
                                  {gift.source && <p className="text-xs text-[#8B4513]/70 mb-1">From {gift.source}</p>}
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    {gift.category && (() => { const c = getCategoryColorTrending(gift.category); return <span className={`text-xs px-2 py-0.5 rounded-full font-medium bg-gradient-to-r ${c.bg} ${c.text} border ${c.border}`}>{gift.category}</span> })()}
                                    {gift.rating > 0 && <span className="flex items-center gap-0.5 text-xs"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{gift.rating.toFixed(1)}{gift.reviewCount > 0 ? ` (${gift.reviewCount})` : ""}</span>}
                                    {(gift.amazonChoice || gift.bestSeller || gift.overallPick) && <div className="flex gap-1">{gift.amazonChoice && <span className="text-[10px] px-1.5 py-0.5 bg-gray-900 text-white rounded">Amazon&apos;s Choice</span>}{gift.bestSeller && <span className="text-[10px] px-1.5 py-0.5 text-white rounded" style={{ backgroundColor: "#D14900" }}>Best Seller</span>}{gift.overallPick && <span className="text-[10px] px-1.5 py-0.5 bg-emerald-600 text-white rounded">Overall Pick</span>}</div>}
                                    <span className="font-bold text-[#654321]">${priceVal.toFixed(2)}{gift.originalPrice != null && gift.originalPrice > priceVal && <span className="text-gray-400 line-through text-xs ml-1">${gift.originalPrice.toFixed(2)}</span>}</span>
                                  </div>
                                  {attrs.length > 0 && <div className="text-[10px] text-[#8B5A3C]/80">{attrs.slice(0, expandedSpecsTrending[gift.id] ? undefined : 3).map(([key, value]) => <span key={key} className="mr-2"><span className="font-semibold">{key.replace(/([A-Z])/g, " $1").trim()}:</span> {String(value)}</span>)}{attrs.length > 3 && <button type="button" onClick={() => setExpandedSpecsTrending((p) => ({ ...p, [gift.id]: !p[gift.id] }))} className="text-[#DAA520] font-bold ml-1">{expandedSpecsTrending[gift.id] ? "Less" : `+${attrs.length - 3} more`}</button>}</div>}
                                </div>
                                <div className="flex flex-col gap-1.5 flex-shrink-0">
                                  <button type="button" className="px-3 py-1.5 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#8B4513] rounded-lg text-xs font-semibold flex items-center gap-1" onClick={(e) => { e.stopPropagation(); setPreviewProduct(gift); setShowPreviewProduct(true) }}><Gift className="w-3 h-3" /> Select for gift</button>
                                  <button type="button" className="px-3 py-1.5 bg-gradient-to-r from-[#EA580C] to-[#FB923C] text-white rounded-lg text-xs font-semibold flex items-center gap-1" onClick={(e) => { e.stopPropagation(); setSelectedGiftForDifferentOptions(trendingGiftToModalGift(gift)); setShowSelectDifferentOptionsModal(true) }}><ExternalLink className="w-3 h-3" /> Select different Options</button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Add Your Own - Shows I Wish and Alternative Cards */}
                {productSource === "url" && (
                  <div className="bg-gradient-to-br from-orange-50/80 via-amber-50/60 to-yellow-50/80 rounded-xl shadow-lg border-2 border-[#DAA520]/30 overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <div className="flex flex-col gap-3 sm:gap-4 p-3 sm:p-4">
                      {/* Product Content */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        {/* Choose Your Preferred Options - All product details inside I Wish and Alternative */}
                        <div className="space-y-3 bg-gradient-to-br from-[#FEF7ED] via-[#FFF7ED] to-[#FFFBEB] border-2 border-[#DAA520]/30 rounded-xl p-4 shadow-lg">
                          {/* Header - Matches modal header style */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🎁</span>
                              <h3 className="text-base font-bold text-[#8B4513]">Choose Your Preferred Options</h3>
                            </div>
                          </div>

                          {/* I Wish Option Card - Complete product details inside */}
                          <div className="rounded-lg border-2 border-[#B8860B] bg-gradient-to-r from-[#DAA520]/30 to-[#F4C430]/25 shadow-md p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#F4C430] text-white flex items-center gap-1 shadow-sm">
                                  <Heart className="w-3 h-3 fill-red-500 text-red-500" /> I Wish
                                </span>
                                <span className="text-[10px] text-red-500 font-medium">* Required</span>
                              </div>
                              {/* Edit and Clear I Wish section */}
                              {(extractedProduct || Object.keys(iWishVariants).length > 0 || iWishNotes) && (
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
                                      setExtractedProduct(null)
                                      setIWishImage("")
                                      setIWishVariants({})
                                      setIWishNotes("")
                                      setProductUrl("")
                                      setIsWaitingForMainClip(false)
                                      setIsEditingIWish(false)
                                    }}
                                    className="p-1.5 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                                    title="Clear I Wish section"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            {/* Show URL/Extension input when no product extracted */}
                            {!extractedProduct ? (
                              <div className="space-y-3">
                                {/* Method Toggle - Paste URL or Clip via Extension */}
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setAddMethod("url")}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                      addMethod === "url"
                                        ? "bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white shadow-md"
                                        : "bg-white text-[#654321] border border-[#DAA520]/30 hover:border-[#DAA520]"
                                    }`}
                                  >
                                    <LinkIcon className="w-4 h-4" />
                                    Paste Product URL
                                  </button>
                                  <span className="text-xs font-semibold text-[#8B6914]">OR</span>
                                  <button
                                    type="button"
                                    onClick={() => setAddMethod("extension")}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                      addMethod === "extension"
                                        ? "bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white shadow-md"
                                        : "bg-white text-[#654321] border border-[#DAA520]/30 hover:border-[#DAA520]"
                                    }`}
                                  >
                                    <Scissors className="w-4 h-4" />
                                    Clip via Extension
                                  </button>
                                </div>

                                {/* Paste URL Option */}
                                {addMethod === "url" && (
                                  <div className="bg-white/80 rounded-lg p-3 border border-[#DAA520]/20">
                                    <div className="flex gap-2">
                                      <Input
                                        type="url"
                                        value={productUrl}
                                        onChange={(e) => setProductUrl(e.target.value)}
                                        placeholder="Paste product link to extract product details"
                                        className="w-full px-4 py-3 border-2 border-[#DAA520]/30 rounded-xl focus:border-[#DAA520] focus:ring-2 focus:ring-amber-200 text-xs sm:text-sm md:text-base flex-1 bg-white"
                                      />
                                      <Button
                                        type="button"
                                        onClick={() => extractProductFromUrl(productUrl)}
                                        disabled={isExtractingProduct || !productUrl.trim()}
                                        className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white hover:from-[#DAA520] hover:to-[#B8860B] whitespace-nowrap px-3 py-2 rounded-lg font-semibold text-xs"
                                      >
                                        {isExtractingProduct ? (
                                          <>
                                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                            <span className="hidden sm:inline">Extracting...</span>
                                          </>
                                        ) : (
                                          <>
                                            <Sparkles className="mr-1 h-3 w-3" />
                                            <span>AI Extract</span>
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {/* Clip via Extension Option */}
                                {addMethod === "extension" && (
                                  <div className="bg-white/80 rounded-lg p-4 border border-[#DAA520]/20">
                                    {isWaitingForMainClip ? (
                                      <div className="flex flex-col items-center gap-3">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#DAA520]/20 to-[#F4C430]/20 rounded-full border border-[#DAA520]/40">
                                          <Loader2 className="w-4 h-4 animate-spin text-[#DAA520]" />
                                          <span className="text-sm font-semibold text-[#654321]">Listening for clip...</span>
                                        </div>
                                        <p className="text-xs text-[#8B6914] text-center">
                                          Open a product page and use the Wishbee extension to clip it.
                                        </p>
                                        <button
                                          type="button"
                                          onClick={() => setIsWaitingForMainClip(false)}
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
                                        
                                        {/* Start Listening Button */}
                                        <div className="flex justify-center">
                                          <Button
                                            type="button"
                                            onClick={() => setIsWaitingForMainClip(true)}
                                            className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520] font-semibold px-4 py-1.5 rounded-lg text-xs shadow-sm"
                                          >
                                            Start Listening
                                          </Button>
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
                                {/* Product Image & Details Row - Show when product is extracted */}
                                <div className="flex gap-3 mb-3">
                                  {/* Product Image */}
                                  {iWishImage && (
                                    <img 
                                      src={iWishImage} 
                                      alt={extractedProduct?.productName || 'Selected product'}
                                      className="w-20 h-20 object-contain rounded-lg bg-white border border-[#DAA520]/20 flex-shrink-0"
                                    />
                                  )}
                                  
                                  {/* Product Info */}
                                  <div className="flex-1 min-w-0">
                                    {/* Product Title - Editable */}
                                    {isEditingIWish ? (
                                      <input
                                        type="text"
                                        value={extractedProduct?.productName || ''}
                                        onChange={(e) => setExtractedProduct({ ...extractedProduct, productName: e.target.value })}
                                        placeholder="Product name"
                                        className="w-full text-xs font-bold text-[#4A2F1A] bg-white border border-[#DAA520]/30 rounded px-2 py-1 mb-1"
                                      />
                                    ) : (
                                      <h4 className="text-xs font-bold text-[#4A2F1A] line-clamp-2 leading-tight mb-1">
                                        {extractedProduct?.productName || 'Product'}
                                      </h4>
                                    )}
                                    
                                    {/* Store Name - Editable */}
                                    {isEditingIWish ? (
                                      <input
                                        type="text"
                                        value={extractedProduct?.storeName || ''}
                                        onChange={(e) => setExtractedProduct({ ...extractedProduct, storeName: e.target.value })}
                                        placeholder="Store name"
                                        className="w-full text-[10px] text-[#8B6914] bg-white border border-[#DAA520]/30 rounded px-2 py-0.5 mb-1"
                                      />
                                    ) : extractedProduct?.storeName && (
                                      <p className="text-[10px] text-[#8B6914] font-medium mb-1">{extractedProduct.storeName}</p>
                                    )}
                                    
                                    {/* Rating & Review Count - Editable */}
                                    {isEditingIWish ? (
                                      <div className="flex items-center gap-2 mb-1">
                                        <input
                                          type="number"
                                          step="0.1"
                                          min="0"
                                          max="5"
                                          value={extractedProduct?.rating || ''}
                                          onChange={(e) => setExtractedProduct({ ...extractedProduct, rating: parseFloat(e.target.value) || 0 })}
                                          placeholder="Rating"
                                          className="w-14 text-[10px] bg-white border border-[#DAA520]/30 rounded px-1.5 py-0.5"
                                        />
                                        <span className="text-[9px] text-gray-500">★</span>
                                        <input
                                          type="number"
                                          min="0"
                                          value={extractedProduct?.reviewCount || ''}
                                          onChange={(e) => setExtractedProduct({ ...extractedProduct, reviewCount: parseInt(e.target.value) || 0 })}
                                          placeholder="Reviews"
                                          className="w-16 text-[10px] bg-white border border-[#DAA520]/30 rounded px-1.5 py-0.5"
                                        />
                                        <span className="text-[9px] text-gray-500">reviews</span>
                                      </div>
                                    ) : extractedProduct?.rating && extractedProduct.rating > 0 && (
                                      <div className="flex items-center gap-1 mb-1">
                                        <div className="flex items-center gap-0.5">
                                          {[1, 2, 3, 4, 5].map((starPosition) => {
                                            const rating = extractedProduct.rating || 0
                                            const fillAmount = Math.max(0, Math.min(1, rating - (starPosition - 1)))
                                            const fillPercent = Math.round(fillAmount * 100)
                                            const gradientId = `star-iwish-${starPosition}`
                                            return (
                                              <svg key={starPosition} className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none">
                                                <defs>
                                                  <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset={`${fillPercent}%`} stopColor="#F4C430" />
                                                    <stop offset={`${fillPercent}%`} stopColor="#E5E7EB" />
                                                  </linearGradient>
                                                </defs>
                                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={`url(#${gradientId})`} stroke="#F4C430" strokeWidth="1" />
                                              </svg>
                                            )
                                          })}
                                        </div>
                                        <span className="text-[10px] font-bold text-[#654321]">{extractedProduct.rating.toFixed(1)}</span>
                                        {extractedProduct.reviewCount && extractedProduct.reviewCount > 0 && (
                                          <span className="text-[9px] text-gray-500">({extractedProduct.reviewCount.toLocaleString()})</span>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Badges - Editable */}
                                    {isEditingIWish ? (
                                      <div className="flex flex-wrap gap-2 mb-1">
                                        <label className="flex items-center gap-1 text-[9px]">
                                          <input
                                            type="checkbox"
                                            checked={extractedProduct?.bestSeller || false}
                                            onChange={(e) => setExtractedProduct({ ...extractedProduct, bestSeller: e.target.checked })}
                                            className="w-3 h-3"
                                          />
                                          Best Seller
                                        </label>
                                        <label className="flex items-center gap-1 text-[9px]">
                                          <input
                                            type="checkbox"
                                            checked={extractedProduct?.amazonChoice || false}
                                            onChange={(e) => setExtractedProduct({ ...extractedProduct, amazonChoice: e.target.checked })}
                                            className="w-3 h-3"
                                          />
                                          Amazon's Choice
                                        </label>
                                      </div>
                                    ) : (extractedProduct?.amazonChoice || extractedProduct?.bestSeller || extractedProduct?.overallPick) && (
                                      <div className="flex flex-wrap gap-1 mb-1">
                                        {extractedProduct.amazonChoice && (
                                          <span className="bg-gradient-to-r from-gray-900 to-black text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">Amazon's Choice</span>
                                        )}
                                        {extractedProduct.bestSeller && (
                                          <span className="text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#D14900' }}>#1 Best Seller</span>
                                        )}
                                        {extractedProduct.overallPick && (
                                          <span className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">⭐ Overall Pick</span>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Price - Editable */}
                                    {isEditingIWish ? (
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-500">$</span>
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={extractedProduct?.price || ''}
                                          onChange={(e) => setExtractedProduct({ ...extractedProduct, price: parseFloat(e.target.value) || 0 })}
                                          placeholder="Price"
                                          className="w-24 text-sm font-bold text-[#654321] bg-white border border-[#DAA520]/30 rounded px-2 py-0.5"
                                        />
                                      </div>
                                    ) : (
                                      <div className="flex items-baseline gap-1.5 flex-wrap">
                                        {extractedProduct?.originalPrice && extractedProduct.originalPrice > extractedProduct.price ? (
                                          <>
                                            <span className="text-[10px] text-gray-400 line-through">${extractedProduct.originalPrice.toFixed(2)}</span>
                                            <span className="text-sm font-bold text-[#654321]">${extractedProduct.price.toFixed(2)}</span>
                                            <span className="bg-gradient-to-r from-[#DC2626] to-[#EF4444] text-white font-semibold text-[8px] px-1 py-0.5 rounded-full">
                                              -{Math.round(((extractedProduct.originalPrice - extractedProduct.price) / extractedProduct.originalPrice) * 100)}%
                                            </span>
                                          </>
                                        ) : extractedProduct?.price ? (
                                          <span className="text-sm font-bold text-[#654321]">${extractedProduct.price.toFixed(2)}</span>
                                        ) : null}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Specifications - Compact inside I Wish */}
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
                                          const newKey = `Spec ${Object.keys(editableSpecs).length + 1}`
                                          setEditableSpecs(prev => ({ ...prev, [newKey]: '' }))
                                        }}
                                        className="flex items-center gap-1 text-[9px] font-semibold text-[#DAA520] hover:text-[#B8860B] transition-colors"
                                      >
                                        <span className="text-sm">+</span> Add
                                      </button>
                                    )}
                                  </div>
                                  {Object.keys(editableSpecs).length > 0 ? (
                                    <div className="space-y-1">
                                      {Object.entries(editableSpecs).slice(0, showAllSpecs ? undefined : 4).map(([key, value]) => (
                                        <div key={key} className="flex items-center gap-2">
                                          {isEditingIWish ? (
                                            <input
                                              type="text"
                                              defaultValue={key}
                                              onBlur={(e) => {
                                                const newKey = e.target.value.trim()
                                                if (newKey && newKey !== key) {
                                                  const newSpecs = { ...editableSpecs }
                                                  const oldValue = newSpecs[key]
                                                  delete newSpecs[key]
                                                  newSpecs[newKey] = oldValue
                                                  setEditableSpecs(newSpecs)
                                                }
                                              }}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  e.currentTarget.blur()
                                                }
                                              }}
                                              className="text-[10px] text-[#6B4423] min-w-fit max-w-[140px] font-medium px-1 py-0.5 border border-[#DAA520]/30 rounded bg-white focus:border-[#DAA520] focus:outline-none shrink-0"
                                              title="Click to edit label"
                                            />
                                          ) : (
                                            <span className="text-[10px] text-[#6B4423] font-medium shrink-0">{key}</span>
                                          )}
                                          <span className="text-[10px] text-[#6B4423] shrink-0">:</span>
                                          {isEditingIWish ? (
                                            <input
                                              type="text"
                                              value={String(value)}
                                              onChange={(e) => setEditableSpecs(prev => ({ ...prev, [key]: e.target.value }))}
                                              className="flex-1 text-[10px] px-2 py-1 border border-[#DAA520]/30 rounded bg-white focus:outline-none focus:border-[#DAA520] min-w-0"
                                              placeholder="Enter value..."
                                            />
                                          ) : (
                                            <span className="text-[10px] text-[#654321] font-semibold truncate">{value}</span>
                                          )}
                                          {isEditingIWish && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const newSpecs = { ...editableSpecs }
                                                delete newSpecs[key]
                                                setEditableSpecs(newSpecs)
                                              }}
                                              className="p-0.5 text-red-500 hover:text-red-700 transition-colors"
                                              title="Remove specification"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                      {Object.keys(editableSpecs).length > 4 && (
                                        <button
                                          type="button"
                                          onClick={() => setShowAllSpecs(!showAllSpecs)}
                                          className="text-[8px] font-bold text-[#DAA520] mt-1 hover:text-[#B8860B] hover:underline cursor-pointer transition-colors"
                                        >
                                          {showAllSpecs ? 'Show less' : `+${Object.keys(editableSpecs).length - 4} more specs`}
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-[9px] text-[#8B6914] italic">{isEditingIWish ? 'Click "+ Add" to add specs' : 'No specifications'}</p>
                                  )}
                                </div>
                                
                                {/* Selected Options */}
                                <div className="bg-white/60 rounded-lg p-2 border border-[#DAA520]/20 mb-2">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider flex items-center gap-1">
                                      <span className="w-1 h-1 bg-[#B8860B] rounded-full"></span>
                                      Selected Options
                                    </p>
                                    {isEditingIWish && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newKey = `Option ${Object.keys(iWishVariants).length + 1}`
                                          setIWishVariants(prev => ({ ...prev, [newKey]: '' }))
                                        }}
                                        className="flex items-center gap-1 text-[9px] font-semibold text-[#DAA520] hover:text-[#B8860B] transition-colors"
                                      >
                                        <span className="text-sm">+</span> Add
                                      </button>
                                    )}
                                  </div>
                                  {Object.keys(iWishVariants).length > 0 ? (
                                    <div className="space-y-1">
                                      {Object.entries(iWishVariants).map(([key, value]) => (
                                        <div key={key} className="flex items-center gap-2">
                                          {isEditingIWish ? (
                                            <input
                                              type="text"
                                              defaultValue={key}
                                              onBlur={(e) => {
                                                const newKey = e.target.value.trim()
                                                if (newKey && newKey !== key) {
                                                  const newVariants = { ...iWishVariants }
                                                  const oldValue = newVariants[key]
                                                  delete newVariants[key]
                                                  newVariants[newKey] = oldValue
                                                  setIWishVariants(newVariants)
                                                }
                                              }}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  e.currentTarget.blur()
                                                }
                                              }}
                                              className="text-[10px] text-[#6B4423] min-w-fit max-w-[140px] font-medium px-1 py-0.5 border border-[#DAA520]/30 rounded bg-white focus:border-[#DAA520] focus:outline-none shrink-0"
                                              title="Click to edit label"
                                            />
                                          ) : (
                                            <span className="text-[10px] text-[#6B4423] font-medium shrink-0">{key}</span>
                                          )}
                                          <span className="text-[10px] text-[#6B4423] shrink-0">:</span>
                                          {isEditingIWish ? (
                                            <input
                                              type="text"
                                              value={value}
                                              onChange={(e) => setIWishVariants(prev => ({ ...prev, [key]: e.target.value }))}
                                              className="flex-1 text-[10px] px-2 py-1 border border-[#DAA520]/30 rounded bg-white focus:outline-none focus:border-[#DAA520] min-w-0"
                                              placeholder="Enter value..."
                                            />
                                          ) : (
                                            <span className="text-[10px] text-[#654321] font-semibold truncate">{value}</span>
                                          )}
                                          {isEditingIWish && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const newVariants = { ...iWishVariants }
                                                delete newVariants[key]
                                                setIWishVariants(newVariants)
                                              }}
                                              className="p-0.5 text-red-500 hover:text-red-700 transition-colors"
                                              title="Remove option"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-[9px] text-[#8B6914] italic">{isEditingIWish ? 'Click "+ Add" to add options' : 'No variant options'}</p>
                                  )}
                                </div>

                                {/* Notes Section for I Wish */}
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-[10px] text-[#6B4423] font-medium">Notes</label>
                                    {iWishNotes && (
                                      <button
                                        type="button"
                                        onClick={() => setIWishNotes("")}
                                        className="p-0.5 text-red-500 hover:text-red-700 transition-colors"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                  <textarea
                                    value={iWishNotes}
                                    onChange={(e) => setIWishNotes(e.target.value)}
                                    placeholder="Add any special notes or instructions..."
                                    className="w-full px-2 py-1.5 text-[10px] border border-[#DAA520]/30 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#DAA520] text-[#4A2F1A] resize-none"
                                    rows={2}
                                  />
                                </div>
                              </>
                            )}
                          </div>

                          {/* Alternative Option Card - Complete product details inside */}
                          <div className="rounded-lg border-2 border-[#D97706] bg-gradient-to-r from-[#D97706]/15 to-[#F59E0B]/15 p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-white shadow-sm">
                                  ✓ Alternative
                                </span>
                                <span className="text-[10px] text-gray-500 font-medium">Optional</span>
                              </div>
                              {/* Edit and Clear Alternative section */}
                              {(altImage || Object.keys(altVariants).length > 0 || altNotes || Object.keys(altEditableSpecs).length > 0) && (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setIsEditingAlt(!isEditingAlt)}
                                    className={`p-1.5 rounded-full transition-colors ${isEditingAlt ? 'bg-[#D97706] text-white' : 'bg-[#D97706]/20 hover:bg-[#D97706]/40 text-[#654321]'}`}
                                    title={isEditingAlt ? "Done editing" : "Edit Alternative details"}
                                  >
                                    {isEditingAlt ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAltImage("")
                                      setAltVariants({})
                                      setAltEditableSpecs({})
                                      setAltNotes("")
                                      setAltPrice(null)
                                      setIsWaitingForAltClip(false)
                                      setAltProductUrl("")
                                      setIsEditingAlt(false)
                                    }}
                                    className="p-1.5 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                                    title="Clear Alternative section"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            {/* Helper text */}
                            <p className="text-[9px] text-[#92400E] mb-2 italic">
                              Choose a backup option priced equal to or lower than your "I Wish" selection.
                            </p>
                            
                            {/* Show Alternative content only when alternative has been clipped */}
                            {(altImage || Object.keys(altVariants).length > 0) ? (
                              <>
                                {/* Product Image & Details Row - Only show when alt data exists */}
                                <div className="flex gap-3 mb-3">
                                  {/* Product Image */}
                                  {altImage && (
                                    <img 
                                      src={altImage} 
                                      alt="Alternative product"
                                      className="w-20 h-20 object-contain rounded-lg bg-white border border-[#D97706]/20 flex-shrink-0"
                                    />
                                  )}
                                  
                                  {/* Product Info - Alternative with editable fields */}
                                  <div className="flex-1 min-w-0">
                                    {/* Product Title - Editable */}
                                    {isEditingAlt ? (
                                      <input
                                        type="text"
                                        value={altProductName || extractedProduct?.productName || ''}
                                        onChange={(e) => setAltProductName(e.target.value)}
                                        placeholder="Product name"
                                        className="w-full text-xs font-bold text-[#4A2F1A] bg-white border border-[#D97706]/30 rounded px-2 py-1 mb-1"
                                      />
                                    ) : (
                                      <h4 className="text-xs font-bold text-[#4A2F1A] line-clamp-2 leading-tight mb-1">
                                        {altProductName || extractedProduct?.productName || 'Alternative Product'}
                                      </h4>
                                    )}
                                    
                                    {/* Store Name - Editable */}
                                    {isEditingAlt ? (
                                      <input
                                        type="text"
                                        value={altStoreName || extractedProduct?.storeName || ''}
                                        onChange={(e) => setAltStoreName(e.target.value)}
                                        placeholder="Store name"
                                        className="w-full text-[10px] text-[#92400E] bg-white border border-[#D97706]/30 rounded px-2 py-0.5 mb-1"
                                      />
                                    ) : (altStoreName || extractedProduct?.storeName) && (
                                      <p className="text-[10px] text-[#92400E] font-medium mb-1">{altStoreName || extractedProduct?.storeName}</p>
                                    )}
                                    
                                    {/* Rating & Review Count - Editable */}
                                    {isEditingAlt ? (
                                      <div className="flex items-center gap-2 mb-1">
                                        <input
                                          type="number"
                                          step="0.1"
                                          min="0"
                                          max="5"
                                          value={altRating ?? extractedProduct?.rating ?? ''}
                                          onChange={(e) => setAltRating(parseFloat(e.target.value) || null)}
                                          placeholder="Rating"
                                          className="w-14 text-[10px] bg-white border border-[#D97706]/30 rounded px-1.5 py-0.5"
                                        />
                                        <span className="text-[9px] text-gray-500">★</span>
                                        <input
                                          type="number"
                                          min="0"
                                          value={altReviewCount ?? extractedProduct?.reviewCount ?? ''}
                                          onChange={(e) => setAltReviewCount(parseInt(e.target.value) || null)}
                                          placeholder="Reviews"
                                          className="w-16 text-[10px] bg-white border border-[#D97706]/30 rounded px-1.5 py-0.5"
                                        />
                                        <span className="text-[9px] text-gray-500">reviews</span>
                                      </div>
                                    ) : (altRating ?? extractedProduct?.rating) && (altRating ?? extractedProduct?.rating) > 0 && (
                                      <div className="flex items-center gap-1 mb-1">
                                        <div className="flex items-center gap-0.5">
                                          {[1, 2, 3, 4, 5].map((starPosition) => {
                                            const rating = altRating ?? extractedProduct?.rating ?? 0
                                            const fillAmount = Math.max(0, Math.min(1, rating - (starPosition - 1)))
                                            const fillPercent = Math.round(fillAmount * 100)
                                            const gradientId = `star-alt-${starPosition}`
                                            return (
                                              <svg key={starPosition} className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none">
                                                <defs>
                                                  <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset={`${fillPercent}%`} stopColor="#F4C430" />
                                                    <stop offset={`${fillPercent}%`} stopColor="#E5E7EB" />
                                                  </linearGradient>
                                                </defs>
                                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={`url(#${gradientId})`} stroke="#F4C430" strokeWidth="1" />
                                              </svg>
                                            )
                                          })}
                                        </div>
                                        <span className="text-[10px] font-bold text-[#654321]">{(altRating ?? extractedProduct?.rating ?? 0).toFixed(1)}</span>
                                        {(altReviewCount ?? extractedProduct?.reviewCount) && (altReviewCount ?? extractedProduct?.reviewCount) > 0 && (
                                          <span className="text-[9px] text-gray-500">({(altReviewCount ?? extractedProduct?.reviewCount ?? 0).toLocaleString()})</span>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Badges - Editable */}
                                    {isEditingAlt ? (
                                      <div className="flex flex-wrap gap-2 mb-1">
                                        <label className="flex items-center gap-1 text-[9px]">
                                          <input
                                            type="checkbox"
                                            checked={altBestSeller}
                                            onChange={(e) => setAltBestSeller(e.target.checked)}
                                            className="w-3 h-3"
                                          />
                                          Best Seller
                                        </label>
                                        <label className="flex items-center gap-1 text-[9px]">
                                          <input
                                            type="checkbox"
                                            checked={altAmazonChoice}
                                            onChange={(e) => setAltAmazonChoice(e.target.checked)}
                                            className="w-3 h-3"
                                          />
                                          Amazon's Choice
                                        </label>
                                      </div>
                                    ) : (altAmazonChoice || altBestSeller || extractedProduct?.amazonChoice || extractedProduct?.bestSeller || extractedProduct?.overallPick) && (
                                      <div className="flex flex-wrap gap-1 mb-1">
                                        {(altAmazonChoice || extractedProduct?.amazonChoice) && (
                                          <span className="bg-gradient-to-r from-gray-900 to-black text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">Amazon's Choice</span>
                                        )}
                                        {(altBestSeller || extractedProduct?.bestSeller) && (
                                          <span className="text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#D14900' }}>#1 Best Seller</span>
                                        )}
                                        {extractedProduct?.overallPick && (
                                          <span className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">⭐ Overall Pick</span>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Price - Editable */}
                                    {isEditingAlt ? (
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-500">$</span>
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={altPrice ?? extractedProduct?.price ?? ''}
                                          onChange={(e) => setAltPrice(parseFloat(e.target.value) || null)}
                                          placeholder="Price"
                                          className="w-24 text-sm font-bold text-[#654321] bg-white border border-[#D97706]/30 rounded px-2 py-0.5"
                                        />
                                      </div>
                                    ) : (
                                      <div className="flex items-baseline gap-1.5 flex-wrap">
                                        {(altPrice ?? extractedProduct?.price) ? (
                                          <span className="text-sm font-bold text-[#654321]">${(altPrice ?? extractedProduct?.price ?? 0).toFixed(2)}</span>
                                        ) : null}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Specifications - Compact inside Alternative */}
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
                                          const newKey = `Spec ${Object.keys(altEditableSpecs).length + 1}`
                                          setAltEditableSpecs(prev => ({ ...prev, [newKey]: '' }))
                                        }}
                                        className="flex items-center gap-1 text-[9px] font-semibold text-[#D97706] hover:text-[#92400E] transition-colors"
                                      >
                                        <span className="text-sm">+</span> Add
                                      </button>
                                    )}
                                  </div>
                                  {Object.keys(altEditableSpecs).length > 0 ? (
                                    <div className="space-y-1">
                                      {Object.entries(altEditableSpecs).slice(0, showAllAltSpecs ? undefined : 4).map(([key, value]) => (
                                        <div key={key} className="flex items-center gap-2">
                                          {isEditingAlt ? (
                                            <input
                                              type="text"
                                              defaultValue={key}
                                              onBlur={(e) => {
                                                const newKey = e.target.value.trim()
                                                if (newKey && newKey !== key) {
                                                  const newSpecs = { ...altEditableSpecs }
                                                  const oldValue = newSpecs[key]
                                                  delete newSpecs[key]
                                                  newSpecs[newKey] = oldValue
                                                  setAltEditableSpecs(newSpecs)
                                                }
                                              }}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  e.currentTarget.blur()
                                                }
                                              }}
                                              className="text-[10px] text-[#6B4423] min-w-fit max-w-[140px] font-medium px-1 py-0.5 border border-[#D97706]/30 rounded bg-white focus:border-[#D97706] focus:outline-none shrink-0"
                                              title="Click to edit label"
                                            />
                                          ) : (
                                            <span className="text-[10px] text-[#6B4423] font-medium shrink-0">{key}</span>
                                          )}
                                          <span className="text-[10px] text-[#6B4423] shrink-0">:</span>
                                          {isEditingAlt ? (
                                            <input
                                              type="text"
                                              value={String(value)}
                                              onChange={(e) => setAltEditableSpecs(prev => ({ ...prev, [key]: e.target.value }))}
                                              className="flex-1 text-[10px] px-2 py-1 border border-[#D97706]/30 rounded bg-white focus:outline-none focus:border-[#D97706] min-w-0"
                                              placeholder="Enter value..."
                                            />
                                          ) : (
                                            <span className="text-[10px] text-[#654321] font-semibold truncate">{value}</span>
                                          )}
                                          {isEditingAlt && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const newSpecs = { ...altEditableSpecs }
                                                delete newSpecs[key]
                                                setAltEditableSpecs(newSpecs)
                                              }}
                                              className="p-0.5 text-red-500 hover:text-red-700 transition-colors"
                                              title="Remove specification"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                      {Object.keys(altEditableSpecs).length > 4 && (
                                        <button
                                          type="button"
                                          onClick={() => setShowAllAltSpecs(!showAllAltSpecs)}
                                          className="text-[8px] font-bold text-[#D97706] mt-1 hover:text-[#92400E] hover:underline cursor-pointer transition-colors"
                                        >
                                          {showAllAltSpecs ? 'Show less' : `+${Object.keys(altEditableSpecs).length - 4} more specs`}
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-[9px] text-[#92400E] italic">{isEditingAlt ? 'Click "+ Add" to add specs' : 'No specifications'}</p>
                                  )}
                                </div>
                                
                                {/* Selected Options - Only show when alt variants exist */}
                                <div className="bg-white/60 rounded-lg p-2 border border-[#D97706]/20 mb-2">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider flex items-center gap-1">
                                      <span className="w-1 h-1 bg-[#D97706] rounded-full"></span>
                                      Selected Options
                                    </p>
                                    {isEditingAlt && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newKey = `Option ${Object.keys(altVariants).length + 1}`
                                          setAltVariants(prev => ({ ...prev, [newKey]: '' }))
                                        }}
                                        className="flex items-center gap-1 text-[9px] font-semibold text-[#D97706] hover:text-[#92400E] transition-colors"
                                      >
                                        <span className="text-sm">+</span> Add
                                      </button>
                                    )}
                                  </div>
                                  {Object.keys(altVariants).length > 0 ? (
                                    <div className="space-y-1">
                                      {Object.entries(altVariants).map(([key, value]) => {
                                        return (
                                          <div key={key} className="flex items-center gap-2">
                                            {isEditingAlt ? (
                                              <input
                                                type="text"
                                                defaultValue={key}
                                                onBlur={(e) => {
                                                  const newKey = e.target.value.trim()
                                                  if (newKey && newKey !== key) {
                                                    const newVariants = { ...altVariants }
                                                    const oldValue = newVariants[key]
                                                    delete newVariants[key]
                                                    newVariants[newKey] = oldValue
                                                    setAltVariants(newVariants)
                                                  }
                                                }}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                    e.currentTarget.blur()
                                                  }
                                                }}
                                                className="text-[10px] text-[#6B4423] min-w-fit max-w-[140px] font-medium px-1 py-0.5 border border-[#D97706]/30 rounded bg-white focus:border-[#D97706] focus:outline-none shrink-0"
                                                title="Click to edit label"
                                              />
                                            ) : (
                                              <span className="text-[10px] text-[#6B4423] font-medium shrink-0">{key}</span>
                                            )}
                                            <span className="text-[10px] text-[#6B4423] shrink-0">:</span>
                                            {isEditingAlt ? (
                                              <input
                                                type="text"
                                                value={value}
                                                onChange={(e) => setAltVariants(prev => ({ ...prev, [key]: e.target.value }))}
                                                className="flex-1 text-[10px] px-2 py-1 border border-[#D97706]/30 rounded bg-white focus:outline-none focus:border-[#D97706] min-w-0"
                                                placeholder="Enter value..."
                                              />
                                            ) : (
                                              <span className="text-[10px] text-[#654321] font-semibold truncate">{value}</span>
                                            )}
                                            {isEditingAlt && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const newAttrs = { ...altVariants }
                                                  delete newAttrs[key]
                                                  setAltVariants(newAttrs)
                                                }}
                                                className="p-0.5 text-red-500 hover:text-red-700 transition-colors"
                                                title="Remove option"
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-[9px] text-[#92400E] italic">{isEditingAlt ? 'Click "+ Add" to add options' : 'No variant options'}</p>
                                  )}
                                </div>

                                {/* Notes Section for Alternative */}
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-[10px] text-[#6B4423] font-medium">Notes</label>
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
                            ) : (
                              /* No alternative clipped yet - show URL/Extension options */
                              <div className="space-y-3">
                                {/* Method Toggle - Paste URL or Clip via Extension */}
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setAltAddMethod("url")}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                      altAddMethod === "url"
                                        ? "bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-white shadow-md"
                                        : "bg-white text-[#78350F] border border-[#D97706]/30 hover:border-[#D97706]"
                                    }`}
                                  >
                                    <LinkIcon className="w-4 h-4" />
                                    Paste Product URL
                                  </button>
                                  <span className="text-xs font-semibold text-[#92400E]">OR</span>
                                  <button
                                    type="button"
                                    onClick={() => setAltAddMethod("extension")}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                      altAddMethod === "extension"
                                        ? "bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-white shadow-md"
                                        : "bg-white text-[#78350F] border border-[#F59E0B]/30 hover:border-[#F59E0B]"
                                    }`}
                                  >
                                    <Scissors className="w-4 h-4" />
                                    Clip via Extension
                                  </button>
                                </div>

                                {/* Paste URL Option for Alternative */}
                                {altAddMethod === "url" && (
                                  <div className="bg-white/80 rounded-lg p-3 border border-[#D97706]/20">
                                    <div className="flex gap-2">
                                      <Input
                                        type="url"
                                        value={altProductUrl}
                                        onChange={(e) => setAltProductUrl(e.target.value)}
                                        onPaste={async (e) => {
                                          const pastedText = e.clipboardData.getData('text').trim()
                                          if (pastedText && (pastedText.startsWith('http://') || pastedText.startsWith('https://'))) {
                                            e.preventDefault()
                                            setAltProductUrl(pastedText)
                                            
                                            // Auto-extract on paste
                                            setIsExtractingAltProduct(true)
                                            try {
                                              const response = await fetch("/api/ai/extract-product", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ url: pastedText }),
                                              })
                                              
                                              if (!response.ok) {
                                                toast({ title: "Extraction Error", description: "Failed to extract alternative product details.", variant: "destructive" })
                                                return
                                              }
                                              
                                              const data = await response.json()
                                              
                                              // Check if alternative price is higher than I Wish price BEFORE setting any data
                                              if (data.price && extractedProduct?.price && data.price > extractedProduct.price) {
                                                setPriceWarningData({ altPrice: data.price, iWishPrice: extractedProduct.price })
                                                setShowPriceWarning(true)
                                                setAltProductUrl("")
                                                setIsExtractingAltProduct(false)
                                                return
                                              }
                                              
                                              // Set alternative image
                                              if (data.imageUrl) setAltImage(data.imageUrl)
                                              
                                              // Extract alternative variants and specs from attributes
                                              const altVars: Record<string, string> = {}
                                              const altSpecs: Record<string, string> = {}
                                              const variantKeys = ['color', 'style', 'configuration', 'pattern', 'edition', 'size', 'connectivity']
                                              // Include Color, Material, Brand, Item Weight, Capacity for Alternative specs
                                              const specificationKeys = [
                                                'brand', 'color', 'material', 'capacity', 'itemweight',
                                                'operatingsystem', 'os', 'memorystoragecapacity', 'storagecapacity',
                                                'specialfeature', 'connectivitytechnology', 'wirelesscommunicationstandard',
                                                'batterycellcomposition', 'batterylife', 'batterycapacity', 'gps',
                                                'shape', 'screensize', 'displaysize', 'displayresolution', 'resolution',
                                                'processor', 'chip', 'ram', 'memory', 'graphics', 'graphicscoprocessor',
                                                'harddisksize', 'formfactor', 'impedance', 'noisecontrol',
                                                'camera', 'frontcamera', 'backcamera', 'wifi', 'bluetooth', 'ports',
                                                'waterdepthrating', 'waterresistant', 'compatible', 'sensor', 'display'
                                              ]
                                              const excludeFromSpecs = [
                                                'caratweight', 'carat', 'productdimensions', 'dimensions',
                                                'model', 'modelname', 'modelnumber', 'asin', 'upc', 'ean', 'isbn',
                                                'packagedimensions', 'shippingweight', 'itemmodelnumber'
                                              ]
                                              const invalidColors = ['base', 'default', 'standard', 'normal', 'regular', 'basic', 'none', 'n/a']
                                              
                                              if (data.attributes) {
                                                Object.entries(data.attributes).forEach(([key, value]) => {
                                                  if (value && typeof value === 'string' && value.trim()) {
                                                    const keyLower = key.toLowerCase().replace(/[\s_-]/g, '')
                                                    
                                                    // Skip if in exclusion list
                                                    if (excludeFromSpecs.some(ek => keyLower === ek || keyLower.includes(ek))) {
                                                      return
                                                    }
                                                    
                                                    // CHECK VARIANTS FIRST (before specs)
                                                    const isVariantKey = variantKeys.some(vk => {
                                                      if (vk === 'size') return keyLower === 'size'
                                                      if (vk === 'connectivity') return keyLower.includes('connectivity')
                                                      return keyLower === vk
                                                    })
                                                    
                                                    if (isVariantKey) {
                                                      if (keyLower.includes('color') && invalidColors.includes(value.trim().toLowerCase())) {
                                                        return
                                                      }
                                                      let formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()
                                                      if (keyLower.includes('connectivity') && (value.toLowerCase().includes('gps') || value.toLowerCase().includes('cellular'))) {
                                                        altVars['Style'] = value.trim()
                                                        altSpecs[formattedKey] = value.trim()
                                                        return
                                                      }
                                                      altVars[formattedKey] = value.trim()
                                                      // Also show Color, Material, Capacity in Alternative specifications
                                                      if (formattedKey === 'Color' || formattedKey === 'Material' || formattedKey === 'Capacity') {
                                                        altSpecs[formattedKey] = value.trim()
                                                      }
                                                      return
                                                    }
                                                    
                                                    // Check if it's a specification (whitelist)
                                                    if (specificationKeys.some(sk => keyLower === sk || keyLower.includes(sk))) {
                                                      const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()
                                                      altSpecs[formattedKey] = value.trim()
                                                    }
                                                  }
                                                })
                                              }
                                              
                                              // Also check top-level variant fields
                                              variantKeys.forEach(vk => {
                                                const val = data[vk]
                                                if (val && typeof val === 'string' && val.trim()) {
                                                  if (vk === 'color' && invalidColors.includes(val.trim().toLowerCase())) {
                                                    return
                                                  }
                                                  const normalizedKey = vk.charAt(0).toUpperCase() + vk.slice(1)
                                                  if (vk === 'color' && altVars['Color']) {
                                                    if (val.trim().length > altVars['Color'].length) {
                                                      altVars[normalizedKey] = val.trim()
                                                      altSpecs['Color'] = val.trim()
                                                    }
                                                  } else {
                                                    altVars[normalizedKey] = val.trim()
                                                    if (normalizedKey === 'Color' || normalizedKey === 'Material' || normalizedKey === 'Capacity') {
                                                      altSpecs[normalizedKey] = val.trim()
                                                    }
                                                  }
                                                }
                                              })
                                              
                                              // Add brand if available at top level
                                              if (data.brand && !altSpecs['Brand']) {
                                                altSpecs['Brand'] = data.brand
                                              }
                                              
                                              setAltVariants(altVars)
                                              setAltEditableSpecs(altSpecs)
                                              
                                              // Capture alternative price for validation
                                              if (data.price) {
                                                setAltPrice(data.price)
                                              }
                                              
                                              toast({
                                                title: "✓ Alternative Extracted!",
                                                description: "Alternative product options have been captured.",
                                                variant: "warm",
                                              })
                                            } catch (error) {
                                              console.error('[Alt Extract] Auto-extract error:', error)
                                              toast({ title: "Error", description: "Failed to extract alternative details.", variant: "destructive" })
                                            } finally {
                                              setIsExtractingAltProduct(false)
                                            }
                                          }
                                        }}
                                        placeholder="Paste product link to extract product details"
                                        className="w-full px-4 py-3 border-2 border-[#D97706]/30 rounded-xl focus:border-[#D97706] focus:ring-2 focus:ring-amber-200 text-xs sm:text-sm md:text-base flex-1 bg-white"
                                      />
                                      <Button
                                        type="button"
                                        onClick={async () => {
                                          if (!altProductUrl || !altProductUrl.startsWith("http")) return
                                          
                                          setIsExtractingAltProduct(true)
                                          try {
                                            const response = await fetch("/api/ai/extract-product", {
                                              method: "POST",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({ url: altProductUrl }),
                                            })
                                            
                                            if (!response.ok) {
                                              toast({ title: "Extraction Error", description: "Failed to extract alternative product details.", variant: "destructive" })
                                              return
                                            }
                                            
                                            const data = await response.json()
                                            
                                            // Check if alternative price is higher than I Wish price BEFORE setting any data
                                            if (data.price && extractedProduct?.price && data.price > extractedProduct.price) {
                                              setPriceWarningData({ altPrice: data.price, iWishPrice: extractedProduct.price })
                                              setShowPriceWarning(true)
                                              setAltProductUrl("")
                                              setIsExtractingAltProduct(false)
                                              return
                                            }
                                            
                                            // Set alternative image
                                            if (data.imageUrl) setAltImage(data.imageUrl)
                                            
                                            // Extract alternative variants and specs from attributes
                                            const altVars: Record<string, string> = {}
                                            const altSpecs: Record<string, string> = {}
                                            const variantKeys = ['color', 'style', 'configuration', 'pattern', 'edition', 'size', 'connectivity']
                                            // Include Color, Material, Brand, Item Weight, Capacity for Alternative specs
                                            const specificationKeys = [
                                              'brand', 'color', 'material', 'capacity', 'itemweight',
                                              'operatingsystem', 'os', 'memorystoragecapacity', 'storagecapacity',
                                              'specialfeature', 'connectivitytechnology', 'wirelesscommunicationstandard',
                                              'batterycellcomposition', 'batterylife', 'batterycapacity', 'gps',
                                              'shape', 'screensize', 'displaysize', 'displayresolution', 'resolution',
                                              'processor', 'chip', 'ram', 'memory', 'graphics', 'graphicscoprocessor',
                                              'harddisksize', 'formfactor', 'impedance', 'noisecontrol',
                                              'camera', 'frontcamera', 'backcamera', 'wifi', 'bluetooth', 'ports',
                                              'waterdepthrating', 'waterresistant', 'compatible', 'sensor', 'display'
                                            ]
                                            const excludeFromSpecs = [
                                              'caratweight', 'carat', 'productdimensions', 'dimensions',
                                              'model', 'modelname', 'modelnumber', 'asin', 'upc', 'ean', 'isbn',
                                              'packagedimensions', 'shippingweight', 'itemmodelnumber'
                                            ]
                                            const invalidColors = ['base', 'default', 'standard', 'normal', 'regular', 'basic', 'none', 'n/a']
                                            
                                            if (data.attributes) {
                                              Object.entries(data.attributes).forEach(([key, value]) => {
                                                if (value && typeof value === 'string' && value.trim()) {
                                                  const keyLower = key.toLowerCase().replace(/[\s_-]/g, '')
                                                  
                                                  if (excludeFromSpecs.some(ek => keyLower === ek || keyLower.includes(ek))) {
                                                    return
                                                  }
                                                  
                                                  const isVariantKey = variantKeys.some(vk => {
                                                    if (vk === 'size') return keyLower === 'size'
                                                    if (vk === 'connectivity') return keyLower.includes('connectivity')
                                                    return keyLower === vk
                                                  })
                                                  
                                                  if (isVariantKey) {
                                                    if (keyLower.includes('color') && invalidColors.includes(value.trim().toLowerCase())) {
                                                      return
                                                    }
                                                    let formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()
                                                    if (keyLower.includes('connectivity') && (value.toLowerCase().includes('gps') || value.toLowerCase().includes('cellular'))) {
                                                      altVars['Style'] = value.trim()
                                                      altSpecs[formattedKey] = value.trim()
                                                      return
                                                    }
                                                    altVars[formattedKey] = value.trim()
                                                    // Also show Color, Material, Capacity in Alternative specifications
                                                    if (formattedKey === 'Color' || formattedKey === 'Material' || formattedKey === 'Capacity') {
                                                      altSpecs[formattedKey] = value.trim()
                                                    }
                                                    return
                                                  }
                                                  
                                                  if (specificationKeys.some(sk => keyLower === sk || keyLower.includes(sk))) {
                                                    const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()
                                                    altSpecs[formattedKey] = value.trim()
                                                  }
                                                }
                                              })
                                            }
                                            
                                            variantKeys.forEach(vk => {
                                              const val = data[vk]
                                              if (val && typeof val === 'string' && val.trim()) {
                                                if (vk === 'color' && invalidColors.includes(val.trim().toLowerCase())) {
                                                  return
                                                }
                                                const normalizedKey = vk.charAt(0).toUpperCase() + vk.slice(1)
                                                if (vk === 'color' && altVars['Color']) {
                                                  if (val.trim().length > altVars['Color'].length) {
                                                    altVars[normalizedKey] = val.trim()
                                                    altSpecs['Color'] = val.trim()
                                                  }
                                                } else {
                                                  altVars[normalizedKey] = val.trim()
                                                  if (normalizedKey === 'Color' || normalizedKey === 'Material' || normalizedKey === 'Capacity') {
                                                    altSpecs[normalizedKey] = val.trim()
                                                  }
                                                }
                                              }
                                            })
                                            
                                            if (data.brand && !altSpecs['Brand']) {
                                              altSpecs['Brand'] = data.brand
                                            }
                                            
                                            setAltVariants(altVars)
                                            setAltEditableSpecs(altSpecs)
                                            
                                            if (data.price) {
                                              setAltPrice(data.price)
                                            }
                                            
                                            toast({
                                              title: "✓ Alternative Extracted!",
                                              description: "Alternative product options have been captured.",
                                              variant: "warm",
                                            })
                                          } catch (error) {
                                            console.error('[Alt Extract] Error:', error)
                                            toast({ title: "Error", description: "Failed to extract alternative details.", variant: "destructive" })
                                          } finally {
                                            setIsExtractingAltProduct(false)
                                          }
                                        }}
                                        disabled={isExtractingAltProduct || !altProductUrl.trim()}
                                        className="bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-white hover:from-[#F59E0B] hover:to-[#D97706] whitespace-nowrap px-3 py-2 rounded-lg font-semibold text-xs"
                                      >
                                        {isExtractingAltProduct ? (
                                          <>
                                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                            <span>Extracting...</span>
                                          </>
                                        ) : (
                                          <>
                                            <Sparkles className="mr-1 h-3 w-3" />
                                            <span>AI Extract</span>
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {/* Clip via Extension Option for Alternative */}
                                {altAddMethod === "extension" && (
                                  <div className="bg-white/80 rounded-lg p-3 border border-[#F59E0B]/20 text-center">
                                    {isWaitingForAltClip ? (
                                      <div className="flex flex-col items-center gap-3">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#F59E0B]/20 to-[#FBBF24]/20 rounded-full border border-[#F59E0B]/40">
                                          <Loader2 className="w-4 h-4 animate-spin text-[#F59E0B]" />
                                          <span className="text-sm font-semibold text-[#78350F]">Listening for clip...</span>
                                        </div>
                                        <p className="text-xs text-[#92400E] text-center">
                                          Open a product page and clip your alternative choice.
                                        </p>
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
                                        <p className="text-xs text-[#78350F] text-center">
                                          Click <span className="font-semibold text-[#F59E0B]">Start Listening</span>, then browse any product page and clip your alternative choice.
                                        </p>
                                        
                                        {/* Start Listening Button */}
                                        <div className="flex justify-center">
                                          <Button
                                            type="button"
                                            onClick={() => setIsWaitingForAltClip(true)}
                                            className="bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#78350F] hover:from-[#FBBF24] hover:to-[#F59E0B] font-semibold px-4 py-1.5 rounded-lg text-xs shadow-sm"
                                          >
                                            Start Listening
                                          </Button>
                                        </div>
                                        
                                        <p className="text-[10px] text-[#92400E]/70 text-center">
                                          Don't have the extension? <a href="https://wishbee.ai/extension" target="_blank" rel="noopener noreferrer" className="text-[#F59E0B] font-semibold hover:underline">Get it free →</a>
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
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
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Step 3: Funding */}
          {currentStep === 3 && (
            <div className="p-6 sm:p-8">
              <div className="max-w-lg mx-auto space-y-6">
                {/* Gift Name */}
                <div className="space-y-2">
                  <Label className="text-[#654321] font-semibold flex items-center gap-2">
                    <Gift className="w-4 h-4 text-[#DAA520]" />
                    Gift Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={giftName}
                    onChange={(e) => setGiftName(e.target.value)}
                    placeholder="e.g., Apple Watch Series 10"
                    className="border-2 border-[#DAA520]/30 focus:border-[#DAA520] h-12 text-base"
                  />
                  <p className="text-xs text-[#8B4513]/60">Give your gift a clear, descriptive name</p>
                </div>

                {/* Target Amount */}
                <div className="space-y-3">
                  <Label className="text-[#654321] font-semibold flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#DAA520]" />
                    Target Amount (USD) <span className="text-red-500">*</span>
                  </Label>
                  
                  {/* Suggested Target Card - Based on I Wish selection */}
                  {suggestedTarget && (
                    <div className="bg-gradient-to-r from-[#FEF3C7] via-[#FDE68A] to-[#FCD34D] rounded-xl p-4 border-2 border-[#DAA520] shadow-md">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-bold text-[#654321]">Group Gift Target</span>
                        </div>
                        <span className="text-sm font-bold text-[#654321]">${suggestedTarget.total.toFixed(2)}</span>
                      </div>
                      
                      <div className="space-y-1 text-xs text-[#8B4513] border-t border-[#DAA520]/30 pt-2">
                        <div className="flex justify-between">
                          <span>Product price:</span>
                          <span className="font-medium">${suggestedTarget.basePrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Estimated tax (8%):</span>
                          <span className="font-medium">${suggestedTarget.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Estimated shipping:</span>
                          <span className="font-medium">${suggestedTarget.shipping.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <p className="text-[10px] text-[#92400E] mt-2 italic">
                        Includes estimated tax and shipping • Based on your "I Wish" selection
                      </p>
                      
                      <button
                        type="button"
                        onClick={() => setTargetAmount(suggestedTarget.total.toFixed(2))}
                        className="mt-3 w-full py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] font-semibold rounded-lg hover:from-[#F4C430] hover:to-[#DAA520] transition-all text-sm shadow-sm"
                      >
                        Use Suggested Target
                      </button>
                    </div>
                  )}
                  
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      placeholder="0.00"
                      className="border-2 border-[#DAA520]/30 focus:border-[#DAA520] h-12 text-base pl-8"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B4513] font-medium">$</span>
                  </div>
                  <p className="text-xs text-[#8B4513]/60">Enter your funding goal or use the suggested target above</p>
                </div>

                {/* Deadline */}
                <div className="space-y-2">
                  <Label className="text-[#654321] font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#DAA520]" />
                    Deadline <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="border-2 border-[#DAA520]/30 focus:border-[#DAA520] h-12 text-base"
                  />
                  <p className="text-xs text-[#8B4513]/60">When should contributions end?</p>
                </div>

                {/* Summary Card */}
                {(giftName || targetAmount) && (
                  <div className="bg-[#F5F1E8] rounded-xl p-4 border border-[#DAA520]/20">
                    <p className="text-xs text-[#8B4513]/70 mb-2">Funding Summary</p>
                    <div className="space-y-2">
                      {giftName && <p className="text-sm font-semibold text-[#654321]">{giftName}</p>}
                      {targetAmount && (
                        <div>
                          <p className="text-sm font-bold text-[#DAA520]">${parseFloat(targetAmount).toFixed(2)}</p>
                          {suggestedTarget && parseFloat(targetAmount) === suggestedTarget.total && (
                            <p className="text-[10px] text-[#8B4513]/70 italic">
                              Includes estimated tax & shipping
                            </p>
                          )}
                        </div>
                      )}
                      {deadline && (
                        <p className="text-xs text-[#8B4513]">
                          Due: {new Date(deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Design */}
          {currentStep === 4 && (
            <div className="p-6 sm:p-8">
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Include E-vite Toggle */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-[#DAA520]/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#DAA520] to-[#F4C430] flex items-center justify-center">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#654321]">Include E-vite Invitation?</p>
                        <p className="text-xs text-[#8B4513]/60">Send beautiful AI-designed invitations to guests</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIncludeEvite(!includeEvite)}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        includeEvite ? 'bg-gradient-to-r from-[#DAA520] to-[#F4C430]' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                        includeEvite ? 'translate-x-8' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Design AI Invitation - Only show if includeEvite is true */}
                {includeEvite && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border-2 border-amber-200">
                    {/* Preview of current banner */}
                    {bannerImage || eviteSettings?.bannerUrl ? (
                      <div className="relative rounded-xl overflow-hidden shadow-lg group mb-4">
                        <img 
                          src={bannerImage || eviteSettings?.bannerUrl} 
                          alt="Invitation Banner" 
                          className="w-full h-48 object-cover" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-6">
                          <h3 className="text-white text-2xl font-bold drop-shadow-lg px-4 text-center">{collectionTitle}</h3>
                        </div>
                        {eviteSettings && (
                          <div className="absolute top-2 left-2 bg-[#DAA520] text-white text-xs px-2 py-1 rounded-full font-medium">
                            ✓ AI Generated
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="aspect-[2/1] bg-gradient-to-br from-[#FEF3C7] via-[#FDE68A] to-[#FCD34D] rounded-xl flex items-center justify-center border-2 border-dashed border-[#DAA520] mb-4">
                        <div className="text-center">
                          <Sparkles className="w-10 h-10 mx-auto mb-2 text-[#B8860B] opacity-60" />
                          <p className="text-sm text-[#8B4513] opacity-80">Design your invitation</p>
                        </div>
                      </div>
                    )}

                    {/* Design Button */}
                    <button
                      type="button"
                      onClick={() => setShowEviteWizard(true)}
                      className={`w-full flex items-center justify-center gap-2 px-6 py-3 text-base font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all ${
                        eviteSettings 
                          ? 'bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white' 
                          : 'bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321]'
                      }`}
                    >
                      <Sparkles className="w-5 h-5" />
                      {eviteSettings ? 'Edit Invitation ✓' : 'Design Invitation'}
                    </button>
                    
                    {eviteSettings && (
                      <p className="text-center text-xs text-[#8B4513]/60 mt-2">
                        ✓ Ready to send to guests
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="p-6 sm:p-8">
              <div className="max-w-2xl mx-auto space-y-5">
                {/* Header */}
                <div className="text-center mb-2">
                  <h2 className="text-lg font-bold text-[#654321]">Review Your Gift Collection</h2>
                  <p className="text-xs text-[#8B4513]/70">Make sure everything looks good before publishing</p>
                </div>

                {/* Preview Card */}
                <div className="bg-white rounded-xl shadow-lg border border-[#DAA520]/20 overflow-hidden">
                  {/* Banner */}
                  {bannerImage ? (
                    <div className="relative h-40">
                      <img src={bannerImage} alt="Banner" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-4">
                        <h3 className="text-white text-lg font-bold drop-shadow-lg px-4 text-center">{collectionTitle}</h3>
                      </div>
                    </div>
                  ) : (
                    <div className="h-24 bg-gradient-to-br from-[#DAA520] to-[#F4C430] flex items-center justify-center">
                      <h3 className="text-white text-lg font-bold">{collectionTitle}</h3>
                    </div>
                  )}

                  <div className="p-4 space-y-3">
                    {/* Summary Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#F5F1E8] rounded-lg p-2.5">
                        <p className="text-[10px] text-[#8B4513]/60 uppercase tracking-wide">Recipient</p>
                        <p className="text-sm font-semibold text-[#654321] mt-0.5">{recipientName}</p>
                      </div>
                      <div className="bg-[#F5F1E8] rounded-lg p-2.5">
                        <p className="text-[10px] text-[#8B4513]/60 uppercase tracking-wide">Occasion</p>
                        <p className="text-sm font-semibold text-[#654321] mt-0.5">{occasion}</p>
                      </div>
                      <div className="bg-[#F5F1E8] rounded-lg p-2.5 cursor-help" title={giftName}>
                        <p className="text-[10px] text-[#8B4513]/60 uppercase tracking-wide">Gift</p>
                        <p className="text-sm font-semibold text-[#654321] mt-0.5 truncate">{giftName}</p>
                      </div>
                      <div className="bg-[#F5F1E8] rounded-lg p-2.5">
                        <p className="text-[10px] text-[#8B4513]/60 uppercase tracking-wide">Target</p>
                        <p className="text-sm font-bold text-[#DAA520] mt-0.5">${parseFloat(targetAmount).toFixed(2)}</p>
                        {suggestedTarget && parseFloat(targetAmount) === suggestedTarget.total && (
                          <p className="text-[9px] text-[#8B4513]/50 italic">Incl. tax & shipping</p>
                        )}
                      </div>
                    </div>

                    {/* Deadline - Full Width */}
                    <div className="bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] rounded-lg p-2.5 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#B8860B]" />
                      <div>
                        <p className="text-[10px] text-[#8B4513]/60 uppercase tracking-wide">Deadline</p>
                        <p className="text-sm font-semibold text-[#654321]">
                          {deadline ? new Date(deadline).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
                        </p>
                      </div>
                    </div>

                    {/* Product Preferences - I Wish, Alternative, Ok to Buy */}
                    <div className="space-y-3">
                      {/* I Wish Card - Full Details */}
                      {(extractedProduct || Object.keys(iWishVariants).length > 0) && (
                        <div className="rounded-lg border-2 border-[#DAA520]/30 bg-gradient-to-r from-[#DAA520]/10 to-[#F4C430]/10 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white shadow-sm">
                              ⭐ I Wish
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setIsEditingIWishReview(!isEditingIWishReview)}
                                className={`p-1.5 rounded-full transition-colors ${isEditingIWishReview ? 'bg-[#DAA520] text-white' : 'bg-[#DAA520]/20 hover:bg-[#DAA520]/40 text-[#654321]'}`}
                                title={isEditingIWishReview ? "Done editing" : "Edit I Wish details"}
                              >
                                {isEditingIWishReview ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setExtractedProduct(null)
                                  setIWishImage("")
                                  setIWishVariants({})
                                  setIWishNotes("")
                                  setEditableSpecs({})
                                  setIsEditingIWishReview(false)
                                }}
                                className="p-1.5 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                                title="Clear I Wish"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Product Image & Details Row */}
                          <div className="flex gap-3 mb-2">
                            {(iWishImage || extractedProduct?.imageUrl) && (
                              <img 
                                src={iWishImage || extractedProduct?.imageUrl} 
                                alt={extractedProduct?.productName || 'Selected product'}
                                className="w-16 h-16 object-contain rounded-lg bg-white border border-[#DAA520]/20 flex-shrink-0"
                              />
                            )}
                            
                            <div className="flex-1 min-w-0">
                              {/* Title - Editable */}
                              {isEditingIWishReview ? (
                                <input
                                  type="text"
                                  value={extractedProduct?.productName || giftName}
                                  onChange={(e) => {
                                    if (extractedProduct) {
                                      setExtractedProduct({ ...extractedProduct, productName: e.target.value })
                                    }
                                    setGiftName(e.target.value)
                                  }}
                                  className="w-full text-xs font-bold text-[#4A2F1A] bg-white border border-[#DAA520]/30 rounded px-1.5 py-1 mb-1"
                                />
                              ) : (
                                <h4 className="text-xs font-bold text-[#4A2F1A] line-clamp-2 leading-tight mb-1 cursor-help" title={extractedProduct?.productName || giftName}>
                                  {extractedProduct?.productName || giftName}
                                </h4>
                              )}
                              
                              {/* Store Name - Editable */}
                              {isEditingIWishReview ? (
                                <input
                                  type="text"
                                  value={extractedProduct?.storeName || ''}
                                  onChange={(e) => setExtractedProduct({ ...extractedProduct, storeName: e.target.value })}
                                  placeholder="Store name"
                                  className="w-full text-[10px] text-[#8B6914] bg-white border border-[#DAA520]/30 rounded px-1.5 py-0.5 mb-1"
                                />
                              ) : extractedProduct?.storeName && (
                                <p className="text-[10px] text-[#8B6914] font-medium mb-1">{extractedProduct.storeName}</p>
                              )}
                              
                              {/* Rating & Review Count - Editable */}
                              {isEditingIWishReview ? (
                                <div className="flex items-center gap-2 mb-1">
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="5"
                                    value={extractedProduct?.rating || ''}
                                    onChange={(e) => setExtractedProduct({ ...extractedProduct, rating: parseFloat(e.target.value) || 0 })}
                                    placeholder="Rating"
                                    className="w-14 text-[10px] bg-white border border-[#DAA520]/30 rounded px-1.5 py-0.5"
                                  />
                                  <span className="text-[9px] text-gray-500">stars</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={extractedProduct?.reviewCount || ''}
                                    onChange={(e) => setExtractedProduct({ ...extractedProduct, reviewCount: parseInt(e.target.value) || 0 })}
                                    placeholder="Reviews"
                                    className="w-16 text-[10px] bg-white border border-[#DAA520]/30 rounded px-1.5 py-0.5"
                                  />
                                  <span className="text-[9px] text-gray-500">reviews</span>
                                </div>
                              ) : extractedProduct?.rating && extractedProduct.rating > 0 && (
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((starPosition) => {
                                      const rating = extractedProduct.rating || 0
                                      const fillAmount = Math.max(0, Math.min(1, rating - (starPosition - 1)))
                                      const fillPercent = Math.round(fillAmount * 100)
                                      const gradientId = `star-review-iwish-${starPosition}`
                                      return (
                                        <svg key={starPosition} className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none">
                                          <defs>
                                            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                                              <stop offset={`${fillPercent}%`} stopColor="#F4C430" />
                                              <stop offset={`${fillPercent}%`} stopColor="#E5E7EB" />
                                            </linearGradient>
                                          </defs>
                                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={`url(#${gradientId})`} stroke="#F4C430" strokeWidth="1" />
                                        </svg>
                                      )
                                    })}
                                  </div>
                                  <span className="text-[10px] font-bold text-[#654321]">{extractedProduct.rating.toFixed(1)}</span>
                                  {extractedProduct.reviewCount && extractedProduct.reviewCount > 0 && (
                                    <span className="text-[9px] text-gray-500">({extractedProduct.reviewCount.toLocaleString()})</span>
                                  )}
                                </div>
                              )}
                              
                              {/* Badges - Editable */}
                              {isEditingIWishReview ? (
                                <div className="flex flex-wrap gap-2 mb-1">
                                  <label className="flex items-center gap-1 text-[9px]">
                                    <input
                                      type="checkbox"
                                      checked={extractedProduct?.bestSeller || false}
                                      onChange={(e) => setExtractedProduct({ ...extractedProduct, bestSeller: e.target.checked })}
                                      className="w-3 h-3"
                                    />
                                    Best Seller
                                  </label>
                                  <label className="flex items-center gap-1 text-[9px]">
                                    <input
                                      type="checkbox"
                                      checked={extractedProduct?.amazonChoice || false}
                                      onChange={(e) => setExtractedProduct({ ...extractedProduct, amazonChoice: e.target.checked })}
                                      className="w-3 h-3"
                                    />
                                    Amazon's Choice
                                  </label>
                                </div>
                              ) : (extractedProduct?.amazonChoice || extractedProduct?.bestSeller || extractedProduct?.overallPick) && (
                                <div className="flex flex-wrap gap-1 mb-1">
                                  {extractedProduct.amazonChoice && (
                                    <span className="bg-gradient-to-r from-gray-900 to-black text-white text-[7px] font-bold px-1 py-0.5 rounded-full">Amazon's Choice</span>
                                  )}
                                  {extractedProduct.bestSeller && (
                                    <span className="text-white text-[7px] font-bold px-1 py-0.5 rounded-full" style={{ backgroundColor: '#D14900' }}>#1 Best Seller</span>
                                  )}
                                  {extractedProduct.overallPick && (
                                    <span className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white text-[7px] font-bold px-1 py-0.5 rounded-full">⭐ Overall Pick</span>
                                  )}
                                </div>
                              )}
                              
                              {/* Price - Editable */}
                              {isEditingIWishReview ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-gray-500">$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={extractedProduct?.price || ''}
                                    onChange={(e) => setExtractedProduct({ ...extractedProduct, price: parseFloat(e.target.value) || 0 })}
                                    placeholder="Price"
                                    className="w-20 text-sm font-bold text-[#654321] bg-white border border-[#DAA520]/30 rounded px-1.5 py-0.5"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                  {extractedProduct?.originalPrice && extractedProduct.originalPrice > extractedProduct.price ? (
                                    <>
                                      <span className="text-[10px] text-gray-400 line-through">${extractedProduct.originalPrice.toFixed(2)}</span>
                                      <span className="text-sm font-bold text-[#654321]">${extractedProduct.price.toFixed(2)}</span>
                                      <span className="bg-gradient-to-r from-[#DC2626] to-[#EF4444] text-white font-semibold text-[7px] px-1 py-0.5 rounded-full">
                                        -{Math.round(((extractedProduct.originalPrice - extractedProduct.price) / extractedProduct.originalPrice) * 100)}%
                                      </span>
                                    </>
                                  ) : extractedProduct?.price ? (
                                    <span className="text-sm font-bold text-[#654321]">${extractedProduct.price.toFixed(2)}</span>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Specifications */}
                          {(Object.keys(editableSpecs).length > 0 || isEditingIWishReview) && (
                            <div className="bg-white/60 rounded-lg p-2 border border-[#DAA520]/20 mb-2">
                              <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <span className="w-1 h-1 bg-[#DAA520] rounded-full"></span>
                                Specifications
                              </p>
                              <div className="grid grid-cols-2 gap-1">
                                {Object.entries(editableSpecs).slice(0, 6).map(([key, value]) => (
                                  <div key={key} className="flex items-center gap-1 text-[9px]">
                                    {isEditingIWishReview ? (
                                      <>
                                        <input
                                          type="text"
                                          value={key}
                                          onChange={(e) => {
                                            const newSpecs = { ...editableSpecs }
                                            const oldValue = newSpecs[key]
                                            delete newSpecs[key]
                                            newSpecs[e.target.value] = oldValue
                                            setEditableSpecs(newSpecs)
                                          }}
                                          className="w-16 bg-white border border-[#DAA520]/30 rounded px-1 py-0.5 text-[#8B4513]/60 font-medium"
                                        />
                                        <span>:</span>
                                        <input
                                          type="text"
                                          value={value}
                                          onChange={(e) => setEditableSpecs({ ...editableSpecs, [key]: e.target.value })}
                                          className="flex-1 bg-white border border-[#DAA520]/30 rounded px-1 py-0.5 text-[#654321] font-semibold"
                                        />
                                      </>
                                    ) : (
                                      <>
                                        <span className="text-[#8B4513]/60 font-medium">{key}:</span>
                                        <span className="text-[#654321] font-semibold truncate">{value}</span>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Variants */}
                          {(Object.keys(iWishVariants).length > 0 || isEditingIWishReview) && (
                            <div className="bg-white/60 rounded-lg p-2 border border-[#DAA520]/20 mb-2">
                              <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <span className="w-1 h-1 bg-[#DAA520] rounded-full"></span>
                                Selected Options
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(iWishVariants).map(([key, value]) => (
                                  isEditingIWishReview ? (
                                    <div key={key} className="flex items-center gap-1 text-[9px] bg-[#DAA520]/20 rounded-full px-1.5 py-0.5">
                                      <input
                                        type="text"
                                        value={key}
                                        onChange={(e) => {
                                          const newVariants = { ...iWishVariants }
                                          const oldValue = newVariants[key]
                                          delete newVariants[key]
                                          newVariants[e.target.value] = oldValue
                                          setIWishVariants(newVariants)
                                        }}
                                        className="w-12 bg-transparent border-none font-medium text-[#654321]"
                                      />
                                      <span>:</span>
                                      <input
                                        type="text"
                                        value={value}
                                        onChange={(e) => setIWishVariants({ ...iWishVariants, [key]: e.target.value })}
                                        className="w-16 bg-transparent border-none font-medium text-[#654321]"
                                      />
                                    </div>
                                  ) : (
                                    <span key={key} className="text-[9px] bg-[#DAA520]/20 text-[#654321] px-1.5 py-0.5 rounded-full font-medium">
                                      {key}: {value}
                                    </span>
                                  )
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Notes */}
                          {(iWishNotes || isEditingIWishReview) && (
                            <div className="bg-white/60 rounded-lg p-2 border border-[#DAA520]/20">
                              <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider mb-1">Notes</p>
                              {isEditingIWishReview ? (
                                <textarea
                                  value={iWishNotes}
                                  onChange={(e) => setIWishNotes(e.target.value)}
                                  placeholder="Add notes..."
                                  className="w-full text-[10px] text-[#654321] bg-white border border-[#DAA520]/30 rounded px-1.5 py-1 resize-none"
                                  rows={2}
                                />
                              ) : (
                                <p className="text-[10px] text-[#654321] italic">"{iWishNotes}"</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Alternative Card - Full Details */}
                      {(altImage || Object.keys(altVariants).length > 0 || Object.keys(altEditableSpecs).length > 0 || altNotes) && (
                        <div className="rounded-lg border-2 border-[#D97706]/30 bg-gradient-to-r from-[#D97706]/10 to-[#F59E0B]/10 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-white shadow-sm">
                              ✓ Alternative
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setIsEditingAltReview(!isEditingAltReview)}
                                className={`p-1.5 rounded-full transition-colors ${isEditingAltReview ? 'bg-[#D97706] text-white' : 'bg-[#D97706]/20 hover:bg-[#D97706]/40 text-[#654321]'}`}
                                title={isEditingAltReview ? "Done editing" : "Edit Alternative details"}
                              >
                                {isEditingAltReview ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setAltImage("")
                                  setAltVariants({})
                                  setAltNotes("")
                                  setAltEditableSpecs({})
                                  setIsEditingAltReview(false)
                                }}
                                className="p-1.5 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                                title="Clear Alternative"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Product Image & Details Row */}
                          <div className="flex gap-3 mb-2">
                            {altImage && (
                              <img 
                                src={altImage} 
                                alt="Alternative product"
                                className="w-16 h-16 object-contain rounded-lg bg-white border border-[#D97706]/20 flex-shrink-0"
                              />
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-[#4A2F1A] line-clamp-2 leading-tight mb-1">
                                Alternative Option
                              </h4>
                              <p className="text-[10px] text-[#8B4513]/70">
                                Acceptable alternative if primary is unavailable
                              </p>
                            </div>
                          </div>
                          
                          {/* Specifications */}
                          {(Object.keys(altEditableSpecs).length > 0 || isEditingAltReview) && (
                            <div className="bg-white/60 rounded-lg p-2 border border-[#D97706]/20 mb-2">
                              <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <span className="w-1 h-1 bg-[#D97706] rounded-full"></span>
                                Specifications
                              </p>
                              <div className="grid grid-cols-2 gap-1">
                                {Object.entries(altEditableSpecs).slice(0, 6).map(([key, value]) => (
                                  <div key={key} className="flex items-center gap-1 text-[9px]">
                                    {isEditingAltReview ? (
                                      <>
                                        <input
                                          type="text"
                                          value={key}
                                          onChange={(e) => {
                                            const newSpecs = { ...altEditableSpecs }
                                            const oldValue = newSpecs[key]
                                            delete newSpecs[key]
                                            newSpecs[e.target.value] = oldValue
                                            setAltEditableSpecs(newSpecs)
                                          }}
                                          className="w-16 bg-white border border-[#D97706]/30 rounded px-1 py-0.5 text-[#8B4513]/60 font-medium"
                                        />
                                        <span>:</span>
                                        <input
                                          type="text"
                                          value={value}
                                          onChange={(e) => setAltEditableSpecs({ ...altEditableSpecs, [key]: e.target.value })}
                                          className="flex-1 bg-white border border-[#D97706]/30 rounded px-1 py-0.5 text-[#654321] font-semibold"
                                        />
                                      </>
                                    ) : (
                                      <>
                                        <span className="text-[#8B4513]/60 font-medium">{key}:</span>
                                        <span className="text-[#654321] font-semibold truncate">{value}</span>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Variants */}
                          {(Object.keys(altVariants).length > 0 || isEditingAltReview) && (
                            <div className="bg-white/60 rounded-lg p-2 border border-[#D97706]/20 mb-2">
                              <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <span className="w-1 h-1 bg-[#D97706] rounded-full"></span>
                                Selected Options
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(altVariants).map(([key, value]) => (
                                  isEditingAltReview ? (
                                    <div key={key} className="flex items-center gap-1 text-[9px] bg-[#D97706]/20 rounded-full px-1.5 py-0.5">
                                      <input
                                        type="text"
                                        value={key}
                                        onChange={(e) => {
                                          const newVariants = { ...altVariants }
                                          const oldValue = newVariants[key]
                                          delete newVariants[key]
                                          newVariants[e.target.value] = oldValue
                                          setAltVariants(newVariants)
                                        }}
                                        className="w-12 bg-transparent border-none font-medium text-[#654321]"
                                      />
                                      <span>:</span>
                                      <input
                                        type="text"
                                        value={value}
                                        onChange={(e) => setAltVariants({ ...altVariants, [key]: e.target.value })}
                                        className="w-16 bg-transparent border-none font-medium text-[#654321]"
                                      />
                                    </div>
                                  ) : (
                                    <span key={key} className="text-[9px] bg-[#D97706]/20 text-[#654321] px-1.5 py-0.5 rounded-full font-medium">
                                      {key}: {value}
                                    </span>
                                  )
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Notes */}
                          {(altNotes || isEditingAltReview) && (
                            <div className="bg-white/60 rounded-lg p-2 border border-[#D97706]/20">
                              <p className="text-[9px] font-bold text-[#6B4423] uppercase tracking-wider mb-1">Notes</p>
                              {isEditingAltReview ? (
                                <textarea
                                  value={altNotes}
                                  onChange={(e) => setAltNotes(e.target.value)}
                                  placeholder="Add notes..."
                                  className="w-full text-[10px] text-[#654321] bg-white border border-[#D97706]/30 rounded px-1.5 py-1 resize-none"
                                  rows={2}
                                />
                              ) : (
                                <p className="text-[10px] text-[#654321] italic">"{altNotes}"</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Ok to Buy Card */}
                      <div className="rounded-lg border-2 border-[#8B5A3C]/20 bg-white/50 p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-[#C2410C] to-[#EA580C] text-white shadow-sm">
                            💫 Ok to Buy
                          </span>
                        </div>
                        <p className="text-[10px] text-[#9A3412] bg-[#C2410C]/10 px-2 py-1.5 rounded-md border border-[#C2410C]/20 italic">
                          💡 You may purchase this product from another retailer, as long as it aligns with the "I Wish" or "Alternative" preferences.
                        </p>
                      </div>
                    </div>

                    </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Contribute */}
          {currentStep === 6 && (
            <div className="p-6 sm:p-10">
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#DAA520] to-[#F4C430] flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#654321]">Make Your Contribution</h2>
                  <p className="text-sm text-[#8B4513]/70 mt-1">Be the first to contribute to this gift collection</p>
                </div>

                {/* Contribution Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-[#DAA520]/20 p-8">
                  {!showContributionPayment ? (
                    <>
                      {/* Amount Selection */}
                      <div className="space-y-4 mb-6">
                        <label className="text-[14px] font-semibold text-[#654321] flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-[#DAA520]" />
                          Contribution Amount
                        </label>
                        
                        {/* Preset Amounts */}
                        <div className="grid grid-cols-4 gap-3">
                          {[25, 50, 100, 150].map(preset => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setMyContributionAmount(preset.toString())}
                              className={`py-3 rounded-xl font-bold text-[14px] transition-all ${
                                myContributionAmount === preset.toString()
                                  ? 'bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] shadow-md'
                                  : 'bg-[#F5F1E8] text-[#654321] hover:bg-[#DAA520]/20'
                              }`}
                            >
                              ${preset}
                            </button>
                          ))}
                        </div>
                        
                        {/* Custom Amount */}
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B4513]/40" />
                          <Input
                            type="number"
                            min="1"
                            step="0.01"
                            value={myContributionAmount}
                            onChange={(e) => setMyContributionAmount(e.target.value)}
                            placeholder="Enter custom amount"
                            className="pl-10 border-2 border-[#DAA520]/30 focus:border-[#DAA520] h-12 text-[14px]"
                          />
                        </div>
                      </div>

                      {/* Gift Summary */}
                      <div className="bg-gradient-to-br from-[#FEF7ED] to-[#FFF7ED] rounded-xl p-4 mb-6 border border-[#DAA520]/20 shadow-sm">
                        {/* Contributing To */}
                        <div className="mb-3">
                          <p className="text-[14px] text-[#8B4513]/70 font-medium mb-1">Contributing to</p>
                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#DAA520] to-[#F4C430] flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Gift className="w-3.5 h-3.5 text-white" />
                            </div>
                            <p className="text-[14px] font-semibold text-[#654321] leading-tight line-clamp-3">{giftName}</p>
                          </div>
                        </div>
                        
                        {/* Divider */}
                        <div className="border-t border-[#DAA520]/20 my-3"></div>
                        
                        {/* Target Amount */}
                        <div className="flex justify-between items-center">
                          <span className="text-[14px] text-[#8B4513]/70 font-medium">Target Amount</span>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-[#DAA520]" />
                            <span className="text-[14px] font-bold text-[#DAA520]">{parseFloat(targetAmount || '0').toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Continue to Payment */}
                      <button
                        type="button"
                        onClick={() => {
                          if (!myContributionAmount || parseFloat(myContributionAmount) < 1) {
                            toast({ title: "Invalid Amount", description: "Please enter a contribution amount of at least $1.", variant: "destructive" })
                            return
                          }
                          setShowContributionPayment(true)
                        }}
                        disabled={!myContributionAmount}
                        className="w-full py-3 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] font-bold text-[14px] rounded-xl hover:scale-[1.02] transition-all shadow-md disabled:opacity-50"
                      >
                        Continue to Payment
                      </button>
                    </>
                  ) : contributionComplete ? (
                    /* Contribution Success */
                    <div className="text-center py-8">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#10B981] to-[#34D399] flex items-center justify-center mx-auto mb-4">
                        <Check className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-[#654321] mb-2">Thank You!</h3>
                      <p className="text-base text-[#8B4513]/70 mb-4">
                        Your contribution of <span className="font-bold text-[#DAA520] text-[14px]">${myContributionAmount}</span> has been recorded.
                      </p>
                      <div className="bg-[#F5F1E8] rounded-xl p-4">
                        <p className="text-sm text-[#8B4513]/60">You're the first contributor to this gift!</p>
                      </div>
                    </div>
                  ) : (
                    /* Payment Form */
                    <>
                      <button
                        type="button"
                        onClick={() => setShowContributionPayment(false)}
                        className="flex items-center gap-1 text-sm text-[#8B4513]/70 hover:text-[#654321] mb-4"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                      </button>

                      {/* Summary */}
                      <div className="bg-gradient-to-r from-[#F5F1E8] to-[#FEF3C7] rounded-lg p-3 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[14px] text-[#8B4513]/70">Your Contribution</span>
                          <span className="text-[14px] font-bold text-[#654321]">${myContributionAmount}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* Card Number */}
                        <div>
                          <label className="text-xs font-semibold text-[#654321] mb-1 block">Card Number</label>
                          <Input
                            type="text"
                            value={contributionCardNumber}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
                              const parts = []
                              for (let i = 0; i < v.length && i < 16; i += 4) {
                                parts.push(v.substring(i, i + 4))
                              }
                              setContributionCardNumber(parts.join(' '))
                            }}
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                            className="border-2 border-[#DAA520]/30 focus:border-[#DAA520] h-11"
                          />
                        </div>

                        {/* Expiry & CVC */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-[#654321] mb-1 block">Expiry</label>
                            <Input
                              type="text"
                              value={contributionCardExpiry}
                              onChange={(e) => {
                                const v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
                                if (v.length >= 2) {
                                  setContributionCardExpiry(v.substring(0, 2) + '/' + v.substring(2, 4))
                                } else {
                                  setContributionCardExpiry(v)
                                }
                              }}
                              placeholder="MM/YY"
                              maxLength={5}
                              className="border-2 border-[#DAA520]/30 focus:border-[#DAA520] h-11"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-[#654321] mb-1 block">CVC</label>
                            <Input
                              type="text"
                              value={contributionCardCvc}
                              onChange={(e) => setContributionCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                              placeholder="123"
                              maxLength={4}
                              className="border-2 border-[#DAA520]/30 focus:border-[#DAA520] h-11"
                            />
                          </div>
                        </div>

                        {/* Error */}
                        {contributionCardError && (
                          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                            <AlertCircle className="w-4 h-4" />
                            {contributionCardError}
                          </div>
                        )}

                        {/* Submit Payment */}
                        <button
                          type="button"
                          onClick={async () => {
                            setContributionCardError('')
                            const cleanCard = contributionCardNumber.replace(/\s/g, '')
                            if (cleanCard.length < 15) {
                              setContributionCardError('Please enter a valid card number')
                              return
                            }
                            if (contributionCardExpiry.length < 5) {
                              setContributionCardError('Please enter a valid expiry date')
                              return
                            }
                            if (contributionCardCvc.length < 3) {
                              setContributionCardError('Please enter a valid CVC')
                              return
                            }
                            
                            setIsProcessingContribution(true)
                            // Simulate payment processing
                            await new Promise(resolve => setTimeout(resolve, 1500))
                            setIsProcessingContribution(false)
                            setContributionComplete(true)
                            toast({ title: "🎉 Contribution Recorded!", description: `Your $${myContributionAmount} contribution has been saved.`, variant: "warm" })
                          }}
                          disabled={isProcessingContribution}
                          className="w-full py-3 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] font-semibold rounded-lg hover:scale-[1.02] transition-all shadow-md disabled:opacity-50"
                        >
                          {isProcessingContribution ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing...
                            </span>
                          ) : (
                            `Pay $${myContributionAmount}`
                          )}
                        </button>

                        <p className="text-center text-[10px] text-[#8B4513]/60">
                          🔒 Secure payment • 256-bit SSL encrypted
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Skip Option Info */}
                {!contributionComplete && (
                  <p className="text-center text-xs text-[#8B4513]/60">
                    You can also skip this step and contribute later using "Skip & Create"
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 7: Gift Created / Share — shown in same form after create (no redirect to Active) */}
          {currentStep === 7 && (
            <div className="p-8 sm:p-12 lg:p-16">
              <div className="max-w-3xl mx-auto space-y-10">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#DAA520] to-[#F4C430] flex items-center justify-center mx-auto mb-6">
                    <Gift className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-[#654321]">Gift Created!</h2>
                  <p className="text-[15px] sm:text-base text-[#8B4513]/70 mt-3 max-w-xl mx-auto leading-relaxed">
                    {contributionComplete
                      ? "Your contribution was recorded. Share your contribution link with friends and family."
                      : "Share your contribution link with friends and family"}
                  </p>
                </div>

                {/* Share Card — same form style as Contribute step, increased length */}
                <div className="bg-white rounded-2xl shadow-lg border border-[#DAA520]/20 p-10 sm:p-12 lg:p-14">
                  {/* Contribution Link — taller area */}
                  <div className="mb-10">
                    <p className="text-xs sm:text-sm text-[#8B4513]/60 uppercase tracking-wide mb-3 font-semibold">Contribution Link</p>
                    <div className="bg-[#F5F1E8] rounded-xl border border-[#DAA520]/20 min-h-[120px] sm:min-h-[140px] p-5 sm:p-6 flex items-center justify-center">
                      <p className="text-sm sm:text-base text-[#654321] font-mono break-all text-center w-full">{createdGiftMagicLink}</p>
                    </div>
                    <p className="text-xs text-[#8B4513]/50 mt-3">Anyone with this link can view and contribute to your gift collection.</p>
                  </div>
                  
                  {/* Share Buttons */}
                  <div className="flex flex-wrap justify-center gap-4 mb-10">
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(createdGiftMagicLink)
                          setLinkCopied(true)
                          toast({ title: "Copied!", description: "Link copied to clipboard", variant: "warm" })
                          setTimeout(() => setLinkCopied(false), 2000)
                        } catch (err) {
                          toast({ title: "Error", description: "Failed to copy link", variant: "destructive" })
                        }
                      }}
                      className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white text-[15px] font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all"
                    >
                      {linkCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      {linkCopied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={() => {
                        const subject = encodeURIComponent('You\'re Invited to Contribute!')
                        const body = encodeURIComponent(`I've created a gift collection and would love for you to contribute!\n\nClick here to view and contribute: ${createdGiftMagicLink}`)
                        window.location.href = `mailto:?subject=${subject}&body=${body}`
                      }}
                      className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-[#EA580C] to-[#FB923C] text-white text-[15px] font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all"
                    >
                      <Mail className="w-5 h-5" />
                      Email
                    </button>
                    <button
                      onClick={() => {
                        const message = encodeURIComponent(`I've created a gift collection and would love for you to contribute!\n\nClick here to view and contribute: ${createdGiftMagicLink}`)
                        window.open(`https://wa.me/?text=${message}`, '_blank')
                      }}
                      className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white text-[15px] font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all"
                    >
                      <MessageCircle className="w-5 h-5" />
                      WhatsApp
                    </button>
                  </div>
                  
                  {/* Done Button — clear share link so /gifts/active does not show Share widget again */}
                  <button
                    onClick={() => {
                      if (createdGiftId) {
                        sessionStorage.removeItem(`gift_${createdGiftId}_magicLink`)
                      }
                      router.push('/gifts/active')
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] text-sm font-semibold rounded-xl hover:scale-[1.02] transition-all shadow-md"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer Navigation - Hidden on Step 7 */}
          {currentStep !== 7 && (
          <div className="flex items-center justify-between px-6 sm:px-8 py-4 bg-white border-t border-[#DAA520]/20">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-4 py-2 text-[#654321] font-medium rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-1">
              {STEPS.map(step => (
                <div
                  key={step.id}
                  className={`w-2 h-2 rounded-full transition-all ${
                    step.id === currentStep
                      ? 'w-6 bg-[#DAA520]'
                      : step.id < currentStep
                      ? 'bg-gradient-to-r from-[#DAA520] to-[#F4C430]'
                      : 'bg-[#DAA520]/30'
                  }`}
                />
              ))}
            </div>

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] text-[14px] font-semibold rounded-md hover:scale-105 transition-all shadow-md"
              >
                {currentStep === 5 ? 'Continue' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {!contributionComplete && (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-2 border-2 border-[#8B4513] text-[#8B4513] text-[14px] font-semibold rounded-md hover:bg-[#8B4513] hover:text-white transition-all"
                  >
                    Skip & Create
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] text-[14px] font-semibold rounded-md hover:scale-105 transition-all shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Collection'
                  )}
                </button>
              </div>
            )}
          </div>
          )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Evite Wizard Modal */}
      <EviteWizard
        isOpen={showEviteWizard}
        onClose={() => setShowEviteWizard(false)}
        collectionTitle={collectionTitle}
        occasion={occasion}
        deadline={deadline}
        onComplete={async (data) => {
          setEviteSettings({
            bannerUrl: data.bannerUrl,
            bannerStyle: data.bannerStyle,
            invitationMessage: data.invitationMessage,
            colorTheme: data.colorTheme,
            enableMagicLink: data.enableMagicLink,
            enableReminders: data.enableReminders,
            shareChannels: data.shareChannels,
          })
          // Set banner image for gift collection page (same image for both)
          if (data.bannerUrl) setBannerImage(data.bannerUrl)
          toast({ title: "Saved!", description: "Your invitation settings have been applied." })
        }}
      />
      
      {/* Price Warning Dialog */}
      <Dialog open={showPriceWarning} onOpenChange={setShowPriceWarning}>
        <DialogContent className="sm:max-w-md border-2 border-[#D97706] bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#D97706] to-[#F59E0B] flex items-center justify-center shadow-lg">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl font-bold text-[#92400E]">
              Alternative Price Too High
            </DialogTitle>
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
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              onClick={() => {
                setShowPriceWarning(false)
                setPriceWarningData(null)
              }}
              className="w-full h-12 bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-white font-semibold rounded-full hover:from-[#F59E0B] hover:to-[#D97706] hover:scale-105 transition-all shadow-md"
            >
              Got it, I'll choose another
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Preview Product (Trending Gift) Dialog */}
      <Dialog open={showPreviewProduct} onOpenChange={setShowPreviewProduct}>
        <DialogContent className="sm:max-w-lg border-2 border-[#F59E0B] bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#654321] flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#F59E0B]" />
              Preview Product
            </DialogTitle>
          </DialogHeader>
          {previewProduct && (
            <div className="space-y-4">
              <div className="flex gap-4">
                {previewProduct.image ? (
                  <img src={previewProduct.image} alt={previewProduct.productName} className="w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 object-contain rounded-xl bg-gray-50 border border-[#F59E0B]/20" />
                ) : (
                  <div className="w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 bg-gray-100 rounded-xl flex items-center justify-center border border-[#F59E0B]/20">
                    <Gift className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-[#654321] line-clamp-2 leading-snug">{previewProduct.productName}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xl font-bold text-[#F59E0B]">${(previewProduct.price ?? 0).toFixed(2)}</span>
                    {previewProduct.originalPrice != null && Number(previewProduct.originalPrice) > (previewProduct.price ?? 0) && (
                      <span className="text-sm text-gray-500 line-through">${Number(previewProduct.originalPrice).toFixed(2)}</span>
                    )}
                  </div>
                  {previewProduct.rating > 0 && (
                    <span className="flex items-center gap-1 text-sm text-amber-600 mt-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {previewProduct.rating?.toFixed(1)} {previewProduct.reviewCount ? `(${previewProduct.reviewCount} reviews)` : ""}
                    </span>
                  )}
                  {(previewProduct.amazonChoice || previewProduct.bestSeller || previewProduct.overallPick) && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {previewProduct.amazonChoice && (
                        <span className="text-xs px-2 py-0.5 bg-gray-900 text-white rounded-full font-medium">Amazon Choice</span>
                      )}
                      {previewProduct.bestSeller && (
                        <span className="text-xs px-2 py-0.5 bg-orange-600 text-white rounded-full font-medium">Best Seller</span>
                      )}
                      {previewProduct.overallPick && (
                        <span className="text-xs px-2 py-0.5 bg-[#F59E0B] text-white rounded-full font-medium">Overall Pick</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {previewProduct.description && (
                <p className="text-sm text-[#8B4513]/80 line-clamp-3">{previewProduct.description}</p>
              )}
              {previewProduct.category && (
                <p className="text-xs text-[#8B4513]/60">Category: {previewProduct.category}</p>
              )}
            </div>
          )}
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPreviewProduct(false)}
              className="border-[#F59E0B] text-[#654321] hover:bg-[#F59E0B]/10"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (previewProduct) {
                  selectTrendingGift(previewProduct)
                  setShowPreviewProduct(false)
                  setPreviewProduct(null)
                }
              }}
              className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white font-semibold"
            >
              Use this product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Select different Options - same UI as /gifts/trending Add to Wishlist → Choose Your Preferred Options */}
      <AddToWishlistModal
        gift={selectedGiftForDifferentOptions}
        isOpen={showSelectDifferentOptionsModal}
        onClose={() => {
          setShowSelectDifferentOptionsModal(false)
          setSelectedGiftForDifferentOptions(null)
        }}
        primaryButtonText="Add as gift"
        modalTitle="Select different options"
        onAddAsGift={({ gift, preferences }) => {
          const product = {
            productName: gift.giftName || "Product",
            price: gift.targetAmount ?? 0,
            originalPrice: gift.originalPrice,
            imageUrl: preferences.iLike?.image || gift.image || "",
            productLink: gift.productLink || "",
            storeName: gift.source || "Store",
            rating: gift.rating || 0,
            reviewCount: gift.reviewCount || 0,
            description: (gift as any).description || "",
            amazonChoice: gift.amazonChoice,
            bestSeller: gift.bestSeller,
            overallPick: gift.overallPick,
            attributes: gift.attributes || {},
          }
          setExtractedProduct(product)
          setIWishImage(preferences.iLike?.image || gift.image || "")
          const iLikeVariants: Record<string, string> = {}
          if (preferences.iLike) {
            const il = preferences.iLike
            if (il.color) iLikeVariants["Color"] = il.color
            if (il.size) iLikeVariants["Size"] = il.size
            if (il.style) iLikeVariants["Style"] = il.style
            if (il.configuration) iLikeVariants["Configuration"] = il.configuration
            if (il.capacity) iLikeVariants["Capacity"] = il.capacity
            if (il.customFields) il.customFields.forEach((f) => { if (f.key && f.value) iLikeVariants[f.key] = f.value })
          }
          setIWishVariants(iLikeVariants)
          const specs = (preferences.iLike as any)?.specifications || gift.attributes
          if (specs && typeof specs === "object") {
            const specRecord: Record<string, string> = {}
            Object.entries(specs).forEach(([k, v]) => { if (v != null && String(v).trim()) specRecord[k] = String(v) })
            setEditableSpecs(specRecord)
          }
          if (gift.targetAmount != null) setTargetAmount(String(gift.targetAmount))
          if (gift.giftName && !giftName) setGiftName(gift.giftName)
          if (preferences.alternative) {
            const alt = preferences.alternative as any
            setAltImage(alt.image || "")
            setAltNotes(alt.notes || "")
            const altVariants: Record<string, string> = {}
            if (alt.color) altVariants["Color"] = alt.color
            if (alt.size) altVariants["Size"] = alt.size
            if (alt.style) altVariants["Style"] = alt.style
            if (alt.configuration) altVariants["Configuration"] = alt.configuration
            if (alt.capacity) altVariants["Capacity"] = alt.capacity
            if (alt.customFields) alt.customFields.forEach((f: { key: string; value: string }) => { if (f.key && f.value) altVariants[f.key] = f.value })
            setAltVariants(altVariants)
            if (alt.specifications && typeof alt.specifications === "object" && Object.keys(alt.specifications).length > 0) {
              const specRecord: Record<string, string> = {}
              Object.entries(alt.specifications).forEach(([k, v]) => { if (v != null && String(v).trim()) specRecord[k] = String(v).trim() })
              setAltEditableSpecs(specRecord)
            }
          }
          setShowSelectDifferentOptionsModal(false)
          setSelectedGiftForDifferentOptions(null)
          toast({ title: "🐝 Added as gift!", description: "Product added to Include Gift for this collection.", variant: "warm" })
        }}
      />

      {/* Gift Created Share Modal */}
      {showGiftCreatedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] p-6">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 border-2 border-white/50">
                    <Gift className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Gift Created!</h3>
                  <p className="text-[14px] text-white/80 mt-1">Share your contribution link</p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Contribution Link */}
              <div>
                <p className="text-[12px] text-[#8B4513]/60 uppercase tracking-wide mb-2 font-semibold">Contribution Link</p>
                <div className="bg-[#F5F1E8] rounded-xl p-3 border border-[#DAA520]/20">
                  <p className="text-[12px] text-[#654321] font-mono break-all">{createdGiftMagicLink}</p>
                </div>
              </div>
              
              {/* Share Buttons */}
              <div className="flex justify-center gap-3">
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(createdGiftMagicLink)
                      setLinkCopied(true)
                      toast({ title: "Copied!", description: "Link copied to clipboard", variant: "warm" })
                      setTimeout(() => setLinkCopied(false), 2000)
                    } catch (err) {
                      toast({ title: "Error", description: "Failed to copy link", variant: "destructive" })
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white text-[14px] font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all"
                >
                  {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {linkCopied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => {
                    const subject = encodeURIComponent('You\'re Invited to Contribute!')
                    const body = encodeURIComponent(`I've created a gift collection and would love for you to contribute!\n\nClick here to view and contribute: ${createdGiftMagicLink}`)
                    window.location.href = `mailto:?subject=${subject}&body=${body}`
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#EA580C] to-[#FB923C] text-white text-[14px] font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </button>
                <button
                  onClick={() => {
                    const message = encodeURIComponent(`I've created a gift collection and would love for you to contribute!\n\nClick here to view and contribute: ${createdGiftMagicLink}`)
                    window.open(`https://wa.me/?text=${message}`, '_blank')
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white text-[14px] font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </button>
              </div>
              
              {/* Done Button */}
              <button
                onClick={() => {
                  setShowGiftCreatedModal(false)
                  router.push('/gifts/active')
                }}
                className="w-full py-3 bg-[#F5F1E8] text-[#654321] text-[14px] font-semibold rounded-xl hover:bg-[#EDE9E0] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CreateGiftFormClient
