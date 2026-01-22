"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Gift, Bell, ThumbsUp } from "lucide-react"
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
      {/* Empty State Illustration */}
      <div className="mb-6 sm:mb-8">
        <div className="relative inline-block">
          {/* Gift Box Illustration - Warm Colors */}
          <svg
            viewBox="0 0 200 180"
            className="w-48 h-44 sm:w-56 sm:h-52 mx-auto"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Confetti */}
            <circle cx="40" cy="30" r="4" fill="#F4C430" />
            <circle cx="160" cy="25" r="3" fill="#DAA520" />
            <circle cx="30" cy="70" r="3" fill="#FF8C00" />
            <circle cx="170" cy="60" r="4" fill="#F4C430" />
            <rect x="50" y="20" width="6" height="6" fill="#DAA520" transform="rotate(45 53 23)" />
            <rect x="145" y="45" width="5" height="5" fill="#F4C430" transform="rotate(30 147 47)" />
            
            {/* Box Lid */}
            <path
              d="M40 80 L100 50 L160 80 L100 110 Z"
              fill="#5DADE2"
              stroke="#3498DB"
              strokeWidth="2"
            />
            
            {/* Box Front Left */}
            <path
              d="M40 80 L40 140 L100 170 L100 110 Z"
              fill="#3498DB"
              stroke="#2980B9"
              strokeWidth="2"
            />
            
            {/* Box Front Right */}
            <path
              d="M100 110 L100 170 L160 140 L160 80 Z"
              fill="#5DADE2"
              stroke="#3498DB"
              strokeWidth="2"
            />
            
            {/* Ribbon Vertical */}
            <path
              d="M95 50 L95 170 M105 50 L105 170"
              stroke="#F4C430"
              strokeWidth="3"
            />
            
            {/* Ribbon Horizontal on Lid */}
            <path
              d="M40 80 L100 65 L160 80"
              stroke="#F4C430"
              strokeWidth="3"
              fill="none"
            />
            
            {/* Bow */}
            <ellipse cx="85" cy="55" rx="12" ry="8" fill="#F4C430" />
            <ellipse cx="115" cy="55" rx="12" ry="8" fill="#F4C430" />
            <circle cx="100" cy="58" r="6" fill="#DAA520" />
            
            {/* Star sparkles */}
            <path d="M55 45 L57 50 L62 50 L58 54 L60 59 L55 56 L50 59 L52 54 L48 50 L53 50 Z" fill="#F4C430" />
            <path d="M140 35 L141 38 L144 38 L142 40 L143 43 L140 41 L137 43 L138 40 L136 38 L139 38 Z" fill="#F4C430" />
          </svg>
        </div>
      </div>

      {/* Primary Text */}
      <h2 className="text-xl sm:text-2xl font-semibold text-[#8B4513] mb-2">
        This wishlist is just getting started
      </h2>
      
      {/* Secondary Text */}
      <p className="text-sm sm:text-base text-[#A0522D] mb-8">
        Gifts will appear here once added.
      </p>

      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => setShowNotifyModal(true)}
          className="w-full sm:w-auto h-11 px-5 rounded-lg border-2 border-[#DAA520] text-[#8B4513] hover:bg-[#FFF8DC] font-medium text-sm"
        >
          <Bell className="w-4 h-4 mr-2 text-[#DAA520]" />
          Notify Me When Items Are Added
        </Button>
        
        <Link href={`/signup?clone=${shareId}`} className="w-full sm:w-auto">
          <Button className="w-full h-11 px-5 rounded-lg bg-gradient-to-r from-[#DAA520] to-[#F4C430] hover:from-[#F4C430] hover:to-[#DAA520] text-[#654321] font-semibold text-sm shadow-md hover:shadow-lg transition-all">
            <Gift className="w-4 h-4 mr-2" />
            Create a Similar Wishlist
          </Button>
        </Link>
      </div>

      {/* Optional Action */}
      <button
        onClick={() => setShowSuggestModal(true)}
        className="inline-flex items-center gap-1.5 text-sm text-[#DAA520] hover:text-[#B8860B] hover:underline font-medium"
      >
        <ThumbsUp className="w-4 h-4" />
        Suggest a Gift
      </button>

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
