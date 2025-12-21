"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Target, Users, DollarSign, Sparkles, Check } from "lucide-react"

interface AIGoalOptimizerProps {
  productPrice?: number
  onApply?: (goal: number) => void
}

export default function AIGoalOptimizer({ productPrice = 299.99, onApply }: AIGoalOptimizerProps) {
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null)

  // AI-calculated optimal goals
  const recommendations = [
    {
      amount: Math.round(productPrice * 1.1),
      label: "Conservative",
      description: "Safe goal with buffer for fees",
      probability: 95,
      contributors: "8-12",
      icon: Target,
      color: "text-green-600",
    },
    {
      amount: Math.round(productPrice),
      label: "Optimal (AI Recommended)",
      description: "Best balance of achievability and speed",
      probability: 88,
      contributors: "10-15",
      icon: Sparkles,
      color: "text-[#F4C430]",
      recommended: true,
    },
    {
      amount: Math.round(productPrice * 0.9),
      label: "Aggressive",
      description: "Quick funding, higher engagement",
      probability: 82,
      contributors: "12-18",
      icon: TrendingUp,
      color: "text-orange-600",
    },
  ]

  const handleApply = (amount: number) => {
    setSelectedGoal(amount)
    if (onApply) {
      onApply(amount)
    }
  }

  return (
    <Card className="w-full border-2 border-[#F4C430] shadow-xl">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-6 h-6 text-[#F4C430] animate-pulse" />
          <h3 className="text-lg font-bold text-gray-900">AI Goal Optimization</h3>
        </div>

        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedGoal === rec.amount
                  ? "border-[#F4C430] bg-[#FFF9E6] shadow-lg"
                  : rec.recommended
                    ? "border-[#F4C430] bg-gradient-to-br from-[#FFF9E6] to-white shadow-md"
                    : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <rec.icon className={`w-5 h-5 ${rec.color}`} />
                  <div>
                    <h4 className="font-bold text-gray-900">{rec.label}</h4>
                    {rec.recommended && (
                      <span className="text-xs text-[#F4C430] font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI Recommended
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">${rec.amount}</div>
                  <div className="text-xs text-gray-500">{rec.probability}% success rate</div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3">{rec.description}</p>

              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {rec.contributors} contributors
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />${Math.round(rec.amount / 12)}-${Math.round(rec.amount / 8)} per
                  person
                </div>
              </div>

              <Button
                onClick={() => handleApply(rec.amount)}
                className={`w-full py-2 rounded-lg font-semibold transition-all ${
                  selectedGoal === rec.amount
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : rec.recommended
                      ? "bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#8B4513] hover:from-[#F4C430] hover:to-[#DAA520]"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {selectedGoal === rec.amount ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Applied
                  </>
                ) : (
                  "Apply This Goal"
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <strong>AI Insight:</strong> Based on similar campaigns, the optimal goal achieves funding 23% faster
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
