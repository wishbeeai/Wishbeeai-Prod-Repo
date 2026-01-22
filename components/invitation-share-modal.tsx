'use client'

// =============================================================================
// INVITATION SHARE MODAL COMPONENT
// =============================================================================

import { useState } from 'react'
import {
  X,
  Copy,
  Check,
  Mail,
  MessageCircle,
  Share2,
  Download,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'

interface InvitationShareModalProps {
  invitationId: string
  shareToken: string
  eventTitle: string
  selectedImageUrl?: string
  onClose: () => void
}

export function InvitationShareModal({
  invitationId,
  shareToken,
  eventTitle,
  selectedImageUrl,
  onClose,
}: InvitationShareModalProps) {
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://wishbee.ai'
  const shareUrl = `${baseUrl}/invitation/${shareToken}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('🐝 Link copied!', {
        style: { background: 'linear-gradient(to right, #FEF3C7, #FDE68A, #F4C430)', color: '#654321', border: '2px solid #DAA520' }
      })
      setTimeout(() => setCopied(false), 3000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleShare = async (platform: 'whatsapp' | 'imessage' | 'email' | 'native') => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/invitations/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId,
          platform,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate share link')
      }

      // Handle native share
      if (platform === 'native' && navigator.share) {
        try {
          await navigator.share({
            title: `You're invited: ${eventTitle}`,
            text: data.share.text,
            url: data.share.url,
          })
          toast.success('Shared successfully!')
          return
        } catch (error) {
          // User cancelled or share failed
          if ((error as Error).name !== 'AbortError') {
            console.error('Native share failed:', error)
          }
        }
      }

      // Open platform URL
      if (data.share.platformUrl) {
        window.open(data.share.platformUrl, '_blank', 'noopener,noreferrer')
      }
    } catch (error) {
      console.error('Share error:', error)
      toast.error('Failed to share invitation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!selectedImageUrl) {
      toast.error('No image to download')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(selectedImageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `invitation-${eventTitle.replace(/\s+/g, '-').toLowerCase()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('Image downloaded!')
    } catch (error) {
      toast.error('Failed to download image')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-[#F4C430]" />
              <h3 className="text-lg font-bold text-white">Share Invitation</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 bg-gradient-to-b from-[#F5F1E8] to-white">
          {/* Preview */}
          {selectedImageUrl && (
            <div className="relative aspect-[4/5] max-h-48 mx-auto rounded-xl overflow-hidden shadow-lg">
              <img
                src={selectedImageUrl}
                alt="Invitation preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Event Title */}
          <div className="text-center">
            <p className="text-sm text-[#8B4513]/70">Sharing invitation for</p>
            <p className="font-bold text-[#654321]">{eventTitle}</p>
          </div>

          {/* Copy Link */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#654321]">Invitation Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2.5 bg-white border-2 border-[#DAA520]/30 rounded-lg text-sm text-[#654321] truncate"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-1.5 ${
                  copied
                    ? 'bg-gradient-to-r from-[#EA580C] to-[#FB923C] text-white'
                    : 'bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:scale-105'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-[#654321]">Share via</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleShare('whatsapp')}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 h-11 bg-gradient-to-r from-[#EA580C] to-[#FB923C] text-white rounded-lg font-semibold text-sm hover:scale-105 transition-all disabled:opacity-50"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
              
              <button
                onClick={() => handleShare('imessage')}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 h-11 bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white rounded-lg font-semibold text-sm hover:scale-105 transition-all disabled:opacity-50"
              >
                <MessageCircle className="w-4 h-4" />
                iMessage
              </button>
              
              <button
                onClick={() => handleShare('email')}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 h-11 bg-gradient-to-r from-[#9333EA] to-[#A855F7] text-white rounded-lg font-semibold text-sm hover:scale-105 transition-all disabled:opacity-50"
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
              
              {typeof navigator !== 'undefined' && navigator.share && (
                <button
                  onClick={() => handleShare('native')}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 h-11 bg-gradient-to-r from-[#B45309] to-[#D97706] text-white rounded-lg font-semibold text-sm hover:scale-105 transition-all disabled:opacity-50"
                >
                  <Share2 className="w-4 h-4" />
                  More
                </button>
              )}
            </div>
          </div>

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={isLoading || !selectedImageUrl}
            className="w-full flex items-center justify-center gap-2 h-11 bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] text-white rounded-lg font-semibold text-sm hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download Image
          </button>

          {/* View Link */}
          <div className="text-center">
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[#8B4513]/70 hover:text-[#654321] underline"
            >
              Preview invitation page
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="h-[50px] bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423]" />
      </div>
    </div>
  )
}
