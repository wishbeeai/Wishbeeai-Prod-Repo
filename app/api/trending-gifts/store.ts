// In-memory store for trending gifts (affiliate products added to trending gifts)
// In production, this would be stored in a database

interface ProductAttributes {
  brand?: string
  capacity?: string
  material?: string
  finishType?: string
  productDimensions?: string
  wattage?: string
  itemWeight?: string
  controlMethod?: string
  operationMode?: string
  specialFeature?: string
  color?: string
  size?: string
  sizeOptions?: Array<{size: string, price?: string}>
  customFields?: Array<{name: string, value: string}>
  // Color Variants (for watches, electronics)
  colorVariants?: Array<{color: string}>
  // Style and Configuration Options
  styleOptions?: string[]
  configurationOptions?: string[]
  // Style/Pattern attributes
  styleName?: string
  patternName?: string
  model?: string
  // Electronics-specific attributes
  operatingSystem?: string
  storageCapacity?: string
  ram?: string
  connectivityTechnology?: string
  wirelessStandard?: string
  batteryType?: string
  gpsType?: string
  shape?: string
  screenSize?: string
  resolution?: string
  processor?: string
  compatibleDevices?: string
  waterResistance?: string
  style?: string
  configuration?: string
  // Audio/Headphone-specific attributes
  earPlacement?: string
  formFactor?: string
  noiseControl?: string
  modelName?: string
  wirelessTechnology?: string
  controlType?: string
  bluetoothVersion?: string
  earpieceShape?: string
  includedComponents?: string
  specificUses?: string
  recommendedUses?: string
  // Custom badges
  customBadges?: Array<{name: string, enabled: boolean}>
}

interface TrendingGift {
  id: string
  productName: string
  image: string
  category: string
  source: string
  price: number
  originalPrice?: number
  rating: number
  reviewCount: number
  productLink: string
  description?: string
  amazonChoice?: boolean
  bestSeller?: boolean
  attributes?: ProductAttributes
  createdAt: string
  updatedAt: string
}

// Use globalThis to ensure the store is shared across all module instances in Next.js
declare global {
  var __trendingGiftsStore: TrendingGift[] | undefined
}

// Initialize store on global object to ensure it's shared across all route handlers
// This is critical for Next.js App Router where modules can be isolated
const getStore = (): TrendingGift[] => {
  if (!globalThis.__trendingGiftsStore) {
    globalThis.__trendingGiftsStore = []
    console.log('[trending-gifts-store] Initialized global store')
  }
  return globalThis.__trendingGiftsStore
}

export function getTrendingGifts(): TrendingGift[] {
  const store = getStore()
  console.log(`[trending-gifts-store] Getting trending gifts, count: ${store.length}`)
  return [...store]
}

export function addTrendingGift(gift: TrendingGift): TrendingGift {
  const store = getStore()
  // Check if gift already exists (by productLink to avoid duplicates)
  const existingIndex = store.findIndex(
    (g) => g.productLink === gift.productLink
  )
  
  if (existingIndex !== -1) {
    // Update existing gift
    store[existingIndex] = { ...gift, id: store[existingIndex].id }
    console.log(`[trending-gifts-store] Updated existing gift: ${store[existingIndex].id}`)
    return store[existingIndex]
  } else {
    // Add new gift
    store.push(gift)
    console.log(`[trending-gifts-store] Added new gift: ${gift.id}, Total: ${store.length}`)
    return gift
  }
}

export function removeTrendingGift(id: string): boolean {
  const store = getStore()
  const index = store.findIndex((g) => String(g.id) === String(id))
  if (index !== -1) {
    store.splice(index, 1)
    console.log(`[trending-gifts-store] Removed gift: ${id}, Total: ${store.length}`)
    return true
  }
  return false
}

export function clearTrendingGifts(): void {
  const store = getStore()
  store.length = 0
  console.log('[trending-gifts-store] Cleared all trending gifts')
}

