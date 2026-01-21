// =============================================================================
// AI INVITATION - Share API Route
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
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
    
    const { invitationId, platform, recipientEmail, customMessage } = await request.json()
    
    if (!invitationId) {
      return NextResponse.json({
        success: false,
        error: 'Invitation ID required',
      }, { status: 400 })
    }
    
    // Fetch invitation with selected image
    const { data: invitation, error: fetchError } = await supabase
      .from('invitations')
      .select(`
        *,
        invitation_images!inner (
          id,
          image_url,
          is_selected
        )
      `)
      .eq('id', invitationId)
      .eq('user_id', user.id)
      .single()
    
    if (fetchError || !invitation) {
      return NextResponse.json({
        success: false,
        error: 'Invitation not found',
      }, { status: 404 })
    }
    
    // Get selected image or first image
    const images = invitation.invitation_images || []
    const selectedImage = images.find((img: any) => img.is_selected) || images[0]
    
    if (!selectedImage) {
      return NextResponse.json({
        success: false,
        error: 'No image available to share',
      }, { status: 400 })
    }
    
    // Build share URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wishbee.ai'
    const shareUrl = `${baseUrl}/invitation/${invitation.share_token}`
    
    // Build share content based on platform
    const eventTitle = invitation.event_title
    const eventDate = invitation.event_date 
      ? new Date(invitation.event_date).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : null
    const hostName = invitation.host_name
    
    let shareText = `You're invited! ${eventTitle}`
    if (eventDate) shareText += ` on ${eventDate}`
    if (hostName) shareText += ` - Hosted by ${hostName}`
    if (customMessage) shareText += `\n\n${customMessage}`
    shareText += `\n\nView invitation: ${shareUrl}`
    
    // Platform-specific URLs
    const platformUrls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      imessage: `sms:&body=${encodeURIComponent(shareText)}`,
      email: `mailto:${recipientEmail || ''}?subject=${encodeURIComponent(`You're invited: ${eventTitle}`)}&body=${encodeURIComponent(shareText)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    }
    
    return NextResponse.json({
      success: true,
      share: {
        url: shareUrl,
        imageUrl: selectedImage.image_url,
        text: shareText,
        platformUrl: platformUrls[platform] || null,
        eventDetails: {
          title: eventTitle,
          date: invitation.event_date,
          time: invitation.event_time,
          location: invitation.event_location,
          hostName: invitation.host_name,
        },
      },
    })
  } catch (error) {
    console.error('[Invitation Share] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate share link',
    }, { status: 500 })
  }
}
