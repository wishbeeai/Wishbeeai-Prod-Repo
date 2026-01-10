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
              <div className="flex items-center gap-2 text-sm font-semibold text-[#654321] border-b border-amber-100 pb-2">
                <ShoppingCart className="w-4 h-4" />
                OPTIONS PANEL
              </div>

              {hasOptions ? (
                <>
                  {/* Combined Variants (Size + Color together) */}
                  {hasCombinedVariants && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-[#654321]">
                        Select Variant <span className="text-red-500">*</span>
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
                      <Label className="text-sm font-semibold text-[#654321]">
                        Size <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex flex-wrap gap-1.5">
                        {sizeOptions.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedSize(option.size)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                              selectedSize === option.size
                                ? 'bg-[#DAA520] text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-amber-100 hover:text-[#654321]'
                            }`}
                          >
                            <span className={`w-3 h-3 rounded-full border ${
                              selectedSize === option.size 
                                ? 'border-white bg-white' 
                                : 'border-gray-400'
                            }`}>
                              {selectedSize === option.size && (
                                <span className="block w-full h-full rounded-full bg-[#DAA520] scale-50" />
                              )}
                            </span>
                            {option.size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Color Options - Only show if no combined variants */}
                  {!hasCombinedVariants && colorOptions.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-[#654321]">
                        Color <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex flex-wrap gap-1.5">
                        {colorOptions.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedColor(option.color)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                              selectedColor === option.color
                                ? 'bg-[#654321] text-white shadow-md ring-2 ring-[#DAA520] ring-offset-1'
                                : 'bg-gray-100 text-gray-700 hover:bg-amber-100 hover:text-[#654321]'
                            }`}
                          >
                            <span className={`w-3 h-3 rounded-full ${
                              selectedColor === option.color ? 'bg-white' : 'bg-gray-400'
                            }`} />
                            {option.color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Style Options */}
                  {styleOptions.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-[#654321]">Style</Label>
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
                      <Label className="text-sm font-semibold text-[#654321]">Configuration</Label>
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

                  {/* Acceptable Alternatives */}
                  {alternativeOptions.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-[#654321]">
                        Acceptable Alternatives
                      </Label>
                      <div className="space-y-1 max-h-24 overflow-y-auto pr-1 bg-gray-50 rounded-lg p-2">
                        {alternativeOptions.slice(0, 5).map((alt, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Checkbox
                              id={`alt-${idx}`}
                              checked={acceptableAlternatives.includes(alt)}
                              onCheckedChange={() => toggleAlternative(alt)}
                              className="border-amber-400 data-[state=checked]:bg-[#DAA520] data-[state=checked]:border-[#DAA520] h-3.5 w-3.5"
                            />
                            <Label 
                              htmlFor={`alt-${idx}`} 
                              className="text-xs text-gray-600 cursor-pointer truncate"
                            >
                              {alt} ok
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-gray-500 text-xs">
                  No variant options available for this product.
                </div>
              )}

              {/* Note Field */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-[#654321]">
                  Notes <span className="text-gray-400 text-xs">(optional)</span>
                </Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g., Medium preferred, Large also ok"
                  className="resize-none h-16 border-amber-200 focus:border-[#DAA520] focus:ring-[#DAA520] text-xs"
                  maxLength={200}
                />
              </div>

              {/* Flexible Checkbox */}
              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                <Checkbox
                  id="flexible"
                  checked={isFlexible}
                  onCheckedChange={(checked) => setIsFlexible(checked === true)}
                  className="border-2 border-amber-400 data-[state=checked]:bg-[#DAA520] data-[state=checked]:border-[#DAA520] h-4 w-4"
                />
                <Label 
                  htmlFor="flexible" 
                  className="text-xs text-[#654321] cursor-pointer"
                >
                  I'm flexible with options
                </Label>
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
                  {/* Product Image - Clickable */}
                  <button 
                    onClick={handleViewOnStore}
                    disabled={!product.productUrl}
                    className="w-full bg-white p-4 flex items-center justify-center border-b border-gray-100 min-h-[180px] cursor-pointer hover:bg-gray-50 transition-colors disabled:cursor-default disabled:hover:bg-white group"
                  >
                    {currentDisplayImage ? (
                      <div className="relative">
                        <img 
                          src={currentDisplayImage} 
                          alt={product.name}
                          className="max-w-full max-h-[200px] object-contain transition-all duration-300 group-hover:scale-105"
                        />
                        {product.productUrl && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg">
                            <div className="opacity-0 group-hover:opacity-100 bg-white/90 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 transition-opacity">
                              <ExternalLink className="w-4 h-4 text-[#DAA520]" />
                              <span className="text-xs font-semibold text-[#654321]">View on {product.source || 'Store'}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded-lg">
                        <Heart className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                  </button>

                  {/* Product Details - Scrollable */}
                  <div className="p-4 space-y-3 bg-gradient-to-b from-white to-gray-50">
                    {/* Title - Clickable */}
                    <button 
                      onClick={handleViewOnStore}
                      disabled={!product.productUrl}
                      className="text-left w-full group"
                    >
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-[#DAA520] transition-colors">
                        {product.name}
                      </h3>
                    </button>

                    {/* Selected Variant Badge */}
                    {selectedVariant && (
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          {selectedVariant}
                        </span>
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-[#DAA520]">
                        {getSelectedPrice()}
                      </span>
                      {product.source && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Store className="w-3 h-3" />
                          {product.source}
                        </span>
                      )}
                    </div>

                    {/* Rating */}
                    {product.rating && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {renderStars(product.rating)}
                        </div>
                        <span className="text-xs text-gray-500">
                          {product.rating.toFixed(1)}
                          {product.reviewCount && ` (${product.reviewCount})`}
                        </span>
                      </div>
                    )}

                    {/* Product Attributes Preview */}
                    {product.attributes && (
                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Product Details</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {product.attributes.combinedVariants && product.attributes.combinedVariants.length > 0 && (
                            <div className="col-span-2">
                              <span className="text-gray-400">Available Options:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {product.attributes.combinedVariants.slice(0, 6).map((v, i) => (
                                  <span key={i} className={`px-2 py-0.5 rounded-full text-[10px] ${
                                    selectedVariant === v.name 
                                      ? 'bg-[#DAA520] text-white' 
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {v.name}
                                  </span>
                                ))}
                                {product.attributes.combinedVariants.length > 6 && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-400">
                                    +{product.attributes.combinedVariants.length - 6} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          {product.attributes.sizeOptions && product.attributes.sizeOptions.length > 0 && (
                            <div>
                              <span className="text-gray-400">Sizes:</span>
                              <span className="ml-1 text-gray-700">
                                {product.attributes.sizeOptions.map(s => s.size).join(', ')}
                              </span>
                            </div>
                          )}
                          {product.attributes.colorVariants && product.attributes.colorVariants.length > 0 && (
                            <div>
                              <span className="text-gray-400">Colors:</span>
                              <span className="ml-1 text-gray-700">
                                {product.attributes.colorVariants.map(c => c.color).slice(0, 3).join(', ')}
                                {product.attributes.colorVariants.length > 3 && ` +${product.attributes.colorVariants.length - 3}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* URL Preview */}
                    {product.productUrl && (
                      <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-2 py-1.5 rounded-lg overflow-hidden">
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{product.productUrl}</span>
                      </div>
                    )}

                    {/* Scroll hint */}
                    <div className="text-center text-[10px] text-gray-300 pt-2">
                      ↓ Scroll for more details ↓
                    </div>
                  </div>
                </div>

                {/* Fixed View on Store Button */}
                {product.productUrl && (
                  <div className="p-3 bg-gray-50 border-t border-gray-100 flex-shrink-0">
                    <Button
                      onClick={handleViewOnStore}
                      variant="outline"
                      className="w-full h-9 border-2 border-[#DAA520] text-[#DAA520] hover:bg-[#DAA520] hover:text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on {product.source || 'Store'} to verify options
                    </Button>
                    <p className="text-[10px] text-gray-400 text-center mt-2">
                      Opens in a new tab. Select your exact options on the store page.
                    </p>
                  </div>
                )}
              </div>

              {/* Info Note */}
              <div className="text-xs text-gray-400 text-center bg-white/50 rounded-lg p-2 border border-gray-100">
                💡 Select your preferences on the left, then verify on the store page if needed
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
