// =============================================================================
// AI INVITATION - Get, Update, Delete API Route
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// =============================================================================
// GET - Fetch single invitation
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Check if it's a share token or UUID
    const isShareToken = !id.includes('-') && id.length === 24
    
    let query = supabase
      .from('invitations')
      .select(`
        *,
        invitation_images (*)
      `)
    
    if (isShareToken) {
      query = query.eq('share_token', id)
    } else {
      query = query.eq('id', id)
    }
    
    const { data: invitation, error } = await query.single()
    
    if (error || !invitation) {
      return NextResponse.json({
        success: false,
        error: 'Invitation not found',
      }, { status: 404 })
    }
    
    // Increment view count for shared invitations
    if (isShareToken) {
      await supabase.rpc('increment_invitation_views', { token: id }).catch(console.error)
    }
    
    // Format response
    const images = invitation.invitation_images || []
    const heroImage = images.find((img: any) => img.type === 'hero')
    const variations = images.filter((img: any) => img.type === 'variation')
    
    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        userId: invitation.user_id,
        eventTitle: invitation.event_title,
        eventDate: invitation.event_date,
        eventTime: invitation.event_time,
        eventLocation: invitation.event_location,
        hostName: invitation.host_name,
        customMessage: invitation.custom_message,
        occasion: invitation.occasion,
        theme: invitation.theme,
        tone: invitation.tone,
        colorPalette: invitation.color_palette,
        status: invitation.status,
        shareToken: invitation.share_token,
        viewCount: invitation.view_count,
        heroImage: heroImage ? {
          id: heroImage.id,
          imageUrl: heroImage.image_url,
          type: heroImage.type,
          source: heroImage.source,
          isSelected: heroImage.is_selected,
        } : null,
        variations: variations.map((v: any) => ({
          id: v.id,
          imageUrl: v.image_url,
          type: v.type,
          source: v.source,
          styleModifiers: v.style_modifiers,
          isSelected: v.is_selected,
        })),
        selectedImageId: invitation.selected_image_id,
        costTracking: {
          openaiCalls: invitation.openai_calls,
          openaiCost: parseFloat(invitation.openai_cost),
          falCalls: invitation.fal_calls,
          falCost: parseFloat(invitation.fal_cost),
          totalCost: parseFloat(invitation.total_cost),
        },
        createdAt: invitation.created_at,
        updatedAt: invitation.updated_at,
      },
    })
  } catch (error) {
    console.error('[Invitation] Fetch error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch invitation',
    }, { status: 500 })
  }
}

// =============================================================================
// PATCH - Update invitation (select image, update details)
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      }, { status: 401 })
    }
    
    const body = await request.json()
    const { selectedImageId, eventTitle, eventDate, eventTime, eventLocation, hostName, customMessage } = body
    
    // Verify ownership
    const { data: invitation, error: fetchError } = await supabase
      .from('invitations')
      .select('id, user_id')
      .eq('id', id)
      .single()
    
    if (fetchError || !invitation) {
      return NextResponse.json({
        success: false,
        error: 'Invitation not found',
      }, { status: 404 })
    }
    
    if (invitation.user_id !== user.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - not your invitation',
      }, { status: 403 })
    }
    
    // Update selected image if provided
    if (selectedImageId) {
      // Deselect all images for this invitation
      await supabase
        .from('invitation_images')
        .update({ is_selected: false })
        .eq('invitation_id', id)
      
      // Select the new image
      await supabase
        .from('invitation_images')
        .update({ is_selected: true })
        .eq('id', selectedImageId)
        .eq('invitation_id', id)
    }
    
    // Build update object
    const updates: Record<string, any> = {}
    if (selectedImageId) updates.selected_image_id = selectedImageId
    if (eventTitle !== undefined) updates.event_title = eventTitle
    if (eventDate !== undefined) updates.event_date = eventDate
    if (eventTime !== undefined) updates.event_time = eventTime
    if (eventLocation !== undefined) updates.event_location = eventLocation
    if (hostName !== undefined) updates.host_name = hostName
    if (customMessage !== undefined) updates.custom_message = customMessage
    
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('invitations')
        .update(updates)
        .eq('id', id)
      
      if (updateError) {
        throw updateError
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Invitation updated',
    })
  } catch (error) {
    console.error('[Invitation] Update error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update invitation',
    }, { status: 500 })
  }
}

// =============================================================================
// DELETE - Delete invitation
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      }, { status: 401 })
    }
    
    // Delete (RLS will verify ownership)
    const { error: deleteError } = await supabase
      .from('invitations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    
    if (deleteError) {
      throw deleteError
    }
    
    return NextResponse.json({
      success: true,
      message: 'Invitation deleted',
    })
  } catch (error) {
    console.error('[Invitation] Delete error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete invitation',
    }, { status: 500 })
  }
}
