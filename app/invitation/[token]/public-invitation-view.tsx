'use client'

// =============================================================================
// PUBLIC INVITATION VIEW - Client Component
// =============================================================================

import { useState } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Gift,
  Download,
  Share2,
  Eye,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { AI_DISCLAIMER } from '@/lib/invitation-prompts'
import type { ColorPalette } from '@/types/invitations'

interface PublicInvitationViewProps {
  invitation: {
    eventTitle: string
    eventDate?: string
    eventTime?: string
    eventLocation?: string
    hostName?: string
    customMessage?: string
    occasion: string
    theme: string
    colorPalette: ColorPalette
    viewCount: number
    imageUrl?: string
  }
}

export function PublicInvitationView({ invitation }: PublicInvitationViewProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return null
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const handleDownload = async () => {
    if (!invitation.imageUrl) return
    
    try {
      setIsDownloading(true)
      const response = await fetch(invitation.imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `invitation-${invitation.eventTitle.replace(/\s+/g, '-').toLowerCase()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('Invitation downloaded!')
    } catch (error) {
      toast.error('Failed to download')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleShare = async () => {
    const shareUrl = window.location.href
    const shareText = `You're invited to ${invitation.eventTitle}!`

    if (navigator.share) {
      try {
        await navigator.share({
          title: invitation.eventTitle,
          text: shareText,
          url: shareUrl,
        })
      } catch (error) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('🐝 Link copied!', {
        style: { background: 'linear-gradient(to right, #FEF3C7, #FDE68A, #F4C430)', color: '#654321', border: '2px solid #DAA520' }
      })
    }
  }

  const primaryColor = invitation.colorPalette?.primary || '#DAA520'
  const backgroundColor = invitation.colorPalette?.background || '#FFF8E7'

  return (
    <div 
      className="min-h-screen py-8 px-4"
      style={{ backgroundColor }}
    >
      <div className="max-w-lg mx-auto">
        {/* Wishbee Branding */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-[#654321] hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#DAA520] to-[#F4C430] flex items-center justify-center">
              <span className="text-lg">🐝</span>
            </div>
            <span className="font-bold">Wishbee</span>
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Invitation Image */}
          {invitation.imageUrl && (
            <div className="relative aspect-[4/5]">
              <img
                src={invitation.imageUrl}
                alt={invitation.eventTitle}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay with event details */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent">
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2 drop-shadow-lg">
                    {invitation.eventTitle}
                  </h1>
                  
                  {invitation.hostName && (
                    <p className="text-white/90 text-sm flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      Hosted by {invitation.hostName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Event Details */}
          <div className="p-6 space-y-4">
            {/* No image fallback */}
            {!invitation.imageUrl && (
              <div className="text-center py-8">
                <h1 
                  className="text-2xl sm:text-3xl font-bold mb-2"
                  style={{ color: primaryColor }}
                >
                  {invitation.eventTitle}
                </h1>
                {invitation.hostName && (
                  <p className="text-[#8B4513]/70">
                    Hosted by {invitation.hostName}
                  </p>
                )}
              </div>
            )}

            {/* Date, Time, Location */}
            <div className="space-y-3">
              {invitation.eventDate && (
                <div className="flex items-center gap-3 p-3 bg-[#F5F1E8] rounded-xl">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <p className="text-xs text-[#8B4513]/70">Date</p>
                    <p className="font-semibold text-[#654321]">
                      {formatDate(invitation.eventDate)}
                    </p>
                  </div>
                </div>
              )}

              {invitation.eventTime && (
                <div className="flex items-center gap-3 p-3 bg-[#F5F1E8] rounded-xl">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <Clock className="w-5 h-5" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <p className="text-xs text-[#8B4513]/70">Time</p>
                    <p className="font-semibold text-[#654321]">
                      {formatTime(invitation.eventTime)}
                    </p>
                  </div>
                </div>
              )}

              {invitation.eventLocation && (
                <div className="flex items-center gap-3 p-3 bg-[#F5F1E8] rounded-xl">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <p className="text-xs text-[#8B4513]/70">Location</p>
                    <p className="font-semibold text-[#654321]">
                      {invitation.eventLocation}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Message */}
            {invitation.customMessage && (
              <div 
                className="p-4 rounded-xl text-center"
                style={{ backgroundColor: `${primaryColor}10` }}
              >
                <p className="text-[#654321] italic">
                  "{invitation.customMessage}"
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDownload}
                disabled={isDownloading || !invitation.imageUrl}
                className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl font-semibold transition-all hover:scale-[1.02] disabled:opacity-50"
                style={{ 
                  backgroundColor: primaryColor,
                  color: 'white',
                }}
              >
                <Download className="w-4 h-4" />
                Save
              </button>
              
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 h-12 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white rounded-xl font-semibold transition-all hover:scale-[1.02]"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>

            {/* View Count */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#8B4513]/50 pt-2">
              <Eye className="w-3.5 h-3.5" />
              {invitation.viewCount} view{invitation.viewCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Create Your Own CTA */}
        <div className="mt-8 text-center">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-[#DAA520]" />
              <span className="font-bold text-[#654321]">Create your own AI invitation</span>
            </div>
            <p className="text-sm text-[#8B4513]/70 mb-4">
              Design beautiful, personalized invitations in seconds with Wishbee AI
            </p>
            <Link
              href="/invitations/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] font-bold rounded-full hover:scale-105 transition-all shadow-lg"
            >
              <Gift className="w-4 h-4" />
              Create Free Invitation
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-[10px] text-[#8B4513]/40 italic">
            {AI_DISCLAIMER.short}
          </p>
          <p className="text-xs text-[#8B4513]/50">
            Powered by{' '}
            <Link href="/" className="underline hover:text-[#654321]">
              Wishbee.ai
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
