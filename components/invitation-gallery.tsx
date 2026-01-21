'use client'

// =============================================================================
// AI INVITATION GALLERY COMPONENT
// =============================================================================

import { useState } from 'react'
import { 
  Check, 
  RefreshCw, 
  Share2, 
  Download, 
  Sparkles,
  Crown,
  Palette,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { AI_DISCLAIMER } from '@/lib/invitation-prompts'

interface InvitationImage {
  id: string
  imageUrl: string
  type: 'hero' | 'variation'
  source: 'openai' | 'fal'
  styleModifiers?: string
  isSelected: boolean
}

interface InvitationGalleryProps {
  invitationId: string
  heroImage: InvitationImage | null
  variations: InvitationImage[]
  selectedImageId?: string
  onSelect: (imageId: string) => void
  onRegenerate: (type: 'hero' | 'variations') => void
  onShare: () => void
  isLoading?: boolean
  isRegenerating?: boolean
}

export function InvitationGallery({
  invitationId,
  heroImage,
  variations,
  selectedImageId,
  onSelect,
  onRegenerate,
  onShare,
  isLoading = false,
  isRegenerating = false,
}: InvitationGalleryProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  
  const allImages = heroImage ? [heroImage, ...variations] : variations
  const currentSelected = selectedImageId || allImages[0]?.id

  const handleDownload = async (image: InvitationImage) => {
    try {
      setDownloadingId(image.id)
      
      const response = await fetch(image.imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `wishbee-invitation-${image.type}-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('Image downloaded!')
    } catch (error) {
      toast.error('Failed to download image')
    } finally {
      setDownloadingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] animate-pulse" />
          <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-white animate-bounce" />
        </div>
        <p className="text-[#654321] font-medium">Generating your invitation designs...</p>
        <p className="text-sm text-[#8B4513]/70">This may take 30-60 seconds</p>
      </div>
    )
  }

  if (allImages.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#8B4513]/70">No images generated yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#654321]">Your Invitation Designs</h3>
          <p className="text-sm text-[#8B4513]/70">
            {allImages.length} design{allImages.length !== 1 ? 's' : ''} generated • Click to select
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => onRegenerate('variations')}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-[#DAA520]/30 text-[#654321] text-xs font-semibold rounded-full hover:border-[#DAA520] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
          
          <button
            onClick={onShare}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white text-xs font-semibold rounded-full hover:scale-105 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </div>

      {/* Main Selected Image */}
      {currentSelected && (
        <div className="relative bg-white rounded-xl border-2 border-[#DAA520]/20 p-4 shadow-lg">
          {/* Selected badge */}
          <div className="absolute top-6 right-6 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white text-xs font-semibold rounded-full shadow-lg">
            <Check className="w-3.5 h-3.5" />
            Selected
          </div>
          
          {/* Image */}
          <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-[#F5F1E8]">
            <img
              src={allImages.find(img => img.id === currentSelected)?.imageUrl}
              alt="Selected invitation"
              className="w-full h-full object-cover"
            />
            
            {/* Source badge */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 bg-black/60 text-white text-[10px] font-medium rounded-full">
              {allImages.find(img => img.id === currentSelected)?.source === 'openai' ? (
                <>
                  <Crown className="w-3 h-3 text-[#F4C430]" />
                  Premium (DALL-E)
                </>
              ) : (
                <>
                  <Palette className="w-3 h-3 text-[#A855F7]" />
                  Variation (SD)
                </>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => handleDownload(allImages.find(img => img.id === currentSelected)!)}
              disabled={downloadingId === currentSelected}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] font-semibold rounded-lg hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {downloadingId === currentSelected ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download
            </button>
            
            <button
              onClick={onShare}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white font-semibold rounded-lg hover:scale-[1.02] transition-all"
            >
              <Share2 className="w-4 h-4" />
              Share Invitation
            </button>
          </div>
        </div>
      )}

      {/* Thumbnail Grid */}
      {allImages.length > 1 && (
        <div>
          <h4 className="text-sm font-semibold text-[#654321] mb-3">All Designs</h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {allImages.map((image) => (
              <button
                key={image.id}
                onClick={() => onSelect(image.id)}
                className={`relative aspect-[4/5] rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                  image.id === currentSelected
                    ? 'border-[#DAA520] ring-2 ring-[#DAA520]/30'
                    : 'border-[#DAA520]/20 hover:border-[#DAA520]/50'
                }`}
              >
                <img
                  src={image.imageUrl}
                  alt={`Invitation ${image.type}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Selected indicator */}
                {image.id === currentSelected && (
                  <div className="absolute inset-0 bg-[#DAA520]/20 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-[#DAA520] flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
                
                {/* Type indicator */}
                <div className="absolute bottom-1 left-1 right-1">
                  <div className={`text-[8px] font-medium text-center py-0.5 rounded ${
                    image.source === 'openai' 
                      ? 'bg-[#F4C430] text-[#654321]' 
                      : 'bg-[#A855F7] text-white'
                  }`}>
                    {image.source === 'openai' ? 'Hero' : 'Style'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Disclaimer */}
      <div className="text-center">
        <p className="text-[10px] text-[#8B4513]/50 italic">
          {AI_DISCLAIMER.short} • {AI_DISCLAIMER.compliance}
        </p>
      </div>
    </div>
  )
}
