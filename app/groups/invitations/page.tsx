"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  Users,
  Calendar,
  Gift,
  Check,
  X,
  Sparkles,
  Brain,
  TrendingUp,
  AlertCircle,
  UserPlus,
  Star,
  Award,
  Target,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface GroupInvitation {
  id: number
  groupName: string
  inviterName: string
  inviterImage: string
  groupImage: string
  memberCount: number
  activeGifts: number
  invitedDate: string
  message: string
  groupType: string
  recentActivity: string
}

const mockInvitations: GroupInvitation[] = [
  {
    id: 1,
    groupName: "Family Circle",
    inviterName: "Sarah Johnson",
    inviterImage: "/images/first-person.png",
    groupImage: "/images/group-gifting-mainimage.png",
    memberCount: 12,
    activeGifts: 3,
    invitedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    message: "Join our family group to celebrate birthdays and special occasions together!",
    groupType: "Family",
    recentActivity: "3 gifts this month",
  },
  {
    id: 2,
    groupName: "Work Friends",
    inviterName: "Mike Chen",
    inviterImage: "/images/second-person.png",
    groupImage: "/images/groups.png",
    memberCount: 8,
    activeGifts: 1,
    invitedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    message: "Let's make workplace celebrations more fun and meaningful!",
    groupType: "Professional",
    recentActivity: "1 gift this week",
  },
  {
    id: 3,
    groupName: "College Alumni",
    inviterName: "Emma Davis",
    inviterImage: "/images/third-person.jpg",
    groupImage: "/images/espresso-machine.webp",
    memberCount: 24,
    activeGifts: 2,
    invitedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    message: "Reconnect with classmates and celebrate milestones together!",
    groupType: "Social",
    recentActivity: "5 gifts this quarter",
  },
]

