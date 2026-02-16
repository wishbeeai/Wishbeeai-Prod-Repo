"use client"

import { Activity, ArrowRightLeft, Users } from "lucide-react"

const features = [
  {
    icon: Activity,
    title: "Automatic Tracking",
    description: "Real-time monitoring of all gift contributions and fund allocations with detailed activity logs.",
  },
  {
    icon: ArrowRightLeft,
    title: "Withdrawals & Transfers",
    description: "Seamlessly transfer pooled funds or process withdrawals with secure payment processing.",
  },
  {
    icon: Users,
    title: "User Management",
    description: "Manage contributors, set permissions, and control access to your group gifting campaigns.",
  },
]

export function TrackManage() {
  return (
    <section className="relative py-6 sm:py-8 md:py-10 lg:py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#F5F1E8] via-[#EDE6D6] to-[#F5F1E8] overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#DAA520]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#F4C430]/10 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#654321] mb-4 sm:mb-6">
            Track & Manage
          </h2>
          <p className="text-xs sm:text-sm md:text-lg text-[#8B4513]/80 max-w-xl mx-auto leading-relaxed font-light text-balance">
            Always-there data and tools to make managing easy
          </p>

          {/* Decorative element */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="w-2 h-2 rounded-full bg-[#DAA520]"></div>
            <div className="w-12 h-1 bg-gradient-to-r from-[#DAA520] to-transparent rounded-full"></div>
            <div className="w-2 h-2 rounded-full bg-[#F4C430]"></div>
            <div className="w-12 h-1 bg-gradient-to-l from-[#F4C430] to-transparent rounded-full"></div>
            <div className="w-2 h-2 rounded-full bg-[#DAA520]/60"></div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {features.map((feature, index) => {
            const Icon = feature.icon

            return (
              <div
                key={index}
                className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 hover:shadow-[0_20px_60px_rgba(139,69,19,0.15)] transition-all duration-500 border border-[#DAA520]/20 hover:border-[#F4C430]/50 hover:-translate-y-2"
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#F4C430]/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-500"></div>

                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#DAA520]/15 to-transparent rounded-tr-2xl rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10">
                  <div className="mb-5 sm:mb-6 flex justify-center lg:justify-start">
                    <div className="relative inline-block">
                      {/* Multiple glow effects */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#DAA520] to-[#F4C430] rounded-2xl blur-2xl opacity-0 group-hover:opacity-60 transition-all duration-500 animate-pulse"></div>
                      <div className="absolute -inset-2 bg-gradient-to-br from-[#F4C430]/30 to-[#DAA520]/30 rounded-2xl blur-md opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>

                      {/* Icon background with honey gradient */}
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#DAA520] via-[#F4C430] to-[#FFD700] flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-[0_10px_30px_rgba(218,165,32,0.4)]">
                        {/* Inner gradient overlay for depth */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-white/20 rounded-2xl"></div>

                        {/* Icon with enhanced styling */}
                        <Icon
                          className="relative w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] group-hover:scale-125 group-hover:rotate-12 transition-all duration-500"
                          strokeWidth={2.5}
                        />

                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-2xl opacity-50"></div>
                      </div>

                      {/* Decorative corner dots */}
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#F4C430] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 animate-bounce"></div>
                      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#DAA520] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100"></div>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-base sm:text-lg font-bold text-[#654321] mb-3 group-hover:text-[#8B4513] transition-colors duration-300 tracking-tight text-center lg:text-left">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#8B4513]/70 leading-relaxed font-light text-center lg:text-left">
                    {feature.description}
                  </p>

                  {/* Hover arrow */}
                  <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-2 justify-center lg:justify-start">
                    <span className="text-xs font-medium text-[#DAA520]">Learn more</span>
                    <svg className="w-4 h-4 text-[#DAA520]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
