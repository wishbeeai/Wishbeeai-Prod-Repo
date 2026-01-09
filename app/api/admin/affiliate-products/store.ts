// Shared in-memory store for affiliate products
// In production, replace this with database operations

// Use globalThis to ensure the store is shared across all module instances in Next.js
declare global {
  var __affiliateProductsStore: any[] | undefined
}

// Initialize store on global object to ensure it's shared across all route handlers
// This is critical for Next.js App Router where modules can be isolated
const getStore = (): any[] => {
  if (!globalThis.__affiliateProductsStore) {
    globalThis.__affiliateProductsStore = []
    console.log('[affiliate-products-store] Initialized global store')
  }
  return globalThis.__affiliateProductsStore
}

export function getProducts() {
  const store = getStore()
  console.log(`[affiliate-products-store] Getting products, count: ${store.length}`)
  return store
}

export function addProduct(product: any) {
  const store = getStore()
  store.push(product)
  console.log(`[affiliate-products-store] Added product: ${product.id}, Total: ${store.length}`)
  return product
}

export function updateProduct(id: string, updates: any) {
  const store = getStore()
  // Convert both IDs to strings for comparison to handle type mismatches
  const idStr = String(id).trim()
  console.log(`[UPDATE STORE] Attempting to update product with ID: "${idStr}" (original type: ${typeof id})`)
  console.log(`[UPDATE STORE] Current products in store: ${store.length}`)
  
  if (store.length === 0) {
    console.log(`[UPDATE STORE] Store is empty - cannot update`)
    return null
  }
  
  console.log(`[UPDATE STORE] Product IDs in store:`, store.map(p => ({ 
    id: p.id, 
    idType: typeof p.id, 
    idString: String(p.id).trim(),
    matches: String(p.id).trim() === idStr
  })))
  
  // Try multiple comparison methods to handle edge cases
  const index = store.findIndex((p) => {
    const productIdStr = String(p.id).trim()
    return productIdStr === idStr || productIdStr === String(id).trim()
  })
  
  console.log(`[UPDATE STORE] Found index: ${index}`)
  
  if (index !== -1) {
    store[index] = {
      ...store[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    console.log(`[UPDATE STORE] ✅ Successfully updated product:`, store[index])
    return store[index]
  }
  
  console.log(`[UPDATE STORE] ❌ Product not found. Searched for: "${idStr}"`)
  console.log(`[UPDATE STORE] Available IDs for comparison:`, store.map(p => String(p.id).trim()))
  return null
}

export function deleteProduct(id: string | number) {
  const store = getStore()
  // Convert both IDs to strings for comparison to handle type mismatches
  const idStr = String(id).trim()
  console.log(`[DELETE STORE] Attempting to delete product with ID: "${idStr}" (original type: ${typeof id})`)
  console.log(`[DELETE STORE] Current products in store: ${store.length}`)
  
  if (store.length === 0) {
    console.log(`[DELETE STORE] Store is empty - cannot delete`)
    return false
  }
  
  console.log(`[DELETE STORE] Product IDs in store:`, store.map(p => ({ 
    id: p.id, 
    idType: typeof p.id, 
    idString: String(p.id).trim(),
    matches: String(p.id).trim() === idStr
  })))
  
  // Try multiple comparison methods to handle edge cases
  let index = store.findIndex((p) => {
    const productIdStr = String(p.id).trim()
    return productIdStr === idStr || productIdStr === String(id).trim()
  })
  
  console.log(`[DELETE STORE] Found index: ${index}`)
  
  if (index !== -1) {
    const deletedProduct = store[index]
    store.splice(index, 1)
    console.log(`[DELETE STORE] ✅ Successfully deleted product:`, deletedProduct)
    console.log(`[DELETE STORE] Products remaining: ${store.length}`)
    return true
  }
  
  console.log(`[DELETE STORE] ❌ Product not found. Searched for: "${idStr}"`)
  console.log(`[DELETE STORE] Available IDs for comparison:`, store.map(p => String(p.id).trim()))
  return false
}


