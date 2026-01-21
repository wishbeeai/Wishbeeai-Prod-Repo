// =============================================================================
// AI INVITATIONS - List API Route
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      }, { status: 401 })
    }
    
    // Parse query params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')
    
    // Build query
    let query = supabase
      .from('invitations')
      .select(`
        id,
        event_title,
        event_date,
        occasion,
        theme,
        status,
        share_token,
        view_count,
        total_cost,
        created_at,
        invitation_images (
          id,
          image_url,
          type,
          is_selected
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data: invitations, count, error } = await query
    
    if (error) {
      throw error
    }
    
    // Format response
    const formattedInvitations = invitations?.map(inv => {
      const images = inv.invitation_images || []
      const selectedImage = images.find((img: any) => img.is_selected) || images[0]
      
      return {
        id: inv.id,
        eventTitle: inv.event_title,
        eventDate: inv.event_date,
        occasion: inv.occasion,
        theme: inv.theme,
        status: inv.status,
        shareToken: inv.share_token,
        viewCount: inv.view_count,
        totalCost: parseFloat(inv.total_cost),
        thumbnailUrl: selectedImage?.image_url,
        imageCount: images.length,
        createdAt: inv.created_at,
      }
    }) || []
    
    return NextResponse.json({
      success: true,
      invitations: formattedInvitations,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    })
  } catch (error) {
    console.error('[Invitations List] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch invitations',
    }, { status: 500 })
  }
}
