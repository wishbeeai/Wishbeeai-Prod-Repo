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
  ArrowLeft,
  Package,
  Sparkles,
  Loader2,
  Heart,
  ExternalLink,
  ShoppingBag,
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
import Link from "next/link"

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
  const [addingToWishlist, setAddingToWishlist] = useState<string | null>(null)
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false)
  const [selectedProductForWishlist, setSelectedProductForWishlist] = useState<AffiliateProduct | null>(null)
  const [productOptions, setProductOptions] = useState<any>(null)
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<{
    size?: string
    color?: string
    quantity?: number
    [key: string]: any
  }>({ quantity: 1 })
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
        setProducts(data.products || [])
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
    setIsEditModalOpen(true)
  }

  const handleProductLinkChange = (url: string) => {
    setFormData({ ...formData, productLink: url })
    setExtractedProduct(null) // Clear previous extracted product when URL changes
  }

  const handleExtractProduct = async () => {
    const url = formData.productLink
    
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
      const response = await fetch("/api/ai/extract-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productUrl: url }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("[Admin] Product extraction error:", errorData)
        toast.error(
          errorData.error || "Failed to extract product details",
          { description: errorData.suggestion || errorData.message || errorData.details }
        )
        setIsExtracting(false)
        return
      }

      if (response.ok) {
        const data = await response.json()
        
        // Extract the product details - API returns productData object
        const extracted = data.productData || data
        
        // Store extracted product details for widget display
        const sourceValue = extracted.storeName || extracted.source || extractSourceFromUrl(url) || ""
        const categoryValue = extracted.category || ""
        const imageValue = extracted.imageUrl || extracted.image || extracted.productImageUrl || ""
        const priceValue = extracted.salePrice || extracted.price || null
        const originalPriceValue = extracted.originalPrice || extracted.listPrice || null
        const ratingValue = extracted.rating || extracted.averageRating || null
        const reviewCountValue = extracted.reviewCount || extracted.numReviews || null
        
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
          brand: extracted.attributes?.brand || extracted.brand || null,
        })
        
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
      toast.error("Please log in to add items to your wishlist")
      return
    }

    // Open option selection modal
    setSelectedProductForWishlist(product)
    setIsOptionModalOpen(true)
    
    // Fetch product options from URL
    setIsLoadingOptions(true)
    try {
      const response = await fetch("/api/ai/extract-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productUrl: product.productLink }),
      })

      if (response.ok) {
        const data = await response.json()
        const extracted = data.productData || data
        
        // Extract available options (size, color, quantity, etc.)
        const options: any = {
          sizes: extracted.attributes?.size ? [extracted.attributes.size] : extracted.sizes || [],
          colors: extracted.attributes?.color ? [extracted.attributes.color] : extracted.colors || [],
          quantity: 1,
        }
        
        // If we have variants, extract them
        if (extracted.variants) {
          options.sizes = extracted.variants.map((v: any) => v.size).filter(Boolean)
          options.colors = extracted.variants.map((v: any) => v.color).filter(Boolean)
        }
        
        setProductOptions(options)
        setSelectedOptions({ quantity: 1 })
      }
    } catch (error) {
      console.error("Error fetching product options:", error)
      // Set default options if extraction fails
      setProductOptions({ sizes: [], colors: [], quantity: 1 })
    } finally {
      setIsLoadingOptions(false)
    }
  }

  const handleBuyOnStore = (product: AffiliateProduct) => {
    if (product.productLink) {
      window.open(product.productLink, "_blank", "noopener,noreferrer")
    } else {
      toast.error("Product link not available")
    }
  }

  const handleConfirmAddToWishlist = async () => {
    if (!selectedProductForWishlist) return

    setAddingToWishlist(selectedProductForWishlist.id)
    try {
      // Build product link with selected options
      let productLink = selectedProductForWishlist.productLink
      if (selectedOptions.size || selectedOptions.color) {
        // Append options to URL if needed
        const url = new URL(productLink)
        if (selectedOptions.size) url.searchParams.set('size', selectedOptions.size)
        if (selectedOptions.color) url.searchParams.set('color', selectedOptions.color)
        productLink = url.toString()
      }

      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          giftName: selectedProductForWishlist.productName,
          currentPrice: selectedProductForWishlist.price,
          description: `${selectedProductForWishlist.productName} from ${selectedProductForWishlist.source}${selectedOptions.size ? ` - Size: ${selectedOptions.size}` : ''}${selectedOptions.color ? ` - Color: ${selectedOptions.color}` : ''}${selectedOptions.quantity ? ` - Quantity: ${selectedOptions.quantity}` : ''}`,
          productImageUrl: selectedProductForWishlist.image,
          storeName: selectedProductForWishlist.source,
          productLink: productLink,
          category: selectedProductForWishlist.category,
          quantity: selectedOptions.quantity || 1,
        }),
      })

      if (response.ok) {
        toast.success(`"${selectedProductForWishlist.productName}" added to your wishlist!`)
        setIsOptionModalOpen(false)
        setSelectedProductForWishlist(null)
        setProductOptions(null)
        setSelectedOptions({ quantity: 1 })
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to add to wishlist")
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error)
      toast.error(error instanceof Error ? error.message : "Failed to add to wishlist")
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

    setIsSaving(true)
    try {
      const url = isEditModalOpen && editingProduct
        ? `/api/admin/affiliate-products/${editingProduct.id}`
        : "/api/admin/affiliate-products"

      const method = isEditModalOpen ? "PUT" : "POST"

      const payload: any = {
        productName: extractedProduct.productName.trim(),
        image: (extractedProduct.image || extractedProduct.imageUrl || "").trim() || undefined,
        category: extractedProduct.category.trim(),
        source: extractedProduct.source.trim(),
        rating: extractedProduct.rating !== null && extractedProduct.rating !== undefined ? parseFloat(extractedProduct.rating.toString()) : 0,
        reviewCount: extractedProduct.reviewCount !== null && extractedProduct.reviewCount !== undefined ? parseInt(extractedProduct.reviewCount.toString(), 10) : 0,
        price: parseFloat(extractedProduct.price.toString()),
        originalPrice: extractedProduct.originalPrice !== null && extractedProduct.originalPrice !== undefined ? parseFloat(extractedProduct.originalPrice.toString()) : undefined,
        productLink: formData.productLink.trim() || undefined, // Use formData.productLink as it's the URL input
        amazonChoice: formData.amazonChoice,
        bestSeller: formData.bestSeller,
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success(isEditModalOpen ? "Product updated successfully" : "Product added successfully")
        setIsAddModalOpen(false)
        setIsEditModalOpen(false)
        setEditingProduct(null)
        resetForm()
        fetchProducts()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to save product")
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
                <p className="text-gray-500 text-lg">
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
                          <img
                            src={product.image || "/placeholder.svg"}
                            alt={product.productName}
                            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg"
                            }}
                          />
                          {product.originalPrice && product.originalPrice > product.price && (
                            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                              SALE
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[#654321] text-sm sm:text-base mb-1.5 line-clamp-2 leading-tight">
                            {product.productName}
                          </div>
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full">
                            <Package className="w-3 h-3 text-[#DAA520]" />
                            <span className="text-xs font-semibold text-[#8B4513]">{product.category}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-[#654321]">{product.source}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {product.amazonChoice && (
                            <Badge className="bg-gradient-to-r from-[#FF9900] to-[#FFB84D] text-white text-[10px] font-bold px-2 py-0.5 border-0 shadow-sm">
                              Amazon Choice
                            </Badge>
                          )}
                          {product.bestSeller && (
                            <Badge className="bg-gradient-to-r from-gray-800 to-gray-900 text-white text-[10px] font-bold px-2 py-0.5 border-0 shadow-sm">
                              Best Seller
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                star <= Math.round(product.rating)
                                  ? "fill-[#F4C430] text-[#F4C430]"
                                  : "fill-gray-200 text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-bold text-[#654321]">{product.rating.toFixed(1)}</span>
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
                          className="w-full h-9 px-3 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] text-xs font-semibold transition-all duration-200 hover:scale-105 hover:from-[#F4C430] hover:to-[#DAA520] active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                          {addingToWishlist === product.id ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            "Add to My Wishlist"
                          )}
                        </Button>
                        <Button
                          onClick={() => handleBuyOnStore(product)}
                          className="w-full h-9 px-3 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] text-xs font-semibold transition-all duration-200 hover:scale-105 hover:from-[#F4C430] hover:to-[#DAA520] active:scale-95 shadow-md hover:shadow-lg"
                        >
                          Buy on {product.source}
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
              <DialogContent className="max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 [&>button]:top-6 [&>button]:right-6 [&>button]:z-10">
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
            {/* Product Link */}
            <div className="mb-8">
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
                      const pastedText = e.clipboardData.getData("text")
                      if (pastedText.startsWith("http")) {
                        handleProductLinkChange(pastedText)
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
              
              {/* Cancel and Close Window Buttons - Only show before extraction */}
              {!extractedProduct && (
                <div className="flex justify-center gap-3 mt-8">
                  <Button
                    onClick={() => {
                      setIsAddModalOpen(false)
                      setIsEditModalOpen(false)
                      setEditingProduct(null)
                      resetForm()
                    }}
                    className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAddModalOpen(false)
                      setIsEditModalOpen(false)
                      setEditingProduct(null)
                      resetForm()
                    }}
                    className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520]"
                  >
                    Close Window
                  </Button>
                </div>
              )}
            </div>

            {/* Product Extract Details Widget */}
            {extractedProduct && (
              <div className="mt-6">
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                  <div className="flex flex-row items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#DAA520] flex-shrink-0" />
                    <h3 className="text-xl sm:text-3xl md:text-4xl font-bold text-foreground whitespace-nowrap">
                      Extracted Product
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2">
                    Review and edit the extracted product details before adding to your catalog
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-[#F4C430] rounded-xl p-6 shadow-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-5">
                    {/* Product Image */}
                    <div className="bg-white rounded-xl p-4 shadow-md border border-amber-200">
                      <label className="block text-sm font-bold text-[#654321] mb-3 text-center">Product Image</label>
                      <div className="w-full h-[500px] sm:h-[600px] md:h-[700px] bg-white rounded-xl overflow-auto border-2 border-amber-300 shadow-inner flex items-center justify-center">
                        {extractedProduct.image ? (
                          <img
                            src={extractedProduct.image}
                            alt={extractedProduct.productName || "Product"}
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
                    
                    {/* Product Brand */}
                    {extractedProduct.brand && (
                      <div className="bg-white rounded-xl p-4 shadow-md border border-amber-200">
                        <label className="block text-sm font-bold text-[#654321] mb-2">Product Brand <span className="text-red-500">*</span></label>
                        <Input
                          required
                          value={extractedProduct.brand || ""}
                          onChange={(e) => setExtractedProduct({ ...extractedProduct, brand: e.target.value })}
                          placeholder="Brand"
                          className="text-sm border-2 border-gray-300 focus:border-[#DAA520] focus:ring-2 focus:ring-amber-200 rounded-lg"
                        />
                      </div>
                    )}
                    
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
                          type="number"
                          step="0.01"
                          min="0"
                          value={extractedProduct.price ? parseFloat(extractedProduct.price.toString()).toFixed(2) : ""}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || null
                            setExtractedProduct({ ...extractedProduct, price: value })
                          }}
                          onBlur={(e) => {
                            if (e.target.value) {
                              const value = parseFloat(e.target.value) || 0
                              setExtractedProduct({ ...extractedProduct, price: parseFloat(value.toFixed(2)) })
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
                          type="number"
                          step="0.01"
                          min="0"
                          value={extractedProduct.originalPrice ? parseFloat(extractedProduct.originalPrice.toString()).toFixed(2) : ""}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || null
                            setExtractedProduct({ ...extractedProduct, originalPrice: value })
                          }}
                          onBlur={(e) => {
                            if (e.target.value) {
                              const value = parseFloat(e.target.value) || 0
                              setExtractedProduct({ ...extractedProduct, originalPrice: parseFloat(value.toFixed(2)) })
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
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={extractedProduct.rating || ""}
                        onChange={(e) => setExtractedProduct({ ...extractedProduct, rating: parseFloat(e.target.value) || null })}
                        placeholder="0.0"
                        className="text-sm border-2 border-gray-300 focus:border-[#DAA520] focus:ring-2 focus:ring-amber-200 rounded-lg"
                      />
                    </div>
                    
                    {/* Review Count */}
                    <div className="bg-white rounded-xl p-4 shadow-md border border-amber-200">
                      <label className="block text-sm font-bold text-[#654321] mb-2">Review Count <span className="text-red-500">*</span></label>
                      <Input
                        required
                        type="number"
                        min="0"
                        value={extractedProduct.reviewCount || ""}
                        onChange={(e) => setExtractedProduct({ ...extractedProduct, reviewCount: parseInt(e.target.value, 10) || null })}
                        placeholder="0"
                        className="text-sm border-2 border-gray-300 focus:border-[#DAA520] focus:ring-2 focus:ring-amber-200 rounded-lg"
                      />
                    </div>

                  </div>
                </div>
                </div>
              </div>
            )}

            {/* Action Buttons - Only show after extraction or when editing */}
            {(extractedProduct || isEditModalOpen) && (
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

      {/* Select Options Modal */}
          <Dialog open={isOptionModalOpen} onOpenChange={(open) => {
            setIsOptionModalOpen(open)
            if (!open) {
              setSelectedProductForWishlist(null)
              setProductOptions(null)
              setSelectedOptions({ quantity: 1 })
            }
          }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl sm:text-2xl font-bold text-[#654321]">
                  Select Your Options
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600">
                  Choose the right options for your gift
                </DialogDescription>
              </DialogHeader>
              
              {selectedProductForWishlist && (
                <div className="py-4 space-y-6">
                  {/* Product Preview */}
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border-2 border-[#F4C430]/30">
                    <img
                      src={selectedProductForWishlist.image || "/placeholder.svg"}
                      alt={selectedProductForWishlist.productName}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border-2 border-gray-200"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg"
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-[#654321] text-sm sm:text-base mb-1 line-clamp-2">
                        {selectedProductForWishlist.productName}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2">{selectedProductForWishlist.source}</p>
                      <p className="text-lg font-bold text-[#654321]">${selectedProductForWishlist.price.toFixed(2)}</p>
                    </div>
                  </div>

                  {isLoadingOptions ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-[#DAA520]" />
                      <span className="ml-3 text-sm text-gray-600">Loading product options...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Size Selection */}
                      {productOptions?.sizes && productOptions.sizes.length > 0 && (
                        <div className="space-y-2">
                          <Label htmlFor="size" className="text-sm font-semibold text-[#654321]">
                            Size <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={selectedOptions.size || ""}
                            onValueChange={(value) => setSelectedOptions({ ...selectedOptions, size: value })}
                          >
                            <SelectTrigger id="size" className="border-2 border-gray-300 focus:border-[#DAA520]">
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                              {productOptions.sizes.map((size: string, index: number) => (
                                <SelectItem key={index} value={size}>
                                  {size}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Color Selection */}
                      {productOptions?.colors && productOptions.colors.length > 0 && (
                        <div className="space-y-2">
                          <Label htmlFor="color" className="text-sm font-semibold text-[#654321]">
                            Color <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={selectedOptions.color || ""}
                            onValueChange={(value) => setSelectedOptions({ ...selectedOptions, color: value })}
                          >
                            <SelectTrigger id="color" className="border-2 border-gray-300 focus:border-[#DAA520]">
                              <SelectValue placeholder="Select color" />
                            </SelectTrigger>
                            <SelectContent>
                              {productOptions.colors.map((color: string, index: number) => (
                                <SelectItem key={index} value={color}>
                                  {color}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Quantity Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="quantity" className="text-sm font-semibold text-[#654321]">
                          Quantity
                        </Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          max="10"
                          value={selectedOptions.quantity || 1}
                          onChange={(e) => setSelectedOptions({ ...selectedOptions, quantity: parseInt(e.target.value) || 1 })}
                          className="border-2 border-gray-300 focus:border-[#DAA520]"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsOptionModalOpen(false)
                            setSelectedProductForWishlist(null)
                            setProductOptions(null)
                            setSelectedOptions({ quantity: 1 })
                          }}
                          disabled={addingToWishlist === selectedProductForWishlist?.id}
                          className="border-[#8B4513] text-[#8B4513] hover:bg-[#8B4513] hover:text-white"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleConfirmAddToWishlist}
                          disabled={addingToWishlist === selectedProductForWishlist?.id || isLoadingOptions}
                          className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520]"
                        >
                          {addingToWishlist === selectedProductForWishlist?.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            "Add to Wishlist"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Select Options Modal */}
          <Dialog open={isOptionModalOpen} onOpenChange={(open) => {
            setIsOptionModalOpen(open)
            if (!open) {
              setSelectedProductForWishlist(null)
              setProductOptions(null)
              setSelectedOptions({ quantity: 1 })
            }
          }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl sm:text-2xl font-bold text-[#654321]">
                  Select Your Options
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600">
                  Choose the right options for your gift
                </DialogDescription>
              </DialogHeader>
              
              {selectedProductForWishlist && (
                <div className="py-4 space-y-6">
                  {/* Product Preview */}
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border-2 border-[#F4C430]/30">
                    <img
                      src={selectedProductForWishlist.image || "/placeholder.svg"}
                      alt={selectedProductForWishlist.productName}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border-2 border-gray-200"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg"
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-[#654321] text-sm sm:text-base mb-1 line-clamp-2">
                        {selectedProductForWishlist.productName}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2">{selectedProductForWishlist.source}</p>
                      <p className="text-lg font-bold text-[#654321]">${selectedProductForWishlist.price.toFixed(2)}</p>
                    </div>
                  </div>

                  {isLoadingOptions ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-[#DAA520]" />
                      <span className="ml-3 text-sm text-gray-600">Loading product options...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Size Selection */}
                      {productOptions?.sizes && productOptions.sizes.length > 0 && (
                        <div className="space-y-2">
                          <Label htmlFor="size" className="text-sm font-semibold text-[#654321]">
                            Size <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={selectedOptions.size || ""}
                            onValueChange={(value: string) => setSelectedOptions({ ...selectedOptions, size: value })}
                          >
                            <SelectTrigger id="size" className="border-2 border-gray-300 focus:border-[#DAA520] w-full">
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                              {productOptions.sizes.map((size: string, index: number) => (
                                <SelectItem key={index} value={size}>
                                  {size}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Color Selection */}
                      {productOptions?.colors && productOptions.colors.length > 0 && (
                        <div className="space-y-2">
                          <Label htmlFor="color" className="text-sm font-semibold text-[#654321]">
                            Color <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={selectedOptions.color || ""}
                            onValueChange={(value: string) => setSelectedOptions({ ...selectedOptions, color: value })}
                          >
                            <SelectTrigger id="color" className="border-2 border-gray-300 focus:border-[#DAA520] w-full">
                              <SelectValue placeholder="Select color" />
                            </SelectTrigger>
                            <SelectContent>
                              {productOptions.colors.map((color: string, index: number) => (
                                <SelectItem key={index} value={color}>
                                  {color}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Quantity Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="quantity" className="text-sm font-semibold text-[#654321]">
                          Quantity
                        </Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          max="10"
                          value={selectedOptions.quantity || 1}
                          onChange={(e) => setSelectedOptions({ ...selectedOptions, quantity: parseInt(e.target.value) || 1 })}
                          className="border-2 border-gray-300 focus:border-[#DAA520]"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsOptionModalOpen(false)
                            setSelectedProductForWishlist(null)
                            setProductOptions(null)
                            setSelectedOptions({ quantity: 1 })
                          }}
                          disabled={addingToWishlist === selectedProductForWishlist?.id}
                          className="border-[#8B4513] text-[#8B4513] hover:bg-[#8B4513] hover:text-white"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleConfirmAddToWishlist}
                          disabled={addingToWishlist === selectedProductForWishlist?.id || isLoadingOptions}
                          className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520]"
                        >
                          {addingToWishlist === selectedProductForWishlist?.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            "Add to Wishlist"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )
    }

