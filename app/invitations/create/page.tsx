'use client'

// =============================================================================
// AI INVITATION GENERATOR PAGE
// =============================================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Sparkles,
  Calendar,
  MapPin,
  User,
  MessageSquare,
  Palette,
  Loader2,
  PartyPopper,
  Heart,
  Briefcase,
  Baby,
  GraduationCap,
  Home,
  Gift,
  Star,
} from 'lucide-react'
import { toast } from 'sonner'
import { InvitationGallery } from '@/components/invitation-gallery'
import { InvitationShareModal } from '@/components/invitation-share-modal'
import type { 
  OccasionType, 
  ThemeStyle, 
  ToneType, 
  ColorPalette,
  InvitationParams,
} from '@/types/invitations'

// =============================================================================
// CONFIGURATION
// =============================================================================

const OCCASIONS: Array<{ value: OccasionType; label: string; icon: React.ReactNode; color: string }> = [
  { value: 'birthday', label: 'Birthday', icon: <PartyPopper className="w-5 h-5" />, color: 'from-pink-500 to-rose-500' },
  { value: 'wedding', label: 'Wedding', icon: <Heart className="w-5 h-5" />, color: 'from-rose-400 to-pink-400' },
  { value: 'baby_shower', label: 'Baby Shower', icon: <Baby className="w-5 h-5" />, color: 'from-blue-400 to-cyan-400' },
  { value: 'graduation', label: 'Graduation', icon: <GraduationCap className="w-5 h-5" />, color: 'from-purple-500 to-indigo-500' },
  { value: 'corporate', label: 'Corporate', icon: <Briefcase className="w-5 h-5" />, color: 'from-slate-600 to-slate-700' },
  { value: 'housewarming', label: 'Housewarming', icon: <Home className="w-5 h-5" />, color: 'from-amber-500 to-orange-500' },
  { value: 'holiday', label: 'Holiday', icon: <Star className="w-5 h-5" />, color: 'from-red-500 to-green-500' },
  { value: 'anniversary', label: 'Anniversary', icon: <Heart className="w-5 h-5" />, color: 'from-red-400 to-rose-500' },
  { value: 'custom', label: 'Custom', icon: <Gift className="w-5 h-5" />, color: 'from-[#DAA520] to-[#F4C430]' },
]

const THEMES: Array<{ value: ThemeStyle; label: string; description: string }> = [
  { value: 'elegant', label: 'Elegant', description: 'Sophisticated & refined' },
  { value: 'fun', label: 'Fun', description: 'Vibrant & colorful' },
  { value: 'modern', label: 'Modern', description: 'Clean & contemporary' },
  { value: 'minimal', label: 'Minimal', description: 'Simple & understated' },
  { value: 'luxury', label: 'Luxury', description: 'Premium & opulent' },
  { value: 'vintage', label: 'Vintage', description: 'Classic & nostalgic' },
  { value: 'playful', label: 'Playful', description: 'Whimsical & fun' },
  { value: 'romantic', label: 'Romantic', description: 'Soft & dreamy' },
]

const TONES: Array<{ value: ToneType; label: string }> = [
  { value: 'celebratory', label: '🎉 Celebratory' },
  { value: 'warm', label: '🤗 Warm' },
  { value: 'playful', label: '😄 Playful' },
  { value: 'formal', label: '👔 Formal' },
  { value: 'heartfelt', label: '💝 Heartfelt' },
  { value: 'professional', label: '💼 Professional' },
]

const COLOR_PRESETS: Array<{ name: string; palette: ColorPalette }> = [
  {
    name: 'Golden Honey',
    palette: { primary: '#DAA520', secondary: '#F4C430', accent: '#8B4513', background: '#FFF8E7', text: '#654321' },
  },
  {
    name: 'Rose Garden',
    palette: { primary: '#E11D48', secondary: '#FDA4AF', accent: '#BE185D', background: '#FFF1F2', text: '#881337' },
  },
  {
    name: 'Ocean Blue',
    palette: { primary: '#0EA5E9', secondary: '#7DD3FC', accent: '#0369A1', background: '#F0F9FF', text: '#0C4A6E' },
  },
  {
    name: 'Forest Green',
    palette: { primary: '#059669', secondary: '#6EE7B7', accent: '#047857', background: '#ECFDF5', text: '#064E3B' },
  },
  {
    name: 'Royal Purple',
    palette: { primary: '#9333EA', secondary: '#C4B5FD', accent: '#7E22CE', background: '#FAF5FF', text: '#581C87' },
  },
  {
    name: 'Midnight',
    palette: { primary: '#1E293B', secondary: '#475569', accent: '#F59E0B', background: '#0F172A', text: '#F8FAFC' },
  },
]

