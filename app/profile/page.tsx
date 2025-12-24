"use client"

import type React from "react"

import { useState } from "react"
import {
  ArrowLeft,
  Mail,
  MapPin,
  Phone,
  Calendar,
  Camera,
  Save,
  Edit,
  Gift,
  Users,
  Heart,
  TrendingUp,
  Award,
  DollarSign,
  Target,
  Sparkles,
  Brain,
  Shield,
  Bell,
  CreditCard,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [loadingAI, setLoadingAI] = useState(false)
  const [aiRecommendations, setAiRecommendations] = useState<any>(null)
  const [profileImage, setProfileImage] = useState<string>("/images/first-person.png")
  const [profileData, setProfileData] = useState({
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    bio: "Passionate about bringing people together through meaningful gifts. Love organizing surprise celebrations!",
    joinDate: "2024-01-15",
    birthday: "1990-05-20",
  })

  const [stats] = useState({
    totalGifts: 24,
    totalContributed: 1850,
    groupsJoined: 5,
    friendsHelped: 32,
    successRate: 95,
    averageContribution: 77,
  })

  const [badges] = useState([
    { id: 1, name: "Early Adopter", icon: "🌟", earned: "2024-01-15", description: "One of the first 100 users" },
    { id: 2, name: "Gift Master", icon: "🎁", earned: "2024-03-20", description: "Organized 10+ gift collections" },
    { id: 3, name: "Generous Giver", icon: "💝", earned: "2024-05-10", description: "Contributed over $1,000" },
    {
      id: 4,
      name: "Community Builder",
      icon: "🤝",
      earned: "2024-06-15",
      description: "Created 3+ active groups",
    },
  ])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImage(reader.result as string)
        toast.success("Profile image updated!")
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setIsEditing(false)
    toast.success("Profile updated successfully!")
  }

  const generateAIRecommendations = async () => {
    setLoadingAI(true)
    try {
      setTimeout(() => {
        setAiRecommendations({
          personalityType: "The Thoughtful Organizer",
          giftingStyle: "You excel at coordinating group efforts and ensuring everyone feels included",
          strengths: [
            "Consistent contributor with high engagement",
            "Strong network builder across multiple groups",
            "Excellent at timing and occasion planning",
          ],
          suggestions: [
            "Consider creating a recurring gift fund for annual celebrations",
            "Your contribution pattern suggests you're ideal for leading larger gift campaigns",
            "Connect your Work Friends group with Family Circle for cross-group celebrations",
          ],
          upcomingOpportunities: [
            { event: "Mike's Birthday", date: "2025-01-10", suggestedAmount: "$50-75" },
            { event: "Team Anniversary", date: "2025-02-01", suggestedAmount: "$30-50" },
          ],
          optimalContributionAmount: 85,
          bestGiftingDays: ["Fridays", "Early mornings"],
        })
        setLoadingAI(false)
        toast.success("AI recommendations generated!")
      }, 2000)
    } catch (error) {
      console.error("Error generating recommendations:", error)
      toast.error("Failed to generate AI recommendations")
      setLoadingAI(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors text-xs sm:text-sm md:text-base"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          Back to Home
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header Card */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 p-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Profile Image */}
                <div className="relative">
                  <img
                    src={profileImage || "/placeholder.svg"}
                    alt="Profile"
                    className="w-32 h-32 rounded-full border-4 border-[#DAA520] object-cover"
                  />
                  <label
                    htmlFor="profile-upload"
                    className="absolute bottom-0 right-0 bg-gradient-to-r from-[#DAA520] to-[#F4C430] p-2 rounded-full cursor-pointer hover:shadow-lg transition-all"
                  >
                    <Camera className="w-4 h-4 text-[#3B2F0F]" />
                    <input
                      id="profile-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Profile Details */}
                <div className="flex-1 text-center md:text-left">
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="text-lg sm:text-xl md:text-2xl font-bold text-[#654321] border-2 border-[#DAA520]/30 rounded-lg px-3 py-2 mb-2 w-full"
                    />
                  ) : (
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#654321] mb-2">
                      {profileData.name}
                    </h1>
                  )}

                  <div className="space-y-2 text-xs sm:text-sm text-[#8B4513]/80">
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-[#DAA520]" />
                      {isEditing ? (
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className="border-2 border-[#DAA520]/30 rounded px-2 py-1 text-xs sm:text-sm"
                        />
                      ) : (
                        <span>{profileData.email}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                      <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-[#DAA520]" />
                      {isEditing ? (
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          className="border-2 border-[#DAA520]/30 rounded px-2 py-1 text-xs sm:text-sm"
                        />
                      ) : (
                        <span>{profileData.phone}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-[#DAA520]" />
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.location}
                          onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                          className="border-2 border-[#DAA520]/30 rounded px-2 py-1 text-xs sm:text-sm"
                        />
                      ) : (
                        <span>{profileData.location}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-[#DAA520]" />
                      <span>Member since {new Date(profileData.joinDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3 justify-center md:justify-start">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleSave}
                          className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-lg font-semibold hover:shadow-lg transition-all text-xs sm:text-sm"
                        >
                          <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                          Save Changes
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-3 py-2 sm:px-4 border-2 border-[#DAA520] text-[#654321] rounded-lg font-semibold hover:bg-[#F5F1E8] transition-all text-xs sm:text-sm"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-lg font-semibold hover:shadow-lg transition-all text-xs sm:text-sm"
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        Edit Profile
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div className="mt-6 pt-6 border-t-2 border-[#DAA520]/20">
                <h3 className="text-xs sm:text-sm font-bold text-[#654321] mb-2">Bio</h3>
                {isEditing ? (
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    className="w-full border-2 border-[#DAA520]/30 rounded-lg px-3 py-2 text-xs sm:text-sm text-[#8B4513]/80"
                    rows={3}
                  />
                ) : (
                  <p className="text-xs sm:text-sm text-[#8B4513]/80">{profileData.bio}</p>
                )}
              </div>
            </div>

            {/* Statistics Grid */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 p-6">
              <h2 className="text-lg sm:text-xl font-bold text-[#654321] mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#DAA520]" />
                Your Gifting Stats
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-[#DAA520]/10 to-[#F4C430]/10 rounded-lg border-2 border-[#DAA520]/20">
                  <div className="flex justify-center mb-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#DAA520] to-[#F4C430] flex items-center justify-center">
                      <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-[#654321]">{stats.totalGifts}</div>
                  <div className="text-[10px] sm:text-xs text-[#8B4513]/70">Total Gifts</div>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-emerald-100/50 to-green-100/50 rounded-lg border-2 border-emerald-300/20">
                  <div className="flex justify-center mb-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-[#654321]">${stats.totalContributed}</div>
                  <div className="text-[10px] sm:text-xs text-[#8B4513]/70">Total Contributed</div>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-orange-100/50 to-amber-100/50 rounded-lg border-2 border-orange-300/20">
                  <div className="flex justify-center mb-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-[#654321]">{stats.groupsJoined}</div>
                  <div className="text-[10px] sm:text-xs text-[#8B4513]/70">Groups Joined</div>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-rose-100/50 to-pink-100/50 rounded-lg border-2 border-rose-300/20">
                  <div className="flex justify-center mb-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                      <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-[#654321]">{stats.friendsHelped}</div>
                  <div className="text-[10px] sm:text-xs text-[#8B4513]/70">Friends Helped</div>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-[#DAA520]/10 to-[#F4C430]/10 rounded-lg border-2 border-[#DAA520]/20">
                  <div className="flex justify-center mb-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#DAA520] to-[#F4C430] flex items-center justify-center">
                      <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-[#654321]">{stats.successRate}%</div>
                  <div className="text-[10px] sm:text-xs text-[#8B4513]/70">Success Rate</div>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-[#DAA520]/10 to-[#F4C430]/10 rounded-lg border-2 border-[#DAA520]/20">
                  <div className="flex justify-center mb-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#DAA520] to-[#F4C430] flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-[#654321]">${stats.averageContribution}</div>
                  <div className="text-[10px] sm:text-xs text-[#8B4513]/70">Avg. Contribution</div>
                </div>
              </div>
            </div>

            {/* AI Recommendations */}
            <Card className="border-2 border-[#DAA520]/30 shadow-md bg-gradient-to-br from-white to-[#F4C430]/5">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-between mb-4 gap-2">
                  <h2 className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold text-[#654321] flex items-center gap-2 whitespace-nowrap text-center sm:text-left">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                    AI Personalized Insights
                  </h2>
                  <button
                    onClick={generateAIRecommendations}
                    disabled={loadingAI}
                    className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-2 md:px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white rounded-lg font-semibold hover:shadow-lg hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 transition-all text-[9px] sm:text-[10px] md:text-xs lg:text-sm border-2 border-amber-400/30 whitespace-nowrap"
                  >
                    {loadingAI ? (
                      <>Analyzing...</>
                    ) : (
                      <>
                        <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                        Generate Insights
                      </>
                    )}
                  </button>
                </div>

                {aiRecommendations ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-[#DAA520]/10 to-[#F4C430]/10 rounded-lg">
                      <h3 className="font-bold text-[#654321] mb-2 text-sm sm:text-base">Your Gifting Personality</h3>
                      <p className="text-xs sm:text-sm text-[#8B4513]/80 mb-1 font-semibold">
                        {aiRecommendations.personalityType}
                      </p>
                      <p className="text-xs sm:text-sm text-[#8B4513]/70">{aiRecommendations.giftingStyle}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-bold text-[#654321] mb-2 flex items-center gap-2 text-sm sm:text-base">
                          <Award className="w-3 h-3 sm:w-4 sm:h-4 text-[#DAA520]" />
                          Your Strengths
                        </h3>
                        <ul className="space-y-1">
                          {aiRecommendations.strengths.map((strength: string, index: number) => (
                            <li key={index} className="text-xs sm:text-sm text-[#8B4513]/80 flex items-start gap-2">
                              <span className="text-[#DAA520] mt-1">•</span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-bold text-[#654321] mb-2 flex items-center gap-2 text-sm sm:text-base">
                          <Target className="w-3 h-3 sm:w-4 sm:h-4 text-[#DAA520]" />
                          Suggestions
                        </h3>
                        <ul className="space-y-1">
                          {aiRecommendations.suggestions.map((suggestion: string, index: number) => (
                            <li key={index} className="text-xs sm:text-sm text-[#8B4513]/80 flex items-start gap-2">
                              <span className="text-[#DAA520] mt-1">•</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="p-4 bg-[#F5F1E8] rounded-lg">
                      <h3 className="font-bold text-[#654321] mb-3 text-sm sm:text-base">Upcoming Opportunities</h3>
                      <div className="space-y-2">
                        {aiRecommendations.upcomingOpportunities.map((opp: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-[10px] sm:text-xs md:text-sm"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold text-[#654321]">{opp.event}</span>
                              <span className="text-[#8B4513]/70 ml-1 sm:ml-2 text-[9px] sm:text-[10px] md:text-xs">
                                {opp.date}
                              </span>
                            </div>
                            <span className="text-[#DAA520] font-bold ml-2 text-[10px] sm:text-xs md:text-sm whitespace-nowrap">
                              {opp.suggestedAmount}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gradient-to-br from-[#DAA520]/10 to-[#F4C430]/10 rounded-lg text-center">
                        <div className="text-xl sm:text-2xl font-bold text-[#654321] mb-1">
                          ${aiRecommendations.optimalContributionAmount}
                        </div>
                        <div className="text-[10px] sm:text-xs text-[#8B4513]/70">Optimal Contribution Amount</div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-[#DAA520]/10 to-[#F4C430]/10 rounded-lg text-center">
                        <div className="text-xs sm:text-sm font-bold text-[#654321] mb-1">
                          {aiRecommendations.bestGiftingDays.join(", ")}
                        </div>
                        <div className="text-[10px] sm:text-xs text-[#8B4513]/70">Best Gifting Days</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="w-10 h-10 sm:w-12 sm:h-12 text-[#DAA520]/30 mx-auto mb-3" />
                    <p className="text-xs sm:text-sm text-[#8B4513]/70">
                      Click "Generate Insights" to get personalized AI recommendations based on your gifting history
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Badges & Quick Actions */}
          <div className="space-y-6">
            {/* Achievements/Badges */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 p-6">
              <h2 className="text-lg sm:text-xl font-bold text-[#654321] mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#DAA520]" />
                Achievements
              </h2>
              <div className="space-y-3">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="p-3 bg-gradient-to-br from-[#DAA520]/10 to-[#F4C430]/10 rounded-lg border-2 border-[#DAA520]/20"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl sm:text-3xl">{badge.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-[#654321] text-xs sm:text-sm">{badge.name}</h3>
                        <p className="text-[10px] sm:text-xs text-[#8B4513]/70 mb-1">{badge.description}</p>
                        <p className="text-[10px] sm:text-xs text-[#DAA520] flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(badge.earned).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 p-6">
              <h2 className="text-lg sm:text-xl font-bold text-[#654321] mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link
                  href="/settings"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F5F1E8] transition-colors"
                >
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-[#DAA520]" />
                  <span className="text-xs sm:text-sm text-[#654321]">Privacy & Security</span>
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F5F1E8] transition-colors"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-[#DAA520]" />
                  <span className="text-xs sm:text-sm text-[#654321]">Notification Settings</span>
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F5F1E8] transition-colors"
                >
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-[#DAA520]" />
                  <span className="text-xs sm:text-sm text-[#654321]">Payment Methods</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
