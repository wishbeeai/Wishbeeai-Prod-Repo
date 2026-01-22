"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Gift, Users, ShoppingBag } from "lucide-react"

export function HowWishbeeWorks() {
  const [isExpanded, setIsExpanded] = useState(true)

  const steps = [
    {
      icon: Gift,
      number: "1",
      title: "Add gifts you love",
      color: "text-[#DAA520]",
      bgColor: "bg-[#FFF8DC]",
    },
    {
      icon: Users,
      number: "2",
      title: "Friends contribute together",
      color: "text-[#D2691E]",
      bgColor: "bg-[#FFEFD5]",
    },
    {
      icon: ShoppingBag,
      number: "3",
      title: "One special gift is purchased",
      color: "text-[#B8860B]",
      bgColor: "bg-[#FFF8DC]",
    },
  ]

  return (
    <div className="border-t border-b border-[#DAA520]/20 py-6 sm:py-8">
      {/* Header - Collapsible on mobile */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center gap-2 sm:cursor-default"
      >
        <span className="text-xl">🐝</span>
        <h3 className="text-lg sm:text-xl font-semibold text-[#8B4513]">
          How Wishbee Works
        </h3>
        <span className="sm:hidden text-[#A0522D]">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </span>
      </button>

      {/* Steps - Collapsible on mobile */}
      <div
        className={`mt-6 overflow-hidden transition-all duration-300 ${
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0 sm:max-h-96 sm:opacity-100"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 md:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-3 sm:flex-col sm:text-center">
              {/* Icon with number badge */}
              <div className="relative">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${step.bgColor} flex items-center justify-center border-2 border-[#DAA520]/30`}>
                  <step.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${step.color}`} />
                </div>
                {/* Number badge */}
                <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] text-xs font-bold flex items-center justify-center shadow-sm">
                  {step.number}
                </div>
              </div>
              
              {/* Step title */}
              <p className="text-sm sm:text-base text-[#8B4513] font-medium sm:mt-3">
                {step.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