// =============================================================================
// COMPONENT
// =============================================================================

export default function CreateInvitationPage() {
  const router = useRouter()
  
  // Form state
  const [step, setStep] = useState<'form' | 'generating' | 'gallery'>('form')
  const [occasion, setOccasion] = useState<OccasionType>('birthday')
  const [theme, setTheme] = useState<ThemeStyle>('elegant')
  const [tone, setTone] = useState<ToneType>('celebratory')
  const [colorPalette, setColorPalette] = useState<ColorPalette>(COLOR_PRESETS[0].palette)
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [hostName, setHostName] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [variationCount, setVariationCount] = useState(4)
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [invitation, setInvitation] = useState<any>(null)
  const [selectedImageId, setSelectedImageId] = useState<string | undefined>()
  
  // Share modal
  const [showShareModal, setShowShareModal] = useState(false)

  const handleGenerate = async () => {
    if (!eventTitle.trim()) {
      toast.error('Please enter an event title')
      return
    }

    setStep('generating')
    setIsGenerating(true)

    try {
      const params: InvitationParams = {
        occasion,
        theme,
        tone,
        colorPalette,
        eventTitle: eventTitle.trim(),
        eventDate: eventDate || undefined,
        eventTime: eventTime || undefined,
        eventLocation: eventLocation || undefined,
        hostName: hostName || undefined,
        customMessage: customMessage || undefined,
        variationCount,
      }

      const response = await fetch('/api/invitations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          params,
          generateHero: true,
          generateVariations: true,
          variationCount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to generate invitation')
      }

      setInvitation(data.invitation)
      setSelectedImageId(data.invitation.heroImage?.id || data.invitation.variations[0]?.id)
      setStep('gallery')
      
      toast.success('Invitation designs generated!', {
        description: `Created ${1 + data.invitation.variations.length} unique designs`,
      })
    } catch (error) {
      console.error('Generation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate invitation')
      setStep('form')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSelectImage = async (imageId: string) => {
    setSelectedImageId(imageId)
    
    if (invitation?.id) {
      try {
        await fetch(`/api/invitations/${invitation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selectedImageId: imageId }),
        })
      } catch (error) {
        console.error('Failed to save selection:', error)
      }
    }
  }

  const handleRegenerate = async (type: 'hero' | 'variations') => {
    toast.info('Regeneration coming soon!')
    // TODO: Implement regeneration
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-4 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#DAA520] to-[#F4C430] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#654321]">
                AI Invitation Generator
              </h1>
              <p className="text-sm text-[#8B4513]/70">
                Create beautiful, personalized invitations with AI
              </p>
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {['Design', 'Generate', 'Share'].map((label, i) => {
            const stepIndex = step === 'form' ? 0 : step === 'generating' ? 1 : 2
            const isActive = i === stepIndex
            const isComplete = i < stepIndex
            
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white' 
                    : isComplete
                    ? 'bg-[#059669] text-white'
                    : 'bg-[#DAA520]/20 text-[#8B4513]'
                }`}>
                  {isComplete ? '✓' : i + 1}
                </div>
                <span className={`text-sm font-medium ${isActive ? 'text-[#654321]' : 'text-[#8B4513]/50'}`}>
                  {label}
                </span>
                {i < 2 && <div className="w-8 h-0.5 bg-[#DAA520]/20" />}
              </div>
            )
          })}
        </div>

        {/* Form Step */}
        {step === 'form' && (
          <div className="bg-white rounded-2xl border-2 border-[#DAA520]/20 p-6 space-y-8">
            {/* Occasion */}
            <div>
              <label className="block text-sm font-semibold text-[#654321] mb-3">
                What's the occasion?
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {OCCASIONS.map((occ) => (
                  <button
                    key={occ.value}
                    type="button"
                    onClick={() => setOccasion(occ.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                      occasion === occ.value
                        ? 'border-[#DAA520] bg-[#DAA520]/10'
                        : 'border-gray-200 hover:border-[#DAA520]/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${occ.color} flex items-center justify-center text-white`}>
                      {occ.icon}
                    </div>
                    <span className="text-xs font-medium text-[#654321]">{occ.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Event Title */}
            <div>
              <label className="block text-sm font-semibold text-[#654321] mb-2">
                Event Title *
              </label>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="e.g., Sarah's 30th Birthday Bash!"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#DAA520] focus:ring-2 focus:ring-[#DAA520]/20 outline-none transition-all"
                maxLength={100}
              />
            </div>

            {/* Date, Time, Location */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-[#654321] mb-2">
                  <Calendar className="w-4 h-4" />
                  Date
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#DAA520] outline-none"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-[#654321] mb-2">
                  <Calendar className="w-4 h-4" />
                  Time
                </label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#DAA520] outline-none"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-[#654321] mb-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="123 Party Lane"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#DAA520] outline-none"
                />
              </div>
            </div>

            {/* Host & Message */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-[#654321] mb-2">
                  <User className="w-4 h-4" />
                  Host Name
                </label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#DAA520] outline-none"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-[#654321] mb-2">
                  <MessageSquare className="w-4 h-4" />
                  Custom Message
                </label>
                <input
                  type="text"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Come celebrate with us!"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#DAA520] outline-none"
                />
              </div>
            </div>

            {/* Theme */}
            <div>
              <label className="block text-sm font-semibold text-[#654321] mb-3">
                Design Theme
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTheme(t.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      theme === t.value
                        ? 'border-[#DAA520] bg-[#DAA520]/10'
                        : 'border-gray-200 hover:border-[#DAA520]/50'
                    }`}
                  >
                    <span className="text-sm font-semibold text-[#654321]">{t.label}</span>
                    <span className="block text-xs text-[#8B4513]/70">{t.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div>
              <label className="block text-sm font-semibold text-[#654321] mb-3">
                Tone & Mood
              </label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTone(t.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      tone === t.value
                        ? 'bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white'
                        : 'bg-gray-100 text-[#654321] hover:bg-gray-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Palette */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-[#654321] mb-3">
                <Palette className="w-4 h-4" />
                Color Palette
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setColorPalette(preset.palette)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      colorPalette.primary === preset.palette.primary
                        ? 'border-[#DAA520] ring-2 ring-[#DAA520]/20'
                        : 'border-gray-200 hover:border-[#DAA520]/50'
                    }`}
                  >
                    <div className="flex gap-1 mb-2">
                      {[preset.palette.primary, preset.palette.secondary, preset.palette.accent].map((color, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-[#654321]">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Variation Count */}
            <div>
              <label className="block text-sm font-semibold text-[#654321] mb-2">
                Number of Style Variations: {variationCount}
              </label>
              <input
                type="range"
                min={1}
                max={6}
                value={variationCount}
                onChange={(e) => setVariationCount(parseInt(e.target.value))}
                className="w-full accent-[#DAA520]"
              />
              <p className="text-xs text-[#8B4513]/70 mt-1">
                1 premium hero design + {variationCount} style variations
              </p>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!eventTitle.trim()}
              className="w-full h-14 rounded-xl bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] font-bold text-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Generate Invitation Designs
            </button>
          </div>
        )}

        {/* Generating Step */}
        {step === 'generating' && (
          <div className="bg-white rounded-2xl border-2 border-[#DAA520]/20 p-12">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] animate-pulse" />
                <Sparkles className="absolute inset-0 m-auto w-12 h-12 text-white animate-bounce" />
              </div>
              
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-[#654321]">
                  Creating Your Invitation Designs
                </h2>
                <p className="text-[#8B4513]/70">
                  Our AI is crafting beautiful, personalized designs for you...
                </p>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-[#8B4513]/70">
                <Loader2 className="w-4 h-4 animate-spin" />
                This may take 30-60 seconds
              </div>
              
              <div className="w-full max-w-md bg-[#F5F1E8] rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
                  <span className="text-xs text-[#654321]">Generating premium hero design with DALL-E 3...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#DAA520] animate-pulse" />
                  <span className="text-xs text-[#654321]">Creating {variationCount} style variations...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gallery Step */}
        {step === 'gallery' && invitation && (
          <div className="bg-white rounded-2xl border-2 border-[#DAA520]/20 p-6">
            <InvitationGallery
              invitationId={invitation.id}
              heroImage={invitation.heroImage}
              variations={invitation.variations}
              selectedImageId={selectedImageId}
              onSelect={handleSelectImage}
              onRegenerate={handleRegenerate}
              onShare={() => setShowShareModal(true)}
            />
            
            {/* Back to form */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setStep('form')}
                className="text-sm text-[#8B4513]/70 hover:text-[#654321] underline"
              >
                ← Create a new invitation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && invitation && (
        <InvitationShareModal
          invitationId={invitation.id}
          shareToken={invitation.shareToken}
          eventTitle={eventTitle}
          selectedImageUrl={
            invitation.heroImage?.id === selectedImageId
              ? invitation.heroImage.imageUrl
              : invitation.variations.find((v: any) => v.id === selectedImageId)?.imageUrl
          }
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  )
}
