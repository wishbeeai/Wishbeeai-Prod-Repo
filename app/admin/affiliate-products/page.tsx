"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Filter,
  Settings,
  Plus,
  Edit2,
  Trash2,
  Star,
  Mail,
  Bell,
  User,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Package,
  Sparkles,
  Loader2,
  Heart,
  ExternalLink,
  SlidersHorizontal,
  X,
  Check,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import Link from "next/link"

interface ProductAttributes {
  capacity?: string
  material?: string
  finishType?: string
  productDimensions?: string
  wattage?: string
  itemWeight?: string
  controlMethod?: string
  operationMode?: string
  specialFeature?: string
  // Variant options - may be present in API response but excluded from display
  color?: string
  size?: string
  style?: string
  configuration?: string
  set?: string
  brand?: string
  // Audio product attributes
  earPlacement?: string
  formFactor?: string
  noiseControl?: string
  impedance?: string
  connectivity?: string
  wirelessType?: string
  compatibleDevices?: string
  batteryLife?: string
  configurationOptions?: string[]
  model?: string
  modelName?: string
  // Custom badges
  customBadges?: Array<{name: string, enabled: boolean}>
  // Custom fields
  customFields?: Array<{name: string, value: string}>
}

interface AffiliateProduct {
  id: string
  productName: string
  image: string
  category: string
  source: string
  rating: number
  reviewCount: number
  price: number
  originalPrice?: number
  amazonChoice?: boolean
  bestSeller?: boolean
  productLink: string
  attributes?: ProductAttributes
  createdAt: string
  updatedAt: string
}

const ADMIN_EMAIL = "wishbeeai@gmail.com"

