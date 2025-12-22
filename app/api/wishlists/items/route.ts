import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { wishlistId, productName, productUrl, productPrice, productImage } = await request.json();

    const { data: item, error } = await supabase
      .from('wishlist_items')
      .insert([{
        wishlist_id: wishlistId,
        product_name: productName,
        product_url: productUrl,
        product_price: productPrice,
        product_image: productImage
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
