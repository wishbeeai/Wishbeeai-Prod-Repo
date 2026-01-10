'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { X, Heart, Loader2, ExternalLink, Check, Plus, Trash2 } from 'lucide-react'

interface ProductOption {
  size?: string
  sizeOptions?: Array<{ size: string; price?: string }>
  color?: string
  colorVariants?: Array<{ color: string; image?: string }>
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
  variant?: string
  note?: string
  isFlexible: boolean
  acceptableAlternatives?: string[]
  preferenceLevel?: 'ideal' | 'acceptable' | 'nice-to-have'
  customSelections?: Array<{ label: string; value: string }>
}

export function WishlistOptionsModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  product,
  isLoading = false 
}: WishlistOptionsModalProps) {
  const [hasVisitedStore, setHasVisitedStore] = useState(false)
  const [customSelections, setCustomSelections] = useState<Array<{ label: string; value: string }>>([
    { label: 'Color', value: '' },
    { label: 'Size', value: '' },
  ])
  const [preferenceLevel, setPreferenceLevel] = useState<'ideal' | 'acceptable' | 'nice-to-have'>('ideal')
  const [note, setNote] = useState('')

  const handleOpenStore = () => {
    if (product.productUrl) {
      window.open(product.productUrl, '_blank', 'noopener,noreferrer')
      setHasVisitedStore(true)
    }
  }

  const handleConfirm = () => {
    // Filter out empty selections
    const validSelections = customSelections.filter(s => s.value.trim() !== '')
    
    onConfirm({
      customSelections: validSelections.length > 0 ? validSelections : undefined,
      preferenceLevel,
      note: note.trim() || undefined,
      isFlexible: preferenceLevel !== 'ideal',
      // Map to legacy fields for backward compatibility
      color: validSelections.find(s => s.label.toLowerCase() === 'color')?.value,
      size: validSelections.find(s => s.label.toLowerCase() === 'size')?.value,
      style: validSelections.find(s => s.label.toLowerCase() === 'style')?.value,
      variant: validSelections.find(s => s.label.toLowerCase() === 'variant')?.value,
    })
  }

  const resetForm = () => {
    setHasVisitedStore(false)
    setCustomSelections([
      { label: 'Color', value: '' },
      { label: 'Size', value: '' },
    ])
    setPreferenceLevel('ideal')
    setNote('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const updateSelection = (index: number, field: 'label' | 'value', newValue: string) => {
    setCustomSelections(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: newValue }
      return updated
    })
  }

  const addSelection = () => {
    setCustomSelections(prev => [...prev, { label: '', value: '' }])
  }

  const removeSelection = (index: number) => {
    setCustomSelections(prev => prev.filter((_, i) => i !== index))
  }

  const hasValidSelections = customSelections.some(s => s.value.trim() !== '')

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0 gap-0 border-2 border-amber-200 rounded-2xl">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-[#654321]">
              Choose Your Preferred Options
            </DialogTitle>
            <button 
              onClick={handleClose}
              className="p-1 rounded-full hover:bg-amber-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Product Preview Mini */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            {product.image && (
              <img 
                src={product.image} 
                alt={product.name}
                className="w-14 h-14 object-contain rounded-lg bg-white border border-gray-100"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
                {product.name}
              </h3>
              <p className="text-[#DAA520] font-bold text-sm mt-0.5">
                ${product.price.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Step 1: Open Retailer */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                hasVisitedStore 
                  ? 'bg-green-500 text-white' 
                  : 'bg-amber-100 text-amber-600'
              }`}>
                {hasVisitedStore ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">
                  Open retailer to select options
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  This opens {product.source || 'the store'} so you can select exact variants.
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleOpenStore}
              disabled={!product.productUrl}
              className="w-full h-11 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520] font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open on {product.source || 'Store'}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                After Return
              </span>
            </div>
          </div>

          {/* Step 2: Enter Selections */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                hasValidSelections 
                  ? 'bg-green-500 text-white' 
                  : 'bg-amber-100 text-amber-600'
              }`}>
                {hasValidSelections ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">
                  Selected on {product.source || 'Store'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enter the options you selected
                </p>
              </div>
            </div>

            {/* Custom Selection Fields */}
            <div className="space-y-2 pl-9">
              {customSelections.map((selection, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={selection.label}
                    onChange={(e) => updateSelection(index, 'label', e.target.value)}
                    placeholder="Option"
                    className="w-24 h-9 text-xs border-gray-200 focus:border-[#DAA520] focus:ring-[#DAA520]"
                  />
                  <span className="text-gray-400">:</span>
                  <Input
                    value={selection.value}
                    onChange={(e) => updateSelection(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 h-9 text-xs border-gray-200 focus:border-[#DAA520] focus:ring-[#DAA520]"
                  />
                  {customSelections.length > 1 && (
                    <button
                      onClick={() => removeSelection(index)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              
              <button
                onClick={addSelection}
                className="flex items-center gap-1.5 text-xs text-[#DAA520] hover:text-[#B8860B] font-medium mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add another option
              </button>
            </div>
          </div>

          {/* Preference Level */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">
              Preference Level
            </Label>
            <div className="space-y-2">
              {[
                { id: 'ideal', label: 'Ideal choice', sublabel: 'This is exactly what I want' },
                { id: 'acceptable', label: 'Acceptable alternative', sublabel: 'I would be happy with this' },
                { id: 'nice-to-have', label: 'Nice to have', sublabel: 'Only if available' },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setPreferenceLevel(option.id as typeof preferenceLevel)}
                  className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                    preferenceLevel === option.id
                      ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-[#DAA520] shadow-sm'
                      : 'bg-gray-50 border border-gray-200 hover:border-amber-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    preferenceLevel === option.id
                      ? 'border-[#DAA520] bg-[#DAA520]'
                      : 'border-gray-300'
                  }`}>
                    {preferenceLevel === option.id && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      preferenceLevel === option.id ? 'text-[#654321]' : 'text-gray-700'
                    }`}>
                      {option.label}
                    </p>
                    <p className="text-xs text-gray-500">{option.sublabel}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Additional Notes <span className="text-gray-400 font-normal">(optional)</span>
            </Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any special instructions..."
              className="resize-none h-16 border-gray-200 focus:border-[#DAA520] focus:ring-[#DAA520] text-sm"
              maxLength={200}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 flex gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 h-11 border-2 border-gray-300 text-gray-600 hover:bg-gray-100 font-semibold rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 h-11 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520] font-semibold rounded-xl shadow-md transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Adding...
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 mr-2" />
                Add to Wishlist
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
