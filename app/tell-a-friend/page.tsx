"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useState, useEffect } from "react"
import { UserPlus, Share2, Gift, Copy, CheckCircle, Mail, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"

export default function TellAFriendPage() {
  const { user } = useAuth()
  const [referralCode, setReferralCode] = useState("")
  const [referralLink, setReferralLink] = useState("")
  const [copied, setCopied] = useState(false)
  const [email, setEmail] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    successfulReferrals: 0,
    rewardsEarned: 0,
  })

  useEffect(() => {
    // Generate or fetch referral code
    if (user) {
      // In production, fetch from API
      const code = user.id.substring(0, 8).toUpperCase() || "WISHBEE"
      setReferralCode(code)
      const link = `${window.location.origin}/signup?ref=${code}`
      setReferralLink(link)
      
      // Fetch referral stats
      fetchReferralStats()
    } else {
      // Guest referral code
      const code = "WISHBEE"
      setReferralCode(code)
      const link = `${window.location.origin}/signup?ref=${code}`
      setReferralLink(link)
    }
  }, [user])

  const fetchReferralStats = async () => {
    if (!user) return
    
    try {
      const response = await fetch("/api/referrals/stats")
      if (response.ok) {
        const data = await response.json()
        setReferralStats(data)
      }
    } catch (error) {
      console.error("Error fetching referral stats:", error)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast.success("Referral link copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const shareViaEmail = async () => {
    if (!email) {
      toast.error("Please enter an email address")
      return
    }

    setIsSending(true)
    try {
      const response = await fetch("/api/referrals/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          referralCode,
          referralLink,
        }),
      })

      if (response.ok) {
        toast.success("Referral email sent successfully!")
        setEmail("")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to send email")
      }
    } catch (error) {
      console.error("Error sending referral email:", error)
      toast.error("Failed to send email. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  const shareViaSocial = (platform: string) => {
    const text = `Join me on Wishbee.ai - the best platform for group gifting! Use my referral code: ${referralCode}`
    const url = referralLink

    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    }

    if (shareUrls[platform.toLowerCase()]) {
      window.open(shareUrls[platform.toLowerCase()], "_blank")
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] mb-6">
            <UserPlus className="w-8 h-8 text-[#654321]" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#654321] mb-4">
            Refer a Friend
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Share Wishbee.ai with your friends and earn rewards when they sign up!
          </p>
        </div>

        {/* Referral Stats */}
        {user && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-[#DAA520] mb-2">{referralStats.totalReferrals}</div>
              <div className="text-gray-600">Total Referrals</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-[#DAA520] mb-2">{referralStats.successfulReferrals}</div>
              <div className="text-gray-600">Successful Signups</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-[#DAA520] mb-2">{referralStats.rewardsEarned}</div>
              <div className="text-gray-600">Rewards Earned</div>
            </div>
          </div>
        )}

        {/* Referral Code Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-[#654321] mb-6">Your Referral Code</h2>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                value={referralCode}
                readOnly
                className="text-center text-2xl font-bold text-[#654321] border-2 border-[#DAA520] bg-[#F5F1E8]"
              />
            </div>
            <Button
              onClick={copyToClipboard}
              className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520] h-12 px-6"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  Copy Code
                </>
              )}
            </Button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#654321] mb-2">Your Referral Link</label>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                value={referralLink}
                readOnly
                className="flex-1 border-gray-300 bg-[#F5F1E8] text-sm"
              />
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="border-[#8B4513] text-[#8B4513] hover:bg-[#8B4513] hover:text-white"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>
        </div>

        {/* Share Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Email Share */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#14B8A6] to-[#2DD4BF] flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#654321]">Share via Email</h3>
            </div>
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="Enter friend's email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-gray-300 focus:border-[#DAA520]"
              />
              <Button
                onClick={shareViaEmail}
                disabled={isSending || !email}
                className="w-full bg-gradient-to-r from-[#14B8A6] to-[#2DD4BF] text-white hover:from-[#2DD4BF] hover:to-[#14B8A6]"
              >
                {isSending ? "Sending..." : "Send Referral"}
              </Button>
            </div>
          </div>

          {/* Social Share */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] flex items-center justify-center">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#654321]">Share on Social Media</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => shareViaSocial("twitter")}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                Twitter
              </Button>
              <Button
                onClick={() => shareViaSocial("facebook")}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                Facebook
              </Button>
              <Button
                onClick={() => shareViaSocial("whatsapp")}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                WhatsApp
              </Button>
              <Button
                onClick={() => shareViaSocial("linkedin")}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                LinkedIn
              </Button>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] rounded-lg p-8">
          <h2 className="text-2xl font-bold text-[#654321] mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/90 rounded-lg p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#654321] text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-bold text-[#654321] mb-2">Share Your Code</h3>
              <p className="text-gray-700 text-sm">
                Share your unique referral code or link with friends and family
              </p>
            </div>
            <div className="bg-white/90 rounded-lg p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#654321] text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-bold text-[#654321] mb-2">They Sign Up</h3>
              <p className="text-gray-700 text-sm">
                Your friends sign up using your referral code and create their first gift collection
              </p>
            </div>
            <div className="bg-white/90 rounded-lg p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#654321] text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-bold text-[#654321] mb-2">You Earn Rewards</h3>
              <p className="text-gray-700 text-sm">
                Earn rewards and credits when your referrals become active users
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

