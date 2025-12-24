"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Heart, RefreshCw, Copy, Check } from "lucide-react"

interface AIGreetingGeneratorProps {
  recipientName?: string
  occasion?: string
  onSelect?: (message: string) => void
}

export function AIGreetingGenerator({
  recipientName = "Sarah",
  occasion = "birthday",
  onSelect,
}: AIGreetingGeneratorProps) {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  // AI-generated greeting messages
  const greetings = [
    `Happy ${occasion}, ${recipientName}! 🎉 Hope this gift brings as much joy to you as you bring to all of us. Enjoy your special day!`,
    `Wishing you the most amazing ${occasion}, ${recipientName}! 🎂 You deserve all the happiness in the world. Enjoy this gift from all of us!`,
    `${recipientName}, happy ${occasion}! 🎁 We all chipped in because you're simply the best. Hope you love it as much as we love celebrating you!`,
    `To our wonderful ${recipientName}, happy ${occasion}! ✨ May this gift remind you how much you mean to us. Celebrate big!`,
  ]

  const handleRegenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
    }, 1500)
  }

  const handleSelect = (message: string) => {
    setSelectedMessage(message)
    if (onSelect) {
      onSelect(message)
    }
  }

  const handleCopy = () => {
    if (selectedMessage) {
      navigator.clipboard.writeText(selectedMessage)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card className="w-full border-2 border-[#F4C430] shadow-xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-[#F4C430] animate-pulse" />
            <h3 className="text-lg font-bold text-gray-900">AI Greeting Generator</h3>
          </div>
          <Button
            onClick={handleRegenerate}
            disabled={isGenerating}
            variant="outline"
            size="sm"
            className="border-[#F4C430] text-[#8B4513] hover:bg-[#F4C430]/10 bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isGenerating ? "animate-spin" : ""}`} />
            New Ideas
          </Button>
        </div>

        <div className="space-y-3 mb-4">
          {greetings.map((greeting, index) => (
            <div
              key={index}
              onClick={() => handleSelect(greeting)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                selectedMessage === greeting
                  ? "border-[#F4C430] bg-[#FFF9E6] shadow-lg"
                  : "border-gray-200 hover:border-[#F4C430]/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-gray-700 leading-relaxed flex-1">{greeting}</p>
                {selectedMessage === greeting && (
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 animate-in zoom-in-95" />
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedMessage && (
          <div className="animate-in fade-in-50 slide-in-from-bottom-5">
            <Button
              onClick={handleCopy}
              className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#8B4513] hover:from-[#F4C430] hover:to-[#DAA520] shadow-lg hover:shadow-xl"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Copied to Clipboard!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  Use This Message
                </>
              )}
            </Button>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-4 text-center flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3" />
          AI-crafted messages personalized for {recipientName}'s {occasion}
        </p>
      </CardContent>
    </Card>
  )
}
