import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Support both old format and new Amazon PA-API format
    const {
      wishlistId,
      wishlist_id, // Alternative field name
      
      // Old format fields
      productName,
      productUrl,
      productPrice,
      productImage,
      
      // New Amazon PA-API format
      product_url,
      asin,
      title,
      image_url,
      list_price,
      currency,
      review_star,
      review_count,
      affiliate_url,
      source,
      price_snapshot_at,
      
      // Variant and preference fields
      color,
      size,
      variantPreference,
      preferenceOptions,
      category,
      quantity,
      
      // Sale price (if different from list price)
      sale_price,
      salePrice,
      
      // Badges and original price
      badges,
      originalPrice,
      
      // Specifications
      specifications,
    } = body;

    const wishlistIdValue = wishlistId || wishlist_id;
    
    if (!wishlistIdValue) {
      return NextResponse.json({ error: 'wishlistId is required' }, { status: 400 });
    }

    // Check for duplicate product URL in the same wishlist
    const productUrlValue = product_url || productUrl;
    if (productUrlValue) {
      const { data: existingItem } = await supabase
        .from('wishlist_items')
        .select('id')
        .eq('wishlist_id', wishlistIdValue)
        .eq('product_url', productUrlValue)
        .single();
      
      if (existingItem) {
        console.log('[API] Duplicate product detected, updating instead of creating new');
        // Update the existing item instead of creating a duplicate
        // For now, just return a message
        return NextResponse.json({ 
          error: 'This product is already in your wishlist',
          existingItemId: existingItem.id 
        }, { status: 409 }); // 409 Conflict
      }
    }

    // Build insert object - prefer new Amazon format if available
    const insertData: any = {
      wishlist_id: wishlistIdValue,
    };

    // Use the actual database column names (no product_name, product_price, product_image)
    insertData.product_url = product_url || productUrl || null;
    insertData.asin = asin || null;
    insertData.title = title || productName || null;
    insertData.image_url = image_url || productImage || null;
    insertData.list_price = list_price || (productPrice ? Math.round(productPrice * 100) : null); // Convert to cents if needed
    insertData.currency = currency || 'USD';
    insertData.review_star = review_star || null;
    insertData.review_count = review_count || null;
    insertData.affiliate_url = affiliate_url || product_url || productUrl || null;
    insertData.source = source || 'amazon';
    insertData.price_snapshot_at = price_snapshot_at ? new Date(price_snapshot_at) : new Date();

    // Store variant preference and options in description field as JSON
    // This includes: preference type (I Wish/Alternative/Ok to buy), selected options, store name
    const descriptionData: any = {}
    
    // Add preference type
    if (variantPreference) {
      descriptionData.preferenceType = variantPreference
    }
    
    // Add selected options from preferenceOptions
    if (preferenceOptions) {
      try {
        const options = typeof preferenceOptions === 'string' ? JSON.parse(preferenceOptions) : preferenceOptions
        descriptionData.preferenceOptions = options
      } catch (e) {
        console.error('Error parsing preferenceOptions:', e)
      }
    }
    
    // Add individual color/size if provided (legacy support)
    if (color) descriptionData.color = color
    if (size) descriptionData.size = size
    
    // Store source as store name
    descriptionData.storeName = source || 'amazon'
    
    // Store sale price if different from list price
    const salePriceValue = sale_price || salePrice
    if (salePriceValue) {
      descriptionData.salePrice = salePriceValue
    }
    
    // Store badges
    if (badges) {
      descriptionData.badges = badges
    }
    
    // Store original price (list price before discount)
    if (originalPrice) {
      descriptionData.originalPrice = originalPrice
    }
    
    // Store specifications (product attributes)
    if (specifications && typeof specifications === 'object') {
      descriptionData.specifications = specifications
    }
    
    insertData.description = JSON.stringify(descriptionData)

    // Note: category, quantity, priority, stock_status don't exist in the database

    // Select only columns that exist in the database
    const { data: item, error } = await supabase
      .from('wishlist_items')
      .insert([insertData])
      .select("id, wishlist_id, product_url, created_at, title, asin, image_url, list_price, currency, review_star, review_count, affiliate_url, source, price_snapshot_at, description")
      .single();

    if (error) {
      console.error('Error inserting wishlist item:', error);
      throw error;
    }
    
    return NextResponse.json({ item }, { status: 201 });
  } catch (error: any) {
    console.error('Wishlist item insert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
