'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Heart, Loader2, Store } from 'lucide-react'

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

  // Get available SELECTABLE options from product attributes
  // Only show options that the user can actually choose from
  const sizeOptions = product.attributes?.sizeOptions || []
  const colorVariants = product.attributes?.colorVariants || []
  const combinedVariants = product.attributes?.combinedVariants || []
  const styleOptions = product.attributes?.styleOptions || []
  const configOptions = product.attributes?.configurationOptions || []
  
  // Show color options if there are color variants available
  // Even a single color can be shown for confirmation
  const colorOptions = colorVariants.length > 0 ? colorVariants : []
  
  // Check if we have combined variants (priority over separate size/color)
  const hasCombinedVariants = combinedVariants.length > 0

  // Check if there are any SELECTABLE options to show
  // Material and Capacity are product attributes, NOT selectable options
  const hasOptions = hasCombinedVariants || sizeOptions.length > 0 || colorOptions.length > 0 || styleOptions.length > 0 || configOptions.length > 0
  
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
      isFlexible
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
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0 border-2 border-amber-200 rounded-2xl">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-[#654321]">
              Choose your preferred options
            </DialogTitle>
            <button 
              onClick={handleClose}
              className="p-1 rounded-full hover:bg-amber-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Product Info */}
          <div className="flex gap-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
            {/* Product Image - updates based on selected color */}
            <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-white border border-amber-200 shadow-sm relative">
              {currentDisplayImage ? (
                <img 
                  src={currentDisplayImage} 
                  alt={product.name}
                  className="w-full h-full object-contain transition-all duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <Heart className="w-8 h-8 text-gray-300" />
                </div>
              )}
              {/* Show color indicator when variant image is displayed */}
              {selectedColor && colorOptions.find(opt => opt.color === selectedColor)?.image && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center py-0.5 truncate px-1">
                  {selectedColor}
                </div>
              )}
            </div>
            
            {/* Product Details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[#654321] text-sm leading-tight line-clamp-2 mb-1">
                {product.name}
              </h3>
              {/* Show selected variant name if chosen */}
              {selectedVariant && (
                <p className="text-xs text-amber-600 font-medium mb-1">
                  {selectedVariant}
                </p>
              )}
              <p className="text-lg font-bold text-[#DAA520] mb-1">
                {getSelectedPrice()}
              </p>
              {product.source && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Store className="w-3 h-3" />
                  <span>Store: {product.source}</span>
                </div>
              )}
            </div>
          </div>

          {hasOptions ? (
            <>
              {/* Combined Variants (Size + Color together) */}
              {hasCombinedVariants && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-[#654321]">
                    Select Variant <span className="text-red-500">*</span>
                  </Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {combinedVariants.map((variant, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedVariant(variant.name)}
                        className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all text-left flex justify-between items-center ${
                          selectedVariant === variant.name
                            ? 'bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white shadow-md ring-2 ring-[#DAA520] ring-offset-2'
                            : 'bg-gray-100 text-gray-700 hover:bg-amber-100 hover:text-[#654321] border border-gray-200'
                        }`}
                      >
                        <span>{variant.name}</span>
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
                  <div className="flex flex-wrap gap-2">
                    {sizeOptions.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSize(option.size)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          selectedSize === option.size
                            ? 'bg-[#DAA520] text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-amber-100 hover:text-[#654321]'
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
                  <Label className="text-sm font-semibold text-[#654321]">
                    Color <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedColor(option.color)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                          selectedColor === option.color
                            ? 'bg-[#654321] text-white shadow-md ring-2 ring-[#DAA520] ring-offset-2'
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
                    <SelectTrigger className="w-full border-amber-200 focus:border-[#DAA520] focus:ring-[#DAA520]">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      {styleOptions.map((style, idx) => (
                        <SelectItem key={idx} value={style}>
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
                    <SelectTrigger className="w-full border-amber-200 focus:border-[#DAA520] focus:ring-[#DAA520]">
                      <SelectValue placeholder="Select configuration" />
                    </SelectTrigger>
                    <SelectContent>
                      {configOptions.map((config, idx) => (
                        <SelectItem key={idx} value={config}>
                          {config}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

            </>
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              No variant options available for this product.
            </div>
          )}

          {/* Note Field */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-[#654321]">
              Add a note <span className="text-gray-400">(optional)</span>
            </Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder=""
              className="resize-none h-20 border-amber-200 focus:border-[#DAA520] focus:ring-[#DAA520] text-sm"
              maxLength={200}
            />
            <p className="text-xs text-gray-400 text-right">{note.length}/200</p>
          </div>

          {/* Flexible Checkbox */}
          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <Checkbox
              id="flexible"
              checked={isFlexible}
              onCheckedChange={(checked) => setIsFlexible(checked === true)}
              className="border-2 border-amber-400 data-[state=checked]:bg-[#DAA520] data-[state=checked]:border-[#DAA520]"
            />
            <Label 
              htmlFor="flexible" 
              className="text-sm text-[#654321] cursor-pointer"
            >
              I'm flexible with options
            </Label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 flex gap-3 justify-end">
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
