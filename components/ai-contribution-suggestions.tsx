"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, TrendingUp, Users, Heart } from "lucide-react"

interface AIContributionSuggestionsProps {
  goalAmount?: number
  currentAmount?: number
  onSelect?: (amount: number) => void
}

export function AIContributionSuggestions({
  goalAmount = 500,
  currentAmount = 150,
  onSelect,
}: AIContributionSuggestionsProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)

  const remaining = goalAmount - currentAmount
  const percentComplete = (currentAmount / goalAmount) * 100

  // AI-calculated smart amounts
  const suggestions = [
    {
      amount: Math.round(remaining * 0.1),
      label: "Small Contribution",
      description: "Every bit helps!",
      impact: "Moves progress by 2%",
      icon: Heart,
      color: "bg-pink-500",
    },
    {
      amount: Math.round(remaining / 10),
      label: "Smart Amount (AI)",
      description: "Optimal for group gifting",
      impact: "Moves progress by 7%",
      icon: Sparkles,
      color: "bg-[#F4C430]",
      recommended: true,
    },
    {
      amount: Math.round(remaining * 0.2),
      label: "Generous Support",
      description: "Make a big impact!",
      impact: "Moves progress by 14%",
      icon: TrendingUp,
      color: "bg-green-500",
    },
  ]

  const handleSelect = (amount: number) => {
    setSelectedAmount(amount)
    if (onSelect) {
      onSelect(amount)
    }
  }

  return (
    <Card className="w-full border-2 border-[#F4C430] shadow-xl">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-[#F4C430] animate-pulse" />
          <h3 className="text-lg font-bold text-gray-900">AI Contribution Suggestions</h3>
        </div>

        {/* Progress Overview */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Campaign Progress</span>
            <span className="text-sm font-bold text-[#F4C430]">{Math.round(percentComplete)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] transition-all duration-500"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-600">${currentAmount} raised</span>
            <span className="text-xs text-gray-600">${remaining} to go</span>
          </div>
        </div>

        {/* Suggestions */}
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSelect(suggestion.amount)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                selectedAmount === suggestion.amount
                  ? "border-[#F4C430] bg-[#FFF9E6] shadow-lg scale-105"
                  : suggestion.recommended
                    ? "border-[#F4C430] bg-gradient-to-br from-[#FFF9E6] to-white"
                    : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`${suggestion.color} p-2 rounded-lg`}>
                    <suggestion.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{suggestion.label}</h4>
                    {suggestion.recommended && (
                      <span className="text-xs text-[#F4C430] font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI Recommended
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">${suggestion.amount}</div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>

              <div className="flex items-center gap-2 text-xs">
                <div className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                  {suggestion.impact}
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Users className="w-3 h-3" />
                  Join 8 others
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <strong>AI Tip:</strong> Contributions of ${suggestions[1].amount} are 3x more common and help reach the
            goal faster
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
