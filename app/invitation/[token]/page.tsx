// =============================================================================
// PUBLIC INVITATION VIEW PAGE
// =============================================================================

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PublicInvitationView } from './public-invitation-view'

interface PageProps {
  params: Promise<{ token: string }>
}

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params
  const supabase = await createClient()
  
  const { data: invitation } = await supabase
    .from('invitations')
    .select(`
      event_title,
      event_date,
      host_name,
      invitation_images (
        image_url,
        is_selected
      )
    `)
    .eq('share_token', token)
    .single()
  
  if (!invitation) {
    return {
      title: 'Invitation Not Found | Wishbee',
    }
  }

  const images = invitation.invitation_images || []
  const selectedImage = images.find((img: any) => img.is_selected) || images[0]
  
  const title = `You're Invited: ${invitation.event_title}`
  const description = invitation.host_name 
    ? `${invitation.host_name} invites you to ${invitation.event_title}`
    : `You're invited to ${invitation.event_title}`

  return {
    title: `${title} | Wishbee`,
    description,
    openGraph: {
      title,
      description,
      images: selectedImage?.image_url ? [selectedImage.image_url] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: selectedImage?.image_url ? [selectedImage.image_url] : [],
    },
  }
}

export default async function PublicInvitationPage({ params }: PageProps) {
  const { token } = await params
  const supabase = await createClient()
  
  // Fetch invitation
  const { data: invitation, error } = await supabase
    .from('invitations')
    .select(`
      id,
      event_title,
      event_date,
      event_time,
      event_location,
      host_name,
      custom_message,
      occasion,
      theme,
      color_palette,
      view_count,
      created_at,
      invitation_images (
        id,
        image_url,
        type,
        source,
        is_selected
      )
    `)
    .eq('share_token', token)
    .single()
  
  if (error || !invitation) {
    notFound()
  }

  // Increment view count
  await supabase.rpc('increment_invitation_views', { token }).catch(console.error)
  
  // Get selected image
  const images = invitation.invitation_images || []
  const selectedImage = images.find((img: any) => img.is_selected) || images[0]

  return (
    <PublicInvitationView
      invitation={{
        eventTitle: invitation.event_title,
        eventDate: invitation.event_date,
        eventTime: invitation.event_time,
        eventLocation: invitation.event_location,
        hostName: invitation.host_name,
        customMessage: invitation.custom_message,
        occasion: invitation.occasion,
        theme: invitation.theme,
        colorPalette: invitation.color_palette,
        viewCount: invitation.view_count + 1,
        imageUrl: selectedImage?.image_url,
      }}
    />
  )
}
