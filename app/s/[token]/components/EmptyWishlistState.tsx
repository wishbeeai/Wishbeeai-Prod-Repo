"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Gift, Bell, ThumbsUp, Sparkles, Heart } from "lucide-react"
import { EmailNotifyModal } from "./EmailNotifyModal"
import { SuggestGiftModal } from "./SuggestGiftModal"

interface EmptyWishlistStateProps {
  shareId: string
  wishlistTitle: string
}

export function EmptyWishlistState({ shareId, wishlistTitle }: EmptyWishlistStateProps) {
  const [showNotifyModal, setShowNotifyModal] = useState(false)
  const [showSuggestModal, setShowSuggestModal] = useState(false)

  return (
    <div className="text-center py-8 sm:py-12">
      {/* Empty State Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-[#DAA520]/30 shadow-xl p-8 sm:p-10 max-w-lg mx-auto">
        {/* Animated Gift Illustration */}
        <div className="mb-8 relative">
          <div className="relative inline-block">
            {/* Animated rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border-2 border-[#DAA520]/20 animate-ping"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-40 rounded-full border border-[#F4C430]/10 animate-pulse"></div>
            </div>
            
            {/* Main gift box */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full drop-shadow-lg"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Box body */}
                <rect x="15" y="40" width="70" height="50" rx="4" fill="url(#boxGradient)" stroke="#B8860B" strokeWidth="2"/>
                {/* Box lid */}
                <rect x="10" y="30" width="80" height="15" rx="3" fill="url(#lidGradient)" stroke="#B8860B" strokeWidth="2"/>
                {/* Ribbon vertical */}
                <rect x="45" y="30" width="10" height="60" fill="#FF6B6B"/>
                {/* Ribbon horizontal */}
                <rect x="10" y="35" width="80" height="6" fill="#FF6B6B"/>
                {/* Bow */}
                <ellipse cx="40" cy="28" rx="10" ry="7" fill="#FF6B6B"/>
                <ellipse cx="60" cy="28" rx="10" ry="7" fill="#FF6B6B"/>
                <circle cx="50" cy="30" r="5" fill="#E74C3C"/>
                
                <defs>
                  <linearGradient id="boxGradient" x1="15" y1="40" x2="85" y2="90" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#DAA520"/>
                    <stop offset="1" stopColor="#B8860B"/>
                  </linearGradient>
                  <linearGradient id="lidGradient" x1="10" y1="30" x2="90" y2="45" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F4C430"/>
                    <stop offset="1" stopColor="#DAA520"/>
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Floating sparkles */}
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-[#F4C430] animate-bounce" />
              <Heart className="absolute -bottom-1 -left-3 w-5 h-5 text-[#FF6B6B] animate-pulse fill-current" />
              <div className="absolute top-0 left-0 w-3 h-3 rounded-full bg-[#DAA520] animate-ping"></div>
            </div>
          </div>
        </div>

        {/* Primary Text */}
        <h2 className="text-xl sm:text-2xl font-bold text-[#8B4513] mb-3">
          This wishlist is just getting started
        </h2>
        
        {/* Secondary Text */}
        <p className="text-sm sm:text-base text-[#A0522D] mb-8 leading-relaxed">
          Gifts will appear here once they&apos;re added.<br className="hidden sm:block" />
          <span className="text-[#8B6914] font-medium">Check back soon!</span>
        </p>

        {/* Primary Actions */}
        <div className="flex flex-col gap-3 mb-6">
          <Link href={`/signup?clone=${shareId}`} className="w-full">
            <Button className="w-full h-12 sm:h-14 px-6 rounded-xl bg-gradient-to-r from-[#DAA520] to-[#F4C430] hover:from-[#F4C430] hover:to-[#DAA520] text-[#654321] font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
              <Gift className="w-5 h-5 mr-2" />
              Create a Similar Wishlist
            </Button>
          </Link>
          
          <Button
            variant="outline"
            onClick={() => setShowNotifyModal(true)}
            className="w-full h-12 px-5 rounded-xl border-2 border-[#DAA520]/50 text-[#8B4513] hover:bg-[#DAA520]/10 hover:border-[#DAA520] font-semibold text-sm transition-all"
          >
            <Bell className="w-4 h-4 mr-2 text-[#DAA520]" />
            Notify Me When Items Are Added
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-5">
          <div className="flex-1 h-px bg-[#DAA520]/20"></div>
          <span className="text-xs text-[#A0522D] font-medium">OR</span>
          <div className="flex-1 h-px bg-[#DAA520]/20"></div>
        </div>

        {/* Optional Action */}
        <button
          onClick={() => setShowSuggestModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm text-[#8B4513] hover:text-[#654321] font-semibold rounded-full bg-[#DAA520]/10 hover:bg-[#DAA520]/20 transition-all"
        >
          <ThumbsUp className="w-4 h-4 text-[#DAA520]" />
          Suggest a Gift to the Owner
        </button>
      </div>

      {/* Modals */}
      <EmailNotifyModal
        isOpen={showNotifyModal}
        onClose={() => setShowNotifyModal(false)}
        shareId={shareId}
        wishlistTitle={wishlistTitle}
      />
      
      <SuggestGiftModal
        isOpen={showSuggestModal}
        onClose={() => setShowSuggestModal(false)}
        shareId={shareId}
      />
    </div>
  )
}
