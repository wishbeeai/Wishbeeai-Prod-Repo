"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
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
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function CreateGiftFormClient() {
  const router = useRouter()
  const { toast } = useToast()

  const [collectionTitle, setCollectionTitle] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [occasion, setOccasion] = useState("") // Changed default to empty for select
  const [giftName, setGiftName] = useState("")
  const [description, setDescription] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [deadline, setDeadline] = useState("")
  const [bannerImage, setBannerImage] = useState("")
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEnhancingDescription, setIsEnhancingDescription] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [productUrl, setProductUrl] = useState("")
  const [extractedProduct, setExtractedProduct] = useState<any>(null)
  const [isExtractingProduct, setIsExtractingProduct] = useState(false)
  const [oxylabsAuthFailed, setOxylabsAuthFailed] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isEditingProduct, setIsEditingProduct] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const [manualPrice, setManualPrice] = useState("")
  const [manualSize, setManualSize] = useState("")
  const [manualColor, setManualColor] = useState("")
  const [manualCategory, setManualCategory] = useState("")
  const [manualFeatures, setManualFeatures] = useState("")
  const [manualWarranty, setManualWarranty] = useState("")
  const [manualCapacity, setManualCapacity] = useState("")

  // Preference level for variants - REQUIRED to prevent delays in gift purchases
  // This helps contributors know exactly which variant to purchase, avoiding wrong purchases and delays
  const [variantPreference, setVariantPreference] = useState<"I Like" | "Alternative" | "Optional" | "">("")
  const [preferenceError, setPreferenceError] = useState<string>("")
  const [isExtractingVariants, setIsExtractingVariants] = useState(false)

  const descriptionEditorRef = useRef<HTMLDivElement>(null)
  const colorPickerRef = useRef<HTMLDivElement>(null)

  const TITLE_CHARACTER_LIMIT = 50

  const isUrl = (text: string): boolean => {
    try {
      new URL(text)
      return true
    } catch {
      return text.includes("http://") || text.includes("https://") || text.includes("www.")
    }
  }

  const hasAttributeValue = (key: string): boolean => {
    if (!extractedProduct?.attributes) return false
    const value = extractedProduct.attributes[key]
    return value !== null && value !== undefined && value !== ""
  }

  const getAttributeValue = (key: string, manualValue: string): string => {
    if (manualValue) return manualValue
    if (extractedProduct?.attributes?.[key]) return extractedProduct.attributes[key]
    return ""
  }

  useEffect(() => {
    try {
      const savedTitle = sessionStorage.getItem("pendingCollectionTitle")

      if (savedTitle) {
        setCollectionTitle(savedTitle)
        sessionStorage.removeItem("pendingCollectionTitle")

        setTimeout(() => {
          handleGenerateBanner()
        }, 500)
      }
    } catch (error) {
      console.error("[v0] Error loading sessionStorage:", error)
    }
  }, [])

  useEffect(() => {
    if (collectionTitle) {
      setDescription(collectionTitle)
      if (descriptionEditorRef.current) {
        descriptionEditorRef.current.innerHTML = collectionTitle
      }
    }
  }, [collectionTitle])

  const handleGenerateBanner = async () => {
    if (!collectionTitle) {
      toast({
        title: "Collection title required",
        description: "Please enter a collection title to generate a banner.",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingBanner(true)
    try {
      const response = await fetch("/api/ai/generate-banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: collectionTitle }),
      })

      if (!response.ok) throw new Error("Failed to generate banner")

      const data = await response.json()
      setBannerImage(data.bannerUrl)

      toast({
        title: "Banner generated!",
        description: "Your collection banner has been created.",
      })
    } catch (error) {
      console.error("[v0] Banner generation error:", error)
      toast({
        title: "Generation failed",
        description: "Could not generate banner. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingBanner(false)
    }
  }

  const handleEnhanceDescription = async () => {
    if (!description || description.trim() === "") {
      toast({
        title: "No description to enhance",
        description: "Please enter a description first.",
        variant: "destructive",
      })
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

      if (!response.ok) throw new Error("Failed to enhance description")

      const data = await response.json()

      // Remove \`\`\`html code fence markers from AI response
      let enhancedText = data.enhancedDescription
      enhancedText = enhancedText
        .replace(/```html\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()

      if (descriptionEditorRef.current) {
        descriptionEditorRef.current.innerHTML = enhancedText
        setDescription(enhancedText)
      }

      toast({
        title: "Description enhanced!",
        description: "Your description has been improved with AI.",
      })
    } catch (error) {
      console.error("[v0] Description enhancement error:", error)
      toast({
        title: "Enhancement failed",
        description: "Could not enhance description. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsEnhancingDescription(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!collectionTitle.trim() || !giftName.trim() || !targetAmount || !deadline) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (isUrl(collectionTitle)) {
      toast({
        title: "Invalid Collection Title",
        description: "Please enter a title, not a URL. URLs are not allowed in the collection title.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    // Validate preference level if product has color or size attributes
    // This is REQUIRED to prevent delays in gift purchases
    const hasColor = extractedProduct?.attributes?.color || manualColor
    const hasSize = extractedProduct?.attributes?.size || manualSize

    if ((hasColor || hasSize) && !variantPreference) {
      setPreferenceError("Preference level is required. This ensures contributors know which variant to purchase, preventing delays in gift buying.")
      toast({
        title: "Preference Level Required",
        description: "Please select a preference level for the product variants. This prevents delays in gift purchases.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionTitle,
          recipientName: recipientName || "Someone Special",
          occasion,
          giftName,
          description,
          targetAmount: Number.parseFloat(targetAmount),
          deadline,
          bannerImage: bannerImage || null,
          price: manualPrice ? Number.parseFloat(manualPrice) : extractedProduct?.price,
          size: manualSize || extractedProduct?.attributes?.size,
          color: manualColor || extractedProduct?.attributes?.color,
          category: manualCategory || extractedProduct.category || "General",
          features: manualFeatures || extractedProduct?.attributes?.features || null,
          warranty: manualWarranty || extractedProduct?.attributes?.warranty || null,
          capacity: manualCapacity || extractedProduct?.attributes?.capacity || null,
          brand: extractedProduct?.attributes?.brand || null,
          material: extractedProduct?.attributes?.material || null,
          productImage: extractedProduct?.imageUrl || null,
          productLink: extractedProduct?.productLink || productUrl,
          // Preference level - required to prevent delays in gift purchases
          // This helps contributors know exactly which variant to purchase
          variantPreference: variantPreference || null,
        }),
      })

      if (!response.ok) throw new Error("Failed to create gift")

      const data = await response.json()
      toast({
        title: "Gift collection created!",
        description: "Your gift funding campaign is now live.",
      })
      // Reset preference level after successful submission
      setVariantPreference("")
      setPreferenceError("")
      router.push(`/gifts/${data.id}`)
    } catch (error) {
      console.error("[v0] Submit error:", error)
      toast({
        title: "Creation failed",
        description: "Could not create gift. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const extractProductFromUrl = async (url: string) => {
    if (!url || !url.startsWith("http")) {
      return
    }

    setIsExtractingProduct(true)
    setOxylabsAuthFailed(false)

    try {
      console.log("[v0] Starting product extraction for URL:", url)

      const response = await fetch("/api/ai/extract-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      console.log("[v0] API response status:", response.status)

      const text = await response.text()
      console.log("[v0] Response text length:", text.length)
      console.log("[v0] Response text (first 500):", text.substring(0, 500))

      if (!response.ok) {
        let data
        try {
          data = JSON.parse(text)
        } catch (e) {
          console.error("[v0] API returned non-JSON error:", text)
          toast({
            title: "Extraction Error",
            description: "Failed to extract product details. You can enter details manually below.",
            variant: "destructive",
          })
          return
        }

        if (data.error) {
          console.error("[v0] API returned error:", data)
          toast({
            title: "Extraction Error",
            description: data.error,
            variant: "destructive",
          })
        }
        return
      }

      const data = JSON.parse(text)
      console.log("[v0] Product data extracted successfully")
      console.log("[v0] Product name:", data.productName)
      console.log("[v0] Price:", data.price)
      console.log("[v0] Image URL:", data.imageUrl)
      console.log("[v0] Category:", data.category)
      console.log("[v0] Attributes:", data.attributes)
      console.log("[v0] Full data object:", JSON.stringify(data, null, 2))

      setExtractedProduct(data)

      if (data.price) {
        const priceValue =
          typeof data.price === "string" ? Number.parseFloat(data.price.replace(/[^0-9.]/g, "")) : data.price
        if (!isNaN(priceValue)) {
          setTargetAmount(priceValue.toFixed(2))
        }
      }

      if (data.productName && !giftName) {
        setGiftName(data.productName)
      }

      setProductUrl("")
    } catch (error) {
      console.error("[v0] Product extraction error:", error)
      toast({
        title: "Extraction Failed",
        description:
          error instanceof Error ? error.message : "Could not extract product details. Please enter manually.",
        variant: "destructive",
      })
    } finally {
      setIsExtractingProduct(false)
    }
  }

  const handleRefreshProduct = async () => {
    if (!productUrl) {
      toast({
        title: "No URL",
        description: "Please enter a product URL first.",
        variant: "destructive",
      })
      return
    }
    setIsRefreshing(true)
    await extractProductFromUrl(productUrl)
    setIsRefreshing(false)
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
    toast({
      title: "Product updated",
      description: "Your changes have been saved.",
    })
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingImage(true)
    try {
      // Convert image to base64 for preview
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setExtractedProduct((prev: any) => ({
          ...prev,
          imageUrl: base64String,
        }))
        setIsUploadingImage(false)
      }
      reader.onerror = () => {
        toast({
          title: "Upload Failed",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        })
        setIsUploadingImage(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("[v0] Error uploading image:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
      setIsUploadingImage(false)
    }
  }

  useEffect(() => {
    if (!productUrl || !productUrl.startsWith("http")) {
      return
    }

    const timer = setTimeout(() => {
      extractProductFromUrl(productUrl)
    }, 1000)

    return () => clearTimeout(timer)
  }, [productUrl])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F1E8] to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors text-xs sm:text-sm md:text-base"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          Back to Home
        </Link>

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

        <div className="bg-white rounded-lg border border-border shadow-lg p-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="collectionTitle" className="text-[#654321] font-semibold text-sm sm:text-base">
                Collection Title *
              </Label>
            </div>
            <Input
              type="text"
              value={collectionTitle}
              onChange={(e) => {
                const value = e.target.value
                if (value.length <= TITLE_CHARACTER_LIMIT) {
                  setCollectionTitle(value)
                }
              }}
              placeholder="e.g., Sarah's Birthday Gift, New House Warming"
              className="border-2 border-[#DAA520]/30 focus:border-[#DAA520] w-full p-3 rounded-lg text-xs sm:text-sm md:text-base"
              required
            />
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-[9px] sm:text-xs text-[#8B4513]/60 mb-4">
              <p>Titles only - URLs are not allowed</p>
              <p className={`${collectionTitle.length >= TITLE_CHARACTER_LIMIT ? "text-red-500 font-semibold" : ""}`}>
                {collectionTitle.length}/{TITLE_CHARACTER_LIMIT} characters
              </p>
            </div>
          </div>

          <div className="space-y-3 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border-2 border-amber-200">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-600" />
              <Label className="text-[#654321] font-semibold text-sm sm:text-base">AI Banner Generator</Label>
            </div>
            <p className="text-xs sm:text-sm text-[#8B4513]/80">
              Generate a stunning custom banner for your gift collection
            </p>

            {!bannerImage && (
              <button
                type="button"
                onClick={handleGenerateBanner}
                disabled={isGeneratingBanner || !collectionTitle}
                className="w-full sm:w-auto mx-auto block px-3 sm:px-6 md:px-8 py-1.5 sm:py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white rounded-full font-bold text-[10px] sm:text-sm md:text-base hover:shadow-xl hover:scale-105 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-3 border border-amber-400/30 shadow-[0_8px_30px_rgba(251,146,60,0.4)]"
              >
                {isGeneratingBanner ? (
                  <>
                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 animate-spin" />
                    <span className="text-[10px] sm:text-sm md:text-base">Generating AI Banner...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                    <span className="text-[10px] sm:text-sm md:text-base">Generate Banner with AI</span>
                  </>
                )}
              </button>
            )}

            {bannerImage && (
              <div className="mt-4 relative">
                <div className="relative rounded-lg overflow-hidden shadow-lg border-2 border-amber-300">
                  <img
                    src={bannerImage || "/placeholder.svg"}
                    alt="Generated banner"
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-8">
                    <h2 className="text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] px-4 text-center">
                      {collectionTitle}
                    </h2>
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="productUrl" className="text-[#654321] font-semibold text-sm sm:text-base">
                  Product URL
                </Label>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Input
                  type="url"
                  placeholder="https://www.amazon.com/product-name/dp/B123456789"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  className="flex-1 text-xs sm:text-sm md:text-base px-2 sm:px-3 py-1.5 sm:py-2"
                />
              </div>

              {isExtractingProduct && (
                <div className="flex items-center gap-2 mt-2 text-amber-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Extracting Product URL......</span>
                </div>
              )}
            </div>

            {extractedProduct && (
              <div className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 overflow-hidden hover:shadow-xl transition-all">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4">
                  {/* Product Image - Top on mobile, Left on larger screens */}
                  <div className="relative w-full h-48 sm:w-48 md:w-56 lg:w-64 sm:h-48 md:h-56 lg:h-64 bg-gray-100 sm:flex-shrink-0 rounded-lg overflow-hidden group">
                    {!extractedProduct.imageUrl && (
                      <label
                        htmlFor="product-image-upload"
                        className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors z-10"
                      >
                        <Package className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mb-2" />
                        <span className="text-[10px] sm:text-xs text-gray-600 text-center px-2">
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
                          className="w-full h-full object-contain p-1 sm:p-2"
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
                            <Upload className="w-4 h-4 sm:w-6 sm:h-6 mx-auto mb-1" />
                            <span className="text-[10px] sm:text-xs">Change Image</span>
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

                  {/* Product Content - Bottom on mobile, Right on larger screens */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    {/* Product Title */}
                    <h3 className="text-[11px] sm:text-sm font-bold text-gray-800 mb-1 line-clamp-2">
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
                      <p className="text-[10px] sm:text-xs text-gray-600 mb-2 line-clamp-3">
                        {extractedProduct.description}
                      </p>
                    )}

                    {/* Product Details - Compact Grid */}
                    <div className="bg-gray-50 rounded-lg p-2 sm:p-2.5 mb-2 sm:mb-3 flex-grow">
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-[10px] sm:text-sm font-semibold text-gray-700">Product Details</h4>
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
                              setManualFeatures(extractedProduct.attributes?.material || "")
                            }
                          }}
                          className="text-[10px] sm:text-xs text-[#8B5A3C] hover:text-[#DAA520] flex items-center gap-1"
                        >
                          {isEditingProduct ? (
                            <>
                              <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              Save
                            </>
                          ) : (
                            <>
                              <Edit2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              Edit
                            </>
                          )}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-1 gap-y-1 sm:gap-x-1.5 sm:gap-y-1.5 text-[10px] sm:text-xs">
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
                                  className="w-full px-1 py-0.5 text-[10px] sm:text-xs border rounded"
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
                                  className="w-full px-1 py-0.5 text-[10px] sm:text-xs border rounded"
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
                                  value={manualFeatures}
                                  onChange={(e) => setManualFeatures(e.target.value)}
                                  className="w-full px-1 py-0.5 text-[10px] sm:text-xs border rounded"
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

                        {/* Type - Show for Clothing */}
                        {extractedProduct.attributes?.type && extractedProduct.category === "Clothing" && (
                          <>
                            <div className="text-gray-600 font-medium">Type:</div>
                            <div className="text-gray-800">{extractedProduct.attributes.type}</div>
                          </>
                        )}

                        {!extractedProduct.attributes?.type &&
                          extractedProduct.category === "Clothing" &&
                          extractedProduct.stockStatus &&
                          extractedProduct.stockStatus !== "Unknown" && (
                            <div className="flex items-baseline gap-1">
                              <span className="font-semibold text-gray-700">Stock:</span>
                              <span className="text-gray-600">{extractedProduct.stockStatus}</span>
                            </div>
                          )}

                        {/* Features */}
                        {extractedProduct.attributes?.features && (
                          <div className="flex items-baseline gap-1">
                            <span className="font-semibold text-gray-700">Features:</span>
                            <span className="text-gray-600">{extractedProduct.attributes.features}</span>
                          </div>
                        )}

                        {/* Size - Show for Clothing/Shoes */}
                        {["Clothing", "Shoes"].includes(extractedProduct.category) &&
                          extractedProduct.attributes?.size && (
                            <div className="flex items-baseline gap-1">
                              <span className="font-semibold text-gray-700">Size:</span>
                              <span className="text-gray-600">{extractedProduct.attributes.size}</span>
                            </div>
                          )}

                        {/* Capacity - For Appliances */}
                        {extractedProduct.attributes?.capacity &&
                          ["Appliances", "Kitchen Appliances", "Home Appliances", "Electronics"].includes(
                            extractedProduct.category,
                          ) && (
                            <div className="flex items-baseline gap-1">
                              <span className="font-semibold text-gray-700">Capacity:</span>
                              <span className="text-gray-600">{extractedProduct.attributes.capacity}</span>
                            </div>
                          )}

                        {/* Warranty - For Electronics/Appliances */}
                        {extractedProduct.attributes?.warranty &&
                          ["Electronics", "Appliances", "Kitchen Appliances", "Home Appliances"].includes(
                            extractedProduct.category,
                          ) && (
                            <div className="flex items-baseline gap-1">
                              <span className="font-semibold text-gray-700">Warranty:</span>
                              <span className="text-gray-600">{extractedProduct.attributes.warranty}</span>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <a
                        href={extractedProduct.productLink || productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#DAA520] to-[#FFD700] text-white rounded-full text-xs sm:text-sm font-semibold hover:from-[#B8860B] hover:to-[#DAA520] transition-all duration-200 border border-[#DAA520]/30 shadow-md hover:shadow-lg"
                      >
                        <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        View Product
                      </a>
                      <button
                        onClick={handleRefreshProduct}
                        disabled={isRefreshing}
                        className="px-2 py-1 text-xs font-semibold text-[#DAA520] bg-white border border-[#DAA520] rounded-lg hover:bg-[#DAA520] hover:text-white transition-all disabled:opacity-50"
                      >
                        {isRefreshing ? "Refreshing..." : "Refresh Details"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Choose Your Preferred Options - PREFERENCE LEVEL (REQUIRED) */}
                {/* 
                  WHY PREFERENCE LEVELS ARE REQUIRED:
                  - Prevents delays: Contributors need clear guidance on which variant to purchase
                  - Avoids wrong purchases: Without preferences, contributors may hesitate or guess
                  - Reduces returns: Correct variant selection the first time saves time and money
                  - Ensures timely delivery: Clear preferences lead to faster purchase decisions
                  - Without complete preference information, gift purchases may be delayed
                  
                  This section appears when a product has color or size attributes.
                  All preference levels are REQUIRED to prevent delays in buying gifts.
                */}
                {extractedProduct && (extractedProduct.attributes?.color || extractedProduct.attributes?.size) && (
                  <div className="mt-4 space-y-4 bg-amber-50 border-2 border-amber-200 rounded-xl p-4 shadow-lg">
                    <div className="flex items-start gap-2 mb-3">
                      <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <h3 className="text-sm font-bold text-amber-900">Choose Your Preferred Options</h3>
                          {/* Paste Selected Options URL Button - Same styling as AI Extract in Add Affiliate Product */}
                          {productUrl && (
                            <Button
                              type="button"
                              onClick={async () => {
                                if (!productUrl.trim()) {
                                  toast({
                                    title: "Error",
                                    description: "Please enter a product URL first",
                                    variant: "destructive",
                                  })
                                  return
                                }

                                setIsExtractingVariants(true)
                                try {
                                  const response = await fetch("/api/ai/extract-product", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ url: productUrl }),
                                  })

                                  if (!response.ok) throw new Error("Failed to extract variants")

                                  const data = await response.json()
                                  const extracted = data.productData || data

                                  // Update extracted product with new variant data
                                  if (extracted.attributes) {
                                    setExtractedProduct((prev) => ({
                                      ...prev!,
                                      attributes: {
                                        ...prev!.attributes,
                                        color: extracted.attributes.color || prev!.attributes.color,
                                        size: extracted.attributes.size || prev!.attributes.size,
                                      },
                                    }))
                                  }

                                  toast({
                                    title: "Variants Extracted!",
                                    description: "Available variants have been extracted from the URL",
                                  })
                                } catch (error) {
                                  toast({
                                    title: "Extraction Failed",
                                    description: "Could not extract variants. Please select preferences manually.",
                                    variant: "destructive",
                                  })
                                } finally {
                                  setIsExtractingVariants(false)
                                }
                              }}
                              disabled={isExtractingVariants || !productUrl.trim()}
                              className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
                            >
                              {isExtractingVariants ? (
                                <>
                                  <Loader2 className="mr-1.5 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                  <span className="hidden sm:inline">Extracting...</span>
                                  <span className="sm:hidden">...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="mr-1.5 h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="hidden sm:inline">Paste Selected Options URL</span>
                                  <span className="sm:hidden">Paste URL</span>
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-amber-800">
                          <strong>PREFERENCE LEVEL is required for all variants.</strong> This ensures contributors know
                          exactly which variant to purchase, preventing delays and ensuring your gift is purchased
                          correctly the first time.
                        </p>
                      </div>
                    </div>

                    {/* Unified Preference Level Field */}
                    <div className="bg-white rounded-lg p-3 border border-amber-300">
                      <div className="space-y-3">
                        {/* Show available variants */}
                        <div className="flex flex-wrap gap-2">
                          {extractedProduct.attributes?.color && (
                            <div className="text-xs font-semibold text-gray-700">
                              Color: <span className="text-gray-600 font-normal">{extractedProduct.attributes.color}</span>
                            </div>
                          )}
                          {extractedProduct.attributes?.size && (
                            <div className="text-xs font-semibold text-gray-700">
                              Size: <span className="text-gray-600 font-normal">{extractedProduct.attributes.size}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Single Preference Level Selector */}
                        <div>
                          <Label className="text-sm font-semibold text-[#654321] flex items-center gap-1 mb-1">
                            PREFERENCE LEVEL <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={variantPreference}
                            onValueChange={(value) => {
                              setVariantPreference(value as "I Like" | "Alternative" | "Optional")
                              setPreferenceError("")
                            }}
                          >
                            <SelectTrigger className={`w-full ${preferenceError ? "border-red-500" : ""}`}>
                              <SelectValue placeholder="Select preference level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="I Like">I Like</SelectItem>
                              <SelectItem value="Alternative">Alternative</SelectItem>
                              <SelectItem value="Optional">Optional</SelectItem>
                            </SelectContent>
                          </Select>
                          {preferenceError && (
                            <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>{preferenceError}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-amber-700 bg-amber-100 border border-amber-300 rounded-lg p-2 mt-2">
                      <strong>Remember:</strong> Complete all preference levels to prevent delays in gift purchases.
                      Contributors need clear guidance to purchase the correct variant.
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="giftName" className="text-[#654321] font-semibold text-sm sm:text-base">
                  Gift Name *
                </Label>
              </div>
              <Input
                type="text"
                id="giftName"
                value={giftName}
                onChange={(e) => setGiftName(e.target.value)}
                placeholder="e.g., De'Longhi Espresso Machine"
                className="border-2 border-[#DAA520]/30 focus:border-[#DAA520] text-xs sm:text-sm md:text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="recipientName" className="text-[#654321] font-semibold text-sm sm:text-base">
                  Recipient Name *
                </Label>
              </div>
              <Input
                type="text"
                id="recipientName"
                placeholder="Who is this gift for?"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="border-2 border-[#DAA520]/30 focus:border-[#DAA520] text-xs sm:text-sm md:text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="occasion" className="text-[#654321] font-semibold text-sm sm:text-base">
                  Occasion *
                </Label>
              </div>
              <select
                id="occasion"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="border-2 border-[#DAA520]/30 focus:border-[#DAA520] w-full p-2 sm:p-3 rounded-lg bg-white text-[#654321] text-xs sm:text-sm md:text-base"
                required
              >
                <option value="">Select an occasion...</option>
                <option value="Birthday">Birthday</option>
                <option value="Wedding">Wedding</option>
                <option value="Anniversary">Anniversary</option>
                <option value="Graduation">Graduation</option>
                <option value="Baby Shower">Baby Shower</option>
                <option value="Housewarming">Housewarming</option>
                <option value="Retirement">Retirement</option>
                <option value="Christmas">Christmas</option>
                <option value="Valentine's Day">Valentine's Day</option>
                <option value="Mother's Day">Mother's Day</option>
                <option value="Father's Day">Father's Day</option>
                <option value="Engagement">Engagement</option>
                <option value="Get Well Soon">Get Well Soon</option>
                <option value="Congratulations">Congratulations</option>
                <option value="Thank You">Thank You</option>
                <option value="Just Because">Just Because</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="targetAmount" className="text-[#654321] font-semibold text-sm sm:text-base">
                  Target Amount (USD) *
                </Label>
              </div>
              <Input
                id="targetAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g., 100"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="border-2 border-[#DAA520]/30 focus:border-[#DAA520] text-xs sm:text-sm md:text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="description" className="text-sm sm:text-base font-semibold text-[#8B4513]">
                    Description
                  </Label>
                </div>
                <Button
                  type="button"
                  onClick={handleEnhanceDescription}
                  disabled={isEnhancingDescription || !description.trim()}
                  size="sm"
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white text-[10px] sm:text-xs font-semibold rounded-full border-2 border-amber-400/30 shadow-[0_4px_15px_rgba(251,146,60,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_6px_20px_rgba(251,146,60,0.6)] hover:scale-105"
                >
                  {isEnhancingDescription ? (
                    <>
                      <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                      <span className="hidden sm:inline">Enhancing...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-pulse" />
                      <span className="hidden sm:inline">AI Enhance</span>
                      <span className="sm:hidden">AI</span>
                    </>
                  )}
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/30 border-2 border-[#DAA520]/30 border-b-0 rounded-t-lg">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => document.execCommand("bold")}
                  className="h-6 sm:h-8 px-1 sm:px-2 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-blue-600/20 transition-all"
                  title="Bold"
                >
                  <Bold className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-blue-600" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => document.execCommand("italic")}
                  className="h-6 sm:h-8 px-1 sm:px-2 hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-purple-600/20 transition-all"
                  title="Italic"
                >
                  <Italic className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-purple-600" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => document.execCommand("underline")}
                  className="h-6 sm:h-8 px-1 sm:px-2 hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-pink-600/20 transition-all"
                  title="Underline"
                >
                  <Underline className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-pink-600" />
                </Button>

                <div className="w-px h-4 sm:h-6 bg-[#DAA520]/30" />

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => document.execCommand("justifyLeft")}
                  className="h-6 sm:h-8 px-1 sm:px-2 hover:bg-gradient-to-r hover:from-green-500/20 hover:to-green-600/20 transition-all"
                  title="Align Left"
                >
                  <AlignLeft className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-green-600" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => document.execCommand("justifyCenter")}
                  className="h-6 sm:h-8 px-1 sm:px-2 hover:bg-gradient-to-r hover:from-teal-500/20 hover:to-teal-600/20 transition-all"
                  title="Align Center"
                >
                  <AlignCenter className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-teal-600" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => document.execCommand("justifyRight")}
                  className="h-6 sm:h-8 px-1 sm:px-2 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-cyan-600/20 transition-all"
                  title="Align Right"
                >
                  <AlignRight className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-cyan-600" />
                </Button>

                <div className="w-px h-4 sm:h-6 bg-[#DAA520]/30" />

                <div className="relative" ref={colorPickerRef}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="h-6 sm:h-8 px-1 sm:px-2 hover:bg-gradient-to-r hover:from-rose-500/20 hover:to-rose-600/20 transition-all"
                    title="Text Color"
                  >
                    <Palette className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-rose-600" />
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => document.execCommand("fontSize", false, "5")}
                  className="h-6 sm:h-8 px-1 sm:px-2 hover:bg-gradient-to-r hover:from-amber-500/20 hover:to-amber-600/20 transition-all"
                  title="Increase Font Size"
                >
                  <Type className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-amber-600" />
                </Button>

                <div className="w-px h-4 sm:h-6 bg-[#DAA520]/30" />

                {["😀", "🎉", "🎁", "❤️", "🎂", "🎈", "🎊", "✨", "🌟", "💝", "🏡", "🎓"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      if (descriptionEditorRef.current) {
                        descriptionEditorRef.current.innerHTML += emoji
                        setDescription(descriptionEditorRef.current.innerHTML)
                      }
                    }}
                    className="h-6 px-1 text-base sm:text-lg hover:bg-[#DAA520]/10 rounded transition-all hover:scale-110 sm:h-8 sm:px-2"
                    title={`Insert ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {showColorPicker && (
                <div className="absolute z-10 bg-white p-3 rounded-lg shadow-xl border-2 border-[#DAA520]/30 mt-1">
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      "#000000",
                      "#FF0000",
                      "#00FF00",
                      "#0000FF",
                      "#FFFF00",
                      "#FF00FF",
                      "#00FFFF",
                      "#DAA520",
                      "#8B4513",
                      "#800080",
                      "#FFA500",
                      "#008000",
                    ].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          document.execCommand("foreColor", false, color)
                          setShowColorPicker(false)
                        }}
                        className="w-8 h-8 rounded border-2 border-gray-300 hover:border-[#DAA520]"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div
                ref={descriptionEditorRef}
                contentEditable
                onInput={() => {
                  if (descriptionEditorRef.current) {
                    setDescription(descriptionEditorRef.current.innerHTML)
                  }
                }}
                className="w-full min-h-[120px] p-3 border-2 border-[#DAA520]/30 rounded-b-lg focus:outline-none focus:border-[#DAA520] text-xs sm:text-sm md:text-base"
                style={{ whiteSpace: "pre-wrap" }}
              />
            </div>

            <div className="flex justify-center pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-gradient-to-r from-[#DAA520] to-[#FFD700] text-white rounded-full font-bold text-[10px] sm:text-sm hover:shadow-xl hover:scale-105 hover:from-[#B8860B] hover:to-[#DAA520] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-[#DAA520]/30 shadow-[0_8px_30px_rgba(218,165,32,0.4)]"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                    <span className="text-[10px] sm:text-sm">Creating Gift Collection...</span>
                  </>
                ) : (
                  <>
                    <Gift className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-[10px] sm:text-sm">Create Gift Collection</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateGiftFormClient
