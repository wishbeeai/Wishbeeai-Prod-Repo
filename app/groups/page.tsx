"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  Users,
  Calendar,
  Gift,
  Sparkles,
  TrendingUp,
  Award,
  Brain,
  Target,
  Clock,
  DollarSign,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Group {
  id: string
  name: string
  members: number
  activeGifts: number
  created: string
  image: string
  description?: string
  isOwner?: boolean
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(true)

  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [aiInsights, setAiInsights] = useState<any>(null)
  const [upcomingOccasions, setUpcomingOccasions] = useState<any>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [loadingOccasions, setLoadingOccasions] = useState(false)
  const [showInsightsPanel, setShowInsightsPanel] = useState(false)

  const router = useRouter()

  // Fetch groups from API
  const fetchGroups = async () => {
    setIsLoadingGroups(true)
    try {
      const response = await fetch('/api/groups')
      const data = await response.json()
      
      if (data.success && data.groups) {
        setGroups(data.groups.map((g: any) => ({
          id: g.id,
          name: g.groupName,
          members: g.memberCount || 0,
          activeGifts: 0, // TODO: Fetch from gifts table
          created: g.createdDate,
          image: g.groupPhoto || '/images/groups.png',
          description: g.description,
          isOwner: g.isOwner,
        })))
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
      toast.error('Failed to load groups')
    } finally {
      setIsLoadingGroups(false)
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroupInsights = async (groupId: string) => {
    setLoadingInsights(true)
    try {
      const group = groups.find((g) => g.id === groupId)
      const response = await fetch("/api/ai/group-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupData: {
            name: group?.name,
            members: group?.members,
            activeGifts: group?.activeGifts,
            created: group?.created,
            contributionHistory: [
              { amount: 50, date: "2024-01-20" },
              { amount: 75, date: "2024-02-15" },
              { amount: 100, date: "2024-03-10" },
            ],
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to fetch insights")

      const data = await response.json()
      setAiInsights(data)
      setShowInsightsPanel(true)
      toast.success("AI insights generated successfully!")
    } catch (error) {
      console.error("Error fetching insights:", error)
      toast.error("Failed to generate AI insights")
    } finally {
      setLoadingInsights(false)
    }
  }

  const detectOccasions = async () => {
    setLoadingOccasions(true)
    try {
      const response = await fetch("/api/ai/detect-occasions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentDate: new Date().toISOString(),
          groupMembers: [
            { name: "Sarah Johnson", birthday: "2024-12-25", joinDate: "2023-01-15" },
            { name: "Mike Davis", birthday: "2025-01-10", joinDate: "2022-06-20" },
            { name: "Emily Chen", birthday: "2025-02-14", joinDate: "2023-03-05" },
          ],
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to detect occasions")
      }
      
      setUpcomingOccasions(data)
      toast.success(`Found ${data.upcomingOccasions?.length || 0} upcoming occasions!`)
    } catch (error) {
      console.error("Error detecting occasions:", error)
      const message = error instanceof Error ? error.message : "Failed to detect occasions"
      toast.error(message)
    } finally {
      setLoadingOccasions(false)
    }
  }

  const handleStartGiftCollection = (occasion: any) => {
    try {
      const params = new URLSearchParams({
        recipientName: occasion.memberName,
        occasion: occasion.occasion,
        suggestedBudget: occasion.recommendedBudget.toString(),
        giftIdea: occasion.suggestedGiftIdea,
        daysUntil: occasion.daysUntil.toString(),
        date: occasion.date,
      })

      toast.loading("Opening gift creation form...")

      router.push(`/gifts/create?${params.toString()}`)
    } catch (error) {
      console.error("[v0] Error starting gift collection:", error)
      toast.error("Failed to start gift collection")
    }
  }

  // Removed auto-detection on page load - user can click "Detect Occasions" button
  // useEffect(() => {
  //   detectOccasions()
  // }, [])

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="mb-8">
          <div className="text-center mb-6">
            <div className="flex items-center gap-3 justify-center mb-2">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#DAA520] to-[#F4C430] flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#654321]">My Groups</h1>
            </div>
            <p className="text-[#8B4513]/80 mb-3">Manage your gifting groups with AI insights</p>
            <Link href="/groups/create" className="inline-block">
              <button className="inline-flex items-center justify-center flex-shrink-0 w-full px-4 py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-full font-semibold hover:shadow-lg transition-all text-sm whitespace-nowrap">
                Create Group
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <button
              onClick={detectOccasions}
              disabled={loadingOccasions}
              className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-[#DAA520]/20 hover:border-[#DAA520] transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-[#654321] text-sm">Detect Occasions</div>
                <div className="text-xs text-[#8B4513]/70">
                  {loadingOccasions ? "Scanning..." : "Find gift opportunities"}
                </div>
              </div>
            </button>

            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-[#DAA520]/20">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#DAA520] to-[#F4C430] flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-[#654321] text-sm">
                  {groups.reduce((sum, g) => sum + g.activeGifts, 0)} Active
                </div>
                <div className="text-xs text-[#8B4513]/70">Gift collections</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-[#DAA520]/20">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-[#654321] text-sm">
                  {groups.reduce((sum, g) => sum + g.members, 0)} Members
                </div>
                <div className="text-xs text-[#8B4513]/70">Across all groups</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-[#DAA520]/20">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-[#654321] text-sm">
                  {upcomingOccasions?.upcomingOccasions?.length || 0}
                </div>
                <div className="text-xs text-[#8B4513]/70">Upcoming occasions</div>
              </div>
            </div>
          </div>
        </div>

        {upcomingOccasions && upcomingOccasions.upcomingOccasions?.length > 0 && (
          <div className="mb-8 p-6 bg-gradient-to-r from-[#DAA520]/10 to-[#F4C430]/10 rounded-xl border-2 border-[#DAA520]/30">
            <h2 className="text-xl font-bold text-[#654321] mb-4 flex items-center justify-center md:justify-start gap-2">
              Upcoming Gift Opportunities
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingOccasions.upcomingOccasions.slice(0, 3).map((occasion: any, index: number) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-[#DAA520]/20">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-[#654321]">{occasion.memberName}</h3>
                      <p className="text-sm text-[#8B4513]/70">{occasion.occasion}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        occasion.priority === "high"
                          ? "bg-red-100 text-red-700"
                          : occasion.priority === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                      }`}
                    >
                      {occasion.priority}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-[#8B4513]/70 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {occasion.daysUntil} days until {new Date(occasion.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Suggested budget: ${occasion.recommendedBudget}
                    </div>
                    <div className="flex items-center gap-1">
                      <Gift className="w-3 h-3" />
                      {occasion.suggestedGiftIdea}
                    </div>
                  </div>
                  <button
                    onClick={() => handleStartGiftCollection(occasion)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
                  >
                    Start Gift Collection
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {showInsightsPanel && aiInsights && (
          <div className="mb-8 p-6 bg-white rounded-xl border-2 border-[#DAA520]/30 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#654321] flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#DAA520]" />
                AI Group Insights
              </h2>
              <button onClick={() => setShowInsightsPanel(false)} className="text-[#8B4513]/70 hover:text-[#654321]">
                ×
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-[#F5F1E8] rounded-lg">
                <div className="text-3xl font-bold text-[#654321] mb-1">{aiInsights.healthScore}</div>
                <div className="text-sm text-[#8B4513]/70">Health Score</div>
              </div>
              <div className="text-center p-4 bg-[#F5F1E8] rounded-lg">
                <div className="text-3xl font-bold text-[#654321] mb-1 capitalize">{aiInsights.activityLevel}</div>
                <div className="text-sm text-[#8B4513]/70">Activity Level</div>
              </div>
              <div className="text-center p-4 bg-[#F5F1E8] rounded-lg">
                <div className="text-3xl font-bold text-[#654321] mb-1">{aiInsights.predictedSuccess}%</div>
                <div className="text-sm text-[#8B4513]/70">Success Rate</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-[#654321] mb-3">Key Insights</h3>
                <ul className="space-y-2">
                  {aiInsights.insights?.map((insight: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-[#8B4513]/80">
                      <Target className="w-4 h-4 text-[#DAA520] flex-shrink-0 mt-0.5" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-[#654321] mb-3">Recommendations</h3>
                <ul className="space-y-2">
                  {aiInsights.recommendations?.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-[#8B4513]/80">
                      <Sparkles className="w-4 h-4 text-[#DAA520] flex-shrink-0 mt-0.5" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Loading State */}
          {isLoadingGroups && (
            <div className="col-span-full flex justify-center py-12">
              <div className="flex items-center gap-3 text-[#8B4513]">
                <div className="w-6 h-6 border-2 border-[#DAA520] border-t-transparent rounded-full animate-spin" />
                Loading groups...
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingGroups && groups.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#DAA520]/10 flex items-center justify-center">
                <Users className="w-8 h-8 text-[#DAA520]" />
              </div>
              <h3 className="text-lg font-semibold text-[#654321] mb-2">No groups yet</h3>
              <p className="text-sm text-[#8B4513]/70 mb-4">Create your first group to start gifting together!</p>
              <Link
                href="/groups/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] font-semibold rounded-full hover:scale-105 transition-all"
              >
                <Users className="w-4 h-4" />
                Create Group
              </Link>
            </div>
          )}

          {/* Groups List */}
          {!isLoadingGroups && groups.map((group) => (
            <div key={group.id} className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 p-6">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={group.image || "/placeholder.svg"}
                  alt={group.name}
                  className="w-16 h-16 rounded-full border-2 border-[#DAA520] object-cover"
                />
                <div>
                  <h3 className="text-xl font-bold text-[#654321]">{group.name}</h3>
                  <p className="text-sm text-[#8B4513]/70 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Since {new Date(group.created).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-[#8B4513]/70">
                    <Users className="w-4 h-4" />
                    Members
                  </span>
                  <span className="font-bold text-[#654321]">{group.members}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-[#8B4513]/70">
                    <Gift className="w-4 h-4" />
                    Active Gifts
                  </span>
                  <span className="font-bold text-[#654321]">{group.activeGifts}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedGroup(group.id)
                  fetchGroupInsights(group.id)
                }}
                disabled={loadingInsights && selectedGroup === group.id}
                className="w-full px-4 py-2 mb-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white rounded-lg font-semibold hover:shadow-lg hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 border-2 border-amber-400/30"
              >
                {loadingInsights && selectedGroup === group.id ? (
                  <>Analyzing...</>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    AI Insights
                  </>
                )}
              </button>

              <Link
                href={`/groups/${group.id}`}
                className="w-full px-4 py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center text-sm"
              >
                View Group
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
