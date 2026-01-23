"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Gift, Users, ShoppingBag, ArrowRight } from "lucide-react"

export function HowWishbeeWorks() {
  const [isExpanded, setIsExpanded] = useState(true)

  const steps = [
    {
      icon: Gift,
      number: "1",
      title: "Add gifts you love",
      description: "Browse any store and add items",
      color: "from-[#DAA520] to-[#F4C430]",
      iconColor: "text-white",
    },
    {
      icon: Users,
      number: "2",
      title: "Friends contribute together",
      description: "Share your wishlist with friends",
      color: "from-[#FF6B6B] to-[#FF8E53]",
      iconColor: "text-white",
    },
    {
      icon: ShoppingBag,
      number: "3",
      title: "One perfect gift is purchased",
      description: "Receive exactly what you wished for",
      color: "from-[#27AE60] to-[#2ECC71]",
      iconColor: "text-white",
    },
  ]

  return (
    <div className="py-8 sm:py-10">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-[#DAA520]/20 shadow-lg p-6 sm:p-8">
        {/* Header - Collapsible on mobile */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-3 sm:cursor-default group"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] flex items-center justify-center shadow-md">
            <span className="text-base">🐝</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-[#8B4513]">
            How Wishbee Works
          </h3>
          <span className="sm:hidden text-[#A0522D] p-1 rounded-full bg-[#DAA520]/10">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </span>
        </button>

        {/* Steps - Collapsible on mobile */}
        <div
          className={`mt-8 overflow-hidden transition-all duration-300 ${
            isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 sm:max-h-[500px] sm:opacity-100"
          }`}
        >
          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4 sm:gap-6">
            {steps.map((step, index) => (
              <div key={index} className="flex-1 relative">
                <div className="flex sm:flex-col items-center sm:text-center gap-4 sm:gap-0 bg-gradient-to-br from-[#FFF8DC] to-white rounded-xl p-4 sm:p-5 border border-[#DAA520]/20 hover:border-[#DAA520]/40 transition-all hover:shadow-md">
                  {/* Icon with number badge */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                      <step.icon className={`w-7 h-7 sm:w-8 sm:h-8 ${step.iconColor}`} />
                    </div>
                    {/* Number badge */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#8B4513] text-white text-xs font-bold flex items-center justify-center shadow-md border-2 border-white">
                      {step.number}
                    </div>
                  </div>
                  
                  {/* Step content */}
                  <div className="flex-1 sm:mt-4">
                    <p className="text-sm sm:text-base text-[#8B4513] font-bold mb-1">
                      {step.title}
                    </p>
                    <p className="text-xs text-[#A0522D]">
                      {step.description}
                    </p>
                  </div>
                </div>
                
                {/* Arrow connector (hidden on mobile and last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden sm:flex absolute top-1/2 -right-5 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-4 h-4 text-[#DAA520]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
