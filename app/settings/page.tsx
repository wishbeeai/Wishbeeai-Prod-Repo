"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  Bell,
  Lock,
  CreditCard,
  Shield,
  Eye,
  EyeOff,
  User,
  Sparkles,
  Save,
  Brain,
  Loader2,
  Settings,
  ChevronDown,
} from "lucide-react"
import { TwoFactorEnrollDialog, unenrollTwoFactor } from "@/components/settings/two-factor-enroll-dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [aiRecommendations, setAiRecommendations] = useState<
    Array<{
      title: string
      description: string
      priority: string
      category: string
    }>
  >([])

  // Account Settings (loaded from profile; same data as Profile page)
  const [accountSettings, setAccountSettings] = useState({
    username: "",
    email: "",
    phone: "",
    displayName: "",
  })

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    giftReminders: true,
    contributionUpdates: true,
    groupInvites: true,
    weeklyDigest: false,
    marketingEmails: false,
  })

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "friends", // public, friends, private
    showContributions: true,
    showWishlist: true,
    allowFriendRequests: true,
  })

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorAuth: false,
  })
  const [show2FAEnrollDialog, setShow2FAEnrollDialog] = useState(false)
  const [show2FADisableConfirm, setShow2FADisableConfirm] = useState(false)
  const [disabling2FA, setDisabling2FA] = useState(false)

  // Expand/collapse state for right-side sections (all collapsed by default)
  const [sectionOpen, setSectionOpen] = useState<Record<string, boolean>>({
    account: false,
    notifications: false,
    privacy: false,
    security: false,
    ai: false,
    payment: false,
  })
  const toggleSection = (id: string) =>
    setSectionOpen((prev) => ({ ...prev, [id]: !prev[id] }))

  // AI Preferences
  const [aiPreferences, setAiPreferences] = useState({
    aiSuggestions: true,
    autoExtract: true,
    smartRecommendations: true,
    personalizedInsights: true,
  })

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    defaultPaymentMethod: "credit-card",
    savePaymentInfo: true,
    currency: "USD",
  })

  useEffect(() => {
    const loadAllSettings = async () => {
      try {
        // Load account settings
        const accountRes = await fetch("/api/settings/account")
        if (accountRes.ok) {
          const accountData = await accountRes.json()
          setAccountSettings(accountData)
        }

        // Load notification settings
        const notificationRes = await fetch("/api/settings/notifications")
        if (notificationRes.ok) {
          const notificationData = await notificationRes.json()
          setNotificationSettings(notificationData)
        }

        // Load privacy settings
        const privacyRes = await fetch("/api/settings/privacy")
        if (privacyRes.ok) {
          const privacyData = await privacyRes.json()
          setPrivacySettings(privacyData)
        }

        // Load AI preferences
        const aiRes = await fetch("/api/settings/ai-preferences")
        if (aiRes.ok) {
          const aiData = await aiRes.json()
          setAiPreferences(aiData)
        }

        // Load payment settings
        const paymentRes = await fetch("/api/settings/payment")
        if (paymentRes.ok) {
          const paymentData = await paymentRes.json()
          setPaymentSettings(paymentData)
        }

        // Load security settings (includes 2FA status from Supabase MFA)
        const securityRes = await fetch("/api/settings/security")
        if (securityRes.ok) {
          const securityData = await securityRes.json()
          setSecuritySettings((prev) => ({ ...prev, twoFactorAuth: !!securityData.twoFactorAuth }))
        }
      } catch (error) {
        console.error("[v0] Error loading settings:", error)
      }
    }

    loadAllSettings()
  }, [])

  const handleSaveSettings = async (section: string) => {
    setIsSaving(true)

    try {
      let endpoint = ""
      let data = {}

      switch (section) {
        case "account":
          endpoint = "/api/settings/account"
          data = accountSettings
          break
        case "notification":
          endpoint = "/api/settings/notifications"
          data = notificationSettings
          break
        case "privacy":
          endpoint = "/api/settings/privacy"
          data = privacySettings
          break
        case "security":
          endpoint = "/api/settings/security"
          data = securitySettings
          break
        case "AI":
          endpoint = "/api/settings/ai-preferences"
          data = aiPreferences
          break
        case "payment":
          endpoint = "/api/settings/payment"
          data = paymentSettings
          break
        default:
          throw new Error("Invalid section")
      }

      console.log(`[v0] Saving ${section} settings:`, data)

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        const msg = typeof result?.error === "string" ? result.error : "Failed to save settings"
        throw new Error(msg)
      }

      console.log("[v0] Settings saved successfully:", result)

      toast({
        title: "Settings saved",
        description: `Your ${section} settings have been updated successfully.`,
      })
      if (section === "security") {
        setSecuritySettings((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }))
      }
    } catch (error) {
      console.error("[v0] Error saving settings:", error)
      const msg = error instanceof Error ? error.message : "Failed to save settings. Please try again."
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleGetAIRecommendations = async () => {
    setIsGeneratingAI(true)

    try {
      console.log("[v0] Requesting AI recommendations...")

      const response = await fetch("/api/settings/ai-recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountSettings,
          notificationSettings,
          privacySettings,
          securitySettings,
          aiPreferences,
        }),
      })

      const data = await response.json().catch(() => ({}))
      console.log("[v0] Received AI recommendations:", data)

      if (!response.ok) {
        const msg = typeof data?.error === "string" ? data.error : "Failed to get AI recommendations"
        toast({
          title: "Error",
          description: msg,
          variant: "destructive",
        })
        return
      }

      if (data.recommendations && data.recommendations.length > 0) {
        setAiRecommendations(data.recommendations)

        // Show first recommendation in toast
        const topRecommendation = data.recommendations[0]
        toast({
          title: `AI Recommendation: ${topRecommendation.title}`,
          description: topRecommendation.description,
          duration: 5000,
        })

        // Show additional recommendations
        if (data.recommendations.length > 1) {
          setTimeout(() => {
            toast({
              title: "More Recommendations Available",
              description: `${data.recommendations.length - 1} more recommendations. Scroll down to view all.`,
              duration: 5000,
            })
          }, 1000)
        }
      }
    } catch (error) {
      console.error("[v0] Error getting AI recommendations:", error)
      toast({
        title: "Error",
        description: "Failed to generate AI recommendations. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingAI(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors text-[10px] sm:text-sm"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>Back to Profile</span>
        </Link>

        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
            <Settings className="w-5 h-5 sm:w-8 sm:h-8 text-[#654321]" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#654321]">Settings</h1>
          </div>
          <p className="text-[10px] sm:text-sm md:text-base text-muted-foreground">
            Manage your account preferences and settings
          </p>
        </div>

        {/* AI Settings Optimizer */}
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 rounded-xl p-3 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm sm:text-xl font-bold text-[#654321] truncate">AI Settings Optimizer</h2>
                <p className="text-[10px] sm:text-sm text-[#8B4513]/70 line-clamp-1 sm:line-clamp-none">
                  Get personalized recommendations for your settings
                </p>
              </div>
            </div>
            <button
              onClick={handleGetAIRecommendations}
              disabled={isGeneratingAI}
              className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-4 sm:py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white rounded-lg text-[9px] sm:text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50 w-full sm:w-auto justify-center whitespace-nowrap"
            >
              {isGeneratingAI ? (
                <>
                  <Loader2 className="w-2.5 h-2.5 sm:w-4 sm:h-4 animate-spin" />
                  <span className="hidden xs:inline">Analyzing...</span>
                  <span className="xs:hidden">...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                  <span>Get AI Recommendations</span>
                </>
              )}
            </button>
          </div>

          {aiRecommendations.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-[#654321] mb-3">
                Your Personalized Recommendations ({aiRecommendations.length})
              </h3>
              {aiRecommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-3 sm:p-4 border border-[#F4C430]/20 hover:border-[#F4C430] transition-colors"
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div
                      className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-base ${
                        recommendation.priority === "high"
                          ? "bg-red-100 text-red-600"
                          : recommendation.priority === "medium"
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-green-100 text-green-600"
                      }`}
                    >
                      {recommendation.priority === "high" ? "!" : recommendation.priority === "medium" ? "•" : "✓"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-[#654321] text-[11px] sm:text-sm md:text-base">
                          {recommendation.title}
                        </h4>
                        <span className="text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-[#F4C430]/20 text-[#8B4513] rounded-full">
                          {recommendation.category}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-sm text-[#8B4513]/70">{recommendation.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 p-3 sm:p-4 sticky top-4">
              <nav className="space-y-1 sm:space-y-2">
                <a
                  href="#account"
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-[#F5F1E8] transition-colors"
                >
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#DAA520]" />
                  <span className="font-medium text-[#654321] text-[11px] sm:text-sm md:text-base">Account</span>
                </a>
                <a
                  href="#notifications"
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-[#F5F1E8] transition-colors"
                >
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
                    <Bell className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                  </div>
                  <span className="font-medium text-[#654321] text-[11px] sm:text-sm md:text-base">Notifications</span>
                </a>
                <a
                  href="#privacy"
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-[#F5F1E8] transition-colors"
                >
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  <span className="font-medium text-[#654321] text-[11px] sm:text-sm md:text-base">Privacy</span>
                </a>
                <a
                  href="#security"
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-[#F5F1E8] transition-colors"
                >
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
                  <span className="font-medium text-[#654321] text-[11px] sm:text-sm md:text-base">Security</span>
                </a>
                <a
                  href="#ai"
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-[#F5F1E8] transition-colors"
                >
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center">
                    <Sparkles className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <span className="font-medium text-[#654321] text-[11px] sm:text-sm md:text-base">AI Preferences</span>
                </a>
                <a
                  href="#payment"
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-[#F5F1E8] transition-colors"
                >
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                    <CreditCard className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                  </div>
                  <span className="font-medium text-[#654321] text-[11px] sm:text-sm md:text-base">Payment</span>
                </a>
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Settings */}
            <Collapsible
              open={sectionOpen.account}
              onOpenChange={() => toggleSection("account")}
            >
              <div id="account" className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 overflow-hidden">
                <CollapsibleTrigger className="w-full p-4 sm:p-6 flex items-center justify-between gap-2 hover:bg-[#F5F1E8]/50 transition-colors text-left">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#654321] flex items-center gap-2">
                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-[#DAA520]" />
                    Account Information
                  </h2>
                  <ChevronDown
                    className={`w-5 h-5 text-[#8B4513] shrink-0 transition-transform duration-200 ${sectionOpen.account ? "rotate-180" : ""}`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0 space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-[11px] sm:text-sm font-medium text-[#654321] mb-2">Username</label>
                  <input
                    type="text"
                    value={accountSettings.username}
                    onChange={(e) => setAccountSettings({ ...accountSettings, username: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 border-2 border-[#DAA520]/30 rounded-lg focus:outline-none focus:border-[#DAA520] text-[11px] sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-sm font-medium text-[#654321] mb-2">Display Name</label>
                  <input
                    type="text"
                    value={accountSettings.displayName}
                    onChange={(e) => setAccountSettings({ ...accountSettings, displayName: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 border-2 border-[#DAA520]/30 rounded-lg focus:outline-none focus:border-[#DAA520] text-[11px] sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-sm font-medium text-[#654321] mb-2">Email</label>
                  <input
                    type="email"
                    value={accountSettings.email}
                    onChange={(e) => setAccountSettings({ ...accountSettings, email: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 border-2 border-[#DAA520]/30 rounded-lg focus:outline-none focus:border-[#DAA520] text-[11px] sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-sm font-medium text-[#654321] mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={accountSettings.phone}
                    onChange={(e) => setAccountSettings({ ...accountSettings, phone: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 border-2 border-[#DAA520]/30 rounded-lg focus:outline-none focus:border-[#DAA520] text-[11px] sm:text-sm"
                  />
                </div>
                <button
                  onClick={() => handleSaveSettings("account")}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-6 sm:py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-lg text-[10px] sm:text-sm md:text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50 w-full sm:w-auto mx-auto"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-2.5 h-2.5 sm:w-4 sm:h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Notifications */}
            <Collapsible
              open={sectionOpen.notifications}
              onOpenChange={() => toggleSection("notifications")}
            >
              <div id="notifications" className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 overflow-hidden">
                <CollapsibleTrigger className="w-full p-4 sm:p-6 flex items-center justify-between gap-2 hover:bg-[#F5F1E8]/50 transition-colors text-left">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#654321] flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
                      <Bell className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                    Notification Preferences
                  </h2>
                  <ChevronDown
                    className={`w-5 h-5 text-[#8B4513] shrink-0 transition-transform duration-200 ${sectionOpen.notifications ? "rotate-180" : ""}`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0 space-y-3 sm:space-y-4">
                {Object.entries(notificationSettings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-2">
                    <span className="text-[11px] sm:text-sm font-medium text-[#654321] capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <button
                      onClick={() => setNotificationSettings({ ...notificationSettings, [key]: !value })}
                      className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors ${
                        value ? "bg-gradient-to-br from-amber-500 to-yellow-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                          value ? "translate-x-5 sm:translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleSaveSettings("notification")}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-6 sm:py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-lg text-[10px] sm:text-sm md:text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50 w-full sm:w-auto mx-auto"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-2.5 h-2.5 sm:w-4 sm:h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                      <span>Save Preferences</span>
                    </>
                  )}
                </button>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Privacy Settings */}
            <Collapsible
              open={sectionOpen.privacy}
              onOpenChange={() => toggleSection("privacy")}
            >
              <div id="privacy" className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 overflow-hidden">
                <CollapsibleTrigger className="w-full p-4 sm:p-6 flex items-center justify-between gap-2 hover:bg-[#F5F1E8]/50 transition-colors text-left">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#654321] flex items-center gap-2">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                    Privacy Settings
                  </h2>
                  <ChevronDown
                    className={`w-5 h-5 text-[#8B4513] shrink-0 transition-transform duration-200 ${sectionOpen.privacy ? "rotate-180" : ""}`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0 space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-[11px] sm:text-sm font-medium text-[#654321] mb-2">
                    Profile Visibility
                  </label>
                  <select
                    value={privacySettings.profileVisibility}
                    onChange={(e) => setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 border-2 border-[#DAA520]/30 rounded-lg focus:outline-none focus:border-[#DAA520] text-[11px] sm:text-sm"
                  >
                    <option value="public">Public</option>
                    <option value="friends">Friends Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                {Object.entries(privacySettings)
                  .filter(([key]) => key !== "profileVisibility")
                  .map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-2">
                      <span className="text-[11px] sm:text-sm font-medium text-[#654321] capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <button
                        onClick={() => setPrivacySettings({ ...privacySettings, [key]: !value })}
                        className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors ${
                          value ? "bg-gradient-to-br from-emerald-500 to-green-600" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                            value ? "translate-x-5 sm:translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                <button
                  onClick={() => handleSaveSettings("privacy")}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-6 sm:py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-lg text-[10px] sm:text-sm md:text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50 w-full sm:w-auto mx-auto"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-2.5 h-2.5 sm:w-4 sm:h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                      <span>Save Settings</span>
                    </>
                  )}
                </button>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Security Settings */}
            <Collapsible
              open={sectionOpen.security}
              onOpenChange={() => toggleSection("security")}
            >
              <div id="security" className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 overflow-hidden">
                <CollapsibleTrigger className="w-full p-4 sm:p-6 flex items-center justify-between gap-2 hover:bg-[#F5F1E8]/50 transition-colors text-left">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#654321] flex items-center gap-2">
                    <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />
                    Security Settings
                  </h2>
                  <ChevronDown
                    className={`w-5 h-5 text-[#8B4513] shrink-0 transition-transform duration-200 ${sectionOpen.security ? "rotate-180" : ""}`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0 space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-[11px] sm:text-sm font-medium text-[#654321] mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={securitySettings.currentPassword}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, currentPassword: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 border-2 border-[#DAA520]/30 rounded-lg focus:outline-none focus:border-[#DAA520] pr-10 text-[11px] sm:text-sm"
                    />
                    <button
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B4513]"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] sm:text-sm font-medium text-[#654321] mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={securitySettings.newPassword}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, newPassword: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 border-2 border-[#DAA520]/30 rounded-lg focus:outline-none focus:border-[#DAA520] pr-10 text-[11px] sm:text-sm"
                    />
                    <button
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B4513]"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] sm:text-sm font-medium text-[#654321] mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={securitySettings.confirmPassword}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, confirmPassword: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 border-2 border-[#DAA520]/30 rounded-lg focus:outline-none focus:border-[#DAA520] text-[11px] sm:text-sm"
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-t-2 border-[#DAA520]/20 mt-4">
                  <div>
                    <div className="text-[11px] sm:text-sm font-medium text-[#654321]">Two-Factor Authentication</div>
                    <div className="text-[9px] sm:text-xs text-[#8B4513]/70">Add an extra layer of security with an authenticator app</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {securitySettings.twoFactorAuth ? (
                      <>
                        <span className="text-xs text-emerald-600 font-medium">Enabled</span>
                        <button
                          type="button"
                          onClick={() => setShow2FADisableConfirm(true)}
                          disabled={disabling2FA}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                        >
                          {disabling2FA ? "…" : "Disable 2FA"}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShow2FAEnrollDialog(true)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-500 text-white hover:bg-rose-600"
                      >
                        Enable 2FA
                      </button>
                    )}
                  </div>
                </div>
                <TwoFactorEnrollDialog
                  open={show2FAEnrollDialog}
                  onOpenChange={setShow2FAEnrollDialog}
                  onSuccess={() => {
                    setSecuritySettings((prev) => ({ ...prev, twoFactorAuth: true }))
                    toast({ title: "2FA enabled", description: "Your account is now protected with two-factor authentication." })
                  }}
                />
                {show2FADisableConfirm && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl border-2 border-[#DAA520]/20 p-6 max-w-sm w-full">
                      <p className="text-sm text-[#654321] mb-4">Disable two-factor authentication? Your account will be less secure.</p>
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setShow2FADisableConfirm(false)}
                          className="px-4 py-2 text-sm rounded-lg border border-[#DAA520]/40 text-[#654321]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            setDisabling2FA(true)
                            const { error } = await unenrollTwoFactor()
                            setDisabling2FA(false)
                            setShow2FADisableConfirm(false)
                            if (error) {
                              toast({ title: "Could not disable 2FA", description: error, variant: "destructive" })
                              return
                            }
                            setSecuritySettings((prev) => ({ ...prev, twoFactorAuth: false }))
                            toast({ title: "2FA disabled", description: "Two-factor authentication has been turned off." })
                          }}
                          className="px-4 py-2 text-sm rounded-lg bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50"
                        >
                          Disable
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => handleSaveSettings("security")}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-6 sm:py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-lg text-[10px] sm:text-sm md:text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50 w-full sm:w-auto mx-auto"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-2.5 h-2.5 sm:w-4 sm:h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                      <span>Save Security Settings</span>
                    </>
                  )}
                </button>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* AI Preferences */}
            <Collapsible
              open={sectionOpen.ai}
              onOpenChange={() => toggleSection("ai")}
            >
              <div id="ai" className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 overflow-hidden">
                <CollapsibleTrigger className="w-full p-4 sm:p-6 flex items-center justify-between gap-2 hover:bg-[#F5F1E8]/50 transition-colors text-left">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#654321] flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                    AI Preferences
                  </h2>
                  <ChevronDown
                    className={`w-5 h-5 text-[#8B4513] shrink-0 transition-transform duration-200 ${sectionOpen.ai ? "rotate-180" : ""}`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
                  <p className="text-[10px] sm:text-xs md:text-sm text-[#8B4513]/70 mb-4">
                    AI-Powered Features help you make smarter decisions, discover better gifts, and optimize your gifting
                    experience.
                  </p>
                  <div className="space-y-3 sm:space-y-4">
                {Object.entries(aiPreferences).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-2">
                    <span className="text-[11px] sm:text-sm font-medium text-[#654321] capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <button
                      onClick={() => setAiPreferences({ ...aiPreferences, [key]: !value })}
                      className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors ${
                        value ? "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                          value ? "translate-x-5 sm:translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleSaveSettings("AI")}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-6 sm:py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-lg text-[10px] sm:text-sm md:text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50 w-full sm:w-auto mx-auto"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-2.5 h-2.5 sm:w-4 sm:h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                      <span>Save AI Preferences</span>
                    </>
                  )}
                </button>
                  </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Payment Settings */}
            <Collapsible
              open={sectionOpen.payment}
              onOpenChange={() => toggleSection("payment")}
            >
              <div id="payment" className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 overflow-hidden">
                <CollapsibleTrigger className="w-full p-4 sm:p-6 flex items-center justify-between gap-2 hover:bg-[#F5F1E8]/50 transition-colors text-left">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#654321] flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                      <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                    Payment Settings
                  </h2>
                  <ChevronDown
                    className={`w-5 h-5 text-[#8B4513] shrink-0 transition-transform duration-200 ${sectionOpen.payment ? "rotate-180" : ""}`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0 space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-[11px] sm:text-sm font-medium text-[#654321] mb-2">
                    Default Payment Method
                  </label>
                  <select
                    value={paymentSettings.defaultPaymentMethod}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, defaultPaymentMethod: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 border-2 border-[#DAA520]/30 rounded-lg focus:outline-none focus:border-[#DAA520] text-[11px] sm:text-sm"
                  >
                    <option value="credit-card">Credit Card</option>
                    <option value="paypal">PayPal</option>
                    <option value="apple-pay">Apple Pay</option>
                    <option value="google-pay">Google Pay</option>
                    <option value="venmo">Venmo</option>
                    <option value="cash-app">Cash App</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] sm:text-sm font-medium text-[#654321] mb-2">Currency</label>
                  <select
                    value={paymentSettings.currency}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, currency: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 border-2 border-[#DAA520]/30 rounded-lg focus:outline-none focus:border-[#DAA520] text-[11px] sm:text-sm"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                  </select>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[11px] sm:text-sm font-medium text-[#654321]">Save Payment Information</span>
                  <button
                    onClick={() =>
                      setPaymentSettings({
                        ...paymentSettings,
                        savePaymentInfo: !paymentSettings.savePaymentInfo,
                      })
                    }
                    className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors ${
                      paymentSettings.savePaymentInfo
                        ? "bg-gradient-to-br from-emerald-500 to-green-600"
                        : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                        paymentSettings.savePaymentInfo ? "translate-x-5 sm:translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                <button
                  onClick={() => handleSaveSettings("payment")}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-6 sm:py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-lg text-[10px] sm:text-sm md:text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50 w-full sm:w-auto mx-auto"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-2.5 h-2.5 sm:w-4 sm:h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                      <span>Save Payment Settings</span>
                    </>
                  )}
                </button>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </div>
        </div>
      </div>
    </div>
  )
}
