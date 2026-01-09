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
    } = body;

    const wishlistIdValue = wishlistId || wishlist_id;
    
    if (!wishlistIdValue) {
      return NextResponse.json({ error: 'wishlistId is required' }, { status: 400 });
    }

    // Build insert object using the correct database schema
    // Note: Database uses 'title' not 'product_name', and 'list_price' for price
    const insertData: any = {
      wishlist_id: wishlistIdValue,
      title: title || productName || 'Untitled Product',
      product_url: product_url || productUrl || null,
      image_url: image_url || productImage || null,
      list_price: list_price || (productPrice ? Math.round(productPrice * 100) : null),
      currency: currency || 'USD',
      review_star: review_star || null,
      review_count: review_count || null,
      affiliate_url: affiliate_url || product_url || productUrl || null,
      source: source || 'trending',
      price_snapshot_at: price_snapshot_at ? new Date(price_snapshot_at) : new Date(), // Required field
    };

    // Only add optional fields if they have values
    if (asin) insertData.asin = asin;

    const { data: item, error } = await supabase
      .from('wishlist_items')
      .insert([insertData])
      .select()
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
