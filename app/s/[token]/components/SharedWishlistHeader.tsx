"use client"

import { Gift, Heart, Share2 } from "lucide-react"

interface SharedWishlistHeaderProps {
  wishlistTitle: string
  sharedBy: string
  description?: string | null
}

export function SharedWishlistHeader({
  wishlistTitle,
  sharedBy,
  description,
}: SharedWishlistHeaderProps) {
  return (
    <div className="w-full">
      {/* Wishlist Title Section - Enhanced with warm design */}
      <div className="text-center py-8 sm:py-10">
        {/* Decorative top element */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#DAA520]/50"></div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#DAA520] to-[#F4C430] flex items-center justify-center shadow-lg">
            <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#DAA520]/50"></div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#8B4513] mb-3 leading-tight tracking-tight">
          {wishlistTitle}
        </h1>
        
        {/* Shared by badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border-2 border-[#DAA520]/20 shadow-sm mb-3">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] flex items-center justify-center">
            <Heart className="w-3 h-3 text-white fill-white" />
          </div>
          <span className="text-sm font-medium text-[#8B4513]">
            Shared by <span className="font-bold text-[#654321]">{sharedBy}</span>
          </span>
          <Share2 className="w-3.5 h-3.5 text-[#DAA520]" />
        </div>
        
        {description && (
          <p className="text-sm sm:text-base text-[#A0522D] max-w-md mx-auto px-4 mt-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
