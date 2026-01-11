"use client"

import { useState, useImperativeHandle, forwardRef } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Info } from "lucide-react"

/**
 * Product Variant Preference Selector Component
 * 
 * This component allows users to select product variants (color, size, etc.) and assign
 * preference levels to each variant. All preference levels are REQUIRED to ensure:
 * - Contributors know exactly which variant to purchase
 * - No delays occur due to missing preference information
 * - Gifts are purchased correctly the first time
 * - Reduces returns/exchanges due to wrong variant selection
 * 
 * IMPORTANT: All preference level fields are required to prevent delays in gift purchases.
 * Without complete preference information, contributors may hesitate or purchase incorrect variants,
 * leading to delays, returns, and disappointment.
 */

export interface VariantOption {
  id: string
  label: string // e.g., "Red", "Medium", "Large"
  value: string
}

export interface VariantPreference {
  variantId: string
  variantLabel: string
  selectedOption: string
  preferenceLevel: "I Like" | "Alternative" | "Optional" | ""
}

export interface ProductVariantPreferenceSelectorRef {
  validate: () => boolean
  getPreferences: () => VariantPreference[]
}

interface ProductVariantPreferenceSelectorProps {
  variants: Array<{
    id: string
    label: string // e.g., "Color", "Size"
    options: VariantOption[]
  }>
  onPreferencesChange?: (preferences: VariantPreference[]) => void
  initialPreferences?: VariantPreference[]
}

export const ProductVariantPreferenceSelector = forwardRef<
  ProductVariantPreferenceSelectorRef,
  ProductVariantPreferenceSelectorProps
>(({ variants, onPreferencesChange, initialPreferences = [] }, ref) => {
  const [preferences, setPreferences] = useState<VariantPreference[]>(() => {
    if (initialPreferences.length > 0) {
      return initialPreferences
    }
    // Initialize with empty preferences for each variant
    return variants.flatMap((variant) =>
      variant.options.map((option) => ({
        variantId: variant.id,
        variantLabel: variant.label,
        selectedOption: option.value,
        preferenceLevel: "" as const,
      })),
    )
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handlePreferenceChange = (
    variantId: string,
    optionValue: string,
    preferenceLevel: "I Like" | "Alternative" | "Optional",
  ) => {
    const updatedPreferences = preferences.map((pref) =>
      pref.variantId === variantId && pref.selectedOption === optionValue
        ? { ...pref, preferenceLevel }
        : pref,
    )

    setPreferences(updatedPreferences)

    // Clear error for this field
    const errorKey = `${variantId}-${optionValue}`
    const newErrors = { ...errors }
    delete newErrors[errorKey]
    setErrors(newErrors)

    // Notify parent component
    if (onPreferencesChange) {
      onPreferencesChange(updatedPreferences)
    }
  }

  const validatePreferences = (): boolean => {
    const newErrors: Record<string, string> = {}

    preferences.forEach((pref) => {
      const errorKey = `${pref.variantId}-${pref.selectedOption}`
      if (!pref.preferenceLevel || pref.preferenceLevel === "") {
        newErrors[errorKey] = "Preference level is required"
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Expose validation and preferences via ref
  useImperativeHandle(ref, () => ({
    validate: validatePreferences,
    getPreferences: () => preferences,
  }))

  return (
    <div className="space-y-6">
      {/* Header with explanation */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-amber-900 mb-1">Choose Your Preferred Options</h3>
            <p className="text-xs text-amber-800 mb-2">
              <strong>All preference levels are required.</strong> This ensures contributors know exactly which variant
              to purchase, preventing delays and ensuring your gift is purchased correctly the first time.
            </p>
            <p className="text-xs text-amber-700">
              Setting preferences helps avoid wrong purchases, returns, and ensures timely gift delivery.
            </p>
          </div>
        </div>
      </div>

      {/* Variant Selection Sections */}
      {variants.map((variant) => (
        <div key={variant.id} className="space-y-3">
          <Label className="text-sm font-bold text-[#654321] flex items-center gap-2">
            {variant.label}
            <span className="text-red-500">*</span>
          </Label>

          <div className="space-y-3">
            {variant.options.map((option) => {
              const errorKey = `${variant.id}-${option.value}`
              const currentPreference = preferences.find(
                (p) => p.variantId === variant.id && p.selectedOption === option.value,
              )

              return (
                <div key={option.value} className="bg-white border-2 border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <Label className="text-sm font-semibold text-gray-700">{option.label}</Label>
                    </div>

                    <div className="flex-1 max-w-xs">
                      <Label className="text-xs font-semibold text-gray-600 mb-1 block">
                        PREFERENCE LEVEL <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={currentPreference?.preferenceLevel || ""}
                        onValueChange={(value) =>
                          handlePreferenceChange(
                            variant.id,
                            option.value,
                            value as "I Like" | "Alternative" | "Optional",
                          )
                        }
                        required
                      >
                        <SelectTrigger
                          className={`w-full ${
                            errors[errorKey]
                              ? "border-red-500 focus:border-red-500"
                              : "border-gray-300 focus:border-[#DAA520]"
                          }`}
                        >
                          <SelectValue placeholder="Select preference level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="I Like">
                            <div className="flex flex-col">
                              <span className="font-semibold">I Like</span>
                              <span className="text-xs text-gray-500">My preferred choice</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Alternative">
                            <div className="flex flex-col">
                              <span className="font-semibold">Alternative</span>
                              <span className="text-xs text-gray-500">Acceptable alternative</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Optional">
                            <div className="flex flex-col">
                              <span className="font-semibold">Optional</span>
                              <span className="text-xs text-gray-500">Nice to have if available</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {errors[errorKey] && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                          <AlertCircle className="w-3 h-3" />
                          <span>{errors[errorKey]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Footer reminder */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800 text-center">
          <strong>Remember:</strong> Complete all preference levels to ensure your gift is purchased correctly and
          delivered on time.
        </p>
      </div>
    </div>
  )
})

ProductVariantPreferenceSelector.displayName = "ProductVariantPreferenceSelector"

/**
 * Validation helper function
 * Call this before submitting forms to ensure all preference levels are set
 * 
 * WHY THIS IS REQUIRED:
 * - Prevents delays: Contributors need clear guidance on which variant to purchase
 * - Avoids wrong purchases: Without preferences, contributors may guess or skip purchasing
 * - Reduces returns: Correct variant selection the first time saves time and money
 * - Ensures timely delivery: Clear preferences lead to faster purchase decisions
 */
export function validateVariantPreferences(preferences: VariantPreference[]): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  preferences.forEach((pref) => {
    if (!pref.preferenceLevel || pref.preferenceLevel === "") {
      errors.push(
        `Preference level is required for ${pref.variantLabel}: ${pref.selectedOption}. This ensures contributors know which variant to purchase, preventing delays in gift buying.`,
      )
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}
