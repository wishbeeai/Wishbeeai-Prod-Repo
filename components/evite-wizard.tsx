'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Sparkles,
  Check,
  Loader2,
  Wand2,
  Copy,
  Mail,
  MessageCircle,
  Share2,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  FileText,
  Video,
  UserPlus,
  Users,
  Upload,
  Trash2,
  Edit2,
  Search,
  Link as LinkIcon,
} from 'lucide-react'
import { toast } from 'sonner'

interface EviteWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: EviteData) => void
  collectionTitle?: string
  occasion?: string
  deadline?: string
  recipientName?: string
}

export interface EviteData {
  bannerUrl: string
  bannerStyle: string
  invitationMessage: string
  colorTheme: string
  enableMagicLink: boolean
  enableReminders: boolean
  shareChannels: string[]
  magicLinkUrl?: string
  eventDetails?: EventDetails
  guests?: Guest[]
}

interface EventDetails {
  eventType: 'invitation' | 'announcement'
  eventTitle: string
  eventDate: string
  eventTime: string
  endTime?: string
  guestOfHonorAge?: string
  hostName: string
  hostPhone?: string
  isVirtual: boolean
  locationName?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  additionalInfo?: string
}

interface Guest {
  id: string
  name: string
  emailOrPhone: string
  status?: 'pending' | 'sent' | 'opened' | 'rsvp_yes' | 'rsvp_no'
}