export default function AdminAffiliateProductsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [products, setProducts] = useState<AffiliateProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedSource, setSelectedSource] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("popularity")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<AffiliateProduct | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedProduct, setExtractedProduct] = useState<any>(null)
  // Variant options extracted from URL (color, size, style, set/configuration, capacity) - displayed in "Selected Options" layout
  const [variantOptions, setVariantOptions] = useState<{color?: string, size?: string, style?: string, configuration?: string, capacity?: string}>({})
  // State for editing variant options
  const [editingOption, setEditingOption] = useState<'style' | 'color' | 'size' | 'set' | 'configuration' | 'capacity' | null>(null)
  const [editOptionValue, setEditOptionValue] = useState('')
  // Custom variant options (user-added fields beyond Style, Color, Size, Set)
  const [customVariantOptions, setCustomVariantOptions] = useState<Array<{id: string, name: string, value: string}>>([])
  const [isAddingCustomOption, setIsAddingCustomOption] = useState(false)
  const [newOptionName, setNewOptionName] = useState('')
  const [newOptionValue, setNewOptionValue] = useState('')
  const [editingCustomOptionId, setEditingCustomOptionId] = useState<string | null>(null)
  const [editCustomOptionValue, setEditCustomOptionValue] = useState('')
  // Custom fields for product specifications
  const [customFields, setCustomFields] = useState<Array<{name: string, value: string}>>([])
  // Product attributes (Brand, Color, Ear Placement, etc.) - include id for stable React keys
  const [productAttributes, setProductAttributes] = useState<Array<{id: string, name: string, value: string}>>([])
  // View mode for Product Attributes (true = display mode like product page, false = edit mode)
  const [productAttributesViewMode, setProductAttributesViewMode] = useState(true)
  // Custom badges for product
  const [customBadges, setCustomBadges] = useState<Array<{name: string, enabled: boolean}>>([])
  // Temporary string values to preserve decimal points while typing
  const [tempPriceValue, setTempPriceValue] = useState<string>("")
  const [tempOriginalPriceValue, setTempOriginalPriceValue] = useState<string>("")
  const [tempRatingValue, setTempRatingValue] = useState<string>("")
  const [tempReviewCountValue, setTempReviewCountValue] = useState<string>("")
  const [addingToWishlist, setAddingToWishlist] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    productName: "",
    image: "",
    category: "",
    source: "",
    rating: "",
    reviewCount: "",
    price: "",
    originalPrice: "",
    productLink: "",
    amazonChoice: false,
    bestSeller: false,
  })

  // Check admin access - case-insensitive and trimmed for security
  useEffect(() => {
    if (!authLoading) {
      const userEmail = user?.email?.toLowerCase().trim()
      const adminEmail = ADMIN_EMAIL.toLowerCase().trim()
      if (!user || userEmail !== adminEmail) {
        router.push("/")
        toast.error("Access denied. Admin privileges required.")
        return
      }
    }
  }, [user, authLoading, router])

  // Fetch affiliate products - only for admin
  useEffect(() => {
    const userEmail = user?.email?.toLowerCase().trim()
    const adminEmail = ADMIN_EMAIL.toLowerCase().trim()
    if (userEmail === adminEmail) {
      fetchProducts()
    }
  }, [user])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/affiliate-products")
      if (response.ok) {
        const data = await response.json()
        const fetchedProducts = data.products || []
        console.log(`[fetchProducts] Fetched ${fetchedProducts.length} products`)
        setProducts(fetchedProducts)
      } else {
        toast.error("Failed to load affiliate products")
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      toast.error("Failed to load affiliate products")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/affiliate-products/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        toast.success("Product deleted successfully")
        
        // Immediately update local state to remove the deleted product
        setProducts((prevProducts) => prevProducts.filter((p) => String(p.id) !== String(id)))
        
        // Also fetch to ensure sync with server (though local update is primary)
        fetchProducts()
        setIsDeleteModalOpen(false)
        setDeletingProductId(null)
      } else {
        toast.error("Failed to delete product")
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error("Failed to delete product")
    }
  }

  const resetForm = () => {
    setFormData({
      productName: "",
      image: "",
      category: "",
      source: "",
      rating: "",
      reviewCount: "",
      price: "",
      originalPrice: "",
      productLink: "",
      amazonChoice: false,
      bestSeller: false,
    })
    setExtractedProduct(null) // Clear extracted product widget
    setVariantOptions({}) // Clear variant options (Selected Options display)
    setEditingOption(null) // Clear editing state
    setEditOptionValue('') // Clear editing value
    setCustomVariantOptions([]) // Clear custom variant options
    setIsAddingCustomOption(false) // Clear add option form
    setNewOptionName('') // Clear new option name
    setNewOptionValue('') // Clear new option value
    setEditingCustomOptionId(null) // Clear editing custom option
    setEditCustomOptionValue('') // Clear editing custom option value
    setCustomFields([]) // Clear custom fields
    setCustomBadges([]) // Clear custom badges
    setProductAttributes([]) // Clear product attributes
  }

  const handleOpenAddModal = () => {
    resetForm()
    setExtractedProduct(null) // Clear extracted product widget
    setIsAddModalOpen(true)
  }

  const handleOpenEditModal = (product: AffiliateProduct) => {
    setEditingProduct(product)
    setFormData({
      productName: product.productName || "",
      image: product.image || "",
      category: product.category || "",
      source: product.source || "",
      rating: product.rating?.toString() || "",
      reviewCount: product.reviewCount?.toString() || "",
      price: product.price?.toString() || "",
      originalPrice: product.originalPrice?.toString() || "",
      productLink: product.productLink || "",
      amazonChoice: product.amazonChoice || false,
      bestSeller: product.bestSeller || false,
    })
    
    // Load saved variant options (Color, Size, Style, Configuration)
    const savedVariantOptions: {color?: string, size?: string, style?: string, configuration?: string} = {}
    if ((product as any).color) savedVariantOptions.color = (product as any).color
    if ((product as any).size) savedVariantOptions.size = (product as any).size
    if ((product as any).style) savedVariantOptions.style = (product as any).style
    if ((product as any).configuration) savedVariantOptions.configuration = (product as any).configuration
    // Also check in attributes as fallback
    if (!savedVariantOptions.color && product.attributes?.color) savedVariantOptions.color = product.attributes.color
    if (!savedVariantOptions.size && product.attributes?.size) savedVariantOptions.size = product.attributes.size
    if (!savedVariantOptions.style && product.attributes?.style) savedVariantOptions.style = product.attributes.style
    if (!savedVariantOptions.configuration && product.attributes?.configuration) savedVariantOptions.configuration = product.attributes.configuration
    
    setVariantOptions(savedVariantOptions)
    console.log('[Admin] Loaded variant options for editing:', savedVariantOptions)
    // Populate extractedProduct with existing product data for editing
    // Filter out variant options (color, size, style, configuration, capacity) from existing product attributes
    // These are shown in "Selected Options", not in "Product Attributes"
    let filteredEditAttributes = null
    if (product.attributes) {
      const { color, size, style, configuration, capacity, ...restAttributes } = product.attributes
      if (Object.keys(restAttributes).length > 0) {
        filteredEditAttributes = restAttributes
      }
    }
    
    setExtractedProduct({
      productName: product.productName || "",
      image: product.image || "",
      category: product.category || "",
      source: product.source || "",
      rating: product.rating || null,
      reviewCount: product.reviewCount || null,
      price: product.price || null,
      originalPrice: product.originalPrice || null,
      productLink: product.productLink || "",
      brand: (() => {
        const brandValue = product.attributes?.brand
        // Filter out "Unknown" and empty values
        if (!brandValue || brandValue.toString().toLowerCase().trim() === 'unknown' || brandValue.toString().trim() === '') {
          return null
        }
        return brandValue.toString().trim()
      })(),
      amazonChoice: product.amazonChoice || false,
      bestSeller: product.bestSeller || false,
      // Include product attributes/specifications for editing (excluding color, size, style)
      attributes: filteredEditAttributes || {
        capacity: null,
        material: null,
        finishType: null,
        productDimensions: null,
        wattage: null,
        itemWeight: null,
        controlMethod: null,
        operationMode: null,
        specialFeature: null,
        brand: null,
        sizeOptions: null,
        earPlacement: null,
        formFactor: null,
        noiseControl: null,
        impedance: null,
        connectivity: null,
        wirelessType: null,
        compatibleDevices: null,
        batteryLife: null,
        // NOTE: color, size, style are intentionally excluded
      },
    })
    // Load custom fields from product attributes
    setCustomFields(product.attributes?.customFields || [])
    // Load custom badges from product attributes
    setCustomBadges(product.attributes?.customBadges || [])
    // Load product attributes as key-value pairs (with unique ids for stable React keys)
    const attrPairs: Array<{id: string, name: string, value: string}> = []
    let editAttrCounter = 0
    
    // Helper to format attribute name with first letter caps and spaces
    const formatAttrName = (name: string): string => {
      const words = name.replace(/([A-Z])/g, ' $1').trim()
      return words.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ')
    }
    
    if (product.attributes) {
      const excludeKeys = ['customFields', 'customBadges', 'configurationOptions', 'model']
      for (const [key, value] of Object.entries(product.attributes)) {
        if (!excludeKeys.includes(key) && value && typeof value === 'string') {
          // Format the attribute name with proper capitalization
          const formattedName = formatAttrName(key)
          attrPairs.push({ id: `edit-attr-${Date.now()}-${editAttrCounter++}`, name: formattedName, value: value })
        }
      }
    }
    // Include ALL product attributes (no limit)
    setProductAttributes(attrPairs)
    setIsEditModalOpen(true)
  }

  const handleProductLinkChange = (url: string) => {
    setFormData({ ...formData, productLink: url })
    setExtractedProduct(null) // Clear previous extracted product when URL changes
  }

  // Auto-extract when URL is pasted - pass URL directly since state update is async
  const handleAutoExtract = async (pastedUrl: string) => {
    // First update the form data
    setFormData(prev => ({ ...prev, productLink: pastedUrl }))
    setExtractedProduct(null)
    
    // Then trigger extraction with the pasted URL directly
    await extractProductFromUrl(pastedUrl)
  }

  const handleExtractProduct = async () => {
    await extractProductFromUrl(formData.productLink)
  }

  const extractProductFromUrl = async (url: string) => {
    if (!url.trim()) {
      toast.error("Please paste a product URL")
      return
    }

    // Check if it's a valid URL
    try {
      new URL(url)
    } catch {
      toast.error("Please enter a valid product URL (starting with http:// or https://)")
      return
    }

    // Only extract if URL looks valid and is not empty
    if (url.length < 10) {
      toast.error("Please enter a valid product URL")
      return
    }

    setIsExtracting(true)
    try {
      // NOTE: Amazon PA-API code is kept below for when approval is received
      // For now, Amazon URLs use ScraperAPI via /api/ai/extract-product endpoint
      // which handles JavaScript rendering and bot detection bypass for Amazon
      
      // Check if it's an Amazon URL - PA-API code kept for future use when approved
      const isAmazonUrl = url.includes("amazon.com") || url.includes("amazon.")
      
      // TODO: Uncomment PA-API code below once Amazon PA-API approval is received
      // For now, all URLs (including Amazon) use the ScraperAPI extraction method
      /*
      if (isAmazonUrl) {
        // Try PA-API first for Amazon products (when approved)
        try {
          const paapiResponse = await fetch("/api/amazon-paapi", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ productUrl: url }),
          })
          // ... PA-API code here ...
          return
        } catch (paapiError) {
          // Fall through to ScraperAPI extraction
        }
      }
      */

      // Regular extraction (AI-based or scraping via ScraperAPI) - works for all sites including Amazon
      console.log("[Admin] Starting product extraction for URL:", url)
      
      let response: Response
      try {
        response = await fetch("/api/ai/extract-product", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productUrl: url }),
        })
      } catch (fetchError) {
        console.error("[Admin] Network error - could not reach API:", fetchError)
        toast.error("Network error - could not reach server", {
          description: "Make sure the development server is running (npm run dev)"
        })
        setIsExtracting(false)
        return
      }

      console.log("[Admin] Response received:", response.status, response.statusText)

      if (!response.ok) {
        const responseText = await response.text()
        console.log("[Admin] Response text length:", responseText.length)
        console.log("[Admin] Response text:", responseText.substring(0, 1000))
        
        let errorData: any = { error: "Unknown error" }
        try {
          if (responseText && responseText.trim()) {
            errorData = JSON.parse(responseText)
          } else {
            errorData = { error: `Server returned empty response with status ${response.status}` }
          }
        } catch {
          errorData = { error: "Failed to parse error response", details: responseText.substring(0, 500) }
        }
        console.error("[Admin] Product extraction FAILED")
        console.error("[Admin] Status:", response.status, response.statusText)
        console.error("[Admin] Error Data:", JSON.stringify(errorData, null, 2))
        toast.error(
          errorData.error || `Failed to extract product details (${response.status})`,
          { description: errorData.suggestion || errorData.message || errorData.details || response.statusText }
        )
        setIsExtracting(false)
        return
      }

      if (response.ok) {
        const data = await response.json()
        
        // Extract the product details - API returns productData object
        const extracted = data.productData || data
        
        // DEBUG: Log the full extracted data to see what attributes are available
        console.log('[Admin] ========== EXTRACTION DEBUG ==========')
        console.log('[Admin] Full extracted data from API:', extracted)
        console.log('[Admin] All top-level keys:', Object.keys(extracted))
        console.log('[Admin] extracted.attributes:', extracted.attributes)
        if (extracted.attributes) {
          console.log('[Admin] All attribute keys:', Object.keys(extracted.attributes))
          // Log each attribute value
          for (const [key, value] of Object.entries(extracted.attributes)) {
            if (value) console.log(`[Admin] Attr: ${key} = ${value}`)
          }
        }
        // Check for specs in various locations
        console.log('[Admin] extracted.productSpecifications:', extracted.productSpecifications)
        console.log('[Admin] extracted.specs:', extracted.specs)
        console.log('[Admin] extracted.specifications:', extracted.specifications)
        console.log('[Admin] extracted.technicalDetails:', extracted.technicalDetails)
        console.log('[Admin] =========================================')
        
        // Store extracted product details for widget display
        const sourceValue = extracted.storeName || extracted.source || extractSourceFromUrl(url) || ""
        const categoryValue = extracted.category || ""
        const imageValue = extracted.imageUrl || extracted.image || extracted.productImageUrl || ""
        const priceValue = extracted.salePrice || extracted.price || null
        const originalPriceValue = extracted.originalPrice || extracted.listPrice || null
        const ratingValue = extracted.rating || extracted.averageRating || null
        const reviewCountValue = extracted.reviewCount || extracted.numReviews || null
        
        // Capture variant options (color, size, style) from extracted data for "I Wish" display
        // Helper to validate variant option values (filter out garbage)
        const isValidVariantValue = (value: any): boolean => {
          if (!value || typeof value !== 'string') return false
          const trimmed = value.trim()
          // Reject if empty, too long, or contains garbage patterns
          // Increased max length from 50 to 100 to support Apple Watch case+band descriptions
          // e.g., "Rugged Titanium Case with Natural Titanium Milanese Loop" (53 chars)
          if (trimmed.length === 0 || trimmed.length > 100) return false
          // Reject CSS-like content, HTML, scripts, or special characters
          if (trimmed.includes('{') || trimmed.includes('}') || trimmed.includes('<') || trimmed.includes('>')) return false
          if (trimmed.includes('function') || trimmed.includes('var ') || trimmed.includes('const ')) return false
          if (trimmed.includes('undefined') || trimmed.includes('null') || trimmed.includes('NaN')) return false
          if (trimmed.includes('px') || trimmed.includes('rem') || trimmed.includes('rgb')) return false
          if (trimmed.includes('http') || trimmed.includes('www.')) return false
          // Reject if mostly numbers/special chars (except sizes like "XL", "42mm")
          const alphaCount = (trimmed.match(/[a-zA-Z]/g) || []).length
          if (alphaCount < 1) return false
          return true
        }
        
        const extractedVariants: {color?: string, size?: string, style?: string, configuration?: string, capacity?: string} = {}
        
        // Helper to get a string value (handles arrays by taking first element)
        const getStringValue = (val: any): string | undefined => {
          if (!val) return undefined
          if (typeof val === 'string') return val
          if (Array.isArray(val) && val.length > 0) {
            // For arrays, take the first element if it's a string
            const first = val[0]
            if (typeof first === 'string') return first
            if (typeof first === 'object' && first !== null) {
              // Handle objects like {displayName: "value"}
              return first.displayName || first.value || first.name || String(first)
            }
          }
          return undefined
        }
        
        // Log all potential variant sources for debugging
        console.log('[Admin] ===== VARIANT OPTIONS DEBUG =====')
        console.log('[Admin] extracted.attributes?.color:', extracted.attributes?.color)
        console.log('[Admin] extracted.color:', extracted.color)
        console.log('[Admin] extracted.attributes?.size:', extracted.attributes?.size)
        console.log('[Admin] extracted.size:', extracted.size)
        console.log('[Admin] extracted.attributes?.style:', extracted.attributes?.style)
        console.log('[Admin] extracted.style:', extracted.style)
        console.log('[Admin] extracted.attributes?.set:', extracted.attributes?.set)
        console.log('[Admin] extracted.set:', extracted.set)
        console.log('[Admin] extracted.attributes?.configuration:', extracted.attributes?.configuration)
        console.log('[Admin] extracted.configuration:', extracted.configuration)
        console.log('[Admin] extracted.attributes?.capacity:', extracted.attributes?.capacity)
        console.log('[Admin] extracted.capacity:', extracted.capacity)
        // Also check for watch-specific fields
        console.log('[Admin] extracted.attributes?.connectivity:', extracted.attributes?.connectivity)
        console.log('[Admin] extracted.attributes?.connectivityTechnology:', extracted.attributes?.connectivityTechnology)
        console.log('[Admin] ===================================')
        
        // Get values, handling arrays properly
        const colorVal = getStringValue(extracted.attributes?.color) || getStringValue(extracted.color)
        const sizeVal = getStringValue(extracted.attributes?.size) || getStringValue(extracted.size)
        const styleVal = getStringValue(extracted.attributes?.style) || getStringValue(extracted.style)
        // Configuration: AppleCare options (Amazon calls this "configuration_name" dimension)
        // Note: connectivity (GPS, GPS + Cellular) is a SPEC, not a variant - don't include it here
        const configVal = getStringValue(extracted.attributes?.set) || getStringValue(extracted.set) ||
                          getStringValue(extracted.attributes?.configuration) || getStringValue(extracted.configuration)
        // Capacity: Memory and storage options (e.g., "16GB Unified Memory, 1TB SSD Storage")
        // Check multiple sources: attributes.capacity, top-level capacity, or extract from features
        let capacityVal = getStringValue(extracted.attributes?.capacity) || getStringValue(extracted.capacity)
        
        // Fallback: Extract from features field if capacity not found
        if (!capacityVal && extracted.attributes?.features) {
          const features = String(extracted.attributes.features)
          // Pattern: "16GB Unified Memory, 1TB SSD Storage" - more flexible to handle variations
          const capacityPattern = /(\d+\s*(?:GB|TB))\s*(?:Unified\s*)?Memory[,\s]+(\d+\s*(?:GB|TB))\s*SSD\s*Storage/i
          const match = features.match(capacityPattern)
          if (match && match[1] && match[2]) {
            capacityVal = `${match[1]} Unified Memory, ${match[2]} SSD Storage`
            console.log('[Admin] ✅ Extracted capacity from features field:', capacityVal)
          } else {
            // Fallback: Try combining ram and hardDiskSize if available
            const ram = extracted.attributes?.ram || extracted.attributes?.memoryStorageCapacity || ''
            const storage = extracted.attributes?.hardDiskSize || ''
            if (ram && storage) {
              const ramMatch = String(ram).match(/(\d+)\s*(GB|TB)/i)
              const storageMatch = String(storage).match(/(\d+)\s*(GB|TB)/i)
              if (ramMatch && storageMatch) {
                capacityVal = `${ramMatch[1]}${ramMatch[2]} Unified Memory, ${storageMatch[1]}${storageMatch[2]} SSD Storage`
                console.log('[Admin] ✅ Extracted capacity from ram + storage:', capacityVal)
              }
            }
          }
        }
        
        console.log('[Admin] colorVal (processed):', colorVal, 'isValid:', isValidVariantValue(colorVal))
        console.log('[Admin] sizeVal (processed):', sizeVal, 'isValid:', isValidVariantValue(sizeVal))
        console.log('[Admin] styleVal (processed):', styleVal, 'isValid:', isValidVariantValue(styleVal))
        console.log('[Admin] configVal (processed):', configVal, 'isValid:', isValidVariantValue(configVal))
        console.log('[Admin] capacityVal (processed):', capacityVal, 'isValid:', isValidVariantValue(capacityVal))
        console.log('[Admin] extracted.attributes?.features:', extracted.attributes?.features)
        console.log('[Admin] extracted.attributes?.ram:', extracted.attributes?.ram)
        console.log('[Admin] extracted.attributes?.hardDiskSize:', extracted.attributes?.hardDiskSize)
        
        // Additional validation: reject shape values for style (e.g., "SQUARE" is shape, not style)
        const isValidStyleValue = (val: string | undefined): boolean => {
          if (!val || !isValidVariantValue(val)) return false
          const lower = val.toLowerCase()
          // Reject shape-related values
          if (lower === 'square' || lower === 'round' || lower === 'rectangle' || lower.includes('shape')) {
            console.log('[Admin] ⚠️ Rejected shape value for style:', val)
            return false
          }
          return true
        }
        
        if (isValidVariantValue(colorVal)) extractedVariants.color = colorVal!.trim()
        if (isValidVariantValue(sizeVal)) extractedVariants.size = sizeVal!.trim()
        if (isValidStyleValue(styleVal)) extractedVariants.style = styleVal!.trim()
        if (isValidVariantValue(configVal)) extractedVariants.configuration = configVal!.trim()
        // Quart-based capacity (e.g. "4 Quarts", "4 QT") goes in size only, not capacity
        const capacityStr = capacityVal ? String(capacityVal).trim() : ''
        const isQuartCapacity = /^\d+\s*Quarts?$/i.test(capacityStr) || /^\d+\s*QT$/i.test(capacityStr)
        if (isValidVariantValue(capacityVal)) {
          if (isQuartCapacity) {
            if (!extractedVariants.size) {
              extractedVariants.size = capacityStr
              console.log('[Admin] Quart capacity mapped to size (not capacity):', capacityStr)
            }
          } else {
            extractedVariants.capacity = capacityStr
          }
        }
        
        setVariantOptions(extractedVariants)
        console.log('[Admin] Final extracted variant options for I Wish display:', extractedVariants)
        
        // Filter out ALL variant-related properties from extracted attributes
        // Variant options (Color, Size, Style, Configuration/Set) will be selected in "Add to My Wishlist" modal
        // Only keep static product specifications here - exclude anything shown in Selected Options
        let filteredAttributes = null
        if (extracted.attributes) {
          const variantKeys = [
            // Variant options - these are selectable, not static specs
            'color', 'size', 'style', 'configuration', 'set',
            // Variant-related arrays and options
            'colorVariants', 'sizeOptions', 'combinedVariants', 'styleOptions',
            'styleName', 'patternName', 'configurationOptions',
            // Internal fields
            'customFields', 'customBadges', 'model'
          ]
          const restAttributes: Record<string, any> = {}
          for (const [key, value] of Object.entries(extracted.attributes)) {
            const keyLower = key.toLowerCase()
            if (!variantKeys.includes(keyLower) && value !== null && value !== undefined && value !== '') {
              restAttributes[key] = value
            }
          }
          // Only keep attributes if there are any non-excluded properties
          if (Object.keys(restAttributes).length > 0) {
            filteredAttributes = restAttributes
          }
          console.log('[Admin] Extracted attributes after filtering:', filteredAttributes)
        }
        
        setExtractedProduct({
          productName: extracted.productName || null,
          image: imageValue,
          imageUrl: imageValue, // Added for consistency with form data
          category: categoryValue,
          source: sourceValue,
          price: priceValue,
          originalPrice: originalPriceValue,
          rating: ratingValue,
          reviewCount: reviewCountValue,
          brand: (() => {
            const brandValue = extracted.attributes?.brand || extracted.brand
            // Filter out "Unknown" and empty values
            if (!brandValue || brandValue.toString().toLowerCase().trim() === 'unknown' || brandValue.toString().trim() === '') {
              return null
            }
            return brandValue.toString().trim()
          })(),
          amazonChoice: extracted.amazonChoice || false,
          bestSeller: extracted.bestSeller || false,
          // Include filtered product attributes (excluding color, size, style)
          attributes: filteredAttributes,
        })
        
        // Auto-populate productAttributes from extracted data
        // Only include STATIC product specifications, NOT variant options
        const attrPairs: Array<{id: string, name: string, value: string}> = []
        let attrIdCounter = 0
        
        // Variant options to exclude - these are selectable in "Add to My Wishlist" modal
        // NOTE: 'capacity' is a variant option (users can choose different memory/storage) - NOT a static spec
        // NOTE: 'brand' and 'model' are now included in Product Attributes (even though brand has a separate field)
        const variantOptionsToExclude = [
          'color', 'size', 'style', 'configuration', 'set', 'capacity',
          'colorVariants', 'sizeOptions', 'combinedVariants', 'styleOptions',
          'styleName', 'patternName', 'configurationOptions',
          'customFields', 'customBadges'
        ]
        
        // Helper to format attribute name with first letter caps and spaces
        // e.g., "itemWeight" -> "Item Weight", "coffeeMakerType" -> "Coffee Maker Type"
        const formatAttrName = (name: string): string => {
          // Split camelCase into words
          const words = name.replace(/([A-Z])/g, ' $1').trim()
          // Capitalize first letter of each word
          return words.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ')
        }
        
        // Helper to add attribute if valid (only static specs, not variants)
        // Exclude variant options (Set, Configuration, etc.) - they are in Selected Options only
        const addAttr = (name: string, value: any) => {
          const nameLower = name.toLowerCase()
          if (!variantOptionsToExclude.includes(nameLower) && value && !attrPairs.find(p => p.name === formatAttrName(name))) {
            const strValue = typeof value === 'string' ? value : String(value)
            if (strValue && strValue !== 'null' && strValue !== 'undefined' && strValue.trim() !== '') {
              // Format the attribute name with proper capitalization
              const formattedName = formatAttrName(name)
              attrPairs.push({ id: `attr-${Date.now()}-${attrIdCounter++}`, name: formattedName, value: strValue })
            }
          }
        }
        
        // Define Amazon's standard display order for product specs
        // This matches the order shown on Amazon product pages above "About this item"
        const amazonSpecOrder = [
          // Brand and Model (shown first)
          'brand', 'modelName', 'model',
          // Watch/Wearables - Amazon standard order (matches user's expected order)
          'operatingSystem', 'memoryStorageCapacity', 'specialFeature', 'specialFeatures',
          'batteryCapacity', 'connectivityTechnology', 'wirelessCommunicationStandard',
          'batteryCellComposition', 'gps', 'shape', 'screenSize', 'displayType', 'waterResistance',
          // Audio/Headphones
          'earPlacement', 'formFactor', 'noiseControl', 'impedance', 'connectivity', 'wirelessType',
          'compatibleDevices', 'batteryLife',
          // Kitchen/Appliances
          'coffeeMakerType', 'filterType', 'finishType', 'numberOfSettings', 'maximumPressure',
          'heatingElement', 'includedComponents', 'waterTankCapacity',
          // NOTE: 'capacity' is NOT here - it's a variant option (excluded above) for products like MacBooks
          // Electronics general - CPU, RAM, Storage, Graphics
          'processorType', 'cpuModel', 'cpu', 'ramSize', 'ram', 'ramMemoryInstalledSize', 'memoryInstalledSize',
          'storageCapacity', 'hardDiskSize', 'hardDriveSize', 'ssdCapacity',
          'graphicsCardDescription', 'graphicsCard', 'graphicsProcessor',
          'resolution', 'refreshRate',
          // General specs (shown last)
          'material', 'wattage', 'voltage', 'powerSource', 'controlMethod',
          'sensorType', 'bandMaterial', 'caseMaterial',
          'productDimensions', 'itemWeight', 'caratWeight',
          'manufacturer', 'countryOfOrigin',
          'outputWattage', 'inputVoltage', 'itemModelNumber', 'asin', 'upc', 'productType',
          'numberOfItems', 'numberOfPieces', 'assemblyRequired', 'batteryRequired', 'batteriesIncluded'
        ]
        
        // Collect all available specs from all sources into a single object
        const allSpecs: Record<string, any> = {}
        
        // Gather from specsLocations (productSpecifications, specs, etc.)
        const specsLocations = [
          extracted.productSpecifications,
          extracted.specs,
          extracted.specifications,
          extracted.technicalDetails,
          extracted.techSpecs,
          extracted.productDetails,
          extracted.details,
        ].filter(Boolean)
        
        for (const specs of specsLocations) {
          if (specs && typeof specs === 'object') {
            for (const [key, value] of Object.entries(specs)) {
              const keyLower = key.toLowerCase().replace(/\s+/g, '')
              // Only exclude variant options, not brand/model
              if (keyLower === 'color' || keyLower === 'size' || keyLower === 'style' || keyLower === 'configuration' || keyLower === 'set') continue
              if (value && String(value).trim()) {
                allSpecs[key] = value
              }
            }
          }
        }
        
        // Gather from filteredAttributes (already excludes variant options)
        if (filteredAttributes && Object.keys(filteredAttributes).length > 0) {
          for (const [key, value] of Object.entries(filteredAttributes)) {
            if (value && String(value).trim()) {
              allSpecs[key] = value
            }
          }
        }
        
        // Gather from extracted.attributes (skip Set/Configuration - they go to Selected Options only)
        if (extracted.attributes) {
          const skipKeys = ['color', 'size', 'style', 'configuration', 'set']
          for (const [key, value] of Object.entries(extracted.attributes)) {
            if (skipKeys.includes(key.toLowerCase())) continue
            if (value && String(value).trim()) {
              allSpecs[key] = value
            }
          }
        }
        
        // Gather from top-level extracted
        for (const attrName of amazonSpecOrder) {
          const value = extracted[attrName]
          if (value && String(value).trim() && !allSpecs[attrName]) {
            allSpecs[attrName] = value
          }
        }
        
        // Now add specs in the defined Amazon order
        const addedKeys = new Set<string>()
        
        // Helper to normalize key for comparison
        const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, '')
        
        for (const specKey of amazonSpecOrder) {
          const normalizedSpecKey = normalizeKey(specKey)
          
          // Find matching key in allSpecs (case-insensitive)
          let matchedKey: string | null = null
          let value: any = null
          
          for (const [key, val] of Object.entries(allSpecs)) {
            if (normalizeKey(key) === normalizedSpecKey) {
              matchedKey = key
              value = val
              break
            }
          }
          
          if (value && !addedKeys.has(normalizedSpecKey)) {
            addAttr(specKey, value)
            addedKeys.add(normalizedSpecKey)
            if (matchedKey) addedKeys.add(normalizeKey(matchedKey))
          }
        }
        
        // Add any remaining specs that weren't in our defined order (at the end)
        for (const [key, value] of Object.entries(allSpecs)) {
          const normalizedKey = normalizeKey(key)
          if (!addedKeys.has(normalizedKey) && !variantOptionsToExclude.includes(key.toLowerCase())) {
            addAttr(key, value)
            addedKeys.add(normalizedKey)
          }
        }
        
        // Add Brand to Product Attributes if it exists (even though it has a separate field)
        // Get brand from extracted data, not extractedProduct (which may not be set yet)
        const brandValue = extracted.attributes?.brand || extracted.brand
        if (brandValue && brandValue.toString().toLowerCase().trim() !== 'unknown' && brandValue.toString().trim() !== '') {
          const brandNormalized = normalizeKey('brand')
          if (!addedKeys.has(brandNormalized)) {
            addAttr('brand', brandValue)
            addedKeys.add(brandNormalized)
          }
        }
        
        console.log('[Admin] Static product specs (excluding variant options):', { 
          filteredAttributes, 
          extractedAttrs: extracted.attributes,
          specs: extracted.productSpecifications || extracted.specs,
          brand: extracted.brand || extracted.attributes?.brand,
          earPlacement: extracted.attributes?.earPlacement,
          formFactor: extracted.attributes?.formFactor,
          impedance: extracted.attributes?.impedance,
          noiseControl: extracted.attributes?.noiseControl,
        })
        console.log('[Admin] Product Attributes (static specs only):', attrPairs)

        if (attrPairs.length > 0) {
          // Include ALL product attributes (no limit)
          setProductAttributes(attrPairs)
          console.log('[Admin] ✅ Auto-populated productAttributes (all):', attrPairs)
        } else {
          // Clear any existing attributes if none found
          setProductAttributes([])
          console.log('[Admin] ⚠️ No product attributes found to auto-populate')
        }
        
        // Auto-fill form fields with extracted data
        setFormData((prev) => ({
          ...prev,
          productName: extracted.productName || prev.productName,
          image: extracted.imageUrl || extracted.image || extracted.productImageUrl || prev.image,
          category: extracted.category || prev.category,
          source: extracted.storeName || extracted.source || extractSourceFromUrl(url) || prev.source,
          rating: extracted.rating?.toString() || extracted.averageRating?.toString() || prev.rating,
          reviewCount: extracted.reviewCount?.toString() || extracted.numReviews?.toString() || extracted.reviewCount?.toString() || prev.reviewCount,
          price: extracted.salePrice?.toString() || extracted.price?.toString() || prev.price,
          originalPrice: extracted.originalPrice?.toString() || extracted.listPrice?.toString() || extracted.price?.toString() || prev.originalPrice,
          amazonChoice: url.includes("amazon.com") && (extracted.amazonChoice || prev.amazonChoice),
          bestSeller: url.includes("amazon.com") && (extracted.bestSeller || prev.bestSeller),
        }))

        toast.success("Product details extracted successfully! Please review and adjust as needed.")
      } else {
        let errorMessage = "Failed to extract product details"
        try {
          const error = await response.json()
          errorMessage = error.error || error.details || error.message || errorMessage
          
          // If AI extraction is not configured, show a helpful message instead of error
          if (errorMessage.includes("not configured") || errorMessage.includes("OPENAI")) {
            toast.info("AI extraction not available. Please fill product details manually.")
            return
          }
          
          if (Object.keys(error).length === 0) {
            errorMessage = `Failed to extract product details (HTTP ${response.status})`
          }
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = `Failed to extract product details: ${response.statusText || `HTTP ${response.status}`}`
        }
        console.error("Extraction error:", errorMessage)
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error("Error extracting product:", error)
      const errorMessage = error instanceof Error ? error.message : "Network error occurred"
      toast.error(`Failed to extract product details: ${errorMessage}. Please fill manually.`)
    } finally {
      setIsExtracting(false)
    }
  }

  const extractSourceFromUrl = (url: string): string => {
    try {
      const hostname = new URL(url).hostname
      if (hostname.includes("amazon")) return "Amazon"
      if (hostname.includes("ebay")) return "eBay"
      if (hostname.includes("walmart")) return "Walmart"
      if (hostname.includes("target")) return "Target"
      if (hostname.includes("bestbuy")) return "Best Buy"
      if (hostname.includes("macys")) return "Macy's"
      // Extract domain name (e.g., "example.com" -> "Example")
      return hostname.split(".")[0].charAt(0).toUpperCase() + hostname.split(".")[0].slice(1)
    } catch {
      return ""
    }
  }

  const handleAddToWishlist = async (product: AffiliateProduct) => {
    if (!user) {
      toast.error("Authentication Required", {
        description: "Please log in to add products to Trending Gifts.",
        duration: 4000,
      })
      return
    }

    // Validate required fields before making the request
    if (!product.productName || !product.price || !product.image || !product.productLink) {
      const missingFields = []
      if (!product.productName) missingFields.push('Product Name')
      if (!product.price) missingFields.push('Price')
      if (!product.image) missingFields.push('Image')
      if (!product.productLink) missingFields.push('Product Link')
      
      toast.error("Missing Required Fields", {
        description: `Please fill in: ${missingFields.join(', ')}`,
        duration: 4000,
      })
      return
    }

    setAddingToWishlist(product.id)
    try {
      const description = `${product.productName} from ${product.source}`

      const requestBody = {
        productName: product.productName,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        source: product.source,
        productLink: product.productLink,
        category: product.category,
        rating: product.rating,
        reviewCount: product.reviewCount,
        amazonChoice: product.amazonChoice || false,
        bestSeller: product.bestSeller || false,
        description: description,
        // Include all product attributes/specifications
        attributes: product.attributes || undefined,
      }

      console.log('[handleAddToWishlist] Sending request:', {
        productName: requestBody.productName,
        price: requestBody.price,
        hasImage: !!requestBody.image,
        hasProductLink: !!requestBody.productLink,
        category: requestBody.category
      })

      const response = await fetch("/api/trending-gifts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`[handleAddToWishlist] Product added to trending gifts:`, result)
        
        // Remove product from affiliate products list after successfully adding to trending gifts
        try {
          const deleteResponse = await fetch(`/api/admin/affiliate-products/${product.id}`, {
            method: "DELETE",
          })
          if (deleteResponse.ok) {
            // Update local state to remove the product from the list
            setProducts(prev => prev.filter(p => p.id !== product.id))
            console.log(`[handleAddToWishlist] Product removed from affiliate products list`)
          }
        } catch (deleteError) {
          console.error(`[handleAddToWishlist] Error removing from affiliate products:`, deleteError)
        }
        
        toast.success("Added to Trending Gifts!", {
          description: `"${product.productName.length > 50 ? product.productName.substring(0, 50) + '...' : product.productName}" has been added and removed from this list.`,
          action: {
            label: "View Trending Gifts",
            onClick: () => router.push("/gifts/trending"),
          },
          duration: 5000,
        })
      } else {
        // Default messages for common status codes
        const defaultMessages: Record<number, string> = {
          409: "This product is already in Trending Gifts.",
          401: "Please log in to add products to Trending Gifts.",
          400: "Please check that all required fields are filled.",
          500: "Server error. Please try again later."
        }
        
        // Get error message from response (silently handle expected errors)
        let errorMessage = defaultMessages[response.status] || response.statusText || 'Unknown error'
        let existingProductLink: string | null = null
        const isExpectedError = response.status === 409 // Duplicate is expected, not an error
        
        try {
          const contentType = response.headers.get('content-type') || ''
          if (contentType.includes('application/json')) {
            const jsonText = await response.text()
            if (jsonText && jsonText.trim()) {
              try {
                const error = JSON.parse(jsonText)
                if (error && typeof error === 'object' && Object.keys(error).length > 0) {
                  errorMessage = error.message || error.error || error.details || errorMessage
                  existingProductLink = error.existingProductLink || null
                }
              } catch {
                // Not valid JSON, use default message
              }
            }
          }
        } catch {
          // Silently use default message
        }
        
        // Only log unexpected errors (not 409 duplicates)
        if (!isExpectedError) {
          console.error(`[handleAddToWishlist] Error (status ${response.status}):`, errorMessage)
        }
        
        // Handle duplicate product (409 Conflict) - show friendly message with link to view
        if (response.status === 409) {
          toast.warning("🐝 Already Added", {
            description: errorMessage,
            duration: 5000,
            action: {
              label: "View Trending Gifts",
              onClick: () => router.push("/gifts/trending"),
            },
          })
        } else if (response.status === 401) {
          toast.error("Authentication Required", {
            description: errorMessage,
            duration: 4000,
          })
        } else if (response.status === 400) {
          toast.error("Invalid Request", {
            description: errorMessage,
            duration: 4000,
          })
        } else {
          toast.error("Failed to add product", {
            description: errorMessage,
            duration: 4000,
          })
        }
      }
    } catch (error) {
      console.error("Error adding to trending gifts:", error)
      toast.error("Failed to add product", {
        description: "Unable to connect to the server. Please check your connection and try again.",
        duration: 4000,
      })
    } finally {
      setAddingToWishlist(null)
    }
  }

  const handleSave = async () => {
    // Validate required fields - use extractedProduct for validation
    if (!extractedProduct?.productName?.trim()) {
      toast.error("Product name is required")
      return
    }
    if (!extractedProduct?.category?.trim()) {
      toast.error("Category is required")
      return
    }
    if (!extractedProduct?.source?.trim()) {
      toast.error("Store is required")
      return
    }
    if (!extractedProduct?.price || isNaN(parseFloat(extractedProduct.price.toString()))) {
      toast.error("Valid price is required")
      return
    }

    // Check for duplicate product (only when adding new, not editing)
    if (!isEditModalOpen) {
      const productLink = formData.productLink || extractedProduct.productLink || ""
      const productName = extractedProduct.productName.trim().toLowerCase()
      
      // Check if product with same link already exists
      const duplicateByLink = products.find(p => 
        p.productLink && productLink && 
        p.productLink.toLowerCase() === productLink.toLowerCase()
      )
      
      if (duplicateByLink) {
        toast.error("Duplicate Product", {
          description: "A product with this URL already exists in your catalog.",
          duration: 5000,
        })
        return
      }
      
      // Check if product with same name already exists
      const duplicateByName = products.find(p => 
        p.productName && p.productName.trim().toLowerCase() === productName
      )
      
      if (duplicateByName) {
        toast.error("Duplicate Product", {
          description: `"${extractedProduct.productName}" already exists in your catalog.`,
          duration: 5000,
        })
        return
      }
    }

    setIsSaving(true)
    try {
      // Ensure we have a valid product ID when editing
      if (isEditModalOpen && !editingProduct?.id) {
        toast.error("Product ID is missing. Please refresh and try again.")
        setIsSaving(false)
        return
      }

      const url = isEditModalOpen && editingProduct
        ? `/api/admin/affiliate-products/${editingProduct.id}`
        : "/api/admin/affiliate-products"

      const method = isEditModalOpen ? "PUT" : "POST"
      
      console.log(`[handleSave] ${method} request to: ${url}`)
      console.log(`[handleSave] Editing product ID:`, editingProduct?.id)

      const payload: any = {
        productName: extractedProduct.productName.trim(),
        image: (extractedProduct.image || extractedProduct.imageUrl || "").trim() || undefined,
        category: extractedProduct.category.trim(),
        source: extractedProduct.source.trim(),
        rating: extractedProduct.rating !== null && extractedProduct.rating !== undefined ? parseFloat(extractedProduct.rating.toString()) : 0,
        reviewCount: extractedProduct.reviewCount !== null && extractedProduct.reviewCount !== undefined ? parseFloat(extractedProduct.reviewCount.toString()) : 0,
        price: parseFloat(extractedProduct.price.toString()),
        originalPrice: extractedProduct.originalPrice !== null && extractedProduct.originalPrice !== undefined ? parseFloat(extractedProduct.originalPrice.toString()) : undefined,
        productLink: isEditModalOpen && editingProduct 
          ? (editingProduct.productLink || extractedProduct.productLink || formData.productLink || "").trim() || undefined
          : (formData.productLink || extractedProduct.productLink || "").trim() || undefined,
        amazonChoice: extractedProduct?.amazonChoice ?? formData.amazonChoice,
        bestSeller: extractedProduct?.bestSeller ?? formData.bestSeller,
        // Include variant options (Style, Color, Size, Configuration, Capacity) as top-level fields
        style: variantOptions.style || undefined,
        color: variantOptions.color || undefined,
        size: variantOptions.size || undefined,
        configuration: variantOptions.configuration || undefined,
        capacity: variantOptions.capacity || undefined,
        // Include ALL product specifications/attributes dynamically
        attributes: (() => {
          // Start with an EMPTY object - only include what user has in productAttributes
          const attrs: Record<string, any> = {}
          
          // Add brand if it exists and is not "Unknown"
          if (extractedProduct.brand) {
            const brandValue = extractedProduct.brand.toString().trim()
            if (brandValue && brandValue.toLowerCase() !== 'unknown') {
              attrs.brand = brandValue
            }
          }
          
          // Keep ONLY variant arrays from extracted attributes (these are needed for variant detection)
          // These are not editable in the UI, but needed for "Add to My Wishlist" modal logic
          const variantArrayKeys = ['colorVariants', 'sizeOptions', 'styleOptions', 'combinedVariants', 'configurationOptions']
          if (extractedProduct.attributes) {
            variantArrayKeys.forEach(key => {
              if (extractedProduct.attributes[key]) {
                attrs[key] = extractedProduct.attributes[key]
              }
            })
          }
          
          // Add ONLY the product attributes from the user-edited dynamic list
          // This respects user deletions - deleted items won't be included
          productAttributes.filter(a => a.name && a.value).forEach(attr => {
            attrs[attr.name] = attr.value
          })
          
          console.log('[handleSave] Product attributes from UI:', productAttributes.map(a => a.name))
          
          // Add custom fields if any
          if (customFields.filter(f => f.name && f.value).length > 0) {
            attrs.customFields = customFields.filter(f => f.name && f.value)
          }
          
          // Add custom badges if any
          if (customBadges.filter(b => b.name).length > 0) {
            attrs.customBadges = customBadges.filter(b => b.name)
          }
          
          // Filter out empty/null/undefined values
          const cleanedAttrs: Record<string, any> = {}
          Object.entries(attrs).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
              cleanedAttrs[key] = value
            }
          })
          
          console.log('[handleSave] Final attributes to save:', cleanedAttrs)
          
          return Object.keys(cleanedAttrs).length > 0 ? cleanedAttrs : undefined
        })(),
      }

      console.log(`[handleSave] ${method} request to: ${url}`)
      console.log(`[handleSave] Editing product ID:`, editingProduct?.id)
      console.log(`[handleSave] Payload:`, JSON.stringify(payload, null, 2))
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      console.log(`[handleSave] Response status: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const result = await response.json()
        console.log(`[handleSave] Success:`, result)
        
        toast.success(isEditModalOpen ? "Product updated successfully" : "Product added successfully")
        
        // Update local state immediately for instant UI feedback
        if (isEditModalOpen && result.product && editingProduct?.id) {
          const productId = String(editingProduct.id)
          console.log(`[handleSave] Updating local state for product ID: ${productId}`)
          console.log(`[handleSave] Updated product data:`, result.product)
          
          setProducts((prevProducts) => {
            // Create a new array to ensure React detects the change
            const updatedProducts = prevProducts.map((p) => {
              const pId = String(p.id)
              if (pId === productId) {
                // Create a completely new object with all updated fields
                const updated: AffiliateProduct = {
                  ...p,
                  productName: result.product.productName ?? p.productName,
                  image: result.product.image ?? p.image,
                  category: result.product.category ?? p.category,
                  source: result.product.source ?? p.source,
                  rating: result.product.rating ?? p.rating,
                  reviewCount: result.product.reviewCount ?? p.reviewCount,
                  price: result.product.price ?? p.price,
                  originalPrice: result.product.originalPrice ?? p.originalPrice,
                  productLink: result.product.productLink ?? p.productLink,
                  amazonChoice: result.product.amazonChoice ?? p.amazonChoice,
                  bestSeller: result.product.bestSeller ?? p.bestSeller,
                  id: p.id, // Preserve original ID
                }
                console.log(`[handleSave] Found and updated product:`, updated)
                return updated
              }
              // Return new object reference for unchanged products too
              return { ...p }
            })
            
            // If product wasn't found in the list, add it
            const productExists = updatedProducts.some((p) => String(p.id) === productId)
            if (!productExists && result.product) {
              console.log(`[handleSave] Product not found in list, adding it`)
              updatedProducts.push({ ...result.product, id: editingProduct.id } as AffiliateProduct)
            }
            
            console.log(`[handleSave] Final products count: ${updatedProducts.length}`)
            // Return new array reference
            return [...updatedProducts]
          })
        }
        
        setIsAddModalOpen(false)
        setIsEditModalOpen(false)
        setEditingProduct(null)
        resetForm()
        
        // For edit mode, skip fetchProducts to preserve the immediate update
        // For add mode, fetchProducts to get the new product with its ID
        if (!isEditModalOpen) {
          await fetchProducts()
        } else {
          // Small delay to ensure state update is processed
          setTimeout(() => {
            console.log(`[handleSave] State update complete, current products:`, products.length)
          }, 100)
        }
      } else {
        let error: any = {}
        try {
          const text = await response.text()
          console.log(`[handleSave] Error response text:`, text)
          if (text) {
            try {
              error = JSON.parse(text)
            } catch {
              error = { error: text || `HTTP ${response.status}: ${response.statusText}` }
            }
          } else {
            error = { error: `HTTP ${response.status}: ${response.statusText}` }
          }
        } catch (parseError) {
          console.error(`[handleSave] Failed to parse error response:`, parseError)
          error = { error: `HTTP ${response.status}: ${response.statusText}` }
        }
        
        console.error(`[handleSave] Error response:`, error)
        const errorMessage = error.error || error.message || `Failed to save product (${response.status})`
        toast.error(errorMessage)
        
        if (error.availableIds) {
          console.error(`[handleSave] Available product IDs:`, error.availableIds)
        }
        
        // Log additional debugging info
        console.error(`[handleSave] Request URL: ${url}`)
        console.error(`[handleSave] Request method: ${method}`)
        console.error(`[handleSave] Product ID being updated:`, editingProduct?.id)
      }
    } catch (error) {
      console.error("Error saving product:", error)
      toast.error("Failed to save product")
    } finally {
      setIsSaving(false)
    }
  }

  // Filter and sort products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    const matchesSource = selectedSource === "all" || product.source.toLowerCase() === selectedSource.toLowerCase()

    return matchesSearch && matchesCategory && matchesSource
  })

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "popularity":
        return b.reviewCount - a.reviewCount
      case "rating":
        return b.rating - a.rating
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "name":
        return a.productName.localeCompare(b.productName)
      default:
        return 0
    }
  })

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + itemsPerPage)

  // Get unique categories and sources
  const categories = Array.from(new Set(products.map((p) => p.category))).sort()
  const sources = Array.from(new Set(products.map((p) => p.source))).sort()

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#DAA520] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#654321] font-semibold">Loading...</p>
        </div>
      </div>
    )
  }

  const userEmail = user?.email?.toLowerCase().trim()
  const adminEmail = ADMIN_EMAIL.toLowerCase().trim()
  if (!user || userEmail !== adminEmail) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors text-xs sm:text-sm md:text-base"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          Back to Home
        </Link>

        <div className="mb-8">
          {/* Header */}
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <div className="flex flex-row items-center justify-center gap-2">
              <Package className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#DAA520] flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-foreground whitespace-nowrap">
                Affiliate Products
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2">
              Manage your affiliate product catalog with AI-powered extraction
            </p>
          </div>
        </div>

        {/* Stats and Filters */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#654321]">
              Products ({filteredProducts.length})
            </h2>
            <Button
              onClick={handleOpenAddModal}
              className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520] text-xs sm:text-sm font-bold h-8 px-3 rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              Add Affiliate Product
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search affiliate products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-[#DAA520]"
                />
              </div>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#DAA520] w-4 h-4 z-10 pointer-events-none" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-8 py-2 rounded-lg border-2 border-[#DAA520]/20 focus:border-[#DAA520] focus:outline-none bg-white appearance-none cursor-pointer text-[#654321] text-sm min-w-[160px]"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#DAA520] w-4 h-4 z-10 pointer-events-none" />
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="pl-10 pr-8 py-2 rounded-lg border-2 border-[#DAA520]/20 focus:border-[#DAA520] focus:outline-none bg-white appearance-none cursor-pointer text-[#654321] text-sm min-w-[160px]"
              >
                <option value="all">All Affiliate Sources</option>
                {sources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#DAA520] w-4 h-4 z-10 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-10 pr-8 py-2 rounded-lg border-2 border-[#DAA520]/20 focus:border-[#DAA520] focus:outline-none bg-white appearance-none cursor-pointer text-[#654321] text-sm min-w-[140px]"
              >
                <option value="popularity">Sort by Popularity</option>
                <option value="rating">Sort by Rating</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-3 py-2 rounded-lg border-2 border-[#DAA520]/20 focus:border-[#DAA520] focus:outline-none bg-white cursor-pointer text-[#654321] text-sm"
              >
                <option value="10">10 / page</option>
                <option value="20">20 / page</option>
                <option value="50">50 / page</option>
              </select>
            </div>
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto">
            {sortedProducts.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500 text-sm">
                  {products.length === 0
                    ? "No affiliate products yet. Add your first product to get started!"
                    : "No products match your filters. Try adjusting your search or filters."}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-[#654321]">Product</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#654321]">Source</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#654321]">Rating</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#654321]">Reviews</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#654321]">Price</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#654321]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((product) => (
                  <tr key={product.id} className="border-b border-gray-200 hover:bg-gradient-to-r hover:from-amber-50/50 hover:to-orange-50/50 transition-all duration-200">
                    <td className="py-5 px-4">
                      <div className="flex items-center gap-4">
                        <div className="relative flex-shrink-0">
                          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center justify-center p-2">
                            <img
                              src={product.image || "/placeholder.svg"}
                              alt={product.productName}
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg"
                              }}
                            />
                          </div>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                              SALE
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                              <button 
                                type="button"
                                className="font-bold text-[#654321] text-sm sm:text-base mb-1.5 line-clamp-2 leading-tight cursor-pointer min-h-[2.5rem] text-left w-full bg-transparent border-0 p-0 hover:text-[#8B4513] transition-colors"
                                title={product.productName}
                              >
                                {product.productName}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent 
                              className="max-w-[500px] bg-[#4A2F1A] text-white text-sm p-3 rounded-lg shadow-xl z-[9999]"
                              side="top"
                              sideOffset={8}
                            >
                              <p className="break-words whitespace-normal leading-relaxed">{product.productName}</p>
                            </TooltipContent>
                          </Tooltip>
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full whitespace-nowrap">
                            <Package className="w-3 h-3 text-[#DAA520] flex-shrink-0" />
                            <span className="text-xs font-semibold text-[#8B4513] truncate max-w-[150px]">{product.category}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-[#654321]">{product.source}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {product.amazonChoice && (
                            <Badge className="bg-[#232F3E] text-[#FFFFFF] text-[10px] font-bold px-2 py-0.5 border-0 shadow-sm">
                              Amazon's Choice
                            </Badge>
                          )}
                          {product.bestSeller && (
                            <Badge className="bg-[#D14900] text-white text-[10px] font-bold px-2 py-0.5 border-0 shadow-sm">
                              #1 Best Seller
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((starPosition) => {
                            const rating = product.rating || 0
                            const fillAmount = Math.max(0, Math.min(1, rating - (starPosition - 1)))
                            const fillPercent = Math.round(fillAmount * 100)
                            const gradientId = `star-gradient-${product.id}-${starPosition}`
                            
                            return (
                              <svg
                                key={starPosition}
                                className="w-4 h-4 sm:w-5 sm:h-5"
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
                        <span className="text-sm font-bold text-[#654321]">{(product.rating || 0).toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <div className="text-sm font-medium text-gray-700">
                        <span className="text-[#654321] font-semibold">{product.reviewCount.toLocaleString()}</span>
                        <span className="text-gray-500 ml-1">reviews</span>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          {product.originalPrice && product.originalPrice > product.price ? (
                            <>
                              <span className="text-xs line-through text-gray-400">${product.originalPrice.toFixed(2)}</span>
                              <span className="text-lg font-bold text-[#654321]">${product.price.toFixed(2)}</span>
                              <span className="text-[10px] font-semibold text-red-600">
                                Save ${(product.originalPrice - product.price).toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-[#654321]">${product.price.toFixed(2)}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditModal(product)}
                            className="border-[#F59E0B] text-[#F59E0B] hover:bg-gradient-to-r hover:from-[#F59E0B] hover:to-[#FBBF24] hover:text-white hover:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDeletingProductId(product.id)
                              setIsDeleteModalOpen(true)
                            }}
                            className="border-[#DC2626] text-[#DC2626] hover:bg-gradient-to-r hover:from-[#DC2626] hover:to-[#EF4444] hover:text-white hover:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => handleAddToWishlist(product)}
                          disabled={addingToWishlist === product.id || !user}
                          className="h-8 px-3 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520] text-xs sm:text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                          {addingToWishlist === product.id ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            "Add to Trending Gifts"
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedProducts.length)} of {sortedProducts.length} products
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="border-[#8B4513] text-[#8B4513] hover:bg-[#8B4513] hover:text-white"
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={
                        currentPage === pageNum
                          ? "bg-[#DAA520] text-white"
                          : "border-[#8B4513] text-[#8B4513] hover:bg-[#8B4513] hover:text-white"
                      }
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="border-[#8B4513] text-[#8B4513] hover:bg-[#8B4513] hover:text-white"
                >
                  Next &gt;
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false)
                setDeletingProductId(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => deletingProductId && handleDelete(deletingProductId)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Product Modal */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => {
        setIsAddModalOpen(open)
        setIsEditModalOpen(open)
        if (!open) {
          setEditingProduct(null)
          resetForm()
        }
      }}>
              <DialogContent className="max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 [&>button[data-slot='dialog-close']]:top-4 [&>button[data-slot='dialog-close']]:right-4 [&>button[data-slot='dialog-close']]:z-50">
                <DialogHeader>
                  <div className="bg-card border border-border rounded-lg p-6 mb-6">
                    <div className="flex flex-row items-center justify-center gap-2">
                      <Package className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#DAA520] flex-shrink-0" />
                      <DialogTitle className="text-xl sm:text-3xl md:text-4xl font-bold text-foreground whitespace-nowrap">
                        {isEditModalOpen ? "Edit Product" : "Add Affiliate Product"}
                      </DialogTitle>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2">
                      {isEditModalOpen
                        ? "Update affiliate product details"
                        : "Extract and add new products to your affiliate catalog"}
                    </p>
                  </div>
                  <DialogDescription className="sr-only">
                    {isEditModalOpen ? "Edit the details of this affiliate product" : "Add a new affiliate product to the system"}
                  </DialogDescription>
                </DialogHeader>
          <div className="pt-2 pb-4 space-y-4">
            {/* Product Link - Only show when adding, not when editing */}
            {!isEditModalOpen && (
              <div className="mb-16">
                <label htmlFor="productLink" className="block text-sm font-semibold text-gray-700 mb-2">
                  Product URL <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Input
                      id="productLink"
                      type="text"
                      value={formData.productLink}
                      onChange={(e) => handleProductLinkChange(e.target.value)}
                      onPaste={(e) => {
                        const pastedText = e.clipboardData.getData("text").trim()
                        if (pastedText.startsWith("http")) {
                          e.preventDefault() // Prevent default paste to avoid double input
                          handleAutoExtract(pastedText)
                        }
                      }}
                      placeholder="Paste product link to extract product details"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-xs sm:text-sm md:text-base"
                      disabled={isExtracting}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleExtractProduct}
                    disabled={isExtracting || !formData.productLink.trim()}
                    className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 whitespace-nowrap"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        Extracting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        AI Extract
                      </>
                    )}
                  </Button>
                </div>
                
              </div>
            )}

            {/* Product Extract Details Widget - Show when extracted or when editing */}
            {extractedProduct && (
              <div className="mt-6">
                <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-[#F4C430] rounded-xl p-6 shadow-xl">
                  {/* Header section - Only show when adding (not editing) */}
                  {!isEditModalOpen && (
                    <div className="bg-card border border-border rounded-lg p-4 sm:p-5 mb-4 sm:mb-5">
                      <div className="flex flex-row items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 text-[#DAA520] flex-shrink-0" />
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground whitespace-nowrap">
                          Extracted Product
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Review and edit the extracted product details before adding to your catalog
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-5">
                    {/* Product Image */}
                    <div className="bg-white rounded-xl p-4 shadow-md border border-amber-200">
                      <label className="block text-sm font-bold text-[#654321] mb-3 text-center">Product Image</label>
                      <div className="w-full h-[500px] sm:h-[600px] md:h-[700px] bg-white rounded-xl overflow-auto border-2 border-amber-300 shadow-inner flex items-center justify-center">
                        {extractedProduct?.image ? (
                          <img
                            src={extractedProduct.image}
                            alt={extractedProduct?.productName || "Product"}
                            className="max-w-full max-h-full w-auto h-auto object-contain"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg"
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                            <Package className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Selected Options - Variant Options from URL */}
                    {(variantOptions.style || variantOptions.color || variantOptions.size || variantOptions.configuration || variantOptions.capacity || editingOption || customVariantOptions.length > 0 || isAddingCustomOption || extractedProduct) && (
                      <div className="bg-gradient-to-br from-[#FEF7ED] via-[#FFF7ED] to-[#FFFBEB] border-2 border-[#DAA520]/40 rounded-xl p-4 shadow-lg">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#DAA520]/20">
                          <SlidersHorizontal className="w-4 h-4 text-[#DAA520]" />
                          <h4 className="text-sm font-bold text-[#8B4513]">Selected Options</h4>
                          <span className="text-[10px] text-gray-500 ml-auto">Variant options from URL</span>
                        </div>
                        <p className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded mb-2 border border-amber-200">
                          💡 <strong>Tip:</strong> If the extracted color/options don't match what you selected on Amazon, click the ✏️ pencil icon to edit them.
                        </p>
                        <div className="space-y-2">
                          {/* Style Option - Only show if has value or being edited */}
                          {(variantOptions.style || editingOption === 'style') && (
                            <div className="flex items-center gap-2 group">
                              <span className="text-xs font-semibold text-[#654321] min-w-[80px]">Style:</span>
                              {editingOption === 'style' ? (
                                <div className="flex items-center gap-1 flex-1">
                                  <Input
                                    value={editOptionValue}
                                    onChange={(e) => setEditOptionValue(e.target.value)}
                                    className="h-7 text-xs flex-1"
                                    placeholder="e.g., USB-C, Lightning"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setVariantOptions({ ...variantOptions, style: editOptionValue || undefined })
                                      setEditingOption(null)
                                      setEditOptionValue('')
                                    }}
                                    className="p-1 hover:bg-green-100 rounded"
                                  >
                                    <Check className="w-3 h-3 text-green-600" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingOption(null); setEditOptionValue('') }}
                                    className="p-1 hover:bg-red-100 rounded"
                                  >
                                    <X className="w-3 h-3 text-red-500" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="px-2 py-1 bg-[#DAA520]/20 text-[#654321] text-xs font-medium rounded-md border border-[#DAA520]/30 flex-1">
                                    {variantOptions.style}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingOption('style'); setEditOptionValue(variantOptions.style || '') }}
                                    className="p-1 hover:bg-amber-100 rounded"
                                    title="Edit Style"
                                  >
                                    <Edit2 className="w-3 h-3 text-[#F59E0B]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setVariantOptions(prev => ({ ...prev, style: undefined })) }}
                                    className="p-1 hover:bg-red-100 rounded"
                                    title="Delete Style"
                                  >
                                    <Trash2 className="w-3 h-3 text-red-500" />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                          
                          {/* Color Option - Only show if has value or being edited */}
                          {(variantOptions.color || editingOption === 'color') && (
                            <div className="flex items-center gap-2 group">
                              <span className="text-xs font-semibold text-[#654321] min-w-[80px]">Color:</span>
                              {editingOption === 'color' ? (
                                <div className="flex items-center gap-1 flex-1">
                                  <Input
                                    value={editOptionValue}
                                    onChange={(e) => setEditOptionValue(e.target.value)}
                                    className="h-7 text-xs flex-1"
                                    placeholder="e.g., Orange, Blue, Black"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setVariantOptions({ ...variantOptions, color: editOptionValue || undefined })
                                      setEditingOption(null)
                                      setEditOptionValue('')
                                    }}
                                    className="p-1 hover:bg-green-100 rounded"
                                  >
                                    <Check className="w-3 h-3 text-green-600" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingOption(null); setEditOptionValue('') }}
                                    className="p-1 hover:bg-red-100 rounded"
                                  >
                                    <X className="w-3 h-3 text-red-500" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="px-2 py-1 bg-[#DAA520]/20 text-[#654321] text-xs font-medium rounded-md border border-[#DAA520]/30 flex-1">
                                    {variantOptions.color}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingOption('color'); setEditOptionValue(variantOptions.color || '') }}
                                    className="p-1 hover:bg-amber-100 rounded"
                                    title="Edit Color"
                                  >
                                    <Edit2 className="w-3 h-3 text-[#F59E0B]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setVariantOptions(prev => ({ ...prev, color: undefined })) }}
                                    className="p-1 hover:bg-red-100 rounded"
                                    title="Delete Color"
                                  >
                                    <Trash2 className="w-3 h-3 text-red-500" />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                          
                          {/* Size Option - Only show if has value or being edited */}
                          {(variantOptions.size || editingOption === 'size') && (
                            <div className="flex items-center gap-2 group">
                              <span className="text-xs font-semibold text-[#654321] min-w-[80px]">Size:</span>
                              {editingOption === 'size' ? (
                                <div className="flex items-center gap-1 flex-1">
                                  <Input
                                    value={editOptionValue}
                                    onChange={(e) => setEditOptionValue(e.target.value)}
                                    className="h-7 text-xs flex-1"
                                    placeholder="e.g., Small, Medium, Large"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setVariantOptions({ ...variantOptions, size: editOptionValue || undefined })
                                      setEditingOption(null)
                                      setEditOptionValue('')
                                    }}
                                    className="p-1 hover:bg-green-100 rounded"
                                  >
                                    <Check className="w-3 h-3 text-green-600" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingOption(null); setEditOptionValue('') }}
                                    className="p-1 hover:bg-red-100 rounded"
                                  >
                                    <X className="w-3 h-3 text-red-500" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="px-2 py-1 bg-[#DAA520]/20 text-[#654321] text-xs font-medium rounded-md border border-[#DAA520]/30 flex-1">
                                    {variantOptions.size}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingOption('size'); setEditOptionValue(variantOptions.size || '') }}
                                    className="p-1 hover:bg-amber-100 rounded"
                                    title="Edit Size"
                                  >
                                    <Edit2 className="w-3 h-3 text-[#F59E0B]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setVariantOptions(prev => ({ ...prev, size: undefined })) }}
                                    className="p-1 hover:bg-red-100 rounded"
                                    title="Delete Size"
                                  >
                                    <Trash2 className="w-3 h-3 text-red-500" />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                          
                          {/* Configuration Option - For AppleCare options */}
                          {(variantOptions.configuration || editingOption === 'configuration') && (
                            <div className="flex items-center gap-2 group">
                              <span className="text-xs font-semibold text-[#654321] min-w-[80px]">Set:</span>
                              {editingOption === 'configuration' ? (
                                <div className="flex items-center gap-1 flex-1">
                                  <Input
                                    value={editOptionValue}
                                    onChange={(e) => setEditOptionValue(e.target.value)}
                                    className="h-7 text-xs flex-1"
                                    placeholder="e.g., Without AppleCare+, With AppleCare+ (2 Years)"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setVariantOptions({ ...variantOptions, configuration: editOptionValue || undefined })
                                      setEditingOption(null)
                                      setEditOptionValue('')
                                    }}
                                    className="p-1 hover:bg-green-100 rounded"
                                  >
                                    <Check className="w-3 h-3 text-green-600" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingOption(null); setEditOptionValue('') }}
                                    className="p-1 hover:bg-red-100 rounded"
                                  >
                                    <X className="w-3 h-3 text-red-500" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="px-2 py-1 bg-[#DAA520]/20 text-[#654321] text-xs font-medium rounded-md border border-[#DAA520]/30 flex-1">
                                    {variantOptions.configuration}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingOption('configuration'); setEditOptionValue(variantOptions.configuration || '') }}
                                    className="p-1 hover:bg-amber-100 rounded"
                                    title="Edit Configuration"
                                  >
                                    <Edit2 className="w-3 h-3 text-[#F59E0B]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setVariantOptions(prev => ({ ...prev, configuration: undefined })) }}
                                    className="p-1 hover:bg-red-100 rounded"
                                    title="Delete Configuration"
                                  >
                                    <Trash2 className="w-3 h-3 text-red-500" />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                          
                          {/* Capacity Option - For memory/storage (e.g., "16GB Unified Memory, 1TB SSD Storage") */}
                          {(variantOptions.capacity || editingOption === 'capacity') && (
                            <div className="flex items-center gap-2 group">
                              <span className="text-xs font-semibold text-[#654321] min-w-[80px]">Capacity:</span>
                              {editingOption === 'capacity' ? (
                                <div className="flex items-center gap-1 flex-1">
                                  <Input
                                    value={editOptionValue}
                                    onChange={(e) => setEditOptionValue(e.target.value)}
                                    className="h-7 text-xs flex-1"
                                    placeholder="e.g., 16GB Unified Memory, 1TB SSD Storage"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setVariantOptions({ ...variantOptions, capacity: editOptionValue || undefined })
                                      setEditingOption(null)
                                      setEditOptionValue('')
                                    }}
                                    className="p-1 hover:bg-green-100 rounded"
                                  >
                                    <Check className="w-3 h-3 text-green-600" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingOption(null); setEditOptionValue('') }}
                                    className="p-1 hover:bg-red-100 rounded"
                                  >
                                    <X className="w-3 h-3 text-red-500" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="px-2 py-1 bg-[#DAA520]/20 text-[#654321] text-xs font-medium rounded-md border border-[#DAA520]/30 flex-1">
                                    {variantOptions.capacity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingOption('capacity'); setEditOptionValue(variantOptions.capacity || '') }}
                                    className="p-1 hover:bg-amber-100 rounded"
                                    title="Edit Capacity"
                                  >
                                    <Edit2 className="w-3 h-3 text-[#F59E0B]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setVariantOptions(prev => ({ ...prev, capacity: undefined })) }}
                                    className="p-1 hover:bg-red-100 rounded"
                                    title="Delete Capacity"
                                  >
                                    <Trash2 className="w-3 h-3 text-red-500" />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                          
                          {/* Custom Variant Options */}
                          {customVariantOptions.map((option) => (
                            <div key={option.id} className="flex items-center gap-2 group">
                              <span className="text-xs font-semibold text-[#654321] min-w-[80px] truncate" title={option.name}>
                                {option.name}:
                              </span>
                              {editingCustomOptionId === option.id ? (
                                <div className="flex items-center gap-1 flex-1">
                                  <Input
                                    value={editCustomOptionValue}
                                    onChange={(e) => setEditCustomOptionValue(e.target.value)}
                                    className="h-7 text-xs flex-1"
                                    placeholder={`Enter ${option.name.toLowerCase()}`}
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setCustomVariantOptions(prev => 
                                        prev.map(opt => opt.id === option.id ? { ...opt, value: editCustomOptionValue } : opt)
                                      )
                                      setEditingCustomOptionId(null)
                                      setEditCustomOptionValue('')
                                    }}
                                    className="p-1 hover:bg-green-100 rounded"
                                  >
                                    <Check className="w-3 h-3 text-green-600" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingCustomOptionId(null); setEditCustomOptionValue('') }}
                                    className="p-1 hover:bg-red-100 rounded"
                                  >
                                    <X className="w-3 h-3 text-red-500" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="px-2 py-1 bg-[#DAA520]/20 text-[#654321] text-xs font-medium rounded-md border border-[#DAA520]/30 flex-1 truncate" title={option.value}>
                                    {option.value || <span className="text-gray-400 italic">Not set</span>}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingCustomOptionId(option.id); setEditCustomOptionValue(option.value) }}
                                    className="p-1 hover:bg-amber-100 rounded"
                                    title={`Edit ${option.name}`}
                                  >
                                    <Edit2 className="w-3 h-3 text-[#F59E0B]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCustomVariantOptions(prev => prev.filter(opt => opt.id !== option.id)) }}
                                    className="p-1 hover:bg-red-100 rounded"
                                    title={`Delete ${option.name}`}
                                  >
                                    <Trash2 className="w-3 h-3 text-red-500" />
                                  </button>
                                </>
                              )}
                            </div>
                          ))}
                          
                          {/* Add New Option Form */}
                          {isAddingCustomOption ? (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#DAA520]/20">
                              <Input
                                value={newOptionName}
                                onChange={(e) => setNewOptionName(e.target.value)}
                                className="h-7 text-xs w-20"
                                placeholder="Name"
                                autoFocus
                              />
                              <Input
                                value={newOptionValue}
                                onChange={(e) => setNewOptionValue(e.target.value)}
                                className="h-7 text-xs flex-1"
                                placeholder="Value"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  if (newOptionName.trim()) {
                                    setCustomVariantOptions(prev => [...prev, {
                                      id: Date.now().toString(),
                                      name: newOptionName.trim(),
                                      value: newOptionValue.trim()
                                    }])
                                    setNewOptionName('')
                                    setNewOptionValue('')
                                    setIsAddingCustomOption(false)
                                  }
                                }}
                                className="p-1 hover:bg-green-100 rounded"
                                disabled={!newOptionName.trim()}
                              >
                                <Check className="w-3 h-3 text-green-600" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsAddingCustomOption(false); setNewOptionName(''); setNewOptionValue('') }}
                                className="p-1 hover:bg-red-100 rounded"
                              >
                                <X className="w-3 h-3 text-red-500" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsAddingCustomOption(true) }}
                              className="flex items-center gap-1 text-xs text-[#8B4513] hover:text-[#654321] font-medium mt-2 pt-2 border-t border-[#DAA520]/20"
                            >
                              <Plus className="w-3 h-3" />
                              Add Field
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Right Column */}
                  <div className="space-y-5">
                    {/* Product Name */}
                    <div className="bg-white rounded-xl p-4 shadow-md border border-amber-200">
                      <label className="block text-sm font-bold text-[#654321] mb-2">Product Name <span className="text-red-500">*</span></label>
                      <Input
                        required
                        value={extractedProduct.productName || ""}
                        onChange={(e) => setExtractedProduct({ ...extractedProduct, productName: e.target.value })}
                        placeholder="Product Name"
                        className="text-sm border-2 border-gray-300 focus:border-[#DAA520] focus:ring-2 focus:ring-amber-200 rounded-lg"
                      />
                    </div>

                    {/* Image URL */}
                    <div className="bg-white rounded-xl p-4 shadow-md border border-amber-200">
                      <label className="block text-sm font-bold text-[#654321] mb-2">Image URL <span className="text-red-500">*</span></label>
                      <Input
                        required
                        value={extractedProduct.image || extractedProduct.imageUrl || ""}
                        onChange={(e) => setExtractedProduct({ ...extractedProduct, image: e.target.value, imageUrl: e.target.value })}
                        placeholder="Image URL"
                        className="text-xs border-2 border-gray-300 focus:border-[#DAA520] focus:ring-2 focus:ring-amber-200 rounded-lg"
                      />
                    </div>
                    
                    {/* Category */}
                    <div className="bg-white rounded-xl p-4 shadow-md border border-amber-200">
                      <label className="block text-sm font-bold text-[#654321] mb-2">Category <span className="text-red-500">*</span></label>
                      <Input
                        required
                        value={extractedProduct.category || ""}
                        onChange={(e) => setExtractedProduct({ ...extractedProduct, category: e.target.value })}
                        placeholder="Category"
                        className="text-sm border-2 border-gray-300 focus:border-[#DAA520] focus:ring-2 focus:ring-amber-200 rounded-lg"
                      />
                    </div>
                    
                    {/* Source */}
                    <div className="bg-white rounded-xl p-4 shadow-md border border-amber-200">
                      <label className="block text-sm font-bold text-[#654321] mb-2">Store <span className="text-red-500">*</span></label>
                      <Input
                        required
                        value={extractedProduct.source || ""}
                        onChange={(e) => setExtractedProduct({ ...extractedProduct, source: e.target.value })}
                        placeholder="Store"
                        className="text-sm border-2 border-gray-300 focus:border-[#DAA520] focus:ring-2 focus:ring-amber-200 rounded-lg"
                      />
                    </div>
                    
                    {/* Price */}
                    <div className="bg-white rounded-xl p-4 shadow-md border border-amber-200">
                      <label className="block text-sm font-bold text-[#654321] mb-2">Price <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#654321] font-bold text-lg">$</span>
                        <Input
                          required
                          type="text"
                          inputMode="decimal"
                          value={tempPriceValue !== "" ? tempPriceValue : (extractedProduct.price !== null && extractedProduct.price !== undefined 
                            ? (typeof extractedProduct.price === 'number' 
                                ? extractedProduct.price.toString() 
                                : extractedProduct.price.toString())
                            : "")}
                          onChange={(e) => {
                            const inputValue = e.target.value
                            // Allow empty string, digits, and single decimal point
                            const validDecimalPattern = /^\d*\.?\d*$/
                            if (inputValue === "" || validDecimalPattern.test(inputValue)) {
                              setTempPriceValue(inputValue)
                              if (inputValue === "" || inputValue === null) {
                                setExtractedProduct({ ...extractedProduct, price: null })
                              } else if (inputValue !== "." && !inputValue.endsWith(".")) {
                                // Only update extractedProduct if it's a complete number (not ending with ".")
                                const numValue = parseFloat(inputValue)
                                if (!isNaN(numValue) && isFinite(numValue) && numValue >= 0) {
                                  setExtractedProduct({ ...extractedProduct, price: numValue })
                                }
                              }
                            }
                          }}
                          onBlur={(e) => {
                            const inputValue = e.target.value.trim()
                            setTempPriceValue("")
                            if (inputValue === "" || inputValue === null || inputValue === ".") {
                              setExtractedProduct({ ...extractedProduct, price: null })
                            } else {
                              const value = parseFloat(inputValue)
                              if (!isNaN(value) && isFinite(value) && value >= 0) {
                                // Format to 2 decimal places on blur
                                setExtractedProduct({ ...extractedProduct, price: Number(value.toFixed(2)) })
                              }
                            }
                          }}
                          onFocus={(e) => {
                            // Initialize temp value when focusing
                            if (extractedProduct.price !== null && extractedProduct.price !== undefined) {
                              setTempPriceValue(extractedProduct.price.toString())
                            }
                          }}
                          placeholder="0.00"
                          className="text-lg font-bold text-[#DAA520] border-2 border-gray-300 focus:border-[#DAA520] focus:ring-2 focus:ring-amber-200 pl-8 rounded-lg"
                        />
                      </div>
                    </div>
                    
                    {/* Original Price */}
                    <div className="bg-white rounded-xl p-4 shadow-md border border-amber-200">
                      <label className="block text-sm font-bold text-[#654321] mb-2">Original Price <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">$</span>
                        <Input
                          required
                          type="text"
                          inputMode="decimal"
                          value={tempOriginalPriceValue !== "" ? tempOriginalPriceValue : (extractedProduct.originalPrice !== null && extractedProduct.originalPrice !== undefined 
                            ? (typeof extractedProduct.originalPrice === 'number' 
                                ? extractedProduct.originalPrice.toString() 
                                : extractedProduct.originalPrice.toString())
                            : "")}
                          onChange={(e) => {
                            const inputValue = e.target.value
                            // Allow empty string, digits, and single decimal point
                            const validDecimalPattern = /^\d*\.?\d*$/
                            if (inputValue === "" || validDecimalPattern.test(inputValue)) {
                              setTempOriginalPriceValue(inputValue)
                              if (inputValue === "" || inputValue === null) {
                                setExtractedProduct({ ...extractedProduct, originalPrice: null })
                              } else if (inputValue !== "." && !inputValue.endsWith(".")) {
                                // Only update extractedProduct if it's a complete number (not ending with ".")
                                const numValue = parseFloat(inputValue)
                                if (!isNaN(numValue) && isFinite(numValue) && numValue >= 0) {
                                  setExtractedProduct({ ...extractedProduct, originalPrice: numValue })
                                }
                              }
                            }
                          }}
                          onBlur={(e) => {
                            const inputValue = e.target.value.trim()
                            setTempOriginalPriceValue("")
                            if (inputValue === "" || inputValue === null || inputValue === ".") {
                              setExtractedProduct({ ...extractedProduct, originalPrice: null })
                            } else {
                              const value = parseFloat(inputValue)
                              if (!isNaN(value) && isFinite(value) && value >= 0) {
                                // Format to 2 decimal places on blur
                                setExtractedProduct({ ...extractedProduct, originalPrice: Number(value.toFixed(2)) })
                              }
                            }
                          }}
                          onFocus={(e) => {
                            // Initialize temp value when focusing
                            if (extractedProduct.originalPrice !== null && extractedProduct.originalPrice !== undefined) {
                              setTempOriginalPriceValue(extractedProduct.originalPrice.toString())
                            }
                          }}
                          placeholder="0.00"
                          className="text-sm border-2 border-gray-300 focus:border-[#DAA520] focus:ring-2 focus:ring-amber-200 pl-8 rounded-lg"
                        />
                      </div>
                    </div>
                    
                    {/* Rating */}
                    <div className="bg-white rounded-xl p-4 shadow-md border border-amber-200">
                      <label className="block text-sm font-bold text-[#654321] mb-2">Rating (0-5) <span className="text-red-500">*</span></label>
                      <Input
                        required
                        type="text"
                        inputMode="decimal"
                        value={tempRatingValue !== "" ? tempRatingValue : (extractedProduct.rating !== null && extractedProduct.rating !== undefined 
                          ? (typeof extractedProduct.rating === 'number' 
                              ? extractedProduct.rating.toString() 
                              : extractedProduct.rating.toString())
                          : "")}
                        onChange={(e) => {
                          const inputValue = e.target.value
                          // Allow empty string, digits, and single decimal point
                          const validDecimalPattern = /^\d*\.?\d*$/
                          if (inputValue === "" || validDecimalPattern.test(inputValue)) {
                            setTempRatingValue(inputValue)
                            if (inputValue === "" || inputValue === null) {
                              setExtractedProduct({ ...extractedProduct, rating: null })
                            } else if (inputValue !== "." && !inputValue.endsWith(".")) {
                              // Only update extractedProduct if it's a complete number (not ending with ".")
                              const numValue = parseFloat(inputValue)
                              if (!isNaN(numValue) && isFinite(numValue) && numValue >= 0 && numValue <= 5) {
                                setExtractedProduct({ ...extractedProduct, rating: numValue })
                              }
                            }
                          }
                        }}
                        onBlur={(e) => {
                          const inputValue = e.target.value.trim()
                          setTempRatingValue("")
                          if (inputValue === "" || inputValue === null || inputValue === ".") {
                            setExtractedProduct({ ...extractedProduct, rating: null })
                          } else {
                            const value = parseFloat(inputValue)
                            if (!isNaN(value) && isFinite(value) && value >= 0 && value <= 5) {
                              // Preserve up to 1 decimal place for rating
                              setExtractedProduct({ ...extractedProduct, rating: Number(value.toFixed(1)) })
                            }
                          }
                        }}
                        onFocus={(e) => {
                          // Initialize temp value when focusing
                          if (extractedProduct.rating !== null && extractedProduct.rating !== undefined) {
                            setTempRatingValue(extractedProduct.rating.toString())
                          }
                        }}
                        placeholder="0.0"
                        className="text-sm border-2 border-gray-300 focus:border-[#DAA520] focus:ring-2 focus:ring-amber-200 rounded-lg"
                      />
                    </div>
                    
                    {/* Review Count */}
                    <div className="bg-white rounded-xl p-4 shadow-md border border-amber-200">
                      <label className="block text-sm font-bold text-[#654321] mb-2">Review Count <span className="text-red-500">*</span></label>
                      <Input
                        required
                        type="text"
                        inputMode="decimal"
                        value={tempReviewCountValue !== "" ? tempReviewCountValue : (extractedProduct.reviewCount !== null && extractedProduct.reviewCount !== undefined 
                          ? (typeof extractedProduct.reviewCount === 'number' 
                              ? extractedProduct.reviewCount.toString() 
                              : extractedProduct.reviewCount.toString())
                          : "")}
                        onChange={(e) => {
                          const inputValue = e.target.value
                          // Allow empty string, digits, and single decimal point
                          const validDecimalPattern = /^\d*\.?\d*$/
                          if (inputValue === "" || validDecimalPattern.test(inputValue)) {
                            setTempReviewCountValue(inputValue)
                            if (inputValue === "" || inputValue === null) {
                              setExtractedProduct({ ...extractedProduct, reviewCount: null })
                            } else if (inputValue !== "." && !inputValue.endsWith(".")) {
                              // Only update extractedProduct if it's a complete number (not ending with ".")
                              const numValue = parseFloat(inputValue)
                              if (!isNaN(numValue) && isFinite(numValue) && numValue >= 0) {
                                setExtractedProduct({ ...extractedProduct, reviewCount: numValue })
                              }
                            }
                          }
                        }}
                        onBlur={(e) => {
                          const inputValue = e.target.value.trim()
                          setTempReviewCountValue("")
                          if (inputValue === "" || inputValue === null || inputValue === ".") {
                            setExtractedProduct({ ...extractedProduct, reviewCount: null })
                          } else {
                            const value = parseFloat(inputValue)
                            if (!isNaN(value) && isFinite(value) && value >= 0) {
                              // Format to integer if no decimal, otherwise preserve decimals
                              if (value % 1 === 0) {
                                setExtractedProduct({ ...extractedProduct, reviewCount: parseInt(value.toString(), 10) })
                              } else {
                                setExtractedProduct({ ...extractedProduct, reviewCount: value })
                              }
                            }
                          }
                        }}
                        onFocus={(e) => {
                          // Initialize temp value when focusing
                          if (extractedProduct.reviewCount !== null && extractedProduct.reviewCount !== undefined) {
                            setTempReviewCountValue(extractedProduct.reviewCount.toString())
                          }
                        }}
                        placeholder="0"
                        className="text-sm border-2 border-gray-300 focus:border-[#DAA520] focus:ring-2 focus:ring-amber-200 rounded-lg"
                      />
                    </div>

                    {/* Custom Fields Section */}
                    <div className="bg-white rounded-xl p-4 shadow-md border border-amber-200">
                      <label className="block text-sm font-bold text-[#654321] mb-3">Custom Fields</label>
                      <div className="space-y-2">
                        {customFields.map((field, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Input
                              value={field.name || ''}
                              onChange={(e) => {
                                const newCustomFields = [...customFields]
                                newCustomFields[idx] = { ...newCustomFields[idx], name: e.target.value }
                                setCustomFields(newCustomFields)
                              }}
                              className="w-32 h-8 text-sm border-gray-300 focus:border-amber-500"
                              placeholder="Field Name"
                            />
                            <Input
                              value={field.value || ''}
                              onChange={(e) => {
                                const newCustomFields = [...customFields]
                                newCustomFields[idx] = { ...newCustomFields[idx], value: e.target.value }
                                setCustomFields(newCustomFields)
                              }}
                              className="flex-1 h-8 text-sm border-gray-300 focus:border-amber-500"
                              placeholder="Field Value"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newCustomFields = customFields.filter((_, i) => i !== idx)
                                setCustomFields(newCustomFields)
                              }}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCustomFields([...customFields, { name: '', value: '' }])
                          }}
                          className="text-xs h-7 border-amber-400 text-amber-700 hover:bg-amber-50"
                        >
                          + Add Field
                        </Button>
                      </div>
                    </div>

                    {/* Badges Section */}
                    <div className="bg-white rounded-xl p-4 shadow-md border border-amber-200">
                      <label className="block text-sm font-bold text-[#654321] mb-3">Product Badges</label>
                      <div className="space-y-3">
                        {/* Amazon's Choice Badge - Editable */}
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="amazon-choice"
                            checked={extractedProduct?.amazonChoice || false}
                            onCheckedChange={(checked) => {
                              const newValue = checked === true
                              setExtractedProduct({
                                ...extractedProduct,
                                amazonChoice: newValue
                              })
                              setFormData({
                                ...formData,
                                amazonChoice: newValue
                              })
                            }}
                            className="border-2 border-gray-300 data-[state=checked]:bg-[#DAA520] data-[state=checked]:border-[#DAA520]"
                          />
                          <Input
                            value="Amazon's Choice"
                            disabled
                            className="flex-1 h-8 text-sm border-gray-300 bg-gray-50"
                          />
                          {extractedProduct?.amazonChoice && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setExtractedProduct({
                                  ...extractedProduct,
                                  amazonChoice: false
                                })
                                setFormData({
                                  ...formData,
                                  amazonChoice: false
                                })
                              }}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              ×
                            </Button>
                          )}
                        </div>

                        {/* Best Seller Badge - Editable */}
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="best-seller"
                            checked={extractedProduct?.bestSeller || false}
                            onCheckedChange={(checked) => {
                              const newValue = checked === true
                              setExtractedProduct({
                                ...extractedProduct,
                                bestSeller: newValue
                              })
                              setFormData({
                                ...formData,
                                bestSeller: newValue
                              })
                            }}
                            className="border-2 border-gray-300 data-[state=checked]:bg-[#DAA520] data-[state=checked]:border-[#DAA520]"
                          />
                          <Input
                            value="#1 Best Seller"
                            disabled
                            className="flex-1 h-8 text-sm border-gray-300 bg-gray-50"
                          />
                          {extractedProduct?.bestSeller && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setExtractedProduct({
                                  ...extractedProduct,
                                  bestSeller: false
                                })
                                setFormData({
                                  ...formData,
                                  bestSeller: false
                                })
                              }}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              ×
                            </Button>
                          )}
                        </div>

                        {/* Custom Badges */}
                        {customBadges.map((badge, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Checkbox
                              id={`custom-badge-${idx}`}
                              checked={badge.enabled}
                              onCheckedChange={(checked) => {
                                const newBadges = [...customBadges]
                                newBadges[idx] = { ...newBadges[idx], enabled: checked === true }
                                setCustomBadges(newBadges)
                              }}
                              className="border-2 border-gray-300 data-[state=checked]:bg-[#DAA520] data-[state=checked]:border-[#DAA520]"
                            />
                            <Input
                              value={badge.name}
                              onChange={(e) => {
                                const newBadges = [...customBadges]
                                newBadges[idx] = { ...newBadges[idx], name: e.target.value }
                                setCustomBadges(newBadges)
                              }}
                              className="flex-1 h-8 text-sm border-gray-300 focus:border-amber-500"
                              placeholder="Badge name"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setCustomBadges(customBadges.filter((_, i) => i !== idx))
                              }}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              ×
                            </Button>
                          </div>
                        ))}

                        {/* Add Badge Button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCustomBadges([...customBadges, { name: '', enabled: true }])
                          }}
                          className="text-xs h-7 border-amber-400 text-amber-700 hover:bg-amber-50 mt-2"
                        >
                          + Add Badge
                        </Button>
                      </div>
                    </div>

                    {/* Product Attributes Section */}
                    <div className="bg-white rounded-xl p-4 shadow-md border border-amber-200">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-bold text-[#654321]">Product Attributes</label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setProductAttributesViewMode(!productAttributesViewMode)}
                          className="text-xs h-7 text-amber-700 hover:bg-amber-50"
                        >
                          {productAttributesViewMode ? <><Edit2 className="w-3 h-3 mr-1" /> Edit</> : <><Check className="w-3 h-3 mr-1" /> View</>}
                        </Button>
                      </div>
                      
                      {productAttributesViewMode ? (
                        /* Display Mode - Same format as Product Page */
                        <div className="space-y-1.5">
                          {productAttributes.length > 0 ? (
                            productAttributes.map((attr) => (
                              <div key={attr.id} className="flex items-center text-sm h-[20px]">
                                <span className="font-semibold text-[#6B4423] w-[200px] flex-shrink-0 truncate">
                                  {attr.name.replace(/([A-Z])/g, ' $1').trim().split(' ').map(word => 
                                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                                  ).join(' ')}:
                                </span>
                                <span className="text-[#654321] truncate flex-1" title={attr.value}>
                                  {attr.value}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-400 italic">No attributes extracted</p>
                          )}
                        </div>
                      ) : (
                        /* Edit Mode */
                        <div className="space-y-2">
                          {productAttributes.map((attr, index) => (
                            <div key={attr.id} className="flex items-center gap-2">
                              {/* Move Up/Down Arrows */}
                              <div className="flex flex-col gap-0.5">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (index > 0) {
                                      setProductAttributes(prev => {
                                        const newArr = [...prev]
                                        const temp = newArr[index]
                                        newArr[index] = newArr[index - 1]
                                        newArr[index - 1] = temp
                                        return newArr
                                      })
                                    }
                                  }}
                                  disabled={index === 0}
                                  className="h-5 w-5 p-0 text-gray-400 hover:text-amber-600 hover:bg-amber-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Move up"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (index < productAttributes.length - 1) {
                                      setProductAttributes(prev => {
                                        const newArr = [...prev]
                                        const temp = newArr[index]
                                        newArr[index] = newArr[index + 1]
                                        newArr[index + 1] = temp
                                        return newArr
                                      })
                                    }
                                  }}
                                  disabled={index === productAttributes.length - 1}
                                  className="h-5 w-5 p-0 text-gray-400 hover:text-amber-600 hover:bg-amber-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Move down"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                              <Input
                                value={attr.name || ''}
                                onChange={(e) => {
                                  setProductAttributes(prev => prev.map(a => 
                                    a.id === attr.id ? { ...a, name: e.target.value } : a
                                  ))
                                }}
                                className="w-36 h-8 text-sm font-medium border-gray-300 focus:border-amber-500"
                                placeholder="Attribute name"
                              />
                              <Input
                                value={attr.value || ''}
                                onChange={(e) => {
                                  setProductAttributes(prev => prev.map(a => 
                                    a.id === attr.id ? { ...a, value: e.target.value } : a
                                  ))
                                }}
                                className="flex-1 h-8 text-sm border-gray-300 focus:border-amber-500"
                                placeholder="Enter value"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  console.log('[Admin] Deleting attribute:', attr.id, attr.name)
                                  setProductAttributes(prev => prev.filter(a => a.id !== attr.id))
                                }}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                          {productAttributes.length === 0 && (
                            <p className="text-sm text-gray-400 italic">No attributes extracted</p>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setProductAttributes(prev => [...prev, { id: `new-attr-${Date.now()}`, name: '', value: '' }])
                            }}
                            className="text-xs h-7 border-amber-400 text-amber-700 hover:bg-amber-50 mt-2"
                          >
                            + Add Field
                          </Button>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
                </div>
              </div>
            )}

            {/* Action Buttons - Only show after extraction or when editing */}
            {extractedProduct && (
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  onClick={() => {
                    setIsAddModalOpen(false)
                    setIsEditModalOpen(false)
                    setEditingProduct(null)
                    resetForm()
                  }}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520]"
                >
                  {isSaving ? "Saving..." : isEditModalOpen ? "Update Product" : "Add Product"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

        </div>
      )
    }

