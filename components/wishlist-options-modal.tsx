'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Heart, Loader2, Store, ExternalLink, ShoppingCart, Eye, Star, Check } from 'lucide-react'

interface ProductOption {
  size?: string
  sizeOptions?: Array<{ size: string; price?: string }>
  color?: string
  colorVariants?: Array<{ color: string; image?: string }>
  // Combined variants (Size + Color together, e.g., "7 Quarts Stainless Steel")
  combinedVariants?: Array<{ name: string; price?: string; image?: string }>
  styleOptions?: string[]
  configurationOptions?: string[]
}

interface WishlistOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selectedOptions: SelectedOptions) => void
  product: {
    name: string
    price: number
    image?: string
    source?: string
    productUrl?: string
    rating?: number
    reviewCount?: string
    attributes?: ProductOption
  }
  isLoading?: boolean
}

interface SelectedOptions {
  size?: string
  color?: string
  style?: string
  configuration?: string
  variant?: string // Combined variant selection (e.g., "7 Quarts Stainless Steel")
  note?: string
  isFlexible: boolean
  acceptableAlternatives?: string[]
}

export function WishlistOptionsModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  product,
  isLoading = false 
}: WishlistOptionsModalProps) {
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedStyle, setSelectedStyle] = useState<string>('')
  const [selectedConfig, setSelectedConfig] = useState<string>('')
  const [selectedVariant, setSelectedVariant] = useState<string>('') // Combined variant
  const [note, setNote] = useState('')
  const [isFlexible, setIsFlexible] = useState(false)
  const [acceptableAlternatives, setAcceptableAlternatives] = useState<string[]>([])

  // Get available SELECTABLE options from product attributes
  const sizeOptions = product.attributes?.sizeOptions || []
  const colorVariants = product.attributes?.colorVariants || []
  const combinedVariants = product.attributes?.combinedVariants || []
  const styleOptions = product.attributes?.styleOptions || []
  const configOptions = product.attributes?.configurationOptions || []
  
  // Show color options if there are color variants available
  const colorOptions = colorVariants.length > 0 ? colorVariants : []
  
  // Check if we have combined variants (priority over separate size/color)
  const hasCombinedVariants = combinedVariants.length > 0

  // Check if there are any SELECTABLE options to show
  const hasOptions = hasCombinedVariants || sizeOptions.length > 0 || colorOptions.length > 0 || styleOptions.length > 0 || configOptions.length > 0
  
  // Generate alternative options for checkbox list
  const alternativeOptions = hasCombinedVariants 
    ? combinedVariants.filter(v => v.name !== selectedVariant).map(v => v.name)
    : [
        ...sizeOptions.filter(s => s.size !== selectedSize).map(s => `Size: ${s.size}`),
        ...colorOptions.filter(c => c.color !== selectedColor).map(c => `Color: ${c.color}`)
      ]
  
  // Get the current display image based on selected variant or color
  const getCurrentImage = () => {
    // First check combined variants
    if (selectedVariant && combinedVariants.length > 0) {
      const variant = combinedVariants.find(v => v.name === selectedVariant)
      if (variant?.image) {
        return variant.image
      }
    }
    // Then check color variants
    if (selectedColor && colorOptions.length > 0) {
      const selectedColorVariant = colorOptions.find(opt => opt.color === selectedColor)
      if (selectedColorVariant?.image) {
        return selectedColorVariant.image
      }
    }
    return product.image
  }
  
  const currentDisplayImage = getCurrentImage()
  
  // Get price for selected variant
  const getSelectedPrice = () => {
    if (selectedVariant && combinedVariants.length > 0) {
      const variant = combinedVariants.find(v => v.name === selectedVariant)
      if (variant?.price) {
        return variant.price
      }
    }
    return `$${product.price.toFixed(2)}`
  }

  const handleConfirm = () => {
    onConfirm({
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      style: selectedStyle || undefined,
      configuration: selectedConfig || undefined,
      variant: selectedVariant || undefined,
      note: note.trim() || undefined,
      isFlexible,
      acceptableAlternatives: acceptableAlternatives.length > 0 ? acceptableAlternatives : undefined
    })
  }

  const resetForm = () => {
    setSelectedSize('')
    setSelectedColor('')
    setSelectedStyle('')
    setSelectedConfig('')
    setSelectedVariant('')
    setNote('')
    setIsFlexible(false)
    setAcceptableAlternatives([])
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const toggleAlternative = (alt: string) => {
    setAcceptableAlternatives(prev => 
      prev.includes(alt) 
        ? prev.filter(a => a !== alt)
        : [...prev, alt]
    )
  }

  const handleViewOnStore = () => {
    if (product.productUrl) {
      window.open(product.productUrl, '_blank', 'noopener,noreferrer')
    }
  }

  // Render star rating
  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
        )
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <Star className="w-3 h-3 text-gray-300" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            </div>
          </div>
        )
      } else {
        stars.push(
          <Star key={i} className="w-3 h-3 text-gray-300" />
        )
      }
    }
    return stars
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden p-0 gap-0 border-2 border-amber-200 rounded-2xl">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-bold text-[#654321]">
                Choose Your Preferred Options
              </DialogTitle>
              <p className="text-xs text-gray-500 mt-1">
                We'll use your preferences when purchasing
              </p>
            </div>
            <button 
              onClick={handleClose}
              className="p-1 rounded-full hover:bg-amber-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </DialogHeader>

        {/* Two-Panel Layout */}
        <div className="flex flex-col md:flex-row h-[calc(90vh-180px)] overflow-hidden">
          
          {/* LEFT PANEL - Options */}
          <div className="w-full md:w-[45%] overflow-y-auto border-r border-amber-100 bg-white">
            <div className="p-5 space-y-4">
              {/* Options Title */}
              <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#654321]">
                  <ShoppingCart className="w-4 h-4" />
                  SELECT YOUR OPTIONS
                </div>
                {hasOptions && (
                  <span className="text-[10px] text-red-500 font-medium">* Required</span>
                )}
              </div>

              {hasOptions ? (
                <>
                  {/* Combined Variants (Size + Color together) */}
                  {hasCombinedVariants && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Choose Variant
                      </Label>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {combinedVariants.map((variant, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedVariant(variant.name)}
                            className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-all text-left flex justify-between items-center ${
                              selectedVariant === variant.name
                                ? 'bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white shadow-md ring-2 ring-[#DAA520] ring-offset-1'
                                : 'bg-gray-50 text-gray-700 hover:bg-amber-50 hover:text-[#654321] border border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                selectedVariant === variant.name 
                                  ? 'border-white bg-white' 
                                  : 'border-gray-300'
                              }`}>
                                {selectedVariant === variant.name && (
                                  <span className="w-2 h-2 rounded-full bg-[#DAA520]" />
                                )}
                              </span>
                              <span>{variant.name}</span>
                            </div>
                            {variant.price && (
                              <span className={`font-bold ${
                                selectedVariant === variant.name ? 'text-white' : 'text-[#DAA520]'
                              }`}>
                                {variant.price}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Size Options - Only show if no combined variants */}
                  {!hasCombinedVariants && sizeOptions.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Choose Size
                      </Label>
                      <div className="flex flex-wrap gap-1.5">
                        {sizeOptions.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedSize(option.size)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                              selectedSize === option.size
                                ? 'bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white shadow-md ring-2 ring-[#DAA520] ring-offset-1'
                                : 'bg-gray-100 text-gray-700 hover:bg-amber-100 hover:text-[#654321] border border-gray-200'
                            }`}
                          >
                            {option.size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Color Options - Only show if no combined variants */}
                  {!hasCombinedVariants && colorOptions.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Choose Color
                      </Label>
                      <div className="flex flex-wrap gap-1.5">
                        {colorOptions.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedColor(option.color)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                              selectedColor === option.color
                                ? 'bg-gradient-to-r from-[#654321] to-[#8B4513] text-white shadow-md ring-2 ring-[#DAA520] ring-offset-1'
                                : 'bg-gray-100 text-gray-700 hover:bg-amber-100 hover:text-[#654321] border border-gray-200'
                            }`}
                          >
                            {option.color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Style Options */}
                  {styleOptions.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Style</Label>
                      <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                        <SelectTrigger className="w-full border-amber-200 focus:border-[#DAA520] focus:ring-[#DAA520] text-xs h-9">
                          <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent>
                          {styleOptions.map((style, idx) => (
                            <SelectItem key={idx} value={style} className="text-xs">
                              {style}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Configuration Options */}
                  {configOptions.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Configuration</Label>
                      <Select value={selectedConfig} onValueChange={setSelectedConfig}>
                        <SelectTrigger className="w-full border-amber-200 focus:border-[#DAA520] focus:ring-[#DAA520] text-xs h-9">
                          <SelectValue placeholder="Select configuration" />
                        </SelectTrigger>
                        <SelectContent>
                          {configOptions.map((config, idx) => (
                            <SelectItem key={idx} value={config} className="text-xs">
                              {config}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm">
                  <div className="text-3xl mb-2">✨</div>
                  No options to select for this product.
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                {/* Note Field */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Add a Note
                  </Label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Any preferences or instructions..."
                    className="resize-none h-16 border-amber-200 focus:border-[#DAA520] focus:ring-[#DAA520] text-xs"
                    maxLength={200}
                  />
                </div>

                {/* Flexible Checkbox */}
                <div className="flex items-center gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200 mt-3">
                  <Checkbox
                    id="flexible"
                    checked={isFlexible}
                    onCheckedChange={(checked) => setIsFlexible(checked === true)}
                    className="border-2 border-amber-400 data-[state=checked]:bg-[#DAA520] data-[state=checked]:border-[#DAA520] h-4 w-4"
                  />
                  <Label 
                    htmlFor="flexible" 
                    className="text-xs text-[#654321] cursor-pointer font-medium"
                  >
                    I'm flexible with options
                  </Label>
                </div>
              </div>

              {/* Save Button (Mobile) */}
              <div className="md:hidden pt-2">
                <Button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="w-full h-10 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520] font-semibold rounded-full shadow-md"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL - Live Product View (Scrollable) */}
          <div className="w-full md:w-[55%] bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col overflow-hidden">
            <div className="p-3 space-y-2 flex flex-col h-full">
              {/* Panel Title - Clickable */}
              <button 
                onClick={handleViewOnStore}
                disabled={!product.productUrl}
                className="flex items-center justify-between w-full group hover:opacity-80 transition-opacity disabled:cursor-default disabled:opacity-100 flex-shrink-0"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 group-hover:text-[#DAA520] transition-colors">
                  <Eye className="w-4 h-4" />
                  LIVE PRODUCT VIEW
                  {product.productUrl && <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </div>
                <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full border group-hover:border-[#DAA520] group-hover:text-[#DAA520] transition-colors">
                  Scrollable
                </span>
              </button>

              {/* Scrollable Product Content */}
              <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-0">
                {/* Scrollable Container */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
                  {/* Product Image */}
                  <div className="bg-gradient-to-b from-gray-50 to-white p-4 flex items-center justify-center min-h-[160px]">
                    {currentDisplayImage ? (
                      <img 
                        src={currentDisplayImage} 
                        alt={product.name}
                        className="max-w-full max-h-[180px] object-contain"
                      />
                    ) : (
                      <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-lg">
                        <Heart className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Product Info Card */}
                  <div className="p-4 space-y-3 border-t border-gray-100">
                    {/* Title & Selected Variant */}
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                        {product.name}
                      </h3>
                      {selectedVariant && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Check className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-xs font-medium text-green-700">
                            Selected: {selectedVariant}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Price & Rating Row */}
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-[#DAA520]">
                        {getSelectedPrice()}
                      </span>
                      {product.rating && (
                        <div className="flex items-center gap-1">
                          <div className="flex items-center gap-0.5">
                            {renderStars(product.rating)}
                          </div>
                          <span className="text-xs text-gray-500">
                            {product.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Store & Reviews */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      {product.source && (
                        <span className="flex items-center gap-1">
                          <Store className="w-3 h-3" />
                          {product.source}
                        </span>
                      )}
                      {product.reviewCount && (
                        <span>{product.reviewCount} reviews</span>
                      )}
                    </div>

                    {/* Selection Summary */}
                    {(selectedVariant || selectedSize || selectedColor) && (
                      <div className="border-t border-gray-100 pt-3 mt-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Your Selection
                        </p>
                        <div className="space-y-1.5">
                          {selectedVariant && (
                            <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                              <span className="text-sm font-medium text-green-800">{selectedVariant}</span>
                            </div>
                          )}
                          {selectedSize && !selectedVariant && (
                            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                              <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <span className="text-sm text-blue-800">Size: {selectedSize}</span>
                            </div>
                          )}
                          {selectedColor && !selectedVariant && (
                            <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                              <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
                              <span className="text-sm text-purple-800">Color: {selectedColor}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* No Selection Prompt */}
                    {!selectedVariant && !selectedSize && !selectedColor && hasOptions && (
                      <div className="border-t border-gray-100 pt-3 mt-3">
                        <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                          <span className="text-amber-600 text-lg">👈</span>
                          <span className="text-sm text-amber-700">Select your preferred option from the left panel</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fixed View on Store Button */}
                {product.productUrl && (
                  <div className="p-3 bg-gradient-to-t from-gray-100 to-gray-50 border-t border-gray-200 flex-shrink-0">
                    <Button
                      onClick={handleViewOnStore}
                      className="w-full h-10 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520] font-semibold rounded-lg transition-all flex items-center justify-center gap-2 text-sm shadow-md"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on {product.source || 'Store'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer (Desktop) */}
        <div className="hidden md:flex px-6 py-4 border-t border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 gap-3 justify-end">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="px-6 border-2 border-[#8B4513] text-[#8B4513] hover:bg-[#8B4513] hover:text-white font-semibold rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-6 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520] font-semibold rounded-full shadow-md hover:shadow-lg transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Adding...
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 mr-2" />
                Add to My Wishlist
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