export function EviteWizard({ 
  isOpen, 
  onClose, 
  onComplete,
  collectionTitle = 'Your Event',
  occasion = 'Celebration',
  deadline = '',
  recipientName = '',
}: EviteWizardProps) {
  // Step management
  const [currentStep, setCurrentStep] = useState(1)
  
  // Event Details (Step 1)
  const [eventDetails, setEventDetails] = useState<EventDetails>({
    eventType: 'invitation',
    eventTitle: collectionTitle,
    eventDate: deadline,
    eventTime: '',
    hostName: '',
    isVirtual: false,
  })
  
  // Auto-update eventTitle when collectionTitle prop changes
  useEffect(() => {
    if (collectionTitle && collectionTitle !== eventDetails.eventTitle) {
      setEventDetails(prev => ({ ...prev, eventTitle: collectionTitle }))
    }
  }, [collectionTitle])
  
  // Auto-update eventDate when deadline prop changes
  useEffect(() => {
    if (deadline && deadline !== eventDetails.eventDate) {
      setEventDetails(prev => ({ ...prev, eventDate: deadline }))
    }
  }, [deadline])
  
  // AI Generation States (Step 2)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  
  // Generated Content
  const [bannerUrl, setBannerUrl] = useState('')
  const [invitationMessage, setInvitationMessage] = useState('')
  const [colorTheme, setColorTheme] = useState('#DAA520')
  const [customInvitationText, setCustomInvitationText] = useState('')
  
  // Settings (auto-enabled)
  const [enableMagicLink] = useState(true)
  const [enableReminders] = useState(true)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSavedState, setShowSavedState] = useState(false)
  const [shareChannels, setShareChannels] = useState<string[]>(['link', 'email', 'whatsapp'])
  
  // Guest management (Step 3)
  const [guests, setGuests] = useState<Guest[]>([])
  const [newGuestName, setNewGuestName] = useState('')
  const [newGuestContact, setNewGuestContact] = useState('')
  const [guestAddMode, setGuestAddMode] = useState<'individual' | 'list' | 'import' | 'group' | null>(null)
  const [searchGuests, setSearchGuests] = useState('')
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null)
  
  // Sample past guest lists
  const pastGuestLists = [
    { id: '1', name: "Sarah's Birthday 2024", date: 'December 15, 2024', guestCount: 12 },
    { id: '2', name: "Holiday Party 2023", date: 'December 20, 2023', guestCount: 25 },
  ]
  
  // Sample contacts
  const sampleContacts = [
    { id: 'c1', name: 'Abirami Valliyappan', email: 'v_abirami_78@yahoo.com' },
    { id: 'c2', name: 'Alex Johnson', email: 'alex.j@gmail.com' },
    { id: 'c3', name: 'Deepa Karthigeyan', email: 'deepkarthi12@yahoo.co.in' },
    { id: 'c4', name: 'Meera Ravindran', email: 'meera1306@gmail.com' },
    { id: 'c5', name: 'Ryan Chen', email: 'ryan.chen@gmail.com' },
  ]
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  
  // Send options (Step 4)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState("You're invited! Please click on the invitation to see more details and to RSVP.")
  const [allowPlusOnes, setAllowPlusOnes] = useState(true)
  const [sendReminder, setSendReminder] = useState(true)
  const [allowMessages, setAllowMessages] = useState(true)
  const [includeGiftIdeas, setIncludeGiftIdeas] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [editingSection, setEditingSection] = useState<'subject' | 'details' | 'guests' | 'options' | null>(null)
  
  // Collapsible sections - collapsed by default
  const [showCategories, setShowCategories] = useState(false)
  const [showColorThemes, setShowColorThemes] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('birthday')
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  if (!isOpen) return null

  const updateEventDetail = (key: keyof EventDetails, value: string | boolean) => {
    setEventDetails(prev => ({ ...prev, [key]: value }))
  }

  const addGuest = () => {
    if (!newGuestName.trim() || !newGuestContact.trim()) {
      toast.error('Please enter name and email/phone')
      return
    }
    const newGuest: Guest = {
      id: `guest_${Date.now()}`,
      name: newGuestName.trim(),
      emailOrPhone: newGuestContact.trim(),
      status: 'pending',
    }
    setGuests(prev => [...prev, newGuest])
    setNewGuestName('')
    setNewGuestContact('')
    toast.success('Guest added!')
  }

  const removeGuest = (guestId: string) => {
    setGuests(prev => prev.filter(g => g.id !== guestId))
    toast.success('Guest removed')
  }

  const updateGuest = (guestId: string, name: string, emailOrPhone: string) => {
    setGuests(prev => prev.map(g => 
      g.id === guestId ? { ...g, name, emailOrPhone } : g
    ))
    setEditingGuestId(null)
    toast.success('Guest updated')
  }

  const addSelectedContacts = () => {
    const contactsToAdd = sampleContacts.filter(c => selectedContacts.has(c.id))
    const newGuests: Guest[] = contactsToAdd.map(c => ({
      id: `guest_${Date.now()}_${c.id}`,
      name: c.name,
      emailOrPhone: c.email,
      status: 'pending' as const,
    }))
    setGuests(prev => [...prev, ...newGuests])
    setSelectedContacts(new Set())
    setGuestAddMode(null)
    toast.success(`${contactsToAdd.length} contacts added!`)
  }

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(contactId)) {
        newSet.delete(contactId)
      } else {
        newSet.add(contactId)
      }
      return newSet
    })
  }

  const selectAllContacts = () => {
    setSelectedContacts(new Set(sampleContacts.map(c => c.id)))
  }

  const unselectAllContacts = () => {
    setSelectedContacts(new Set())
  }

  const filteredGuests = guests.filter(g => 
    g.name.toLowerCase().includes(searchGuests.toLowerCase()) ||
    g.emailOrPhone.toLowerCase().includes(searchGuests.toLowerCase())
  )

  const handleGenerateAll = async () => {
    setIsGenerating(true)
    try {
      // Map category to detailed prompt description for AI atmosphere
      const categoryDescriptions: Record<string, string> = {
        seasonal: 'SEASONAL CELEBRATION: beautiful seasonal nature elements, spring cherry blossoms or summer sunshine or autumn golden leaves or winter snowflakes, seasonal flowers and decorations, cozy seasonal atmosphere, holiday vibes, nature-inspired celebration',
        birthday: 'BIRTHDAY PARTY CELEBRATION: colorful birthday balloons floating, multi-tier birthday cake with lit candles, festive party decorations, confetti in the air, wrapped presents with ribbons, joyful celebratory atmosphere, party streamers, birthday banner, festive bokeh lights',
        kids: 'MAGICAL KIDS FANTASY: enchanted fairy tale castle, magical princess kingdom with sparkling tiaras, rainbow unicorns with flowing manes, cute friendly cartoon dinosaurs, brave superheroes with capes, magical fairy dust and sparkles, whimsical animated cartoon style, bright vibrant rainbow colors, dreamy fluffy clouds, shooting stars, magical wands, treasure chests, friendly dragons, enchanted forest, pixie dust, glitter and shimmer, child fantasy wonderland, storybook illustration style',
        baby: 'ADORABLE BABY SHOWER: soft pastel pink and blue colors, cute baby nursery elements, soft plush teddy bears, baby rattles and bottles, gentle stork imagery, fluffy clouds, baby footprints, sweet lullaby atmosphere, delicate baby blankets, gentle dreamy soft-focus, precious newborn celebration',
        photo: 'ELEGANT PHOTO MEMORIES: beautiful vintage photo frame borders, scrapbook style collage, polaroid instant photos, elegant decorative borders, memory album aesthetic, nostalgic photography theme, artistic photo montage, cherished memories celebration',
        wedding: 'ROMANTIC WEDDING ELEGANCE: beautiful white roses and peonies floral arrangements, golden wedding rings on silk cushion, romantic candlelight ambiance, luxurious champagne glasses, delicate white lace details, elegant wedding venue, soft romantic lighting, sophisticated love celebration, bridal bouquet',
        food: 'GOURMET FOOD & DRINKS: delicious gourmet food spread, elegant dinner party setting, fine wine glasses, culinary masterpiece presentation, fresh ingredients artfully arranged, sophisticated dining atmosphere, champagne celebration, feast celebration',
        themes: 'THEMED COSTUME PARTY: creative masquerade masks, costume party atmosphere, themed decorations, theatrical creative elements, fun party props, imaginative celebration, unique themed event decorations',
        milestone: 'MILESTONE ACHIEVEMENT: golden trophy and medals, graduation caps with tassels, achievement certificates, celebration of success, accomplishment symbols, anniversary celebration, career promotion, life milestone markers, confetti and celebration',
        professional: 'PROFESSIONAL CORPORATE: clean modern business aesthetic, elegant corporate event setting, sophisticated professional atmosphere, formal business style, sleek minimalist design, executive celebration, refined corporate elegance',
        savethedate: 'SAVE THE DATE ANNOUNCEMENT: elegant calendar motif, beautiful date announcement design, upcoming event anticipation, stylish invitation aesthetic, mark your calendar reminder, romantic announcement, elegant typography space',
        venue: 'ELEGANT VENUE SETTING: beautiful event hall with chandeliers, stunning venue backdrop, elegant architectural details, sophisticated event space, luxurious celebration venue, grand ballroom atmosphere, beautiful location setting',
      }

      // Generate Banner - prioritize custom keywords if provided
      const hasCustomKeywords = customInvitationText && customInvitationText.trim().length > 0
      const guestAge = eventDetails.guestOfHonorAge ? parseInt(eventDetails.guestOfHonorAge) : null
      
      const bannerResponse = await fetch('/api/ai/generate-banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: eventDetails.eventTitle || collectionTitle, 
          occasion,
          style: 'warm',
          colorTheme: colorTheme,
          imageStyle: hasCustomKeywords ? customInvitationText : categoryDescriptions[selectedCategory] || categoryDescriptions.birthday,
          customImageWords: customInvitationText,
          category: hasCustomKeywords ? '' : categoryDescriptions[selectedCategory] || categoryDescriptions.birthday,
          useCustomKeywordsOnly: hasCustomKeywords,
          guestAge: guestAge,
          eventVibe: eventDetails.eventVibe || '',
        }),
      })

      const bannerData = await bannerResponse.json()
      if (bannerData.bannerUrl) {
        setBannerUrl(bannerData.bannerUrl)
      }

      // Generate Invitation Message
      const messageResponse = await fetch('/api/ai/generate-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          collectionTitle: eventDetails.eventTitle || collectionTitle, 
          occasion,
          recipientName,
          deadline: eventDetails.eventDate,
          hostName: eventDetails.hostName,
          isVirtual: eventDetails.isVirtual,
          locationName: eventDetails.locationName,
          customText: customInvitationText,
        }),
      })

      const messageData = await messageResponse.json()
      if (messageData.message) {
        setInvitationMessage(messageData.message)
      } else {
        setInvitationMessage(`You're warmly invited to celebrate ${recipientName ? `${recipientName}'s` : 'this'} special ${occasion}! 🎉\n\nJoin us in making this moment unforgettable. Your contribution means the world!`)
      }

      // Color theme is already set by user selection in Step 1
      setIsGenerated(true)
      toast.success('AI generated your invitation!')
    } catch (error) {
      console.error('Generation error:', error)
      setInvitationMessage(`You're warmly invited to celebrate ${recipientName ? `${recipientName}'s` : 'this'} special ${occasion}! 🎉\n\nJoin us in making this moment unforgettable. Your contribution means the world!`)
      setIsGenerated(true)
      toast.success('Invitation ready!')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerate = () => {
    setIsGenerated(false)
    setBannerUrl('')
    setInvitationMessage('')
    handleGenerateAll()
  }

  const toggleShareChannel = (channel: string) => {
    setShareChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    )
  }

  // Share functions - Preview mode (actual links generated after gift creation)
  const handleCopyLink = async () => {
    const dateStr = eventDetails.eventDate 
      ? new Date(eventDetails.eventDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) 
      : 'TBD'
    
    const shareText = [
      `You're Invited: ${eventDetails.eventTitle || collectionTitle}`,
      '',
      invitationMessage,
      '',
      '--- Event Details ---',
      `Date: ${dateStr}`,
      eventDetails.eventTime ? `Time: ${eventDetails.eventTime}` : null,
      eventDetails.locationName ? `Location: ${eventDetails.locationName}${eventDetails.city ? `, ${eventDetails.city}` : ''}` : null,
      eventDetails.hostName ? `Hosted by: ${eventDetails.hostName}` : null,
      eventDetails.additionalInfo ? `\nNote: ${eventDetails.additionalInfo}` : null,
      '',
      '--- View & Contribute ---',
      '[Link will be added after gift creation]'
    ].filter(Boolean).join('\n')
    
    try {
      await navigator.clipboard.writeText(shareText)
      toast.success('🐝 Invitation text copied!', {
        description: 'Link will be added after gift creation',
        style: { background: 'linear-gradient(to right, #FEF3C7, #FDE68A, #F4C430)', color: '#654321', border: '2px solid #DAA520' }
      })
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = shareText
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toast.success('🐝 Invitation text copied!', {
        description: 'Link will be added after gift creation',
        style: { background: 'linear-gradient(to right, #FEF3C7, #FDE68A, #F4C430)', color: '#654321', border: '2px solid #DAA520' }
      })
    }
  }

  const handleShareEmail = () => {
    const dateStr = eventDetails.eventDate 
      ? new Date(eventDetails.eventDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) 
      : 'TBD'
    
    // Strip emojis for better email compatibility
    const cleanMessage = invitationMessage.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '').trim()
    
    const subject = encodeURIComponent(`You're Invited: ${eventDetails.eventTitle || collectionTitle}`)
    const bodyParts = [
      cleanMessage,
      '',
      '--- Event Details ---',
      `Date: ${dateStr}`,
      eventDetails.eventTime ? `Time: ${eventDetails.eventTime}` : null,
      eventDetails.locationName ? `Location: ${eventDetails.locationName}${eventDetails.city ? `, ${eventDetails.city}` : ''}` : null,
      eventDetails.hostName ? `Hosted by: ${eventDetails.hostName}` : null,
      eventDetails.additionalInfo ? `\nNote: ${eventDetails.additionalInfo}` : null,
      '',
      '--- View & Contribute ---',
      '[Link will be added after gift creation]'
    ].filter(Boolean).join('\n')
    
    const body = encodeURIComponent(bodyParts)
    
    // Use location.href for better email client compatibility
    window.location.href = `mailto:?subject=${subject}&body=${body}`
    toast.success('Email client opened!')
  }

  const handleShareWhatsApp = () => {
    const dateStr = eventDetails.eventDate 
      ? new Date(eventDetails.eventDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) 
      : ''
    
    const messageParts = [
      `*You're Invited: ${eventDetails.eventTitle || collectionTitle}*`,
      '',
      invitationMessage,
      '',
      dateStr ? `Date: ${dateStr}` : null,
      eventDetails.eventTime ? `Time: ${eventDetails.eventTime}` : null,
      eventDetails.locationName ? `Location: ${eventDetails.locationName}` : null,
      eventDetails.hostName ? `Hosted by: ${eventDetails.hostName}` : null,
      eventDetails.additionalInfo ? `\n_${eventDetails.additionalInfo}_` : null,
      '',
      '*View & Contribute:*',
      '[Link will be added after gift creation]'
    ].filter(Boolean).join('\n')
    
    const message = encodeURIComponent(messageParts)
    
    window.open(`https://wa.me/?text=${message}`, '_blank')
    toast.success('WhatsApp opened! Add the contribution link after gift creation.')
  }

  const handleShare = (channelId: string) => {
    switch (channelId) {
      case 'link':
        handleCopyLink()
        break
      case 'email':
        handleShareEmail()
        break
      case 'whatsapp':
        handleShareWhatsApp()
        break
    }
  }

  const handleComplete = async () => {
    setIsSubmitting(true)
    try {
      const data: EviteData = {
        bannerUrl,
        bannerStyle: 'warm',
        invitationMessage,
        colorTheme,
        enableMagicLink,
        enableReminders,
        shareChannels,
        eventDetails,
      }
      
      await onComplete(data)
      setIsSubmitting(false)
      setShowSavedState(true)
      
      // Show saved state for 1.5 seconds before closing
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      toast.error('Failed to save settings')
      setIsSubmitting(false)
    }
  }

  const validateStep1 = (): boolean => {
    const errors: string[] = []
    if (!eventDetails.eventTitle?.trim()) {
      errors.push('Event Title is required')
    }
    if (!eventDetails.eventDate) {
      errors.push('Event Date is required')
    }
    setValidationErrors(errors)
    return errors.length === 0
  }

  const nextStep = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2)
        handleGenerateAll()
      }
    } else if (currentStep === 2 && isGenerated) {
      setCurrentStep(3)
    } else if (currentStep === 3) {
      // Set default email subject when moving to Step 4
      if (!emailSubject) {
        setEmailSubject(`Wishbee Invitation: ${eventDetails.eventTitle || collectionTitle}`)
      }
      setCurrentStep(4)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }
  
  const handleSendTest = async () => {
    toast.success('Test invitation sent to your email!')
  }
  
  const handleSendNow = async () => {
    if (guests.length === 0) {
      toast.error('Please add at least one guest')
      return
    }
    setIsSending(true)
    try {
      // Simulate sending
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success(`Invitations sent to ${guests.length} guests!`)
      handleComplete()
    } catch (error) {
      toast.error('Failed to send invitations')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Saved State Overlay */}
        {showSavedState && (
          <div className="absolute inset-0 z-50 bg-white flex items-center justify-center">
            <div className="text-center p-8">
              {/* Animated Check Circle */}
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#10B981] to-[#34D399] flex items-center justify-center mx-auto shadow-lg animate-pulse">
                  <Check className="w-12 h-12 text-white" />
                </div>
                {/* Decorative rings */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full border-4 border-[#10B981]/20 animate-ping" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-[#654321] mb-2">Saved!</h2>
              <p className="text-[14px] text-[#8B4513]/70 mb-4">
                Your invitation design has been saved successfully
              </p>
              
              {/* Success badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#10B981]/10 to-[#34D399]/10 border border-[#10B981]/30 rounded-full px-4 py-2">
                <Sparkles className="w-4 h-4 text-[#10B981]" />
                <span className="text-[14px] font-medium text-[#10B981]">Ready to share</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#DAA520] to-[#F4C430] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">AI Invitation</h2>
                <p className="text-xs text-white/70">
                  {currentStep === 1 ? 'Tell Us About Your Celebration' : currentStep === 2 ? 'Preview Your Invitation' : currentStep === 3 ? 'Invite Your Guests' : 'Send Invitations'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="bg-[#F5F1E8] px-6 py-3 border-b border-[#DAA520]/20 flex-shrink-0">
          <div className="flex items-center justify-center gap-2">
            {/* Step 1 */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentStep === 1 
                ? 'bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white' 
                : currentStep > 1 ? 'bg-[#B8860B]/10 text-[#B8860B]' : 'text-[#8B4513]/50'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 1 ? 'bg-white/20' : currentStep > 1 ? 'bg-[#B8860B] text-white' : 'bg-[#DAA520]/20'
              }`}>
                {currentStep > 1 ? <Check className="w-3 h-3" /> : '1'}
              </div>
              <span className="text-xs font-semibold hidden sm:inline">Celebration</span>
            </div>
            <ChevronRight className="w-3 h-3 text-[#8B4513]/50" />
            
            {/* Step 2 */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentStep === 2 
                ? 'bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white' 
                : currentStep > 2 ? 'bg-[#B8860B]/10 text-[#B8860B]' : 'text-[#8B4513]/50'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 2 ? 'bg-white/20' : currentStep > 2 ? 'bg-[#B8860B] text-white' : 'bg-[#DAA520]/20'
              }`}>
                {currentStep > 2 ? <Check className="w-3 h-3" /> : '2'}
              </div>
              <span className="text-xs font-semibold hidden sm:inline">Design</span>
            </div>
            <ChevronRight className="w-3 h-3 text-[#8B4513]/50" />
            
            {/* Step 3 */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentStep === 3 
                ? 'bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white' 
                : currentStep > 3 ? 'bg-[#B8860B]/10 text-[#B8860B]' : 'text-[#8B4513]/50'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 3 ? 'bg-white/20' : currentStep > 3 ? 'bg-[#B8860B] text-white' : 'bg-[#DAA520]/20'
              }`}>
                {currentStep > 3 ? <Check className="w-3 h-3" /> : '3'}
              </div>
              <span className="text-xs font-semibold hidden sm:inline">Invite</span>
            </div>
            <ChevronRight className="w-3 h-3 text-[#8B4513]/50" />
            
            {/* Step 4 */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentStep === 4 
                ? 'bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white' 
                : 'text-[#8B4513]/50'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 4 ? 'bg-white/20' : 'bg-[#DAA520]/20'
              }`}>
                4
              </div>
              <span className="text-xs font-semibold hidden sm:inline">Send</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-[#F5F1E8] to-white">
          
          {/* Step 1: Event Details */}
          {currentStep === 1 && (
            <div className="max-w-xl mx-auto space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-[#654321]">🎉 Your Celebration</h3>
                <p className="text-xs text-[#8B4513]/70">Tell us about your special event</p>
              </div>

              {/* Validation Warning */}
              {validationErrors.length > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">⚠️</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-amber-800 mb-1">Please complete required fields</h4>
                      <ul className="space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index} className="text-xs text-amber-700 flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-amber-500" />
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => setValidationErrors([])}
                      className="text-amber-500 hover:text-amber-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Event Type */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-[#DAA520]/20">
                <label className="text-sm font-semibold text-[#654321] flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-[#DAA520]" />
                  Event Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateEventDetail('eventType', 'invitation')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      eventDetails.eventType === 'invitation'
                        ? 'bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321]'
                        : 'bg-[#F5F1E8] text-[#8B4513] hover:bg-[#DAA520]/20'
                    }`}
                  >
                    Invitation (with RSVP)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateEventDetail('eventType', 'announcement')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      eventDetails.eventType === 'announcement'
                        ? 'bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321]'
                        : 'bg-[#F5F1E8] text-[#8B4513] hover:bg-[#DAA520]/20'
                    }`}
                  >
                    Announcement
                  </button>
                </div>
              </div>

              {/* Event Title & Date */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-[#DAA520]/20 space-y-3">
                <div>
                  <label className="text-sm font-semibold text-[#654321] flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-[#DAA520]" />
                    Event Title
                  </label>
                  <input
                    type="text"
                    value={eventDetails.eventTitle}
                    onChange={(e) => updateEventDetail('eventTitle', e.target.value)}
                    placeholder="e.g., Sarah's Birthday Party"
                    className="w-full px-3 py-2 border-2 border-[#DAA520]/30 rounded-lg text-sm focus:border-[#DAA520] outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-[#654321] flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-[#DAA520]" />
                      Event Date
                    </label>
                    <input
                      type="date"
                      value={eventDetails.eventDate}
                      onChange={(e) => updateEventDetail('eventDate', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-[#DAA520]/30 rounded-lg text-sm focus:border-[#DAA520] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[#654321] flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-[#DAA520]" />
                      Time
                    </label>
                    <input
                      type="time"
                      value={eventDetails.eventTime}
                      onChange={(e) => updateEventDetail('eventTime', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-[#DAA520]/30 rounded-lg text-sm focus:border-[#DAA520] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#654321] mb-1 block">
                    Guest of Honor Age (optional)
                  </label>
                  <input
                    type="text"
                    value={eventDetails.guestOfHonorAge || ''}
                    onChange={(e) => updateEventDetail('guestOfHonorAge', e.target.value)}
                    placeholder="e.g., 25"
                    className="w-full px-3 py-2 border-2 border-[#DAA520]/30 rounded-lg text-sm focus:border-[#DAA520] outline-none"
                  />
                </div>
              </div>

              {/* Host Information */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-[#DAA520]/20 space-y-3">
                <p className="text-sm font-semibold text-[#654321] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#DAA520]" />
                  Host Information
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#8B4513]/70 mb-1 block">Host Name</label>
                    <input
                      type="text"
                      value={eventDetails.hostName}
                      onChange={(e) => updateEventDetail('hostName', e.target.value)}
                      placeholder="Your name"
                      className="w-full px-3 py-2 border-2 border-[#DAA520]/30 rounded-lg text-sm focus:border-[#DAA520] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#8B4513]/70 mb-1 block">Phone (optional)</label>
                    <input
                      type="tel"
                      value={eventDetails.hostPhone || ''}
                      onChange={(e) => updateEventDetail('hostPhone', e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full px-3 py-2 border-2 border-[#DAA520]/30 rounded-lg text-sm focus:border-[#DAA520] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-[#DAA520]/20 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#654321] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#DAA520]" />
                    Location
                  </p>
                  <button
                    type="button"
                    onClick={() => updateEventDetail('isVirtual', !eventDetails.isVirtual)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      eventDetails.isVirtual
                        ? 'bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321]'
                        : 'bg-[#F5F1E8] text-[#8B4513]'
                    }`}
                  >
                    <Video className="w-3 h-3" />
                    Virtual Event
                  </button>
                </div>
                
                {!eventDetails.isVirtual ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={eventDetails.locationName || ''}
                      onChange={(e) => updateEventDetail('locationName', e.target.value)}
                      placeholder="Location Name (e.g., Our House)"
                      className="w-full px-3 py-2 border-2 border-[#DAA520]/30 rounded-lg text-sm focus:border-[#DAA520] outline-none"
                    />
                    <input
                      type="text"
                      value={eventDetails.address || ''}
                      onChange={(e) => updateEventDetail('address', e.target.value)}
                      placeholder="Street Address"
                      className="w-full px-3 py-2 border-2 border-[#DAA520]/30 rounded-lg text-sm focus:border-[#DAA520] outline-none"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={eventDetails.city || ''}
                        onChange={(e) => updateEventDetail('city', e.target.value)}
                        placeholder="City"
                        className="px-3 py-2 border-2 border-[#DAA520]/30 rounded-lg text-sm focus:border-[#DAA520] outline-none"
                      />
                      <input
                        type="text"
                        value={eventDetails.state || ''}
                        onChange={(e) => updateEventDetail('state', e.target.value)}
                        placeholder="State"
                        className="px-3 py-2 border-2 border-[#DAA520]/30 rounded-lg text-sm focus:border-[#DAA520] outline-none"
                      />
                      <input
                        type="text"
                        value={eventDetails.zip || ''}
                        onChange={(e) => updateEventDetail('zip', e.target.value)}
                        placeholder="ZIP"
                        className="px-3 py-2 border-2 border-[#DAA520]/30 rounded-lg text-sm focus:border-[#DAA520] outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#8B4513]/60 italic">
                    Virtual event link will be shared with guests
                  </p>
                )}
              </div>

              {/* Special Message */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-[#DAA520]/20">
                <label className="text-sm font-semibold text-[#654321] mb-2 block">
                  Special Message <span className="text-[#8B4513]/50 font-normal">(optional)</span>
                </label>
                <textarea
                  value={eventDetails.additionalInfo || ''}
                  onChange={(e) => updateEventDetail('additionalInfo', e.target.value)}
                  placeholder="Add a personal message for your guests..."
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-[#DAA520]/30 rounded-lg text-sm focus:border-[#DAA520] outline-none resize-none"
                />
              </div>

              {/* AI Customization Options */}
              <div className="bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] rounded-xl p-3 border border-[#DAA520]/30">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[#DAA520]" />
                  <span className="text-xs font-bold text-[#654321]">AI Design Options</span>
                </div>
                
                {/* Invitation Categories - Collapsible */}
                <div className="mb-2">
                  <button
                    type="button"
                    onClick={() => setShowCategories(!showCategories)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-[#8B4513] py-1.5 px-2 rounded-lg hover:bg-[#DAA520]/10 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">📂</span>
                      Invitation Category
                    </span>
                    {showCategories ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showCategories && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 mt-2 px-1">
                      {[
                        { id: 'seasonal', name: 'Seasonal', icon: '🍂' },
                        { id: 'birthday', name: 'Birthday', icon: '🎂' },
                        { id: 'kids', name: 'Kids Characters', icon: '🦄' },
                        { id: 'baby', name: 'Baby', icon: '👶' },
                        { id: 'photo', name: 'Photo Designs', icon: '📸' },
                        { id: 'wedding', name: 'Wedding', icon: '💒' },
                        { id: 'food', name: 'Food & Drink', icon: '🍽️' },
                        { id: 'themes', name: 'Themes', icon: '🎭' },
                        { id: 'milestone', name: 'Milestone', icon: '🏆' },
                        { id: 'professional', name: 'Professional', icon: '💼' },
                        { id: 'savethedate', name: 'Save the Dates', icon: '📅' },
                        { id: 'venue', name: 'Venue Partners', icon: '🏛️' },
                      ].map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          title={cat.name}
                          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                            selectedCategory === cat.id
                              ? 'bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] shadow-sm'
                              : 'bg-white/70 text-[#8B4513] hover:bg-white border border-[#DAA520]/20'
                          }`}
                        >
                          <span>{cat.icon}</span>
                          <span className="truncate">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Color Theme Selection - Collapsible */}
                <div className="mb-2">
                  <button
                    type="button"
                    onClick={() => setShowColorThemes(!showColorThemes)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-[#8B4513] py-1.5 px-2 rounded-lg hover:bg-[#DAA520]/10 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">🎨</span>
                      Color Theme
                    </span>
                    {showColorThemes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showColorThemes && (
                    <div className="grid grid-cols-16 gap-1 mt-2 px-1">
                      {[
                        // Row 1 - Warm Reds & Oranges
                        { id: 'gold', color: '#DAA520' },
                        { id: 'honey', color: '#F4C430' },
                        { id: 'amber', color: '#F59E0B' },
                        { id: 'orange', color: '#EA580C' },
                        { id: 'tangerine', color: '#FB923C' },
                        { id: 'peach', color: '#FDBA74' },
                        { id: 'coral', color: '#FF6B6B' },
                        { id: 'salmon', color: '#FA8072' },
                        { id: 'red', color: '#EF4444' },
                        { id: 'crimson', color: '#DC2626' },
                        { id: 'maroon', color: '#991B1B' },
                        { id: 'burgundy', color: '#7F1D1D' },
                        { id: 'rust', color: '#B45309' },
                        { id: 'terracotta', color: '#C2410C' },
                        { id: 'copper', color: '#B87333' },
                        { id: 'bronze', color: '#CD7F32' },
                        // Row 2 - Pinks & Purples
                        { id: 'rose', color: '#F43F5E' },
                        { id: 'pink', color: '#EC4899' },
                        { id: 'hotpink', color: '#DB2777' },
                        { id: 'blush', color: '#FDA4AF' },
                        { id: 'raspberry', color: '#BE185D' },
                        { id: 'magenta', color: '#D946EF' },
                        { id: 'fuchsia', color: '#C026D3' },
                        { id: 'orchid', color: '#DA70D6' },
                        { id: 'plum', color: '#A855F7' },
                        { id: 'purple', color: '#9333EA' },
                        { id: 'violet', color: '#8B5CF6' },
                        { id: 'grape', color: '#7C3AED' },
                        { id: 'lavender', color: '#A78BFA' },
                        { id: 'indigo', color: '#6366F1' },
                        { id: 'iris', color: '#818CF8' },
                        { id: 'periwinkle', color: '#C4B5FD' },
                        // Row 3 - Blues & Teals
                        { id: 'navy', color: '#1E3A8A' },
                        { id: 'royal', color: '#1D4ED8' },
                        { id: 'blue', color: '#3B82F6' },
                        { id: 'azure', color: '#60A5FA' },
                        { id: 'sky', color: '#0EA5E9' },
                        { id: 'ocean', color: '#0284C7' },
                        { id: 'cerulean', color: '#0891B2' },
                        { id: 'cyan', color: '#06B6D4' },
                        { id: 'aqua', color: '#22D3EE' },
                        { id: 'turquoise', color: '#2DD4BF' },
                        { id: 'teal', color: '#14B8A6' },
                        { id: 'mint', color: '#5EEAD4' },
                        { id: 'seafoam', color: '#99F6E4' },
                        { id: 'jade', color: '#059669' },
                        { id: 'emerald', color: '#10B981' },
                        { id: 'spring', color: '#34D399' },
                        // Row 4 - Greens & Neutrals
                        { id: 'green', color: '#22C55E' },
                        { id: 'lime', color: '#84CC16' },
                        { id: 'chartreuse', color: '#A3E635' },
                        { id: 'olive', color: '#65A30D' },
                        { id: 'forest', color: '#166534' },
                        { id: 'sage', color: '#6B8E23' },
                        { id: 'moss', color: '#4D7C0F' },
                        { id: 'pine', color: '#14532D' },
                        { id: 'brown', color: '#92400E' },
                        { id: 'chocolate', color: '#78350F' },
                        { id: 'coffee', color: '#713F12' },
                        { id: 'tan', color: '#A8A29E' },
                        { id: 'slate', color: '#64748B' },
                        { id: 'gray', color: '#6B7280' },
                        { id: 'charcoal', color: '#374151' },
                        { id: 'black', color: '#1F2937' },
                      ].map(theme => (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setColorTheme(theme.color)}
                          title={theme.id.charAt(0).toUpperCase() + theme.id.slice(1)}
                          className={`w-5 h-5 rounded-full transition-transform ${
                            colorTheme === theme.color
                              ? 'ring-2 ring-offset-1 ring-[#654321] scale-125 z-10'
                              : 'hover:scale-125'
                          }`}
                          style={{ 
                            backgroundColor: theme.color,
                            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2)'
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom Words for Image */}
                <div>
                  <label className="text-xs font-semibold text-[#8B4513] mb-1 block">
                    Custom Image Keywords <span className="font-normal text-[#8B4513]/50">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={customInvitationText}
                    onChange={(e) => setCustomInvitationText(e.target.value)}
                    placeholder="e.g., snowboard, skiing, mountain"
                    className="w-full px-3 py-1.5 border border-[#DAA520]/30 rounded-lg text-xs focus:border-[#DAA520] outline-none bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Preview & Share */}
          {currentStep === 2 && (
            <div className="max-w-xl mx-auto space-y-4">
              {!isGenerated ? (
                /* Generating Screen */
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#DAA520] to-[#F4C430] flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  </div>
                  <h3 className="text-xl font-bold text-[#654321] mb-2">
                    Creating Your Invitation
                  </h3>
                  <p className="text-sm text-[#8B4513]/70">
                    AI is generating a beautiful invitation...
                  </p>
                </div>
              ) : (
                /* Preview Screen */
                <div className="space-y-4">
                  {/* Preview Card */}
                  <div 
                    className="rounded-xl overflow-hidden shadow-lg border-2"
                    style={{ borderColor: colorTheme }}
                  >
                    {/* Banner with Title Overlay */}
                    <div 
                      className="aspect-[2/1] relative"
                      style={{ 
                        background: bannerUrl 
                          ? undefined 
                          : `linear-gradient(135deg, ${colorTheme}dd, ${colorTheme})`
                      }}
                    >
                      {bannerUrl ? (
                        <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                          <Sparkles className="w-8 h-8 mb-2 opacity-70" />
                          <p className="text-sm opacity-80">{occasion}</p>
                        </div>
                      )}
                      
                      {/* Title Overlay on Image */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                        <h2 
                          className="text-2xl sm:text-3xl font-bold text-white text-center px-4 drop-shadow-lg"
                          style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
                        >
                          {eventDetails.eventTitle || collectionTitle}
                        </h2>
                        {eventDetails.guestOfHonorAge && (
                          <p className="text-lg text-white/90 mt-1 drop-shadow-md">
                            Turning {eventDetails.guestOfHonorAge}! 🎉
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Message & Details */}
                    <div className="p-4 bg-white">
                      <p className="text-sm text-[#654321] whitespace-pre-line leading-relaxed">
                        {invitationMessage}
                      </p>
                      
                      {/* Special Message */}
                      {eventDetails.additionalInfo && (
                        <div className="mt-3 p-3 bg-gradient-to-r from-[#FEF3C7]/50 to-[#FDE68A]/50 rounded-lg border border-[#DAA520]/20">
                          <p className="text-xs text-[#8B4513] italic">
                            💌 {eventDetails.additionalInfo}
                          </p>
                        </div>
                      )}
                      
                      {/* Event Details Summary */}
                      <div className="mt-4 pt-3 border-t border-[#DAA520]/20 space-y-2">
                        {eventDetails.eventDate && (
                          <p className="text-xs text-[#8B4513]/70 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {new Date(eventDetails.eventDate).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                            {eventDetails.eventTime && ` at ${eventDetails.eventTime}`}
                          </p>
                        )}
                        {eventDetails.locationName && !eventDetails.isVirtual && (
                          <p className="text-xs text-[#8B4513]/70 flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            {eventDetails.locationName}
                            {eventDetails.city && `, ${eventDetails.city}`}
                          </p>
                        )}
                        {eventDetails.isVirtual && (
                          <p className="text-xs text-[#8B4513]/70 flex items-center gap-2">
                            <Video className="w-3 h-3" />
                            Virtual Event
                          </p>
                        )}
                        {eventDetails.hostName && (
                          <p className="text-xs text-[#8B4513]/70 flex items-center gap-2">
                            <User className="w-3 h-3" />
                            Hosted by {eventDetails.hostName}
                          </p>
                        )}
                      </div>
                      
                      {/* Contribution Link Preview */}
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            className="px-3 py-1.5 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] text-[14px] font-semibold rounded-md shadow-sm cursor-default"
                          >
                            View & Contribute
                          </button>
                        </div>
                        <p className="text-[10px] text-center text-[#8B4513]/50 italic">
                          Link will be active after gift creation
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Regenerate Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={handleRegenerate}
                      disabled={isGenerating}
                      className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#DAA520] text-[#654321] text-[14px] font-semibold rounded-md hover:bg-[#DAA520]/10 transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                      Regenerate
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-[#DAA520]/20 flex-shrink-0">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[14px] text-[#654321] font-medium rounded-md hover:bg-[#F5F1E8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back
          </button>

          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full transition-all ${
              currentStep === 1 ? 'w-6 bg-[#DAA520]' : 'bg-[#B8860B]'
            }`} />
            <div className={`w-2 h-2 rounded-full transition-all ${
              currentStep === 2 ? 'w-6 bg-[#DAA520]' : 'bg-[#DAA520]/30'
            }`} />
          </div>

          <button
            type="button"
            onClick={currentStep === 2 && isGenerated ? handleComplete : nextStep}
            disabled={isSubmitting || (currentStep === 2 && !isGenerated)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] text-[14px] font-semibold rounded-md hover:scale-105 transition-all disabled:opacity-50"
          >
            {currentStep === 2 && isGenerated ? (
              isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Apply & Continue'
              )
            ) : (
              <>
                Generate Preview
                <Wand2 className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EviteWizard
