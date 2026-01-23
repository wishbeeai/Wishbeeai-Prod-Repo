"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Gift, Sparkles, ArrowRight, Check } from "lucide-react"

interface WishlistCTAProps {
  isLoggedIn: boolean
}

export function WishlistCTA({ isLoggedIn }: WishlistCTAProps) {
  const benefits = [
    "Add items from any store",
    "Share with friends & family",
    "Free forever, no hidden fees",
  ]

  return (
    <div className="py-8 sm:py-10 hidden sm:block">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 text-center max-w-xl mx-auto border-2 border-[#DAA520]/30 shadow-xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#DAA520]/20 to-transparent rounded-bl-full"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#F4C430]/20 to-transparent rounded-tr-full"></div>
        
        <div className="relative">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#DAA520] to-[#F4C430] shadow-lg mb-4">
            <Gift className="w-8 h-8 text-white" />
          </div>
          
          {/* Sparkle */}
          <Sparkles className="absolute top-0 right-1/4 w-5 h-5 text-[#F4C430] animate-pulse" />
          
          <h3 className="text-xl sm:text-2xl font-bold text-[#8B4513] mb-2">
            Want to create your own wishlist?
          </h3>
          
          <p className="text-sm text-[#A0522D] mb-6">
            Join thousands of happy users and start your wishlist today!
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#DAA520]/10 rounded-full">
                <Check className="w-3.5 h-3.5 text-[#27AE60]" />
                <span className="text-xs text-[#8B4513] font-medium">{benefit}</span>
              </div>
            ))}
          </div>
          
          <Link href={isLoggedIn ? "/wishlist/add" : "/signup"}>
            <Button className="h-14 px-10 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] hover:from-[#F4C430] hover:to-[#DAA520] text-[#654321] font-bold text-base shadow-lg hover:shadow-xl transition-all hover:scale-105 group">
              {isLoggedIn ? "Create a New Wishlist" : "Create My Wishlist — It's Free!"}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
