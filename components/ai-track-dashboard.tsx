"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  AlertTriangle,
  Shield,
  Sparkles,
  CheckCircle,
  Bell,
} from "lucide-react"

export function AITrackDashboard() {
  // Mock AI insights
  const paceAnalysis = {
    status: "on-track",
    projectedCompletion: "5 days",
    dailyAverage: "$35",
    recommendation: "Maintain current sharing strategy",
  }

  const anomalies = [
    {
      type: "warning",
      title: "Unusual Activity Detected",
      description: "3 contributions from same IP address",
      severity: "medium",
      time: "2 hours ago",
    },
    {
      type: "info",
      title: "Surge in Contributions",
      description: "50% increase after last share",
      severity: "low",
      time: "1 day ago",
    },
  ]

  const contributors = [
    { name: "Emma", amount: 50, trend: "up", verified: true },
    { name: "John", amount: 35, trend: "stable", verified: true },
    { name: "Sarah", amount: 45, trend: "up", verified: true },
    { name: "Mike", amount: 20, trend: "down", verified: false },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Contribution Pace Monitor */}
      <Card className="border-2 border-[#F4C430] shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-[#F4C430] animate-pulse" />
            <h3 className="text-lg font-bold text-gray-900">AI Pace Monitoring</h3>
          </div>

          <div className="space-y-4">
            {/* Status Card */}
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-green-800">Campaign Status</span>
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {paceAnalysis.status.toUpperCase()}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <div className="text-xs text-green-700 mb-1">Projected Completion</div>
                  <div className="text-lg font-bold text-green-900 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {paceAnalysis.projectedCompletion}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-green-700 mb-1">Daily Average</div>
                  <div className="text-lg font-bold text-green-900 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {paceAnalysis.dailyAverage}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-800">AI Recommendation</span>
              </div>
              <p className="text-sm text-blue-700">{paceAnalysis.recommendation}</p>
            </div>

            {/* Contributor Activity */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#F4C430]" />
                Recent Contributors
              </h4>
              <div className="space-y-2">
                {contributors.map((contributor, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#DAA520] to-[#F4C430] rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {contributor.name[0]}
                      </div>
                      <span className="font-semibold text-gray-900">{contributor.name}</span>
                      {contributor.verified && <Shield className="w-4 h-4 text-green-600" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">${contributor.amount}</span>
                      {contributor.trend === "up" ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : contributor.trend === "down" ? (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      ) : (
                        <div className="w-4 h-1 bg-gray-400 rounded" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Anomaly Detection */}
      <Card className="border-2 border-orange-400 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-500 animate-pulse" />
            <h3 className="text-lg font-bold text-gray-900">AI Anomaly Detection</h3>
          </div>

          <div className="space-y-3">
            {anomalies.map((anomaly, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border-2 ${
                  anomaly.severity === "medium" ? "bg-orange-50 border-orange-200" : "bg-blue-50 border-blue-200"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {anomaly.type === "warning" ? (
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                    ) : (
                      <Bell className="w-5 h-5 text-blue-600" />
                    )}
                    <h4
                      className={`font-semibold ${anomaly.severity === "medium" ? "text-orange-800" : "text-blue-800"}`}
                    >
                      {anomaly.title}
                    </h4>
                  </div>
                  <Badge variant={anomaly.severity === "medium" ? "destructive" : "secondary"} className="text-xs">
                    {anomaly.severity.toUpperCase()}
                  </Badge>
                </div>
                <p className={`text-sm mb-2 ${anomaly.severity === "medium" ? "text-orange-700" : "text-blue-700"}`}>
                  {anomaly.description}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {anomaly.time}
                </div>
              </div>
            ))}
          </div>

          {/* Security Status */}
          <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">Security Status</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-700">Fraud Detection</span>
                <Badge className="bg-green-500 text-white text-xs">Active</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-700">Payment Verification</span>
                <Badge className="bg-green-500 text-white text-xs">Active</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-700">Suspicious Activity Monitor</span>
                <Badge className="bg-green-500 text-white text-xs">Active</Badge>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI continuously monitors for unusual patterns and security threats
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
