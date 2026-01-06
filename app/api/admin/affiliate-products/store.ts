// Shared in-memory store for affiliate products
// In production, replace this with database operations

let productsStore: any[] = []

export function getProducts() {
  return productsStore
}

export function addProduct(product: any) {
  productsStore.push(product)
  return product
}

export function updateProduct(id: string, updates: any) {
  // Convert both IDs to strings for comparison to handle type mismatches
  const idStr = String(id).trim()
  console.log(`[UPDATE STORE] Attempting to update product with ID: "${idStr}" (original type: ${typeof id})`)
  console.log(`[UPDATE STORE] Current products in store: ${productsStore.length}`)
  
  if (productsStore.length === 0) {
    console.log(`[UPDATE STORE] Store is empty - cannot update`)
    return null
  }
  
  console.log(`[UPDATE STORE] Product IDs in store:`, productsStore.map(p => ({ 
    id: p.id, 
    idType: typeof p.id, 
    idString: String(p.id).trim(),
    matches: String(p.id).trim() === idStr
  })))
  
  // Try multiple comparison methods to handle edge cases
  const index = productsStore.findIndex((p) => {
    const productIdStr = String(p.id).trim()
    return productIdStr === idStr || productIdStr === String(id).trim()
  })
  
  console.log(`[UPDATE STORE] Found index: ${index}`)
  
  if (index !== -1) {
    productsStore[index] = {
      ...productsStore[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    console.log(`[UPDATE STORE] ✅ Successfully updated product:`, productsStore[index])
    return productsStore[index]
  }
  
  console.log(`[UPDATE STORE] ❌ Product not found. Searched for: "${idStr}"`)
  console.log(`[UPDATE STORE] Available IDs for comparison:`, productsStore.map(p => String(p.id).trim()))
  return null
}

export function deleteProduct(id: string | number) {
  // Convert both IDs to strings for comparison to handle type mismatches
  const idStr = String(id).trim()
  console.log(`[DELETE STORE] Attempting to delete product with ID: "${idStr}" (original type: ${typeof id})`)
  console.log(`[DELETE STORE] Current products in store: ${productsStore.length}`)
  
  if (productsStore.length === 0) {
    console.log(`[DELETE STORE] Store is empty - cannot delete`)
    return false
  }
  
  console.log(`[DELETE STORE] Product IDs in store:`, productsStore.map(p => ({ 
    id: p.id, 
    idType: typeof p.id, 
    idString: String(p.id).trim(),
    matches: String(p.id).trim() === idStr
  })))
  
  // Try multiple comparison methods to handle edge cases
  let index = productsStore.findIndex((p) => {
    const productIdStr = String(p.id).trim()
    return productIdStr === idStr || productIdStr === String(id).trim()
  })
  
  console.log(`[DELETE STORE] Found index: ${index}`)
  
  if (index !== -1) {
    const deletedProduct = productsStore[index]
    productsStore.splice(index, 1)
    console.log(`[DELETE STORE] ✅ Successfully deleted product:`, deletedProduct)
    console.log(`[DELETE STORE] Products remaining: ${productsStore.length}`)
    return true
  }
  
  console.log(`[DELETE STORE] ❌ Product not found. Searched for: "${idStr}"`)
  console.log(`[DELETE STORE] Available IDs for comparison:`, productsStore.map(p => String(p.id).trim()))
  return false
}


