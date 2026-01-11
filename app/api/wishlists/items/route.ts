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
      category,
      quantity,
    } = body;

    const wishlistIdValue = wishlistId || wishlist_id;
    
    if (!wishlistIdValue) {
      return NextResponse.json({ error: 'wishlistId is required' }, { status: 400 });
    }

    // Build insert object - prefer new Amazon format if available
    const insertData: any = {
      wishlist_id: wishlistIdValue,
    };

    if (asin || title || (product_url && !productName)) {
      // Using new Amazon PA-API format
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
      
      // Also map to old format fields for backward compatibility
      insertData.product_name = title || productName || null;
      insertData.product_price = list_price ? (list_price / 100) : productPrice || null; // Convert cents to dollars
      insertData.product_image = image_url || productImage || null;
    } else {
      // Fallback to old format
      insertData.product_name = productName || null;
      insertData.product_url = productUrl || null;
      insertData.product_price = productPrice || null;
      insertData.product_image = productImage || null;
    }

    // Add variant and preference information to description field as JSON
    if (color || size || variantPreference) {
      const variantInfo: any = {}
      if (color) variantInfo.color = color
      if (size) variantInfo.size = size
      if (variantPreference) variantInfo.variantPreference = variantPreference
      
      insertData.description = JSON.stringify(variantInfo)
    }

    // Add other fields
    if (category) insertData.category = category
    if (quantity) insertData.quantity = quantity

    // Explicitly select columns to avoid schema cache issues with missing 'description' column
    const { data: item, error } = await supabase
      .from('wishlist_items')
      .insert([insertData])
      .select("id, wishlist_id, product_name, product_url, product_price, product_image, quantity, priority, category, stock_status, created_at, updated_at, title, asin, image_url, list_price, currency, review_star, review_count, affiliate_url, source, price_snapshot_at, store_name, description")
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
