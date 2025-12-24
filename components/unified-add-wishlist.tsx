"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
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
} from "lucide-react"

interface ExtractedProduct {
  productName: string
  description: string
  price: number
  storeName: string
  imageUrl: string
  productLink: string
  quantity: number
  attributes: {
    color: string | null
    size: string | null
    brand: string | null
    material?: string | null
    features?: string | null
    stockStatus?: string | null
  }
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

      setFormData({
        title: extractedData.productName || "",
        description: extractedData.description || "",
        price: extractedData.price?.toString() || "",
        imageUrl: extractedData.imageUrl || "",
        category: extractedData.category || "",
        size: extractedData.attributes?.size || "",
        color: extractedData.attributes?.color || "",
        quantity: "1",
        storeName: extractedData.storeName || "",
        buyLink: extractedData.productLink || productInput,
      })

      setExtractedProduct(extractedData)
      setShowExtractedProduct(true)

      toast({
        title: "Product Extracted!",
        description: extractedData.notice || "Product details extracted successfully.",
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

    setFormData({
      title: product.productName,
      description: product.description,
      price: product.price.toString(),
      color: product.color || "",
      size: product.size || "",
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
      storeName: product.storeName,
      imageUrl: product.imageUrl,
      productLink: product.productUrl,
      quantity: 1,
      attributes: {
        color: product.color,
        size: product.size,
        brand: product.brand,
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
            <div className="relative">
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
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-xs sm:text-sm md:text-base"
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
          </div>

          <Button
            onClick={handleExtractProduct}
            disabled={isExtracting || !productInput.trim()}
            className="w-full py-3 sm:py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 rounded-xl font-semibold shadow-lg text-xs sm:text-sm md:text-base"
          >
            {isExtracting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Extract Product Details
              </>
            )}
          </Button>
        </div>
      </CardContent>

      {showExtractedProduct && extractedProduct && (
        <CardContent className="p-3 sm:p-6 border-t-2 border-gray-100">
          <div className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 overflow-hidden hover:shadow-xl transition-all">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4">
              {/* Product Image - Top on mobile, Left Side on larger screens */}
              <div className="relative w-full sm:w-32 md:w-40 h-32 sm:h-32 md:h-40 bg-gray-100 flex-shrink-0 rounded-lg overflow-hidden group">
                {!extractedProduct.imageUrl && (
                  <label
                    htmlFor="product-image-upload"
                    className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors z-10"
                  >
                    <Package className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-xs text-gray-600 text-center px-2">
                      {isUploadingImage ? "Uploading..." : "Click to upload image"}
                    </span>
                    <input
                      id="product-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploadingImage}
                    />
                  </label>
                )}

                {extractedProduct.imageUrl && (
                  <>
                    <img
                      src={extractedProduct.imageUrl || "/placeholder.svg"}
                      alt={extractedProduct.productName}
                      className="w-full h-full object-contain p-2"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg"
                      }}
                    />
                    {/* Upload overlay on hover */}
                    <label
                      htmlFor="product-image-upload"
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <div className="text-white text-center">
                        <Upload className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-xs">Change Image</span>
                      </div>
                      <input
                        id="product-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isUploadingImage}
                      />
                    </label>
                  </>
                )}
              </div>

              {/* Product Content - Below image on mobile, Right Side on larger screens */}
              <div className="flex-1 min-w-0 flex flex-col">
                {/* Product Title */}
                <h3 className="text-xs sm:text-sm font-bold text-gray-800 mb-1 line-clamp-2">
                  {extractedProduct.productName || "Extracted Product"}
                </h3>

                {/* Price */}
                {extractedProduct.price && (
                  <p className="text-sm sm:text-base font-bold text-[#DAA520] mb-1">
                    $
                    {typeof extractedProduct.price === "number"
                      ? extractedProduct.price.toFixed(2)
                      : Number.parseFloat(extractedProduct.price).toFixed(2)}
                  </p>
                )}

                {/* Description */}
                {extractedProduct.description && (
                  <p className="text-[10px] sm:text-xs text-gray-600 mb-2 line-clamp-2 sm:line-clamp-3">
                    {extractedProduct.description}
                  </p>
                )}

                {/* Product Details - Compact Grid */}
                <div className="bg-gray-50 rounded-lg p-2 sm:p-2.5 mb-2 sm:mb-3 flex-grow">
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-[10px] sm:text-xs md:text-sm font-semibold text-gray-700">Product Details</h4>
                    <button
                      type="button"
                      onClick={() => {
                        if (isEditingProduct) {
                          handleSaveProductEdits()
                        } else {
                          setIsEditingProduct(true)
                          setManualPrice(extractedProduct.price?.toString() || "")
                          setManualColor(extractedProduct.attributes?.color || "")
                          setManualSize(extractedProduct.attributes?.size || "")
                          setManualMaterial(extractedProduct.attributes?.material || "")
                        }
                      }}
                      className="text-[9px] sm:text-xs text-[#8B5A3C] hover:text-[#DAA520] flex items-center gap-1"
                    >
                      {isEditingProduct ? (
                        <>
                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          <span className="hidden sm:inline">Save</span>
                        </>
                      ) : (
                        <>
                          <Edit2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          <span className="hidden sm:inline">Edit</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-1 sm:gap-x-1.5 gap-y-1 sm:gap-y-1.5 text-[9px] sm:text-xs">
                    {/* Color */}
                    {(extractedProduct.attributes?.color || isEditingProduct) && (
                      <>
                        <div className="text-gray-600 font-medium">Color:</div>
                        <div className="text-gray-800">
                          {isEditingProduct ? (
                            <input
                              type="text"
                              value={manualColor}
                              onChange={(e) => setManualColor(e.target.value)}
                              className="w-full px-1 py-0.5 text-xs border rounded"
                              placeholder="Enter color"
                            />
                          ) : (
                            extractedProduct.attributes?.color
                          )}
                        </div>
                      </>
                    )}

                    {/* Size */}
                    {(extractedProduct.attributes?.size || isEditingProduct) && (
                      <>
                        <div className="text-gray-600 font-medium">Size:</div>
                        <div className="text-gray-800">
                          {isEditingProduct ? (
                            <input
                              type="text"
                              value={manualSize}
                              onChange={(e) => setManualSize(e.target.value)}
                              className="w-full px-1 py-0.5 text-xs border rounded"
                              placeholder="Enter size"
                            />
                          ) : (
                            extractedProduct.attributes?.size
                          )}
                        </div>
                      </>
                    )}

                    {/* Material */}
                    {(extractedProduct.attributes?.material || isEditingProduct) && (
                      <>
                        <div className="text-gray-600 font-medium">Material:</div>
                        <div className="text-gray-800">
                          {isEditingProduct ? (
                            <input
                              type="text"
                              value={manualMaterial}
                              onChange={(e) => setManualMaterial(e.target.value)}
                              className="w-full px-1 py-0.5 text-xs border rounded"
                              placeholder="Enter material"
                            />
                          ) : (
                            extractedProduct.attributes?.material
                          )}
                        </div>
                      </>
                    )}

                    {/* Brand */}
                    {extractedProduct.attributes?.brand && (
                      <>
                        <div className="text-gray-600 font-medium">Brand:</div>
                        <div className="text-gray-800">{extractedProduct.attributes.brand}</div>
                      </>
                    )}

                    {/* Store Name */}
                    {extractedProduct.storeName && (
                      <>
                        <div className="text-gray-600 font-medium">Store:</div>
                        <div className="text-gray-800">{extractedProduct.storeName}</div>
                      </>
                    )}

                    {/* Features */}
                    {extractedProduct.attributes?.features && (
                      <>
                        <div className="text-gray-600 font-medium">Features:</div>
                        <div className="text-gray-800">{extractedProduct.attributes.features}</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <a
                    href={extractedProduct.productLink || productInput}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#DAA520] to-[#FFD700] text-white rounded-full text-[10px] sm:text-xs md:text-sm font-semibold hover:from-[#B8860B] hover:to-[#DAA520] transition-all duration-200 border border-[#DAA520]/30 shadow-md hover:shadow-lg"
                  >
                    <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    View Product
                  </a>
                  <button
                    onClick={handleRefreshProduct}
                    disabled={isRefreshing}
                    className="px-2 py-1.5 text-[10px] sm:text-xs font-semibold text-[#DAA520] bg-white border border-[#DAA520] rounded-lg hover:bg-[#DAA520] hover:text-white transition-all disabled:opacity-50"
                  >
                    {isRefreshing ? "Refreshing..." : "Refresh Details"}
                  </button>
                </div>
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
