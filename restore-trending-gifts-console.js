/**
 * TRENDING GIFTS RESTORE SCRIPT
 * 
 * Copy and paste this entire script into your browser console
 * (Press F12, go to Console tab, paste, press Enter)
 * 
 * This script will:
 * 1. Check if trending gifts exist in the database
 * 2. Show you what's currently stored
 * 3. Help you restore products if needed
 */

(async function restoreTrendingGifts() {
  console.log('🔍 Checking trending gifts in database...\n');
  
  try {
    // Step 1: Check what's in the database
    const response = await fetch('/api/trending-gifts');
    const data = await response.json();
    
    if (data.success && data.gifts && data.gifts.length > 0) {
      console.log(`✅ Found ${data.gifts.length} trending gifts in database!\n`);
      console.table(data.gifts.map(g => ({
        ID: g.id.substring(0, 8) + '...',
        Name: g.productName,
        Price: `$${g.price}`,
        Source: g.source,
        Category: g.category,
        Created: new Date(g.createdAt).toLocaleDateString()
      })));
      
      // Save to window for easy access
      window.__trendingGiftsBackup = data.gifts;
      console.log('\n✅ Data saved to window.__trendingGiftsBackup');
      console.log('   You can access it later with: window.__trendingGiftsBackup\n');
      
      return data.gifts;
    } else {
      console.log('❌ No trending gifts found in database.\n');
      console.log('The database appears to be empty.\n');
      console.log('Options to restore:');
      console.log('1. Check Supabase backups: https://supabase.com/dashboard');
      console.log('2. Use restoreTrendingGift() function below to add products manually');
      console.log('3. Re-add products using the "Add to Trending Gifts" feature\n');
      
      return [];
    }
  } catch (error) {
    console.error('❌ Error checking trending gifts:', error);
    return [];
  }
})();

/**
 * RESTORE A SINGLE PRODUCT
 * 
 * Usage:
 * restoreTrendingGift({
 *   productName: "Product Name",
 *   image: "https://example.com/image.jpg",
 *   price: 99.99,
 *   productLink: "https://example.com/product",
 *   category: "Electronics",
 *   source: "Amazon"
 * })
 */
window.restoreTrendingGift = async function(productData) {
  console.log(`\n🔄 Restoring product: ${productData.productName}...`);
  
  try {
    const response = await fetch('/api/trending-gifts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productName: productData.productName,
        image: productData.image,
        price: productData.price,
        productLink: productData.productLink,
        category: productData.category || 'General',
        source: productData.source || 'Unknown',
        rating: productData.rating || 0,
        reviewCount: productData.reviewCount || 0,
        description: productData.description || `${productData.productName} from ${productData.source || 'Unknown'}`,
        originalPrice: productData.originalPrice,
        amazonChoice: productData.amazonChoice || false,
        bestSeller: productData.bestSeller || false,
        attributes: productData.attributes || {}
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Product restored successfully!');
      console.log('   ID:', result.gift.id);
      console.log('   Name:', result.gift.productName);
      return result.gift;
    } else {
      console.error('❌ Failed to restore product:', result.error);
      if (result.error.includes('Unauthorized')) {
        console.log('   ⚠️ You need to be logged in to add trending gifts');
      }
      return null;
    }
  } catch (error) {
    console.error('❌ Error restoring product:', error);
    return null;
  }
};

/**
 * RESTORE MULTIPLE PRODUCTS
 * 
 * Usage:
 * restoreMultipleTrendingGifts([
 *   { productName: "Product 1", image: "...", price: 99, productLink: "..." },
 *   { productName: "Product 2", image: "...", price: 149, productLink: "..." }
 * ])
 */
window.restoreMultipleTrendingGifts = async function(productsArray) {
  console.log(`\n🔄 Restoring ${productsArray.length} products...\n`);
  
  const results = [];
  
  for (let i = 0; i < productsArray.length; i++) {
    const product = productsArray[i];
    console.log(`[${i + 1}/${productsArray.length}] ${product.productName}...`);
    
    const result = await window.restoreTrendingGift(product);
    results.push(result);
    
    // Wait 500ms between requests to avoid rate limiting
    if (i < productsArray.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  const successCount = results.filter(r => r !== null).length;
  console.log(`\n✅ Restored ${successCount} of ${productsArray.length} products`);
  
  return results;
};

/**
 * EXPORT CURRENT TRENDING GIFTS TO JSON
 * 
 * Usage: exportTrendingGifts()
 * 
 * This will:
 * 1. Fetch all trending gifts
 * 2. Display JSON in console
 * 3. Try to copy to clipboard
 */
window.exportTrendingGifts = async function() {
  console.log('\n📦 Exporting trending gifts...\n');
  
  try {
    const response = await fetch('/api/trending-gifts');
    const data = await response.json();
    
    if (data.success && data.gifts) {
      const json = JSON.stringify(data.gifts, null, 2);
      
      console.log('📋 Trending Gifts JSON:');
      console.log(json);
      
      // Try to copy to clipboard
      try {
        await navigator.clipboard.writeText(json);
        console.log('\n✅ Copied to clipboard!');
      } catch (clipError) {
        console.log('\n⚠️ Could not copy to clipboard. Copy manually from above.');
      }
      
      // Save to window
      window.__trendingGiftsExport = data.gifts;
      console.log('✅ Also saved to window.__trendingGiftsExport\n');
      
      return data.gifts;
    } else {
      console.log('❌ No trending gifts to export');
      return [];
    }
  } catch (error) {
    console.error('❌ Error exporting:', error);
    return [];
  }
};

/**
 * CHECK EXTENSION STORAGE (if extension stores data)
 * 
 * Usage: checkExtensionStorage()
 */
window.checkExtensionStorage = async function() {
  console.log('\n🔍 Checking extension storage...\n');
  
  // Check if chrome.storage is available
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(null, (data) => {
      console.log('Chrome Extension Storage:', data);
      
      if (data.trendingGifts || data.products) {
        console.log('\n✅ Found data in extension storage!');
        window.__extensionData = data;
      } else {
        console.log('\n❌ No trending gifts found in extension storage');
      }
    });
  } else if (typeof browser !== 'undefined' && browser.storage) {
    browser.storage.local.get(null).then((data) => {
      console.log('Firefox Extension Storage:', data);
      
      if (data.trendingGifts || data.products) {
        console.log('\n✅ Found data in extension storage!');
        window.__extensionData = data;
      } else {
        console.log('\n❌ No trending gifts found in extension storage');
      }
    });
  } else {
    console.log('⚠️ Extension storage API not available in this context');
    console.log('   Try running this in the extension popup\'s console');
  }
};

console.log('\n✅ Restore script loaded! Available functions:');
console.log('   - restoreTrendingGift(productData) - Restore a single product');
console.log('   - restoreMultipleTrendingGifts(productsArray) - Restore multiple products');
console.log('   - exportTrendingGifts() - Export all trending gifts to JSON');
console.log('   - checkExtensionStorage() - Check extension local storage\n');
