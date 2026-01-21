// =============================================================================
// AI INVITATION SYSTEM - TypeScript Interfaces
// =============================================================================

export type OccasionType = 
  | 'birthday'
  | 'wedding'
  | 'baby_shower'
  | 'holiday'
  | 'corporate'
  | 'graduation'
  | 'anniversary'
  | 'housewarming'
  | 'retirement'
  | 'custom'

export type ThemeStyle = 
  | 'elegant'
  | 'fun'
  | 'modern'
  | 'minimal'
  | 'luxury'
  | 'vintage'
  | 'playful'
  | 'romantic'
  | 'professional'

export type ToneType = 
  | 'playful'
  | 'formal'
  | 'warm'
  | 'celebratory'
  | 'heartfelt'
  | 'professional'

export type GenerationSource = 'openai' | 'fal'

export type GenerationStatus = 
  | 'pending'
  | 'generating'
  | 'completed'
  | 'failed'
  | 'moderated'

export type InvitationVariationType = 
  | 'hero'
  | 'variation'

// Color palette interface
export interface ColorPalette {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
}

// Invitation input parameters
export interface InvitationParams {
  occasion: OccasionType
  theme: ThemeStyle
  tone: ToneType
  colorPalette: ColorPalette
  eventTitle: string
  eventDate?: string
  eventTime?: string
  eventLocation?: string
  hostName?: string
  customMessage?: string
  productReference?: {
    id: string
    name: string
    imageUrl?: string
  }
  variationCount?: number // Number of FAL variations to generate
}

// Generated invitation image
export interface InvitationImage {
  id: string
  invitationId: string
  imageUrl: string
  thumbnailUrl?: string
  type: InvitationVariationType
  source: GenerationSource
  prompt: string
  styleModifiers?: string
  createdAt: string
  isSelected: boolean
  metadata?: Record<string, unknown>
}

// Main invitation record
export interface Invitation {
  id: string
  userId: string
  params: InvitationParams
  status: GenerationStatus
  heroImage?: InvitationImage
  variations: InvitationImage[]
  selectedImageId?: string
  shareToken?: string
  viewCount: number
  createdAt: string
  updatedAt: string
  expiresAt?: string
  costTracking: CostTracking
}

// Cost tracking for billing
export interface CostTracking {
  openaiCalls: number
  openaiCost: number
  falCalls: number
  falCost: number
  totalCost: number
}

// User generation limits
export interface UserGenerationLimits {
  userId: string
  dailyLimit: number
  dailyUsed: number
  monthlyLimit: number
  monthlyUsed: number
  lastResetDate: string
  tier: 'free' | 'premium' | 'enterprise'
}

// API request/response types
export interface GenerateInvitationRequest {
  params: InvitationParams
  generateHero?: boolean
  generateVariations?: boolean
  variationCount?: number
}

export interface GenerateInvitationResponse {
  success: boolean
  invitation?: Invitation
  error?: string
  remainingCredits?: number
}

export interface RegenerateRequest {
  invitationId: string
  regenerateHero?: boolean
  regenerateVariations?: boolean
  newParams?: Partial<InvitationParams>
}

// Share invitation types
export interface ShareInvitationRequest {
  invitationId: string
  platform: 'whatsapp' | 'imessage' | 'email' | 'copy' | 'native'
  recipientEmail?: string
  customMessage?: string
}

export interface SharedInvitation {
  id: string
  invitationId: string
  shareToken: string
  imageUrl: string
  eventDetails: {
    title: string
    date?: string
    time?: string
    location?: string
    hostName?: string
    message?: string
  }
  viewCount: number
  createdAt: string
  expiresAt?: string
}

// Prompt template types
export interface PromptTemplate {
  occasion: OccasionType
  basePrompt: string
  styleModifiers: Record<ThemeStyle, string>
  toneModifiers: Record<ToneType, string>
  layoutInstructions: string
  safetyNegatives: string[]
}

// Safety validation
export interface SafetyValidationResult {
  isValid: boolean
  issues: string[]
  sanitizedPrompt?: string
}

// Gallery display
export interface InvitationGalleryProps {
  invitation: Invitation
  onSelect: (imageId: string) => void
  onRegenerate: (type: 'hero' | 'variations') => void
  onShare: () => void
  isLoading?: boolean
}

// Form state
export interface InvitationFormState {
  step: 'params' | 'generating' | 'gallery' | 'share'
  params: Partial<InvitationParams>
  invitation?: Invitation
  error?: string
  isSubmitting: boolean
}
