"use client"

import { Gift } from "lucide-react"

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
      {/* Wishlist Title Section */}
      <div className="text-center py-6 sm:py-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-[#DAA520]" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#8B4513]">
            {wishlistTitle}
          </h1>
        </div>
        
        <p className="text-sm sm:text-base text-[#8B6914] mb-1">
          Shared by {sharedBy}
        </p>
        
        {description && (
          <p className="text-sm text-[#A0522D] max-w-md mx-auto px-4">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
