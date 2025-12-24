"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Sparkles, CheckCircle, Package, Save, Loader2, AlertCircle } from "lucide-react"

interface ExtractedProduct {
  giftName: string
  currentPrice: number
  storeName: string
  description: string
  productImageUrl: string
  webLink: string
  quantity: number
  stockStatus: string
  category?: string
  attributes: {
    [key: string]: string | null
  }
}

export function TabbedWishlistCreator() {
  const { toast } = useToast()
  const router = useRouter()

  const [currentTab, setCurrentTab] = useState<"extract" | "review" | "save">("extract")

  const [productLink, setProductLink] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedProduct, setExtractedProduct] = useState<ExtractedProduct | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingAttributes, setIsGeneratingAttributes] = useState(false)

  const handleExtractProduct = async () => {
    if (!productLink.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a product URL or gift idea",
        variant: "destructive",
      })
      return
    }

    setIsExtracting(true)

    try {
      const response = await fetch("/api/ai/extract-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: productLink }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[v0] API error:", errorData)
        throw new Error(errorData.details || "Failed to extract product")
      }

      const data = await response.json()
      console.log("[v0] Extracted data:", data)

      const extracted: ExtractedProduct = {
        giftName: data.productName || data.name || "Unknown Product",
        currentPrice: data.price || 0,
        storeName: data.storeName || data.store || "Unknown Store",
        description: data.description || "No description available",
        productImageUrl: data.imageUrl || data.image || "/diverse-products-still-life.png",
        webLink: data.productLink || productLink,
        quantity,
        stockStatus: data.stockStatus || "In Stock",
        category: data.category || "",
        attributes: data.attributes || {},
      }

      setExtractedProduct(extracted)

      if (extracted.category) {
        await generateProductAttributes(extracted)
      }

      setCurrentTab("review")

      toast({
        title: "AI Extraction Complete!",
        description: "Product details have been extracted",
      })
    } catch (error) {
      console.error("[v0] Error:", error)
      toast({
        title: "Extraction Failed",
        description: error instanceof Error ? error.message : "Unable to extract product details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExtracting(false)
    }
  }

  const generateProductAttributes = async (product: ExtractedProduct) => {
    setIsGeneratingAttributes(true)
    try {
      const response = await fetch("/api/ai/generate-attributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: product.giftName,
          category: product.category,
          description: product.description,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.attributes) {
          setExtractedProduct((prev) => ({
            ...prev!,
            attributes: data.attributes,
          }))
        }
      }
    } catch (error) {
      console.error("[v0] Failed to generate attributes:", error)
    } finally {
      setIsGeneratingAttributes(false)
    }
  }

  const handleSaveToWishlist = async () => {
    if (!extractedProduct) return

    setIsSaving(true)

    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...extractedProduct,
          addedDate: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        toast({
          title: "Added to Wishlist!",
          description: `${extractedProduct.giftName} is now in your wishlist`,
        })
        router.push("/wishlist")
      } else {
        throw new Error("Failed to save to wishlist")
      }
    } catch (error) {
      console.error("[v0] Save error:", error)
      toast({
        title: "Save Failed",
        description: "Unable to add item to wishlist. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const updateProductField = (field: keyof ExtractedProduct, value: any) => {
    if (!extractedProduct) return
    setExtractedProduct({ ...extractedProduct, [field]: value })
  }

  return (
    <Card className="border-2 border-[#F4C430]/30 shadow-2xl bg-white/95 backdrop-blur-sm">
      <div className="flex border-b-2 border-gray-100 bg-gradient-to-r from-amber-50/50 to-orange-50/50">
        <Button
          onClick={() => setCurrentTab("extract")}
          className={`flex-1 py-4 px-4 font-semibold text-sm transition-all relative ${
            currentTab === "extract"
              ? "text-transparent bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text"
              : "text-gray-500 hover:text-gray-700"
          }`}
          variant="ghost"
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles className={`w-4 h-4 ${currentTab === "extract" ? "text-amber-500" : "text-gray-400"}`} />
            <span>1. Add Product</span>
            {extractedProduct && <CheckCircle className="w-4 h-4 text-green-500" />}
          </div>
          {currentTab === "extract" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
          )}
        </Button>

        <Button
          onClick={() => extractedProduct && setCurrentTab("review")}
          disabled={!extractedProduct}
          className={`flex-1 py-4 px-4 font-semibold text-sm transition-all relative ${
            currentTab === "review"
              ? "text-transparent bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text"
              : "text-gray-500 hover:text-gray-700"
          }`}
          variant="ghost"
        >
          <div className="flex items-center justify-center gap-2">
            <Package className={`w-4 h-4 ${currentTab === "review" ? "text-amber-500" : "text-gray-400"}`} />
            <span>2. Review Details</span>
          </div>
          {currentTab === "review" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
          )}
        </Button>

        <Button
          onClick={() => extractedProduct && setCurrentTab("save")}
          disabled={!extractedProduct}
          className={`flex-1 py-4 px-4 font-semibold text-sm transition-all relative ${
            currentTab === "save"
              ? "text-transparent bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text"
              : "text-gray-500 hover:text-gray-700"
          }`}
          variant="ghost"
        >
          <div className="flex items-center justify-center gap-2">
            <Save className={`w-4 h-4 ${currentTab === "save" ? "text-amber-500" : "text-gray-400"}`} />
            <span>3. Save to Wishlist</span>
          </div>
          {currentTab === "save" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
          )}
        </Button>
      </div>

      <CardContent className="p-6 sm:p-8">
        {currentTab === "extract" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product Link or Gift Idea <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={productLink}
                onChange={(e) => setProductLink(e.target.value)}
                placeholder="Paste URL or type 'wireless headphones'"
                className="border-2 border-gray-200 focus:border-amber-500 rounded-xl p-4"
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                AI finds the best price and product from trusted stores
              </p>
            </div>

            <div className="max-w-[150px]">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quantity <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                className="border-2 border-gray-200 focus:border-amber-500 rounded-xl p-4"
              />
            </div>

            <Button
              onClick={handleExtractProduct}
              disabled={!productLink.trim() || isExtracting}
              className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 rounded-xl font-semibold shadow-lg disabled:opacity-50"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  AI Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Extract with AI
                </>
              )}
            </Button>
          </div>
        )}

        {currentTab === "review" && extractedProduct && (
          <div className="space-y-6">
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-bold text-green-800">Extraction Complete!</h3>
                <p className="text-sm text-green-700">Review and edit the details below</p>
              </div>
            </div>

            <Card className="overflow-hidden hover:shadow-xl transition-shadow">
              <div className="relative h-64 bg-gray-100">
                <Image
                  src={extractedProduct.productImageUrl || "/placeholder.svg"}
                  alt={extractedProduct.giftName}
                  fill
                  className="object-contain p-2"
                />
                {extractedProduct.stockStatus === "Low Stock" && (
                  <Badge className="absolute top-3 right-3 bg-orange-500 text-white">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Low Stock
                  </Badge>
                )}
                <Button
                  onClick={() => document.getElementById("image-upload")?.click()}
                  className="absolute bottom-3 right-3 bg-[#F4C430] text-[#8B4513] hover:bg-[#DAA520]"
                  size="sm"
                >
                  Change Image
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (event) => {
                        updateProductField("productImageUrl", event.target?.result as string)
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                />
              </div>

              <div className="p-5">
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Product Title</label>
                  <Input
                    value={extractedProduct.giftName}
                    onChange={(e) => updateProductField("giftName", e.target.value)}
                    className="font-bold text-lg"
                  />
                </div>

                <div className="flex items-center justify-between mb-3 gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Store</label>
                    <Input
                      value={extractedProduct.storeName}
                      onChange={(e) => updateProductField("storeName", e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Qty</label>
                    <Input
                      type="number"
                      min="1"
                      value={extractedProduct.quantity}
                      onChange={(e) => updateProductField("quantity", Number(e.target.value))}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={extractedProduct.currentPrice}
                    onChange={(e) => updateProductField("currentPrice", Number(e.target.value))}
                    className="text-2xl font-bold text-[#DAA520]"
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                  <Textarea
                    value={extractedProduct.description}
                    onChange={(e) => updateProductField("description", e.target.value)}
                    className="text-sm min-h-[60px]"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase">
                      Product Details {extractedProduct.category && `(${extractedProduct.category})`}
                    </h4>
                    {isGeneratingAttributes && <Loader2 className="w-4 h-4 animate-spin text-amber-500" />}
                  </div>

                  {Object.keys(extractedProduct.attributes).length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(extractedProduct.attributes)
                        .filter(([_, value]) => value !== null && value !== "")
                        .map(([key, value]) => (
                          <div
                            key={key}
                            className={key === "Care Instructions" || key === "Compatibility" ? "col-span-2" : ""}
                          >
                            <span className="font-semibold text-gray-700">{key}:</span>{" "}
                            <span className="text-gray-600">{value}</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-xs text-gray-500 mb-2">No product attributes generated</p>
                      <Button
                        onClick={() => generateProductAttributes(extractedProduct)}
                        disabled={isGeneratingAttributes}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                      >
                        {isGeneratingAttributes ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 mr-1" />
                            Generate Attributes with AI
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Button
              onClick={() => setCurrentTab("save")}
              className="w-full py-4 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#8B4513] hover:from-[#F4C430] hover:to-[#DAA520] rounded-xl font-semibold shadow-lg"
            >
              Continue to Save
            </Button>
          </div>
        )}

        {currentTab === "save" && extractedProduct && (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                <Save className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Ready to Save</h3>
              <p className="text-gray-600">{extractedProduct.giftName} will be added to your wishlist</p>
            </div>

            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <Image
                  src={extractedProduct.productImageUrl || "/placeholder.svg"}
                  alt={extractedProduct.giftName}
                  width={100}
                  height={100}
                  className="w-24 h-24 object-contain rounded-lg"
                />
                <div>
                  <h4 className="font-bold text-gray-900">{extractedProduct.giftName}</h4>
                  <p className="text-sm text-gray-600">{extractedProduct.storeName}</p>
                  <p className="text-2xl font-bold text-amber-600">${extractedProduct.currentPrice}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => setCurrentTab("extract")}
                variant="outline"
                className="flex-1 py-4 border-2 border-gray-300 rounded-xl font-semibold"
              >
                Start Over
              </Button>
              <Button
                onClick={handleSaveToWishlist}
                disabled={isSaving}
                className="flex-1 py-4 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#8B4513] hover:from-[#F4C430] hover:to-[#DAA520] rounded-xl font-semibold shadow-lg"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save to Wishlist
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