export default function GroupInvitationsPage() {
  const [invitations, setInvitations] = useState<GroupInvitation[]>([])
  const [aiRecommendations, setAiRecommendations] = useState<any>(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [selectedInvitation, setSelectedInvitation] = useState<number | null>(null)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvitations()
  }, [])

  const fetchInvitations = async () => {
    setTimeout(() => {
      setInvitations(mockInvitations)
      setLoading(false)
    }, 1000)
  }

  const fetchAIRecommendations = async (invitation: GroupInvitation) => {
    setLoadingAI(true)
    setSelectedInvitation(invitation.id)

    setTimeout(() => {
      const score = Math.floor(Math.random() * 30) + 70
      setAiRecommendations({
        invitationId: invitation.id,
        compatibilityScore: score,
        recommendation: score >= 80 ? "Highly Recommended" : "Recommended",
        engagementPotential: score >= 80 ? "High" : "Medium",
        benefits: [
          "Active and engaged member base",
          "Compatible group size for your preferences",
          "Regular gifting activity",
          "Strong social connections",
        ],
        considerations: [
          "May require regular participation",
          "Active gift coordination needed",
          "Multiple ongoing collections",
        ],
        reasoning:
          "This group shows strong compatibility with your gifting patterns and preferences. Members are actively engaged, and the group size aligns well with your historical participation in similar communities.",
      })
      setLoadingAI(false)
      toast.success("AI compatibility analysis complete!")
    }, 2000)
  }

  const handleAccept = async (id: number) => {
    setProcessingId(id)
    const invitation = invitations.find((inv) => inv.id === id)

    setTimeout(() => {
      setInvitations(invitations.filter((inv) => inv.id !== id))
      setProcessingId(null)

      toast.success(`Successfully joined ${invitation?.groupName}!`, {
        description: "You can now participate in group gifts.",
        action: {
          label: "View Group",
          onClick: () => {
            toast.info("Group details page coming soon!")
          },
        },
      })
    }, 1500)
  }

  const handleDecline = async (id: number) => {
    setProcessingId(id)
    const invitation = invitations.find((inv) => inv.id === id)

    setTimeout(() => {
      setInvitations(invitations.filter((inv) => inv.id !== id))
      setProcessingId(null)

      toast.success(`Declined invitation from ${invitation?.groupName}`, {
        description: "The invitation has been removed.",
      })
    }, 1500)
  }

  const getUrgencyBadge = (invitedDate: string) => {
    const daysAgo = Math.floor((Date.now() - new Date(invitedDate).getTime()) / (1000 * 60 * 60 * 24))

    if (daysAgo <= 3) {
      return { text: "New Invitation", color: "bg-gradient-to-r from-[#DAA520] to-[#F4C430]" }
    } else if (daysAgo <= 7) {
      return { text: "This Week", color: "bg-gradient-to-r from-amber-500 to-orange-500" }
    } else {
      return { text: "Pending", color: "bg-gradient-to-r from-[#8B4513] to-[#A0522D]" }
    }
  }

  const getCompatibilityScore = () => {
    return aiRecommendations?.compatibilityScore || 0
  }

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-blue-600"
    if (score >= 40) return "text-amber-600"
    return "text-red-600"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DAA520] mx-auto mb-4"></div>
          <p className="text-[#8B4513]">Loading invitations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors text-xs sm:text-sm"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          Back to Groups
        </Link>

        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="flex flex-row items-center justify-center gap-2">
            <div className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] flex items-center justify-center flex-shrink-0">
              <Users className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
            </div>
            <h1 className="text-lg sm:text-3xl md:text-4xl font-bold text-foreground whitespace-nowrap">
              Group Invitations
            </h1>
          </div>
          <p className="text-[10px] sm:text-sm text-muted-foreground text-center mt-2">
            Review and manage your pending group invitations
          </p>
        </div>

        <div className="flex justify-center sm:justify-end mb-6">
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-white rounded-lg border-2 border-[#DAA520]/20">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#DAA520] flex-shrink-0" />
            <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
              <span className="font-bold text-[#654321] text-sm sm:text-base">{invitations.length}</span>
              <span className="text-[9px] sm:text-xs text-[#8B4513]/70">pending invitations</span>
            </div>
          </div>
        </div>

        {invitations.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border-2 border-[#DAA520]/20">
            <UserPlus className="w-16 h-16 text-[#DAA520]/40 mx-auto mb-4" />
            <h2 className="text-lg sm:text-2xl font-bold text-[#654321] mb-2">No Pending Invitations</h2>
            <p className="text-xs sm:text-base text-[#8B4513]/70 mb-6">
              You don't have any group invitations at the moment.
            </p>
            <Link
              href="/groups"
              className="inline-block px-6 py-3 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-full font-semibold hover:shadow-lg transition-all text-xs sm:text-base"
            >
              View My Groups
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {invitations.map((invitation) => {
              const urgency = getUrgencyBadge(invitation.invitedDate)
              const showingAI = aiRecommendations?.invitationId === invitation.id

              return (
                <div
                  key={invitation.id}
                  className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 overflow-hidden"
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start">
                      <div className="flex-shrink-0 mx-auto sm:mx-0">
                        <img
                          src={invitation.groupImage || "/placeholder.svg"}
                          alt={invitation.groupName}
                          className="w-32 h-32 rounded-xl border-2 border-[#DAA520] object-cover shadow-md"
                        />
                      </div>

                      <div className="flex-grow w-full sm:w-auto">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-full sm:w-auto">
                            <div className="flex items-center gap-2 mb-1 justify-center sm:justify-start">
                              <h2 className="text-base sm:text-2xl font-bold text-[#654321]">{invitation.groupName}</h2>
                              <span
                                className={`${urgency.color} text-white text-[9px] sm:text-xs px-2 py-1 rounded-full font-semibold`}
                              >
                                {urgency.text}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] sm:text-sm text-[#8B4513]/70 mb-2 justify-center sm:justify-start flex-wrap">
                              <img
                                src={invitation.inviterImage || "/placeholder.svg"}
                                alt={invitation.inviterName}
                                className="w-8 h-8 rounded-full border-2 border-[#DAA520]"
                              />
                              <span>
                                Invited by <strong className="text-[#654321]">{invitation.inviterName}</strong>
                              </span>
                              <span>•</span>
                              <Calendar className="w-4 h-4" />
                              {new Date(invitation.invitedDate).toLocaleDateString()}
                            </div>
                            <p className="text-[#8B4513] mb-3 italic text-xs sm:text-base text-center sm:text-left">
                              "{invitation.message}"
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-[#DAA520]" />
                            <div>
                              <div className="font-bold text-[#654321] text-sm sm:text-base">
                                {invitation.memberCount}
                              </div>
                              <div className="text-[9px] sm:text-xs text-[#8B4513]/70">Members</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Gift className="w-5 h-5 text-[#DAA520]" />
                            <div>
                              <div className="font-bold text-[#654321] text-sm sm:text-base">
                                {invitation.activeGifts}
                              </div>
                              <div className="text-[9px] sm:text-xs text-[#8B4513]/70">Active Gifts</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-[#DAA520]" />
                            <div>
                              <div className="font-bold text-[#654321] text-sm sm:text-base">
                                {invitation.groupType}
                              </div>
                              <div className="text-[9px] sm:text-xs text-[#8B4513]/70">Type</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-[#DAA520]" />
                            <div>
                              <div className="font-bold text-[#654321] text-[10px] sm:text-xs">
                                {invitation.recentActivity}
                              </div>
                              <div className="text-[9px] sm:text-xs text-[#8B4513]/70">Activity</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => handleAccept(invitation.id)}
                            disabled={processingId === invitation.id}
                            className="flex-1 sm:flex-none px-4 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-semibold hover:shadow-lg hover:scale-105 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] sm:text-sm"
                          >
                            <Check className="w-4 h-4" />
                            {processingId === invitation.id ? "Accepting..." : "Accept"}
                          </button>
                          <button
                            onClick={() => handleDecline(invitation.id)}
                            disabled={processingId === invitation.id}
                            className="flex-1 sm:flex-none px-4 py-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-full font-semibold hover:shadow-lg hover:scale-105 hover:from-red-600 hover:to-rose-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] sm:text-sm"
                          >
                            <X className="w-4 h-4" />
                            {processingId === invitation.id ? "Declining..." : "Decline"}
                          </button>
                          <button
                            onClick={() => fetchAIRecommendations(invitation)}
                            disabled={loadingAI && selectedInvitation === invitation.id}
                            className="flex-1 sm:flex-none px-4 py-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white rounded-full font-semibold hover:shadow-lg hover:scale-105 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 transition-all duration-200 flex items-center justify-center gap-2 border-2 border-amber-400/30 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] sm:text-sm"
                          >
                            <Brain className="w-4 h-4" />
                            {loadingAI && selectedInvitation === invitation.id ? "Analyzing..." : "AI Analysis"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {showingAI && (
                      <div className="mt-6 p-5 bg-gradient-to-r from-[#DAA520]/10 to-[#F4C430]/10 rounded-lg border-2 border-[#DAA520]/30">
                        <h3 className="text-sm sm:text-lg font-bold text-[#654321] mb-4 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-[#DAA520]" />
                          AI Compatibility Analysis
                        </h3>

                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                          <div className="text-center p-4 bg-white rounded-lg">
                            <div
                              className={`text-2xl sm:text-4xl font-bold ${getCompatibilityColor(getCompatibilityScore())} mb-1`}
                            >
                              {getCompatibilityScore()}%
                            </div>
                            <div className="text-[10px] sm:text-sm text-[#8B4513]/70">Match Score</div>
                          </div>
                          <div className="text-center p-4 bg-white rounded-lg">
                            <div className="text-2xl sm:text-4xl font-bold text-[#654321] mb-1 capitalize">
                              {aiRecommendations?.recommendation || "Recommended"}
                            </div>
                            <div className="text-[10px] sm:text-sm text-[#8B4513]/70">AI Verdict</div>
                          </div>
                          <div className="text-center p-4 bg-white rounded-lg">
                            <div className="text-2xl sm:text-4xl font-bold text-[#654321] mb-1">
                              {aiRecommendations?.engagementPotential || "High"}
                            </div>
                            <div className="text-[10px] sm:text-sm text-[#8B4513]/70">Engagement</div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-bold text-[#654321] mb-2 flex items-center gap-1 text-xs sm:text-base">
                              <Award className="w-4 h-4 text-[#DAA520]" />
                              Key Benefits
                            </h4>
                            <ul className="space-y-1.5">
                              {(
                                aiRecommendations?.benefits || [
                                  "Active and engaged member base",
                                  "Compatible group size for your preferences",
                                  "Regular gifting activity",
                                  "Strong social connections",
                                ]
                              ).map((benefit: string, index: number) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-2 text-[10px] sm:text-sm text-[#8B4513]/80"
                                >
                                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                  {benefit}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-bold text-[#654321] mb-2 flex items-center gap-1 text-xs sm:text-base">
                              <Target className="w-4 h-4 text-[#DAA520]" />
                              Considerations
                            </h4>
                            <ul className="space-y-1.5">
                              {(
                                aiRecommendations?.considerations || [
                                  "May require regular participation",
                                  "Active gift coordination needed",
                                ]
                              ).map((consideration: string, index: number) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-2 text-[10px] sm:text-sm text-[#8B4513]/80"
                                >
                                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                  {consideration}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {aiRecommendations?.reasoning && (
                          <div className="mt-4 p-3 bg-white rounded-lg">
                            <p className="text-[10px] sm:text-sm text-[#8B4513] italic">
                              <strong>AI Insight:</strong> {aiRecommendations.reasoning}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
