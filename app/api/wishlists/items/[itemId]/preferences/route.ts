import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PUT - Update preference options for a wishlist item
// Preferences are stored in the 'description' JSON field as 'preferenceOptions'
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params
    
    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { preferenceOptions } = body

    if (!preferenceOptions) {
      return NextResponse.json({ error: 'preferenceOptions is required' }, { status: 400 })
    }

    console.log('[preferences API] Updating preferences for item:', itemId)
    console.log('[preferences API] User:', user.id)
    console.log('[preferences API] Preferences:', JSON.stringify(preferenceOptions))

    // First, get the current item with its description
    const { data: item, error: fetchError } = await supabase
      .from('wishlist_items')
      .select('id, wishlist_id, description, wishlists!inner(user_id)')
      .eq('id', itemId)
      .single()

    if (fetchError || !item) {
      console.error('[preferences API] Item not found:', fetchError)
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Check ownership - the wishlists join gives us the user_id
    const wishlistUserId = (item as any).wishlists?.user_id
    if (wishlistUserId !== user.id) {
      console.error('[preferences API] Unauthorized: item belongs to different user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Parse existing description JSON and update preferenceOptions
    let descriptionData: any = {}
    if (item.description) {
      try {
        descriptionData = typeof item.description === 'string' 
          ? JSON.parse(item.description) 
          : item.description
      } catch (e) {
        console.error('[preferences API] Error parsing existing description:', e)
        descriptionData = {}
      }
    }

    // Update preferenceOptions in description
    descriptionData.preferenceOptions = preferenceOptions

    // Update the item with new description
    const { data: updatedItem, error: updateError } = await supabase
      .from('wishlist_items')
      .update({
        description: JSON.stringify(descriptionData),
      })
      .eq('id', itemId)
      .select()
      .single()

    if (updateError) {
      console.error('[preferences API] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }

    console.log('[preferences API] ✅ Preferences updated successfully')

    return NextResponse.json({ 
      success: true, 
      item: updatedItem 
    })
  } catch (error) {
    console.error('[preferences API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Get preference options for a wishlist item
// Preferences are stored in the 'description' JSON field as 'preferenceOptions'
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params
    
    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the item with description (which contains preferences)
    const { data: item, error } = await supabase
      .from('wishlist_items')
      .select('id, description, wishlists!inner(user_id)')
      .eq('id', itemId)
      .single()

    if (error || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Check ownership
    const wishlistUserId = (item as any).wishlists?.user_id
    if (wishlistUserId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Parse description JSON and extract preferenceOptions
    let preferenceOptions = null
    if (item.description) {
      try {
        const descriptionData = typeof item.description === 'string' 
          ? JSON.parse(item.description) 
          : item.description
        preferenceOptions = descriptionData.preferenceOptions || null
      } catch {
        preferenceOptions = null
      }
    }

    return NextResponse.json({ 
      preferenceOptions 
    })
  } catch (error) {
    console.error('[preferences API] GET Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
