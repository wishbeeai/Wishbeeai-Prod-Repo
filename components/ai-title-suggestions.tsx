"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Wand2, RefreshCw, Check } from "lucide-react"

interface AITitleSuggestionsProps {
  productName?: string
  onSelect?: (title: string, description: string) => void
}

export function AITitleSuggestions({ productName = "Espresso Machine", onSelect }: AITitleSuggestionsProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Mock AI-generated suggestions
  const suggestions = [
    {
      title: `Help Us Get the Perfect ${productName}!`,
      description: `We're pooling together to get an amazing ${productName}. Every contribution brings us closer to our goal. Join us in making this dream a reality!`,
    },
    {
      title: `${productName} Group Gift Fund`,
      description: `Let's chip in together for this incredible ${productName}. Your contribution, no matter the size, makes a big difference. Thank you for being part of this!`,
    },
    {
      title: `Team Up for the Ultimate ${productName}`,
      description: `Together we can make this happen! We're raising funds for a top-quality ${productName}. Add your support and be part of something special.`,
    },
  ]

  const handleRegenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
    }, 1500)
  }

  const handleSelect = (index: number) => {
    setSelectedIndex(index)
    if (onSelect) {
      onSelect(suggestions[index].title, suggestions[index].description)
    }
  }

  return (
    <Card className="w-full border-2 border-[#F4C430] shadow-xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-[#F4C430] animate-pulse" />
            <h3 className="text-lg font-bold text-gray-900">AI Title Suggestions</h3>
          </div>
          <Button
            onClick={handleRegenerate}
            disabled={isGenerating}
            variant="outline"
            size="sm"
            className="border-[#F4C430] text-[#8B4513] hover:bg-[#F4C430]/10 bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isGenerating ? "animate-spin" : ""}`} />
            Regenerate
          </Button>
        </div>

        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSelect(index)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                selectedIndex === index
                  ? "border-[#F4C430] bg-[#FFF9E6] shadow-lg"
                  : "border-gray-200 hover:border-[#F4C430]/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#F4C430]" />
                    {suggestion.title}
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{suggestion.description}</p>
                </div>
                {selectedIndex === index && (
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 animate-in zoom-in-95" />
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3" />
          AI-crafted titles optimized for maximum engagement
        </p>
      </CardContent>
    </Card>
  )
}
