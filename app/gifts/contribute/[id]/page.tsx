'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { 
  Gift, 
  Heart, 
  Users, 
  Calendar, 
  DollarSign, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  CreditCard,
  Lock,
  ArrowLeft,
  PartyPopper,
  Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'

interface GiftDetails {
  id: string
  collectionTitle: string
  giftName: string
  description: string
  targetAmount: number
  currentAmount: number
  contributors: number
  deadline: string
  bannerImage?: string
  recipientName?: string
  occasion?: string
}

export default function GuestContributePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const giftId = params.id as string
  const token = searchParams.get('token')

  const [isLoading, setIsLoading] = useState(true)
  const [isValidLink, setIsValidLink] = useState(false)
  const [giftDetails, setGiftDetails] = useState<GiftDetails | null>(null)
  const [colorTheme, setColorTheme] = useState('#DAA520')
  const [invitationMessage, setInvitationMessage] = useState('')

  // Contribution form state
  const [contributorName, setContributorName] = useState('')
  const [contributorEmail, setContributorEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  
  // Payment step state
  const [showPaymentStep, setShowPaymentStep] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [cardError, setCardError] = useState('')

  // Validate magic link on mount
  useEffect(() => {
    async function validateLink() {
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/gifts/${giftId}/magic-link?token=${token}`)
        const data = await response.json()

        if (data.valid) {
          setIsValidLink(true)
          setColorTheme(getColorFromTheme(data.settings?.colorTheme || 'gold'))
          setInvitationMessage(data.settings?.invitationMessage || '')
          
          // Use gift details from API if available, otherwise use demo data
          if (data.giftDetails) {
            setGiftDetails(data.giftDetails)
          } else {
            // Fallback demo data
            setGiftDetails({
              id: giftId,
              collectionTitle: "Gift Collection",
              giftName: "Special Gift",
              description: "Help make this gift possible!",
              targetAmount: 500,
              currentAmount: 0,
              contributors: 0,
              deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              recipientName: "Someone Special",
              occasion: "Birthday",
            })
          }
        }
      } catch (error) {
        console.error("Error validating link:", error)
      } finally {
        setIsLoading(false)
      }
    }

    validateLink()
  }, [giftId, token])

  function getColorFromTheme(theme: string): string {
    // Warm colors only
    const colors: Record<string, string> = {
      gold: '#DAA520',
      coral: '#FF6B6B',
      amber: '#F59E0B',
      sunset: '#EA580C',
      crimson: '#DC2626',
      honey: '#B8860B',
    }
    return colors[theme] || '#DAA520'
  }

  // Format card number with spaces
  function formatCardNumber(value: string) {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    return parts.length ? parts.join(' ') : value
  }

  // Format expiry date
  function formatExpiry(value: string) {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  // Step 1: Go to payment step
  function handleProceedToPayment(e: React.FormEvent) {
    e.preventDefault()
    
    if (!contributorEmail || !amount) {
      toast({ 
        title: "Required Fields", 
        description: "Please enter your email and contribution amount.",
        variant: "destructive" 
      })
      return
    }

    if (parseFloat(amount) < 1) {
      toast({ 
        title: "Invalid Amount", 
        description: "Contribution amount must be at least $1.",
        variant: "destructive" 
      })
      return
    }

    setShowPaymentStep(true)
  }

  // Step 2: Process payment and submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCardError('')
    
    // Validate card details
    const cleanCardNumber = cardNumber.replace(/\s/g, '')
    if (cleanCardNumber.length < 15) {
      setCardError('Please enter a valid card number')
      return
    }
    
    if (cardExpiry.length < 5) {
      setCardError('Please enter a valid expiry date (MM/YY)')
      return
    }
    
    if (cardCvc.length < 3) {
      setCardError('Please enter a valid CVC')
      return
    }

    setIsSubmitting(true)

    try {
      // In production, this would tokenize the card with Stripe and process payment
      // For demo, we simulate a payment delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const response = await fetch(`/api/gifts/${giftId}/guest-contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          contributorName,
          contributorEmail,
          message,
          token,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setIsSuccess(true)
        toast({ 
          title: "🎉 Thank You!", 
          description: "Your contribution has been received!",
          variant: "warm" 
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ 
        title: "Payment Failed", 
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive" 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const predefinedAmounts = [25, 50, 100, 150]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FEF3C7] via-[#FDE68A] to-[#FCD34D] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#DAA520] mx-auto mb-4" />
          <p className="text-[#654321] font-medium">Loading gift details...</p>
        </div>
      </div>
    )
  }

  if (!token || !isValidLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FEF3C7] via-[#FDE68A] to-[#FCD34D] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-[#DC2626] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#654321] mb-2">Invalid or Expired Link</h1>
          <p className="text-[#8B4513]/70 mb-6">
            This contribution link is no longer valid. Please contact the gift organizer for a new link.
          </p>
          <Button 
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:scale-105"
          >
            Go to Homepage
          </Button>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FEFCF8] via-[#FFF9F0] to-[#FFFBF5] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full border border-[#DAA520]/10">
          {/* Celebration Header */}
          <div className="bg-gradient-to-r from-[#DAA520] via-[#F4C430] to-[#DAA520] p-5 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-2 left-4 text-xl opacity-60">✨</div>
            <div className="absolute top-3 right-5 text-lg opacity-60">🎁</div>
            <div className="absolute bottom-2 left-6 text-base opacity-60">🎉</div>
            <div className="absolute bottom-2 right-4 text-lg opacity-60">💛</div>
            
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center bg-white/30 backdrop-blur-sm border-2 border-white/50">
                <PartyPopper className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-[18px] font-bold text-white">Thank You!</h1>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-5 text-center">
            {/* Amount Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#DAA520]/10 to-[#F4C430]/10 border-2 border-[#DAA520]/30 rounded-full px-4 py-2 mb-4">
              <DollarSign className="w-4 h-4 text-[#DAA520]" />
              <span className="text-[16px] font-bold text-[#654321]">${amount}</span>
              <span className="text-[14px] text-[#8B4513]/70">contributed</span>
            </div>
            
            <p className="text-[16px] text-[#8B4513] mb-5">
              Your generosity helps make this gift extra special!
            </p>
            
            {/* Gift Info Card */}
            <div className="bg-gradient-to-br from-[#F5F1E8] to-[#FEF3C7] rounded-xl p-4 mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gift className="w-4 h-4 text-[#DAA520]" />
                <p className="text-[12px] text-[#8B4513]/60 uppercase tracking-wide font-semibold">Contributing to</p>
              </div>
              <p className="font-bold text-[16px] text-[#654321]">{giftDetails?.collectionTitle || giftDetails?.giftName}</p>
            </div>
            
            {/* Confirmation Email Notice */}
            <div className="flex items-center justify-center gap-2 text-[14px] text-[#8B4513]/60 bg-[#F5F1E8] rounded-lg px-4 py-2">
              <Send className="w-4 h-4" />
              <span>Receipt sent to <strong className="text-[#654321]">{contributorEmail}</strong></span>
            </div>
            
            {/* Message if provided */}
            {message && (
              <div className="mt-4 p-3 bg-[#FEF3C7]/50 rounded-lg border border-[#DAA520]/20">
                <p className="text-[12px] text-[#8B4513]/60 mb-1">Your message:</p>
                <p className="text-[14px] text-[#654321] italic">"{message}"</p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="px-5 pb-5">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full py-2.5 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] text-[14px] font-semibold rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              Back to Wishbee
            </button>
          </div>
        </div>
      </div>
    )
  }

  const progress = giftDetails ? (giftDetails.currentAmount / giftDetails.targetAmount) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFCF8] via-[#FFF9F0] to-[#FFFBF5] py-8">
      {/* Content - Single Unified Gift Collection Widget */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-[#DAA520]/10">
          {/* Collection Title & Message Section */}
          {giftDetails?.bannerImage ? (
            <div className="relative">
              <img 
                src={giftDetails.bannerImage} 
                alt={giftDetails.giftName}
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-center">
                <h1 className="text-xl font-bold text-white drop-shadow-lg mb-1">
                  {giftDetails?.collectionTitle || 'Gift Collection'}
                </h1>
                {invitationMessage && (
                  <p className="text-[13px] text-white/90 leading-relaxed max-w-md mx-auto drop-shadow">
                    {invitationMessage}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div 
              className="p-5 text-center border-b border-[#DAA520]/10"
              style={{ background: `linear-gradient(135deg, ${colorTheme}25, ${colorTheme}40)` }}
            >
              <div 
                className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg"
                style={{ background: `linear-gradient(135deg, ${colorTheme}, ${colorTheme}cc)` }}
              >
                <Gift className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-xl font-bold text-[#654321] mb-2">{giftDetails?.collectionTitle || 'Gift Collection'}</h1>
              {invitationMessage && (
                <p className="text-[14px] text-[#8B4513]/80 leading-relaxed max-w-md mx-auto">
                  {invitationMessage}
                </p>
              )}
            </div>
          )}

          {/* Gift Info Section */}
          <div className="p-4 border-b border-[#DAA520]/10 bg-[#FEFCF8]">
            <div className="flex items-start gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${colorTheme}20` }}
              >
                <Gift className="w-5 h-5" style={{ color: colorTheme }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-[#8B4513]/50 font-semibold mb-0.5">Gift</p>
                <h2 className="text-[14px] font-bold text-[#654321] leading-tight">{giftDetails?.giftName}</h2>
              </div>
            </div>
          </div>

          {/* Progress & Stats Section */}
          <div className="px-5 py-4 bg-gradient-to-br from-[#FEF7ED]/50 to-[#FFFBEB]/50 border-b border-[#DAA520]/10">
            {/* Progress Bar with Amount */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-[14px] font-bold" style={{ color: colorTheme }}>
                ${giftDetails?.currentAmount?.toFixed(2)} raised
              </span>
              <span className="text-[13px] text-[#8B4513]/60">
                of ${giftDetails?.targetAmount?.toFixed(2)}
              </span>
            </div>
            <div className="h-2.5 bg-[#F5F1E8] rounded-full overflow-hidden shadow-inner mb-3">
              <div 
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ 
                  width: `${Math.min(progress, 100)}%`,
                  background: `linear-gradient(90deg, ${colorTheme}, ${colorTheme}cc)`
                }}
              />
            </div>
            
            {/* Stats Row - Compact */}
            <div className="flex justify-between text-[12px]">
              <div className="flex items-center gap-1.5 text-[#8B4513]/70">
                <Users className="w-3.5 h-3.5" style={{ color: colorTheme }} />
                <span>{giftDetails?.contributors} contributors</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#8B4513]/70">
                <Calendar className="w-3.5 h-3.5" style={{ color: colorTheme }} />
                <span>
                  {giftDetails?.deadline 
                    ? new Date(giftDetails.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'No deadline'}
                </span>
              </div>
              <span className="font-semibold" style={{ color: colorTheme }}>
                {Math.min(Math.round(progress), 100)}% funded
              </span>
            </div>
          </div>

          {/* Contribution Form Section */}
          <div className="p-5">
          {!showPaymentStep ? (
            <>
              {/* Step 1: Contribution Details */}
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5" style={{ color: colorTheme }} />
                <h3 className="text-lg font-bold text-[#654321]">Make a Contribution</h3>
              </div>

              <form onSubmit={handleProceedToPayment} className="space-y-4">
                {/* Amount Selection */}
                <div className="space-y-2">
                  <Label className="text-[#654321] font-semibold">
                    <DollarSign className="w-4 h-4 inline mr-1" style={{ color: colorTheme }} />
                    Amount
                  </Label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {predefinedAmounts.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(preset.toString())}
                        className={`py-2 rounded-lg font-semibold text-sm transition-all ${
                          amount === preset.toString()
                            ? 'bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] shadow-md'
                            : 'bg-[#F5F1E8] text-[#654321] hover:bg-[#DAA520]/20'
                        }`}
                      >
                        ${preset}
                      </button>
                    ))}
                  </div>
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Custom amount"
                    className="border-2 border-[#DAA520]/30 focus:border-[#DAA520] h-12"
                  />
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label className="text-[#654321] font-semibold">Your Name (optional)</Label>
                  <Input
                    type="text"
                    value={contributorName}
                    onChange={(e) => setContributorName(e.target.value)}
                    placeholder="Enter your name"
                    className="border-2 border-[#DAA520]/30 focus:border-[#DAA520] h-12"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label className="text-[#654321] font-semibold">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={contributorEmail}
                    onChange={(e) => setContributorEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="border-2 border-[#DAA520]/30 focus:border-[#DAA520] h-12"
                  />
                  <p className="text-xs text-[#8B4513]/60">For contribution receipt only</p>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label className="text-[#654321] font-semibold">Add a Message (optional)</Label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write a personal message..."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-[#DAA520]/30 rounded-lg focus:border-[#DAA520] focus:ring-2 focus:ring-[#DAA520]/20 outline-none resize-none text-[#654321]"
                  />
                </div>

                {/* Continue to Payment */}
                <Button
                  type="submit"
                  disabled={!amount || !contributorEmail}
                  className="w-full h-11 text-[14px] font-semibold rounded-lg shadow-md hover:scale-[1.02] transition-all disabled:opacity-50 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520]"
                >
                  Continue to Payment
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>

                <p className="text-center text-xs text-[#8B4513]/60">
                  <Lock className="w-3 h-3 inline mr-1" />
                  Secure payment on next step
                </p>
              </form>
            </>
          ) : (
            <>
              {/* Step 2: Payment Details */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setShowPaymentStep(false)}
                  className="flex items-center gap-1 text-sm text-[#8B4513]/70 hover:text-[#654321] mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" style={{ color: colorTheme }} />
                  <h3 className="text-lg font-bold text-[#654321]">Payment Details</h3>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-r from-[#F5F1E8] to-[#FEF3C7] rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-[14px] text-[#8B4513]/70">Contribution Amount</span>
                  <span className="text-[16px] font-bold text-[#654321]">${amount}</span>
                </div>
                {contributorName && (
                  <p className="text-xs text-[#8B4513]/60 mt-1">From: {contributorName}</p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Card Number */}
                <div className="space-y-2">
                  <Label className="text-[#654321] font-semibold">Card Number</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="border-2 border-[#DAA520]/30 focus:border-[#DAA520] h-12 pl-12"
                    />
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B4513]/40" />
                  </div>
                </div>

                {/* Expiry & CVC */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-[#654321] font-semibold">Expiry Date</Label>
                    <Input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="border-2 border-[#DAA520]/30 focus:border-[#DAA520] h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#654321] font-semibold">CVC</Label>
                    <Input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="123"
                      maxLength={4}
                      className="border-2 border-[#DAA520]/30 focus:border-[#DAA520] h-12"
                    />
                  </div>
                </div>

                {/* Card Error */}
                {cardError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4" />
                    {cardError}
                  </div>
                )}

                {/* Submit Payment */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 text-[14px] font-semibold rounded-lg shadow-md hover:scale-[1.02] transition-all disabled:opacity-50 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 mr-1.5" />
                      Pay ${amount}
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-[#8B4513]/60">
                  <Lock className="w-3 h-3" />
                  <span>256-bit SSL encrypted • Secure payment</span>
                </div>
              </form>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
