/**
 * Variant Preference Utilities
 * 
 * This file contains utility functions for validating and managing product variant preferences.
 * 
 * WHY PREFERENCE LEVELS ARE REQUIRED:
 * ====================================
 * 
 * 1. PREVENTS DELAYS IN GIFT PURCHASES
 *    - Contributors need clear guidance on which variant (color, size, etc.) to purchase
 *    - Without preferences, contributors may hesitate or skip purchasing altogether
 *    - Missing information causes confusion and delays the gift buying process
 * 
 * 2. AVOIDS WRONG PURCHASES
 *    - Contributors may guess or purchase their own preference if guidance is missing
 *    - Wrong variants lead to disappointment and the need for returns/exchanges
 *    - Clear preferences ensure the gift recipient gets exactly what they want
 * 
 * 3. REDUCES RETURNS AND EXCHANGES
 *    - Correct variant selection the first time saves time, money, and frustration
 *    - Returns delay gift delivery and create additional work for all parties
 *    - Clear preferences minimize the risk of incorrect purchases
 * 
 * 4. ENSURES TIMELY GIFT DELIVERY
 *    - Contributors can make purchase decisions immediately when preferences are clear
 *    - No need to contact the gift recipient for clarification
 *    - Faster decisions lead to faster funding and gift delivery
 * 
 * 5. IMPROVES USER EXPERIENCE
 *    - Recipients get exactly what they want
 *    - Contributors feel confident in their purchase decisions
 *    - Overall gift-giving experience is smoother and more enjoyable
 */

import type { VariantPreference } from "@/components/product-variant-preference-selector"

/**
 * Validates that all variant preferences have been assigned a preference level
 * 
 * @param preferences - Array of variant preferences to validate
 * @returns Object containing validation result and any error messages
 * 
 * @example
 * ```ts
 * const { isValid, errors } = validateVariantPreferences(preferences)
 * if (!isValid) {
 *   console.error("Validation failed:", errors)
 *   return
 * }
 * ```
 */
export function validateVariantPreferences(preferences: VariantPreference[]): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  preferences.forEach((pref) => {
    if (!pref.preferenceLevel || pref.preferenceLevel === "") {
      errors.push(
        `Preference level is required for ${pref.variantLabel}: ${pref.selectedOption}. ` +
          `This ensures contributors know which variant to purchase, preventing delays in gift buying.`,
      )
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Gets the highest priority preference for a variant
 * Priority order: "I Like" > "Alternative" > "Optional"
 * 
 * @param preferences - Array of variant preferences
 * @param variantId - The variant ID to get the highest priority preference for
 * @returns The preference with the highest priority, or null if none found
 */
export function getHighestPriorityPreference(
  preferences: VariantPreference[],
  variantId: string,
): VariantPreference | null {
  const variantPreferences = preferences.filter((p) => p.variantId === variantId)

  if (variantPreferences.length === 0) {
    return null
  }

  const priorityOrder = { "I Like": 1, Alternative: 2, Optional: 3 }

  return variantPreferences.reduce((highest, current) => {
    const currentPriority = priorityOrder[current.preferenceLevel as keyof typeof priorityOrder] || 999
    const highestPriority = priorityOrder[highest.preferenceLevel as keyof typeof priorityOrder] || 999

    return currentPriority < highestPriority ? current : highest
  })
}

/**
 * Formats preferences for display or API submission
 * 
 * @param preferences - Array of variant preferences
 * @returns Formatted object ready for API submission
 */
export function formatPreferencesForSubmission(preferences: VariantPreference[]) {
  const validation = validateVariantPreferences(preferences)

  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(", ")}`)
  }

  return {
    preferences: preferences.map((pref) => ({
      variantId: pref.variantId,
      variantLabel: pref.variantLabel,
      option: pref.selectedOption,
      preferenceLevel: pref.preferenceLevel,
    })),
    timestamp: new Date().toISOString(),
  }
}
