"use client"

import {
  ArrowLeft,
  Clock,
  Users,
  Share2,
  Sparkles,
  Target,
  Gift,
  Copy,
  Mail,
  MessageCircle,
  X,
  Check,
  Heart,
  DollarSign,
  Award,
  ShoppingCart,
  PartyPopper,
  Eye,
  Bell,
  Globe,
  Leaf,
  Cross,
  Wallet,
  ChevronRight,
  ScrollText,
  Wrench,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { computeDonationAmounts } from "@/lib/donation-fee"
import { CHARITY_DATA } from "@/lib/charity-data"
import { SettlementHistory } from "@/components/settlement-history"
import { WishbeeSettlementSummary } from "@/components/wishbee-settlement-summary"
import { Footer } from "@/components/footer"

/** Avoid SSR running the full page (sessionStorage, etc.) which can cause 500 on some setups. */
function useClientOnly() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

type ActiveGift = {
  id: string | number
  name: string
  image: string
  targetAmount: number
  currentAmount: number
  contributors: number
  daysLeft: number
  urgency: "high" | "medium" | "low"
  /** When 'purchased', show Settle Balance and balance actions; otherwise 'Preview' */
  fundingStatus?: "active" | "purchased"
}

// Demo/sample collections shown when user has none (or not signed in)
const DEMO_ACTIVE_GIFTS: ActiveGift[] = [
  { id: 1, name: "Sarah's Birthday Gift", image: "/images/espresso-machine.webp", targetAmount: 500, currentAmount: 350, contributors: 8, daysLeft: 5, urgency: "high" },
  { id: 2, name: "Team Appreciation Gift", image: "/colorful-gift-box.png", targetAmount: 300, currentAmount: 180, contributors: 12, daysLeft: 10, urgency: "medium" },
  { id: 3, name: "Dad's Retirement Celebration", image: "/images/retirement-celebration.jpg", targetAmount: 800, currentAmount: 620, contributors: 15, daysLeft: 3, urgency: "high" },
  { id: 4, name: "Baby Shower for Emma", image: "/colorful-gift-box.png", targetAmount: 400, currentAmount: 250, contributors: 10, daysLeft: 12, urgency: "low" },
  { id: 5, name: "Office Holiday Party Fund", image: "/images/espresso-machine.webp", targetAmount: 1000, currentAmount: 450, contributors: 25, daysLeft: 7, urgency: "medium" },
  { id: 6, name: "Wedding Gift for Alex & Jamie", image: "/images/wedding-gift.jpg", targetAmount: 600, currentAmount: 540, contributors: 18, daysLeft: 4, urgency: "high" },
]

/** Charity list for donation UI — excludes Support Wishbee (handled separately) */
const DONATION_CHARITIES = CHARITY_DATA.filter((c) => c.id !== "support-wishbee")

function ActiveGiftsPageContent() {
  const router = useRouter()
  const [activeGifts, setActiveGifts] = useState<ActiveGift[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAI, setLoadingAI] = useState<string | null>(null)
  const [aiInsights, setAiInsights] = useState<{ [key: string]: any }>({})
  const [sharingGift, setSharingGift] = useState<string | null>(null)
  const [remindingGift, setRemindingGift] = useState<string | null>(null)
  
  // New gift share modal state
  const [showShareModal, setShowShareModal] = useState(false)
  const [newGiftLink, setNewGiftLink] = useState<string | null>(null)
  const [newGiftId, setNewGiftId] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  // Share options modal (Copy / Email / WhatsApp) when user clicks Share on a gift
  const [shareOptionsUrl, setShareOptionsUrl] = useState<string | null>(null)
  const [shareOptionsGiftName, setShareOptionsGiftName] = useState<string | null>(null)
  const [shareOptionsLinkCopied, setShareOptionsLinkCopied] = useState(false)

  // Post-purchase modals (from design: Gift Purchased Successfully, Small Balance donation, Donation confirmation)
  const [purchaseModal, setPurchaseModal] = useState<{
    gift: ActiveGift
    productTotal: number
    remaining: number
    recipientName: string
  } | null>(null)
  const [donationCharity, setDonationCharity] = useState<string | null>(null)
  const [donationConfirmed, setDonationConfirmed] = useState<{
    amount: number
    charityName: string
    eventName: string
    disposition: "charity"
    dedication: string
    viewGiftDetailsUrl: string
    receiptUrl?: string
    recipientName: string
    totalFundsCollected: number
    finalGiftPrice: number
  } | null>(null)
  /** Cover transaction fees so 100% of balance goes to charity (charity donations only; hidden for Support Wishbee) */
  const [coverFees, setCoverFees] = useState(true)
  /** Shown when user chooses Support Wishbee (tip) — includes receiptUrl for immediate receipt (no pooling) */
  const [tipThankYouGift, setTipThankYouGift] = useState<{ gift: ActiveGift; remaining: number; recipientName: string; receiptUrl?: string } | null>(null)
  /** Modal for Settle Balance: choose Bonus Gift Card, Donate to Charity, or Support Wishbee; when remaining < $1, only Support Wishbee is enabled */
  const [settleBalanceModal, setSettleBalanceModal] = useState<{
    gift: ActiveGift
    remaining: number
    recipientName: string
  } | null>(null)
  /** Selected option in Remaining Balance modal (left nav): gift-card | charity | support-wishbee | settlement-history | send-wishbee */
  const [remainingBalanceView, setRemainingBalanceView] = useState<"gift-card" | "charity" | "support-wishbee" | "settlement-history" | "send-wishbee">("gift-card")
  /** Donate-to-charity flow for Settle Balance (amount >= $1); includes event context for dedication and transparency email */
  const [donateFromSettle, setDonateFromSettle] = useState<{
    amount: number
    recipientName: string
    giftId: string
    giftName: string
    totalFundsCollected: number
    finalGiftPrice: number
  } | null>(null)
  const [selectedCharityId, setSelectedCharityId] = useState<string>("feeding-america")
  /** Modal shown before opening Amazon: displays instructions and "Open Amazon" button so message is visible in front */
  const [amazonGiftCardModal, setAmazonGiftCardModal] = useState<{ amount: number } | null>(null)
  /** Recipient email for bonus gift card (Settle flow) */
  const [bonusRecipientEmail, setBonusRecipientEmail] = useState("")
  /** Loading state for settle-wishbee (Reloadly) request */
  const [settleWishbeeLoading, setSettleWishbeeLoading] = useState(false)
  /** After successful gift card: show claim URL and optional redeem code */
  const [giftCardSuccessModal, setGiftCardSuccessModal] = useState<{ claimUrl: string; amount: number; recipientName: string; redeemCode?: string } | null>(null)
  /** Dev Tools — only visible on localhost for testing email flow */
  const [devToolsOpen, setDevToolsOpen] = useState(false)
  const [devGiftId, setDevGiftId] = useState("")
  const [devSettlementId, setDevSettlementId] = useState("")
  const [devSimulating, setDevSimulating] = useState(false)
  const isDevMode = typeof window !== "undefined" && window.location.hostname === "localhost"
  
  const fetchCollections = async () => {
    try {
      const res = await fetch("/api/gifts/collections?status=active")
      if (res.status === 401) {
        setActiveGifts(DEMO_ACTIVE_GIFTS)
        setLoading(false)
        return
      }
      if (!res.ok) throw new Error("Failed to load")
      const data = await res.json()
      const list = (data.collections || []).map((g: {
        id: string
        name: string
        image: string
        targetAmount: number
        currentAmount: number
        contributors: number
        deadline: string
        status?: string
      }) => {
        const deadline = g.deadline ? new Date(g.deadline).getTime() : 0
        const daysLeft = Math.max(0, Math.ceil((deadline - Date.now()) / (24 * 60 * 60 * 1000)))
        const urgency: "high" | "medium" | "low" = daysLeft <= 3 ? "high" : daysLeft <= 7 ? "medium" : "low"
        const fundingStatus: "active" | "purchased" = g.status === "completed" ? "purchased" : "active"
        return {
          id: g.id,
          name: g.name,
          image: g.image || "/placeholder.svg",
          targetAmount: g.targetAmount,
          currentAmount: g.currentAmount,
          contributors: g.contributors,
          daysLeft,
          urgency,
          fundingStatus,
        }
      })
      // Only show gifts whose deadline has not passed (deadline-passed appear on /gifts/past)
      const activeOnly = list.filter((g: { daysLeft: number }) => g.daysLeft > 0)
      const toShow = activeOnly.length > 0 ? activeOnly : (list.length > 0 ? [] : DEMO_ACTIVE_GIFTS.filter((g) => g.daysLeft > 0).map((g) => ({ ...g, fundingStatus: "active" as const })))
      setActiveGifts(toShow)
    } catch {
      setActiveGifts(DEMO_ACTIVE_GIFTS.filter((g) => g.daysLeft > 0).map((g) => ({ ...g, fundingStatus: "active" as const })))
    } finally {
      setLoading(false)
    }
  }

  // Fetch current user's gift collections; fall back to demo when empty
  useEffect(() => {
    fetchCollections()
  }, [])

  // Refetch when tab becomes visible so progress updates after contributing in another tab
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchCollections()
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [])
  
  // Check for newly created gift magic link on mount
  useEffect(() => {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith('gift_') && key.endsWith('_magicLink')) {
        const magicLink = sessionStorage.getItem(key)
        if (magicLink) {
          const giftId = key.replace('gift_', '').replace('_magicLink', '')
          setNewGiftLink(magicLink)
          setNewGiftId(giftId)
          setShowShareModal(true)
          sessionStorage.removeItem(key)
          break
        }
      }
    }
  }, [])
  
  const handleCopyNewGiftLink = async () => {
    if (!newGiftLink) return
    try {
      await navigator.clipboard.writeText(newGiftLink)
      setLinkCopied(true)
      toast.success('🐝 Contribution link copied!', {
        style: { background: 'linear-gradient(to right, #FEF3C7, #FDE68A, #F4C430)', color: '#654321', border: '2px solid #DAA520' }
      })
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy link')
    }
  }
  
  const handleEmailNewGiftLink = () => {
    if (!newGiftLink) return
    const subject = encodeURIComponent('You\'re Invited to Contribute!')
    const body = encodeURIComponent(`I've created a gift collection and would love for you to contribute!\n\nClick here to view and contribute: ${newGiftLink}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }
  
  const handleWhatsAppNewGiftLink = () => {
    if (!newGiftLink) return
    const message = encodeURIComponent(`I've created a gift collection and would love for you to contribute!\n\nClick here to view and contribute: ${newGiftLink}`)
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  const giftProducts = [
    {
      id: 1,
      name: "De'Longhi Espresso Machine",
      image: "/images/espresso-machine.webp",
      price: 499.99,
      store: "Williams Sonoma",
      category: "Kitchen Appliances",
      description:
        "Professional-grade espresso machine with built-in grinder and milk frother. Perfect for coffee lovers.",
      attributes: {
        Color: "Stainless Steel",
        Brand: "De'Longhi",
        Capacity: "2L Water Tank",
        Features: "Built-in Grinder, Milk Frother",
        Warranty: "2 years",
      },
      link: "https://www.williams-sonoma.com/products/delonghi-espresso",
      stockStatus: "In Stock",
      forGift: "Sarah's Birthday Gift",
    },
    {
      id: 2,
      name: "Luxury Spa Gift Set",
      image: "/luxury-spa-gift-set.jpg",
      price: 129.99,
      store: "Nordstrom",
      category: "Beauty & Wellness",
      description: "Premium spa gift set with organic bath products, aromatherapy candles, and plush bathrobe.",
      attributes: {
        Brand: "L'Occitane",
        Items: "6-piece set",
        Scent: "Lavender & Vanilla",
        Material: "100% Organic",
      },
      link: "https://www.nordstrom.com/spa-gift-set",
      stockStatus: "In Stock",
      forGift: "Team Appreciation Gift",
    },
    {
      id: 3,
      name: "Premium Golf Club Set",
      image: "/golf-club-set.jpg",
      price: 749.0,
      store: "Golf Galaxy",
      category: "Sports Equipment",
      description: "Complete golf club set with driver, irons, wedges, putter, and premium carry bag.",
      attributes: {
        Brand: "Callaway",
        Hand: "Right-handed",
        Clubs: "11-piece complete set",
        Material: "Graphite Shaft",
        "Skill Level": "Intermediate to Advanced",
      },
      link: "https://www.golfgalaxy.com/callaway-set",
      stockStatus: "Low Stock",
      forGift: "Dad's Retirement Celebration",
    },
    {
      id: 4,
      name: "Smart Baby Monitor System",
      image: "/smart-baby-monitor.jpg",
      price: 199.99,
      store: "Buy Buy Baby",
      category: "Baby Products",
      description: "HD video baby monitor with night vision, two-way audio, and smartphone connectivity.",
      attributes: {
        Brand: "Nanit",
        Features: "HD Video, Night Vision, Two-way Audio",
        Connectivity: "WiFi, Smartphone App",
        Display: "5-inch HD Screen",
        Range: "1000 ft",
      },
      link: "https://www.buybuybaby.com/nanit-monitor",
      stockStatus: "In Stock",
      forGift: "Baby Shower for Emma",
    },
  ]

  const handleViewDetails = (giftId: string | number, giftName: string) => {
    toast.success(`Opening details for "${giftName}"`)
    router.push(`/gifts/${giftId}`)
  }

  /** Values for "Gift Purchased Successfully" modal. When overfunded, use real amounts; otherwise demo. */
  const getPreviewAmounts = (gift: ActiveGift) => {
    const target = gift.targetAmount
    const collected = gift.currentAmount
    const overfunded = collected >= target
    if (overfunded) {
      const remaining = Math.max(0, Math.round((collected - target) * 100) / 100)
      return { productTotal: target, remaining }
    }
    const remaining = Math.min(15, Math.max(6, Math.round(target * 0.03 * 100) / 100))
    const productTotal = Math.round((target - remaining) * 100) / 100
    return {
      productTotal: productTotal >= 0 ? productTotal : 0,
      remaining: productTotal >= 0 ? remaining : target,
    }
  }

  // General Amazon Gift Cards page (neutral — not occasion-specific)
  const AMAZON_GIFT_CARDS_URL = "https://www.amazon.com/Amazon-eGift-Card-Logo-Animated/dp/B07PCMWTSG?pf_rd_p=9e067638-7091-4c9f-8439-c1fb89e0df0d&pf_rd_r=XPT30XFPXB3QA4JJTYPC&ref_=US_GC_Top_P1_25_STND_B07PCMWTSG&th=1"

  const handleSendAmazonGiftCard = (amount: number) => {
    setAmazonGiftCardModal({ amount })
  }

  const handleOpenAmazonAndCloseModal = () => {
    if (amazonGiftCardModal) {
      window.open(AMAZON_GIFT_CARDS_URL, "_blank", "noopener,noreferrer")
      setAmazonGiftCardModal(null)
    }
  }

  /** Process immediate donation via /api/donations/process-instant. Sends receipt email on success. */
  const processImmediateDonation = async (payload: {
    giftId: string | number
    amount: number
    netAmount: number
    totalToCharge: number
    charityId: string
    charityName: string
    coverFees: boolean
    recipientName: string
    giftName: string
    totalFundsCollected: number
    finalGiftPrice: number
  }): Promise<{ receiptUrl: string | null; error?: string }> => {
    try {
      const res = await fetch("/api/donations/process-instant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftId: payload.giftId,
          amount: payload.amount,
          netAmount: payload.netAmount,
          totalToCharge: payload.totalToCharge,
          charityId: payload.charityId,
          charityName: payload.charityName,
          feeCovered: payload.coverFees,
          recipientName: payload.recipientName,
          giftName: payload.giftName,
          totalFundsCollected: payload.totalFundsCollected,
          finalGiftPrice: payload.finalGiftPrice,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { receiptUrl: null, error: data?.error || "Donation failed. Please try again." }
      }
      return { receiptUrl: data?.receiptUrl ?? null }
    } catch {
      return { receiptUrl: null, error: "Donation failed. Please try again." }
    }
  }

  /** Save tip settlement (Support Wishbee) and return receipt URL. Sends receipt immediately. */
  const saveTipSettlement = async (payload: {
    giftId: string | number
    amount: number
    recipientName: string
    giftName: string
    totalFundsCollected: number
    finalGiftPrice: number
  }): Promise<string | null> => {
    try {
      const res = await fetch(`/api/gifts/${payload.giftId}/settlement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: payload.amount,
          disposition: "tip",
          recipientName: payload.recipientName,
          giftName: payload.giftName,
          totalFundsCollected: payload.totalFundsCollected,
          finalGiftPrice: payload.finalGiftPrice,
        }),
      })
      if (!res.ok) return null
      const data = await res.json()
      const settlementId = data?.settlement?.id
      if (!settlementId) return null
      const base = typeof window !== "undefined" ? window.location.origin : ""
      return `${base}/gifts/${payload.giftId}/receipt/${settlementId}`
    } catch {
      return null
    }
  }

  const handleShare = async (giftId: string | number, giftName: string) => {
    setSharingGift(giftId)
    try {
      const response = await fetch(`/api/gifts/${giftId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftId,
          giftName,
          sharedBy: "Current User",
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate share link")
      }
      const shareUrl = data.shareUrl
      setShareOptionsUrl(shareUrl)
      setShareOptionsGiftName(giftName)
      setShareOptionsLinkCopied(false)
      // Open our share modal so user can pick Copy / Email (mailto) / WhatsApp — mailto opens Gmail reliably
    } catch (error) {
      console.error("[v0] Share error:", error)
      toast.error("Failed to share gift. Please try again.")
    } finally {
      setSharingGift(null)
    }
  }

  const closeShareOptions = () => {
    setShareOptionsUrl(null)
    setShareOptionsGiftName(null)
    setShareOptionsLinkCopied(false)
  }

  const handleShareCopy = async () => {
    if (!shareOptionsUrl) return
    try {
      await navigator.clipboard.writeText(shareOptionsUrl)
      setShareOptionsLinkCopied(true)
      toast.success(`🐝 Link for "${shareOptionsGiftName}" copied!`, {
        style: { background: "linear-gradient(to right, #FEF3C7, #FDE68A, #F4C430)", color: "#654321", border: "2px solid #DAA520" },
      })
      setTimeout(() => setShareOptionsLinkCopied(false), 2000)
    } catch {
      toast.error("Failed to copy link")
    }
  }

  const handleShareEmail = () => {
    if (!shareOptionsUrl || !shareOptionsGiftName) return
    const subject = encodeURIComponent(`You're invited to contribute to ${shareOptionsGiftName}`)
    const body = encodeURIComponent(
      `I'd love for you to contribute to this gift!\n\n${shareOptionsGiftName}\n\nContribute here: ${shareOptionsUrl}`
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
    toast.success("Opening your email app…")
    closeShareOptions()
  }

  const handleShareWhatsApp = () => {
    if (!shareOptionsUrl || !shareOptionsGiftName) return
    const text = encodeURIComponent(`🎁 You're invited to contribute to ${shareOptionsGiftName}!\n\n${shareOptionsUrl}`)
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer")
    toast.success("Opening WhatsApp…")
    closeShareOptions()
  }

  const copyToClipboard = async (url: string, giftName: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success(`🐝 Link for "${giftName}" copied!`, {
        style: { background: 'linear-gradient(to right, #FEF3C7, #FDE68A, #F4C430)', color: '#654321', border: '2px solid #DAA520' }
      })
    } catch (error) {
      toast.error("Failed to copy link. Please try again.")
    }
  }

  const getAIInsights = async (giftId: string | number, gift: ActiveGift) => {
    setLoadingAI(giftId)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    const percentageReached = (gift.currentAmount / gift.targetAmount) * 100
    const avgContribution = gift.currentAmount / gift.contributors
    const neededPerDay = (gift.targetAmount - gift.currentAmount) / gift.daysLeft

    const insights = {
      likelihood: percentageReached > 70 ? "High" : percentageReached > 40 ? "Medium" : "Low",
      recommendation:
        gift.daysLeft < 5
          ? "Send urgent reminders to contributors"
          : percentageReached < 50
            ? "Consider reaching out to potential new contributors"
            : "On track! Keep the momentum going",
      predictedCompletion:
        (gift.targetAmount - gift.currentAmount) / (gift.currentAmount / gift.contributors) <= gift.contributors
          ? `${Math.ceil((gift.targetAmount - gift.currentAmount) / avgContribution)} more contributions needed`
          : `May need ${Math.ceil((neededPerDay * gift.daysLeft) / avgContribution)} more contributors`,
      optimalAction:
        gift.urgency === "high"
          ? "Send personalized messages to inactive contributors today"
          : "Schedule automated reminders for the next 2 days",
    }

    setAiInsights((prev) => ({ ...prev, [giftId]: insights }))
    setLoadingAI(null)
    toast.success("AI insights generated!")
  }

  const sendReminder = async (giftId: string | number, giftName: string, contributors: number) => {
    setRemindingGift(giftId)

    try {
      const response = await fetch(`/api/gifts/${giftId}/remind`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftId,
          giftName,
          contributors,
          message: `Don't forget to contribute to ${giftName}! We're almost there.`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const message = data.error || "Failed to send reminders"
        toast.error(message)
        return
      }

      toast.success(data.message)
    } catch (error) {
      console.error("[v0] Reminder error:", error)
      const message = error instanceof Error ? error.message : "Failed to send reminders. Please try again."
      toast.error(message)
    } finally {
      setRemindingGift(null)
    }
  }

  const handleBuyGift = (product: any) => {
    toast.success(`Opening store page for "${product.name}"`)
    window.open(product.link, "_blank")
  }

  const handleAddToCart = (product: any) => {
    toast.success(`"${product.name}" added to your cart for ${product.forGift}`)
  }

  const getUrgencyBadge = (urgency: string) => {
    const styles = {
      high: "bg-red-500 text-white",
      medium: "bg-amber-500 text-white",
      low: "bg-emerald-500 text-white",
    }
    return (
      <span
        className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-0.5 shadow-sm ${styles[urgency as keyof typeof styles]}`}
      >
        {urgency === "high" ? "🔥 Urgent" : urgency === "medium" ? "⚡ Active" : "✅ On Track"}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header — same as past */}
        <div className="mb-8">
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <div className="flex flex-row items-center justify-center gap-2">
              <Gift className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#DAA520] flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-foreground whitespace-nowrap">
                Active Gift Collections
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2">
              Manage your ongoing group gift collections with AI-powered insights
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-10 h-10 border-2 border-[#DAA520] border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
        {/* Stats Overview — same 4-column layout as past */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border-2 border-[#DAA520]/20">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#DAA520] to-[#F4C430] flex items-center justify-center">
                <Award className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-[#8B4513]/70">Active Collections</p>
                <p className="text-base sm:text-2xl font-bold text-[#654321]">{activeGifts.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-[#DAA520]/20">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#DAA520] to-[#F4C430] flex items-center justify-center">
                <Target className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-[#8B4513]/70">Total Goal</p>
                <p className="text-base sm:text-2xl font-bold text-[#654321]">
                  ${activeGifts.reduce((sum, g) => sum + g.targetAmount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-orange-500/20">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-300 via-coral-400 to-rose-300 flex items-center justify-center">
                <DollarSign className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-[#8B4513]/70">Total Raised</p>
                <p className="text-base sm:text-2xl font-bold text-[#654321]">
                  ${activeGifts.reduce((sum, g) => sum + g.currentAmount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 flex items-center justify-center">
                <Users className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-[#8B4513]/70">Total Contributors</p>
                <p className="text-base sm:text-2xl font-bold text-[#654321]">
                  {activeGifts.reduce((sum, g) => sum + g.contributors, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Gift Cards Grid — same as past */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeGifts.map((gift) => {
            const recipientName = gift.name.replace(/'s.*| for .*/i, "").trim() || "the recipient"
            const pct = gift.targetAmount > 0 ? Math.round((gift.currentAmount / gift.targetAmount) * 100) : 0
            const isFullyFunded = pct >= 100
            const daysLeftLabel = gift.daysLeft === 0 ? "Deadline passed" : gift.daysLeft === 1 ? "1 day left" : `${gift.daysLeft} days left`
            return (
              <div
                key={gift.id}
                className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 p-6 hover:shadow-xl transition-shadow"
              >
                <div className="relative mb-4">
                  <img
                    src={gift.image || "/placeholder.svg"}
                    alt={gift.name}
                    className="w-full h-48 object-cover rounded-lg border-2 border-[#DAA520]"
                  />
                  {getUrgencyBadge(gift.urgency)}
                </div>

                <h3 className="text-base sm:text-lg font-bold text-[#654321] mb-2">{gift.name}</h3>
                <p className="text-xs text-[#8B4513]/70 mb-3 line-clamp-2">
                  {isFullyFunded ? "Goal reached! Ready to purchase the gift." : "Contributions are being collected for this gift."}
                </p>

                <div className="space-y-2 text-xs sm:text-sm text-[#8B4513]/70 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-[#DAA520]" />
                      Progress
                    </span>
                    <span className="font-bold text-[#654321]">${gift.currentAmount} / ${gift.targetAmount}</span>
                  </div>
                  <div className="w-full bg-[#F5DEB3] rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] transition-all duration-500"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <p className={`text-[10px] ${isFullyFunded ? "font-semibold text-[#DAA520]" : "text-[#8B4513]/60"}`}>
                    {isFullyFunded ? "Goal reached!" : `${pct}% funded`}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 text-[#DAA520]" />
                      Contributors
                    </span>
                    <span className="font-bold text-[#654321]">{gift.contributors}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-[#F4C430]" />
                    <span>{daysLeftLabel}</span>
                  </div>
                </div>

                {/* Leftover area — reserved gap so all cards align; show Settle Balance widget when overfunded/purchased */}
                <div className="min-h-[108px] mb-3">
                  {(gift.currentAmount > gift.targetAmount || gift.fundingStatus === "purchased") && (
                    <div className="rounded-lg border border-[#DAA520]/30 bg-gradient-to-br from-amber-50 via-orange-50/80 to-rose-50/60 p-3 shadow-sm">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-center gap-2 w-full">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center ring-2 ring-[#DAA520]/30 flex-shrink-0">
                            <Wallet className="w-4 h-4 text-[#B8860B]" />
                          </div>
                          <p className="text-xs font-semibold text-[#654321] tabular-nums">
                            {(() => {
                              const rem = Math.max(0, Math.round((gift.currentAmount - gift.targetAmount) * 100) / 100)
                              return rem >= 1 ? `$${rem.toFixed(2)} Remaining Balance` : rem > 0 ? "Small change" : "Settle Balance"
                            })()}
                          </p>
                        </div>
                        <div className="space-y-0.5 w-full min-w-0">
                          <p className="text-[11px] text-[#8B4513]/90 leading-tight">
                            {(() => {
                              const r = Math.max(0, Math.round((gift.currentAmount - gift.targetAmount) * 100) / 100)
                              return r >= 1 ? "Send as a gift card, donate to a cause, or support Wishbee." : r > 0 ? "Support Wishbee — tip to keep our AI free and ad-free." : "Choose how to use leftover funds when ready."
                            })()}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              const remaining = Math.max(0, Math.round((gift.currentAmount - gift.targetAmount) * 100) / 100)
                              if (remaining > 0) {
                                router.push(`/settle/balance?id=${gift.id}`)
                              } else toast.info("No remaining balance yet. Once the goal is reached or exceeded, you can donate the extra.")
                            }}
                            className="mt-1 w-full min-h-[32px] px-2 py-1.5 rounded-md bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[11px] font-semibold hover:shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-1 border border-rose-400/30"
                          >
                            <Gift className="w-3 h-3 flex-shrink-0" />
                            Settle Balance
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {aiInsights[gift.id] && (
                  <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 rounded-lg p-3 mb-4 border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
                      <span className="text-[10px] sm:text-xs font-semibold text-[#654321]">AI Insights</span>
                    </div>
                    <div className="space-y-1 text-[10px] sm:text-xs text-[#8B4513]">
                      <p>
                        <span className="font-semibold">Recommendation:</span> {aiInsights[gift.id].recommendation}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <button
                    onClick={() => handleViewDetails(gift.id, gift.name)}
                    className="block w-full min-h-[32px] px-2 py-1.5 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-md text-[11px] font-semibold hover:shadow-md transition-all text-center flex items-center justify-center"
                  >
                    View Details
                  </button>

                  <div className={`grid gap-1 ${(gift.fundingStatus === "purchased" || gift.currentAmount > gift.targetAmount) ? "grid-cols-2" : "grid-cols-3"}`}>
                    <button
                      onClick={() => handleShare(gift.id, gift.name)}
                      disabled={sharingGift === gift.id}
                      className="w-full min-h-[32px] min-w-0 px-2 py-1.5 bg-gradient-to-r from-orange-400 via-rose-400 to-pink-500 text-white rounded-md text-[11px] font-semibold hover:shadow-md transition-all flex items-center justify-center gap-0.5 disabled:opacity-50"
                    >
                      <Share2 className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{sharingGift === gift.id ? "..." : "Share"}</span>
                    </button>
                    <button
                      onClick={() => sendReminder(gift.id, gift.name, gift.contributors)}
                      disabled={remindingGift === gift.id}
                      className="w-full min-h-[32px] min-w-0 px-2 py-1.5 bg-amber-100 border border-amber-400/60 text-amber-900 rounded-md text-[11px] font-semibold hover:bg-amber-200 hover:border-amber-500 transition-all flex items-center justify-center gap-0.5 disabled:opacity-50"
                    >
                      <Bell className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{remindingGift === gift.id ? "..." : "Remind"}</span>
                    </button>
                    {!(gift.fundingStatus === "purchased" || gift.currentAmount > gift.targetAmount) && (
                      <button
                        onClick={() => {
                          const { productTotal, remaining } = getPreviewAmounts(gift)
                          setPurchaseModal({ gift, productTotal, remaining, recipientName })
                        }}
                        className="w-full min-h-[32px] min-w-0 px-2 py-1.5 rounded-md text-[11px] font-semibold text-[#654321] border border-[#DAA520] bg-[#FEF3C7] hover:bg-[#FDE68A] hover:border-[#EAB308] transition-all flex items-center justify-center gap-0.5"
                      >
                        <Eye className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">Preview</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => getAIInsights(gift.id, gift)}
                    disabled={loadingAI === gift.id}
                    className="w-full min-h-[32px] px-2 py-1.5 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 text-white rounded-md text-[11px] font-semibold hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    {loadingAI === gift.id ? "Analyzing..." : aiInsights[gift.id] ? "Refresh AI" : "AI Insights"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        </>
        )}

        {/* Dev Tools — only visible on localhost for testing email flow */}
        {isDevMode && (
          <div className="mt-8 border-2 border-dashed border-amber-400/60 rounded-xl bg-amber-50/50 p-4">
            <button
              type="button"
              onClick={() => setDevToolsOpen((o) => !o)}
              className="flex items-center gap-2 text-sm font-medium text-amber-800 hover:text-amber-900"
            >
              <Wrench className="w-4 h-4" />
              Dev Tools
              <ChevronRight className={`w-4 h-4 transition-transform ${devToolsOpen ? "rotate-90" : ""}`} />
            </button>
            {devToolsOpen && (
              <div className="mt-4 space-y-3 pt-4 border-t border-amber-200">
                <p className="text-xs text-amber-800/80">
                  Simulate the Stripe webhook flow locally. Use Mailtrap or Inngest to capture emails.
                </p>
                <div className="flex flex-wrap gap-3">
                  <input
                    type="text"
                    placeholder="Gift ID (eventId)"
                    value={devGiftId}
                    onChange={(e) => setDevGiftId(e.target.value)}
                    className="flex-1 min-w-[160px] px-3 py-2 rounded-lg border border-amber-300 bg-white text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Settlement ID"
                    value={devSettlementId}
                    onChange={(e) => setDevSettlementId(e.target.value)}
                    className="flex-1 min-w-[160px] px-3 py-2 rounded-lg border border-amber-300 bg-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!devGiftId.trim() || !devSettlementId.trim()) {
                        toast.error("Enter Gift ID and Settlement ID")
                        return
                      }
                      setDevSimulating(true)
                      try {
                        const res = await fetch("/api/webhooks/stripe", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            "x-webhook-test-bypass": "1",
                          },
                          body: JSON.stringify({
                            eventId: devGiftId.trim(),
                            settlementId: devSettlementId.trim(),
                          }),
                        })
                        const data = await res.json().catch(() => ({}))
                        if (!res.ok) {
                          toast.error(data.error || "Simulation failed")
                          return
                        }
                        toast.success("Simulation complete. Check console and Mailtrap.")
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Simulation failed")
                      } finally {
                        setDevSimulating(false)
                      }
                    }}
                    disabled={devSimulating}
                    className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-50"
                  >
                    {devSimulating ? "Simulating…" : "Simulate Successful Settlement"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      <Footer />
      
      {/* New Gift Share Modal */}
      {showShareModal && newGiftLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Gift Created!</h3>
                    <p className="text-xs text-white/80">Share your contribution link</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Link Display */}
              <div className="bg-[#F5F1E8] rounded-lg p-3">
                <p className="text-[10px] text-[#8B4513]/60 uppercase tracking-wide mb-1">Contribution Link</p>
                <p className="text-xs text-[#654321] font-mono break-all">{newGiftLink}</p>
              </div>
              
              {/* Share Buttons */}
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleCopyNewGiftLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white shadow-sm hover:shadow-md hover:scale-105 transition-all"
                >
                  {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[10px] font-medium">{linkCopied ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleEmailNewGiftLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#EA580C] to-[#FB923C] text-white shadow-sm hover:shadow-md hover:scale-105 transition-all"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-medium">Email</span>
                </button>
                <button
                  onClick={handleWhatsAppNewGiftLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white shadow-sm hover:shadow-md hover:scale-105 transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-medium">WhatsApp</span>
                </button>
              </div>
              
              {/* Done Button */}
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full py-2.5 bg-[#F5F1E8] text-[#654321] font-semibold rounded-lg hover:bg-[#EDE9E0] transition-colors text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share options modal (Copy / Email / WhatsApp) — Email uses mailto so Gmail opens */}
      {shareOptionsUrl && shareOptionsGiftName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-white" />
                <div>
                  <h3 className="text-lg font-bold text-white">Share contribution link</h3>
                  <p className="text-xs text-white/90">{shareOptionsGiftName}</p>
                </div>
              </div>
              <button
                onClick={closeShareOptions}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-[#F5F1E8] rounded-lg p-3">
                <p className="text-[10px] text-[#8B4513]/60 uppercase tracking-wide mb-1">Link</p>
                <p className="text-xs text-[#654321] font-mono break-all">{shareOptionsUrl}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={handleShareCopy}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white shadow-sm hover:shadow-md hover:scale-105 transition-all"
                >
                  {shareOptionsLinkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span className="text-sm font-medium">{shareOptionsLinkCopied ? "Copied!" : "Copy link"}</span>
                </button>
                <button
                  onClick={handleShareEmail}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#EA580C] to-[#FB923C] text-white shadow-sm hover:shadow-md hover:scale-105 transition-all"
                >
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium">Gmail / Email</span>
                </button>
                <button
                  onClick={handleShareWhatsApp}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white shadow-sm hover:shadow-md hover:scale-105 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remaining Balance modal — left nav + right content (like /gifts/create) */}
      {settleBalanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header — Remaining Balance + amount (centered) */}
            <div className="flex-shrink-0 w-full min-h-[4rem] bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] px-4 py-3 border-b-2 border-[#4A2F1A] flex items-center justify-center relative">
              <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[#F5DEB3] shrink-0" />
                  <h2 className="text-lg font-bold text-[#F5DEB3]">Remaining Balance</h2>
                </div>
                <div className="inline-flex items-baseline gap-1 rounded-full bg-white/20 px-3 py-1">
                  <span className="text-lg font-bold tabular-nums text-[#F5DEB3]">${settleBalanceModal.remaining.toFixed(2)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettleBalanceModal(null)}
                className="absolute right-4 p-1.5 hover:bg-[#4A2F1A] rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-[#F5DEB3]" />
              </button>
            </div>

            {/* Two columns: Left nav + Right content */}
            <div className="flex flex-1 min-h-0 flex-col md:flex-row">
              {/* Left navigation — like /gifts/create (no Cancel) */}
              <div className="flex-shrink-0 md:w-56 lg:w-60 bg-[#F5F1E8] border-b md:border-b-0 md:border-r border-[#DAA520]/20 p-3 md:p-4 flex flex-col">
                <div className="flex flex-row md:flex-col gap-2 md:gap-3 overflow-x-auto md:overflow-x-visible md:flex-1">
                  {(() => {
                    const rem = settleBalanceModal.remaining
                    const micro = rem < 1
                    const navItems: { id: "gift-card" | "charity" | "support-wishbee" | "settlement-history" | "send-wishbee"; label: string; icon: typeof Gift; desc: string; disabled: boolean }[] = [
                      { id: "send-wishbee", label: "Send Wishbee", icon: Gift, desc: "Close pool & send", disabled: micro },
                      { id: "gift-card", label: "Send Bonus Gift Card", icon: Gift, desc: "Gift card via Reloadly", disabled: micro },
                      { id: "charity", label: "Donate to Charity", icon: Heart, desc: "Choose a cause", disabled: micro },
                      { id: "support-wishbee", label: "Support Wishbee", icon: Sparkles, desc: "Tip the platform", disabled: false },
                      { id: "settlement-history", label: "Settlement History", icon: ScrollText, desc: "View past transactions", disabled: false },
                    ]
                    return navItems.map((item) => {
                      const isCurrent = remainingBalanceView === item.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={item.disabled}
                          onClick={() => !item.disabled && setRemainingBalanceView(item.id)}
                          className={`flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all w-full min-w-[140px] md:min-w-0 text-left ${
                            item.disabled
                              ? "opacity-50 cursor-not-allowed bg-gray-100/80 text-gray-500"
                              : isCurrent
                              ? "bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-white shadow-md"
                              : "bg-white text-[#654321] border-2 border-[#DAA520]/30 hover:border-[#DAA520] hover:bg-[#FFFBEB]/80"
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                            item.disabled ? "bg-gray-200" : isCurrent ? "bg-white/20" : "bg-[#DAA520]/10"
                          }`}>
                            <item.icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-xs font-bold leading-tight">{item.label}</p>
                            <p className={`text-[10px] leading-tight mt-0.5 ${isCurrent ? "text-white/90" : "text-[#8B5A3C]/80"}`}>{item.desc}</p>
                          </div>
                          {isCurrent && <ChevronRight className="w-4 h-4 shrink-0 hidden md:block" />}
                        </button>
                      )
                    })
                  })()}
                </div>
              </div>

              {/* Right content — form/actions for selected option */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-5 bg-gradient-to-br from-[#FEF7ED] via-[#FFF7ED] to-[#FFFBEB]">
                {remainingBalanceView === "send-wishbee" && settleBalanceModal && (
                  <div className="max-w-lg mx-auto">
                    <WishbeeSettlementSummary
                      giftId={String(settleBalanceModal.gift.id)}
                      giftName={settleBalanceModal.gift.name}
                      grossWishbeeFunds={settleBalanceModal.remaining}
                      mainGiftAmount={settleBalanceModal.remaining}
                      recipientName={settleBalanceModal.recipientName}
                      recipientEmail={bonusRecipientEmail}
                      charities={DONATION_CHARITIES}
                      selectedCharityId={selectedCharityId}
                      onSelectedCharityChange={setSelectedCharityId}
                      totalFundsCollected={settleBalanceModal.gift.currentAmount}
                      finalGiftPrice={Math.round((settleBalanceModal.gift.currentAmount - settleBalanceModal.remaining) * 100) / 100}
                      giftCardBrand="Gift Card (via Reloadly)"
                      onSuccess={({ claimUrl, settlement, redeemCode }) => {
                        const amt = (settlement as { amount?: number })?.amount ?? settleBalanceModal!.remaining
                        setGiftCardSuccessModal({
                          claimUrl,
                          amount: amt,
                          recipientName: settleBalanceModal!.recipientName,
                          redeemCode: redeemCode ?? (settlement as { redeemCode?: string })?.redeemCode,
                        })
                        setSettleBalanceModal(null)
                        setBonusRecipientEmail("")
                        toast.success("Wishbee sent! Share the claim link or code with the recipient.")
                      }}
                      onError={(err) => toast.error(err)}
                    />
                  </div>
                )}
                {remainingBalanceView === "settlement-history" && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-[#654321]">Settlement History</h3>
                    <SettlementHistory
                      giftId={settleBalanceModal.gift.id}
                      remainingBalance={settleBalanceModal.remaining}
                    />
                  </div>
                )}

                {remainingBalanceView === "gift-card" && (
                  <div className="max-w-md mx-auto space-y-3">
                    <h3 className="text-sm font-bold text-[#654321]">Send as Bonus Gift Card</h3>
                    <p className="text-xs text-[#8B5A3C]/90">
                      Send ${settleBalanceModal.remaining.toFixed(2)} as a gift card so {settleBalanceModal.recipientName} can pick one more treat.
                    </p>
                    <label className="block text-xs font-medium text-[#654321]">
                      Recipient email (required for delivery)
                    </label>
                    <input
                      type="email"
                      placeholder="recipient@example.com"
                      value={bonusRecipientEmail}
                      onChange={(e) => setBonusRecipientEmail(e.target.value)}
                      className="w-full py-2 px-3 rounded-lg text-xs border-2 border-[#DAA520]/30 bg-white text-[#654321] placeholder:text-[#8B5A3C]/50 focus:border-[#B8860B] focus:ring-1 focus:ring-[#DAA520]/40 outline-none"
                    />
                    <button
                      type="button"
                      disabled={settleWishbeeLoading || !bonusRecipientEmail.trim()}
                      onClick={async () => {
                        const email = bonusRecipientEmail.trim()
                        if (!email) {
                          toast.error("Please enter recipient email")
                          return
                        }
                        const gift = settleBalanceModal.gift
                        setSettleWishbeeLoading(true)
                        try {
                          const res = await fetch(`/api/gifts/${gift.id}/settle-wishbee`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              amount: settleBalanceModal.remaining,
                              recipientEmail: email,
                              recipientName: settleBalanceModal.recipientName,
                              giftName: gift.name,
                              totalFundsCollected: gift.currentAmount,
                              finalGiftPrice: Math.round((gift.currentAmount - settleBalanceModal.remaining) * 100) / 100,
                            }),
                          })
                          const data = await res.json()
                          if (!res.ok) {
                            toast.error(data?.error ?? "Gift card failed. Please try again.")
                            return
                          }
                          setGiftCardSuccessModal({
                            claimUrl: data.claimUrl ?? "#",
                            amount: settleBalanceModal.remaining,
                            recipientName: settleBalanceModal.recipientName,
                            redeemCode: data.redeemCode,
                          })
                          setSettleBalanceModal(null)
                          setBonusRecipientEmail("")
                          toast.success("Gift card created! Share the claim link with the recipient.")
                        } catch {
                          toast.error("Something went wrong. Please try again.")
                        } finally {
                          setSettleWishbeeLoading(false)
                        }
                      }}
                      className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-[#422006] bg-gradient-to-r from-[#DAA520] to-[#F4C430] shadow-sm hover:brightness-105 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-1.5"
                    >
                      <Gift className="w-4 h-4" />
                      {settleWishbeeLoading ? "Sending…" : `Send $${settleBalanceModal.remaining.toFixed(2)} gift card`}
                    </button>
                    <p className="text-[10px] text-[#8B5A3C]/80">Gift card via Reloadly</p>
                  </div>
                )}

                {remainingBalanceView === "charity" && (
                  <div className="max-w-md mx-auto space-y-3">
                    <h3 className="text-sm font-bold text-[#654321]">Donate to a cause</h3>
                    <p className="text-xs text-[#8B5A3C]/90">
                      Select a charity. Donations are processed instantly via our secure partner network.
                    </p>
                    <div className="space-y-1.5">
                      {DONATION_CHARITIES.map((c) => {
                        const CharityIcon = c.icon === "heart" ? Heart : c.icon === "globe" ? Globe : c.icon === "leaf" ? Leaf : Cross
                        const iconColor = c.icon === "heart" ? "text-red-500 fill-red-500" : c.icon === "globe" ? "text-blue-600" : c.icon === "leaf" ? "text-emerald-600" : "text-red-600"
                        const isSelected = selectedCharityId === c.id
                        const logo = (c as { logo?: string }).logo
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setSelectedCharityId(c.id)}
                            className={`w-full flex items-center gap-1.5 py-2 px-2.5 rounded-lg text-left transition-all border-2 ${isSelected ? "border-[#B8860B] bg-[#FFFBEB]" : "border-[#DAA520]/20 bg-white hover:border-[#DAA520]/50"}`}
                          >
                            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0 ring-1 ring-[#DAA520]/25 overflow-hidden">
                              {logo ? <img src={logo} alt="" className="w-full h-full object-contain" /> : <CharityIcon className={`w-3.5 h-3.5 ${iconColor}`} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-[#654321]">{c.name}</p>
                              <p className="text-[10px] text-[#8B4513]/80">{c.description}</p>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-[#B8860B] shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                    {(() => {
                      const charity = DONATION_CHARITIES.find((ch) => ch.id === selectedCharityId)
                      const { netToCharity, totalCharged, fee } = computeDonationAmounts(settleBalanceModal.remaining, coverFees)
                      return (
                        <>
                          <label className="flex items-center gap-2 text-xs text-[#654321] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={coverFees}
                              onChange={(e) => setCoverFees(e.target.checked)}
                              className="rounded border-[#DAA520] text-[#EAB308]"
                            />
                            Cover transaction fees (${fee.toFixed(2)})
                          </label>
                          <p className="text-xs text-[#654321] tabular-nums">
                            The {charity?.name ?? "charity"} will receive exactly ${netToCharity.toFixed(2)}.
                          </p>
                        </>
                      )
                    })()}
                    <button
                      type="button"
                      onClick={async () => {
                        const charity = DONATION_CHARITIES.find((ch) => ch.id === selectedCharityId)
                        if (!charity) return
                        const gift = settleBalanceModal.gift
                        const dedication = `On behalf of the ${gift.name} group via Wishbee.ai`
                        const viewGiftDetailsUrl = typeof window !== "undefined" ? `${window.location.origin}/gifts/${gift.id}` : `/gifts/${gift.id}`
                        const { netToCharity, totalCharged } = computeDonationAmounts(settleBalanceModal.remaining, coverFees)
                        const { receiptUrl, error } = await processImmediateDonation({
                          giftId: gift.id,
                          amount: settleBalanceModal.remaining,
                          netAmount: netToCharity,
                          totalToCharge: totalCharged,
                          charityId: charity.id,
                          charityName: charity.name,
                          coverFees,
                          recipientName: settleBalanceModal.recipientName,
                          giftName: gift.name,
                          totalFundsCollected: gift.currentAmount,
                          finalGiftPrice: Math.round((gift.currentAmount - settleBalanceModal.remaining) * 100) / 100,
                        })
                        if (error) {
                          toast.error(error)
                          return
                        }
                        setDonationConfirmed({
                          amount: settleBalanceModal.remaining,
                          charityName: charity.name,
                          eventName: gift.name,
                          disposition: "charity",
                          dedication,
                          viewGiftDetailsUrl,
                          receiptUrl: receiptUrl ?? undefined,
                          recipientName: settleBalanceModal.recipientName,
                          totalFundsCollected: gift.currentAmount,
                          finalGiftPrice: Math.round((gift.currentAmount - settleBalanceModal.remaining) * 100) / 100,
                        })
                        setSettleBalanceModal(null)
                      }}
                      className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#EAB308] to-[#F4C430] text-[#3B2F0F] shadow-sm hover:brightness-105 transition-all"
                    >
                      {(() => {
                        const { totalCharged } = computeDonationAmounts(settleBalanceModal.remaining, coverFees)
                        return `Donate $${totalCharged.toFixed(2)}`
                      })()}
                    </button>
                  </div>
                )}

                {remainingBalanceView === "support-wishbee" && (
                  <div className="max-w-md mx-auto space-y-3">
                    <h3 className="text-sm font-bold text-[#654321]">Support Wishbee</h3>
                    <p className="text-xs text-[#8B5A3C]/90">
                      Did we do a good job? Tip Wishbee to help us keep our AI tools free and the platform ad-free for everyone.
                    </p>
                    <p className="text-xs text-[#654321]">
                      Your ${settleBalanceModal.remaining.toFixed(2)} will be added as a platform tip.
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        const gift = settleBalanceModal.gift
                        const receiptUrl = await saveTipSettlement({
                          giftId: gift.id,
                          amount: settleBalanceModal.remaining,
                          recipientName: settleBalanceModal.recipientName,
                          giftName: gift.name,
                          totalFundsCollected: gift.currentAmount,
                          finalGiftPrice: Math.round((gift.currentAmount - settleBalanceModal.remaining) * 100) / 100,
                        })
                        setTipThankYouGift({
                          gift,
                          remaining: settleBalanceModal.remaining,
                          recipientName: settleBalanceModal.recipientName,
                          receiptUrl: receiptUrl ?? undefined,
                        })
                        setSettleBalanceModal(null)
                        if (receiptUrl) {
                          try {
                            const sessionRes = await fetch("/api/auth/session").catch(() => null)
                            const session = sessionRes?.ok ? await sessionRes.json() : null
                            const to = session?.user?.email ? [{ email: session.user.email, name: session.user.name }] : []
                            if (to.length > 0) {
                              const res = await fetch("/api/gifts/transparency-email", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  eventData: {
                                    recipientName: settleBalanceModal.recipientName,
                                    totalFundsCollected: gift.currentAmount,
                                    finalGiftPrice: Math.round((gift.currentAmount - settleBalanceModal.remaining) * 100) / 100,
                                    remainingBalance: settleBalanceModal.remaining,
                                    disposition: "tip" as const,
                                    viewGiftDetailsUrl: typeof window !== "undefined" ? `${window.location.origin}/gifts/${gift.id}` : `/gifts/${gift.id}`,
                                  },
                                  to,
                                }),
                              })
                              if (res.ok) toast.success("Tip receipt sent to your email")
                            }
                          } catch {
                            // non-blocking
                          }
                        }
                      }}
                      className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#EAB308] to-[#F4C430] text-[#3B2F0F] shadow-sm hover:brightness-105 flex items-center justify-center gap-1.5"
                    >
                      <span className="text-base" aria-hidden>🐝</span>
                      Tip Wishbee ${settleBalanceModal.remaining.toFixed(2)}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 w-full h-10 bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] border-t-2 border-[#4A2F1A]" />
          </div>
        </div>
      )}

      {/* Gift card success — claim URL and optional redeem code (Reloadly) */}
      {giftCardSuccessModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="flex-shrink-0 w-full min-h-[4rem] bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] px-4 py-3 border-b-2 border-[#4A2F1A] flex items-center justify-center relative">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#F5DEB3] shrink-0" />
                <h2 className="text-base font-bold text-[#F5DEB3]">Gift card sent</h2>
              </div>
              <button
                type="button"
                onClick={() => setGiftCardSuccessModal(null)}
                className="absolute right-4 p-1.5 hover:bg-[#4A2F1A] rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-[#F5DEB3]" />
              </button>
            </div>
            <div className="p-5 space-y-4 bg-gradient-to-br from-[#FEF7ED] via-[#FFF7ED] to-[#FFFBEB]">
              <p className="text-sm text-[#654321] leading-relaxed">
                A ${giftCardSuccessModal.amount.toFixed(2)} gift card is ready for {giftCardSuccessModal.recipientName}. Share the link below or open it to claim.
              </p>
              {giftCardSuccessModal.redeemCode && (
                <p className="text-sm font-mono font-semibold text-[#654321] bg-[#F5F1E8] rounded-lg py-2 px-3 text-center">
                  Code: {giftCardSuccessModal.redeemCode}
                </p>
              )}
              <a
                href={giftCardSuccessModal.claimUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-lg text-sm font-bold bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] shadow-md hover:brightness-105 flex items-center justify-center gap-2 border-2 border-[#B8860B]/50"
              >
                <Gift className="w-5 h-5" />
                Claim your gift card
              </a>
              <p className="text-[10px] text-[#8B5A3C]/80 text-center">Gift card via Reloadly</p>
            </div>
            <div className="flex-shrink-0 w-full h-10 bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] border-t-2 border-[#4A2F1A]" />
          </div>
        </div>
      )}

      {/* Amazon Gift Card instructions modal — shown in front before opening Amazon (Home header/footer, Wishbee button) */}
      {amazonGiftCardModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            {/* Header — same as Home page header */}
            <div className="flex-shrink-0 w-full min-h-[4rem] bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] px-4 py-3 border-b-2 border-[#4A2F1A] flex items-center justify-center relative">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#F5DEB3] shrink-0" />
                <h2 className="text-base font-bold text-[#F5DEB3]">Amazon eGift Card</h2>
              </div>
              <button
                type="button"
                onClick={() => setAmazonGiftCardModal(null)}
                className="absolute right-4 p-1.5 hover:bg-[#4A2F1A] rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-[#F5DEB3]" />
              </button>
            </div>
            {/* Body — warm gradient */}
            <div className="p-5 space-y-4 bg-gradient-to-br from-[#FEF7ED] via-[#FFF7ED] to-[#FFFBEB]">
              <p className="text-sm text-[#654321] leading-relaxed">
                Click the <strong>custom amount</strong> field on the Amazon page and enter{" "}
                <span className="inline-flex items-baseline gap-0.5 rounded-md bg-[#FFFBEB] px-2 py-0.5 font-bold tabular-nums text-[#8B6914] ring-1 ring-[#DAA520]/40">
                  ${amazonGiftCardModal.amount.toFixed(2)}
                </span>
              </p>
              <button
                type="button"
                onClick={handleOpenAmazonAndCloseModal}
                className="w-fit min-w-[120px] mx-auto py-2 px-4 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] shadow-md hover:brightness-105 flex items-center justify-center gap-1.5"
              >
                <Gift className="w-3.5 h-3.5" />
                Open Amazon
              </button>
            </div>
            {/* Footer — same as Home page footer */}
            <div className="flex-shrink-0 w-full h-10 bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] border-t-2 border-[#4A2F1A]" />
          </div>
        </div>
      )}

      {/* Donate to Charity (from Settle Balance) — charity picker — Home header/footer */}
      {donateFromSettle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header — H1: modal title, increased height */}
            <div className="flex-shrink-0 w-full min-h-[5rem] bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] px-4 py-4 border-b-2 border-[#4A2F1A] flex items-center justify-center relative">
              <h1 className="text-xl font-bold tracking-tight text-[#F5DEB3] flex items-center gap-2">
                <Wallet className="w-5 h-5 shrink-0" />
                Remaining Balance
              </h1>
              <button
                type="button"
                onClick={() => setDonateFromSettle(null)}
                className="absolute right-4 p-1.5 hover:bg-[#4A2F1A] rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-[#F5DEB3]" />
              </button>
            </div>
            {/* Body — warm gradient, no outer scroll; only charity list scrolls */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden p-5 bg-gradient-to-br from-[#FEF7ED] via-[#FFF7ED] to-[#FFFBEB]">
              <div className="flex-shrink-0 text-center mb-4">
                <div className="inline-flex items-baseline gap-2 rounded-full bg-white/90 px-4 py-2 shadow-sm ring-1 ring-[#DAA520]/25">
                  <h3 className="text-sm font-semibold tracking-tight text-[#8B5A3C]">Amount to donate</h3>
                  <span className="text-base font-bold tabular-nums tracking-tight text-[#654321]">${donateFromSettle.amount.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-center text-sm text-[#8B5A3C]/80 leading-relaxed mb-4 flex-shrink-0">
                Select a charity to donate your remaining balance. Donations are processed instantly via our secure partner network.
              </p>
              {/* Charity list — compact layout */}
              <div className="flex-1 min-h-0 space-y-1.5 overflow-y-auto">
                {DONATION_CHARITIES.map((c) => {
                  const CharityIcon = c.icon === "heart" ? Heart : c.icon === "globe" ? Globe : c.icon === "leaf" ? Leaf : Cross
                  const iconColor = c.icon === "heart" ? "text-red-500 fill-red-500" : c.icon === "globe" ? "text-blue-600" : c.icon === "leaf" ? "text-emerald-600" : "text-red-600"
                  const isSelected = selectedCharityId === c.id
                  const logo = (c as { logo?: string }).logo
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCharityId(c.id)}
                      className={`w-full flex items-center gap-2 py-2 px-2.5 rounded-lg text-left transition-all duration-200 border-2 shadow-sm active:scale-[0.99] ${isSelected ? "border-[#B8860B] bg-[#FFFBEB] shadow-[0_0_0_1px_rgba(184,134,11,0.3)]" : "border-[#DAA520]/20 bg-white hover:border-[#DAA520]/50 hover:bg-[#FFFBEB]/60"}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 ring-1 ring-[#DAA520]/25 overflow-hidden">
                        {logo ? (
                          <img src={logo} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <CharityIcon className={`w-4 h-4 shrink-0 ${iconColor}`} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs font-semibold tracking-tight text-[#654321] leading-tight">{c.name}</h3>
                        <p className="text-[11px] text-[#8B4513]/80 mt-0.5 leading-snug line-clamp-2">{c.description}</p>
                      </div>
                      <div className="flex-shrink-0 w-4 h-4 rounded-full border-2 border-[#654321]/50 flex items-center justify-center">
                        {isSelected && <div className="w-2 h-2 rounded-full bg-[#654321]" />}
                      </div>
                    </button>
                  )
                })}
              </div>
              {(() => {
                const charity = DONATION_CHARITIES.find((ch) => ch.id === selectedCharityId)
                const { netToCharity, totalCharged, fee } = computeDonationAmounts(donateFromSettle.amount, coverFees)
                return (
                  <>
                    <label className="flex items-center gap-2 text-xs text-[#654321] cursor-pointer mt-3">
                      <input
                        type="checkbox"
                        checked={coverFees}
                        onChange={(e) => setCoverFees(e.target.checked)}
                        className="rounded border-[#DAA520] text-[#EAB308]"
                      />
                      Cover transaction fees (${fee.toFixed(2)})
                    </label>
                    <p className="text-xs text-[#654321] tabular-nums mt-1">
                      The {charity?.name ?? "charity"} will receive exactly ${netToCharity.toFixed(2)}.
                    </p>
                  </>
                )
              })()}
              <div className="mt-4 flex-shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    const charity = DONATION_CHARITIES.find((ch) => ch.id === selectedCharityId)
                    if (charity) {
                      const dedication = `On behalf of the ${donateFromSettle.giftName} group via Wishbee.ai`
                      const viewGiftDetailsUrl = typeof window !== "undefined" ? `${window.location.origin}/gifts/${donateFromSettle.giftId}` : `/gifts/${donateFromSettle.giftId}`
                      const { netToCharity, totalCharged } = computeDonationAmounts(donateFromSettle.amount, coverFees)
                      const { receiptUrl, error } = await processImmediateDonation({
                        giftId: donateFromSettle.giftId,
                        amount: donateFromSettle.amount,
                        netAmount: netToCharity,
                        totalToCharge: totalCharged,
                        charityId: charity.id,
                        charityName: charity.name,
                        coverFees,
                        recipientName: donateFromSettle.recipientName,
                        giftName: donateFromSettle.giftName,
                        totalFundsCollected: donateFromSettle.totalFundsCollected,
                        finalGiftPrice: donateFromSettle.finalGiftPrice,
                      })
                      if (error) {
                        toast.error(error)
                        return
                      }
                      setDonationConfirmed({
                        amount: donateFromSettle.amount,
                        charityName: charity.name,
                        eventName: donateFromSettle.giftName,
                        disposition: "charity",
                        dedication,
                        viewGiftDetailsUrl,
                        receiptUrl: receiptUrl ?? undefined,
                        recipientName: donateFromSettle.recipientName,
                        totalFundsCollected: donateFromSettle.totalFundsCollected,
                        finalGiftPrice: donateFromSettle.finalGiftPrice,
                      })
                      setDonateFromSettle(null)
                    }
                  }}
                  className="w-full py-2 px-3 rounded-lg text-xs font-semibold tracking-tight text-[#422006] bg-[#FDE68A] border-2 border-[#654321]/60 hover:bg-[#FCD34D] hover:border-[#654321]/80 hover:shadow-md active:scale-[0.99] transition-all"
                >
                  {(() => {
                    const { totalCharged } = computeDonationAmounts(donateFromSettle.amount, coverFees)
                    return `Donate $${totalCharged.toFixed(2)}`
                  })()}
                </button>
              </div>
            </div>
            {/* Footer — same as Home page footer (brown gradient) */}
            <div className="flex-shrink-0 w-full h-10 bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] border-t-2 border-[#4A2F1A]" />
          </div>
        </div>
      )}

      {/* Thank You for Support Wishbee (tip) — includes Done → sendTransparencyEmail + View Tip Receipt */}
      {tipThankYouGift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-[#EAB308]/30 p-6 text-center">
            <p className="text-2xl mb-2" aria-hidden>🐝</p>
            <h3 className="text-lg font-bold text-[#654321]">Thank you for supporting Wishbee!</h3>
            <p className="text-sm text-[#8B4513]/80 mt-2">
              Thank you! Your tip of <span className="font-bold text-[#654321]">${tipThankYouGift.remaining.toFixed(2)}</span> has been added to the Wishbee development fund to help keep our AI free.
            </p>
            <div className="mt-4 space-y-3">
              <a
                href={tipThankYouGift.receiptUrl || (typeof window !== "undefined" ? `${window.location.origin}/gifts/${tipThankYouGift.gift.id}` : `/gifts/${tipThankYouGift.gift.id}`)}
                target={tipThankYouGift.receiptUrl ? "_blank" : undefined}
                rel={tipThankYouGift.receiptUrl ? "noopener noreferrer" : undefined}
                className="text-sm font-semibold text-[#B8860B] hover:text-[#8B5A3C] underline underline-offset-2 transition-colors inline-block"
              >
                View Tip Receipt
              </a>
              <button
                type="button"
                onClick={async () => {
                  const viewGiftDetailsUrl = typeof window !== "undefined" ? `${window.location.origin}/gifts/${tipThankYouGift!.gift.id}` : `/gifts/${tipThankYouGift!.gift.id}`
                  const eventData = {
                    recipientName: tipThankYouGift!.recipientName,
                    totalFundsCollected: tipThankYouGift!.gift.currentAmount,
                    finalGiftPrice: Math.round((tipThankYouGift!.gift.currentAmount - tipThankYouGift!.remaining) * 100) / 100,
                    remainingBalance: tipThankYouGift!.remaining,
                    disposition: "tip" as const,
                    viewGiftDetailsUrl,
                  }
                  try {
                    const sessionRes = await fetch("/api/auth/session").catch(() => null)
                    const session = sessionRes?.ok ? await sessionRes.json() : null
                    const to = session?.user?.email ? [{ email: session.user.email, name: session.user.name }] : []
                    if (to.length > 0) {
                      const res = await fetch("/api/gifts/transparency-email", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ eventData, to }),
                      })
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}))
                        toast.error(err.error || "Could not send receipt email")
                      } else toast.success("Receipt sent to your email")
                    }
                  } catch (e) {
                    toast.error("Could not send receipt email")
                  }
                  setTipThankYouGift(null)
                }}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white"
                style={{ backgroundColor: "#EAB308" }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gift Purchased Successfully — Case A (remaining > $5) — header/footer match Choose Your Preferred Options */}
      {purchaseModal && purchaseModal.remaining > 5 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            {/* Header — brown bar with logo + title */}
            <div className="w-full h-[80px] bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] px-4 border-b-2 border-[#4A2F1A] flex items-center justify-center relative">
              <h3 className="text-[18px] font-bold text-[#F5DEB3] flex items-center gap-2">
                <img src="/images/LogoBee-V1.png" alt="" width={48} height={48} className="h-12 w-12 object-contain flex-shrink-0" />
                Gift Purchased Successfully!
              </h3>
              <button
                onClick={() => setPurchaseModal(null)}
                className="absolute right-4 p-1.5 hover:bg-[#4A2F1A] rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-[18px] h-[18px] text-[#F5DEB3]" />
              </button>
            </div>

            {/* Body — warm gradient same as Choose Your Preferred Options */}
            <div className="p-5 overflow-y-auto max-h-[70vh] bg-gradient-to-br from-[#FEF7ED] via-[#FFF7ED] to-[#FFFBEB] space-y-5">
              {/* Financial Summary — Remaining = Total Collected − Gift Total (always consistent) */}
              {(() => {
                const collected = purchaseModal.gift.currentAmount
                const giftTotal = purchaseModal.productTotal
                const remainingBalance = Math.max(0, Math.round((collected - giftTotal) * 100) / 100)
                return (
                  <>
              <div>
                <h3 className="text-sm font-bold text-[#654321] mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                  </span>
                  Financial Summary
                </h3>
                <div className="space-y-2 text-sm text-[#8B4513]">
                  <div className="flex justify-between items-center gap-2">
                    <span className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <Gift className="w-4 h-4 text-amber-600" />
                      </span>
                      Gift Total (with Tax/Shipping):
                    </span>
                    <span className="font-medium text-[#654321]">${giftTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Target className="w-4 h-4 text-emerald-600" />
                      </span>
                      Total Funds Collected:
                    </span>
                    <span className="font-medium text-[#654321]">${collected.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-[#DAA520]" />
                      </span>
                      Remaining Balance:
                    </span>
                    <span className="font-bold text-[#DAA520]">${remainingBalance.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* A Little Something Extra — only when there is remaining balance */}
              {remainingBalance > 0 && (
              <div>
                <h3 className="text-sm font-bold text-[#654321] flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center flex-shrink-0">
                    <Gift className="w-4 h-4 text-amber-700" />
                  </span>
                  A Little Something Extra for {purchaseModal.recipientName}
                </h3>
                <p className="text-sm text-[#8B4513] leading-relaxed">
                  Because your group was so generous, there is ${remainingBalance.toFixed(2)} remaining! You can send it as an Amazon eGift Card so {purchaseModal.recipientName} can pick out one more treat when you’re ready.
                </p>
              </div>
              )}

              {/* Primary actions */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => { setPurchaseModal(null); router.push(`/gifts/${purchaseModal.gift.id}`); }}
                  className="w-full py-2 text-sm font-semibold bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-lg hover:shadow-md transition-all"
                >
                  View Gift Details
                </button>
                {remainingBalance > 0 && (
                  <>
                <p className="text-[10px] text-[#8B4513]/80 text-center">
                  Optional: send the ${remainingBalance.toFixed(2)} bonus as an eGift Card from Amazon when you’re ready.
                </p>
                <button
                  onClick={() => handleSendAmazonGiftCard(remainingBalance)}
                  className="w-full py-2 rounded-lg text-sm font-medium text-[#654321] border border-[#DAA520]/50 bg-white hover:bg-amber-50/80 transition-all flex items-center justify-center gap-1.5"
                >
                  <ShoppingCart className="w-4 h-4 text-orange-500" />
                  {`Open Amazon to send bonus ($${remainingBalance.toFixed(2)})`}
                </button>
                  </>
                )}
              </div>
                  </>
                );
              })()}
            </div>

            {/* Footer — same as Add to Wishlist / Choose Your Preferred Options */}
            <div className="w-full h-[50px] bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] border-t-2 border-[#4A2F1A]" />
          </div>
        </div>
      )}

      {/* Small Balance, Big Impact — Case B (remaining ≤ $5) */}
      {purchaseModal && purchaseModal.remaining <= 5 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 flex items-center justify-between border-b border-[#DAA520]/20">
              <div className="flex items-center gap-2">
                <Heart className="w-6 h-6 text-[#DAA520]" />
                <h3 className="text-lg font-bold text-[#654321]">✔ Small Balance, Big Impact</h3>
              </div>
              <button
                onClick={() => { setPurchaseModal(null); setDonationCharity(null); }}
                className="w-8 h-8 rounded-full bg-[#F5F1E8] hover:bg-[#EDE9E0] flex items-center justify-center text-[#654321]"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-[#8B4513]">
                There is ${purchaseModal.remaining.toFixed(2)} remaining after the gift purchase. Choose a cause to donate it to:
              </p>
              <div className="space-y-2">
                {DONATION_CHARITIES.map((c) => (
                  <label
                    key={c.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${donationCharity === c.id ? "border-[#DAA520] bg-amber-50/50" : "border-[#DAA520]/20 hover:border-[#DAA520]/40"}`}
                  >
                    <input
                      type="radio"
                      name="donation-charity"
                      checked={donationCharity === c.id}
                      onChange={() => setDonationCharity(c.id)}
                      className="mt-1 text-[#DAA520]"
                    />
                    <div>
                      <p className="font-medium text-[#654321]">{c.name}</p>
                      <p className="text-xs text-[#8B4513]/80">{c.description}</p>
                    </div>
                  </label>
                ))}
              </div>
              {(() => {
                const charity = DONATION_CHARITIES.find((c) => c.id === donationCharity)
                const { netToCharity, totalCharged, fee } = computeDonationAmounts(purchaseModal.remaining, coverFees)
                return (
                  <>
                    <label className="flex items-center gap-2 text-sm text-[#654321] cursor-pointer mt-2">
                      <input
                        type="checkbox"
                        checked={coverFees}
                        onChange={(e) => setCoverFees(e.target.checked)}
                        className="rounded border-[#DAA520] text-[#EAB308]"
                      />
                      Cover transaction fees (${fee.toFixed(2)})
                    </label>
                    <p className="text-xs text-[#654321] tabular-nums mt-1">
                      The {charity?.name ?? "charity"} will receive exactly ${netToCharity.toFixed(2)}.
                    </p>
                  </>
                )
              })()}
              <button
                onClick={async () => {
                  if (!donationCharity) { toast.error("Please select a cause"); return }
                  const charity = DONATION_CHARITIES.find((c) => c.id === donationCharity)
                  const dedication = `On behalf of the ${purchaseModal.gift.name} group via Wishbee.ai`
                  const viewGiftDetailsUrl = typeof window !== "undefined" ? `${window.location.origin}/gifts/${purchaseModal.gift.id}` : `/gifts/${purchaseModal.gift.id}`
                  const { netToCharity, totalCharged } = computeDonationAmounts(purchaseModal.remaining, coverFees)
                  const { receiptUrl, error } = await processImmediateDonation({
                    giftId: purchaseModal.gift.id,
                    amount: purchaseModal.remaining,
                    netAmount: netToCharity,
                    totalToCharge: totalCharged,
                    charityId: donationCharity || "feeding-america",
                    charityName: charity?.name ?? "the chosen cause",
                    coverFees,
                    recipientName: purchaseModal.recipientName,
                    giftName: purchaseModal.gift.name,
                    totalFundsCollected: purchaseModal.gift.currentAmount,
                    finalGiftPrice: purchaseModal.productTotal,
                  })
                  if (error) {
                    toast.error(error)
                    return
                  }
                  setDonationConfirmed({
                    amount: purchaseModal.remaining,
                    charityName: charity?.name ?? "the chosen cause",
                    eventName: purchaseModal.gift.name,
                    disposition: "charity",
                    dedication,
                    viewGiftDetailsUrl,
                    receiptUrl: receiptUrl ?? undefined,
                    recipientName: purchaseModal.recipientName,
                    totalFundsCollected: purchaseModal.gift.currentAmount,
                    finalGiftPrice: purchaseModal.productTotal,
                  })
                  setPurchaseModal(null)
                  setDonationCharity(null)
                }}
                disabled={!donationCharity}
                className="w-full py-3 mt-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] font-semibold rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {donationCharity
                  ? `Donate $${computeDonationAmounts(purchaseModal.remaining, coverFees).totalCharged.toFixed(2)}`
                  : "Confirm Donation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Donation Confirmation — Success */}
      {donationConfirmed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            {/* Header — same as Home page (brown gradient) */}
            <div className="flex-shrink-0 w-full min-h-[5rem] bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] px-4 py-4 border-b-2 border-[#4A2F1A] flex items-center justify-center relative">
              <h2 className="text-xl font-bold tracking-tight text-[#F5DEB3] flex items-center gap-2">
                <span className="text-2xl" aria-hidden>🎉</span>
                Success!
              </h2>
              <button
                type="button"
                onClick={() => setDonationConfirmed(null)}
                className="absolute right-4 p-1.5 hover:bg-[#4A2F1A] rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-[#F5DEB3]" />
              </button>
            </div>
            {/* Body — warm gradient, clear typography */}
            <div className="flex-1 p-6 bg-gradient-to-br from-[#FEF7ED] via-[#FFF7ED] to-[#FFFBEB] text-center">
              <p className="text-base text-[#654321] leading-relaxed mb-2">
                Transaction Successful! ${donationConfirmed.amount.toFixed(2)} has been sent to{" "}
                <span className="font-semibold">{donationConfirmed.charityName}</span>
                {" "}via Wishbee.ai. Check your email for your official receipt! 🎁
              </p>
              <p className="text-xs text-[#8B5A3C]/80 mb-5">
                Donations are processed instantly via our secure partner network.
              </p>
              <div className="space-y-3">
                <a
                  href={donationConfirmed.receiptUrl || donationConfirmed.viewGiftDetailsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-[#B8860B] hover:text-[#8B5A3C] underline underline-offset-2 transition-colors inline-block"
                >
                  View Donation Receipt
                </a>
                <button
                  type="button"
                  onClick={() => setDonationConfirmed(null)}
                  className="block w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-[#654321] bg-white border-2 border-[#DAA520]/50 hover:bg-[#FFFBEB] hover:border-[#DAA520] transition-all"
                >
                  Done
                </button>
              </div>
            </div>
            {/* Footer — same as Home page (brown gradient) */}
            <div className="flex-shrink-0 w-full h-10 bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] border-t-2 border-[#4A2F1A]" />
          </div>
        </div>
      )}
    </div>
  )
}

export default function ActiveGiftsPage() {
  const mounted = useClientOnly()
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-[#DAA520] border-t-transparent rounded-full" />
      </div>
    )
  }
  return <ActiveGiftsPageContent />
}
