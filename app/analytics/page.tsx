"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Users,
  Gift,
  Brain,
  Target,
  Award,
  Sparkles,
  BarChart3,
  PieChart,
  Activity,
  Download,
  Share2,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d")
  const [aiInsights, setAiInsights] = useState<any>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)

  // Mock analytics data
  const [analyticsData, setAnalyticsData] = useState({
    totalGifts: 24,
    totalContributed: 3450,
    totalReceived: 2890,
    activeGroups: 5,
    averageContribution: 143.75,
    successRate: 92,
    topContributor: "Family Circle",
    mostPopularOccasion: "Birthdays",
  })

  const [contributionTrend, setContributionTrend] = useState([
    { month: "Jan", sent: 400, received: 240 },
    { month: "Feb", sent: 300, received: 139 },
    { month: "Mar", sent: 200, received: 380 },
    { month: "Apr", sent: 278, received: 390 },
    { month: "May", sent: 189, received: 480 },
    { month: "Jun", sent: 239, received: 380 },
  ])

  const [giftsByCategory, setGiftsByCategory] = useState([
    { name: "Birthdays", value: 45, color: "#F4C430" }, // Bright gold
    { name: "Anniversaries", value: 25, color: "#DAA520" }, // Goldenrod
    { name: "Weddings", value: 15, color: "#FF8C42" }, // Warm orange
    { name: "Holidays", value: 10, color: "#B8860B" }, // Dark goldenrod
    { name: "Other", value: 5, color: "#D2691E" }, // Chocolate/copper
  ])

  const [topContributors, setTopContributors] = useState([
    { name: "Family Circle", gifts: 12, amount: 1200 },
    { name: "Work Friends", gifts: 8, amount: 850 },
    { name: "College Buddies", gifts: 6, amount: 720 },
    { name: "Neighbors", gifts: 4, amount: 480 },
    { name: "Sports Team", gifts: 3, amount: 360 },
  ])

  const fetchAIInsights = async () => {
    setLoadingInsights(true)
    try {
      const response = await fetch("/api/ai/analytics-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analyticsData,
          contributionTrend,
          timeRange,
        }),
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        console.warn("AI insights fetch failed:", response.status, errBody)
        toast.error("AI insights temporarily unavailable")
        return
      }

      const data = await response.json()
      if (data.error) {
        toast.error("AI insights temporarily unavailable")
        return
      }
      setAiInsights(data)
      toast.success("AI insights generated successfully!")
    } catch (error) {
      console.warn("AI insights fetch error:", error)
      toast.error("AI insights temporarily unavailable")
    } finally {
      setLoadingInsights(false)
    }
  }

  const exportData = () => {
    toast.success("Exporting analytics data as CSV...")
    setTimeout(() => {
      toast.success("Analytics data exported successfully!")
    }, 1500)
  }

  const shareAnalytics = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Wishbee.ai Analytics",
          text: `Check out my gifting analytics: ${analyticsData.totalGifts} gifts, $${analyticsData.totalContributed} contributed!`,
          url: window.location.href,
        })
        toast.success("Analytics shared successfully!")
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          navigator.clipboard.writeText(window.location.href)
          toast.success("🐝 Link copied!", {
            style: { background: 'linear-gradient(to right, #FEF3C7, #FDE68A, #F4C430)', color: '#654321', border: '2px solid #DAA520' }
          })
        }
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success("🐝 Link copied!", {
        style: { background: 'linear-gradient(to right, #FEF3C7, #FDE68A, #F4C430)', color: '#654321', border: '2px solid #DAA520' }
      })
    }
  }

  const refreshData = () => {
    toast.success("Refreshing analytics data...")
    setTimeout(() => {
      toast.success("Analytics data refreshed!")
    }, 1000)
  }

  useEffect(() => {
    fetchAIInsights()
  }, [timeRange])

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#654321] mb-2 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-[#DAA520]" />
              Analytics Dashboard
            </h1>
            <p className="text-sm sm:text-base text-[#8B4513]/80">
              Insights into your gifting patterns and contributions
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-white border-2 border-[#DAA520]/20 rounded-lg hover:border-[#DAA520] transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={shareAnalytics}
              className="px-4 py-2 bg-white border-2 border-[#DAA520]/20 rounded-lg hover:border-[#DAA520] transition-all flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={exportData}
              className="px-4 py-2 bg-white border-2 border-[#DAA520]/20 rounded-lg hover:border-[#DAA520] transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Time Range Filter */}
        <div className="flex gap-0.5 sm:gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { value: "7d", label: "7 Days" },
            { value: "30d", label: "30 Days" },
            { value: "90d", label: "90 Days" },
            { value: "1y", label: "1 Year" },
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value as any)}
              className={`px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-sm md:text-base font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                timeRange === range.value
                  ? "bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F]"
                  : "bg-white text-[#8B5A3C] border-2 border-[#DAA520]/20 hover:border-[#DAA520]"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* AI Insights Panel */}
        {aiInsights && (
          <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 rounded-xl border-2 border-amber-200 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-full">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-[#654321]">AI-Powered Insights</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-[#654321] mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-600" />
                  Key Findings
                </h3>
                <ul className="space-y-2">
                  {aiInsights.keyFindings?.map((finding: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-[#8B4513]">
                      <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      {finding}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-[#654321] mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  Recommendations
                </h3>
                <ul className="space-y-2">
                  {aiInsights.recommendations?.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-[#8B4513]">
                      <Activity className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 p-4 bg-white/80 rounded-lg">
              <p className="text-sm text-[#654321] font-semibold mb-1">Predicted Trend:</p>
              <p className="text-sm text-[#8B4513]">{aiInsights.predictedTrend}</p>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-white to-amber-50 rounded-xl shadow-md border-2 border-[#DAA520]/30 p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-gradient-to-br from-[#DAA520] to-[#F4C430] rounded-xl shadow-md">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#654321] mb-1">
              {analyticsData.totalGifts}
            </div>
            <div className="text-xs sm:text-sm text-[#8B4513]/70 font-medium">Total Gifts</div>
          </div>

          <div className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-md border-2 border-emerald-300/30 p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-md">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#654321] mb-1">
              ${analyticsData.totalContributed}
            </div>
            <div className="text-xs sm:text-sm text-[#8B4513]/70 font-medium">Total Contributed</div>
          </div>

          <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl shadow-md border-2 border-orange-300/30 p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-md">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="p-2 bg-amber-100 rounded-full">
                <Activity className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <div className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#654321] mb-1">
              {analyticsData.activeGroups}
            </div>
            <div className="text-xs sm:text-sm text-[#8B4513]/70 font-medium">Active Groups</div>
          </div>

          <div className="bg-gradient-to-br from-white to-yellow-50 rounded-xl shadow-md border-2 border-yellow-300/30 p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl shadow-md">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#654321] mb-1">
              {analyticsData.successRate}%
            </div>
            <div className="text-xs sm:text-sm text-[#8B4513]/70 font-medium">Success Rate</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Contribution Trend */}
          <div className="bg-white rounded-xl shadow-md border-2 border-[#DAA520]/20 p-6">
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#654321] mb-4 flex items-center justify-start gap-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#DAA520]" />
              Contribution Trend
            </h3>
            <div className="flex justify-start items-center">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={contributionTrend} margin={{ left: -20, right: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 9 }} interval={0} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="sent" stroke="#DAA520" strokeWidth={2} name="Sent" />
                  <Line type="monotone" dataKey="received" stroke="#B8860B" strokeWidth={2} name="Received" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gifts by Category */}
          <div className="bg-white rounded-xl shadow-md border-2 border-[#DAA520]/20 p-6">
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#654321] mb-4 flex items-center justify-start gap-2">
              <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-[#DAA520]" />
              Gifts by Category
            </h3>
            <div className="flex justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={giftsByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {giftsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#F5F1E8",
                      border: "2px solid #DAA520",
                      borderRadius: "8px",
                      padding: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "10px" }} iconSize={8} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Contributors */}
        <div className="bg-white rounded-xl shadow-md border-2 border-[#DAA520]/20 p-6 mb-8">
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#654321] mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#DAA520]" />
            Top Contributing Groups
          </h3>
          <div className="space-y-3">
            {topContributors.map((contributor, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-[#F5F1E8] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] flex items-center justify-center text-[#3B2F0F] font-bold text-[10px] sm:text-sm md:text-base">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-bold text-[#654321] text-xs sm:text-sm md:text-base">{contributor.name}</div>
                    <div className="text-[10px] sm:text-xs md:text-sm text-[#8B4513]/70">{contributor.gifts} gifts</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-[#654321]">
                    ${contributor.amount}
                  </div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-[#8B4513]/70">contributed</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generate AI Insights Button */}
        <div className="text-center">
          <button
            onClick={fetchAIInsights}
            disabled={loadingInsights}
            className="px-3 py-2 sm:px-6 sm:py-2.5 md:px-8 md:py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white rounded-full font-bold hover:shadow-lg hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50 border-2 border-amber-400/30 text-xs sm:text-sm md:text-base"
          >
            {loadingInsights ? (
              <>
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 animate-spin" />
                <span className="hidden sm:inline">Generating AI Insights...</span>
                <span className="sm:hidden">Generating...</span>
              </>
            ) : (
              <>
                <Brain className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                <span>Refresh AI Insights</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
