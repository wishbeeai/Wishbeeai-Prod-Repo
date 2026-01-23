"use client"

import { Star, Users, Gift, Heart } from "lucide-react"

export function SocialProof() {
  const stats = [
    { icon: Users, value: "50K+", label: "Happy Users" },
    { icon: Gift, value: "100K+", label: "Gifts Given" },
    { icon: Heart, value: "4.9", label: "Rating", isStar: true },
  ]

  return (
    <div className="py-6 sm:py-8">
      <div className="bg-gradient-to-r from-[#8B4513] via-[#A0522D] to-[#8B4513] rounded-2xl p-6 sm:p-8 shadow-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 rounded-full mb-3">
            <span className="text-lg">🐝</span>
            <span className="text-sm font-semibold text-white">Trusted Platform</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Trusted by thousands of gift-givers
          </h3>
          <p className="text-sm text-[#F4C430] font-medium">
            Group gifting made simple and fun.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 mb-2">
                {stat.isStar ? (
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-[#F4C430] fill-current" />
                ) : (
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#F4C430]" />
                )}
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-white">{stat.value}</p>
              <p className="text-[10px] sm:text-xs text-white/80 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Testimonial snippet */}
        <div className="mt-6 pt-6 border-t border-white/20">
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-4 h-4 text-[#F4C430] fill-current" />
            ))}
          </div>
          <p className="text-sm text-white/90 text-center italic max-w-md mx-auto">
            &ldquo;Wishbee made it so easy to organize a group gift for my friend&apos;s birthday!&rdquo;
          </p>
          <p className="text-xs text-[#F4C430] text-center mt-2 font-medium">
            — Sarah M., Happy User
          </p>
        </div>
      </div>
    </div>
  )
}
